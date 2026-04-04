/**
 * Membership Plans API Routes
 */

import type { PluginRouteContext } from "emdash";

import type { MembershipPlan } from "../types.js";

interface PlansRouteInput {
	action: "list" | "get" | "create" | "update" | "delete";
	id?: string;
	data?: Partial<MembershipPlan>;
}

export async function plansRoute(ctx: PluginRouteContext<PlansRouteInput>) {
	const { action, id, data } = ctx.input;

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

async function listPlans(ctx: PluginRouteContext) {
	const result = await ctx.storage.plans.query({
		orderBy: { sort_order: "asc" },
	});
	return { items: result.items.map((r) => r.data) };
}

async function getPlan(ctx: PluginRouteContext, id: string) {
	const plan = await ctx.storage.plans.get(id);
	if (!plan) throw new Error("Plan not found");
	return plan;
}

async function createPlan(ctx: PluginRouteContext, data: Partial<MembershipPlan>) {
	const id = crypto.randomUUID();
	const now = new Date().toISOString();

	const plan: MembershipPlan = {
		id,
		slug: data.slug || id,
		name: data.name || "New Plan",
		description: data.description,
		price: data.price || 0,
		billing_period: data.billing_period || "monthly",
		features: data.features || [],
		limits: data.limits || {},
		sort_order: data.sort_order || 0,
		status: data.status || "draft",
		created_at: now,
		updated_at: now,
	};

	await ctx.storage.plans.put(id, plan);
	return plan;
}

async function updatePlan(ctx: PluginRouteContext, id: string, data: Partial<MembershipPlan>) {
	const existing = await ctx.storage.plans.get(id);
	if (!existing) throw new Error("Plan not found");

	const updated: MembershipPlan = {
		...existing,
		...data,
		id,
		updated_at: new Date().toISOString(),
	};

	await ctx.storage.plans.put(id, updated);
	return updated;
}

async function deletePlan(ctx: PluginRouteContext, id: string) {
	const deleted = await ctx.storage.plans.delete(id);
	return { deleted };
}
