import { clearStoredPushTokenForSession, unregisterPushToken } from '@/lib/push/register-push-token';
import { supabase } from '@/lib/supabase';

export async function signOut() {
  const {
    data: { session },
    error: sessionError,
  } = await supabase.auth.getSession();

  if (sessionError != null) {
    throw sessionError;
  }

  const userId = session?.user.id ?? null;

  if (userId != null) {
    try {
      await unregisterPushToken(userId);
    } catch (error) {
      console.error('Failed to delete the current device push token during sign out', error);
    }
  }

  const { error } = await supabase.auth.signOut();

  if (error != null) {
    throw error;
  }

  await clearStoredPushTokenForSession();
}
