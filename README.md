# @ayushmaanagarwal1211/convex-offset-pagination

[![npm version](https://badge.fury.io/js/%40convex-dev%2Foffset-pagination.svg)](https://www.npmjs.com/package/@ayushmaanagarwal1211/convex-offset-pagination)

Offset-based pagination for [Convex](https://convex.dev) — page numbers, total counts, and random page access.

Convex natively supports **cursor-based pagination**, which is ideal for infinite scroll. But many UIs need traditional **page-number navigation** ("Page 3 of 42", "Jump to page 10"). This library fills that gap.

Built on top of [`@convex-dev/aggregate`](https://github.com/get-convex/aggregate), which maintains a B-tree for **O(log n)** count and offset lookups.

<div align="center">
  <img src="https://img.shields.io/badge/convex-%5E1.24.8-blue" alt="Convex version" />
  <img src="https://img.shields.io/badge/license-Apache--2.0-green" alt="License" />
</div>

## Features

- **Page-number pagination** — request any page by number, not just "next"
- **Total count** — always know total matching documents without scanning
- **Page metadata** — `totalPages`, `currentPage`, `hasNextPage`, `hasPreviousPage`
- **Namespace support** — paginate subsets independently (per user, per album, per org)
- **Ascending / descending** sort order
- **Trigger integration** — auto-sync via `convex-helpers` triggers
- **O(log n) performance** — no full table scans

## When to use this

| Use case | Built-in cursor pagination | This library |
|----------|---------------------------|--------------|
| Infinite scroll / "Load more" | Yes | No |
| "Page 1, 2, 3 ... 42" navigation | No | **Yes** |
| "Showing 41-60 of 423 results" | No | **Yes** |
| Jump to arbitrary page | No | **Yes** |
| Total count without scanning | No | **Yes** |

## Installation

```bash
npm install @ayushmaanagarwal1211/convex-offset-pagination @convex-dev/aggregate
```

Both packages are required. `@convex-dev/aggregate` is the underlying component that maintains the B-tree index.

## Setup

### 1. Register the aggregate component

```ts
// convex/convex.config.ts
import { defineApp } from "convex/server";
import aggregate from "@convex-dev/aggregate/convex.config.js";

const app = defineApp();
app.use(aggregate);
export default app;
```

### 2. Create a paginator instance

```ts
// convex/photos.ts
import { OffsetPagination } from "@ayushmaanagarwal1211/convex-offset-pagination";
import { components } from "./_generated/api";
import { DataModel } from "./_generated/dataModel";

const paginatedPhotos = new OffsetPagination<DataModel, "photos">(
  components.aggregate,
  {
    sortKey: (doc) => doc._creationTime,
  },
);
```

**With namespaces** (paginate per-album, per-user, etc.):

```ts
const paginatedPhotos = new OffsetPagination<DataModel, "photos">(
  components.aggregate,
  {
    sortKey: (doc) => doc._creationTime,
    namespace: (doc) => doc.albumId,
  },
);
```

### 3. Keep the aggregate in sync

Call `insert`, `delete`, and `replace` in your mutations alongside your `ctx.db` writes:

```ts
import { mutation } from "./_generated/server";
import { v } from "convex/values";

export const addPhoto = mutation({
  args: { url: v.string(), albumId: v.string() },
  handler: async (ctx, args) => {
    const id = await ctx.db.insert("photos", args);
    const doc = (await ctx.db.get(id))!;
    await paginatedPhotos.insert(ctx, doc);
    return id;
  },
});

export const deletePhoto = mutation({
  args: { id: v.id("photos") },
  handler: async (ctx, args) => {
    const doc = (await ctx.db.get(args.id))!;
    await paginatedPhotos.delete(ctx, doc);
    await ctx.db.delete(args.id);
  },
});

export const updatePhoto = mutation({
  args: { id: v.id("photos"), caption: v.string() },
  handler: async (ctx, args) => {
    const oldDoc = (await ctx.db.get(args.id))!;
    await ctx.db.patch(args.id, { caption: args.caption });
    const newDoc = (await ctx.db.get(args.id))!;
    await paginatedPhotos.replace(ctx, oldDoc, newDoc);
  },
});
```

#### Alternative: Auto-sync with triggers

If you use [`convex-helpers`](https://github.com/get-convex/convex-helpers), you can auto-sync without manual calls:

```ts
import { Triggers } from "convex-helpers/server/triggers";
import { DataModel } from "./_generated/dataModel";

const triggers = new Triggers<DataModel>();
triggers.register("photos", paginatedPhotos.trigger());

export const { mutation } = triggers.makeFunctions({ mutation: rawMutation });
```

### 4. Query with pagination

```ts
import { query } from "./_generated/server";
import { v } from "convex/values";

export const listPhotos = query({
  args: {
    page: v.number(),
    limit: v.number(),
    albumId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    return paginatedPhotos.paginate(ctx, "photos", {
      page: args.page,
      limit: args.limit,
      namespace: args.albumId,
    });
  },
});
```

**Response:**

```json
{
  "items": [{ "_id": "...", "url": "...", "albumId": "..." }],
  "totalCount": 423,
  "totalPages": 43,
  "currentPage": 5,
  "hasNextPage": true,
  "hasPreviousPage": true
}
```

### 5. Use in React

```tsx
import { useQuery } from "convex/react";
import { api } from "../convex/_generated/api";
import { useState } from "react";

function PhotoGallery({ albumId }: { albumId: string }) {
  const [page, setPage] = useState(1);
  const result = useQuery(api.photos.listPhotos, {
    page,
    limit: 20,
    albumId,
  });

  if (!result) return <div>Loading...</div>;

  return (
    <div>
      {result.items.map((photo) => (
        <img key={photo._id} src={photo.url} />
      ))}

      <div>
        Page {result.currentPage} of {result.totalPages}
        ({result.totalCount} photos)
      </div>

      <button
        disabled={!result.hasPreviousPage}
        onClick={() => setPage((p) => p - 1)}
      >
        Previous
      </button>
      <button
        disabled={!result.hasNextPage}
        onClick={() => setPage((p) => p + 1)}
      >
        Next
      </button>
    </div>
  );
}
```

## API Reference

### `new OffsetPagination(aggregateComponent, config)`

| Parameter | Type | Description |
|-----------|------|-------------|
| `aggregateComponent` | `ComponentApi` | `components.aggregate` from your generated code |
| `config.sortKey` | `(doc) => number` | Extracts the sort key (e.g. `doc._creationTime`) |
| `config.namespace` | `(doc) => string` | Optional. Scopes pagination to independent subsets |

### Query Methods

#### `paginate(ctx, tableName, args)` → `OffsetPaginationResult`

Primary API. Returns a page of fully-hydrated documents with pagination metadata.

| Arg | Type | Default | Description |
|-----|------|---------|-------------|
| `args.page` | `number` | required | 1-indexed page number |
| `args.limit` | `number` | required | Items per page |
| `args.namespace` | `string` | — | Scope to a namespace |
| `args.order` | `"asc" \| "desc"` | `"asc"` | Sort direction |

**Returns `OffsetPaginationResult<Doc>`:**

| Field | Type | Description |
|-------|------|-------------|
| `items` | `Doc[]` | Documents on the current page |
| `totalCount` | `number` | Total matching documents |
| `totalPages` | `number` | `ceil(totalCount / limit)` |
| `currentPage` | `number` | Current page (1-indexed) |
| `hasNextPage` | `boolean` | Whether next page exists |
| `hasPreviousPage` | `boolean` | Whether previous page exists |

#### `count(ctx, namespace?)` → `number`

Returns the total number of documents, optionally scoped by namespace.

#### `getPage(ctx, args)` → `{ ids, totalCount }`

Low-level API. Returns document IDs at the requested offset without hydrating full documents. Useful if you need to post-process IDs yourself.

### Write Methods

| Method | When to call |
|--------|-------------|
| `insert(ctx, doc)` | After `ctx.db.insert()` |
| `delete(ctx, doc)` | Before `ctx.db.delete()` |
| `replace(ctx, oldDoc, newDoc)` | After `ctx.db.patch()` or `ctx.db.replace()` |
| `trigger()` | Returns a trigger for `convex-helpers` auto-sync |
| `idempotentTrigger()` | Safe trigger variant for backfills |

## Backfilling Existing Data

If you add this to a table that already has data, backfill with a migration:

```ts
import { internalMutation } from "./_generated/server";

export const backfill = internalMutation({
  handler: async (ctx) => {
    const docs = await ctx.db.query("photos").collect();
    for (const doc of docs) {
      // idempotentTrigger or insertIfDoesNotExist handles re-runs safely
      await paginatedPhotos.insert(ctx, doc);
    }
  },
});
```

For large tables, use `convex-helpers` migrations with batching.

## Important: Namespaces Are Isolated

Namespaces in `@convex-dev/aggregate` create **separate B-trees**. You **cannot** query across all namespaces at once. This means if you need both "show all items" and "show items filtered by category", you need **two aggregate instances**:

```ts
// convex/convex.config.ts
import aggregate from "@convex-dev/aggregate/convex.config.js";

const app = defineApp();
app.use(aggregate);                               // global (all items)
app.use(aggregate, { name: "aggregateByAlbum" });  // per-album
```

```ts
// Global paginator — for "All" view
const allPhotos = new OffsetPagination<DataModel, "photos">(
  components.aggregate,
  { sortKey: (doc) => doc._creationTime },
);

// Namespaced paginator — for filtered views
const photosByAlbum = new OffsetPagination<DataModel, "photos">(
  components.aggregateByAlbum,
  {
    sortKey: (doc) => doc._creationTime,
    namespace: (doc) => doc.albumId,
  },
);

// Keep BOTH in sync on every write
export const add = mutation({
  handler: async (ctx, args) => {
    const id = await ctx.db.insert("photos", args);
    const doc = (await ctx.db.get(id))!;
    await allPhotos.insert(ctx, doc);
    await photosByAlbum.insert(ctx, doc);
    return id;
  },
});

// Query the right one based on filter
export const list = query({
  handler: async (ctx, { page, limit, albumId }) => {
    if (albumId) {
      return photosByAlbum.paginate(ctx, "photos", { page, limit, namespace: albumId });
    }
    return allPhotos.paginate(ctx, "photos", { page, limit });
  },
});
```

## Multiple Paginators

You can create multiple paginators for different tables. Each needs its own aggregate component instance:

```ts
// convex/convex.config.ts
import aggregate from "@convex-dev/aggregate/convex.config.js";

const app = defineApp();
app.use(aggregate);                           // for photos
app.use(aggregate, { name: "aggregateUsers" }); // for users
```

```ts
const paginatedPhotos = new OffsetPagination<DataModel, "photos">(
  components.aggregate,
  { sortKey: (doc) => doc._creationTime },
);

const paginatedUsers = new OffsetPagination<DataModel, "users">(
  components.aggregateUsers,
  { sortKey: (doc) => doc._creationTime },
);
```

## How It Works

1. `@convex-dev/aggregate` maintains a B-tree index over your table
2. `count()` traverses the tree in **O(log n)** — no full scan
3. `at(offset)` finds the document at any position in **O(log n)**
4. `paginate()` calls `count()` once, then `at()` for each item on the page
5. Total cost per page: **O(pageSize x log n)**

For a table with 1 million documents and a page size of 20, each page request does ~20 x 20 = ~400 node lookups — fast enough for real-time queries.

## Comparison with Cursor-Based Pagination

| Feature | Cursor-Based (built-in) | Offset-Based (this library) |
|---------|------------------------|-------------------------------|
| Jump to page N | No | Yes |
| Total count | No | Yes |
| "Page X of Y" UI | No | Yes |
| Infinite scroll | Best choice | Possible but not ideal |
| Consistent under concurrent writes | Yes | Best-effort |
| Setup cost | None | Requires aggregate sync |
| Performance | O(page size) | O(page size x log n) |

## License

[Apache-2.0](./LICENSE)
