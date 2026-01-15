import React, { createContext, useContext, useState, useEffect } from 'react';

interface AccessibilitySettings {
    dyslexicFont: boolean;
    highContrast: boolean;
    reduceMotion: boolean;
    focusMode: boolean; // Simplified UI
}

interface AccessibilityContextType extends AccessibilitySettings {
    toggleDyslexicFont: () => void;
    toggleHighContrast: () => void;
    toggleReduceMotion: () => void;
    toggleFocusMode: () => void;
}

const AccessibilityContext = createContext<AccessibilityContextType | undefined>(undefined);

export function AccessibilityProvider({ children }: { children: React.ReactNode }) {
    const [settings, setSettings] = useState<AccessibilitySettings>(() => {
        const stored = localStorage.getItem('studyflow_accessibility');
        return stored ? JSON.parse(stored) : {
            dyslexicFont: false,
            highContrast: false,
            reduceMotion: false,
            focusMode: false,
        };
    });

    useEffect(() => {
        localStorage.setItem('studyflow_accessibility', JSON.stringify(settings));

        // Apply classes to document body
        document.body.classList.toggle('font-dyslexic', settings.dyslexicFont);
        document.body.classList.toggle('high-contrast', settings.highContrast);
        document.body.classList.toggle('reduce-motion', settings.reduceMotion);
        document.body.classList.toggle('focus-mode', settings.focusMode);

    }, [settings]);

    const toggleDyslexicFont = () => setSettings(p => ({ ...p, dyslexicFont: !p.dyslexicFont }));
    const toggleHighContrast = () => setSettings(p => ({ ...p, highContrast: !p.highContrast }));
    const toggleReduceMotion = () => setSettings(p => ({ ...p, reduceMotion: !p.reduceMotion }));
    const toggleFocusMode = () => setSettings(p => ({ ...p, focusMode: !p.focusMode }));

    return (
        <AccessibilityContext.Provider value={{
            ...settings,
            toggleDyslexicFont,
            toggleHighContrast,
            toggleReduceMotion,
            toggleFocusMode,
        }}>
            {children}
        </AccessibilityContext.Provider>
    );
}

export const useAccessibility = () => {
    const context = useContext(AccessibilityContext);
    if (context === undefined) {
        throw new Error('useAccessibility must be used within an AccessibilityProvider');
    }
    return context;
};
