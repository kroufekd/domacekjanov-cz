export const projectId =
  process.env.NEXT_PUBLIC_SANITY_PROJECT_ID?.trim() || "lli7g5ge";
export const dataset =
  process.env.NEXT_PUBLIC_SANITY_DATASET?.trim() || "production";
export const apiVersion = "2026-07-24";
export const hasSanityConfig = Boolean(projectId && dataset);
