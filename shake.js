// Email Shaker — server function (Vercel).
// Receives the template (with placeholders, never real names), asks Claude for a
// fresh version, and returns { subject, body }. The API key stays on the server.

const MODEL = process.env.CLAUDE_MODEL || "claude-sonnet-5-5";
const MAX_BODY_CHARS = 12000;

function buildPrompt(subject, body) {
  return `You rewrite a research-recruitment email that a university psychology lab sends to parents. Parents receive many of these, so make this version feel fresh rather than copy-pasted, while staying accurate and ethical.

TONE: Keep the same tone, formality and personality as the original, a touch warmer if anything.
HOW MUCH TO CHANGE: Write a new subject line, greeting, opening sentence and sign-off. Lightly rephrase the other sentences so the email doesn't read as a copy, keeping the same paragraphs, order and meaning.

RULES
- Refer to the sender, parent and child only with the placeholders {{experimenter}}, {{parent}} and {{child}}, written exactly like that, wherever the original uses them. Never invent names.
- Text inside [[ and ]] is approved wording. Copy each [[...]] block exactly, brackets included, character for character.
- Keep every fact in the original: who is writing, the lab and university, who is eligible, ages, what participation involves, time required, compensation, dates, locations, links, email addresses, phone numbers, and that participation is voluntary. Write numbers, amounts and links exactly as they appear in the original.
- Add no new facts, claims, promises or statistics. No pressure tactics: no false urgency, guilt, or exaggerated benefits.
- Plain text only, no markdown, no emojis.
- It must read as written by the same sender, respectful and suitable for parents.

Reply with only a JSON object: {"subject": "...", "body": "..."}. The body includes the greeting and sign-off and uses \\n for line breaks.

ORIGINAL SUBJECT: ${subject || "(none — write one)"}

ORIGINAL EMAIL:
<<<
${body}
>>>`;
}

// Read the reply tolerantly: whole text, a ```json fence, or first { … last }.
function parseJson(text) {
  const tries = [text];
  const fence = text.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fence) tries.push(fence[1]);
  const a = text.indexOf("{"), b = text.lastIndexOf("}");
  if (a !== -1 && b > a) tries.push(text.slice(a, b + 1));
  for (const t of tries) {
    try { return JSON.parse(t); } catch {}
  }
  return null;
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Use POST." });
  }

  const { ANTHROPIC_API_KEY, LAB_PASSCODE } = process.env;
  if (!ANTHROPIC_API_KEY) {
    return res.status(500).json({ error: "The server has no ANTHROPIC_API_KEY. Add it in the Vercel project's Environment Variables, then redeploy." });
  }

  let input = req.body;
  if (typeof input === "string") { try { input = JSON.parse(input); } catch { input = {}; } }
  const subject = String(input?.subject ?? "").slice(0, 300);
  const body = String(input?.body ?? "");
  const passcode = String(input?.passcode ?? "");

  if (LAB_PASSCODE && passcode !== LAB_PASSCODE) {
    return res.status(401).json({ error: "Wrong or missing passcode." });
  }
  if (!body.trim()) return res.status(400).json({ error: "Paste a template first." });
  if (body.length > MAX_BODY_CHARS) {
    return res.status(413).json({ error: "The template is too long to rewrite. Trim it and try again." });
  }

  let r;
  try {
    r = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-api-key": ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: MODEL,
        max_tokens: 2000,
        messages: [{ role: "user", content: buildPrompt(subject, body) }],
      }),
    });
  } catch (e) {
    console.error("Anthropic request failed:", e);
    return res.status(502).json({ error: "Couldn't reach Claude just now. Shake again." });
  }

  if (r.status === 429 || r.status === 529) {
    return res.status(429).json({ error: "Claude is busy or the API limit was reached. Wait a minute, then shake again." });
  }
  if (!r.ok) {
    console.error("Anthropic error", r.status, await r.text());
    return res.status(502).json({ error: "Claude couldn't write a draft just now. Shake again." });
  }

  const data = await r.json();
  const text = (data.content || []).filter((b) => b.type === "text").map((b) => b.text).join("");
  const parsed = parseJson(text);
  if (!parsed || !parsed.body) {
    return res.status(502).json({ error: "That draft came back garbled. Shake again." });
  }

  return res.status(200).json({
    subject: String(parsed.subject || "").trim(),
    body: String(parsed.body).replace(/\\n/g, "\n").trim(),
  });
}
