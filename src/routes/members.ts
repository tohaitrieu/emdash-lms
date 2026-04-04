/**
 * Members API Routes
 */

import type { PluginRouteContext } from "emdash";

import type { Member } from "../types.js";

interface MembersRouteInput {
	action: "list" | "get" | "create" | "update" | "cancel";
	id?: string;
	userId?: string;
	planId?: string;
	data?: Partial<Member>;
}

export async function membersRoute(ctx: PluginRouteContext<MembersRouteInput>) {
	const { action, id, userId, planId, data } = ctx.input;

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
	ctx: PluginRouteContext,
	filters: { userId?: string; planId?: string },
) {
	const where: Record<string, string> = {};
	if (filters.userId) where.user_id = filters.userId;
	if (filters.planId) where.plan_id = filters.planId;

	const result = await ctx.storage.members.query({
		where: Object.keys(where).length > 0 ? where : undefined,
		orderBy: { created_at: "desc" },
	});

	return { items: result.items.map((r) => r.data) };
}

async function getMember(ctx: PluginRouteContext, id: string) {
	const member = await ctx.storage.members.get(id);
	if (!member) throw new Error("Member not found");
	return member;
}

async function createMember(
	ctx: PluginRouteContext,
	userId: string,
	planId: string,
	data?: Partial<Member>,
) {
	const id = crypto.randomUUID();
	const now = new Date().toISOString();

	// Check if user already has active membership
	const existing = await ctx.storage.members.query({
		where: { user_id: userId, status: "active" },
		limit: 1,
	});

	if (existing.items.length > 0) {
		throw new Error("User already has active membership");
	}

	const member: Member = {
		id,
		user_id: userId,
		plan_id: planId,
		status: "active",
		started_at: now,
		expires_at: data?.expires_at,
		payment_provider: data?.payment_provider,
		subscription_id: data?.subscription_id,
		created_at: now,
		updated_at: now,
	};

	await ctx.storage.members.put(id, member);
	return member;
}

async function updateMember(ctx: PluginRouteContext, id: string, data: Partial<Member>) {
	const existing = await ctx.storage.members.get(id);
	if (!existing) throw new Error("Member not found");

	const updated: Member = {
		...existing,
		...data,
		id,
		updated_at: new Date().toISOString(),
	};

	await ctx.storage.members.put(id, updated);
	return updated;
}

async function cancelMember(ctx: PluginRouteContext, id: string) {
	const existing = await ctx.storage.members.get(id);
	if (!existing) throw new Error("Member not found");

	const now = new Date().toISOString();
	const updated: Member = {
		...existing,
		status: "cancelled",
		cancelled_at: now,
		updated_at: now,
	};

	await ctx.storage.members.put(id, updated);
	return updated;
}
