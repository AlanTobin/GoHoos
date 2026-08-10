export type BoardAlightKind = "get-on" | "get-off";

/**
 * Dashed callout extending off a stop.
 * Arrow tip sits on the stop; "Get on" / "Get off" sits at the outer end.
 * Get-off is mirrored so it fans the other way.
 */
export function createBoardAlightArrowElement(
  kind: BoardAlightKind
): HTMLDivElement {
  const root = document.createElement("div");
  const label = kind === "get-on" ? "Get on" : "Get off";
  const mirror = kind === "get-off" ? "scaleX(-1)" : "none";
  const labelMirror = kind === "get-off" ? "scaleX(-1)" : "none";

  root.className = "pointer-events-none select-none";
  root.style.width = "120px";
  root.style.height = "128px";

  root.innerHTML = `
    <div style="
      position:relative;
      width:120px;
      height:128px;
      transform:${mirror};
    ">
      <svg
        width="120"
        height="128"
        viewBox="0 0 120 128"
        fill="none"
        aria-hidden="true"
        style="display:block; overflow:visible;"
      >
        <!-- Tip on the stop (bottom); stem curves out to the label -->
        <path
          d="M55 112 C55 78, 55 52, 28 28"
          stroke="#FFFFFF"
          stroke-width="3.5"
          stroke-linecap="round"
          stroke-dasharray="8 7"
          filter="drop-shadow(0 1px 2px rgba(0,0,0,0.55))"
        />
        <path
          d="M48 100 L55 114 L62 100"
          stroke="#FFFFFF"
          stroke-width="3.5"
          stroke-linecap="round"
          stroke-linejoin="round"
          fill="none"
          filter="drop-shadow(0 1px 2px rgba(0,0,0,0.55))"
        />
      </svg>
      <span style="
        position:absolute;
        top:4px;
        left:2px;
        transform:${labelMirror};
        border-radius:999px;
        background:rgba(35,45,75,0.94);
        color:#fff;
        font-size:11px;
        font-weight:700;
        letter-spacing:0.02em;
        padding:4px 9px;
        box-shadow:0 2px 6px rgba(0,0,0,0.4);
        white-space:nowrap;
      ">${label}</span>
    </div>
  `;
  return root;
}
