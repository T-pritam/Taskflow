import { Bell } from "lucide-react";
import { toast } from "sonner";
import { timeAgo } from "@/lib/date";
import { cn } from "@/lib/utils";
import { useNotifications } from "@/hooks/useNotifications";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export default function NotificationBell() {
  const { notifications, unreadCount, loading, markRead, markAllRead } = useNotifications();

  async function handleClick(notification) {
    if (notification.read) return;
    try {
      await markRead(notification.id);
    } catch (error) {
      toast.error(error.message);
    }
  }

  async function handleMarkAll() {
    try {
      await markAllRead();
    } catch (error) {
      toast.error(error.message);
    }
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative" aria-label="Notifications">
          <Bell className="size-5" />
          {unreadCount > 0 && (
            <span className="bg-destructive absolute -top-0.5 -right-0.5 flex size-4 items-center justify-center rounded-full text-[10px] font-medium text-white">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-80 p-0">
        <div className="flex items-center justify-between border-b px-3 py-2">
          <span className="text-sm font-medium">Notifications</span>
          {unreadCount > 0 && (
            <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={handleMarkAll}>
              Mark all read
            </Button>
          )}
        </div>

        <div className="max-h-80 overflow-y-auto">
          {loading ? (
            <p className="text-muted-foreground p-4 text-center text-sm">Loading…</p>
          ) : notifications.length === 0 ? (
            <p className="text-muted-foreground p-6 text-center text-sm">
              You&apos;re all caught up.
            </p>
          ) : (
            <ul>
              {notifications.map((notification) => (
                <li key={notification.id}>
                  <button
                    type="button"
                    onClick={() => handleClick(notification)}
                    className={cn(
                      "hover:bg-accent flex w-full flex-col items-start gap-1 border-b px-3 py-2.5 text-left last:border-b-0",
                      !notification.read && "bg-accent/40"
                    )}
                  >
                    <span className="flex w-full items-start gap-2">
                      {!notification.read && (
                        <span className="bg-primary mt-1.5 size-1.5 shrink-0 rounded-full" />
                      )}
                      <span className="text-sm">{notification.message}</span>
                    </span>
                    <span className="text-muted-foreground pl-3.5 text-xs">
                      {timeAgo(notification.created_at)}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
