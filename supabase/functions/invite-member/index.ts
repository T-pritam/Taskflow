// invite-member — { email, role }. Sole writer of `invites`: re-checks the caller's
// permission, rejects existing members, keeps one pending invite (idempotent, so
// re-inviting resends), and emails a signup link.

import { createClient } from "jsr:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

const BREVO_API_KEY = Deno.env.get("BREVO_API_KEY");
const SENDER_NAME = Deno.env.get("BREVO_SENDER_NAME") ?? "Taskflow";
const SENDER_EMAIL = Deno.env.get("BREVO_SENDER_EMAIL");

async function sendEmail(opts: { to: string[]; subject: string; html: string }) {
  if (!BREVO_API_KEY) throw new Error("BREVO_API_KEY is not set");
  if (!SENDER_EMAIL) throw new Error("BREVO_SENDER_EMAIL is not set");
  if (opts.to.length === 0) return;

  const res = await fetch("https://api.brevo.com/v3/smtp/email", {
    method: "POST",
    headers: {
      "api-key": BREVO_API_KEY,
      "Content-Type": "application/json",
      accept: "application/json",
    },
    body: JSON.stringify({
      sender: { name: SENDER_NAME, email: SENDER_EMAIL },
      to: opts.to.map((email) => ({ email })),
      subject: opts.subject,
      htmlContent: opts.html,
    }),
  });

  if (!res.ok) throw new Error(`Brevo failed (${res.status}): ${await res.text()}`);
}

function layout(title: string, bodyHtml: string) {
  return `
    <div style="font-family:system-ui,-apple-system,'Segoe UI',sans-serif;max-width:520px;margin:0 auto;padding:24px;color:#18181b">
      <h2 style="margin:0 0 16px;font-size:18px">${title}</h2>
      ${bodyHtml}
      <p style="margin-top:32px;font-size:12px;color:#71717a">Taskflow</p>
    </div>
  `;
}

function button(href: string, label: string) {
  return `<a href="${href}" style="display:inline-block;background:#18181b;color:#fff;text-decoration:none;padding:10px 18px;border-radius:8px;font-size:14px">${label}</a>`;
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;
const APP_URL = Deno.env.get("APP_URL") ?? "http://localhost:5173";

const ALLOWED: Record<string, string[]> = {
  admin: ["project_manager", "developer"],
  project_manager: ["developer"],
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) return json({ error: "Missing Authorization header" }, 401);

    const callerClient = createClient(SUPABASE_URL, ANON_KEY, {
      global: { headers: { Authorization: authHeader } },
    });
    const {
      data: { user },
    } = await callerClient.auth.getUser();
    if (!user) return json({ error: "Not authenticated" }, 401);

    const body = await req.json();
    const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
    const role = body.role;
    if (!email || !role) return json({ error: "email and role are required" }, 400);

    const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

    const { data: callerProfile } = await admin
      .from("profiles")
      .select("role, full_name, email")
      .eq("id", user.id)
      .single();

    const callerRole = callerProfile?.role ?? "";
    if (!ALLOWED[callerRole]?.includes(role)) {
      return json({ error: `A ${callerRole || "guest"} cannot invite a ${role}` }, 403);
    }

    const { data: existingMember } = await admin
      .from("profiles")
      .select("role")
      .eq("email", email)
      .maybeSingle();
    if (existingMember?.role) {
      return json({ error: "That person is already a member of this workspace." }, 409);
    }

    const { data: pending } = await admin
      .from("invites")
      .select("id")
      .eq("email", email)
      .eq("status", "pending")
      .limit(1);

    if (!pending || pending.length === 0) {
      const { error: insertError } = await admin
        .from("invites")
        .insert({ email, role, invited_by: user.id });
      if (insertError) return json({ error: insertError.message }, 400);
    }

    const signupUrl = `${APP_URL}/signup?email=${encodeURIComponent(email)}`;
    const inviter = callerProfile?.full_name || callerProfile?.email || "A teammate";

    await sendEmail({
      to: [email],
      subject: "You've been invited to Taskflow",
      html: layout(
        "You've been invited",
        `<p style="font-size:14px;line-height:1.6">${escapeHtml(inviter)} invited you to join their
         workspace as a <strong>${escapeHtml(role.replace("_", " "))}</strong>.</p>
         <p style="font-size:14px;line-height:1.6">Sign up with this email address to accept.</p>
         <p style="margin:24px 0">${button(signupUrl, "Accept invite")}</p>
         <p style="font-size:12px;color:#71717a">Or paste this link into your browser:<br>${signupUrl}</p>`
      ),
    });

    return json({ ok: true });
  } catch (error) {
    console.error("invite-member failed", error);
    return json({ error: (error as Error).message }, 500);
  }
});
