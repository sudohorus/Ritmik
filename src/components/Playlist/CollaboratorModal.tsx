import { useState, useEffect } from 'react';
import { Playlist } from '@/types/playlist';
import { PlaylistService } from '@/services/playlist-service';
import { useAuth } from '@/contexts/AuthContext';
import { showToast } from '@/lib/toast';

interface CollaboratorModalProps {
    isOpen: boolean;
    onClose: () => void;
    playlist: Playlist;
    onUpdate: () => void;
}

export default function CollaboratorModal({ isOpen, onClose, playlist, onUpdate }: CollaboratorModalProps) {
    const { user: currentUser } = useAuth();
    const [collaborators, setCollaborators] = useState<any[]>(playlist.collaborators || []);
    const [inviteLink, setInviteLink] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        setCollaborators(playlist.collaborators || []);
    }, [playlist]);

    const handleGenerateLink = async () => {
        setLoading(true);
        setError(null);
        try {
            const token = await PlaylistService.createInviteLink(playlist.id, {
                expiresInMinutes: 30,
                maxUses: 1
            });
            const link = `${window.location.origin}/invite/${token}`;
            setInviteLink(link);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to generate link');
        } finally {
            setLoading(false);
        }
    };

    const handleCopyLink = () => {
        if (inviteLink) {
            navigator.clipboard.writeText(inviteLink);
            showToast.success('Link copied to clipboard');
        }
    };

    const handleRemoveCollaborator = async (userId: string) => {
        try {
            await PlaylistService.removeCollaborator(playlist.id, userId);
            onUpdate();
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to remove collaborator');
        }
    };

    if (!isOpen) return null;

    return (
        <div
            className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm p-4 overflow-y-auto"
            onClick={onClose}
        >
            <div className="min-h-screen flex items-center justify-center py-8">
                <div
                    className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 w-full max-w-md shadow-2xl"
                    onClick={(e) => e.stopPropagation()}
                >
                    <div className="flex justify-between items-center mb-6">
                        <h2 className="text-2xl font-bold text-white">Collaborators</h2>
                        <button
                            onClick={onClose}
                            className="text-zinc-400 hover:text-white transition-colors p-1 hover:bg-zinc-800 rounded-lg"
                        >
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>

                    <div className="space-y-6">
                        <div>
                            <h3 className="text-sm font-medium text-zinc-300 mb-3">Invite via Link</h3>

                            {!inviteLink ? (
                                <div className="space-y-4">
                                    <p className="text-sm text-zinc-400">
                                        Generate a temporary link to invite a collaborator. The link expires in 30 minutes and can be used once.
                                    </p>
                                    <button
                                        onClick={handleGenerateLink}
                                        disabled={loading}
                                        className="w-full py-2 bg-white text-black rounded-lg font-medium hover:bg-zinc-200 transition-colors disabled:opacity-50"
                                    >
                                        {loading ? 'Generating...' : 'Generate Invite Link'}
                                    </button>
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    <div className="flex items-center gap-2 p-3 bg-zinc-800 rounded-lg border border-zinc-700">
                                        <input
                                            type="text"
                                            readOnly
                                            value={inviteLink}
                                            className="bg-transparent border-none text-zinc-300 text-sm w-full focus:outline-none"
                                        />
                                        <button
                                            onClick={handleCopyLink}
                                            className="text-zinc-400 hover:text-white"
                                        >
                                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                                            </svg>
                                        </button>
                                    </div>
                                    <button
                                        onClick={() => setInviteLink(null)}
                                        className="text-xs text-zinc-400 hover:text-white underline"
                                    >
                                        Generate new link
                                    </button>
                                </div>
                            )}
                        </div>

                        <div className="border-t border-zinc-800 pt-4">
                            <h3 className="text-sm font-medium text-zinc-300 mb-3">Current Collaborators</h3>
                            {collaborators.length === 0 ? (
                                <p className="text-zinc-500 text-sm italic">No collaborators yet.</p>
                            ) : (
                                <div className="space-y-2">
                                    {collaborators.map((collaborator) => (
                                        <div key={collaborator.user_id} className="flex items-center justify-between p-3 bg-zinc-800/50 rounded-lg border border-zinc-800">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-full bg-zinc-700 overflow-hidden">
                                                    {collaborator.users?.avatar_url ? (
                                                        <img src={collaborator.users.avatar_url} alt={collaborator.users.username} className="w-full h-full object-cover" />
                                                    ) : (
                                                        <div className="w-full h-full flex items-center justify-center text-xs font-bold text-zinc-400">
                                                            {collaborator.users?.username?.[0]?.toUpperCase() || '?'}
                                                        </div>
                                                    )}
                                                </div>
                                                <div>
                                                    <div className="text-sm font-medium text-white">
                                                        {collaborator.users?.display_name || collaborator.users?.username}
                                                    </div>
                                                    <div className="text-xs text-zinc-400">@{collaborator.users?.username}</div>
                                                </div>
                                            </div>
                                            {currentUser?.id === playlist.user_id && (
                                                <button
                                                    onClick={() => handleRemoveCollaborator(collaborator.user_id)}
                                                    className="text-zinc-400 hover:text-red-400 transition-colors"
                                                    title="Remove collaborator"
                                                >
                                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                    </svg>
                                                </button>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        {error && (
                            <div className="p-3 bg-red-950/50 border border-red-900/50 rounded-lg text-red-400 text-sm">
                                {error}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
