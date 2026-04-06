# EmDash LMS

[![npm version](https://img.shields.io/npm/v/emdash-lms.svg)](https://www.npmjs.com/package/emdash-lms)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)

A unified Learning Management System plugin for [EmDash CMS](https://emdashcms.com). Build membership sites, online courses, or complete e-learning platforms.

## Features

- **3 Modes**: Membership-only, LMS-only, or Full (combined)
- **Membership Plans**: Subscription tiers with billing periods and access limits
- **Course Management**: Courses with lessons, progress tracking, and certificates
- **Access Control**: Membership-gated or individually purchasable courses
- **Simple Checkout**: Built-in payment processing with multiple providers
- **Payment Providers**: Stripe, Sepay (Vietnam), with extensible adapter pattern

## Installation

```bash
pnpm add emdash-lms
```

## Usage

```typescript
// astro.config.mjs
import { defineConfig } from "astro/config";
import emdash from "emdash/astro";
import { lmsPlugin } from "emdash-lms";

export default defineConfig({
  integrations: [
    emdash({
      plugins: [
        lmsPlugin({
          mode: "full", // "membership" | "lms" | "full"
          currency: { base: "USD" },
          checkout: {
            enabled: true,
            providers: ["stripe", "sepay"],
          },
        }),
      ],
    }),
  ],
});
```

## Configuration

### Plugin Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `mode` | `"membership" \| "lms" \| "full"` | `"full"` | Plugin mode |
| `membership.enabled` | `boolean` | Based on mode | Enable membership features |
| `courses.enabled` | `boolean` | Based on mode | Enable course features |
| `courses.individualPurchase` | `boolean` | `true` | Allow buying courses individually |
| `checkout.enabled` | `boolean` | `true` | Enable built-in checkout |
| `checkout.providers` | `string[]` | `[]` | Payment providers to enable |
| `currency.base` | `string` | `"USD"` | Base currency code (ISO 4217) |

### Seed Data

Copy the appropriate seed file to bootstrap your LMS:

```bash
# Full mode (membership + courses)
cp node_modules/emdash-lms/seed/seed.json .emdash/seed.json

# Membership only
cp node_modules/emdash-lms/seed/membership.json .emdash/seed.json

# Courses only
cp node_modules/emdash-lms/seed/courses.json .emdash/seed.json
```

## Admin Pages

| Page | Path | Description |
|------|------|-------------|
| Plans | `/plans` | Manage membership plans and pricing |
| Members | `/members` | View active memberships |
| Courses | `/courses` | Manage courses (via EmDash collections) |
| Students | `/students` | Track enrollments and progress |
| Orders | `/orders` | View purchase history |
| Settings | `/settings` | Configure LMS and payment providers |

## API Routes

All routes are prefixed with `/_emdash/api/plugins/lms/`

| Route | Description |
|-------|-------------|
| `plans` | CRUD operations for membership plans |
| `members` | Manage user memberships |
| `orders` | Order management |
| `checkout` | Create and verify checkout sessions |
| `access` | Check user access to courses/lessons |
| `webhook/:providerId` | Payment provider webhooks |

## Access Control

The plugin determines course access based on:

1. **Free courses** - Always accessible
2. **Membership courses** - Requires active membership with appropriate plan
3. **Purchase courses** - Requires individual purchase
4. **Preview lessons** - Always accessible regardless of access level

```typescript
import { checkCourseAccess } from "emdash-lms";

const result = checkCourseAccess(course, userAccess, plans);
// { allowed: true, reason: "membership" }
// { allowed: false, deniedReason: "no_membership" }
```

## Payment Providers

### Stripe

```typescript
lmsPlugin({
  checkout: {
    providers: ["stripe"],
  },
});
```

Required settings in admin:
- `test_secret_key` / `live_secret_key`
- `webhook_secret`
- `success_url` / `cancel_url`

### Sepay (Vietnam)

```typescript
lmsPlugin({
  checkout: {
    providers: ["sepay"],
  },
});
```

Required settings:
- `api_key`
- `checkout_page_url`
- `webhook_secret` (optional)

### Custom Provider

```typescript
import { registerProvider } from "emdash-lms";

registerProvider({
  id: "my-provider",
  name: "My Payment Provider",
  async createCheckout(order, config) {
    // Return { id, url, expires_at }
  },
  async handleWebhook(payload, headers, config) {
    // Return { event, orderId?, status? }
  },
  async verifyPayment(paymentId, config) {
    // Return { paid, status }
  },
});
```

## Development

```bash
# Install dependencies
pnpm install

# Build
pnpm build

# Watch mode
pnpm dev
```

## Contributing

Contributions are welcome! Please read our [Contributing Guide](CONTRIBUTING.md) for details on our code of conduct and the process for submitting pull requests.

## Related

- [EmDash CMS](https://emdashcms.com) - The headless CMS this plugin extends
- [emdash](https://www.npmjs.com/package/emdash) - Core EmDash package

## License

MIT © [Tô Triều](https://totrieu.com)
