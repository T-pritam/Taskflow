import { useState } from "react";
import { Loader2, UserPlus } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/store/authStore";
import { invitableRoles, ROLE_LABELS } from "@/lib/constants";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function InviteModal({ onInvited }) {
  const { role: myRole } = useAuth();
  const options = invitableRoles(myRole);

  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [role, setRole] = useState(options[0] ?? "developer");
  const [submitting, setSubmitting] = useState(false);

  if (options.length === 0) return null;

  async function handleSubmit(e) {
    e.preventDefault();
    setSubmitting(true);

    const { error: fnError } = await supabase.functions.invoke("invite-member", {
      body: { email, role },
    });
    setSubmitting(false);

    if (fnError) {
      let message = "Failed to send the invite.";
      try {
        const body = await fnError.context?.json?.();
        if (body?.error) message = body.error;
      } catch {
        message = "Failed to send the invite.";
      }
      toast.error(message);
      return;
    }

    toast.success(`Invite sent to ${email}`);
    setOpen(false);
    setEmail("");
    onInvited?.();
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <UserPlus className="size-4" />
          Invite member
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Invite a member</DialogTitle>
            <DialogDescription>
              They&apos;ll get an email with a signup link. Their role is set from this invite.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="invite-email">Email</Label>
              <Input
                id="invite-email"
                type="email"
                required
                placeholder="teammate@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="invite-role">Role</Label>
              <Select value={role} onValueChange={setRole}>
                <SelectTrigger id="invite-role" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {options.map((r) => (
                    <SelectItem key={r} value={r}>
                      {ROLE_LABELS[r]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={submitting}>
              {submitting && <Loader2 className="size-4 animate-spin" />}
              Send invite
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
