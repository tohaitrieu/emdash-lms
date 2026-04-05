/**
 * Members API Routes
 */

import type { PluginContext } from "emdash";

import type { Member } from "../types.js";

const COLLECTION = "memberships";

interface MembersRouteInput {
	action: "list" | "get" | "create" | "update" | "cancel";
	id?: string;
	userId?: string;
	planId?: string;
	data?: Partial<Member>;
}

export async function membersRoute(ctx: PluginContext, input: MembersRouteInput) {
	const { action, id, userId, planId, data } = input;

	if (!ctx.content) throw new Error("Content access not available");

	switch (action) {
		case "list":
			return listMembers(ctx, { userId, planId });
		case "get":
			if (!id) throw new Error("Member ID required");
			return getMember(ctx, id);
		case "create":
			if (!userId || !planId) throw new Error("User ID and Plan ID required");
			return createMember(ctx, userId, planId, data);
		case "update":
			if (!id || !data) throw new Error("Member ID and data required");
			return updateMember(ctx, id, data);
		case "cancel":
			if (!id) throw new Error("Member ID required");
			return cancelMember(ctx, id);
		default:
			throw new Error(`Unknown action: ${action}`);
	}
}

async function listMembers(
	ctx: PluginContext,
	filters: { userId?: string; planId?: string },
) {
	const result = await ctx.content!.list(COLLECTION, {
		orderBy: { created_at: "desc" },
	});

	let items = result.items.map((item) => ({ id: item.id, ...item.data }));

	// Filter in memory (TODO: extend emdash content API to support where clause)
	if (filters.userId) {
		items = items.filter((item) => (item as Record<string, unknown>).user_id === filters.userId);
	}
	if (filters.planId) {
		items = items.filter((item) => (item as Record<string, unknown>).plan_id === filters.planId);
	}

	return { items };
}

async function getMember(ctx: PluginContext, id: string) {
	const item = await ctx.content!.get(COLLECTION, id);
	if (!item) throw new Error("Member not found");
	return { id: item.id, ...item.data };
}

async function createMember(
	ctx: PluginContext,
	userId: string,
	planId: string,
	data?: Partial<Member>,
) {
	if (!ctx.content?.create) throw new Error("Content write access not available");

	// Check if user already has active membership
	const existingResult = await ctx.content.list(COLLECTION, {
		limit: 100,
	});
	const existing = {
		items: existingResult.items.filter(
			(item) =>
				(item.data as Record<string, unknown>).user_id === userId &&
				(item.data as Record<string, unknown>).status === "active",
		),
	};

	if (existing.items.length > 0) {
		throw new Error("User already has active membership");
	}

	const now = new Date().toISOString();
	const memberData = {
		user_id: userId,
		plan_id: planId,
		status: "active",
		started_at: now,
		expires_at: data?.expires_at,
		payment_provider: data?.payment_provider,
		subscription_id: data?.subscription_id,
	};

	const item = await ctx.content.create(COLLECTION, memberData);
	return { id: item.id, ...item.data };
}

async function updateMember(ctx: PluginContext, id: string, data: Partial<Member>) {
	if (!ctx.content?.update) throw new Error("Content write access not available");

	const existing = await ctx.content.get(COLLECTION, id);
	if (!existing) throw new Error("Member not found");

	const item = await ctx.content.update(COLLECTION, id, data as Record<string, unknown>);
	return { id: item.id, ...item.data };
}

async function cancelMember(ctx: PluginContext, id: string) {
	if (!ctx.content?.update) throw new Error("Content write access not available");

	const existing = await ctx.content.get(COLLECTION, id);
	if (!existing) throw new Error("Member not found");

	const now = new Date().toISOString();
	const item = await ctx.content.update(COLLECTION, id, {
		status: "cancelled",
		cancelled_at: now,
	});

	return { id: item.id, ...item.data };
}
