/**
 * Orders API Routes
 */

import type { PluginRouteContext } from "emdash";

import type { Order } from "../types.js";

interface OrdersRouteInput {
	action: "list" | "get" | "create";
	id?: string;
	userId?: string;
	data?: Partial<Order>;
}

export async function ordersRoute(ctx: PluginRouteContext<OrdersRouteInput>) {
	const { action, id, userId, data } = ctx.input;

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

async function listOrders(ctx: PluginRouteContext, userId?: string) {
	const result = await ctx.storage.orders.query({
		where: userId ? { user_id: userId } : undefined,
		orderBy: { created_at: "desc" },
	});

	return { items: result.items.map((r) => r.data) };
}

async function getOrder(ctx: PluginRouteContext, id: string) {
	const order = await ctx.storage.orders.get(id);
	if (!order) throw new Error("Order not found");
	return order;
}

async function createOrder(ctx: PluginRouteContext, data: Partial<Order>) {
	if (!data.user_id || !data.type || !data.item_id || !data.amount) {
		throw new Error("Missing required order fields");
	}

	const id = crypto.randomUUID();
	const now = new Date().toISOString();

	const order: Order = {
		id,
		user_id: data.user_id,
		type: data.type,
		item_id: data.item_id,
		amount: data.amount,
		currency: data.currency || "USD",
		status: "pending",
		payment_provider: data.payment_provider || "",
		metadata: data.metadata,
		created_at: now,
		updated_at: now,
	};

	await ctx.storage.orders.put(id, order);
	return order;
}
