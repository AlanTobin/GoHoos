export default function AboutPage() {
  return (
    <article className="mx-auto max-w-3xl px-6 py-12">
      <h1 className="text-3xl font-semibold tracking-tight text-uva-navy">
        About
      </h1>

      <div className="mt-6 space-y-4 text-base leading-relaxed text-uva-navy/70">
        <p>
          This project was inspired by my experience living off Grounds after
          my first year at UVA and relying on the university bus system to get
          to class. While TransLoc provides access to transit information, I
          often found it difficult to quickly answer practical questions such as
          which bus to take, when to leave, and how to navigate the system as a
          new rider.
        </p>
        <p>
          The goal of this project is not to replace existing transit
          applications, but to improve the rider experience through a more
          intuitive and user-friendly interface. The platform is designed to help
          students—especially first-time bus riders—better understand the
          transit system, discover routes, and make informed transportation
          decisions.
        </p>
      </div>

      <section className="mt-10">
        <h2 className="text-xl font-semibold tracking-tight text-uva-navy">
          How It Works
        </h2>

        <div className="mt-6 space-y-8">
          <div>
            <h3 className="text-lg font-medium text-uva-navy">
              Routes Explorer
            </h3>
            <p className="mt-3 text-base leading-relaxed text-uva-navy/70">
              The Routes page provides a complete overview of the UVA bus
              network. Routes are organized into:
            </p>
            <ul className="mt-3 list-disc space-y-2 pl-5 text-base leading-relaxed text-uva-navy/70">
              <li>
                <strong className="font-medium text-uva-navy">
                  Active Routes
                </strong>{" "}
                — routes currently operating and available for riders.
              </li>
              <li>
                <strong className="font-medium text-uva-navy">
                  Inactive Routes
                </strong>{" "}
                — routes that exist within the system but are not currently
                running.
              </li>
            </ul>
            <p className="mt-3 text-base leading-relaxed text-uva-navy/70">
              Selecting a route displays its path, stops, and associated transit
              information, making it easier for riders to understand how
              different routes connect across Grounds and the surrounding
              Charlottesville area.
            </p>
          </div>
        </div>
      </section>

      <section className="mt-10">
        <h2 className="text-xl font-semibold tracking-tight text-uva-navy">
          Features
        </h2>
        <ul className="mt-4 list-disc space-y-2 pl-5 text-base leading-relaxed text-uva-navy/70">
          <li>Real-time bus tracking</li>
          <li>Route visualization and filtering</li>
          <li>Active and inactive route exploration</li>
          <li>Vehicle occupancy information</li>
          <li>Vehicle details and status information</li>
          <li>Enhanced transit reliability and ETA insights</li>
        </ul>
      </section>

      <div className="mt-10 space-y-4 text-base leading-relaxed text-uva-navy/70">
        <p>
          By focusing on usability and decision-making rather than simply
          displaying transit data, this project aims to make getting around UVA
          easier, faster, and less frustrating for students.
        </p>
        <p className="text-sm text-uva-navy/50">
          This project is independently developed and is not affiliated with or
          endorsed by the University of Virginia, UVA Transportation, or
          TransLoc.
        </p>
      </div>
    </article>
  );
}
