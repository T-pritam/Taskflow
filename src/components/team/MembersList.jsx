import { toast } from "sonner";
import { useAuth } from "@/store/authStore";
import { initialsOf } from "@/lib/utils";
import { ROLES, ROLE_LABELS } from "@/lib/constants";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export default function MembersList({ members, loading, updateRole }) {
  const { isAdmin, profile } = useAuth();

  async function handleRoleChange(memberId, role) {
    try {
      await updateRole(memberId, role);
      toast.success("Role updated");
    } catch (error) {
      toast.error(error.message);
    }
  }

  if (loading) {
    return <p className="text-muted-foreground p-6 text-sm">Loading members…</p>;
  }

  if (members.length === 0) {
    return <p className="text-muted-foreground p-6 text-sm">No members yet.</p>;
  }

  return (
    <div className="overflow-x-auto rounded-lg border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Member</TableHead>
            <TableHead className="hidden sm:table-cell">Email</TableHead>
            <TableHead className="w-56">Role</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {members.map((member) => (
            <TableRow key={member.id}>
              <TableCell>
                <div className="flex items-center gap-3">
                  <Avatar className="size-8">
                    <AvatarImage src={member.avatar_url ?? undefined} alt="" />
                    <AvatarFallback className="text-xs">{initialsOf(member)}</AvatarFallback>
                  </Avatar>
                  <div className="min-w-0">
                    <p className="truncate font-medium">
                      {member.full_name || member.email}
                      {member.id === profile?.id && (
                        <span className="text-muted-foreground font-normal"> (you)</span>
                      )}
                    </p>
                    <p className="text-muted-foreground truncate text-xs sm:hidden">
                      {member.email}
                    </p>
                  </div>
                </div>
              </TableCell>
              <TableCell className="text-muted-foreground hidden sm:table-cell">
                {member.email}
              </TableCell>
              <TableCell>
                {isAdmin ? (
                  <Select
                    value={member.role ?? "none"}
                    onValueChange={(value) => handleRoleChange(member.id, value)}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="No access" />
                    </SelectTrigger>
                    <SelectContent>
                      {member.role === null && (
                        <SelectItem value="none" disabled>
                          No access
                        </SelectItem>
                      )}
                      {ROLES.map((r) => (
                        <SelectItem key={r} value={r}>
                          {ROLE_LABELS[r]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : member.role ? (
                  <Badge variant="secondary">{ROLE_LABELS[member.role]}</Badge>
                ) : (
                  <Badge variant="outline">No access</Badge>
                )}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
