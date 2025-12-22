import React, { createContext, useContext, useState, ReactNode } from 'react';

interface ThemeContextType {
    dominantColor: string | null;
    setDominantColor: (color: string | null) => void;
    isAmbientEnabled: boolean;
    setIsAmbientEnabled: (enabled: boolean) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: ReactNode }) {
    const [dominantColor, setDominantColor] = useState<string | null>(null);
    const [isAmbientEnabled, setIsAmbientEnabled] = useState(true);

    return (
        <ThemeContext.Provider value={{ dominantColor, setDominantColor, isAmbientEnabled, setIsAmbientEnabled }}>
            {children}
        </ThemeContext.Provider>
    );
}

export function useTheme() {
    const context = useContext(ThemeContext);
    if (context === undefined) {
        throw new Error('useTheme must be used within a ThemeProvider');
    }
    return context;
}
