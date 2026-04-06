/**
 * EmDash LMS Astro Integration
 *
 * Injects frontend pages for LMS functionality:
 * - /courses - Course listing
 * - /course/[slug] - Course detail
 * - /lesson/[slug] - Lesson viewer
 * - /plans - Membership pricing
 * - /checkout/[id] - Checkout flow
 */

import type { AstroIntegration } from "astro";
import { fileURLToPath } from "node:url";
import { resolve, isAbsolute } from "node:path";

export interface LmsIntegrationOptions {
  /** User's layout component path. Required. */
  layout: string;
  /** Base path for LMS pages. Default: "" */
  basePath?: string;
  /** Style mode. Default: "plugin" */
  styles?: "plugin" | "theme" | "minimal";
}

const LMS_ROUTES = [
  { pattern: "/courses", entry: "courses.astro" },
  { pattern: "/course/[slug]", entry: "course/[slug].astro" },
  { pattern: "/lesson/[slug]", entry: "lesson/[slug].astro" },
  { pattern: "/plans", entry: "plans.astro" },
  { pattern: "/checkout/[id]", entry: "checkout/[id].astro" },
] as const;

/**
 * Astro integration for EmDash LMS frontend pages
 *
 * @example
 * ```typescript
 * // astro.config.mjs
 * import { lmsIntegration } from "emdash-lms/astro";
 *
 * export default defineConfig({
 *   integrations: [
 *     lmsIntegration({
 *       layout: "./src/layouts/Base.astro",
 *       styles: "plugin",
 *     }),
 *   ],
 * });
 * ```
 */
export function lmsIntegration(options: LmsIntegrationOptions): AstroIntegration {
  if (!options.layout) {
    throw new Error(
      "lmsIntegration requires `layout` option. " +
        'Example: lmsIntegration({ layout: "./src/layouts/Base.astro" })'
    );
  }

  const { layout, basePath = "", styles = "plugin" } = options;

  return {
    name: "emdash-lms",
    hooks: {
      "astro:config:setup": ({ injectRoute, injectScript, updateConfig, logger, config }) => {
        // Resolve layout path relative to project root
        const projectRoot = fileURLToPath(config.root);
        const resolvedLayout = isAbsolute(layout) ? layout : resolve(projectRoot, layout);
        // 1. Inject LMS routes
        for (const route of LMS_ROUTES) {
          injectRoute({
            pattern: `${basePath}${route.pattern}`,
            entrypoint: `emdash-lms/pages/${route.entry}`,
          });
        }
        logger.info(`Injected ${LMS_ROUTES.length} LMS pages`);

        // 2. Virtual module for layout - allows templates to import user's layout
        updateConfig({
          vite: {
            plugins: [
              {
                name: "emdash-lms-virtual",
                resolveId(id: string) {
                  if (id === "virtual:emdash-lms/layout") return "\0" + id;
                  if (id === "virtual:emdash-lms/config") return "\0" + id;
                },
                load(id: string) {
                  if (id === "\0virtual:emdash-lms/layout") {
                    return `export { default } from "${resolvedLayout}";`;
                  }
                  if (id === "\0virtual:emdash-lms/config") {
                    return `export const basePath = "${basePath}";`;
                  }
                },
              },
            ],
          },
        });

        // 3. Inject styles based on mode
        if (styles === "plugin") {
          injectScript("page-ssr", `import "emdash-lms/styles/full.css";`);
        } else if (styles === "theme") {
          injectScript("page-ssr", `import "emdash-lms/styles/structure.css";`);
        }
        // "minimal" = no CSS injection

        if (styles !== "minimal") {
          logger.info(`Injected LMS styles (${styles} mode)`);
        }
      },
    },
  };
}

export default lmsIntegration;
