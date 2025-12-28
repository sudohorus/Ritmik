import { useState, useEffect } from 'react';
import { ProfileCustomization, ProfileCustomizationUpdate } from '@/types/profile-customization';
import { AvatarDecoration } from '@/types/avatar-decoration';
import { DecorationService } from '@/services/decoration-service';
import { showToast } from '@/lib/toast';
import AvatarDecorationOverlay from '@/components/AvatarDecorationOverlay';

interface ProfileCustomizationEditorProps {
    customization: ProfileCustomization;
    availableDecorations: AvatarDecoration[];
    onChange: (updates: ProfileCustomizationUpdate) => void;
    onSave: () => void;
    onReset: () => void;
    onRefreshDecorations: () => Promise<void>;
    saving?: boolean;
    user: any;
}

export default function ProfileCustomizationEditor({
    customization,
    availableDecorations,
    onChange,
    onSave,
    onReset,
    onRefreshDecorations,
    saving = false,
    user,
}: ProfileCustomizationEditorProps) {
    const [localCustomization, setLocalCustomization] = useState(customization);

    useEffect(() => {
        setLocalCustomization(customization);
    }, [customization]);

    const handleChange = (updates: ProfileCustomizationUpdate) => {
        const newCustomization = { ...localCustomization, ...updates };
        setLocalCustomization(newCustomization);
        onChange(updates);
    };

    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-2xl font-bold mb-2">Customize Your Profile</h2>
                <p className="text-zinc-400 text-sm">
                    Personalize your profile background and avatar
                </p>
            </div>

            <div>
                <label className="block text-sm font-medium text-zinc-300 mb-3">
                    Background Mode
                </label>
                <div className="grid grid-cols-2 gap-3">
                    <button
                        type="button"
                        onClick={() => handleChange({ background_mode: 'banner' })}
                        className={`p-4 rounded-lg border-2 transition-all ${localCustomization.background_mode === 'banner'
                            ? 'border-white bg-white/10'
                            : 'border-zinc-700 bg-zinc-800/50 hover:border-zinc-600'
                            }`}
                    >
                        <div className="text-sm font-medium mb-1">Banner</div>
                        <div className="text-xs text-zinc-400">Fixed at top</div>
                    </button>
                    <button
                        type="button"
                        onClick={() => handleChange({ background_mode: 'full-bg' })}
                        className={`p-4 rounded-lg border-2 transition-all ${localCustomization.background_mode === 'full-bg'
                            ? 'border-white bg-white/10'
                            : 'border-zinc-700 bg-zinc-800/50 hover:border-zinc-600'
                            }`}
                    >
                        <div className="text-sm font-medium mb-1">Full Background</div>
                        <div className="text-xs text-zinc-400">Covers entire page</div>
                    </button>
                </div>
            </div>

            <div>
                <label className="block text-sm font-medium text-zinc-300 mb-3">
                    Background Brightness: {localCustomization.background_brightness}%
                </label>
                <input
                    type="range"
                    min="0"
                    max="200"
                    value={localCustomization.background_brightness}
                    onChange={(e) => handleChange({ background_brightness: parseInt(e.target.value) })}
                    className="w-full h-2 bg-zinc-700 rounded-lg appearance-none cursor-pointer accent-white"
                />
                <div className="flex justify-between text-xs text-zinc-500 mt-1">
                    <span>Dark</span>
                    <span className="text-zinc-400">Normal (100%)</span>
                    <span>Bright</span>
                </div>
            </div>

            <div>
                <label className="block text-sm font-medium text-zinc-300 mb-3">
                    Background Blur: {localCustomization.background_blur}px
                </label>
                <input
                    type="range"
                    min="0"
                    max="20"
                    value={localCustomization.background_blur}
                    onChange={(e) => handleChange({ background_blur: parseInt(e.target.value) })}
                    className="w-full h-2 bg-zinc-700 rounded-lg appearance-none cursor-pointer accent-white"
                />
                <div className="flex justify-between text-xs text-zinc-500 mt-1">
                    <span>No blur</span>
                    <span>Maximum blur</span>
                </div>
            </div>

            <div>
                <label className="block text-sm font-medium text-zinc-300 mb-3">
                    Avatar Decoration
                </label>

                <div className="grid grid-cols-3 gap-3">
                    <button
                        type="button"
                        onClick={() => handleChange({ avatar_decoration_id: null })}
                        className={`aspect-square rounded-xl border-2 flex items-center justify-center transition-all ${!localCustomization.avatar_decoration_id
                            ? 'border-white bg-white/10'
                            : 'border-zinc-700 bg-zinc-800/50 hover:border-zinc-600'
                            }`}
                    >
                        <span className="text-sm text-zinc-400">None</span>
                    </button>

                    {availableDecorations.map((decoration) => (
                        <button
                            key={decoration.id}
                            type="button"
                            onClick={() => handleChange({ avatar_decoration_id: decoration.id })}
                            className={`aspect-square rounded-xl border-2 relative overflow-hidden transition-all group ${localCustomization.avatar_decoration_id === decoration.id
                                ? 'border-white bg-white/10'
                                : 'border-zinc-700 bg-zinc-800/50 hover:border-zinc-600'
                                }`}
                            title={decoration.name}
                        >
                            <div className="absolute inset-0 flex items-center justify-center">
                                <div className="w-16 h-16 rounded-full bg-zinc-700 relative">
                                    <AvatarDecorationOverlay decoration={decoration} />
                                </div>
                            </div>

                            <div className="absolute bottom-0 left-0 right-0 bg-black/60 text-[10px] text-center py-1 opacity-0 group-hover:opacity-100 transition-opacity truncate px-1">
                                {decoration.name}
                            </div>
                        </button>
                    ))}
                </div>
            </div>

            <div className="flex gap-3 pt-4 border-t border-zinc-800">
                <button
                    type="button"
                    onClick={onSave}
                    disabled={saving}
                    className="flex-1 px-6 py-3 bg-white text-black rounded-lg font-semibold hover:bg-zinc-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {saving ? 'Saving...' : 'Save Changes'}
                </button>
                <button
                    type="button"
                    onClick={onReset}
                    disabled={saving}
                    className="px-6 py-3 bg-zinc-800 hover:bg-zinc-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    Reset to Default
                </button>
            </div>
        </div>
    );
}
