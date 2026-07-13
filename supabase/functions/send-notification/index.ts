// send-notification — invoked by Database Webhooks (comments INSERT, tasks UPDATE on
// assignee change). Emails creator + assignee + past commenters + mentioned users,
// minus the actor, one message per person.

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
const APP_URL = Deno.env.get("APP_URL") ?? "http://localhost:5173";

const STATUS_LABELS: Record<string, string> = {
  todo: "To Do",
  backlog: "Backlog",
  in_progress: "In Progress",
  done: "Done",
};
const PRIORITY_LABELS: Record<string, string> = { p1: "P1", p2: "P2", p3: "P3" };

function formatDue(due: string | null): string | null {
  if (!due) return null;
  return new Date(due).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function taskCard(task: {
  title: string;
  status: string;
  priority: string | null;
  due_date: string | null;
  sections?: { name: string } | { name: string }[] | null;
}): string {
  const section = Array.isArray(task.sections) ? task.sections[0] : task.sections;
  const meta: string[] = [`Status: ${STATUS_LABELS[task.status] ?? task.status}`];
  if (section?.name) meta.push(`Section: ${escapeHtml(section.name)}`);
  if (task.priority) meta.push(`Priority: ${PRIORITY_LABELS[task.priority] ?? task.priority}`);
  const due = formatDue(task.due_date);
  if (due) meta.push(`Due: ${due}`);

  return `<div style="border:1px solid #e4e4e7;border-radius:8px;padding:14px 16px;margin:16px 0">
      <p style="margin:0;font-weight:600;font-size:15px;color:#18181b">${escapeHtml(task.title)}</p>
      <p style="margin:6px 0 0;font-size:13px;color:#71717a">${meta.join(" &middot; ")}</p>
    </div>`;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const { table, record, old_record } = await req.json();

    let taskId: string;
    let actorId: string | null = null;
    let subject: string;
    let extra: string[] = [];
    let detailHtml = "";

    if (table === "comments") {
      taskId = record.task_id;
      actorId = record.author_id;
      extra = record.mentioned_user_ids ?? [];
      subject = "New comment on a task you follow";
      detailHtml = `<blockquote style="margin:16px 0;padding:8px 14px;border-left:3px solid #e4e4e7;color:#3f3f46;font-size:14px;white-space:pre-wrap">${escapeHtml(
        record.body ?? ""
      )}</blockquote>`;
    } else if (table === "tasks" && record.assignee_id !== old_record?.assignee_id) {
      taskId = record.id;
      actorId = null;
      extra = record.assignee_id ? [record.assignee_id] : [];
      subject = "You were assigned to a task";
    } else {
      return json({ ok: true, skipped: true });
    }

    const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

    const { data: task, error: taskError } = await admin
      .from("tasks")
      .select("id, title, created_by, assignee_id, status, priority, due_date, sections(name)")
      .eq("id", taskId)
      .single();
    if (taskError || !task) return json({ error: "Task not found" }, 404);

    const { data: pastComments } = await admin
      .from("comments")
      .select("author_id")
      .eq("task_id", taskId);

    const recipientIds = new Set<string>(
      [
        task.created_by,
        task.assignee_id,
        ...(pastComments ?? []).map((c) => c.author_id),
        ...extra,
      ].filter((id): id is string => Boolean(id))
    );

    if (actorId) recipientIds.delete(actorId);
    if (recipientIds.size === 0) return json({ ok: true, recipients: 0 });

    const { data: profiles } = await admin
      .from("profiles")
      .select("id, email")
      .in("id", [...recipientIds]);

    const actorName = actorId ? await nameOf(admin, actorId) : null;
    const taskUrl = `${APP_URL}/?task=${task.id}`;

    const intro =
      table === "comments"
        ? `<p style="font-size:14px;line-height:1.6">${escapeHtml(
            actorName ?? "Someone"
          )} commented on the task below.</p>`
        : `<p style="font-size:14px;line-height:1.6">You were assigned to the task below.</p>`;

    const html = layout(
      subject,
      `${intro}${taskCard(task)}${detailHtml}<p style="margin:24px 0">${button(
        taskUrl,
        "Open the task"
      )}</p>`
    );

    await Promise.all(
      (profiles ?? [])
        .filter((p) => p.email)
        .map((p) => sendEmail({ to: [p.email], subject, html }))
    );

    return json({ ok: true, recipients: profiles?.length ?? 0 });
  } catch (error) {
    console.error("send-notification failed", error);
    return json({ error: (error as Error).message }, 500);
  }
});

async function nameOf(
  admin: ReturnType<typeof createClient>,
  userId: string
): Promise<string | null> {
  const { data } = await admin
    .from("profiles")
    .select("full_name, email")
    .eq("id", userId)
    .single();
  return data?.full_name ?? data?.email ?? null;
}
