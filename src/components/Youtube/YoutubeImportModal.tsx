import { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import type {
    YoutubePlaylist,
    YoutubeImportProgress,
    YoutubeImportSummary
} from '@/types/youtube';
import { showToast } from '@/lib/toast';
import { supabase } from '@/lib/supabase';

interface YoutubeImportModalProps {
    onClose: () => void;
}

export default function YoutubeImportModal({ onClose }: YoutubeImportModalProps) {
    const [step, setStep] = useState<'input' | 'preview' | 'target' | 'importing'>('input');
    const [url, setUrl] = useState('');
    const [loadingPreview, setLoadingPreview] = useState(false);
    const [youtubePlaylist, setYoutubePlaylist] = useState<YoutubePlaylist | null>(null);

    const [ritmikPlaylists, setRitmikPlaylists] = useState<any[]>([]);
    const [loadingPlaylists, setLoadingPlaylists] = useState(false);
    const [selectedTargetPlaylist, setSelectedTargetPlaylist] = useState<string>('');

    const [importing, setImporting] = useState(false);
    const [progress, setProgress] = useState<YoutubeImportProgress | null>(null);
    const [summary, setSummary] = useState<YoutubeImportSummary | null>(null);

    const eventSourceRef = useRef<EventSource | null>(null);

    useEffect(() => {
        return () => {
            if (eventSourceRef.current) {
                eventSourceRef.current.close();
                eventSourceRef.current = null;
            }
        };
    }, []);

    const handleClose = () => {
        if (eventSourceRef.current) {
            eventSourceRef.current.close();
            eventSourceRef.current = null;
        }
        onClose();
    };

    const handleFetchPlaylist = async () => {
        if (!url) return;

        setLoadingPreview(true);
        try {
            const { data } = await axios.get(
                `/api/youtube/playlist?url=${encodeURIComponent(url)}`
            );

            const normalizedPlaylist: YoutubePlaylist = {
                ...data,
                videoCount:
                    Number(data.videoCount) ||
                    data.tracks?.length ||
                    0
            };

            setYoutubePlaylist(normalizedPlaylist);
            setStep('preview');
            loadRitmikPlaylists();
        } catch (error) {
            showToast.error('Failed to fetch playlist. Check the URL.');
        } finally {
            setLoadingPreview(false);
        }
    };

    const loadRitmikPlaylists = async () => {
        setLoadingPlaylists(true);
        try {
            const { data: { session } } = await supabase.auth.getSession();
            const authToken = session?.access_token;
            if (!authToken) return;

            const { data } = await axios.get('/api/playlists', {
                headers: { Authorization: `Bearer ${authToken}` }
            });

            setRitmikPlaylists(data.data || []);
        } catch (error) {
            console.error('Failed to load playlists', error);
        } finally {
            setLoadingPlaylists(false);
        }
    };

    const handleStartImport = async () => {
        if (!youtubePlaylist || !selectedTargetPlaylist) return;

        setStep('importing');
        setImporting(true);
        setProgress({
            current: 0,
            total: Number(youtubePlaylist.videoCount) || 0,
            track: { name: 'Starting...', artist: '', videoId: '' },
            status: 'pending'
        });

        try {
            const { data: { session } } = await supabase.auth.getSession();
            const authToken = session?.access_token;

            if (!authToken) {
                showToast.error('Authentication error');
                setImporting(false);
                return;
            }

            const tokenResponse = await axios.post(
                '/api/spotify/import-token',
                {},
                { headers: { Authorization: `Bearer ${authToken}` } }
            );

            const importToken = tokenResponse.data.token;

            const eventSource = new EventSource(
                `/api/youtube/import?youtubePlaylistId=${youtubePlaylist.id}&targetPlaylistId=${selectedTargetPlaylist}&token=${importToken}`
            );

            eventSourceRef.current = eventSource;

            eventSource.addEventListener('progress', (e) => {
                const data: YoutubeImportProgress = JSON.parse(e.data);
                setProgress(data);
            });

            eventSource.addEventListener('complete', (e) => {
                const data: YoutubeImportSummary = JSON.parse(e.data);
                setSummary(data);
                setImporting(false);
                eventSource.close();
                eventSourceRef.current = null;
                showToast.success(`Import complete! ${data.successful} tracks added.`);
            });

            eventSource.onerror = () => {
                eventSource.close();
                eventSourceRef.current = null;
                setImporting(false);
                showToast.error('Import failed');
            };
        } catch (error) {
            setImporting(false);
            showToast.error('Failed to start import');
        }
    };

    return (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
            <div className="bg-zinc-900 border border-zinc-800 rounded-lg max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col">

                {/* Header */}
                <div className="p-6 border-b border-zinc-800 flex items-center justify-between">
                    <div>
                        <h2 className="text-2xl font-bold">Import from YouTube</h2>
                        <p className="text-sm text-zinc-400 mt-1">
                            {step === 'input' && 'Enter a YouTube playlist URL'}
                            {step === 'preview' && 'Confirm playlist details'}
                            {step === 'target' && 'Choose where to import'}
                            {step === 'importing' && 'Importing playlist...'}
                        </p>
                    </div>
                    <button
                        onClick={handleClose}
                        className="p-2 hover:bg-zinc-800 rounded-lg transition-colors"
                    >
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6">

                    {step === 'input' && (
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium mb-2">Playlist URL</label>
                                <input
                                    type="text"
                                    value={url}
                                    onChange={(e) => setUrl(e.target.value)}
                                    placeholder="https://www.youtube.com/playlist?list=..."
                                    className="w-full px-4 py-3 bg-zinc-800 border border-zinc-700 rounded-lg text-white focus:outline-none focus:border-red-500"
                                />
                            </div>

                            <button
                                onClick={handleFetchPlaylist}
                                disabled={!url || loadingPreview}
                                className="w-full px-6 py-3 bg-red-600 hover:bg-red-700 text-white rounded-lg font-semibold transition-colors disabled:opacity-50"
                            >
                                {loadingPreview ? 'Loading...' : 'Next'}
                            </button>
                        </div>
                    )}

                    {step === 'preview' && youtubePlaylist && (
                        <div className="space-y-6">
                            <div className="flex items-start gap-4 bg-zinc-800/50 p-4 rounded-lg">
                                {youtubePlaylist.thumbnail && (
                                    <img
                                        src={youtubePlaylist.thumbnail}
                                        alt={youtubePlaylist.title}
                                        className="w-24 h-24 object-cover rounded-lg"
                                    />
                                )}
                                <div>
                                    <h3 className="text-xl font-bold">{youtubePlaylist.title}</h3>
                                    <p className="text-zinc-400">{youtubePlaylist.channelTitle}</p>
                                    <p className="text-sm text-zinc-500 mt-1">
                                        {youtubePlaylist.videoCount} musics
                                    </p>
                                </div>
                            </div>

                            <div className="flex gap-3">
                                <button
                                    onClick={() => setStep('input')}
                                    className="px-6 py-3 bg-zinc-800 hover:bg-zinc-700 rounded-lg"
                                >
                                    Back
                                </button>
                                <button
                                    onClick={() => setStep('target')}
                                    className="flex-1 px-6 py-3 bg-white text-black rounded-lg font-semibold"
                                >
                                    Continue
                                </button>
                            </div>
                        </div>
                    )}

                    {step === 'target' && (
                        <div className="space-y-6">
                            <label className="block text-sm font-medium">
                                Import to Ritmik playlist:
                            </label>

                            {loadingPlaylists ? (
                                <div>Loading playlists...</div>
                            ) : (
                                <select
                                    value={selectedTargetPlaylist}
                                    onChange={(e) => setSelectedTargetPlaylist(e.target.value)}
                                    className="w-full px-4 py-3 bg-zinc-800 border border-zinc-700 rounded-lg"
                                >
                                    <option value="">Select a playlist...</option>
                                    {ritmikPlaylists.map((playlist) => (
                                        <option key={playlist.id} value={playlist.id}>
                                            {playlist.name}
                                        </option>
                                    ))}
                                </select>
                            )}

                            <div className="flex gap-3">
                                <button
                                    onClick={() => setStep('preview')}
                                    className="px-6 py-3 bg-zinc-800 rounded-lg"
                                >
                                    Back
                                </button>
                                <button
                                    onClick={handleStartImport}
                                    disabled={!selectedTargetPlaylist}
                                    className="flex-1 px-6 py-3 bg-red-600 rounded-lg font-semibold disabled:opacity-50"
                                >
                                    Start Import
                                </button>
                            </div>
                        </div>
                    )}

                    {step === 'importing' && progress && (
                        <div className="space-y-6">
                            <div className="flex justify-between text-sm text-zinc-400">
                                <span>{progress.current} / {progress.total}</span>
                                <span>
                                    {progress.total > 0
                                        ? Math.round((progress.current / progress.total) * 100)
                                        : 0}%
                                </span>
                            </div>

                            <div className="h-2 bg-zinc-800 rounded-full overflow-hidden">
                                <div
                                    className="h-full bg-red-600 transition-all"
                                    style={{
                                        width: `${progress.total > 0
                                            ? (progress.current / progress.total) * 100
                                            : 0}%`
                                    }}
                                />
                            </div>

                            <div className="bg-zinc-800/50 p-4 rounded-lg">
                                <p className="font-medium truncate">{progress.track.name}</p>
                                <p className="text-xs text-zinc-400">
                                    {progress.status === 'added' ? 'Added' : 'Processing...'}
                                </p>
                            </div>
                        </div>
                    )}

                </div>
            </div>
        </div>
    );
}
