import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  photos: defineTable({
    url: v.string(),
    albumId: v.string(),
    caption: v.optional(v.string()),
  }).index("by_album", ["albumId"]),
});
