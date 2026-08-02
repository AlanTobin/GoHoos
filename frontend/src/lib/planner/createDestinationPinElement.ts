export function createDestinationPinElement(): HTMLDivElement {
  const root = document.createElement("div");
  root.className = "flex cursor-grab flex-col items-center active:cursor-grabbing";
  root.innerHTML = `
    <div class="flex size-10 items-center justify-center rounded-full bg-[#E57200] shadow-lg ring-4 ring-white">
      <div class="size-3 rounded-full bg-white"></div>
    </div>
    <div class="mt-1 h-3 w-0.5 rounded-full bg-[#232D4B]/80"></div>
    <div class="size-2 rotate-45 bg-[#232D4B]/80"></div>
  `;
  return root;
}
