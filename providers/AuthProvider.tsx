import type { Session } from '@supabase/supabase-js';
import type { PropsWithChildren } from 'react';
import { useEffect, useRef } from 'react';

import { fetchProfileByUserId } from '@/lib/auth/api';
import { registerPushToken } from '@/lib/push/register-push-token';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/stores/auth-store';

export function AuthProvider({ children }: PropsWithChildren) {
  const pushRegistrationUserIdRef = useRef<string | null>(null);
  const requestIdRef = useRef(0);
  const reset = useAuthStore((state) => state.reset);
  const setAuthState = useAuthStore((state) => state.setAuthState);
  const setHydrated = useAuthStore((state) => state.setHydrated);

  useEffect(() => {
    let isMounted = true;

    const syncSession = async (session: Session | null) => {
      const requestId = requestIdRef.current + 1;

      requestIdRef.current = requestId;

      if (session == null) {
        pushRegistrationUserIdRef.current = null;

        if (isMounted) {
          reset();
        }

        return;
      }

      try {
        const profile = await fetchProfileByUserId(session.user.id);

        if (!isMounted || requestId !== requestIdRef.current) {
          return;
        }

        setAuthState({
          authUser: session.user,
          profile,
          session,
        });
        setHydrated(true);

        if (profile != null && pushRegistrationUserIdRef.current !== session.user.id) {
          pushRegistrationUserIdRef.current = session.user.id;

          void registerPushToken(session.user.id).catch((error) => {
            pushRegistrationUserIdRef.current = null;
            console.error('Failed to register push token', error);
          });
        }
      } catch (error) {
        console.error('Failed to sync auth session', error);

        if (isMounted && requestId === requestIdRef.current) {
          reset();
        }
      }
    };

    void supabase.auth
      .getSession()
      .then(({ data, error }) => {
        if (error != null) {
          throw error;
        }

        return syncSession(data.session);
      })
      .catch((error) => {
        console.error('Failed to load initial auth session', error);

        if (isMounted) {
          reset();
        }
      });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      void syncSession(session);
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, [reset, setAuthState, setHydrated]);

  return children;
}
