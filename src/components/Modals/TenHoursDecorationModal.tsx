import { useState } from 'react';
import { User } from '@/types/auth';
import { DecorationService } from '@/services/decoration-service';
import { ProfileCustomizationService } from '@/services/profile-customization-service';
import { showToast } from '@/lib/toast';
import AvatarDecorationOverlay from '@/components/AvatarDecorationOverlay';

interface TenHoursDecorationModalProps {
    user: User;
    onClose: () => void;
}

export default function TenHoursDecorationModal({ user, onClose }: TenHoursDecorationModalProps) {
    const [claiming, setClaiming] = useState(false);

    const handleClaim = async (shouldEquip: boolean) => {
        setClaiming(true);
        try {
            const decoration = await DecorationService.getDecorationByName('10 Hours Listener');
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

                showToast.success('Decoration claimed and equipped!');
            } else {
                showToast.success('Decoration claimed! Go to Settings → Account to equip it.');
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
        id: 'preview',
        name: '10 Hours Listener',
        description: 'Awarded for listening to 10+ hours of music',
        image_url: '/decorations/10h-listener.png',
        type: 'static',
        is_free: false,
        created_at: new Date().toISOString()
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <div className="bg-zinc-900 border border-zinc-800 rounded-xl shadow-2xl max-w-md w-full overflow-hidden animate-in fade-in zoom-in duration-300">
                <div className="relative px-6 py-6 text-center border-b border-zinc-800 bg-linear-to-b from-blue-950/30 to-transparent">
                    <button
                        onClick={onClose}
                        className="absolute top-4 right-4 text-zinc-400 hover:text-white transition-colors"
                        disabled={claiming}
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>

                    <h2 className="text-2xl font-bold text-white mb-1">Achievement Unlocked!</h2>
                    <p className="text-blue-400 text-sm font-medium">10 Hours Listener</p>
                </div>

                <div className="px-6 py-6 space-y-6">
                    <div className="bg-zinc-950/50 rounded-lg p-6 border border-zinc-800/50">
                        <div className="flex flex-col items-center gap-4">
                            <div className="relative">
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

                            <div className="text-center">
                                <p className="text-lg font-semibold text-white">{displayName}</p>
                                <p className="text-sm text-zinc-400">@{user.username || 'user'}</p>
                            </div>
                        </div>
                    </div>

                    <div className="text-center space-y-2">
                        <p className="text-zinc-300 text-sm">
                            You've listened to over 10 hours of music on Ritmik!
                            As a reward, you've unlocked this exclusive avatar decoration.
                        </p>
                    </div>

                    <div className="flex flex-col gap-3">
                        <button
                            onClick={() => handleClaim(true)}
                            disabled={claiming}
                            className="w-full px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-blue-900/20"
                        >
                            {claiming ? 'Claiming...' : 'Claim & Equip'}
                        </button>
                        <button
                            onClick={() => handleClaim(false)}
                            disabled={claiming}
                            className="w-full px-6 py-3 bg-zinc-800 hover:bg-zinc-700 text-white font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {claiming ? 'Claiming...' : 'Claim Only'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
