import { useState } from 'react';
import { useJam } from '@/contexts/JamContext';
import { validateJamCode } from '@/utils/jam-utils';
import { showToast } from '@/lib/toast';

interface JoinJamModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export function JoinJamModal({ isOpen, onClose }: JoinJamModalProps) {
    const { joinJam } = useJam();
    const [code, setCode] = useState('');
    const [loading, setLoading] = useState(false);

    const handleJoin = async (e: React.FormEvent) => {
        e.preventDefault();

        const cleanCode = code.trim().toUpperCase();

        if (!validateJamCode(cleanCode)) {
            showToast.error('Invalid jam code format');
            return;
        }

        setLoading(true);

        try {
            await joinJam(cleanCode);
            showToast.success('Joined jam successfully!');
            setCode('');
            onClose();
        } catch (error: any) {
            showToast.error(error.message || 'Failed to join jam');
        } finally {
            setLoading(false);
        }
    };

    const handleClose = () => {
        setCode('');
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-zinc-900 rounded-xl max-w-md w-full p-6 border border-zinc-800">
                <h2 className="text-2xl font-bold mb-4 text-white">Join Jam Session</h2>

                <form onSubmit={handleJoin}>
                    <div className="mb-4">
                        <label className="block text-sm font-medium text-zinc-400 mb-2">
                            Jam Code
                        </label>
                        <input
                            type="text"
                            value={code}
                            onChange={(e) => setCode(e.target.value.toUpperCase())}
                            placeholder="ABC123"
                            className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-3 text-center text-2xl font-mono tracking-widest text-white focus:outline-none focus:border-zinc-600"
                            maxLength={6}
                            disabled={loading}
                        />
                        <p className="text-xs text-zinc-500 mt-2">
                            Enter the 6-character code shared by the host
                        </p>
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
                            disabled={loading || code.length !== 6}
                        >
                            {loading ? 'Joining...' : 'Join Jam'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
