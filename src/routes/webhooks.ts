/**
 * Payment Webhook Routes
 */

import type { PluginRouteContext } from "emdash";

import { getProvider } from "../providers/index.js";
import type { LmsSettings, Member, Order } from "../types.js";

interface WebhookRouteInput {
	providerId: string;
	payload: unknown;
	headers: Record<string, string>;
}

export async function webhooksRoute(ctx: PluginRouteContext<WebhookRouteInput>) {
	const { providerId, payload, headers } = ctx.input;

	// Get settings
	const settings = (await ctx.kv.get("settings")) as LmsSettings | null;
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

	ctx.log.info("Webhook processed", { providerId, event: result.event });

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
	ctx: PluginRouteContext,
	orderId: string,
	subscriptionId?: string,
) {
	const order = await ctx.storage.orders.get(orderId);
	if (!order) {
		ctx.log.warn("Order not found for completed payment", { orderId });
		return;
	}

	// Update order status
	const updatedOrder: Order = {
		...order,
		status: "completed",
		updated_at: new Date().toISOString(),
	};
	await ctx.storage.orders.put(orderId, updatedOrder);

	// Fulfill the order
	if (order.type === "membership") {
		await createMembership(ctx, order, subscriptionId);
	} else if (order.type === "course") {
		await createEnrollment(ctx, order);
	}

	ctx.log.info("Payment completed and fulfilled", { orderId, type: order.type });
}

async function handlePaymentFailed(ctx: PluginRouteContext, orderId: string) {
	const order = await ctx.storage.orders.get(orderId);
	if (!order) return;

	const updatedOrder: Order = {
		...order,
		status: "failed",
		updated_at: new Date().toISOString(),
	};
	await ctx.storage.orders.put(orderId, updatedOrder);

	ctx.log.warn("Payment failed", { orderId });
}

async function handleSubscriptionCancelled(ctx: PluginRouteContext, subscriptionId: string) {
	// Find member by subscription ID
	const members = await ctx.storage.members.query({
		where: { subscription_id: subscriptionId },
		limit: 1,
	});

	const member = members.items[0]?.data;
	if (!member) {
		ctx.log.warn("Member not found for cancelled subscription", { subscriptionId });
		return;
	}

	const now = new Date().toISOString();
	const updatedMember: Member = {
		...member,
		status: "cancelled",
		cancelled_at: now,
		updated_at: now,
	};
	await ctx.storage.members.put(member.id, updatedMember);

	ctx.log.info("Subscription cancelled", { subscriptionId, memberId: member.id });
}

async function createMembership(ctx: PluginRouteContext, order: Order, subscriptionId?: string) {
	const plan = await ctx.storage.plans.get(order.item_id);
	if (!plan) {
		ctx.log.error("Plan not found for membership creation", { planId: order.item_id });
		return;
	}

	const now = new Date().toISOString();
	const expiresAt = calculateExpiry(plan.billing_period);

	const member: Member = {
		id: crypto.randomUUID(),
		user_id: order.user_id,
		plan_id: order.item_id,
		status: "active",
		started_at: now,
		expires_at: expiresAt,
		payment_provider: order.payment_provider,
		subscription_id: subscriptionId,
		created_at: now,
		updated_at: now,
	};

	await ctx.storage.members.put(member.id, member);
	ctx.log.info("Membership created", { memberId: member.id, planId: plan.id });
}

async function createEnrollment(ctx: PluginRouteContext, order: Order) {
	const enrollment = {
		id: crypto.randomUUID(),
		user_id: order.user_id,
		course_id: order.item_id,
		source: "purchase" as const,
		order_id: order.id,
		progress: 0,
		created_at: new Date().toISOString(),
		updated_at: new Date().toISOString(),
	};

	await ctx.storage.enrollments.put(enrollment.id, enrollment);
	ctx.log.info("Enrollment created", { enrollmentId: enrollment.id, courseId: order.item_id });
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
