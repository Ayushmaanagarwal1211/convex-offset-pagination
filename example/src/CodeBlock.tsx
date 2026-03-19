import { useState, CSSProperties } from "react";

interface CodeBlockProps {
  code: string;
  language?: string;
  title?: string;
}

export function CodeBlock({ code, title }: CodeBlockProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div style={wrapper}>
      {title && (
        <div style={header}>
          <span style={{ fontSize: 12, fontWeight: 500, color: "#94a3b8" }}>{title}</span>
          <button onClick={handleCopy} style={copyBtn}>
            {copied ? (
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2.5">
                <polyline points="20 6 9 17 4 12" />
              </svg>
            ) : (
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
              </svg>
            )}
            {copied ? "Copied" : "Copy"}
          </button>
        </div>
      )}
      <pre style={pre}>
        <code style={{ fontFamily: "var(--mono)", fontSize: 13, lineHeight: 1.7 }}>
          {code}
        </code>
      </pre>
    </div>
  );
}

const wrapper: CSSProperties = {
  borderRadius: "var(--radius)",
  border: "1px solid #1e293b",
  overflow: "hidden",
  background: "#0f172a",
};

const header: CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  padding: "8px 16px",
  borderBottom: "1px solid #1e293b",
  background: "#0c1222",
};

const copyBtn: CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  gap: 4,
  padding: "4px 8px",
  fontSize: 11,
  fontWeight: 500,
  fontFamily: "var(--font)",
  color: "#94a3b8",
  background: "transparent",
  border: "1px solid #334155",
  borderRadius: 4,
  cursor: "pointer",
};

const pre: CSSProperties = {
  margin: 0,
  padding: 16,
  overflowX: "auto",
  color: "#e2e8f0",
};
