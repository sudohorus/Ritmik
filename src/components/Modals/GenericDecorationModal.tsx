import { useState } from 'react';
import { User } from '@/types/auth';
import { AvatarDecoration } from '@/types/avatar-decoration';
import AvatarDecorationOverlay from '@/components/AvatarDecorationOverlay';
import { showToast } from '@/lib/toast';

interface GenericDecorationModalProps {
    user: User;
    decoration: Partial<AvatarDecoration> & { image_url: string; name: string };
    title: string;
    subtitle?: string;
    description: React.ReactNode;
    onClaim: (shouldEquip: boolean) => Promise<{ success: boolean; error?: any }>;
    onClose: () => void;
    themeColor?: string; 
}

export default function GenericDecorationModal({
    user,
    decoration,
    title,
    subtitle,
    description,
    onClaim,
    onClose,
    themeColor = '#ffffff'
}: GenericDecorationModalProps) {
    const [claiming, setClaiming] = useState(false);

    const handleClaim = async (shouldEquip: boolean) => {
        setClaiming(true);
        try {
            const result = await onClaim(shouldEquip);
            if (result.success) {
                onClose();
            }
        } catch (error) {
            showToast.error('Something went wrong. Please try again.');
        } finally {
            setClaiming(false);
        }
    };

    const avatarLetter = (user.username || user.email || 'U')[0].toUpperCase();

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <div className="bg-zinc-900 border border-zinc-800 rounded-xl shadow-2xl max-w-md w-full overflow-hidden animate-in fade-in zoom-in duration-300">
                <div
                    className="relative px-6 py-8 text-center border-b border-zinc-800"
                    style={{
                        background: `radial-gradient(ellipse at top, ${themeColor}20, transparent)`
                    }}
                >
                    <button
                        onClick={onClose}
                        className="absolute top-4 right-4 text-zinc-400 hover:text-white transition-colors"
                        disabled={claiming}
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>

                    <h2 className="text-3xl font-bold text-white mb-2 tracking-tighter">{title}</h2>
                    {subtitle && (
                        <p className="text-zinc-400 text-sm font-medium uppercase tracking-widest">{subtitle}</p>
                    )}
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

                                <AvatarDecorationOverlay decoration={decoration as any} />
                            </div>
                        </div>
                    </div>

                    <div className="text-center space-y-2">
                        <div className="text-zinc-300 text-sm">
                            {description}
                        </div>
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
