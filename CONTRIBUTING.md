# Contributing to EmDash LMS

Thank you for your interest in contributing!

## Development Setup

1. Clone the repository:
```bash
git clone https://github.com/tohaitrieu/emdash-lms.git
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

## Template Development

EmDash LMS provides standalone Astro templates that can be customized or extended.

### Template Architecture

```
src/
├── pages/               # Astro page templates
│   ├── academy.astro    # Course listing
│   ├── plans.astro      # Membership pricing
│   ├── course/
│   │   └── [slug].astro # Course detail
│   ├── lesson/
│   │   └── [slug].astro # Lesson viewer
│   └── checkout/
│       └── [id].astro   # Checkout flow
├── styles/
│   ├── variables.css    # CSS custom properties
│   ├── structure.css    # Layout without colors
│   └── full.css         # Complete styling
└── integration.ts       # Astro integration
```

### Virtual Modules

Templates use virtual modules for user configuration:

```typescript
// Import user's layout component
import Layout from "virtual:emdash-lms/layout";

// Import config
import { basePath } from "virtual:emdash-lms/config";
```

### Creating New Templates

1. Create a new `.astro` file in `src/pages/`
2. Import the virtual layout and config
3. Use EmDash APIs to fetch data
4. Apply LMS CSS classes for consistent styling

Example:
```astro
---
import { getEmDashCollection } from "emdash";
import Layout from "virtual:emdash-lms/layout";
import { basePath } from "virtual:emdash-lms/config";

const { entries } = await getEmDashCollection("courses");
---

<Layout title="My Page">
  <div class="lms-container">
    <!-- Your content -->
  </div>
</Layout>
```

### CSS Class Conventions

| Class | Purpose |
|-------|---------|
| `lms-container` | Main content wrapper |
| `lms-page-header` | Page title section |
| `lms-courses-grid` | Course card grid |
| `lms-course-card` | Individual course card |
| `lms-lesson-content` | Lesson body |
| `lms-sidebar` | Side navigation |
| `lms-empty` | Empty state message |

### CSS Variables

Override in your theme (fallback to theme vars or defaults):

```css
:root {
  /* Layout */
  --lms-container-width: 1200px;
  --lms-content-width: 768px;
  --lms-grid-gap: 1.5rem;
  --lms-section-gap: 3rem;
  --lms-card-padding: 1.5rem;

  /* Colors */
  --lms-accent: var(--accent, #3b82f6);
  --lms-accent-hover: var(--accent-hover, #2563eb);
  --lms-text: var(--text, #374151);
  --lms-text-muted: var(--text-muted, #6b7280);
  --lms-bg: var(--background, #ffffff);
  --lms-bg-muted: var(--background-muted, #f9fafb);
  --lms-border: var(--border, #e5e7eb);

  /* Effects */
  --lms-radius: var(--radius, 0.5rem);
  --lms-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  --lms-shadow-lg: 0 4px 6px rgba(0, 0, 0, 0.1);
}
```

Dark mode supported via `.dark` class or `prefers-color-scheme: dark`.

### Style Modes

When contributing templates, ensure they work with all style modes:

- **`plugin`**: Full styling (default)
- **`theme`**: Structure only, inherits theme colors
- **`minimal`**: No CSS, user styles everything

### Testing Templates

1. Create a test Astro project
2. Install local plugin: `pnpm add ../emdash-lms`
3. Configure integration with your layout
4. Test all style modes

## Questions?

Open an issue or discussion on GitHub.
