import { useState } from 'react';
import { useJam } from '@/contexts/JamContext';
import { formatJamLink } from '@/utils/jam-utils';
import { showToast } from '@/lib/toast';

interface CreateJamModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export function CreateJamModal({ isOpen, onClose }: CreateJamModalProps) {
    const { createJam } = useJam();
    const [name, setName] = useState('');
    const [loading, setLoading] = useState(false);
    const [jamCode, setJamCode] = useState<string | null>(null);

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!name.trim()) {
            showToast.error('Please enter a name for your jam');
            return;
        }

        setLoading(true);

        try {
            const code = await createJam(name.trim());
            setJamCode(code);
            showToast.success('Jam created successfully!');
        } catch (error: any) {
            showToast.error(error.message || 'Failed to create jam');
        } finally {
            setLoading(false);
        }
    };

    const handleCopyLink = () => {
        if (!jamCode) return;

        const link = formatJamLink(jamCode);
        navigator.clipboard.writeText(link);
        showToast.success('Link copied to clipboard');
    };

    const handleClose = () => {
        setName('');
        setJamCode(null);
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-zinc-900 rounded-xl max-w-md w-full p-6 border border-zinc-800">
                {!jamCode ? (
                    <>
                        <h2 className="text-2xl font-bold mb-4 text-white">Create Jam Session</h2>
                        <form onSubmit={handleCreate}>
                            <div className="mb-4">
                                <label className="block text-sm font-medium text-zinc-400 mb-2">
                                    Jam Name
                                </label>
                                <input
                                    type="text"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    placeholder="My Awesome Jam"
                                    className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-zinc-600"
                                    maxLength={255}
                                    disabled={loading}
                                />
                            </div>

                            <div className="flex gap-3">
                                <button
                                    type="button"
                                    onClick={handleClose}
                                    className="flex-1 px-4 py-2 bg-zinc-800 hover:bg-zinc-700 rounded-lg transition-colors text-white"
                                    disabled={loading}
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="flex-1 px-4 py-2 bg-green-600 hover:bg-green-700 rounded-lg transition-colors font-medium disabled:opacity-50"
                                    disabled={loading}
                                >
                                    {loading ? 'Creating...' : 'Create Jam'}
                                </button>
                            </div>
                        </form>
                    </>
                ) : (
                    <>
                        <h2 className="text-2xl font-bold mb-4 text-white">Jam Created!</h2>
                        <div className="mb-6">
                            <p className="text-zinc-400 mb-3">Share this code with your friends:</p>
                            <div className="bg-zinc-800 border border-zinc-700 rounded-lg p-4 text-center">
                                <div className="text-3xl font-bold tracking-widest text-green-500 font-mono">
                                    {jamCode}
                                </div>
                            </div>
                        </div>

                        <div className="flex gap-3">
                            <button
                                onClick={handleCopyLink}
                                className="flex-1 px-4 py-2 bg-zinc-800 hover:bg-zinc-700 rounded-lg transition-colors text-white"
                            >
                                Copy Link
                            </button>
                            <button
                                onClick={handleClose}
                                className="flex-1 px-4 py-2 bg-green-600 hover:bg-green-700 rounded-lg transition-colors font-medium"
                            >
                                Done
                            </button>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}
