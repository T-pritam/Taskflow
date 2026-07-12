import { useMembers } from "@/hooks/useMembers";
import { useInvites } from "@/hooks/useInvites";
import InviteModal from "@/components/team/InviteModal";
import MembersList from "@/components/team/MembersList";
import PendingInvites from "@/components/team/PendingInvites";

export default function TeamPage() {
  const { members, loading, reload, updateRole } = useMembers();
  const {
    invites,
    loading: invitesLoading,
    reload: reloadInvites,
    revokeInvite,
    resendInvite,
  } = useInvites();

  function handleInvited() {
    reload();
    reloadInvites();
  }

  return (
    <div className="flex flex-col gap-6 p-4 sm:p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold">Team</h1>
          <p className="text-muted-foreground text-sm">
            Everyone in this workspace. Only admins can change roles.
          </p>
        </div>
        <InviteModal onInvited={handleInvited} />
      </div>

      <PendingInvites
        invites={invites}
        loading={invitesLoading}
        revokeInvite={revokeInvite}
        resendInvite={resendInvite}
      />

      <MembersList members={members} loading={loading} updateRole={updateRole} />
    </div>
  );
}
