import { timeAgo } from "@/lib/date";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { initialsOf } from "@/lib/utils";

export default function CommentList({ comments, loading }) {
  if (loading) {
    return <p className="text-muted-foreground text-sm">Loading comments…</p>;
  }

  if (comments.length === 0) {
    return <p className="text-muted-foreground text-sm">No comments yet.</p>;
  }

  return (
    <ul className="flex flex-col gap-4">
      {comments.map((comment) => (
        <li key={comment.id} className="flex gap-3">
          <Avatar className="size-7 shrink-0">
            <AvatarImage src={comment.author?.avatar_url ?? undefined} alt="" />
            <AvatarFallback className="text-xs">{initialsOf(comment.author)}</AvatarFallback>
          </Avatar>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-baseline gap-x-2">
              <span className="text-sm font-medium">
                {comment.author?.full_name || comment.author?.email || "Unknown"}
              </span>
              <span className="text-muted-foreground text-xs">
                {timeAgo(comment.created_at)}
              </span>
            </div>
            <p className="text-sm whitespace-pre-wrap wrap-break-word">{comment.body}</p>
          </div>
        </li>
      ))}
    </ul>
  );
}
