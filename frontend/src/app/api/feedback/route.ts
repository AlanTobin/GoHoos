const MAX_MESSAGE_LENGTH = 4000;
const MAX_NAME_LENGTH = 80;
const MAX_EMAIL_LENGTH = 120;

function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string";
}

function looksLikeEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function isFormSubmitSuccess(data: unknown) {
  if (!data || typeof data !== "object") return false;
  const success = (data as { success?: unknown }).success;
  return success === true || success === "true";
}

function formSubmitMessage(data: unknown) {
  if (!data || typeof data !== "object") return "";
  const message = (data as { message?: unknown }).message;
  return typeof message === "string" ? message : "";
}

function needsActivation(message: string) {
  return /activat|confirm/i.test(message);
}

export async function POST(request: Request) {
  const destination = process.env.FEEDBACK_TO_EMAIL?.trim();
  if (!destination || !looksLikeEmail(destination)) {
    console.error("FEEDBACK_TO_EMAIL is missing or invalid");
    return Response.json(
      { error: "Feedback is not configured." },
      { status: 503 }
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid request." }, { status: 400 });
  }

  if (!body || typeof body !== "object") {
    return Response.json({ error: "Invalid request." }, { status: 400 });
  }

  const payload = body as Record<string, unknown>;

  // Honeypot: bots fill hidden fields. Pretend success without sending.
  if (isNonEmptyString(payload.website) && payload.website.trim()) {
    return Response.json({ ok: true });
  }

  const name = isNonEmptyString(payload.name) ? payload.name.trim() : "";
  const email = isNonEmptyString(payload.email) ? payload.email.trim() : "";
  const message = isNonEmptyString(payload.message) ? payload.message.trim() : "";

  if (name.length > MAX_NAME_LENGTH) {
    return Response.json({ error: "Name is too long." }, { status: 400 });
  }
  if (email.length > MAX_EMAIL_LENGTH || (email && !looksLikeEmail(email))) {
    return Response.json({ error: "Enter a valid email, or leave it blank." }, { status: 400 });
  }
  if (!message || message.length > MAX_MESSAGE_LENGTH) {
    return Response.json(
      { error: "Please include a message (up to 4,000 characters)." },
      { status: 400 }
    );
  }

  const lines = [
    name ? `Name: ${name}` : "Name: (not provided)",
    email ? `Reply-to: ${email}` : "Reply-to: (not provided)",
    "",
    message,
  ];

  const origin =
    process.env.FEEDBACK_ORIGIN?.trim() ||
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000");

  const response = await fetch(
    `https://formsubmit.co/ajax/${encodeURIComponent(destination)}`,
    {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        Origin: origin,
        Referer: `${origin}/issues`,
      },
      body: JSON.stringify({
        _subject: "GoHoos feedback",
        _template: "box",
        _captcha: false,
        name: name || "Anonymous",
        email: email || destination,
        message: lines.join("\n"),
      }),
    }
  );

  let data: unknown = null;
  try {
    data = await response.json();
  } catch {
    data = null;
  }

  const providerMessage = formSubmitMessage(data);
  console.info("FormSubmit feedback result", {
    httpStatus: response.status,
    success: isFormSubmitSuccess(data),
    message: providerMessage,
  });

  if (!response.ok || !isFormSubmitSuccess(data)) {
    if (needsActivation(providerMessage)) {
      return Response.json({ ok: true, needsConfirmation: true });
    }

    return Response.json(
      { error: "Could not send feedback. Try again in a moment." },
      { status: 502 }
    );
  }

  if (needsActivation(providerMessage)) {
    return Response.json({ ok: true, needsConfirmation: true });
  }

  return Response.json({ ok: true });
}
