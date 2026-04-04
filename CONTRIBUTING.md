# Contributing to EmDash LMS

Thank you for your interest in contributing!

## Development Setup

1. Clone the repository:
```bash
git clone https://github.com/emdash-cms/emdash-lms.git
cd emdash-lms
```

2. Install dependencies:
```bash
pnpm install
```

3. Build the plugin:
```bash
pnpm build
```

4. Run in watch mode for development:
```bash
pnpm dev
```

## Project Structure

```
src/
├── index.ts           # Plugin entry point
├── admin.tsx          # Admin UI components
├── types.ts           # TypeScript types
├── access-control.ts  # Course access logic
├── routes/            # API routes
│   ├── plans.ts
│   ├── members.ts
│   ├── orders.ts
│   ├── checkout.ts
│   ├── webhooks.ts
│   └── access.ts
└── providers/         # Payment providers
    ├── stripe.ts
    ├── sepay.ts
    └── index.ts
seed/
├── seed.json          # Full mode seed
├── membership.json    # Membership-only seed
└── courses.json       # LMS-only seed
```

## Guidelines

### Code Style

- Use TypeScript for all source files
- Follow existing code patterns
- Use descriptive variable and function names
- Add JSDoc comments for public APIs

### Commits

Use conventional commits:
- `feat:` New features
- `fix:` Bug fixes
- `docs:` Documentation
- `refactor:` Code refactoring
- `test:` Tests
- `chore:` Maintenance

### Pull Requests

1. Fork the repository
2. Create a feature branch: `git checkout -b feat/my-feature`
3. Make your changes
4. Run `pnpm build` to ensure it compiles
5. Commit with conventional commit message
6. Push and open a PR

### Adding Payment Providers

1. Create a new file in `src/providers/`
2. Implement the `PaymentProvider` interface
3. Export from `src/providers/index.ts`
4. Add documentation to README

Example:
```typescript
import type { PaymentProvider } from "../types.js";

export const myProvider: PaymentProvider = {
  id: "my-provider",
  name: "My Payment Provider",
  
  async createCheckout(order, config) {
    // Create checkout session
    return { id, url, expires_at };
  },
  
  async handleWebhook(payload, headers, config) {
    // Process webhook
    return { event, orderId, status };
  },
  
  async verifyPayment(paymentId, config) {
    // Verify payment status
    return { paid, status };
  },
};
```

## Questions?

Open an issue or discussion on GitHub.
