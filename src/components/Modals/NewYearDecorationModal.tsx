import { useState } from 'react';
import { User } from '@/types/auth';
import { DecorationService } from '@/services/decoration-service';
import { ProfileCustomizationService } from '@/services/profile-customization-service';
import { showToast } from '@/lib/toast';
import AvatarDecorationOverlay from '@/components/AvatarDecorationOverlay';

interface NewYearDecorationModalProps {
    user: User;
    onClose: () => void;
}

export default function NewYearDecorationModal({ user, onClose }: NewYearDecorationModalProps) {
    const [claiming, setClaiming] = useState(false);

    const handleClaim = async (shouldEquip: boolean) => {
        setClaiming(true);
        try {
            const decoration = await DecorationService.getDecorationByName('New Year 2026');
            if (!decoration) {
                showToast.error('Decoration not found');
                return;
            }

            const claimResult = await DecorationService.claimDecoration(user.id, decoration.id);
            if (!claimResult.success) {
                showToast.error('Failed to claim decoration');
                return;
            }

            if (shouldEquip) {
                const equipResult = await DecorationService.equipDecoration(user.id, decoration.id);
                if (!equipResult.success) {
                    showToast.error('Failed to equip decoration');
                    return;
                }

                await ProfileCustomizationService.upsertCustomization(user.id, {
                    avatar_decoration_id: decoration.id
                });

                showToast.success('Happy New Year! Decoration equipped!');
            } else {
                showToast.success('Decoration claimed!');
            }

            onClose();
        } catch (error) {
            showToast.error('Something went wrong. Please try again.');
        } finally {
            setClaiming(false);
        }
    };

    const avatarLetter = (user.username || user.email || 'U')[0].toUpperCase();
    const displayName = user.display_name || user.username || 'User';

    const previewDecoration = {
        id: 'preview_new_year',
        name: 'New Year 2026',
        description: 'Welcome to 2026! Y2K Style.',
        image_url: '/decorations/new-year-2026.png',
        type: 'static',
        is_free: true,
        created_at: new Date().toISOString()
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <div className="bg-zinc-900 border border-zinc-800 rounded-xl shadow-2xl max-w-md w-full overflow-hidden animate-in fade-in zoom-in duration-300">
                <div className="relative px-6 py-8 text-center border-b border-zinc-800 bg-[radial-gradient(ellipse_at_top,var(--tw-gradient-stops))] from-zinc-700/50 via-zinc-900/50 to-transparent">
                    <button
                        onClick={onClose}
                        className="absolute top-4 right-4 text-zinc-400 hover:text-white transition-colors"
                        disabled={claiming}
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>

                    <h2 className="text-3xl font-bold text-white mb-2 tracking-tighter">2026</h2>
                    <p className="text-zinc-400 text-sm font-medium uppercase tracking-widest">Happy New Year</p>
                </div>

                <div className="px-6 py-6 space-y-6">
                    <div className="bg-zinc-950/50 rounded-lg p-8 border border-zinc-800/50 flex justify-center">
                        <div className="flex flex-col items-center gap-4">
                            <div className="relative scale-125">
                                {user.avatar_url ? (
                                    <img
                                        src={user.avatar_url}
                                        alt="Your avatar"
                                        className="w-24 h-24 rounded-full object-cover border-2 border-zinc-700 bg-zinc-800"
                                    />
                                ) : (
                                    <div className="w-24 h-24 rounded-full bg-zinc-700 flex items-center justify-center text-white font-semibold text-3xl border-2 border-zinc-600">
                                        {avatarLetter}
                                    </div>
                                )}

                                <AvatarDecorationOverlay decoration={previewDecoration as any} />
                            </div>
                        </div>
                    </div>

                    <div className="text-center space-y-2">
                        <p className="text-zinc-300 text-sm">
                            Celebrate the arrival of 2026 with this exclusive <span className="text-white font-bold">Y2K Chrome</span> decoration.
                        </p>
                    </div>

                    <div className="flex flex-col gap-3">
                        <button
                            onClick={() => handleClaim(true)}
                            disabled={claiming}
                            className="w-full px-6 py-3 bg-white text-black hover:bg-zinc-200 font-bold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-[0_0_15px_rgba(255,255,255,0.3)]"
                        >
                            {claiming ? 'Claiming...' : 'Equip Now'}
                        </button>
                        <button
                            onClick={() => handleClaim(false)}
                            disabled={claiming}
                            className="w-full px-6 py-3 bg-zinc-800 hover:bg-zinc-700 text-white font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {claiming ? 'Claiming...' : 'Save for Later'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
