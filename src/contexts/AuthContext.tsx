import { createContext, useContext, useEffect, useRef, useState, ReactNode } from "react";
import { User, Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

type AppRole = "trainer" | "student";
export type PlanTier = "starter" | "pro" | "business";

interface Profile {
  id: string;
  user_id: string;
  full_name: string;
  email: string;
  phone: string | null;
  specialty: string | null;
  avatar_url: string | null;
  trainer_id: string | null;
  status: string;
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  role: AppRole | null;
  planTier: PlanTier;
  loading: boolean;
  signUp: (email: string, password: string, fullName: string, role: AppRole) => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser]       = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [role, setRole]       = useState<AppRole | null>(null);
  const [planTier, setPlanTier] = useState<PlanTier>("starter");
  const [loading, setLoading] = useState(true);

  // Prevent concurrent fetches from both getSession and onAuthStateChange
  const fetchingRef = useRef<string | null>(null);

  const loadUserData = async (userId: string) => {
    // Skip if already fetching for this user
    if (fetchingRef.current === userId) return;
    fetchingRef.current = userId;
    setLoading(true);

    try {
      const [profileRes, roleRes] = await Promise.all([
        supabase.from("profiles").select("*").eq("user_id", userId).single(),
        supabase.from("user_roles").select("role").eq("user_id", userId).single(),
      ]);

      setProfile(profileRes.data ?? null);
      const fetchedRole = roleRes.data?.role as AppRole | undefined;
      if (fetchedRole) setRole(fetchedRole);

      // Fetch plan tier for trainers
      if (fetchedRole === "trainer") {
        try {
          const { data: sub } = await supabase
            .from("trainer_subscriptions" as any)
            .select("plan_tier")
            .eq("trainer_id", userId)
            .maybeSingle();
          setPlanTier(((sub as any)?.plan_tier as PlanTier) ?? "starter");
        } catch {
          setPlanTier("starter");
        }
      } else {
        setPlanTier("starter"); // students don't have FitApp tiers
      }
    } finally {
      fetchingRef.current = null;
      setLoading(false);
    }
  };

  const clearUserData = () => {
    setProfile(null);
    setRole(null);
    setPlanTier("starter");
    fetchingRef.current = null;
    setLoading(false);
  };

  useEffect(() => {
    // Bootstrap: get current session immediately
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        loadUserData(session.user.id);
      } else {
        setLoading(false);
      }
    });

    // Listen for future auth changes (sign in, sign out, token refresh)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        if (session?.user) {
          // setTimeout avoids Supabase internal deadlock on sign-in
          setTimeout(() => loadUserData(session!.user.id), 0);
        } else {
          clearUserData();
        }
      }
    );

    return () => subscription.unsubscribe();
     
  }, []);

  const signUp = async (email: string, password: string, fullName: string, role: AppRole) => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: fullName, role },
        emailRedirectTo: `${window.location.origin}/dashboard`,
      },
    });
    if (error) throw error;
  };

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
    clearUserData();
  };

  return (
    <AuthContext.Provider value={{ user, session, profile, role, planTier, loading, signUp, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
};
