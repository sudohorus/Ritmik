import { User } from '@/types/auth';

interface ProfilePreviewProps {
    user: User;
    displayName: string;
    username: string;
    avatarUrl: string;
    bannerUrl: string;
}

export default function ProfilePreview({
    user,
    displayName,
    username,
    avatarUrl,
    bannerUrl
}: ProfilePreviewProps) {
    const display = displayName || user.display_name || user.username || 'User';
    const userHandle = username || user.username || 'username';
    const avatar = avatarUrl || user.avatar_url;
    const banner = bannerUrl || user.banner_url;
    const avatarLetter = (userHandle || 'U')[0].toUpperCase();

    return (
        <div className="mb-12 border border-zinc-800 rounded-xl overflow-hidden bg-zinc-950 relative group shadow-2xl">
            <div className="absolute top-0 left-0 right-0 h-64 z-0">
                {banner ? (
                    <>
                        <div className="absolute inset-0 bg-linear-to-b from-black/30 via-zinc-950/80 to-zinc-950 z-10" />
                        <img
                            src={banner}
                            alt="Banner preview"
                            className="w-full h-full object-cover"
                        />
                    </>
                ) : (
                    <div className="w-full h-full bg-zinc-900 flex items-center justify-center text-zinc-600">
                        <span className="text-sm">No banner image</span>
                    </div>
                )}
            </div>

            <div className="relative z-10 pt-32 px-8 pb-8">
                <div className="flex items-end gap-5">
        
                    <div className="shrink-0">
                        {avatar ? (
                            <img
                                src={avatar}
                                alt="Avatar preview"
                                className="w-28 h-28 rounded-full object-cover shadow-2xl border-2 border-zinc-700 bg-zinc-800"
                            />
                        ) : (
                            <div className="w-28 h-28 rounded-full bg-zinc-700 flex items-center justify-center text-white font-semibold text-4xl shadow-2xl border-2 border-zinc-600">
                                {avatarLetter}
                            </div>
                        )}
                    </div>

                    <div className="flex-1 min-w-0 pb-1.5">
                        <h2 className="text-4xl font-bold text-white mb-1 truncate drop-shadow-lg">{display}</h2>
                        <p className="text-zinc-400 text-base drop-shadow-md">@{userHandle}</p>
                    </div>
                </div>
            </div>
            
            <div className="px-6 py-3 bg-zinc-900/50 border-t border-zinc-800 flex justify-between items-center backdrop-blur-sm relative z-20">
                <span className="text-xs font-medium text-zinc-500 uppercase tracking-wider">Preview</span>
                <span className="text-xs text-zinc-600">Scaled preview of your public profile</span>
            </div>
        </div>
    );
}
