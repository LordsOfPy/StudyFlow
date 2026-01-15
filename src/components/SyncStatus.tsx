import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useSync } from '@/hooks/use-sync';
import { Button } from '@/components/ui/button';
import { Cloud, CloudOff, RefreshCw, User, LogOut } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Link } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';

export function SyncStatus() {
  const { user, signOut } = useAuth();
  const { isSyncing, lastSynced, error, sync } = useSync();

  if (!user) {
    return (
      <Link to="/auth">
        <Button variant="outline" size="sm" className="gap-2">
          <CloudOff className="h-4 w-4" />
          <span className="hidden sm:inline">Sign in to sync</span>
        </Button>
      </Link>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          {isSyncing ? (
            <RefreshCw className="h-4 w-4 animate-spin" />
          ) : error ? (
            <CloudOff className="h-4 w-4 text-destructive" />
          ) : (
            <Cloud className="h-4 w-4 text-primary" />
          )}
          <span className="hidden sm:inline max-w-[120px] truncate">
            {user.email?.split('@')[0]}
          </span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <div className="px-2 py-1.5">
          <p className="text-sm font-medium">{user.email}</p>
          {lastSynced && (
            <p className="text-xs text-muted-foreground">
              Last synced {formatDistanceToNow(lastSynced, { addSuffix: true })}
            </p>
          )}
          {error && (
            <p className="text-xs text-destructive">{error}</p>
          )}
        </div>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => sync()} disabled={isSyncing}>
          <RefreshCw className={`mr-2 h-4 w-4 ${isSyncing ? 'animate-spin' : ''}`} />
          Sync now
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <Link to="/profile">
          <DropdownMenuItem>
            <User className="mr-2 h-4 w-4" />
            Profile
          </DropdownMenuItem>
        </Link>
        <DropdownMenuItem onClick={signOut} className="text-destructive">
          <LogOut className="mr-2 h-4 w-4" />
          Sign out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
