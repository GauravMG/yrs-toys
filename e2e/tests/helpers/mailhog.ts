const MAILHOG_URL = process.env.MAILHOG_URL ?? "http://localhost:8025";

interface MailhogMessage {
  To: Array<{ Mailbox: string; Domain: string }>;
  Content: { Headers: Record<string, string[]>; Body: string };
}

/** Polls Mailhog's HTTP API for a message to `toEmail` whose subject contains `subjectContains`. */
export async function waitForEmail(
  toEmail: string,
  subjectContains: string,
  opts: { timeoutMs?: number; intervalMs?: number } = {},
): Promise<MailhogMessage> {
  const timeoutMs = opts.timeoutMs ?? 15_000;
  const intervalMs = opts.intervalMs ?? 500;
  const deadline = Date.now() + timeoutMs;

  while (Date.now() < deadline) {
    const res = await fetch(`${MAILHOG_URL}/api/v2/search?kind=to&query=${encodeURIComponent(toEmail)}`);
    if (res.ok) {
      const data = (await res.json()) as { items: MailhogMessage[] };
      const match = data.items.find((item) => decodeSubject(item).includes(subjectContains));
      if (match) return match;
    }
    await new Promise((resolve) => setTimeout(resolve, intervalMs));
  }
  throw new Error(`Timed out waiting for an email to ${toEmail} with subject containing "${subjectContains}"`);
}

function decodeSubject(message: MailhogMessage): string {
  const raw = message.Content.Headers["Subject"]?.[0] ?? "";
  return decodeMimeQEncodedWords(raw);
}

/**
 * Decodes RFC 2047 `=?UTF-8?Q?...?=` encoded-word subject headers (what
 * nodemailer/Mailhog produce for any non-ASCII subject, e.g. our em dash).
 * A long subject is split across MULTIPLE adjacent encoded-words at a fixed
 * byte length — critically, that split can land in the middle of a plain
 * ASCII word ("Delivered" → "Delive" + "red" as two separate words with a
 * `?= =?UTF-8?Q?` boundary between them) — so words must be concatenated
 * BEFORE a substring match, not matched against the raw header.
 */
function decodeMimeQEncodedWords(raw: string): string {
  return raw
    .replace(/=\?UTF-8\?Q\?([^?]*)\?=\s*/gi, (_full, encoded: string) =>
      encoded
        .replace(/_/g, " ")
        .replace(/=([0-9A-Fa-f]{2})/g, (_m, hex: string) => String.fromCharCode(parseInt(hex, 16))),
    )
    .trim();
}
