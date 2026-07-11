import { useRef, useState } from "react";
import { Loader2, Send } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";

export default function CommentBox({ members, onSubmit }) {
  const [body, setBody] = useState("");
  const [mentioned, setMentioned] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [mentionQuery, setMentionQuery] = useState(null);
  const textareaRef = useRef(null);

  const nameOf = (m) => m.full_name || m.email;
  const candidates =
    mentionQuery === null
      ? []
      : members
          .filter((m) => m.role)
          .filter((m) => nameOf(m).toLowerCase().includes(mentionQuery.trim().toLowerCase()));

  function syncMention(value, caret) {
    const match = value.slice(0, caret).match(/(?:^|\s)@(\S*)$/);
    setMentionQuery(match ? match[1] : null);
  }

  function handleChange(e) {
    setBody(e.target.value);
    syncMention(e.target.value, e.target.selectionStart);
  }

  function selectMention(member) {
    const el = textareaRef.current;
    const caret = el ? el.selectionStart : body.length;
    const before = body.slice(0, caret);
    const at = before.lastIndexOf("@");
    const newBefore = before.slice(0, at) + `@${nameOf(member)} `;
    const newBody = newBefore + body.slice(caret);

    setBody(newBody);
    setMentioned((prev) => (prev.some((m) => m.id === member.id) ? prev : [...prev, member]));
    setMentionQuery(null);

    requestAnimationFrame(() => {
      if (el) {
        el.focus();
        el.setSelectionRange(newBefore.length, newBefore.length);
      }
    });
  }

  async function handleSubmit(e) {
    e.preventDefault();
    const trimmed = body.trim();
    if (!trimmed) return;

    setSubmitting(true);
    try {
      await onSubmit(
        trimmed,
        mentioned.map((m) => m.id)
      );
      setBody("");
      setMentioned([]);
      setMentionQuery(null);
    } catch (error) {
      toast.error(error.message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-2">
      <div className="relative">
        <Textarea
          ref={textareaRef}
          rows={2}
          value={body}
          onChange={handleChange}
          onKeyDown={(e) => e.key === "Escape" && setMentionQuery(null)}
          placeholder="Leave a comment… use @ to mention someone"
        />

        {mentionQuery !== null && candidates.length > 0 && (
          <ul className="bg-popover absolute top-full right-0 left-0 z-10 mt-1 max-h-56 overflow-y-auto rounded-md border p-1 shadow-md">
            {candidates.map((member) => (
              <li key={member.id}>
                <button
                  type="button"
                  onMouseDown={(e) => {
                    e.preventDefault();
                    selectMention(member);
                  }}
                  className="hover:bg-accent flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-left text-sm"
                >
                  {nameOf(member)}
                  {mentioned.some((m) => m.id === member.id) && (
                    <span className="text-muted-foreground ml-auto text-xs">added</span>
                  )}
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      {mentioned.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {mentioned.map((m) => (
            <Badge key={m.id} variant="secondary">
              @{nameOf(m)}
            </Badge>
          ))}
        </div>
      )}

      <div className="flex justify-end">
        <Button type="submit" size="sm" disabled={submitting || !body.trim()}>
          {submitting ? <Loader2 className="size-4 animate-spin" /> : <Send className="size-4" />}
          Comment
        </Button>
      </div>
    </form>
  );
}
