import { CSSProperties } from "react";

// ---------------------------------------------------------------------------
// Shared style helpers (inline styles to avoid CSS tooling in the demo)
// ---------------------------------------------------------------------------

export const container: CSSProperties = {
  maxWidth: 960,
  margin: "0 auto",
  padding: "0 24px",
};

export const card: CSSProperties = {
  background: "var(--surface)",
  border: "1px solid var(--border)",
  borderRadius: "var(--radius-lg)",
  boxShadow: "var(--shadow)",
  overflow: "hidden",
};

export const badge = (
  color: "primary" | "success" | "warning" | "danger" = "primary",
): CSSProperties => {
  const map = {
    primary: { bg: "var(--primary-light)", text: "var(--primary)", border: "var(--primary-border)" },
    success: { bg: "var(--success-light)", text: "var(--success)", border: "#a7f3d0" },
    warning: { bg: "var(--warning-light)", text: "#b45309", border: "#fde68a" },
    danger: { bg: "var(--danger-light)", text: "var(--danger)", border: "var(--danger-border)" },
  };
  const c = map[color];
  return {
    display: "inline-flex",
    alignItems: "center",
    padding: "2px 10px",
    fontSize: 12,
    fontWeight: 500,
    borderRadius: 99,
    background: c.bg,
    color: c.text,
    border: `1px solid ${c.border}`,
    lineHeight: "20px",
  };
};

export const btnPrimary: CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  gap: 8,
  padding: "10px 20px",
  fontSize: 14,
  fontWeight: 600,
  fontFamily: "var(--font)",
  color: "#fff",
  background: "var(--primary)",
  border: "none",
  borderRadius: "var(--radius)",
  cursor: "pointer",
  transition: "all 0.15s ease",
  boxShadow: "0 1px 2px rgba(99, 102, 241, 0.3)",
};

export const btnOutline: CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  gap: 6,
  padding: "8px 16px",
  fontSize: 13,
  fontWeight: 500,
  fontFamily: "var(--font)",
  color: "var(--text)",
  background: "var(--surface)",
  border: "1px solid var(--border)",
  borderRadius: "var(--radius-sm)",
  cursor: "pointer",
  transition: "all 0.15s ease",
};

export const btnDanger: CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  padding: "6px 12px",
  fontSize: 12,
  fontWeight: 500,
  fontFamily: "var(--font)",
  color: "var(--danger)",
  background: "var(--danger-light)",
  border: "1px solid var(--danger-border)",
  borderRadius: "var(--radius-sm)",
  cursor: "pointer",
  transition: "all 0.15s ease",
};

export const input: CSSProperties = {
  padding: "8px 12px",
  fontSize: 14,
  fontFamily: "var(--font)",
  border: "1px solid var(--border)",
  borderRadius: "var(--radius-sm)",
  outline: "none",
  transition: "border-color 0.15s ease",
  background: "var(--surface)",
};

export const select: CSSProperties = {
  ...input,
  cursor: "pointer",
  appearance: "none" as const,
  backgroundImage:
    'url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'12\' height=\'12\' viewBox=\'0 0 12 12\'%3E%3Cpath fill=\'%2364748b\' d=\'M6 8L1 3h10z\'/%3E%3C/svg%3E")',
  backgroundRepeat: "no-repeat",
  backgroundPosition: "right 10px center",
  paddingRight: 32,
};
