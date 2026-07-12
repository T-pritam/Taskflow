import { useMembers } from "@/hooks/useMembers";
import InviteModal from "@/components/team/InviteModal";
import MembersList from "@/components/team/MembersList";

export default function TeamPage() {
  const { members, loading, reload, updateRole } = useMembers();

  return (
    <div className="flex flex-col gap-6 p-4 sm:p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold">Team</h1>
          <p className="text-muted-foreground text-sm">
            Everyone in this workspace. Only admins can change roles.
          </p>
        </div>
        <InviteModal onInvited={reload} />
      </div>

      <MembersList members={members} loading={loading} updateRole={updateRole} />
    </div>
  );
}
