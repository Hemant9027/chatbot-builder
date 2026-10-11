/**
 * Transactional email via Resend, when RESEND_API_KEY is configured.
 * When it is not configured the function reports sent=false with reason
 * "not_configured" — we never pretend an email was delivered.
 */
export async function sendLeadNotification(opts: {
  to: string;
  propertyName: string;
  leadName: string;
  leadContact: string;
  summary: string;
}): Promise<{ sent: boolean; reason?: string }> {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.RESEND_FROM ?? "InfyCrest GuestAI <notifications@infycrest.example>";
  if (!apiKey) {
    console.info(
      `[email] RESEND_API_KEY not configured — lead notification for "${opts.propertyName}" not sent.`,
    );
    return { sent: false, reason: "not_configured" };
  }
  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      signal: AbortSignal.timeout(10_000),
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from,
        to: opts.to,
        subject: `New booking inquiry for ${opts.propertyName}`,
        text: `You received a new inquiry via your AI guest assistant.\n\nGuest: ${opts.leadName}\nContact: ${opts.leadContact}\n\n${opts.summary}\n\nOpen your InfyCrest GuestAI dashboard to review the lead.`,
      }),
    });
    if (!res.ok) {
      return { sent: false, reason: `provider_error_${res.status}` };
    }
    return { sent: true };
  } catch (err) {
    return {
      sent: false,
      reason: err instanceof Error ? err.message : "unknown_error",
    };
  }
}
