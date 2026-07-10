import { create } from "zustand";
import { useShallow } from "zustand/react/shallow";
import { supabase } from "@/lib/supabase";

let initialized = false;

export const useAuthStore = create((set, get) => ({
  session: null,
  profile: null,
  loading: true,

  loadProfile: async (userId) => {
    set({ loading: true });
    const { data, error } = await supabase
      .from("profiles")
      .select("id, email, full_name, avatar_url, role")
      .eq("id", userId)
      .maybeSingle();

    if (error) console.error("Failed to load profile", error);
    set({ profile: data ?? null, loading: false });
  },

  signOut: async () => {
    await supabase.auth.signOut();
    set({ profile: null });
  },

  init: () => {
    if (initialized) return;
    initialized = true;

    supabase.auth.getSession().then(({ data }) => {
      set({ session: data.session });
      if (data.session?.user) get().loadProfile(data.session.user.id);
      else set({ loading: false });
    });

    supabase.auth.onAuthStateChange((_event, next) => {
      const prevUserId = get().session?.user?.id;
      set({ session: next });

      const nextUserId = next?.user?.id;
      if (!nextUserId) {
        set({ profile: null, loading: false });
        return;
      }
      if (nextUserId !== prevUserId) get().loadProfile(nextUserId);
    });
  },
}));

export const useAuth = () =>
  useAuthStore(
    useShallow((s) => ({
      session: s.session,
      user: s.session?.user ?? null,
      profile: s.profile,
      role: s.profile?.role ?? null,
      isAdmin: s.profile?.role === "admin",
      loading: s.loading,
      signOut: s.signOut,
    }))
  );
