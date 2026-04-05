/**
 * Orders API Routes
 */

import type { PluginContext } from "emdash";

import type { Order } from "../types.js";

const COLLECTION = "orders";

interface OrdersRouteInput {
	action: "list" | "get" | "create";
	id?: string;
	userId?: string;
	data?: Partial<Order>;
}

export async function ordersRoute(ctx: PluginContext, input: OrdersRouteInput) {
	const { action, id, userId, data } = input;

	if (!ctx.content) throw new Error("Content access not available");

	switch (action) {
		case "list":
			return listOrders(ctx, userId);
		case "get":
			if (!id) throw new Error("Order ID required");
			return getOrder(ctx, id);
		case "create":
			if (!data) throw new Error("Order data required");
			return createOrder(ctx, data);
		default:
			throw new Error(`Unknown action: ${action}`);
	}
}

async function listOrders(ctx: PluginContext, userId?: string) {
	const result = await ctx.content!.list(COLLECTION, {
		orderBy: { created_at: "desc" },
	});

	let items = result.items.map((item) => ({ id: item.id, ...item.data }));

	if (userId) {
		items = items.filter((item) => (item as Record<string, unknown>).user_id === userId);
	}

	return { items };
}

async function getOrder(ctx: PluginContext, id: string) {
	const item = await ctx.content!.get(COLLECTION, id);
	if (!item) throw new Error("Order not found");
	return { id: item.id, ...item.data };
}

async function createOrder(ctx: PluginContext, data: Partial<Order>) {
	if (!ctx.content?.create) throw new Error("Content write access not available");

	if (!data.user_id || !data.type || !data.item_id || !data.amount) {
		throw new Error("Missing required order fields");
	}

	const orderData = {
		user_id: data.user_id,
		type: data.type,
		item_id: data.item_id,
		amount: data.amount,
		currency: data.currency || "USD",
		status: "pending",
		payment_provider: data.payment_provider || "",
		metadata: data.metadata,
	};

	const item = await ctx.content.create(COLLECTION, orderData as Record<string, unknown>);
	return { id: item.id, ...item.data };
}
