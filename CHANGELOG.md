# Changelog

## 0.1.0 (2026-03-19)

### Initial release

- `OffsetPagination` class wrapping `@convex-dev/aggregate` for offset-based pagination
- `paginate()` — returns page of documents with `totalCount`, `totalPages`, `currentPage`, `hasNextPage`, `hasPreviousPage`
- `count()` — O(log n) total count, optionally scoped by namespace
- `getPage()` — low-level API returning document IDs at offset
- Write helpers: `insert()`, `delete()`, `replace()`
- `trigger()` and `idempotentTrigger()` for `convex-helpers` auto-sync
- Namespace support for independent pagination of table subsets
- Ascending and descending sort order
