"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import Logo from "@/components/brand/Logo";

const NAV_ITEMS = [
  { href: "/", label: "Home" },
  { href: "/routes", label: "Routes" },
  { href: "/about", label: "About" },
] as const;

function isActive(pathname: string, href: string) {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(`${href}/`);
}

export default function AppHeader() {
  const pathname = usePathname();

  return (
    <header className="shrink-0 border-b border-uva-navy/20 bg-uva-navy">
      <div className="flex h-16 w-full items-center justify-between gap-6 px-4 sm:px-6 lg:px-8">
        <Logo linked priority className="h-12 w-auto sm:h-14" />

        <nav className="flex items-center gap-1 sm:gap-2" aria-label="Main">
          {NAV_ITEMS.map(({ href, label }) => {
            const active = isActive(pathname, href);

            return (
              <Link
                key={href}
                href={href}
                aria-current={active ? "page" : undefined}
                className={`rounded-lg px-3 py-2 text-sm font-medium transition-colors sm:px-4 ${
                  active
                    ? "bg-uva-orange text-white"
                    : "text-white/80 hover:bg-white/10 hover:text-white"
                }`}
              >
                {label}
              </Link>
            );
          })}
        </nav>
      </div>
    </header>
  );
}
