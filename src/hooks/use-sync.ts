import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { syncAll } from '@/lib/sync';
import { useToast } from '@/hooks/use-toast';

interface SyncState {
  isSyncing: boolean;
  lastSynced: Date | null;
  error: string | null;
}

export function useSync() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [syncState, setSyncState] = useState<SyncState>({
    isSyncing: false,
    lastSynced: null,
    error: null,
  });

  const performSync = useCallback(async (showToast = true) => {
    if (!user) return;

    setSyncState(prev => ({ ...prev, isSyncing: true, error: null }));

    try {
      const result = await syncAll(user.id);

      if (result.success) {
        setSyncState({
          isSyncing: false,
          lastSynced: new Date(),
          error: null,
        });

        if (showToast && (result.pushed > 0 || result.pulled > 0)) {
          toast({
            title: 'Synced successfully',
            description: `↑ ${result.pushed} pushed, ↓ ${result.pulled} pulled`,
          });
        }
      } else {
        setSyncState({
          isSyncing: false,
          lastSynced: null,
          error: result.error || 'Sync failed',
        });

        if (showToast) {
          toast({
            title: 'Sync failed',
            description: result.error,
            variant: 'destructive',
          });
        }
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      setSyncState({
        isSyncing: false,
        lastSynced: null,
        error: errorMessage,
      });

      if (showToast) {
        toast({
          title: 'Sync failed',
          description: errorMessage,
          variant: 'destructive',
        });
      }
    }
  }, [user, toast]);

  // Sync on initial login
  useEffect(() => {
    if (user) {
      performSync(true);
    }
  }, [user?.id]); // Only trigger when user ID changes

  // Periodic sync every 5 minutes when user is logged in
  useEffect(() => {
    if (!user) return;

    const interval = setInterval(() => {
      performSync(false);
    }, 5 * 60 * 1000);

    return () => clearInterval(interval);
  }, [user, performSync]);

  return {
    ...syncState,
    sync: performSync,
  };
}
