import { createContext, useContext, useEffect, useState, useCallback, ReactNode } from "react";
import { User, Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { getPlanByProductId, PlanKey } from "@/lib/stripe-plans";

interface SubscriptionState {
  subscribed: boolean;
  planKey: PlanKey | null;
  subscriptionEnd: string | null;
  isChecking: boolean;
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
  isLoading: boolean;
  signOut: () => Promise<void>;
  subscription: SubscriptionState;
  refreshSubscription: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  session: null,
  isLoading: true,
  signOut: async () => {},
  subscription: { subscribed: false, planKey: null, subscriptionEnd: null, isChecking: false },
  refreshSubscription: async () => {},
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [subscription, setSubscription] = useState<SubscriptionState>({
    subscribed: false,
    planKey: null,
    subscriptionEnd: null,
    isChecking: false,
  });

  const checkSubscription = useCallback(async () => {
    if (!session) return;
    setSubscription((prev) => ({ ...prev, isChecking: true }));
    try {
      const { data, error } = await supabase.functions.invoke("check-subscription");
      if (error) throw error;
      setSubscription({
        subscribed: data.subscribed ?? false,
        planKey: data.product_id ? getPlanByProductId(data.product_id) : null,
        subscriptionEnd: data.subscription_end ?? null,
        isChecking: false,
      });
    } catch (err) {
      console.error("Failed to check subscription:", err);
      setSubscription((prev) => ({ ...prev, isChecking: false }));
    }
  }, [session]);

  useEffect(() => {
    const { data: { subscription: authSub } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        setIsLoading(false);
      }
    );

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setIsLoading(false);
    });

    return () => authSub.unsubscribe();
  }, []);

  // Check subscription on login and periodically
  useEffect(() => {
    if (session) {
      checkSubscription();
      const interval = setInterval(checkSubscription, 60_000);
      return () => clearInterval(interval);
    }
  }, [session, checkSubscription]);

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
    setSubscription({ subscribed: false, planKey: null, subscriptionEnd: null, isChecking: false });
  };

  return (
    <AuthContext.Provider value={{ user, session, isLoading, signOut, subscription, refreshSubscription: checkSubscription }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
