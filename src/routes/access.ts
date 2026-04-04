/**
 * Access Control API Routes
 */

import type { PluginRouteContext } from "emdash";

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

export async function accessRoute(ctx: PluginRouteContext<AccessRouteInput>) {
	const { action, courseId, lessonId, userId } = ctx.input;

	// Get current user ID
	const currentUserId = userId || ctx.requestMeta.user?.id;
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
	ctx: PluginRouteContext,
	userId: string,
	courseId: string,
) {
	const [course, userAccess, plans] = await Promise.all([
		getCourse(ctx, courseId),
		buildUserAccessFromStorage(ctx, userId),
		getPlans(ctx),
	]);

	if (!course) {
		throw new Error("Course not found");
	}

	return checkCourseAccess(course, userAccess, plans);
}

async function checkLessonAccessRoute(
	ctx: PluginRouteContext,
	userId: string,
	courseId: string,
	lessonId: string,
) {
	const [course, lesson, userAccess, plans] = await Promise.all([
		getCourse(ctx, courseId),
		getLesson(ctx, lessonId),
		buildUserAccessFromStorage(ctx, userId),
		getPlans(ctx),
	]);

	if (!course) throw new Error("Course not found");
	if (!lesson) throw new Error("Lesson not found");

	return checkLessonAccess(lesson, course, userAccess, plans);
}

async function listAccessibleCourses(ctx: PluginRouteContext, userId: string) {
	const [courses, userAccess, plans] = await Promise.all([
		getAllCourses(ctx),
		buildUserAccessFromStorage(ctx, userId),
		getPlans(ctx),
	]);

	const accessible = filterAccessibleCourses(courses, userAccess, plans);
	return { items: accessible };
}

async function getUserAccess(ctx: PluginRouteContext, userId: string) {
	const userAccess = await buildUserAccessFromStorage(ctx, userId);
	return userAccess;
}

// Helper functions

async function buildUserAccessFromStorage(ctx: PluginRouteContext, userId: string) {
	// Get active membership
	const membersResult = await ctx.storage.members.query({
		where: { user_id: userId, status: "active" },
		limit: 1,
	});
	const membership = (membersResult.items[0]?.data as Member) || null;

	// Get enrollments
	const enrollmentsResult = await ctx.storage.enrollments.query({
		where: { user_id: userId },
	});
	const enrollments = enrollmentsResult.items.map((r) => r.data as CourseEnrollment);

	return buildUserAccess(userId, membership, enrollments);
}

async function getPlans(ctx: PluginRouteContext): Promise<MembershipPlan[]> {
	const result = await ctx.storage.plans.query({
		where: { status: "published" },
	});
	return result.items.map((r) => r.data as MembershipPlan);
}

async function getCourse(ctx: PluginRouteContext, courseId: string): Promise<Course | null> {
	// Courses are stored as EmDash content, query via content API
	// For now, return from local storage if we sync courses there
	const course = await ctx.storage.courses?.get(courseId);
	return (course as Course) || null;
}

async function getLesson(ctx: PluginRouteContext, lessonId: string): Promise<Lesson | null> {
	const lesson = await ctx.storage.lessons?.get(lessonId);
	return (lesson as Lesson) || null;
}

async function getAllCourses(ctx: PluginRouteContext): Promise<Course[]> {
	const result = await ctx.storage.courses?.query({
		where: { status: "published" },
	});
	return (result?.items.map((r) => r.data) as Course[]) || [];
}
