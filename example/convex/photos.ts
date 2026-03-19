import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { OffsetPagination } from "@ayushmaanagarwal1211/convex-offset-pagination";
import { components } from "./_generated/api";
import { DataModel } from "./_generated/dataModel";

// Global paginator — for "All Albums" (no namespace)
const allPhotos = new OffsetPagination<DataModel, "photos">(
  components.aggregate,
  {
    sortKey: (doc) => doc._creationTime,
  },
);

// Namespaced paginator — for per-album filtering
const photosByAlbum = new OffsetPagination<DataModel, "photos">(
  components.aggregateByAlbum,
  {
    sortKey: (doc) => doc._creationTime,
    namespace: (doc) => doc.albumId,
  },
);

// ---------------------------------------------------------------------------
// Helper: sync both aggregates
// ---------------------------------------------------------------------------

async function syncInsert(ctx: Parameters<typeof allPhotos.insert>[0], doc: Parameters<typeof allPhotos.insert>[1]) {
  await allPhotos.insert(ctx, doc);
  await photosByAlbum.insert(ctx, doc);
}

async function syncDelete(ctx: Parameters<typeof allPhotos.delete>[0], doc: Parameters<typeof allPhotos.delete>[1]) {
  await allPhotos.delete(ctx, doc);
  await photosByAlbum.delete(ctx, doc);
}

async function syncReplace(
  ctx: Parameters<typeof allPhotos.replace>[0],
  oldDoc: Parameters<typeof allPhotos.replace>[1],
  newDoc: Parameters<typeof allPhotos.replace>[2],
) {
  await allPhotos.replace(ctx, oldDoc, newDoc);
  await photosByAlbum.replace(ctx, oldDoc, newDoc);
}

// ---------------------------------------------------------------------------
// Queries
// ---------------------------------------------------------------------------

export const list = query({
  args: {
    page: v.number(),
    limit: v.number(),
    albumId: v.optional(v.string()),
  },
  returns: v.object({
    items: v.array(v.any()),
    totalCount: v.number(),
    totalPages: v.number(),
    currentPage: v.number(),
    hasNextPage: v.boolean(),
    hasPreviousPage: v.boolean(),
  }),
  handler: async (ctx, args) => {
    if (args.albumId) {
      return photosByAlbum.paginate(ctx, "photos", {
        page: args.page,
        limit: args.limit,
        namespace: args.albumId,
      });
    }
    return allPhotos.paginate(ctx, "photos", {
      page: args.page,
      limit: args.limit,
    });
  },
});

export const totalCount = query({
  args: { albumId: v.optional(v.string()) },
  returns: v.number(),
  handler: async (ctx, args) => {
    if (args.albumId) {
      return photosByAlbum.count(ctx, args.albumId);
    }
    return allPhotos.count(ctx);
  },
});

// ---------------------------------------------------------------------------
// Mutations
// ---------------------------------------------------------------------------

export const add = mutation({
  args: {
    url: v.string(),
    albumId: v.string(),
    caption: v.optional(v.string()),
  },
  returns: v.id("photos"),
  handler: async (ctx, args) => {
    const id = await ctx.db.insert("photos", args);
    const doc = (await ctx.db.get(id))!;
    await syncInsert(ctx, doc);
    return id;
  },
});

export const remove = mutation({
  args: { id: v.id("photos") },
  returns: v.null(),
  handler: async (ctx, args) => {
    const doc = await ctx.db.get(args.id);
    if (!doc) {
      throw new Error(`Photo ${args.id} not found`);
    }
    await syncDelete(ctx, doc);
    await ctx.db.delete(args.id);
    return null;
  },
});

export const updateCaption = mutation({
  args: { id: v.id("photos"), caption: v.string() },
  returns: v.null(),
  handler: async (ctx, args) => {
    const oldDoc = await ctx.db.get(args.id);
    if (!oldDoc) {
      throw new Error(`Photo ${args.id} not found`);
    }
    await ctx.db.patch(args.id, { caption: args.caption });
    const newDoc = (await ctx.db.get(args.id))!;
    await syncReplace(ctx, oldDoc, newDoc);
    return null;
  },
});
