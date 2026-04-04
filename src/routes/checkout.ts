/**
 * Checkout API Routes
 */

import type { PluginRouteContext } from "emdash";

import { getProvider } from "../providers/index.js";
import type { LmsSettings, Order, PaymentProviderConfig } from "../types.js";

interface CheckoutRouteInput {
	action: "create" | "verify";
	orderId?: string;
	sessionId?: string;
	type?: "membership" | "course";
	itemId?: string;
	providerId?: string;
}

export async function checkoutRoute(ctx: PluginRouteContext<CheckoutRouteInput>) {
	const { action, orderId, sessionId, type, itemId, providerId } = ctx.input;

	switch (action) {
		case "create":
			if (!type || !itemId || !providerId) {
				throw new Error("Type, itemId, and providerId required");
			}
			return createCheckout(ctx, type, itemId, providerId);
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
	ctx: PluginRouteContext,
	type: "membership" | "course",
	itemId: string,
	providerId: string,
) {
	// Get settings
	const settings = (await ctx.kv.get("settings")) as LmsSettings | null;
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
	let currency = settings.currency;

	if (type === "membership") {
		const plan = await ctx.storage.plans.get(itemId);
		if (!plan) throw new Error("Plan not found");
		amount = plan.price;
	} else {
		// For courses, we'd query the content API
		// For now, get from enrollments storage or assume price is passed
		throw new Error("Course checkout not yet implemented");
	}

	// Get current user
	const userId = ctx.requestMeta.user?.id;
	if (!userId) {
		throw new Error("Authentication required");
	}

	// Create order
	const orderId = crypto.randomUUID();
	const now = new Date().toISOString();

	const order: Order = {
		id: orderId,
		user_id: userId,
		type,
		item_id: itemId,
		amount,
		currency,
		status: "pending",
		payment_provider: providerId,
		created_at: now,
		updated_at: now,
	};

	await ctx.storage.orders.put(orderId, order);

	// Create checkout session with provider
	const session = await provider.createCheckout(order, providerConfig);

	// Update order with payment ID
	order.payment_id = session.id;
	await ctx.storage.orders.put(orderId, order);

	return {
		orderId,
		checkoutUrl: session.url,
		expiresAt: session.expires_at,
	};
}

async function verifyCheckout(ctx: PluginRouteContext, sessionId: string, providerId: string) {
	// Get settings
	const settings = (await ctx.kv.get("settings")) as LmsSettings | null;
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
