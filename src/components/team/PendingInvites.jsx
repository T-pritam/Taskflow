import { useState } from "react";
import { Loader2, RotateCw, X } from "lucide-react";
import { toast } from "sonner";
import { ROLE_LABELS } from "@/lib/constants";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export default function PendingInvites({ invites, loading, revokeInvite, resendInvite }) {
  const [busy, setBusy] = useState(null);

  if (loading || invites.length === 0) return null;

  async function handleResend(invite) {
    setBusy(invite.id);
    try {
      await resendInvite({ email: invite.email, role: invite.role });
      toast.success(`Invite resent to ${invite.email}`);
    } catch (error) {
      toast.error(error.message);
    } finally {
      setBusy(null);
    }
  }

  async function handleRevoke(invite) {
    setBusy(invite.id);
    try {
      await revokeInvite(invite.id);
      toast.success("Invite revoked");
    } catch (error) {
      toast.error(error.message);
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="flex flex-col gap-2">
      <h2 className="text-sm font-medium">
        Pending invites
        <span className="text-muted-foreground ml-2 font-normal">{invites.length}</span>
      </h2>

      <div className="overflow-x-auto rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Email</TableHead>
              <TableHead className="w-40">Role</TableHead>
              <TableHead className="w-40 text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {invites.map((invite) => (
              <TableRow key={invite.id}>
                <TableCell className="font-medium">{invite.email}</TableCell>
                <TableCell>
                  <Badge variant="secondary">{ROLE_LABELS[invite.role]}</Badge>
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={busy === invite.id}
                      onClick={() => handleResend(invite)}
                    >
                      {busy === invite.id ? (
                        <Loader2 className="size-4 animate-spin" />
                      ) : (
                        <RotateCw className="size-4" />
                      )}
                      Resend
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      disabled={busy === invite.id}
                      onClick={() => handleRevoke(invite)}
                    >
                      <X className="size-4" />
                      Revoke
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
