import FeedbackForm from "@/components/about/FeedbackForm";
import { SectionTextPanel } from "@/components/about/illustrations/SectionDecoration";
import PageBackdrop from "@/components/layout/PageBackdrop";

export default function IssuesExperience() {
  return (
    <div className="relative min-h-full bg-uva-navy">
      <PageBackdrop variant="about" />

      <div className="relative z-10 mx-auto max-w-2xl px-4 py-10 sm:px-6 sm:py-14 lg:px-8">
        <header className="text-center">
          <h1 className="text-6xl font-semibold tracking-tight text-white">
            Issues
          </h1>
          <p className="mt-4 text-base leading-relaxed text-white/65 sm:text-lg">
            Bugs, ideas, and anything that would make catching the bus easier.
          </p>
        </header>

        <div className="mt-10">
          <SectionTextPanel>
            <h2 className="text-2xl font-semibold tracking-tight text-uva-navy sm:text-3xl">
              Send a note
            </h2>
            <div className="mt-6">
              <FeedbackForm />
            </div>
          </SectionTextPanel>
        </div>
      </div>
    </div>
  );
}
