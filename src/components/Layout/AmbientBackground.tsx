import { useEffect, useRef } from 'react';
import { usePlayer } from '@/hooks/player/usePlayer';
import { useTheme } from '@/contexts/ThemeContext';
import { useAuth } from '@/contexts/AuthContext';
import { SettingsService } from '@/services/settings-service';
import { FastAverageColor } from 'fast-average-color';
import { motion, AnimatePresence } from 'framer-motion';

export default function AmbientBackground() {
    const { currentTrack } = usePlayer();
    const { dominantColor, setDominantColor, isAmbientEnabled, setIsAmbientEnabled } = useTheme();
    const facRef = useRef<FastAverageColor | null>(null);
    const { user } = useAuth();

    useEffect(() => {
        if (!user) return;

        const loadSettings = async () => {
            const settings = await SettingsService.getUserSettings(user.id);
            if (settings) {
                setIsAmbientEnabled(settings.ambient_background);
            }
        };

        loadSettings();
    }, [user, setIsAmbientEnabled]);

    useEffect(() => {
        facRef.current = new FastAverageColor();
        return () => {
            facRef.current?.destroy();
        };
    }, []);

    useEffect(() => {
        if (!currentTrack?.thumbnail || !facRef.current || !isAmbientEnabled) {
            // If disabled or no track, we might want to clear the color
            if (!isAmbientEnabled) {
                setDominantColor(null);
            }
            return;
        }

        const extractColor = async () => {
            try {
                // Use 'simple' algorithm (average) instead of 'dominant' to capture the overall tint
                // even if the image is mostly black.
                const color = await facRef.current?.getColorAsync(currentTrack.thumbnail, {
                    algorithm: 'simple',
                    ignoredColor: [0, 0, 0, 255],
                });

                if (color) {
                    // Boost the color to ensure it glows
                    // We can't easily manipulate rgba string, so let's use the [r,g,b] array from color.value
                    const [r, g, b] = color.value;

                    // Convert to HSL to adjust saturation and lightness
                    const rgbToHsl = (r: number, g: number, b: number) => {
                        r /= 255; g /= 255; b /= 255;
                        const max = Math.max(r, g, b), min = Math.min(r, g, b);
                        let h = 0, s, l = (max + min) / 2;

                        if (max === min) {
                            h = s = 0; // achromatic
                        } else {
                            const d = max - min;
                            s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
                            switch (max) {
                                case r: h = (g - b) / d + (g < b ? 6 : 0); break;
                                case g: h = (b - r) / d + 2; break;
                                case b: h = (r - g) / d + 4; break;
                            }
                            h /= 6;
                        }
                        return [h, s, l];
                    };

                    const [h, s, l] = rgbToHsl(r, g, b);

                    // Boost saturation if it's too low (but not for pure grays)
                    // Boost lightness if it's too dark
                    const newS = s < 0.1 ? s : Math.max(s, 0.5); // Ensure at least 50% saturation for colored tracks
                    const newL = Math.max(l, 0.3); // Ensure at least 30% lightness

                    // Convert back to CSS string
                    const finalColor = `hsl(${Math.round(h * 360)}, ${Math.round(newS * 100)}%, ${Math.round(newL * 100)}%)`;

                    setDominantColor(finalColor);
                }
            } catch (e) {
                console.error('Error extracting color:', e);
            }
        };

        extractColor();
    }, [currentTrack?.thumbnail, setDominantColor]);

    return (
        <div className="fixed inset-0 z-[-1] overflow-hidden pointer-events-none bg-zinc-950">
            <AnimatePresence mode="wait">
                {dominantColor && (
                    <motion.div
                        key={dominantColor}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 1.5, ease: "easeInOut" }}
                        className="absolute inset-0"
                        style={{
                            background: `
                radial-gradient(circle at 50% 30%, ${dominantColor} 0%, transparent 70%),
                radial-gradient(circle at 80% 80%, ${dominantColor} 0%, transparent 50%)
              `,
                            filter: 'blur(60px) saturate(2.0)',
                            opacity: 0.5
                        }}
                    />
                )}
            </AnimatePresence>

            {/* Overlay to ensure text readability */}
            <div className="absolute inset-0 bg-zinc-950/80" />
        </div>
    );
}
