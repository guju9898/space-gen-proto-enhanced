const LOOPS_API_KEY = process.env.LOOPS_API_KEY;
const LOOPS_API_BASE_URL =
  process.env.LOOPS_API_BASE_URL || "https://app.loops.so/api/v1";

if (!LOOPS_API_KEY) {
  console.warn("LOOPS_API_KEY is missing");
}

type ContactPayload = {
  email: string;
  firstName?: string;
  lastName?: string;
  userId?: string;
  plan?: string;
  signedUpAt?: string;
};

export async function upsertLoopsContact(payload: ContactPayload) {
  if (!LOOPS_API_KEY) return;

  const res = await fetch(`${LOOPS_API_BASE_URL}/contacts/create`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${LOOPS_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Loops contact upsert failed: ${res.status} ${text}`);
  }

  return res.json();
}

type EventPayload = {
  email: string;
  eventName: string;
  properties?: Record<string, unknown>;
};

export async function sendLoopsEvent({
  email,
  eventName,
  properties = {},
}: EventPayload) {
  if (!LOOPS_API_KEY) return;

  const res = await fetch(`${LOOPS_API_BASE_URL}/events/send`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${LOOPS_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      email,
      eventName,
      eventProperties: properties,
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Loops event failed: ${res.status} ${text}`);
  }

  return res.json();
}
