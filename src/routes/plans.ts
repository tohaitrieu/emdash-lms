/**
 * Membership Plans API Routes
 */

import type { PluginContext } from "emdash";

import type { MembershipPlan } from "../types.js";

const COLLECTION = "membership_plans";

interface PlansRouteInput {
	action: "list" | "get" | "create" | "update" | "delete";
	id?: string;
	data?: Partial<MembershipPlan>;
}

export async function plansRoute(ctx: PluginContext, input: PlansRouteInput) {
	const { action, id, data } = input;

	if (!ctx.content) throw new Error("Content access not available");

	switch (action) {
		case "list":
			return listPlans(ctx);
		case "get":
			if (!id) throw new Error("Plan ID required");
			return getPlan(ctx, id);
		case "create":
			if (!data) throw new Error("Plan data required");
			return createPlan(ctx, data);
		case "update":
			if (!id || !data) throw new Error("Plan ID and data required");
			return updatePlan(ctx, id, data);
		case "delete":
			if (!id) throw new Error("Plan ID required");
			return deletePlan(ctx, id);
		default:
			throw new Error(`Unknown action: ${action}`);
	}
}

async function listPlans(ctx: PluginContext) {
	const result = await ctx.content!.list(COLLECTION, {
		orderBy: { sort_order: "asc" },
	});
	return { items: result.items.map((item) => ({ id: item.id, ...item.data })) };
}

async function getPlan(ctx: PluginContext, id: string) {
	const item = await ctx.content!.get(COLLECTION, id);
	if (!item) throw new Error("Plan not found");
	return { id: item.id, ...item.data };
}

async function createPlan(ctx: PluginContext, data: Partial<MembershipPlan>) {
	if (!ctx.content?.create) throw new Error("Content write access not available");
	const item = await ctx.content.create(COLLECTION, data as Record<string, unknown>);
	return { id: item.id, ...item.data };
}

async function updatePlan(ctx: PluginContext, id: string, data: Partial<MembershipPlan>) {
	if (!ctx.content?.update) throw new Error("Content write access not available");
	const item = await ctx.content.update(COLLECTION, id, data as Record<string, unknown>);
	return { id: item.id, ...item.data };
}

async function deletePlan(ctx: PluginContext, id: string) {
	if (!ctx.content?.delete) throw new Error("Content write access not available");
	const deleted = await ctx.content.delete(COLLECTION, id);
	return { deleted };
}
