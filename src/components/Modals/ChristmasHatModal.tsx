import { useState } from 'react';
import { User } from '@/types/auth';
import { DecorationService } from '@/services/decoration-service';
import { ProfileCustomizationService } from '@/services/profile-customization-service';
import { showToast } from '@/lib/toast';
import { dismissChristmasModal } from '@/lib/christmas-utils';

interface ChristmasHatModalProps {
    user: User;
    onClose: () => void;
}

export default function ChristmasHatModal({ user, onClose }: ChristmasHatModalProps) {
    const [claiming, setClaiming] = useState(false);

    const handleClaim = async (shouldEquip: boolean) => {
        setClaiming(true);
        try {
            const santaHat = await DecorationService.getDecorationByName('Santa Hat');
            if (!santaHat) {
                showToast.error('Santa Hat decoration not found');
                return;
            }

            const claimResult = await DecorationService.claimDecoration(user.id, santaHat.id);
            if (!claimResult.success) {
                showToast.error('Failed to claim Santa Hat');
                return;
            }

            if (shouldEquip) {
                const equipResult = await DecorationService.equipDecoration(user.id, santaHat.id);
                if (!equipResult.success) {
                    showToast.error('Failed to equip Santa Hat');
                    return;
                }

                await ProfileCustomizationService.upsertCustomization(user.id, {
                    avatar_decoration_id: santaHat.id
                });

                showToast.success('Santa Hat claimed and equipped!');
            } else {
                showToast.success('Santa Hat claimed! Go to Settings → Account to equip it.');
            }

            dismissChristmasModal();
            onClose();
        } catch (error) {
            showToast.error('Something went wrong. Please try again.');
        } finally {
            setClaiming(false);
        }
    };

    const handleDismiss = () => {
        dismissChristmasModal();
        onClose();
    };

    const avatarLetter = (user.username || user.email || 'U')[0].toUpperCase();
    const displayName = user.display_name || user.username || 'User';

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <div className="bg-zinc-900 border border-zinc-800 rounded-xl shadow-2xl max-w-md w-full overflow-hidden">
                {/* Header */}
                <div className="relative px-6 py-6 text-center border-b border-zinc-800">
                    <button
                        onClick={handleDismiss}
                        className="absolute top-4 right-4 text-zinc-400 hover:text-white transition-colors"
                        disabled={claiming}
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>

                    <h2 className="text-2xl font-bold text-white mb-1">Christmas Gift</h2>
                    <p className="text-zinc-400 text-sm">Exclusive Santa Hat decoration</p>
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

                                <div className="absolute left-1/2 top-0 -translate-x-[60%] -translate-y-[32%] -rotate-[8deg] w-[180%] aspect-square pointer-events-none z-10">
                                    <img
                                        src="/decorations/santa-hat.png"
                                        alt="Santa Hat"
                                        className="w-full h-full object-contain drop-shadow-lg"
                                    />
                                </div>
                            </div>

                            <div className="text-center">
                                <p className="text-lg font-semibold text-white">{displayName}</p>
                                <p className="text-sm text-zinc-400">@{user.username || 'user'}</p>
                            </div>
                        </div>
                    </div>

                    <div className="text-center space-y-2">
                        <p className="text-zinc-300 text-sm">
                            Celebrate the holidays with this exclusive Santa Hat decoration for your avatar.
                        </p>
                        <p className="text-zinc-500 text-xs">
                            Available only December 23-25, 2025
                        </p>
                    </div>

                    <div className="flex flex-col gap-3">
                        <button
                            onClick={() => handleClaim(true)}
                            disabled={claiming}
                            className="w-full px-6 py-3 bg-white text-black font-semibold rounded-lg hover:bg-zinc-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
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
                        <button
                            onClick={handleDismiss}
                            disabled={claiming}
                            className="w-full px-4 py-2 text-zinc-400 hover:text-white text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            Maybe Later
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
