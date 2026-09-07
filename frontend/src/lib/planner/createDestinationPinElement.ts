import type { ResolvedMapTheme } from "@/lib/mapTheme";

/** Classic teardrop pin; fill inverts with the map theme. */
export function applyDestinationPinTheme(
  root: HTMLElement,
  theme: ResolvedMapTheme
) {
  const path = root.querySelector("path");
  const circle = root.querySelector("circle");
  if (path) {
    path.setAttribute("fill", theme === "dark" ? "#E2E2E2" : "#111111");
  }
  if (circle) {
    circle.setAttribute("fill", theme === "dark" ? "#232D4B" : "#FFFFFF");
  }
}

export function createDestinationPinElement(
  theme: ResolvedMapTheme = "light"
): HTMLDivElement {
  const root = document.createElement("div");
  root.setAttribute("data-planner-dest-pin", "");
  root.className =
    "flex cursor-grab flex-col items-center active:cursor-grabbing";
  root.innerHTML = `
    <svg
      width="36"
      height="48"
      viewBox="0 0 36 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      style="filter: drop-shadow(0 2px 4px rgba(0,0,0,0.35));"
    >
      <path
        d="M18 0C8.6 0 1 7.6 1 17c0 12.8 17 31 17 31s17-18.2 17-31C35 7.6 27.4 0 18 0z"
        fill="#111111"
      />
      <circle cx="18" cy="17" r="6.5" fill="#FFFFFF" />
    </svg>
  `;
  applyDestinationPinTheme(root, theme);
  return root;
}
