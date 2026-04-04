/**
 * EmDash LMS Plugin Types
 *
 * Re-exports types from shared package (auto-generated from Supabase schema)
 * and adds plugin-specific configuration types.
 */

// =============================================================================
// Plugin Configuration (not in DB)
// =============================================================================

export type LmsMode = "membership" | "lms" | "full";

export interface LmsOptions {
	/** Plugin mode: membership-only, lms-only, or full */
	mode?: LmsMode;
	/** Enable checkout functionality */
	checkout?: boolean;
	/** Default currency (ISO 4217) */
	currency?: string;
}

// =============================================================================
// Plan Limits (stored as JSONB in membership_plans.limits)
// =============================================================================

export interface PlanLimits {
	courses?: "free_only" | "basic" | "all" | string[];
	downloads?: boolean;
	certificates?: boolean;
	[key: string]: unknown;
}

// =============================================================================
// Lesson Resource (stored as JSONB in lessons.resources)
// =============================================================================

export interface LessonResource {
	type: "pdf" | "link" | "download" | "code" | "video";
	title: string;
	url: string;
	description?: string;
}

// =============================================================================
// SEO Meta (stored as JSONB)
// =============================================================================

export interface SeoMeta {
	title?: string;
	description?: string;
	keywords?: string[];
	og_image?: string;
}

// =============================================================================
// Certificate Metadata (stored as JSONB)
// =============================================================================

export interface CertificateMetadata {
	user_name: string;
	course_title: string;
	completion_date: string;
	score?: number;
}

// =============================================================================
// Checkout & Payment Types
// =============================================================================

export interface CheckoutSession {
	id: string;
	url: string;
	expires_at: string;
}

export interface PaymentProviderConfig {
	id: string;
	name: string;
	enabled: boolean;
	test_mode: boolean;
	credentials: Record<string, string>;
	webhook_secret?: string;
}

export interface PaymentStatus {
	paid: boolean;
	status: string;
	amount?: number;
	currency?: string;
}

// =============================================================================
// Access Control
// =============================================================================

export interface AccessCheckResult {
	allowed: boolean;
	reason?: "free" | "membership" | "purchased" | "preview";
	deniedReason?: "no_membership" | "wrong_plan" | "not_purchased" | "expired";
}

// =============================================================================
// LMS Settings (stored in options table)
// =============================================================================

export interface LmsSettings {
	mode: LmsMode;
	currency: string;
	checkout_enabled: boolean;
	payment_providers: PaymentProviderConfig[];
	trial_days?: number;
	grace_period_days?: number;
	certificate_enabled?: boolean;
	progress_tracking?: boolean;
}

// =============================================================================
// Table name constants for API calls
// =============================================================================

export const TABLES = {
	// Courses
	COURSES: 'courses',
	MODULES: 'modules',
	LESSONS: 'lessons',
	COURSE_CATEGORIES: 'course_categories',
	COURSE_ENROLLMENTS: 'course_enrollments',
	LESSON_PROGRESS: 'lesson_progress',
	COURSE_INSTRUCTORS: 'course_instructors',
	COURSE_REVIEWS: 'course_reviews',
	// Quizzes
	QUIZZES: 'quizzes',
	QUESTIONS: 'questions',
	QUIZ_SUBMISSIONS: 'quiz_submissions',
	// Membership
	MEMBERSHIP_PLANS: 'membership_plans',
	MEMBERSHIPS: 'memberships',
	// Certificates
	CERTIFICATES: 'certificates',
	CERTIFICATE_TEMPLATES: 'certificate_templates',
	// Commerce
	ORDERS: 'orders',
	COUPONS: 'coupons',
	COUPON_USAGES: 'coupon_usages',
} as const;

export type TableName = (typeof TABLES)[keyof typeof TABLES];
