import AppScreenshot from "./AppScreenshot";

export default function RoutesShowcase() {
  return (
    <div className="w-full space-y-4">
      <AppScreenshot
        src="/about/routes-map.png"
        alt="GoHoos map showing UTS route lines, stops, and live bus positions around Grounds"
        caption="Routes, stops, and live buses on the map"
      />
      <div className="grid gap-4 sm:grid-cols-2">
        <AppScreenshot
          src="/about/routes-sidebar.png"
          alt="GoHoos sidebar listing active UTS routes with color indicators"
          caption="Browse active and inactive routes"
        />
        <AppScreenshot
          src="/about/routes-search.png"
          alt="GoHoos route search filtered to Gold Line"
          caption="Search routes by name"
        />
      </div>
    </div>
  );
}
