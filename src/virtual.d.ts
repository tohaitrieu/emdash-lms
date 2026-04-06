/**
 * Virtual module type declarations for EmDash LMS
 */

declare module "virtual:emdash-lms/layout" {
  import type { AstroComponentFactory } from "astro/runtime/server/index.js";
  const Layout: AstroComponentFactory;
  export default Layout;
}

declare module "virtual:emdash-lms/config" {
  export const basePath: string;
}
