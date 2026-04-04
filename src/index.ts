/**
 * EmDash LMS — Subscriptions & Memberships
 *
 * A unified Learning Management System plugin for EmDash CMS.
 * Supports three modes:
 * - Membership only: Subscription plans with content access limits
 * - LMS only: Courses with individual purchase
 * - Full: Combined membership + LMS with tiered access
 */

import type { PluginDescriptor, PluginStorageConfig, ResolvedPlugin } from "emdash";
import { definePlugin } from "emdash";

import {
  accessRoute,
  checkoutRoute,
  membersRoute,
  ordersRoute,
  plansRoute,
  webhooksRoute,
} from "./routes/index.js";

// Re-export types
export * from "./types.js";
export * from "./access-control.js";
export * from "./providers/index.js";

// Storage schema for plugin data
const LMS_STORAGE = {
  plans: {
    indexes: ["slug", "status", "sort_order"],
    uniqueIndexes: ["slug"],
  },
  members: {
    indexes: ["user_id", "plan_id", "status", "subscription_id"],
  },
  orders: {
    indexes: ["user_id", "type", "status", "payment_provider", "created_at"],
  },
  enrollments: {
    indexes: ["user_id", "course_id", "source"],
  },
  progress: {
    indexes: ["user_id", "course_id", "lesson_id"],
  },
} satisfies PluginStorageConfig;

export interface LmsPluginOptions {
  /** Plugin mode. Default: "full" */
  mode?: "membership" | "lms" | "full";

  /** Membership configuration */
  membership?: {
    /** Enable membership features. Default: true in full/membership mode */
    enabled?: boolean;
  };

  /** Courses configuration */
  courses?: {
    /** Enable course features. Default: true in full/lms mode */
    enabled?: boolean;
    /** Allow individual course purchases. Default: true */
    individualPurchase?: boolean;
  };

  /** Checkout configuration */
  checkout?: {
    /** Enable built-in simple checkout. Default: true */
    enabled?: boolean;
    /** Payment providers */
    providers?: ("stripe" | "sepay" | "bank_transfer")[];
  };

  /** Currency configuration */
  currency?: {
    /** Base currency code. Default: "USD" */
    base?: string;
    /** Display currency code. Default: same as base */
    display?: string;
    /** Exchange rate (display/base). Default: 1 */
    exchangeRate?: number;
  };
}

/**
 * Plugin factory - returns a descriptor for the integration
 */
export function lmsPlugin(options: LmsPluginOptions = {}): PluginDescriptor<LmsPluginOptions> {
  const mode = options.mode ?? "full";

  // Determine which features are enabled based on mode
  const membershipEnabled =
    options.membership?.enabled ?? (mode === "membership" || mode === "full");
  const coursesEnabled =
    options.courses?.enabled ?? (mode === "lms" || mode === "full");

  // Build admin pages based on enabled features
  const adminPages: { path: string; label: string; icon: string; group: string }[] = [];

  if (membershipEnabled) {
    adminPages.push(
      { path: "/plans", label: "Plans", icon: "crown", group: "lms" },
      { path: "/members", label: "Members", icon: "users", group: "lms" }
    );
  }

  if (coursesEnabled) {
    adminPages.push(
      { path: "/courses", label: "Courses", icon: "graduation-cap", group: "lms" },
      { path: "/students", label: "Students", icon: "student", group: "lms" }
    );
  }

  // Orders page always available
  adminPages.push(
    { path: "/orders", label: "Orders", icon: "receipt", group: "lms" },
    { path: "/settings", label: "Settings", icon: "settings", group: "lms" }
  );

  return {
    id: "lms",
    version: "0.1.0",
    entrypoint: "emdash-lms",
    adminEntry: "emdash-lms/admin",
    options,
    adminPages,
  };
}

/**
 * Create the resolved plugin - called by the generated virtual module
 */
export function createPlugin(options: LmsPluginOptions = {}): ResolvedPlugin {
  const mode = options.mode ?? "full";
  const membershipEnabled =
    options.membership?.enabled ?? (mode === "membership" || mode === "full");
  const coursesEnabled =
    options.courses?.enabled ?? (mode === "lms" || mode === "full");

  const adminPages: { path: string; label: string; icon: string; group: string }[] = [];

  if (membershipEnabled) {
    adminPages.push(
      { path: "/plans", label: "Plans", icon: "crown", group: "lms" },
      { path: "/members", label: "Members", icon: "users", group: "lms" }
    );
  }

  if (coursesEnabled) {
    adminPages.push(
      { path: "/courses", label: "Courses", icon: "graduation-cap", group: "lms" },
      { path: "/students", label: "Students", icon: "student", group: "lms" }
    );
  }

  adminPages.push(
    { path: "/orders", label: "Orders", icon: "receipt", group: "lms" },
    { path: "/settings", label: "Settings", icon: "settings", group: "lms" }
  );

  return definePlugin({
    id: "lms",
    version: "0.1.0",

    capabilities: ["read:content", "read:users"],

    storage: LMS_STORAGE,

    admin: {
      entry: "emdash-lms/admin",
      pages: adminPages,
    },

    routes: {
      plans: {
        handler: plansRoute,
      },
      members: {
        handler: membersRoute,
      },
      orders: {
        handler: ordersRoute,
      },
      checkout: {
        handler: checkoutRoute,
      },
      access: {
        handler: accessRoute,
      },
      "webhook/:providerId": {
        handler: webhooksRoute,
        public: true,
      },
    },
  });
}

export default lmsPlugin;
