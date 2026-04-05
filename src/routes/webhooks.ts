/**
 * Payment Webhook Routes
 */

import type { PluginContext } from "emdash";

import { getProvider } from "../providers/index.js";
import type { LmsSettings, Member, Order } from "../types.js";

interface WebhookRouteInput {
	providerId: string;
	payload: unknown;
	headers: Record<string, string>;
}

export async function webhooksRoute(ctx: PluginContext, input: WebhookRouteInput) {
	const { providerId, payload, headers } = input;

	if (!ctx.content) throw new Error("Content access not available");

	// Get settings
	const settings = (await ctx.kv?.get("settings")) as LmsSettings | null;
	if (!settings) {
		throw new Error("LMS not configured");
	}

	// Get provider config
	const providerConfig = settings.payment_providers.find((p) => p.id === providerId);
	if (!providerConfig) {
		throw new Error(`Provider ${providerId} not configured`);
	}

	// Get provider adapter
	const provider = getProvider(providerId);
	if (!provider) {
		throw new Error(`Provider ${providerId} not found`);
	}

	// Process webhook
	const result = await provider.handleWebhook(payload, headers, providerConfig);

	ctx.log?.info("Webhook processed", { providerId, event: result.event });

	// Handle different webhook events
	switch (result.event) {
		case "payment.completed":
			if (result.orderId) {
				await handlePaymentCompleted(ctx, result.orderId, result.subscriptionId);
			}
			break;

		case "payment.failed":
			if (result.orderId) {
				await handlePaymentFailed(ctx, result.orderId);
			}
			break;

		case "subscription.cancelled":
			if (result.subscriptionId) {
				await handleSubscriptionCancelled(ctx, result.subscriptionId);
			}
			break;
	}

	return { received: true };
}

async function handlePaymentCompleted(
	ctx: PluginContext,
	orderId: string,
	subscriptionId?: string,
) {
	if (!ctx.content?.update) throw new Error("Content write access not available");

	const orderItem = await ctx.content.get("orders", orderId);
	if (!orderItem) {
		ctx.log?.warn("Order not found for completed payment", { orderId });
		return;
	}

	const order = { id: orderItem.id, ...orderItem.data } as Order;

	// Update order status
	await ctx.content.update("orders", orderId, {
		status: "completed",
	});

	// Fulfill the order
	if (order.type === "membership") {
		await createMembership(ctx, order, subscriptionId);
	} else if (order.type === "course") {
		await createEnrollment(ctx, order);
	}

	ctx.log?.info("Payment completed and fulfilled", { orderId, type: order.type });
}

async function handlePaymentFailed(ctx: PluginContext, orderId: string) {
	if (!ctx.content?.update) return;

	const orderItem = await ctx.content.get("orders", orderId);
	if (!orderItem) return;

	await ctx.content.update("orders", orderId, {
		status: "failed",
	});

	ctx.log?.warn("Payment failed", { orderId });
}

async function handleSubscriptionCancelled(ctx: PluginContext, subscriptionId: string) {
	if (!ctx.content?.update) return;

	// Find member by subscription ID
	const membersResult = await ctx.content.list("memberships", {});
	const matchingMembers = membersResult.items.filter(
		(item) => (item.data as Record<string, unknown>).subscription_id === subscriptionId,
	);

	const memberItem = matchingMembers[0];
	if (!memberItem) {
		ctx.log?.warn("Member not found for cancelled subscription", { subscriptionId });
		return;
	}

	const member = { id: memberItem.id, ...memberItem.data } as Member;
	const now = new Date().toISOString();

	await ctx.content.update("memberships", member.id, {
		status: "cancelled",
		cancelled_at: now,
	});

	ctx.log?.info("Subscription cancelled", { subscriptionId, memberId: member.id });
}

async function createMembership(ctx: PluginContext, order: Order, subscriptionId?: string) {
	if (!ctx.content?.create) return;

	const planItem = await ctx.content.get("membership_plans", order.item_id);
	if (!planItem) {
		ctx.log?.error("Plan not found for membership creation", { planId: order.item_id });
		return;
	}

	const plan = planItem.data as Record<string, unknown>;
	const now = new Date().toISOString();
	const expiresAt = calculateExpiry(plan.billing_period as string);

	const memberData = {
		user_id: order.user_id,
		plan_id: order.item_id,
		status: "active",
		started_at: now,
		expires_at: expiresAt,
		payment_provider: order.payment_provider,
		subscription_id: subscriptionId,
	};

	const memberItem = await ctx.content.create("memberships", memberData);
	ctx.log?.info("Membership created", { memberId: memberItem.id, planId: plan.id });
}

async function createEnrollment(ctx: PluginContext, order: Order) {
	if (!ctx.content?.create) return;

	const enrollmentData = {
		user_id: order.user_id,
		course_id: order.item_id,
		source: "purchase",
		order_id: order.id,
		progress: 0,
	};

	const enrollmentItem = await ctx.content.create("enrollments", enrollmentData);
	ctx.log?.info("Enrollment created", { enrollmentId: enrollmentItem.id, courseId: order.item_id });
}

function calculateExpiry(billingPeriod: string): string | undefined {
	if (billingPeriod === "lifetime") return undefined;

	const now = new Date();
	switch (billingPeriod) {
		case "monthly":
			now.setMonth(now.getMonth() + 1);
			break;
		case "quarterly":
			now.setMonth(now.getMonth() + 3);
			break;
		case "yearly":
			now.setFullYear(now.getFullYear() + 1);
			break;
	}
	return now.toISOString();
}
