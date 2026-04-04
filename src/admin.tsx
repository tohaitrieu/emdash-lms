/**
 * EmDash LMS Admin UI
 *
 * Admin pages for managing:
 * - Membership Plans & Members
 * - Courses & Students
 * - Orders
 */

import {
  Crown,
  Users,
  GraduationCap,
  Student,
  Receipt,
  Gear,
  CreditCard,
} from "@phosphor-icons/react";
import { useQuery } from "@tanstack/react-query";
import * as React from "react";

// ============================================================================
// Types
// ============================================================================

interface MembershipPlan {
  id: number;
  name: string;
  slug: string;
  tier: number;
  duration_months: number;
  price: number;
  currency: string;
  limits: {
    articles_per_month: number | null;
    courses_access: "none" | "basic" | "all";
    lessons_preview: number;
  };
  is_active: boolean;
}

interface Course {
  id: number;
  name: string;
  slug: string;
  description: string;
  access_level: number;
  price: number | null;
  lessons_count: number;
  is_published: boolean;
}

// ============================================================================
// Plans Page
// ============================================================================

export function PlansPage() {
  return (
    <div className="p-6">
      <div className="flex items-center gap-3 mb-6">
        <Crown className="w-6 h-6 text-amber-500" weight="fill" />
        <h1 className="text-xl font-semibold">Membership Plans</h1>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 p-8 text-center text-gray-500">
        <Crown className="w-12 h-12 mx-auto mb-3 text-gray-300" />
        <p className="font-medium">Plans Management</p>
        <p className="text-sm">Configure subscription tiers and access limits</p>
      </div>
    </div>
  );
}

// ============================================================================
// Members Page
// ============================================================================

export function MembersPage() {
  return (
    <div className="p-6">
      <div className="flex items-center gap-3 mb-6">
        <Users className="w-6 h-6 text-blue-500" />
        <h1 className="text-xl font-semibold">Members</h1>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 p-8 text-center text-gray-500">
        <Users className="w-12 h-12 mx-auto mb-3 text-gray-300" />
        <p className="font-medium">Active Memberships</p>
        <p className="text-sm">View and manage subscriber memberships</p>
      </div>
    </div>
  );
}

// ============================================================================
// Courses Page
// ============================================================================

export function CoursesPage() {
  return (
    <div className="p-6">
      <div className="flex items-center gap-3 mb-6">
        <GraduationCap className="w-6 h-6 text-purple-500" />
        <h1 className="text-xl font-semibold">Courses</h1>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 p-8 text-center text-gray-500">
        <GraduationCap className="w-12 h-12 mx-auto mb-3 text-gray-300" />
        <p className="font-medium">Course Management</p>
        <p className="text-sm">Create and organize learning content</p>
      </div>
    </div>
  );
}

// ============================================================================
// Students Page
// ============================================================================

export function StudentsPage() {
  return (
    <div className="p-6">
      <div className="flex items-center gap-3 mb-6">
        <Student className="w-6 h-6 text-green-500" />
        <h1 className="text-xl font-semibold">Students</h1>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 p-8 text-center text-gray-500">
        <Student className="w-12 h-12 mx-auto mb-3 text-gray-300" />
        <p className="font-medium">Enrollments & Progress</p>
        <p className="text-sm">Track student learning progress</p>
      </div>
    </div>
  );
}

// ============================================================================
// Orders Page
// ============================================================================

export function OrdersPage() {
  return (
    <div className="p-6">
      <div className="flex items-center gap-3 mb-6">
        <Receipt className="w-6 h-6 text-gray-600" />
        <h1 className="text-xl font-semibold">Orders</h1>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 p-8 text-center text-gray-500">
        <Receipt className="w-12 h-12 mx-auto mb-3 text-gray-300" />
        <p className="font-medium">Order History</p>
        <p className="text-sm">Membership and course purchases</p>
      </div>
    </div>
  );
}

// ============================================================================
// Settings Page
// ============================================================================

const PAYMENT_PROVIDERS = [
  { id: "stripe", name: "Stripe", description: "Credit cards, Apple Pay, Google Pay" },
  { id: "paypal", name: "PayPal", description: "PayPal balance and linked accounts" },
  { id: "sepay", name: "Sepay", description: "Vietnamese bank transfers and e-wallets" },
];

export function SettingsPage() {
  return (
    <div className="p-6 max-w-4xl">
      <div className="flex items-center gap-3 mb-6">
        <Gear className="w-6 h-6 text-gray-600" />
        <h1 className="text-xl font-semibold">LMS Settings</h1>
      </div>

      {/* General Settings */}
      <section className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
        <h2 className="font-medium mb-4">General</h2>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Mode</label>
            <select className="w-full border rounded-md px-3 py-2">
              <option value="full">Full (Membership + LMS)</option>
              <option value="membership">Membership Only</option>
              <option value="lms">LMS Only</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Currency</label>
            <select className="w-full border rounded-md px-3 py-2">
              <option value="USD">USD - US Dollar</option>
              <option value="VND">VND - Vietnamese Dong</option>
              <option value="EUR">EUR - Euro</option>
            </select>
          </div>
        </div>
      </section>

      {/* Payment Providers */}
      <section className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
        <div className="flex items-center gap-2 mb-4">
          <CreditCard className="w-5 h-5 text-gray-500" />
          <h2 className="font-medium">Payment Providers</h2>
        </div>
        <div className="space-y-3">
          {PAYMENT_PROVIDERS.map((provider) => (
            <div
              key={provider.id}
              className="flex items-center justify-between p-4 border rounded-lg"
            >
              <div>
                <p className="font-medium">{provider.name}</p>
                <p className="text-sm text-gray-500">{provider.description}</p>
              </div>
              <button className="px-4 py-2 text-sm border rounded-md hover:bg-gray-50">
                Configure
              </button>
            </div>
          ))}
        </div>
      </section>

      {/* Membership Settings */}
      <section className="bg-white rounded-lg border border-gray-200 p-6">
        <h2 className="font-medium mb-4">Membership</h2>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Trial Period</p>
              <p className="text-sm text-gray-500">Allow free trial before billing</p>
            </div>
            <input
              type="number"
              className="w-20 border rounded-md px-3 py-2 text-right"
              placeholder="0"
            />
            <span className="text-sm text-gray-500">days</span>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Grace Period</p>
              <p className="text-sm text-gray-500">Days after expiry before access revoked</p>
            </div>
            <input
              type="number"
              className="w-20 border rounded-md px-3 py-2 text-right"
              placeholder="3"
            />
            <span className="text-sm text-gray-500">days</span>
          </div>
        </div>
      </section>
    </div>
  );
}

// ============================================================================
// Plugin Admin Entry
// ============================================================================

export default {
  pages: {
    "/plans": PlansPage,
    "/members": MembersPage,
    "/courses": CoursesPage,
    "/students": StudentsPage,
    "/orders": OrdersPage,
    "/settings": SettingsPage,
  },
};
