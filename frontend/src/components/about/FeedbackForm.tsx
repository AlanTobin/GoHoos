"use client";

import { useState, type FormEvent } from "react";

type Status = "idle" | "sending" | "sent" | "confirm" | "error";

export default function FeedbackForm() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [website, setWebsite] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus("sending");
    setError(null);

    try {
      const response = await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, message, website }),
      });

      const data = (await response.json()) as {
        error?: string;
        needsConfirmation?: boolean;
      };

      if (!response.ok) {
        setStatus("error");
        setError(data.error ?? "Could not send feedback.");
        return;
      }

      setStatus(data.needsConfirmation ? "confirm" : "sent");
      setName("");
      setEmail("");
      setMessage("");
    } catch {
      setStatus("error");
      setError("Could not send feedback. Check your connection and try again.");
    }
  }

  const fieldClass =
    "w-full rounded-lg border border-uva-navy/15 bg-white px-3 py-2 text-sm text-uva-navy outline-none placeholder:text-uva-navy/35 focus:border-uva-orange";

  if (status === "confirm") {
    return (
      <div className="rounded-lg border border-uva-navy/10 bg-white p-4 text-sm text-uva-navy/80">
        <p className="font-medium text-uva-navy">One more step in the inbox.</p>
        <p className="mt-1">
          The first Issues submit only sends a FormSubmit confirmation email
          (check spam). After you click Activate Form, send this again and the
          actual note will arrive.
        </p>
        <button
          type="button"
          onClick={() => setStatus("idle")}
          className="mt-3 text-sm font-medium text-uva-orange hover:underline"
        >
          Send again after activating
        </button>
      </div>
    );
  }

  if (status === "sent") {
    return (
      <div className="rounded-lg border border-uva-navy/10 bg-white p-4 text-sm text-uva-navy/80">
        <p className="font-medium text-uva-navy">Thanks — feedback sent.</p>
        <p className="mt-1">I read these as they come in. I really appreciate the feedback!</p>
        <button
          type="button"
          onClick={() => setStatus("idle")}
          className="mt-3 text-sm font-medium text-uva-orange hover:underline"
        >
          Send another note
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="relative space-y-3">
      <div>
        <label htmlFor="feedback-name" className="mb-1 block text-sm font-medium text-uva-navy">
          Name <span className="font-normal text-uva-navy/45">(optional)</span>
        </label>
        <input
          id="feedback-name"
          name="name"
          type="text"
          autoComplete="name"
          maxLength={80}
          value={name}
          onChange={(event) => setName(event.target.value)}
          className={fieldClass}
        />
      </div>

      <div>
        <label htmlFor="feedback-email" className="mb-1 block text-sm font-medium text-uva-navy">
          Your email <span className="font-normal text-uva-navy/45">(optional, if you want a reply)</span>
        </label>
        <input
          id="feedback-email"
          name="email"
          type="email"
          autoComplete="email"
          maxLength={120}
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          className={fieldClass}
        />
      </div>

      <div>
        <label htmlFor="feedback-message" className="mb-1 block text-sm font-medium text-uva-navy">
          Message
        </label>
        <textarea
          id="feedback-message"
          name="message"
          required
          rows={5}
          maxLength={4000}
          value={message}
          onChange={(event) => setMessage(event.target.value)}
          className={`${fieldClass} resize-y min-h-28`}
        />
      </div>

      <div className="sr-only" aria-hidden>
        <label htmlFor="feedback-website">Website</label>
        <input
          id="feedback-website"
          name="website"
          type="text"
          tabIndex={-1}
          autoComplete="off"
          value={website}
          onChange={(event) => setWebsite(event.target.value)}
        />
      </div>

      {error ? <p className="text-sm text-red-700">{error}</p> : null}

      <button
        type="submit"
        disabled={status === "sending"}
        className="inline-flex rounded-lg bg-uva-orange px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-uva-orange-hover disabled:cursor-not-allowed disabled:opacity-60"
      >
        {status === "sending" ? "Sending…" : "Send feedback"}
      </button>
    </form>
  );
}
