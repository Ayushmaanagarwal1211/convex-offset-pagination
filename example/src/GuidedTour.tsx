import { useState, useEffect, CSSProperties } from "react";

interface TourStep {
  target: string;
  title: string;
  description: string;
  position: "top" | "bottom" | "left" | "right";
}

const TOUR_STEPS: TourStep[] = [
  {
    target: "[data-tour='seed']",
    title: "1. Seed Test Data",
    description:
      "Start by adding sample data. This inserts 50 photos across 4 albums — each insert also syncs the aggregate index for O(log n) pagination.",
    position: "bottom",
  },
  {
    target: "[data-tour='filter']",
    title: "2. Filter by Namespace",
    description:
      "Namespaces let you paginate subsets independently. Filtering by album uses the namespace feature — counts and pages update instantly.",
    position: "bottom",
  },
  {
    target: "[data-tour='stats']",
    title: "3. Real-Time Stats",
    description:
      "Total count is always available in O(log n) — no full table scan. The response includes totalPages, currentPage, and navigation flags.",
    position: "bottom",
  },
  {
    target: "[data-tour='table']",
    title: "4. Paginated Results",
    description:
      "Each page fetches only the items at the requested offset. Delete a row and watch the counts and pages recalculate in real-time.",
    position: "top",
  },
  {
    target: "[data-tour='pagination']",
    title: "5. Page Navigation",
    description:
      "Navigate with Previous/Next, jump to any page directly, or use page number buttons. This is what offset pagination enables — something cursor-based can't do.",
    position: "top",
  },
];

const STORAGE_KEY = "offset-pagination-tour-completed";

export function GuidedTour() {
  const [currentStep, setCurrentStep] = useState(-1);
  const [tooltipStyle, setTooltipStyle] = useState<CSSProperties>({});
  const [arrowStyle, setArrowStyle] = useState<CSSProperties>({});

  const tourCompleted = localStorage.getItem(STORAGE_KEY) === "true";
  const isActive = currentStep >= 0 && currentStep < TOUR_STEPS.length;

  useEffect(() => {
    if (!isActive) return;

    const step = TOUR_STEPS[currentStep];
    const el = document.querySelector(step.target);
    if (!el) return;

    const rect = el.getBoundingClientRect();
    const scrollY = window.scrollY;
    const tooltipWidth = 340;

    el.scrollIntoView({ behavior: "smooth", block: "center" });

    const highlight = el as HTMLElement;
    highlight.style.position = "relative";
    highlight.style.zIndex = "1001";
    highlight.style.boxShadow = "0 0 0 4px rgba(99, 102, 241, 0.25)";
    highlight.style.borderRadius = "8px";
    highlight.style.transition = "box-shadow 0.3s ease";

    let top = 0;
    let left = rect.left + rect.width / 2 - tooltipWidth / 2;
    left = Math.max(16, Math.min(left, window.innerWidth - tooltipWidth - 16));

    if (step.position === "bottom") {
      top = rect.bottom + scrollY + 16;
    } else {
      top = rect.top + scrollY - 16;
    }

    setTooltipStyle({
      position: "absolute",
      top,
      left,
      width: tooltipWidth,
      transform: step.position === "top" ? "translateY(-100%)" : undefined,
    });

    const arrowLeft = rect.left + rect.width / 2 - left - 8;
    setArrowStyle({
      left: Math.max(16, Math.min(arrowLeft, tooltipWidth - 32)),
      [step.position === "bottom" ? "top" : "bottom"]: -8,
      transform: step.position === "top" ? "rotate(180deg)" : undefined,
    });

    return () => {
      highlight.style.zIndex = "";
      highlight.style.boxShadow = "";
      highlight.style.position = "";
    };
  }, [currentStep, isActive]);

  const startTour = () => setCurrentStep(0);

  const endTour = () => {
    setCurrentStep(-1);
    localStorage.setItem(STORAGE_KEY, "true");
  };

  const nextStep = () => {
    if (currentStep < TOUR_STEPS.length - 1) {
      setCurrentStep((s) => s + 1);
    } else {
      endTour();
    }
  };

  const prevStep = () => {
    if (currentStep > 0) setCurrentStep((s) => s - 1);
  };

  if (!isActive) {
    return (
      <button
        onClick={startTour}
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 6,
          padding: "8px 16px",
          fontSize: 13,
          fontWeight: 500,
          fontFamily: "var(--font)",
          color: "var(--primary)",
          background: "var(--primary-light)",
          border: "1px solid var(--primary-border)",
          borderRadius: "var(--radius-sm)",
          cursor: "pointer",
        }}
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
          <circle cx="12" cy="12" r="10" />
          <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
          <line x1="12" y1="17" x2="12.01" y2="17" />
        </svg>
        {tourCompleted ? "Replay Tour" : "Take a Tour"}
      </button>
    );
  }

  const step = TOUR_STEPS[currentStep];

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={endTour}
        style={{
          position: "fixed",
          inset: 0,
          background: "rgba(0,0,0,0.3)",
          backdropFilter: "blur(2px)",
          zIndex: 1000,
          transition: "opacity 0.2s ease",
        }}
      />

      {/* Tooltip */}
      <div
        style={{
          ...tooltipStyle,
          zIndex: 1002,
          background: "#fff",
          borderRadius: 12,
          boxShadow: "0 20px 40px rgba(0,0,0,0.15), 0 0 0 1px rgba(0,0,0,0.05)",
          padding: 0,
          animation: "fadeIn 0.2s ease",
        }}
      >
        {/* Arrow */}
        <div
          style={{
            ...arrowStyle,
            position: "absolute",
            width: 0,
            height: 0,
            borderLeft: "8px solid transparent",
            borderRight: "8px solid transparent",
            borderBottom: "8px solid #fff",
          }}
        />

        {/* Progress bar */}
        <div style={{ height: 3, background: "#f1f5f9", borderRadius: "12px 12px 0 0" }}>
          <div
            style={{
              height: "100%",
              width: `${((currentStep + 1) / TOUR_STEPS.length) * 100}%`,
              background: "var(--primary)",
              borderRadius: "12px 12px 0 0",
              transition: "width 0.3s ease",
            }}
          />
        </div>

        <div style={{ padding: "16px 20px" }}>
          <div style={{ fontSize: 11, fontWeight: 600, color: "var(--primary)", marginBottom: 4, textTransform: "uppercase", letterSpacing: "0.05em" }}>
            Step {currentStep + 1} of {TOUR_STEPS.length}
          </div>
          <div style={{ fontSize: 15, fontWeight: 600, color: "var(--text)", marginBottom: 6 }}>
            {step.title}
          </div>
          <div style={{ fontSize: 13, color: "var(--text-secondary)", lineHeight: 1.6 }}>
            {step.description}
          </div>
        </div>

        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            padding: "12px 20px",
            borderTop: "1px solid var(--border-light)",
            background: "#fafbfc",
            borderRadius: "0 0 12px 12px",
          }}
        >
          <button
            onClick={endTour}
            style={{
              fontSize: 12,
              color: "var(--text-muted)",
              background: "none",
              border: "none",
              cursor: "pointer",
              fontFamily: "var(--font)",
            }}
          >
            Skip tour
          </button>
          <div style={{ display: "flex", gap: 8 }}>
            {currentStep > 0 && (
              <button
                onClick={prevStep}
                style={{
                  padding: "6px 14px",
                  fontSize: 13,
                  fontWeight: 500,
                  fontFamily: "var(--font)",
                  background: "#fff",
                  border: "1px solid var(--border)",
                  borderRadius: "var(--radius-sm)",
                  cursor: "pointer",
                  color: "var(--text)",
                }}
              >
                Back
              </button>
            )}
            <button
              onClick={nextStep}
              style={{
                padding: "6px 14px",
                fontSize: 13,
                fontWeight: 600,
                fontFamily: "var(--font)",
                background: "var(--primary)",
                color: "#fff",
                border: "none",
                borderRadius: "var(--radius-sm)",
                cursor: "pointer",
              }}
            >
              {currentStep === TOUR_STEPS.length - 1 ? "Finish" : "Next"}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
