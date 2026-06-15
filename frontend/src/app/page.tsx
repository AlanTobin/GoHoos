import Link from "next/link";
import Logo from "@/components/brand/Logo";

export default function HomePage() {
  return (
    <div className="flex min-h-full flex-col items-center justify-center px-6 py-16">
      <Logo priority className="h-24 w-auto sm:h-28" />
      <p className="mt-6 max-w-md text-center text-lg text-uva-navy/70">
        Live UVA bus tracking, routes, and stops — built for students navigating
        Grounds.
      </p>
      <Link
        href="/routes"
        className="mt-8 inline-flex items-center rounded-lg bg-uva-orange px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-uva-orange-hover"
      >
        View live routes
      </Link>
    </div>
  );
}
