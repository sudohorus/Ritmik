import { useJam } from '@/contexts/JamContext';
import { formatJamLink } from '@/utils/jam-utils';
import { showToast } from '@/lib/toast';

export function JamView() {
    const { currentJam, participants, isHost, leaveJam, endJam } = useJam();

    if (!currentJam) return null;

    const handleCopyLink = () => {
        const link = formatJamLink(currentJam.code);
        navigator.clipboard.writeText(link);
        showToast.success('Link copied to clipboard');
    };

    const handleLeave = async () => {
        try {
            await leaveJam();
            showToast.success('Left jam');
        } catch (error) {
            showToast.error('Failed to leave jam');
        }
    };

    const handleEnd = async () => {
        try {
            await endJam();
            showToast.success('Jam ended');
        } catch (error) {
            showToast.error('Failed to end jam');
        }
    };

    return (
        <div className="w-80 sm:w-96 bg-zinc-900 border border-zinc-800 rounded-xl shadow-2xl overflow-hidden p-4">
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(34,197,94,0.5)]" />
                    <div>
                        <h3 className="font-semibold text-white text-sm">{currentJam.name}</h3>
                        <p className="text-xs text-zinc-400 font-mono mt-0.5">
                            Code: <span className="text-green-400 select-all">{currentJam.code}</span>
                        </p>
                    </div>
                </div>

                <div className="flex gap-2">
                    <button
                        onClick={handleCopyLink}
                        className="p-2 bg-zinc-800 hover:bg-zinc-700 hover:text-white text-zinc-400 rounded-lg transition-colors"
                        title="Copy link"
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                        </svg>
                    </button>

                    {isHost ? (
                        <button
                            onClick={handleEnd}
                            className="px-3 py-1.5 bg-red-500/10 hover:bg-red-500/20 text-red-500 hover:text-red-400 border border-red-500/20 rounded-lg text-xs font-medium transition-colors"
                        >
                            End
                        </button>
                    ) : (
                        <button
                            onClick={handleLeave}
                            className="px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white rounded-lg text-xs font-medium transition-colors"
                        >
                            Leave
                        </button>
                    )}
                </div>
            </div>

            <div className="space-y-3">
                <div className="flex items-center justify-between text-xs text-zinc-500 uppercase tracking-wider font-medium">
                    <span>Participants ({participants.length})</span>
                </div>

                <div className="flex flex-wrap gap-2">
                    {participants.map((participant) => (
                        <div
                            key={participant.id}
                            className="relative group"
                            title={participant.user?.display_name || participant.user?.username}
                        >
                            <div className="w-8 h-8 rounded-full bg-zinc-800 border border-zinc-700 overflow-hidden">
                                {participant.user?.avatar_url ? (
                                    <img
                                        src={participant.user.avatar_url}
                                        alt={participant.user.username}
                                        className="w-full h-full object-cover"
                                    />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center text-xs font-medium text-zinc-400">
                                        {(participant.user?.display_name || participant.user?.username || '?')[0].toUpperCase()}
                                    </div>
                                )}
                            </div>
                            {participant.user_id === currentJam.host_user_id && (
                                <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-zinc-900 rounded-full flex items-center justify-center border border-zinc-800" title="Host">
                                    <svg className="w-2.5 h-2.5 text-yellow-500" fill="currentColor" viewBox="0 0 20 20">
                                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                    </svg>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            </div>

            {isHost && (
                <div className="mt-4 pt-3 border-t border-zinc-800">
                    <p className="text-xs text-zinc-500 flex items-center gap-1.5">
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                        </svg>
                        You are the host controlling playback
                    </p>
                </div>
            )}
        </div>
    );
}
