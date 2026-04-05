/**
 * Checkout API Routes
 */

import type { PluginContext } from "emdash";

import { getProvider } from "../providers/index.js";
import type { LmsSettings, Order } from "../types.js";

interface CheckoutRouteInput {
	action: "create" | "verify";
	orderId?: string;
	sessionId?: string;
	type?: "membership" | "course";
	itemId?: string;
	providerId?: string;
}

export async function checkoutRoute(
	ctx: PluginContext,
	input: CheckoutRouteInput,
	requestMeta?: { user?: { id?: string } },
) {
	const { action, sessionId, type, itemId, providerId } = input;

	if (!ctx.content) throw new Error("Content access not available");

	switch (action) {
		case "create":
			if (!type || !itemId || !providerId) {
				throw new Error("Type, itemId, and providerId required");
			}
			return createCheckout(ctx, type, itemId, providerId, requestMeta);
		case "verify":
			if (!sessionId || !providerId) {
				throw new Error("Session ID and provider ID required");
			}
			return verifyCheckout(ctx, sessionId, providerId);
		default:
			throw new Error(`Unknown action: ${action}`);
	}
}

async function createCheckout(
	ctx: PluginContext,
	type: "membership" | "course",
	itemId: string,
	providerId: string,
	requestMeta?: { user?: { id?: string } },
) {
	if (!ctx.content?.create) throw new Error("Content write access not available");

	// Get settings
	const settings = (await ctx.kv?.get("settings")) as LmsSettings | null;
	if (!settings?.checkout_enabled) {
		throw new Error("Checkout is disabled");
	}

	// Get provider config
	const providerConfig = settings.payment_providers.find((p) => p.id === providerId);
	if (!providerConfig?.enabled) {
		throw new Error(`Payment provider ${providerId} is not enabled`);
	}

	// Get provider adapter
	const provider = getProvider(providerId);
	if (!provider) {
		throw new Error(`Payment provider ${providerId} not found`);
	}

	// Get item details and price
	let amount: number;
	const currency = settings.currency;

	if (type === "membership") {
		const planItem = await ctx.content.get("membership_plans", itemId);
		if (!planItem) throw new Error("Plan not found");
		const planData = planItem.data as Record<string, unknown>;
		amount = planData.price as number;
	} else {
		// For courses, query the courses collection
		const courseItem = await ctx.content.get("courses", itemId);
		if (!courseItem) throw new Error("Course not found");
		const courseData = courseItem.data as Record<string, unknown>;
		if (!courseData.is_purchasable) throw new Error("Course is not available for purchase");
		amount = courseData.price as number;
	}

	// Get current user
	const userId = requestMeta?.user?.id;
	if (!userId) {
		throw new Error("Authentication required");
	}

	// Create order
	const orderData = {
		user_id: userId,
		type,
		item_id: itemId,
		amount,
		currency,
		status: "pending",
		payment_provider: providerId,
	};

	const orderItem = await ctx.content.create("orders", orderData);
	const orderId = orderItem.id;

	// Create checkout session with provider
	const order: Order = { id: orderId, ...orderData } as Order;
	const session = await provider.createCheckout(order, providerConfig);

	// Update order with payment ID
	await ctx.content.update!("orders", orderId, { payment_id: session.id });

	return {
		orderId,
		checkoutUrl: session.url,
		expiresAt: session.expires_at,
	};
}

async function verifyCheckout(ctx: PluginContext, sessionId: string, providerId: string) {
	// Get settings
	const settings = (await ctx.kv?.get("settings")) as LmsSettings | null;
	if (!settings) {
		throw new Error("LMS not configured");
	}

	// Get provider
	const providerConfig = settings.payment_providers.find((p) => p.id === providerId);
	if (!providerConfig) {
		throw new Error(`Provider ${providerId} not found`);
	}

	const provider = getProvider(providerId);
	if (!provider) {
		throw new Error(`Provider ${providerId} not found`);
	}

	// Verify payment status
	const status = await provider.verifyPayment(sessionId, providerConfig);

	return {
		paid: status.paid,
		status: status.status,
	};
}
