import React from 'react';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Settings, Eye, Zap, Type, Activity, Bot } from 'lucide-react';
import { useAccessibility } from '@/contexts/AccessibilityContext';
import { useToast } from '@/hooks/use-toast';
import { Input } from '@/components/ui/input';
import { useState, useEffect } from 'react';

export function SettingsDialog() {
    const {
        dyslexicFont, toggleDyslexicFont,
        highContrast, toggleHighContrast,
        reduceMotion, toggleReduceMotion,
        focusMode, toggleFocusMode
    } = useAccessibility();

    const [openaiKey, setOpenaiKey] = useState('');
    const { toast } = useToast();

    useEffect(() => {
        const key = localStorage.getItem('studyflow_openai_key');
        if (key) setOpenaiKey(key);
    }, []);

    const handleSaveKey = () => {
        localStorage.setItem('studyflow_openai_key', openaiKey);
        toast({
            title: "API Key Saved",
            description: "Your OpenAI API key has been securely saved locally."
        });
    };

    return (
        <Dialog>
            <DialogTrigger asChild>
                <Button variant="ghost" size="icon">
                    <Settings className="h-5 w-5" />
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Settings & Accessibility</DialogTitle>
                    <DialogDescription>
                        Customize your learning experience.
                    </DialogDescription>
                </DialogHeader>
                <div className="grid gap-6 py-4">

                    <div className="flex items-center justify-between space-x-2">
                        <div className="flex items-center space-x-4">
                            <Type className="h-5 w-5 text-muted-foreground" />
                            <div className="flex flex-col space-y-1">
                                <Label htmlFor="dyslexic-mode">Dyslexia-Friendly Font</Label>
                                <span className="text-xs text-muted-foreground">Use OpenDyslexic font for better readability</span>
                            </div>
                        </div>
                        <Switch id="dyslexic-mode" checked={dyslexicFont} onCheckedChange={toggleDyslexicFont} />
                    </div>

                    <div className="flex items-center justify-between space-x-2">
                        <div className="flex items-center space-x-4">
                            <Eye className="h-5 w-5 text-muted-foreground" />
                            <div className="flex flex-col space-y-1">
                                <Label htmlFor="high-contrast">High Contrast</Label>
                                <span className="text-xs text-muted-foreground">Maximize legibility with strict colors</span>
                            </div>
                        </div>
                        <Switch id="high-contrast" checked={highContrast} onCheckedChange={toggleHighContrast} />
                    </div>

                    <div className="flex items-center justify-between space-x-2">
                        <div className="flex items-center space-x-4">
                            <Activity className="h-5 w-5 text-muted-foreground" />
                            <div className="flex flex-col space-y-1">
                                <Label htmlFor="reduce-motion">Reduce Motion</Label>
                                <span className="text-xs text-muted-foreground">Disable animations and transitions</span>
                            </div>
                        </div>
                        <Switch id="reduce-motion" checked={reduceMotion} onCheckedChange={toggleReduceMotion} />
                    </div>

                    <div className="flex items-center justify-between space-x-2">
                        <div className="flex items-center space-x-4">
                            <Zap className="h-5 w-5 text-muted-foreground" />
                            <div className="flex flex-col space-y-1">
                                <Label htmlFor="focus-mode">Focus Mode</Label>
                                <span className="text-xs text-muted-foreground">Dim UI distractions</span>
                            </div>
                        </div>
                        <Switch id="focus-mode" checked={focusMode} onCheckedChange={toggleFocusMode} />
                    </div>

                    <div className="border-t my-2" />

                    {/* AI Configuration Section */}
                    <div className="space-y-4">
                        <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                            <Bot className="h-4 w-4" /> AI Configuration
                        </h3>
                        <div className="space-y-2">
                            <Label htmlFor="openai-key">OpenAI API Key</Label>
                            <div className="flex gap-2">
                                <Input
                                    id="openai-key"
                                    type="password"
                                    placeholder="sk-..."
                                    value={openaiKey}
                                    onChange={(e) => setOpenaiKey(e.target.value)}
                                />
                                <Button onClick={handleSaveKey} size="sm">Save</Button>
                            </div>
                            <p className="text-[10px] text-muted-foreground">
                                Your key is stored locally in your browser and never sent to our servers.
                            </p>
                        </div>
                    </div>

                </div>
            </DialogContent>
        </Dialog>
    );
}
