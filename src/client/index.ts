import { TableAggregate } from "@convex-dev/aggregate";
import type {
  GenericDataModel,
  GenericDocument,
  TableNamesInDataModel,
  GenericQueryCtx,
  GenericMutationCtx,
  DocumentByName,
} from "convex/server";
import type { GenericId } from "convex/values";

// ---------------------------------------------------------------------------
// Public types
// ---------------------------------------------------------------------------

/**
 * Pagination result returned to the caller. Mirrors the shape most
 * UI pagination components expect (total count, page metadata, items).
 */
export interface OffsetPaginationResult<Doc extends GenericDocument> {
  /** Documents on the current page. */
  items: Doc[];
  /** Total number of documents matching the query (across all pages). */
  totalCount: number;
  /** Total number of pages based on `limit`. */
  totalPages: number;
  /** Current page number (1-indexed). */
  currentPage: number;
  /** Whether a next page exists. */
  hasNextPage: boolean;
  /** Whether a previous page exists. */
  hasPreviousPage: boolean;
}

/**
 * Configuration passed once when constructing the pagination helper.
 *
 * @typeParam DataModel - The app's `DataModel` from `_generated/dataModel`.
 * @typeParam TableName - The table this paginator is bound to.
 */
export interface OffsetPaginationConfig<
  DataModel extends GenericDataModel,
  TableName extends TableNamesInDataModel<DataModel>,
> {
  /**
   * Function that extracts the **sort key** from a document.
   * The sort key determines the order in which rows are iterated.
   * Using `_creationTime` is the most common choice.
   */
  sortKey: (doc: DocumentByName<DataModel, TableName>) => number;

  /**
   * Optional function to derive a **namespace** from a document.
   * Namespaces let you paginate independent subsets of the same table
   * (e.g. per-user, per-organisation, per-album).
   */
  namespace?: (doc: DocumentByName<DataModel, TableName>) => string;
}

/**
 * Arguments accepted by `paginate()`.
 */
export interface PaginateArgs {
  /** 1-indexed page number. */
  page: number;
  /** Number of items per page. */
  limit: number;
  /** Optional namespace to scope the query. */
  namespace?: string;
  /** Sort order – defaults to `"asc"`. */
  order?: "asc" | "desc";
}

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

type AggregateType<
  DataModel extends GenericDataModel,
  TableName extends TableNamesInDataModel<DataModel>,
  HasNamespace extends boolean,
> = HasNamespace extends true
  ? {
      Key: number;
      DataModel: DataModel;
      TableName: TableName;
      Namespace: string;
    }
  : {
      Key: number;
      DataModel: DataModel;
      TableName: TableName;
    };

// ---------------------------------------------------------------------------
// Main class
// ---------------------------------------------------------------------------

/**
 * `OffsetPagination` wraps `@convex-dev/aggregate`'s `TableAggregate` to
 * provide **offset-based pagination** (page numbers, total count, random
 * page access) on top of any Convex table.
 *
 * ## Quick start
 *
 * ```ts
 * // convex/convex.config.ts
 * import { defineApp } from "convex/server";
 * import aggregate from "@convex-dev/aggregate/convex.config.js";
 *
 * const app = defineApp();
 * app.use(aggregate);
 * export default app;
 * ```
 *
 * ```ts
 * // convex/example.ts
 * import { OffsetPagination } from "@ayushmaanagarwal1211/convex-offset-pagination";
 * import { components } from "./_generated/api";
 * import { DataModel } from "./_generated/dataModel";
 *
 * const paginatedPhotos = new OffsetPagination<DataModel, "photos">(
 *   components.aggregate,
 *   {
 *     sortKey: (doc) => doc._creationTime,
 *     namespace: (doc) => doc.albumId,
 *   },
 * );
 * ```
 */
export class OffsetPagination<
  DataModel extends GenericDataModel,
  TableName extends TableNamesInDataModel<DataModel>,
> {
  private aggregate: TableAggregate<
    AggregateType<DataModel, TableName, boolean>
  >;

  private namespaced: boolean;

  constructor(
    aggregateComponent: unknown,
    private config: OffsetPaginationConfig<DataModel, TableName>,
  ) {
    const aggregateOpts: Record<string, unknown> = {
      sortKey: config.sortKey,
    };

    if (config.namespace) {
      aggregateOpts.namespace = config.namespace;
      this.namespaced = true;
    } else {
      this.namespaced = false;
    }

    // Users install @convex-dev/aggregate directly and pass
    // `components.aggregate` here. We wrap it with TableAggregate.
    this.aggregate = new TableAggregate(
      aggregateComponent as never,
      aggregateOpts as never,
    );
  }

  // -----------------------------------------------------------------------
  // Write helpers – call these in your mutations alongside db writes
  // -----------------------------------------------------------------------

  /**
   * Call after inserting a document into the table.
   *
   * ```ts
   * const id = await ctx.db.insert("photos", data);
   * const doc = (await ctx.db.get(id))!;
   * await paginatedPhotos.insert(ctx, doc);
   * ```
   */
  async insert(
    ctx: GenericMutationCtx<DataModel>,
    doc: DocumentByName<DataModel, TableName>,
  ): Promise<void> {
    await this.aggregate.insert(ctx, doc as never);
  }

  /**
   * Call before deleting a document from the table.
   *
   * ```ts
   * const doc = (await ctx.db.get(id))!;
   * await paginatedPhotos.delete(ctx, doc);
   * await ctx.db.delete(id);
   * ```
   */
  async delete(
    ctx: GenericMutationCtx<DataModel>,
    doc: DocumentByName<DataModel, TableName>,
  ): Promise<void> {
    await this.aggregate.delete(ctx, doc as never);
  }

  /**
   * Call when replacing / patching a document.
   *
   * ```ts
   * const oldDoc = (await ctx.db.get(id))!;
   * await ctx.db.patch(id, updates);
   * const newDoc = (await ctx.db.get(id))!;
   * await paginatedPhotos.replace(ctx, oldDoc, newDoc);
   * ```
   */
  async replace(
    ctx: GenericMutationCtx<DataModel>,
    oldDoc: DocumentByName<DataModel, TableName>,
    newDoc: DocumentByName<DataModel, TableName>,
  ): Promise<void> {
    await this.aggregate.replace(ctx, oldDoc as never, newDoc as never);
  }

  /**
   * Returns a **trigger function** you can wire into Convex triggers
   * so that the aggregate stays in sync automatically.
   *
   * ```ts
   * import { Triggers } from "convex-helpers/server/triggers";
   *
   * const triggers = new Triggers<DataModel>();
   * triggers.register("photos", paginatedPhotos.trigger());
   * // then wrap your mutation ctx with triggers
   * ```
   */
  trigger() {
    return this.aggregate.trigger();
  }

  /**
   * An idempotent variant of `trigger()` – safe to use during
   * backfills where the same document may be processed more than once.
   */
  idempotentTrigger() {
    return this.aggregate.idempotentTrigger();
  }

  // -----------------------------------------------------------------------
  // Read helpers
  // -----------------------------------------------------------------------

  /**
   * Returns the total number of documents (optionally scoped by namespace).
   */
  async count(
    ctx: GenericQueryCtx<DataModel>,
    namespace?: string,
  ): Promise<number> {
    if (this.namespaced && namespace !== undefined) {
      return this.aggregate.count(ctx, { namespace } as never);
    }
    return this.aggregate.count(ctx);
  }

  /**
   * Core pagination method. Returns a page of **document IDs and sort keys**
   * at the requested offset.
   *
   * Most callers should use `paginate()` which fetches full documents.
   */
  async getPage(
    ctx: GenericQueryCtx<DataModel>,
    args: PaginateArgs,
  ): Promise<{
    ids: GenericId<string>[];
    totalCount: number;
  }> {
    const { page, limit, namespace, order = "asc" } = args;

    if (page < 1) {
      throw new Error("Page number must be >= 1");
    }
    if (limit < 1) {
      throw new Error("Limit must be >= 1");
    }

    const totalCount = await this.count(ctx, namespace);

    if (totalCount === 0) {
      return { ids: [], totalCount: 0 };
    }

    const startOffset =
      order === "asc"
        ? (page - 1) * limit
        : totalCount - page * limit;

    const ids: GenericId<string>[] = [];
    const itemsToFetch = Math.min(limit, totalCount - (page - 1) * limit);

    if (itemsToFetch <= 0) {
      return { ids: [], totalCount };
    }

    // Fetch each item at its offset position using the aggregate's `at()`.
    // For typical page sizes (10–100) this is efficient: each `at()` is
    // O(log n) so the total cost is O(pageSize × log n).
    for (let i = 0; i < itemsToFetch; i++) {
      const resolvedOffset =
        order === "asc"
          ? startOffset + i
          : Math.max(startOffset + (itemsToFetch - 1 - i), 0);

      const item = this.namespaced && namespace !== undefined
        ? await this.aggregate.at(ctx, resolvedOffset, { namespace } as never)
        : await this.aggregate.at(ctx, resolvedOffset);

      if (item.id) {
        ids.push(item.id as GenericId<string>);
      }
    }

    return { ids, totalCount };
  }

  /**
   * **Primary API** – fetches a page of fully-hydrated documents with
   * pagination metadata.
   *
   * ```ts
   * export const listPhotos = query({
   *   args: {
   *     page: v.number(),
   *     limit: v.number(),
   *     albumId: v.optional(v.string()),
   *   },
   *   handler: async (ctx, args) => {
   *     return paginatedPhotos.paginate(ctx, "photos", {
   *       page: args.page,
   *       limit: args.limit,
   *       namespace: args.albumId,
   *     });
   *   },
   * });
   * ```
   */
  async paginate(
    ctx: GenericQueryCtx<DataModel>,
    tableName: TableName,
    args: PaginateArgs,
  ): Promise<OffsetPaginationResult<DocumentByName<DataModel, TableName>>> {
    const { page, limit } = args;
    const { ids, totalCount } = await this.getPage(ctx, args);

    // Hydrate document IDs → full documents
    const items: DocumentByName<DataModel, TableName>[] = [];
    for (const id of ids) {
      const doc = await (ctx.db as GenericQueryCtx<DataModel>["db"]).get(
        id as never,
      );
      if (doc !== null) {
        items.push(doc as DocumentByName<DataModel, TableName>);
      }
    }

    const totalPages = totalCount === 0 ? 0 : Math.ceil(totalCount / limit);

    return {
      items,
      totalCount,
      totalPages,
      currentPage: page,
      hasNextPage: page < totalPages,
      hasPreviousPage: page > 1,
    };
  }
}
