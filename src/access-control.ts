/**
 * LMS Access Control
 *
 * Determines if a user can access a course based on:
 * - Course access_level (free, membership, purchase)
 * - User's active membership and plan limits
 * - Individual course purchases
 * - Lesson preview flag
 */

import type {
	AccessCheckResult,
	Course,
	CourseEnrollment,
	Lesson,
	Member,
	MembershipPlan,
	PlanLimits,
	UserAccess,
} from "./types.js";

/**
 * Check if user can access a course
 */
export function checkCourseAccess(
	course: Course,
	userAccess: UserAccess,
	plans: MembershipPlan[],
): AccessCheckResult {
	// Free courses are always accessible
	if (course.access_level === "free") {
		return { allowed: true, reason: "free" };
	}

	// Check if user purchased this course individually
	if (userAccess.purchasedCourseIds.includes(course.id)) {
		return { allowed: true, reason: "purchased" };
	}

	// For membership-gated courses
	if (course.access_level === "membership") {
		const membership = userAccess.activeMembership;

		if (!membership) {
			return { allowed: false, deniedReason: "no_membership" };
		}

		// Check if membership is active and not expired
		if (membership.status !== "active") {
			return { allowed: false, deniedReason: "expired" };
		}

		if (membership.expires_at && new Date(membership.expires_at) < new Date()) {
			return { allowed: false, deniedReason: "expired" };
		}

		// Check if user's plan grants access to this course
		const plan = plans.find((p) => p.id === membership.plan_id);
		if (!plan) {
			return { allowed: false, deniedReason: "wrong_plan" };
		}

		if (hasAccessToCourse(course, plan.limits)) {
			return { allowed: true, reason: "membership" };
		}

		// Check required_plan_ids if specified on course
		if (course.required_plan_ids?.length) {
			if (course.required_plan_ids.includes(membership.plan_id)) {
				return { allowed: true, reason: "membership" };
			}
			return { allowed: false, deniedReason: "wrong_plan" };
		}

		return { allowed: false, deniedReason: "wrong_plan" };
	}

	// Purchase-only courses
	if (course.access_level === "purchase") {
		return { allowed: false, deniedReason: "not_purchased" };
	}

	return { allowed: false, deniedReason: "not_purchased" };
}

/**
 * Check if user can access a lesson
 */
export function checkLessonAccess(
	lesson: Lesson,
	course: Course,
	userAccess: UserAccess,
	plans: MembershipPlan[],
): AccessCheckResult {
	// Preview lessons are always accessible
	if (lesson.is_preview) {
		return { allowed: true, reason: "preview" };
	}

	// Otherwise, check course-level access
	return checkCourseAccess(course, userAccess, plans);
}

/**
 * Check if plan limits grant access to a course
 */
function hasAccessToCourse(course: Course, limits: PlanLimits): boolean {
	const courseAccess = limits.courses;

	if (!courseAccess) return false;

	// "all" grants access to everything
	if (courseAccess === "all") return true;

	// "free_only" only grants access to free courses
	if (courseAccess === "free_only") {
		return course.access_level === "free";
	}

	// "basic" grants access to free + basic courses (not advanced/premium)
	if (courseAccess === "basic") {
		return course.access_level === "free" || course.difficulty !== "advanced";
	}

	// Array of specific course IDs
	if (Array.isArray(courseAccess)) {
		return courseAccess.includes(course.id);
	}

	return false;
}

/**
 * Build UserAccess object from database records
 */
export function buildUserAccess(
	userId: string,
	membership: Member | null,
	enrollments: CourseEnrollment[],
): UserAccess {
	const purchasedCourseIds = enrollments
		.filter((e) => e.source === "purchase")
		.map((e) => e.course_id);

	return {
		userId,
		activeMembership: membership ?? undefined,
		purchasedCourseIds,
	};
}

/**
 * Get accessible courses for a user
 */
export function filterAccessibleCourses(
	courses: Course[],
	userAccess: UserAccess,
	plans: MembershipPlan[],
): Course[] {
	return courses.filter((course) => {
		const result = checkCourseAccess(course, userAccess, plans);
		return result.allowed;
	});
}

/**
 * Get courses with access info for display
 */
export function getCoursesWithAccess(
	courses: Course[],
	userAccess: UserAccess,
	plans: MembershipPlan[],
): Array<{ course: Course; access: AccessCheckResult }> {
	return courses.map((course) => ({
		course,
		access: checkCourseAccess(course, userAccess, plans),
	}));
}
