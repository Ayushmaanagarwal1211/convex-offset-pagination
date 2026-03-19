import { useState, CSSProperties } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../convex/_generated/api";
import { GuidedTour } from "./GuidedTour";
import { CodeBlock } from "./CodeBlock";
import {
  container,
  card,
  badge,
  btnPrimary,
  btnOutline,
  btnDanger,
  select as selectStyle,
  input as inputStyle,
} from "./styles";

const ITEMS_PER_PAGE = 5;
const ALBUMS = ["Vacation", "Family", "Work", "Nature"];

const ALBUM_COLORS: Record<string, "primary" | "success" | "warning" | "danger"> = {
  Vacation: "primary",
  Family: "success",
  Work: "warning",
  Nature: "danger",
};

// ---------------------------------------------------------------------------
// Main App
// ---------------------------------------------------------------------------

export default function App() {
  const [page, setPage] = useState(1);
  const [selectedAlbum, setSelectedAlbum] = useState<string | undefined>(undefined);
  const [seeding, setSeeding] = useState(false);
  const [showCode, setShowCode] = useState(false);

  const result = useQuery(api.photos.list, {
    page,
    limit: ITEMS_PER_PAGE,
    albumId: selectedAlbum,
  });

  const totalCount = useQuery(api.photos.totalCount, {
    albumId: selectedAlbum,
  });

  const addPhoto = useMutation(api.photos.add);
  const removePhoto = useMutation(api.photos.remove);

  const handleSeedData = async () => {
    setSeeding(true);
    const promises = [];
    for (let i = 0; i < 50; i++) {
      const album = ALBUMS[Math.floor(Math.random() * ALBUMS.length)];
      promises.push(
        addPhoto({
          url: `https://picsum.photos/seed/${Date.now() + i}/200/200`,
          albumId: album,
          caption: `Photo ${i + 1} — ${album}`,
        }),
      );
    }
    await Promise.all(promises);
    setSeeding(false);
  };

  const navigateToPage = (p: number) => {
    const maxPage = result?.totalPages ?? 1;
    setPage(Math.max(1, Math.min(p, maxPage)));
  };

  const generatePageNumbers = (): (number | "...")[] => {
    if (!result || result.totalPages <= 7) {
      return Array.from({ length: result?.totalPages ?? 0 }, (_, i) => i + 1);
    }
    const total = result.totalPages;
    const current = result.currentPage;
    const pages: (number | "...")[] = [1];

    if (current > 3) pages.push("...");

    const start = Math.max(2, current - 1);
    const end = Math.min(total - 1, current + 1);
    for (let i = start; i <= end; i++) pages.push(i);

    if (current < total - 2) pages.push("...");
    pages.push(total);

    return pages;
  };

  return (
    <div style={{ minHeight: "100vh", paddingBottom: 80 }}>
      {/* ── Hero Section ── */}
      <header style={heroSection}>
        <div style={container}>
          <div style={{ maxWidth: 680 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
              <span style={badge("primary")}>Convex Component</span>
              <span style={badge("success")}>v0.1.0</span>
            </div>

            <h1 style={{ fontSize: 40, fontWeight: 700, letterSpacing: "-0.025em", lineHeight: 1.15, marginBottom: 12 }}>
              Offset Pagination
            </h1>

            <p style={{ fontSize: 18, color: "var(--text-secondary)", lineHeight: 1.6, marginBottom: 24, maxWidth: 560 }}>
              Page numbers, total counts, and random page access for Convex.
              Built on <code>@convex-dev/aggregate</code> for O(log n) performance.
            </p>

            <div style={{ display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
              <GuidedTour />
              <button onClick={() => setShowCode(!showCode)} style={btnOutline}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="16 18 22 12 16 6" />
                  <polyline points="8 6 2 12 8 18" />
                </svg>
                {showCode ? "Hide Code" : "View Code"}
              </button>
              <a
                href="https://www.npmjs.com/package/@ayushmaanagarwal1211/convex-offset-pagination"
                target="_blank"
                rel="noopener"
                style={{ ...btnOutline, textDecoration: "none", color: "var(--text)" }}
              >
                npm
              </a>
            </div>
          </div>
        </div>
      </header>

      {/* ── Feature Cards ── */}
      <section style={{ ...container, marginTop: -40, position: "relative", zIndex: 10 }}>
        <div style={featureGrid}>
          {FEATURES.map((f) => (
            <div key={f.title} style={featureCard}>
              <div style={featureIcon}>{f.icon}</div>
              <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 4 }}>{f.title}</div>
              <div style={{ fontSize: 13, color: "var(--text-secondary)", lineHeight: 1.5 }}>{f.desc}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Code Example (collapsible) ── */}
      {showCode && (
        <section style={{ ...container, marginTop: 32 }}>
          <CodeBlock
            title="convex/photos.ts"
            code={CODE_EXAMPLE}
          />
        </section>
      )}

      {/* ── Live Demo ── */}
      <section style={{ ...container, marginTop: 40 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20, flexWrap: "wrap", gap: 12 }}>
          <div>
            <h2 style={{ fontSize: 22, fontWeight: 700, letterSpacing: "-0.01em" }}>Live Demo</h2>
            <p style={{ fontSize: 14, color: "var(--text-secondary)", marginTop: 4 }}>
              Interact with a real Convex backend — all data is reactive.
            </p>
          </div>

          <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
            <button
              data-tour="seed"
              onClick={handleSeedData}
              disabled={seeding}
              style={{ ...btnPrimary, opacity: seeding ? 0.7 : 1, cursor: seeding ? "wait" : "pointer" }}
            >
              {seeding ? (
                <Spinner />
              ) : (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="12" y1="5" x2="12" y2="19" />
                  <line x1="5" y1="12" x2="19" y2="12" />
                </svg>
              )}
              {seeding ? "Seeding..." : "Seed 50 Photos"}
            </button>

            <div data-tour="filter">
              <select
                value={selectedAlbum ?? ""}
                onChange={(e) => {
                  setSelectedAlbum(e.target.value || undefined);
                  setPage(1);
                }}
                style={selectStyle}
              >
                <option value="">All Albums</option>
                {ALBUMS.map((a) => (
                  <option key={a} value={a}>{a}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* ── Stats Bar ── */}
        <div data-tour="stats" style={statsBar}>
          <StatItem label="Total Docs" value={totalCount ?? 0} />
          <StatDivider />
          <StatItem label="Current Page" value={result?.currentPage ?? 0} />
          <StatDivider />
          <StatItem label="Total Pages" value={result?.totalPages ?? 0} />
          <StatDivider />
          <StatItem label="Per Page" value={ITEMS_PER_PAGE} />
          <StatDivider />
          <StatItem
            label="Has Next"
            value={result?.hasNextPage ? "Yes" : "No"}
            color={result?.hasNextPage ? "var(--success)" : "var(--text-muted)"}
          />
          <StatDivider />
          <StatItem
            label="Has Prev"
            value={result?.hasPreviousPage ? "Yes" : "No"}
            color={result?.hasPreviousPage ? "var(--success)" : "var(--text-muted)"}
          />
        </div>

        {/* ── Data Table ── */}
        <div data-tour="table" style={card}>
          {!result ? (
            <div style={emptyState}>
              <Spinner />
              <p style={{ color: "var(--text-muted)", marginTop: 12 }}>Loading...</p>
            </div>
          ) : result.items.length === 0 ? (
            <div style={emptyState}>
              <div style={{ fontSize: 40, marginBottom: 8 }}>
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="1.5">
                  <rect x="3" y="3" width="18" height="18" rx="2" />
                  <line x1="3" y1="9" x2="21" y2="9" />
                  <line x1="9" y1="21" x2="9" y2="9" />
                </svg>
              </div>
              <p style={{ fontWeight: 600, color: "var(--text)", fontSize: 15 }}>No data yet</p>
              <p style={{ color: "var(--text-secondary)", fontSize: 13, maxWidth: 320, lineHeight: 1.5 }}>
                Click <strong>"Seed 50 Photos"</strong> above to populate the table and see offset pagination in action.
              </p>
            </div>
          ) : (
            <>
              {/* Table header */}
              <div style={tableHeader}>
                <div style={{ ...tableCell, width: 56 }}>#</div>
                <div style={{ ...tableCell, flex: 1 }}>Caption</div>
                <div style={{ ...tableCell, width: 120 }}>Album</div>
                <div style={{ ...tableCell, width: 80, textAlign: "right" }}>Actions</div>
              </div>

              {/* Table rows */}
              {result.items.map((photo, idx) => (
                <div key={photo._id} style={tableRow}>
                  <div style={{ ...tableCell, width: 56, color: "var(--text-muted)", fontVariantNumeric: "tabular-nums" }}>
                    {(page - 1) * ITEMS_PER_PAGE + idx + 1}
                  </div>
                  <div style={{ ...tableCell, flex: 1, fontWeight: 500 }}>
                    {photo.caption ?? "Untitled"}
                  </div>
                  <div style={{ ...tableCell, width: 120 }}>
                    <span style={badge(ALBUM_COLORS[photo.albumId] ?? "primary")}>
                      {photo.albumId}
                    </span>
                  </div>
                  <div style={{ ...tableCell, width: 80, textAlign: "right" }}>
                    <button onClick={() => removePhoto({ id: photo._id })} style={btnDanger}>
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </>
          )}
        </div>

        {/* ── Pagination Controls ── */}
        {result && result.totalPages > 0 && (
          <div data-tour="pagination" style={paginationBar}>
            {/* Previous */}
            <button
              disabled={!result.hasPreviousPage}
              onClick={() => navigateToPage(page - 1)}
              style={paginationBtn(!result.hasPreviousPage)}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <polyline points="15 18 9 12 15 6" />
              </svg>
              Prev
            </button>

            {/* Page numbers */}
            <div style={{ display: "flex", gap: 4, alignItems: "center" }}>
              {generatePageNumbers().map((p, i) =>
                p === "..." ? (
                  <span key={`e-${i}`} style={{ padding: "0 4px", color: "var(--text-muted)", fontSize: 13 }}>
                    ...
                  </span>
                ) : (
                  <button
                    key={p}
                    onClick={() => navigateToPage(p)}
                    style={pageNumBtn(p === page)}
                  >
                    {p}
                  </button>
                ),
              )}
            </div>

            {/* Next */}
            <button
              disabled={!result.hasNextPage}
              onClick={() => navigateToPage(page + 1)}
              style={paginationBtn(!result.hasNextPage)}
            >
              Next
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <polyline points="9 18 15 12 9 6" />
              </svg>
            </button>

            {/* Jump to page */}
            <div style={{ marginLeft: "auto", display: "flex", gap: 8, alignItems: "center" }}>
              <span style={{ fontSize: 13, color: "var(--text-secondary)" }}>Go to</span>
              <input
                type="number"
                min={1}
                max={result.totalPages}
                placeholder={String(page)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    const val = parseInt((e.target as HTMLInputElement).value, 10);
                    if (val >= 1 && val <= result.totalPages) navigateToPage(val);
                  }
                }}
                style={{ ...inputStyle, width: 56, textAlign: "center", fontSize: 13 }}
              />
            </div>
          </div>
        )}

        {/* ── Response Preview ── */}
        {result && result.items.length > 0 && (
          <div style={{ marginTop: 24 }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: "var(--text-secondary)", marginBottom: 8 }}>
              API Response Shape
            </div>
            <CodeBlock
              title="paginate() response"
              code={JSON.stringify(
                {
                  items: `[...${result.items.length} documents]`,
                  totalCount: result.totalCount,
                  totalPages: result.totalPages,
                  currentPage: result.currentPage,
                  hasNextPage: result.hasNextPage,
                  hasPreviousPage: result.hasPreviousPage,
                },
                null,
                2,
              ).replace(/"/g, "").replace("...5 documents", `...${result.items.length} documents`)}
            />
          </div>
        )}
      </section>

      {/* ── How It Works ── */}
      <section style={{ ...container, marginTop: 56 }}>
        <h2 style={{ fontSize: 22, fontWeight: 700, letterSpacing: "-0.01em", marginBottom: 8 }}>How It Works</h2>
        <p style={{ fontSize: 14, color: "var(--text-secondary)", marginBottom: 24, maxWidth: 560 }}>
          Under the hood, a B-tree index is maintained alongside your table. Here's the flow for each page request:
        </p>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 16 }}>
          {HOW_IT_WORKS.map((step, i) => (
            <div key={i} style={{ ...card, padding: "20px 20px 16px" }}>
              <div style={stepNumber}>{i + 1}</div>
              <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 4 }}>{step.title}</div>
              <div style={{ fontSize: 13, color: "var(--text-secondary)", lineHeight: 1.5 }}>{step.desc}</div>
              <div style={{ marginTop: 8 }}>
                <span style={badge(step.perf === "O(log n)" ? "success" : "warning")}>{step.perf}</span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Footer ── */}
      <footer style={{ ...container, marginTop: 64, paddingBottom: 40, textAlign: "center" }}>
        <div style={{ borderTop: "1px solid var(--border)", paddingTop: 24 }}>
          <p style={{ fontSize: 13, color: "var(--text-muted)" }}>
            Built with Convex. View source and documentation on{" "}
            <a
              href="https://github.com/ayushmaanagarwal1211/convex-offset-pagination"
              target="_blank"
              rel="noopener"
              style={{ color: "var(--primary)", textDecoration: "none", fontWeight: 500 }}
            >
              GitHub
            </a>
            .
          </p>
        </div>
      </footer>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function StatItem({ label, value, color }: { label: string; value: string | number; color?: string }) {
  return (
    <div style={{ textAlign: "center", minWidth: 80 }}>
      <div style={{ fontSize: 11, fontWeight: 500, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 2 }}>
        {label}
      </div>
      <div style={{ fontSize: 20, fontWeight: 700, color: color ?? "var(--text)", fontVariantNumeric: "tabular-nums" }}>
        {value}
      </div>
    </div>
  );
}

function StatDivider() {
  return <div style={{ width: 1, height: 36, background: "var(--border)" }} />;
}

function Spinner() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ animation: "spin 1s linear infinite" }}>
      <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
      <circle cx="12" cy="12" r="10" opacity="0.25" />
      <path d="M12 2a10 10 0 0 1 10 10" />
    </svg>
  );
}

// ---------------------------------------------------------------------------
// Static data
// ---------------------------------------------------------------------------

const FEATURES = [
  {
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--primary)" strokeWidth="2">
        <rect x="3" y="3" width="7" height="7" />
        <rect x="14" y="3" width="7" height="7" />
        <rect x="3" y="14" width="7" height="7" />
        <rect x="14" y="14" width="7" height="7" />
      </svg>
    ),
    title: "Page Numbers",
    desc: "Jump to any page directly. No cursor tokens needed.",
  },
  {
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--primary)" strokeWidth="2">
        <circle cx="12" cy="12" r="10" />
        <polyline points="12 6 12 12 16 14" />
      </svg>
    ),
    title: "O(log n) Count",
    desc: "Total count without scanning. Powered by a B-tree index.",
  },
  {
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--primary)" strokeWidth="2">
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
        <path d="M16 3.13a4 4 0 0 1 0 7.75" />
      </svg>
    ),
    title: "Namespaces",
    desc: "Paginate per-user, per-album, or any subset independently.",
  },
  {
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--primary)" strokeWidth="2">
        <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
      </svg>
    ),
    title: "Real-Time",
    desc: "Counts and pages update instantly when data changes.",
  },
];

const HOW_IT_WORKS = [
  { title: "Get Count", desc: "Traverse the B-tree to get total documents matching the namespace.", perf: "O(log n)" },
  { title: "Calculate Offset", desc: "Compute start position: (page - 1) x limit.", perf: "O(1)" },
  { title: "Fetch IDs", desc: "Use at() for each position in the page range to get document IDs.", perf: "O(log n)" },
  { title: "Hydrate Docs", desc: "Load full documents by ID from the Convex database.", perf: "O(page)" },
];

const CODE_EXAMPLE = `import { OffsetPagination } from "@ayushmaanagarwal1211/convex-offset-pagination";
import { components } from "./_generated/api";
import { DataModel } from "./_generated/dataModel";

const paginated = new OffsetPagination<DataModel, "photos">(
  components.aggregate,
  {
    sortKey: (doc) => doc._creationTime,
    namespace: (doc) => doc.albumId,   // optional
  },
);

// In your query:
export const list = query({
  args: { page: v.number(), limit: v.number() },
  handler: async (ctx, args) => {
    return paginated.paginate(ctx, "photos", {
      page: args.page,
      limit: args.limit,
    });
    // Returns: { items, totalCount, totalPages,
    //            currentPage, hasNextPage, hasPreviousPage }
  },
});

// In your mutations — keep aggregate in sync:
export const add = mutation({
  args: { url: v.string(), albumId: v.string() },
  handler: async (ctx, args) => {
    const id = await ctx.db.insert("photos", args);
    const doc = (await ctx.db.get(id))!;
    await paginated.insert(ctx, doc);
    return id;
  },
});`;

// ---------------------------------------------------------------------------
// Style objects
// ---------------------------------------------------------------------------

const heroSection: CSSProperties = {
  background: "linear-gradient(180deg, #f8fafc 0%, var(--bg) 100%)",
  borderBottom: "1px solid var(--border-light)",
  padding: "48px 0 80px",
};

const featureGrid: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
  gap: 16,
};

const featureCard: CSSProperties = {
  background: "var(--surface)",
  border: "1px solid var(--border)",
  borderRadius: "var(--radius-lg)",
  padding: "20px",
  boxShadow: "var(--shadow-sm)",
};

const featureIcon: CSSProperties = {
  width: 36,
  height: 36,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  background: "var(--primary-light)",
  borderRadius: 8,
  marginBottom: 12,
};

const statsBar: CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  gap: 24,
  padding: "16px 24px",
  background: "var(--surface)",
  border: "1px solid var(--border)",
  borderRadius: "var(--radius-lg)",
  marginBottom: 16,
  boxShadow: "var(--shadow-sm)",
  flexWrap: "wrap",
};

const tableHeader: CSSProperties = {
  display: "flex",
  alignItems: "center",
  padding: "0 20px",
  height: 44,
  background: "#f8fafc",
  borderBottom: "1px solid var(--border)",
  fontSize: 12,
  fontWeight: 600,
  color: "var(--text-secondary)",
  textTransform: "uppercase",
  letterSpacing: "0.05em",
};

const tableRow: CSSProperties = {
  display: "flex",
  alignItems: "center",
  padding: "0 20px",
  height: 52,
  borderBottom: "1px solid var(--border-light)",
  fontSize: 14,
  transition: "background 0.1s ease",
};

const tableCell: CSSProperties = {
  padding: "0 8px",
  overflow: "hidden",
  textOverflow: "ellipsis",
  whiteSpace: "nowrap",
};

const paginationBar: CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 8,
  padding: "16px 0",
  flexWrap: "wrap",
};

const paginationBtn = (disabled: boolean): CSSProperties => ({
  display: "inline-flex",
  alignItems: "center",
  gap: 4,
  padding: "8px 14px",
  fontSize: 13,
  fontWeight: 500,
  fontFamily: "var(--font)",
  color: disabled ? "var(--text-muted)" : "var(--text)",
  background: "var(--surface)",
  border: "1px solid var(--border)",
  borderRadius: "var(--radius-sm)",
  cursor: disabled ? "not-allowed" : "pointer",
  opacity: disabled ? 0.5 : 1,
});

const pageNumBtn = (active: boolean): CSSProperties => ({
  width: 36,
  height: 36,
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  fontSize: 13,
  fontWeight: active ? 600 : 400,
  fontFamily: "var(--font)",
  color: active ? "#fff" : "var(--text)",
  background: active ? "var(--primary)" : "var(--surface)",
  border: active ? "none" : "1px solid var(--border)",
  borderRadius: "var(--radius-sm)",
  cursor: "pointer",
});

const stepNumber: CSSProperties = {
  width: 28,
  height: 28,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  fontSize: 13,
  fontWeight: 700,
  color: "var(--primary)",
  background: "var(--primary-light)",
  borderRadius: "50%",
  marginBottom: 12,
};

const emptyState: CSSProperties = {
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  justifyContent: "center",
  padding: "56px 24px",
  textAlign: "center",
};
