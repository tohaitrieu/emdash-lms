/**
 * Access Control API Routes
 */

import type { PluginContext } from "emdash";

import {
	buildUserAccess,
	checkCourseAccess,
	checkLessonAccess,
	filterAccessibleCourses,
} from "../access-control.js";
import type { Course, CourseEnrollment, Lesson, Member, MembershipPlan } from "../types.js";

interface AccessRouteInput {
	action: "check-course" | "check-lesson" | "list-accessible" | "user-access";
	courseId?: string;
	lessonId?: string;
	userId?: string;
}

export async function accessRoute(ctx: PluginContext, input: AccessRouteInput, requestMeta?: { user?: { id?: string } }) {
	const { action, courseId, lessonId, userId } = input;

	if (!ctx.content) throw new Error("Content access not available");

	// Get current user ID
	const currentUserId = userId || requestMeta?.user?.id;
	if (!currentUserId) {
		throw new Error("User ID required");
	}

	switch (action) {
		case "check-course":
			if (!courseId) throw new Error("Course ID required");
			return checkCourseAccessRoute(ctx, currentUserId, courseId);

		case "check-lesson":
			if (!courseId || !lessonId) throw new Error("Course ID and Lesson ID required");
			return checkLessonAccessRoute(ctx, currentUserId, courseId, lessonId);

		case "list-accessible":
			return listAccessibleCourses(ctx, currentUserId);

		case "user-access":
			return getUserAccess(ctx, currentUserId);

		default:
			throw new Error(`Unknown action: ${action}`);
	}
}

async function checkCourseAccessRoute(
	ctx: PluginContext,
	userId: string,
	courseId: string,
) {
	const [course, userAccess, plans] = await Promise.all([
		getCourse(ctx, courseId),
		buildUserAccessFromContent(ctx, userId),
		getPlans(ctx),
	]);

	if (!course) {
		throw new Error("Course not found");
	}

	return checkCourseAccess(course, userAccess, plans);
}

async function checkLessonAccessRoute(
	ctx: PluginContext,
	userId: string,
	courseId: string,
	lessonId: string,
) {
	const [course, lesson, userAccess, plans] = await Promise.all([
		getCourse(ctx, courseId),
		getLesson(ctx, lessonId),
		buildUserAccessFromContent(ctx, userId),
		getPlans(ctx),
	]);

	if (!course) throw new Error("Course not found");
	if (!lesson) throw new Error("Lesson not found");

	return checkLessonAccess(lesson, course, userAccess, plans);
}

async function listAccessibleCourses(ctx: PluginContext, userId: string) {
	const [courses, userAccess, plans] = await Promise.all([
		getAllCourses(ctx),
		buildUserAccessFromContent(ctx, userId),
		getPlans(ctx),
	]);

	const accessible = filterAccessibleCourses(courses, userAccess, plans);
	return { items: accessible };
}

async function getUserAccess(ctx: PluginContext, userId: string) {
	const userAccess = await buildUserAccessFromContent(ctx, userId);
	return userAccess;
}

// Helper functions

async function buildUserAccessFromContent(ctx: PluginContext, userId: string) {
	// Get active membership
	const membersResult = await ctx.content!.list("memberships", {});
	const activeMembers = membersResult.items.filter(
		(item) =>
			(item.data as Record<string, unknown>).user_id === userId &&
			(item.data as Record<string, unknown>).status === "active",
	);
	const memberItem = activeMembers[0];
	const membership = memberItem ? ({ id: memberItem.id, ...memberItem.data } as Member) : null;

	// Get enrollments
	const enrollmentsResult = await ctx.content!.list("enrollments", {});
	const userEnrollments = enrollmentsResult.items.filter(
		(item) => (item.data as Record<string, unknown>).user_id === userId,
	);
	const enrollments = userEnrollments.map((item) => ({
		id: item.id,
		...item.data,
	})) as CourseEnrollment[];

	return buildUserAccess(userId, membership, enrollments);
}

async function getPlans(ctx: PluginContext): Promise<MembershipPlan[]> {
	const result = await ctx.content!.list("membership_plans", {});
	const publishedPlans = result.items.filter(
		(item) => (item.data as Record<string, unknown>).status === "published",
	);
	return publishedPlans.map((item) => ({ id: item.id, ...item.data })) as MembershipPlan[];
}

async function getCourse(ctx: PluginContext, courseId: string): Promise<Course | null> {
	const item = await ctx.content!.get("courses", courseId);
	if (!item) return null;
	return { id: item.id, ...item.data } as Course;
}

async function getLesson(ctx: PluginContext, lessonId: string): Promise<Lesson | null> {
	const item = await ctx.content!.get("lessons", lessonId);
	if (!item) return null;
	return { id: item.id, ...item.data } as Lesson;
}

async function getAllCourses(ctx: PluginContext): Promise<Course[]> {
	const result = await ctx.content!.list("courses", {});
	const publishedCourses = result.items.filter(
		(item) => (item.data as Record<string, unknown>).status === "published",
	);
	return publishedCourses.map((item) => ({ id: item.id, ...item.data })) as Course[];
}
