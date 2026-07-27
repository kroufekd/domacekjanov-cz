import { visionTool } from "@sanity/vision";
import { defineConfig } from "sanity";
import { structureTool } from "sanity/structure";

import { schemaTypes } from "./schemaTypes";
import { singletonTypes, structure } from "./structure";

export default defineConfig({
  name: "domecek-janov",
  title: "Domeček Janov",
  projectId: process.env.SANITY_STUDIO_PROJECT_ID || "lli7g5ge",
  dataset: process.env.SANITY_STUDIO_DATASET || "production",
  plugins: [structureTool({ structure }), visionTool()],
  schema: {
    types: schemaTypes,
  },
  document: {
    // The singletons are reachable from the sidebar, never created by hand.
    newDocumentOptions: (previous) =>
      previous.filter((item) => !singletonTypes.has(item.templateId)),
    actions: (previous, { schemaType }) =>
      singletonTypes.has(schemaType)
        ? previous.filter(
            (action) =>
              action.action !== "delete" && action.action !== "duplicate",
          )
        : previous,
  },
});
