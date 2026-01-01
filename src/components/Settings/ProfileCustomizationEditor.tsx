import { useState, useEffect } from 'react';
import { ProfileCustomization, ProfileCustomizationUpdate } from '@/types/profile-customization';
import { AvatarDecoration } from '@/types/avatar-decoration';
import { DecorationService } from '@/services/decoration-service';
import { showToast } from '@/lib/toast';
import ImageCropperModal from '@/components/Modals/ImageCropperModal';
import AvatarDecorationOverlay from '@/components/AvatarDecorationOverlay';
import { TrackService } from '@/services/track-service';
import { Track } from '@/types/track';

interface ProfileCustomizationEditorProps {
    customization: ProfileCustomization;
    availableDecorations: AvatarDecoration[];
    onChange: (updates: ProfileCustomizationUpdate) => void;
    onSave: () => void;
    onReset: () => void;
    onRefreshDecorations: () => Promise<void>;
    saving?: boolean;
    user: any;
    showSaveButton?: boolean;
    currentBannerUrl?: string;
    currentAvatarUrl?: string;
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
    showSaveButton = true,
    currentBannerUrl,
    currentAvatarUrl,
}: ProfileCustomizationEditorProps) {
    const [localCustomization, setLocalCustomization] = useState(customization);
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState<Track[]>([]);
    const [isSearching, setIsSearching] = useState(false);

    const [activeSection, setActiveSection] = useState<'layout' | 'appearance' | 'avatar' | 'music' | null>('layout');

    const [cropperState, setCropperState] = useState<{
        isOpen: boolean;
        type: 'banner' | 'avatar';
        imageUrl: string;
        aspectRatio: number;
    }>({
        isOpen: false,
        type: 'banner',
        imageUrl: '',
        aspectRatio: 16 / 9
    });

    useEffect(() => {
        setLocalCustomization(customization);
    }, [customization]);

    const handleChange = (updates: ProfileCustomizationUpdate) => {
        const newCustomization = { ...localCustomization, ...updates };
        setLocalCustomization(newCustomization);
        onChange(updates);
    };

    const handleSearch = async () => {
        if (!searchQuery.trim()) return;

        setIsSearching(true);
        try {
            const response = await TrackService.search(searchQuery);
            setSearchResults(response.data || []);
        } catch (error) {
            showToast.error('Failed to search tracks');
        } finally {
            setIsSearching(false);
        }
    };

    const handleMusicUpdate = (field: 'custom_title' | 'custom_artist' | 'custom_thumbnail', value: string) => {
        if (!localCustomization.favorite_music) return;

        const updatedMusic = {
            ...localCustomization.favorite_music,
            [field]: value
        };

        handleChange({ favorite_music: updatedMusic });
    };

    const SectionButton = ({ id, label, icon }: { id: typeof activeSection, label: string, icon: React.ReactNode }) => (
        <button
            type="button"
            onClick={() => setActiveSection(activeSection === id ? null : id)}
            className={`w-full flex items-center justify-between p-4 rounded-lg border transition-all ${activeSection === id
                ? 'bg-zinc-800 border-zinc-600'
                : 'bg-zinc-900/50 border-zinc-800 hover:border-zinc-700'
                }`}
        >
            <div className="flex items-center gap-3">
                {icon}
                <span className="font-medium">{label}</span>
            </div>
            <svg
                className={`w-5 h-5 text-zinc-500 transition-transform ${activeSection === id ? 'rotate-180' : ''}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
            >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
        </button>
    );

    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-2xl font-bold mb-2">Customize Your Profile</h2>
                <p className="text-zinc-400 text-sm">
                    Personalize your profile background, avatar, and featured music
                </p>
            </div>

            <div className="space-y-3">
                <SectionButton
                    id="layout"
                    label="Layout"
                    icon={
                        <svg className="w-5 h-5 text-zinc-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z" />
                        </svg>
                    }
                />
                {activeSection === 'layout' && (
                    <div className="p-4 bg-zinc-900/30 rounded-lg border border-zinc-800/50 animate-in fade-in slide-in-from-top-2 duration-200 space-y-4">
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

                        {localCustomization.background_mode === 'banner' && (
                            <div className="pt-2 border-t border-zinc-800/50">
                                <label className="block text-sm font-medium text-zinc-300 mb-3">
                                    Banner Position
                                </label>
                                <div className="flex items-center gap-4">
                                    <button
                                        type="button"
                                        onClick={() => setCropperState({
                                            isOpen: true,
                                            type: 'banner',
                                            imageUrl: currentBannerUrl || user.banner_url || '',
                                            aspectRatio: 3 / 1
                                        })}
                                        disabled={!currentBannerUrl && !user.banner_url}
                                        className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                                    >
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 4l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
                                        </svg>
                                        Adjust Crop & Zoom
                                    </button>
                                    {(!currentBannerUrl && !user.banner_url) && (
                                        <span className="text-xs text-zinc-500">Upload a banner first to adjust position</span>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                )}

                <SectionButton
                    id="appearance"
                    label="Appearance"
                    icon={
                        <svg className="w-5 h-5 text-zinc-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                        </svg>
                    }
                />
                {activeSection === 'appearance' && (
                    <div className="p-4 bg-zinc-900/30 rounded-lg border border-zinc-800/50 animate-in fade-in slide-in-from-top-2 duration-200">
                        <div className="space-y-6">
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
                                    <span className="text-zinc-400">Normal</span>
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
                                    <span>Max</span>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                <SectionButton
                    id="avatar"
                    label="Avatar Decoration"
                    icon={
                        <svg className="w-5 h-5 text-zinc-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.121 17.804A13.937 13.937 0 0112 16c2.5 0 4.847.655 6.879 1.804M15 10a3 3 0 11-6 0 3 3 0 016 0zm6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                    }
                />
                {activeSection === 'avatar' && (
                    <div className="p-4 bg-zinc-900/30 rounded-lg border border-zinc-800/50 animate-in fade-in slide-in-from-top-2 duration-200">
                        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3">
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

                        <div className="mt-4 pt-4 border-t border-zinc-800/50">
                            <label className="block text-sm font-medium text-zinc-300 mb-3">
                                Avatar Position
                            </label>
                            <p className="text-xs text-zinc-500">Avatar is always centered.</p>
                        </div>
                    </div>
                )}

                <SectionButton
                    id="music"
                    label="Favorite Music"
                    icon={
                        <svg className="w-5 h-5 text-zinc-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
                        </svg>
                    }
                />
                {activeSection === 'music' && (
                    <div className="p-4 bg-zinc-900/30 rounded-lg border border-zinc-800/50 animate-in fade-in slide-in-from-top-2 duration-200">
                        {localCustomization.favorite_music ? (
                            <div className="space-y-4">
                                <div className="bg-zinc-800/50 border border-zinc-700 rounded-lg p-4 flex items-center gap-4 relative group">
                                    <div className="w-16 h-16 bg-zinc-700 rounded overflow-hidden shrink-0">
                                        <img
                                            src={localCustomization.favorite_music.custom_thumbnail || localCustomization.favorite_music.thumbnail}
                                            alt={localCustomization.favorite_music.custom_title || localCustomization.favorite_music.title}
                                            className="w-full h-full object-cover"
                                        />
                                    </div>
                                    <div className="min-w-0 flex-1">
                                        <h4 className="font-medium text-white truncate text-lg">
                                            {localCustomization.favorite_music.custom_title || localCustomization.favorite_music.title}
                                        </h4>
                                        <p className="text-sm text-zinc-400 truncate">
                                            {localCustomization.favorite_music.custom_artist || localCustomization.favorite_music.artist}
                                        </p>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => handleChange({ favorite_music: null })}
                                        className="p-2 text-zinc-400 hover:text-red-400 transition-colors"
                                        title="Remove favorite music"
                                    >
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                        </svg>
                                    </button>
                                </div>

                                <div className="space-y-3 pt-4 border-t border-zinc-800/50">
                                    <h4 className="text-sm font-medium text-zinc-300">Customize Details</h4>

                                    <div>
                                        <label className="block text-xs text-zinc-500 mb-1">Title</label>
                                        <input
                                            type="text"
                                            value={localCustomization.favorite_music.custom_title ?? localCustomization.favorite_music.title}
                                            onChange={(e) => handleMusicUpdate('custom_title', e.target.value)}
                                            className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded text-sm text-white focus:outline-none focus:border-zinc-500"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-xs text-zinc-500 mb-1">Artist</label>
                                        <input
                                            type="text"
                                            value={localCustomization.favorite_music.custom_artist ?? localCustomization.favorite_music.artist}
                                            onChange={(e) => handleMusicUpdate('custom_artist', e.target.value)}
                                            className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded text-sm text-white focus:outline-none focus:border-zinc-500"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-xs text-zinc-500 mb-1">Image URL</label>
                                        <input
                                            type="text"
                                            value={localCustomization.favorite_music.custom_thumbnail ?? localCustomization.favorite_music.thumbnail}
                                            onChange={(e) => handleMusicUpdate('custom_thumbnail', e.target.value)}
                                            className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded text-sm text-white focus:outline-none focus:border-zinc-500"
                                        />
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                <div className="flex gap-2">
                                    <input
                                        type="text"
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter') {
                                                e.preventDefault();
                                                handleSearch();
                                            }
                                        }}
                                        placeholder="Search for a song..."
                                        className="flex-1 px-4 py-3 bg-zinc-800 border border-zinc-700 rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:border-zinc-500 focus:ring-1 focus:ring-zinc-500 transition-colors"
                                    />
                                    <button
                                        type="button"
                                        onClick={handleSearch}
                                        disabled={isSearching || !searchQuery.trim()}
                                        className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50"
                                    >
                                        {isSearching ? '...' : 'Search'}
                                    </button>
                                </div>

                                {searchResults.length > 0 && (
                                    <div className="max-h-60 overflow-y-auto bg-zinc-800/50 border border-zinc-700 rounded-lg divide-y divide-zinc-700/50">
                                        {searchResults.map((track) => (
                                            <button
                                                key={track.videoId}
                                                type="button"
                                                onClick={() => {
                                                    handleChange({ favorite_music: track });
                                                    setSearchResults([]);
                                                    setSearchQuery('');
                                                }}
                                                className="w-full p-3 flex items-center gap-3 hover:bg-zinc-700/50 transition-colors text-left"
                                            >
                                                <div className="w-10 h-10 bg-zinc-700 rounded overflow-hidden shrink-0">
                                                    <img src={track.thumbnail} alt="" className="w-full h-full object-cover" />
                                                </div>
                                                <div className="min-w-0">
                                                    <div className="text-sm font-medium text-white truncate">{track.title}</div>
                                                    <div className="text-xs text-zinc-400 truncate">{track.artist}</div>
                                                </div>
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                )}
            </div>

            <div className="flex gap-3 pt-4 border-t border-zinc-800">
                {showSaveButton && (
                    <button
                        type="button"
                        onClick={onSave}
                        disabled={saving}
                        className="flex-1 px-6 py-3 bg-white text-black rounded-lg font-semibold hover:bg-zinc-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {saving ? 'Saving...' : 'Save Changes'}
                    </button>
                )}
                <button
                    type="button"
                    onClick={onReset}
                    disabled={saving}
                    className="px-6 py-3 bg-zinc-800 hover:bg-zinc-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    Reset to Default
                </button>
            </div>

            <ImageCropperModal
                isOpen={cropperState.isOpen}
                imageUrl={cropperState.imageUrl}
                aspectRatio={cropperState.aspectRatio}
                initialCrop={cropperState.type === 'banner' ? localCustomization.banner_crop : localCustomization.avatar_crop}
                onCancel={() => setCropperState(prev => ({ ...prev, isOpen: false }))}
                onSave={(cropData) => {
                    if (cropperState.type === 'banner') {
                        handleChange({ banner_crop: cropData });
                    } else {
                        handleChange({ avatar_crop: cropData });
                    }
                    setCropperState(prev => ({ ...prev, isOpen: false }));
                }}
                title={cropperState.type === 'banner' ? 'Adjust Banner' : 'Adjust Avatar'}
            />
        </div>
    );
}
