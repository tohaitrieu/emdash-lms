/**
 * EmDash LMS Plugin Types
 */

// =============================================================================
// Configuration
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
// Membership
// =============================================================================

export interface MembershipPlan {
	id: string;
	slug: string;
	name: string;
	description?: string;
	// Pricing
	price: number;
	currency: string;
	sale_price?: number;
	sale_start?: string;
	sale_end?: string;
	// Billing
	billing_period: "monthly" | "quarterly" | "yearly" | "lifetime";
	features: string[];
	limits: PlanLimits;
	sort_order: number;
	status: "published" | "draft";
	created_at: string;
	updated_at: string;
}

export interface PlanLimits {
	courses?: "free_only" | "basic" | "all" | string[];
	downloads?: boolean;
	certificates?: boolean;
	[key: string]: unknown;
}

export interface Member {
	id: string;
	user_id: string;
	plan_id: string;
	membership_type: "free" | "loyalty";
	status: "active" | "cancelled" | "expired" | "pending";
	started_at: string;
	expires_at?: string;
	cancelled_at?: string;
	payment_provider?: string;
	subscription_id?: string;
	created_at: string;
	updated_at: string;
}

// =============================================================================
// Courses
// =============================================================================

export interface Course {
	id: string;
	slug: string;
	title: string;
	description?: string;
	excerpt?: string;
	featured_image?: { src: string; alt?: string };
	content?: unknown; // PortableText
	// Access
	access_level: "free" | "membership" | "purchase";
	is_purchasable: boolean;
	required_plan_ids?: string[];
	// Pricing
	price?: number;
	currency?: string;
	sale_price?: number;
	sale_start?: string;
	sale_end?: string;
	// Metadata
	category_id?: string;
	prerequisite_id?: string;
	duration_hours?: number;
	difficulty?: "beginner" | "intermediate" | "advanced";
	featured?: boolean;
	seo?: SeoMeta;
	status: "published" | "draft";
	created_at: string;
	updated_at: string;
}

export interface SeoMeta {
	title?: string;
	description?: string;
	keywords?: string[];
	og_image?: string;
}

export interface CourseInstructor {
	id: string;
	course_id: string;
	user_id: string;
	role: "instructor" | "assistant" | "guest";
	sort_order: number;
	created_at: string;
}

export interface Module {
	id: string;
	slug: string;
	course_id: string;
	title: string;
	description?: string;
	order: number;
	created_at: string;
	updated_at: string;
}

export interface Lesson {
	id: string;
	slug: string;
	module_id: string;
	course_id: string;
	title: string;
	excerpt?: string;
	featured_image_url?: string;
	content?: unknown; // PortableText (JSONB)
	summary?: unknown; // PortableText (JSONB)
	video_embed?: string;
	length?: number; // duration in minutes
	order: number;
	is_preview: boolean;
	prerequisite_id?: string;
	complexity?: string;
	resources?: LessonResource[];
	seo?: SeoMeta;
	faq_id?: string;
	disable_email_campaign?: boolean;
}

export interface LessonResource {
	type: "pdf" | "link" | "download" | "code" | "video";
	title: string;
	url: string;
	description?: string;
}

// =============================================================================
// Quizzes
// =============================================================================

export interface Quiz {
	id: string;
	lesson_id: string;
	title: string;
	description?: string;
	passmark: number; // percentage 0-100
	pass_required: boolean;
	timer_minutes?: number;
	allow_reset: boolean;
	random_order: boolean;
	grade_type: "auto" | "manual";
	status: "published" | "draft";
	created_at: string;
	updated_at: string;
}

export type QuestionType = "single" | "multiple" | "text" | "fill_blank";

export interface Question {
	id: string;
	quiz_id: string;
	question: string;
	question_image?: { src: string; alt?: string };
	type: QuestionType;
	answers: QuestionAnswer[];
	grade: number;
	sort_order: number;
	explanation?: string;
	random_order: boolean;
	created_at: string;
	updated_at: string;
}

export interface QuestionAnswer {
	id: string;
	text: string;
	is_correct: boolean;
	explanation?: string;
	sort_order: number;
}

export interface QuizSubmission {
	id: string;
	user_id: string;
	quiz_id: string;
	lesson_id: string;
	course_id: string;
	score: number;
	max_score: number;
	percentage: number;
	passed: boolean;
	answers: SubmissionAnswer[];
	started_at: string;
	submitted_at: string;
	time_spent_seconds: number;
}

export interface SubmissionAnswer {
	question_id: string;
	selected_answer_ids?: string[];
	text_answer?: string;
	is_correct: boolean;
	score: number;
}

// =============================================================================
// Coupons
// =============================================================================

export interface Coupon {
	id: string;
	code: string; // unique, uppercase
	description?: string;
	discount_type: "percentage" | "fixed";
	discount_value: number;
	// Scope
	applies_to: "all" | "membership" | "course";
	applicable_ids?: string[]; // specific plan/course IDs
	// Limits
	max_uses?: number;
	used_count: number;
	per_user_limit?: number;
	// Validity
	min_order_amount?: number;
	valid_from?: string;
	valid_until?: string;
	active: boolean;
	partner_name?: string;
	created_at: string;
}

export interface CouponUsage {
	id: string;
	coupon_id: string;
	user_id: string;
	order_id: string;
	discount_amount: number;
	used_at: string;
}

// =============================================================================
// Reviews
// =============================================================================

export interface CourseReview {
	id: string;
	course_id: string;
	user_id: string;
	rating: 1 | 2 | 3 | 4 | 5;
	title?: string;
	content?: string;
	verified_purchase: boolean;
	helpful_count: number;
	status: "published" | "pending" | "rejected";
	created_at: string;
	updated_at: string;
}

// =============================================================================
// Certificates
// =============================================================================

export interface CertificateTemplate {
	id: string;
	name: string;
	description?: string;
	design: string; // HTML/SVG template
	course_id?: string; // null = default template
	status: "published" | "draft";
	created_at: string;
	updated_at: string;
}

export interface Certificate {
	id: string;
	user_id: string;
	course_id: string;
	template_id: string;
	certificate_number: string; // unique
	issued_at: string;
	metadata: {
		user_name: string;
		course_title: string;
		completion_date: string;
		score?: number;
	};
}

export interface CourseEnrollment {
	id: string;
	user_id: string;
	course_id: string;
	source: "membership" | "purchase";
	order_id?: string;
	status: "in-progress" | "completed" | "dropped";
	progress: number;
	started_at: string;
	completed_at?: string;
	created_at: string;
	updated_at: string;
}

export interface LessonProgress {
	id: string;
	user_id: string;
	lesson_id: string;
	course_id: string;
	completed: boolean;
	completed_at?: string;
	last_position?: number;
	created_at: string;
	updated_at: string;
}

// =============================================================================
// Checkout & Orders
// =============================================================================

export interface Order {
	id: string;
	user_id: string;
	type: "membership" | "course";
	item_id: string;
	// Pricing
	subtotal: number;
	discount_amount: number;
	amount: number; // final amount after discount
	currency: string;
	// Coupon
	coupon_id?: string;
	coupon_code?: string;
	// Payment
	status: "pending" | "completed" | "failed" | "refunded";
	payment_provider: string;
	payment_id?: string;
	metadata?: Record<string, unknown>;
	created_at: string;
	updated_at: string;
}

export interface CheckoutSession {
	id: string;
	url: string;
	expires_at: string;
}

// =============================================================================
// Payment Providers
// =============================================================================

export interface PaymentProviderConfig {
	id: string;
	name: string;
	enabled: boolean;
	test_mode: boolean;
	credentials: Record<string, string>;
	webhook_secret?: string;
}

export interface PaymentProvider {
	id: string;
	name: string;
	/** Create checkout session for order */
	createCheckout(order: Order, config: PaymentProviderConfig): Promise<CheckoutSession>;
	/** Handle incoming webhook */
	handleWebhook(
		payload: unknown,
		headers: Record<string, string>,
		config: PaymentProviderConfig,
	): Promise<WebhookResult>;
	/** Verify payment status */
	verifyPayment(paymentId: string, config: PaymentProviderConfig): Promise<PaymentStatus>;
	/** Cancel subscription (for recurring) */
	cancelSubscription?(subscriptionId: string, config: PaymentProviderConfig): Promise<void>;
}

export interface WebhookResult {
	event: string;
	orderId?: string;
	status?: Order["status"];
	subscriptionId?: string;
	metadata?: Record<string, unknown>;
}

export interface PaymentStatus {
	paid: boolean;
	status: string;
	amount?: number;
	currency?: string;
}

// =============================================================================
// Settings
// =============================================================================

export interface LmsSettings {
	mode: LmsMode;
	currency: string;
	checkout_enabled: boolean;
	payment_providers: PaymentProviderConfig[];
	// Membership settings
	trial_days?: number;
	grace_period_days?: number;
	// Course settings
	certificate_enabled?: boolean;
	progress_tracking?: boolean;
}

// =============================================================================
// Access Control
// =============================================================================

export interface AccessCheckResult {
	allowed: boolean;
	reason?: "free" | "membership" | "purchased" | "preview";
	deniedReason?: "no_membership" | "wrong_plan" | "not_purchased" | "expired";
}

export interface UserAccess {
	userId: string;
	activeMembership?: Member;
	purchasedCourseIds: string[];
}
