"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import AppScreenshot from "@/components/about/AppScreenshot";
import RoutesShowcase from "@/components/about/RoutesShowcase";
import SectionBusLayer from "@/components/about/illustrations/SectionBusLayer";
import FlowingRoutePath, {
  routeBadgeTextColor,
  SECTION_ROUTE_COLORS,
} from "@/components/about/illustrations/FlowingRoutePath";
import { SectionShell, SectionTextPanel } from "@/components/about/illustrations/SectionDecoration";
import PageBackdrop from "@/components/layout/PageBackdrop";

type StepId = "why" | "plan" | "routes" | "track" | "capacity" | "next";

interface Step {
  id: StepId;
  label: string;
  title: string;
  badge?: string;
  body: ReactNode;
  visual?: ReactNode;
  wideVisual?: boolean;
}

function RoutesVisual() {
  return <RoutesShowcase />;
}

const STEPS: Step[] = [
  {
    id: "why",
    label: "Why GoHoos",
    title: "Why was GoHoos built?",
    body: (
      <>
        <p>
          Hey there! I&apos;m Alan, and I&apos;m a rising third-year at UVA. This project was inspired by my experience living off Grounds after
          my first year at UVA and relying on the university bus system to get
          to class. That was when my journey with the university bus system began.
          If you use TransLoc, you know that it is not the most user-friendly. You definitely have 
          to do a lot of digging around and it often feels overwhelming especially at the start. 
          I remember being frustrated and struggling to answer questions such as
          which bus to take, when to leave, and how bus routes connect across Grounds
          and the surrounding Charlottesville area.
        </p>
        <p>
          The goal of this project is to make it more accessible for first time riders and provide a more user-friendly experience alongside
          better analytics and decision-making tools.
          <br />
          <br />
           <span className="font-medium text-uva-navy bullet-list">
           Please keep in mind that this app is not intended to be a replacement for TransLoc. Since I am not affiliated with the university, a lot of features that are available on TransLoc are not available here (example: SafeRide)
           </span>
        <br />
        <br />
          Feel free to scroll down to see what I have built so far and what I am working on next.
        </p>
      </>
    ),
  },
  {
    id: "plan",
    label: "Plan a trip",
    title: "Start & Stop Selection",
    body: (
      <>
        <p>
          Not every rider knows which UTS line they need, especially if you&apos;re
          new to Grounds or heading somewhere you&apos;ve never taken the bus before.
          Instead of boggling down in route details, the home page will recommend
          the best routes to take based on your starting and destination stops.
        </p>
        <p>
          Get rid of the hassle of figuring out which routes to take and just let the app do the work for you.
        </p>
      </>
    ),
  },
  {
    id: "routes",
    label: "Routes Explorer",
    title: "Routes Explorer",
    body: (
      <>
        <p>
          The Routes page is built around UVA Transportation Services (UTS)
          and the major bus routes that connect Grounds, North Grounds,
          student neighborhoods, and key destinations around Charlottesville.
          Routes like the Gold Line, Green Line, Orange Line, and Silver Line
          are all listed in one place, along with seasonal and event-specific
          shuttles, so you can quickly learn what options are available to you.
        </p>
        <p>Routes are organized into two tabs:</p>
        <ul className="list-disc space-y-2 pl-5">
          <li>
            <strong className="font-medium text-uva-navy"> Tab 1: Active </strong>{" "}
            — routes with buses currently on the road. These are the routes
            you can actually ride right now.
          </li>
          <li>
            <strong className="font-medium text-uva-navy"> Tab 2: Inactive </strong>{" "}
            — routes defined in the system but not currently running, such
            as lines that only operate at night, on weekends, or during
            special events.
          </li>
        </ul>
        <p>
          Selecting a route highlights its path and stops on the map. You can
          search routes by name, toggle individual routes on and off, or highlight
          everything at once to see how the full UTS network fits together
          across Grounds and the surrounding area.
        </p>
        <Link
          href="/routes"
          className="inline-flex rounded-lg bg-uva-orange px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-uva-orange-hover"
        >
          View live routes
        </Link>
      </>
    ),
    visual: <RoutesVisual />,
    wideVisual: true,
  },
  {
    id: "track",
    label: "Live tracking",
    title: "Real-Time Bus Tracking",
    body: (
      <>
        <p>
          Live vehicle positions are pulled from UVA&apos;s transit feed and
          refreshed every 5 seconds. Each bus appears on the map as a
          color-coded marker matched to its route, so you can see exactly
          where buses are at any moment, not just where they&apos;re supposed to be.
        </p>
        <p>
          Click a bus to open a detail popup with its route name, current
          speed, and when its position was last updated. When you first load
          the map, routes with active buses are automatically selected so
          you start with a live view of what&apos;s actually running.
        </p>
      </>
    ),
  },
  {
    id: "capacity",
    label: "Bus capacity",
    title: "Bus Capacity",
    body: (
      <>
        <p>
          <span className="font-medium text-uva-navy">
            (This is for all my people who park at JPJ, live at Faulkner, and{" "}
            <strong>especially live at Lambeth.</strong>)
          </span>
        </p>
        <p>
          Waiting at the stop just for a bus that is already full is not fun. When it passes by, you have two choices:
          walk to your destination or wait for the next bus. You just wasted your time waiting for a bus that never stopped for you.
        </p>
        <p>
          GoHoos shows a popup with the exact passenger count (for example, 12 / 50
          passengers) along with a timestamp for when occupancy was last
          reported, so you can stay informed and not waste your time.
        </p>
      </>
    ),
    visual: (
      <AppScreenshot
        src="/about/capacity-popup.png"
        alt="GoHoos bus popup showing Gold Line passenger count and last updated time"
        caption="Passenger count and last updated time at a glance"
        className="max-w-sm"
      />
    ),
  },
  {
    id: "next",
    label: "In progress",
    title: "In Progress",
    body: (
      <>
        <p>
          A few features that I'm currently working on:
        </p>
        <ul className="space-y-3">
          <li className="rounded-lg border border-uva-navy/10 bg-white p-4">
            <strong className="block font-semibold text-uva-navy">
              Home page start &amp; stop selection
            </strong>
            <span className="mt-1 block text-sm">
              Pick where you&apos;re leaving from and where you&apos;re going on
              the home page so you can see the best routes to take.
            </span>
          </li>
          <li className="rounded-lg border border-uva-navy/10 bg-white p-4">
            <strong className="block font-semibold text-uva-navy">
              More accurate ETAs
            </strong>
            <span className="mt-1 block text-sm">
              Improved arrival-time estimates that account for real traffic,
              dwell time at stops, and current vehicle speed, so you know when to
              leave rather than TransLoc&apos;s rule-based "X minutes for each 100 yards" ETA.
            </span>
          </li>
          <li className="rounded-lg border border-uva-navy/10 bg-white p-4">
            <strong className="block font-semibold text-uva-navy">
              Break notifications
            </strong>
            <span className="mt-1 block text-sm">
              Alerts when a bus is on break or temporarily out of service, so
              you aren&apos;t just left waiting at a stop for a vehicle that
              isn&apos;t coming for a while.
            </span>
          </li>
        </ul>
      </>
    ),
  },
];

function StepNavButton({
  step,
  index,
  isActive,
  onClick,
  compact = false,
}: {
  step: Step;
  index: number;
  isActive: boolean;
  onClick: () => void;
  compact?: boolean;
}) {
  const routeColor = SECTION_ROUTE_COLORS[index % SECTION_ROUTE_COLORS.length];

  return (
    <button
      type="button"
      onClick={onClick}
      aria-current={isActive ? "step" : undefined}
      className={`group flex w-full items-center gap-3 rounded-lg text-left transition-colors ${
        compact ? "shrink-0 px-3 py-2" : "px-2 py-3"
      } ${isActive ? "text-uva-navy" : "text-uva-navy/50 hover:text-uva-navy/80"}`}
    >
      <span
        className={`flex size-8 shrink-0 items-center justify-center rounded-full text-sm font-semibold transition-all duration-300 ${
          isActive ? "shadow-sm" : "bg-uva-navy/10 text-uva-navy/55 group-hover:bg-uva-navy/15"
        }`}
        style={
          isActive
            ? { backgroundColor: routeColor, color: routeBadgeTextColor(routeColor) }
            : undefined
        }
      >
        {index + 1}
      </span>
      <span
        className={`text-sm leading-snug ${isActive ? "font-semibold" : "font-normal"} ${
          compact ? "whitespace-nowrap" : ""
        }`}
      >
        {step.label}
      </span>
    </button>
  );
}

export default function AboutExperience() {
  const [activeStepId, setActiveStepId] = useState<StepId>("why");
  const [flowContainer, setFlowContainer] = useState<HTMLElement | null>(null);
  const sectionRefs = useRef<Map<StepId, HTMLElement>>(new Map());
  const headingRefs = useRef<Map<StepId, HTMLElement>>(new Map());
  const isScrollingRef = useRef(false);

  const scrollToStep = useCallback((id: StepId) => {
    const section = sectionRefs.current.get(id);
    if (!section) return;

    isScrollingRef.current = true;
    setActiveStepId(id);
    section.scrollIntoView({ behavior: "smooth", block: "start" });

    window.setTimeout(() => {
      isScrollingRef.current = false;
    }, 800);
  }, []);

  useEffect(() => {
    const scrollRoot = document.querySelector("main");
    const headings = STEPS.map((step) => headingRefs.current.get(step.id)).filter(
      Boolean
    ) as HTMLElement[];

    if (!scrollRoot || headings.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (isScrollingRef.current) return;

        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);

        const topEntry = visible[0];
        if (topEntry?.target.id) {
          setActiveStepId(topEntry.target.id.replace("about-heading-", "") as StepId);
        }
      },
      {
        root: scrollRoot,
        rootMargin: "-20% 0px -65% 0px",
        threshold: 0,
      }
    );

    for (const heading of headings) {
      observer.observe(heading);
    }

    return () => observer.disconnect();
  }, []);

  return (
    <div className="relative isolate min-h-full">
      <PageBackdrop variant="about" />

      <div
        ref={setFlowContainer}
        className="relative z-10 mx-auto max-w-6xl px-4 py-10 sm:px-6 sm:py-14 lg:px-8"
      >
      <header className="relative z-10 mx-auto max-w-2xl text-center">
        <h1 className="text-6xl font-semibold tracking-tight text-uva-navy">
          About
        </h1>
        <p className="mt-4 text-base leading-relaxed text-uva-navy/65 sm:text-lg">
        </p>
      </header>

      <nav
        aria-label="Page sections"
        className="sticky top-0 z-10 -mx-4 mt-8 border-b border-uva-navy/10 bg-[#fafafa]/95 px-4 py-3 backdrop-blur-sm lg:hidden"
      >
        <div className="flex gap-1 overflow-x-auto [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {STEPS.map((step, index) => (
            <StepNavButton
              key={step.id}
              step={step}
              index={index}
              isActive={activeStepId === step.id}
              onClick={() => scrollToStep(step.id)}
              compact
            />
          ))}
        </div>
      </nav>

      <div className="relative z-10 mt-8 flex gap-10 overflow-visible lg:mt-12 lg:gap-16">
        <nav
          aria-label="Page sections"
          className="sticky top-28 z-10 hidden h-fit w-52 shrink-0 overflow-visible lg:block xl:w-56"
        >
          <ul className="space-y-1">
            {STEPS.map((step, index) => (
              <li key={step.id}>
                <StepNavButton
                  step={step}
                  index={index}
                  isActive={activeStepId === step.id}
                  onClick={() => scrollToStep(step.id)}
                />
              </li>
            ))}
          </ul>
        </nav>

        <div className="relative z-10 min-w-0 flex-1">
          {STEPS.map((step, index) => (
            <div key={step.id}>
              <SectionShell
                variant={step.id}
                className={index < STEPS.length - 1 ? "mb-10 sm:mb-12 lg:mb-14" : ""}
              >
                <section
                  id={step.id}
                  ref={(node) => {
                    if (node) sectionRefs.current.set(step.id, node);
                    else sectionRefs.current.delete(step.id);
                  }}
                  aria-labelledby={`about-heading-${step.id}`}
                  className="scroll-mt-28"
                >
                  <div
                    className={
                      step.wideVisual
                        ? "space-y-10"
                        : step.visual
                          ? "grid items-start gap-10 lg:grid-cols-2 lg:gap-12"
                          : "max-w-2xl"
                    }
                  >
                    <div className={step.wideVisual ? "max-w-2xl" : undefined}>
                      <SectionTextPanel>
                      <div className="flex items-center gap-3">
                        <span
                          className="flex size-10 shrink-0 items-center justify-center rounded-full text-lg font-semibold lg:hidden"
                          style={{
                            backgroundColor:
                              SECTION_ROUTE_COLORS[index % SECTION_ROUTE_COLORS.length],
                            color: routeBadgeTextColor(
                              SECTION_ROUTE_COLORS[index % SECTION_ROUTE_COLORS.length]
                            ),
                          }}
                        >
                          {index + 1}
                        </span>
                        {step.badge ? (
                          <span className="rounded-full bg-uva-orange-soft px-2.5 py-0.5 text-xs font-medium uppercase tracking-wide text-uva-orange">
                            {step.badge}
                          </span>
                        ) : null}
                      </div>

                      <h2
                        id={`about-heading-${step.id}`}
                        ref={(node) => {
                          if (node) headingRefs.current.set(step.id, node);
                          else headingRefs.current.delete(step.id);
                        }}
                        className="mt-4 text-2xl font-semibold tracking-tight text-uva-navy sm:text-3xl"
                      >
                        {step.title}
                      </h2>

                      <div className="mt-5 space-y-4 text-base leading-relaxed text-uva-navy/70">
                        {step.body}
                      </div>
                      </SectionTextPanel>
                    </div>

                    {step.visual ? (
                      <div
                        className={
                          step.wideVisual
                            ? "mx-auto w-full max-w-3xl"
                            : "flex justify-center lg:justify-end"
                        }
                      >
                        {step.visual}
                      </div>
                    ) : null}
                  </div>
                </section>
              </SectionShell>
            </div>
          ))}

        </div>
      </div>

        <FlowingRoutePath
          container={flowContainer}
          headingRefs={headingRefs}
          stepIds={STEPS.map((step) => step.id)}
          activeStepId={activeStepId}
        />
        <SectionBusLayer
          container={flowContainer}
          sectionRefs={sectionRefs}
          stepIds={STEPS.map((step) => step.id)}
          activeStepId={activeStepId}
        />
        <footer className="relative z-10 mt-10 space-y-4 border-t border-uva-navy/10 pt-10 text-base leading-relaxed text-uva-navy/70">
          <p className="text-sm text-uva-navy/50">
            GoHoos is independently developed and is not affiliated with or
            endorsed by the University of Virginia, UVA Transportation, or
            TransLoc.
          </p>
        </footer>
      </div>
    </div>
  );
}
