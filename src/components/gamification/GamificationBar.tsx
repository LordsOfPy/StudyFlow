import { Zap, Trophy, Star } from 'lucide-react';
import React from 'react';
import { useAnalytics } from '@/hooks/use-analytics';

export function GamificationBar() {
    const { userProgress } = useAnalytics();

    // Default if not loaded yet
    const xp = userProgress?.xp || 0;
    const level = userProgress?.level || 1;
    const nextLevelXp = userProgress?.nextLevelXp || 100;
    const progressPercent = Math.min(100, (xp / nextLevelXp) * 100);

    return (
        <div className="flex items-center gap-4 bg-muted/30 p-2 rounded-full pr-4 border border-border/50">
            <div className="relative flex items-center justify-center w-10 h-10 rounded-full bg-gradient-to-br from-yellow-400 to-orange-500 text-white font-bold shadow-sm">
                {level}
                <span className="absolute -bottom-1 -right-1 bg-background text-[10px] px-1 rounded-full border border-border">LVL</span>
            </div>

            <div className="flex-1 min-w-[100px] flex flex-col gap-1">
                <div className="flex justify-between text-xs font-medium text-muted-foreground">
                    <span className="flex items-center gap-1 text-primary"><Zap className="w-3 h-3 fill-current" /> {xp} XP</span>
                    <span>{nextLevelXp} XP</span>
                </div>
                <div className="h-2 w-full bg-secondary rounded-full overflow-hidden">
                    <div
                        className="h-full bg-primary transition-all duration-500 ease-out"
                        style={{ width: `${progressPercent}%` }}
                    />
                </div>
            </div>
        </div>
    );
}
