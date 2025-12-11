import { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import type { SpotifyPlaylist, ImportProgress, ImportSummary } from '@/types/spotify';
import { showToast } from '@/lib/toast';
import { supabase } from '@/lib/supabase';

interface SpotifyImportModalProps {
    onClose: () => void;
}

export default function SpotifyImportModal({ onClose }: SpotifyImportModalProps) {
    const [step, setStep] = useState<'playlists' | 'target' | 'importing'>('playlists');
    const [spotifyPlaylists, setSpotifyPlaylists] = useState<SpotifyPlaylist[]>([]);
    const [ritmikPlaylists, setRitmikPlaylists] = useState<any[]>([]);
    const [loadingPlaylists, setLoadingPlaylists] = useState(true);
    const [selectedSpotifyPlaylist, setSelectedSpotifyPlaylist] = useState<SpotifyPlaylist | null>(null);
    const [selectedTargetPlaylist, setSelectedTargetPlaylist] = useState<string>('');
    const [importing, setImporting] = useState(false);
    const [progress, setProgress] = useState<ImportProgress | null>(null);
    const [summary, setSummary] = useState<ImportSummary | null>(null);

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
        setStep('playlists');
        setImporting(false);
        setProgress(null);
        setSummary(null);
        setSelectedSpotifyPlaylist(null);
        setSelectedTargetPlaylist('');
        onClose();
    };

    useEffect(() => {
        handleLoadPlaylists();
    }, []);

    const handleLoadPlaylists = async () => {
        setLoadingPlaylists(true);
        try {
            const { data: { session } } = await supabase.auth.getSession();
            const authToken = session?.access_token;

            if (!authToken) {
                showToast.error('Authentication error');
                handleClose();
                return;
            }

            const [spotifyRes, ritmikRes] = await Promise.all([
                axios.get('/api/spotify/playlists', {
                    headers: { Authorization: `Bearer ${authToken}` }
                }),
                axios.get('/api/playlists', {
                    headers: { Authorization: `Bearer ${authToken}` }
                })
            ]);

            setSpotifyPlaylists(spotifyRes.data.playlists || []);
            setRitmikPlaylists(ritmikRes.data || []);
        } catch (error) {
            showToast.error('Failed to load playlists');
            handleClose();
        } finally {
            setLoadingPlaylists(false);
        }
    };

    const handleSelectSpotifyPlaylist = (playlist: SpotifyPlaylist) => {
        setSelectedSpotifyPlaylist(playlist);
        setStep('target');
    };

    const handleStartImport = async () => {
        if (!selectedSpotifyPlaylist || !selectedTargetPlaylist) return;

        setStep('importing');
        setImporting(true);
        setProgress({ current: 0, total: selectedSpotifyPlaylist.tracks.total, track: { name: 'Starting...', artist: '', spotifyId: '' }, status: 'searching' });

        try {
            const { data: { session } } = await supabase.auth.getSession();
            const authToken = session?.access_token;

            if (!authToken) {
                showToast.error('Authentication error');
                setImporting(false);
                return;
            }

            const tokenResponse = await axios.post('/api/spotify/import-token', {}, {
                headers: { Authorization: `Bearer ${authToken}` }
            });

            const importToken = tokenResponse.data.token;

            const eventSource = new EventSource(
                `/api/spotify/import?spotifyPlaylistId=${selectedSpotifyPlaylist.id}&targetPlaylistId=${selectedTargetPlaylist}&token=${importToken}`
            );

            eventSourceRef.current = eventSource;

            eventSource.addEventListener('progress', (e) => {
                const data: ImportProgress = JSON.parse(e.data);
                setProgress(data);
            });

            eventSource.addEventListener('complete', (e) => {
                const data: ImportSummary = JSON.parse(e.data);
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
            <div className="bg-zinc-900 border border-zinc-800 rounded-lg max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
                {/* Header */}
                <div className="p-6 border-b border-zinc-800 flex items-center justify-between">
                    <div>
                        <h2 className="text-2xl font-bold">Import from Spotify</h2>
                        <p className="text-sm text-zinc-400 mt-1">
                            {step === 'playlists' && 'Select a Spotify playlist to import'}
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
                    {/* Step 1: Select Spotify Playlist */}
                    {step === 'playlists' && (
                        <div>
                            {loadingPlaylists ? (
                                <div className="flex items-center justify-center py-12">
                                    <div className="animate-spin w-8 h-8 border-2 border-white border-t-transparent rounded-full"></div>
                                </div>
                            ) : (
                                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                                    {spotifyPlaylists.map((playlist) => (
                                        <button
                                            key={playlist.id}
                                            onClick={() => handleSelectSpotifyPlaylist(playlist)}
                                            className="bg-zinc-800/50 border border-zinc-700 rounded-lg p-4 hover:border-zinc-600 hover:bg-zinc-800 transition-all text-left"
                                        >
                                            {playlist.images[0] ? (
                                                <img
                                                    src={playlist.images[0].url}
                                                    alt={playlist.name}
                                                    className="w-full aspect-square object-cover rounded-lg mb-3"
                                                />
                                            ) : (
                                                <div className="w-full aspect-square bg-zinc-700 rounded-lg mb-3 flex items-center justify-center">
                                                    <svg className="w-12 h-12 text-zinc-600" fill="currentColor" viewBox="0 0 24 24">
                                                        <path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z" />
                                                    </svg>
                                                </div>
                                            )}
                                            <h3 className="font-semibold text-sm line-clamp-2 mb-1">{playlist.name}</h3>
                                            <p className="text-xs text-zinc-400">{playlist.tracks.total} tracks</p>
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}

                    {/* Step 2: Select Target Playlist */}
                    {step === 'target' && selectedSpotifyPlaylist && (
                        <div>
                            <div className="bg-zinc-800/50 border border-zinc-700 rounded-lg p-4 mb-6">
                                <div className="flex items-center gap-4">
                                    {selectedSpotifyPlaylist.images[0] && (
                                        <img
                                            src={selectedSpotifyPlaylist.images[0].url}
                                            alt={selectedSpotifyPlaylist.name}
                                            className="w-16 h-16 rounded-lg"
                                        />
                                    )}
                                    <div>
                                        <h3 className="font-semibold">{selectedSpotifyPlaylist.name}</h3>
                                        <p className="text-sm text-zinc-400">{selectedSpotifyPlaylist.tracks.total} tracks</p>
                                    </div>
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium mb-3">Import to Ritmik playlist:</label>
                                <select
                                    value={selectedTargetPlaylist}
                                    onChange={(e) => setSelectedTargetPlaylist(e.target.value)}
                                    className="w-full px-4 py-3 bg-zinc-800 border border-zinc-700 rounded-lg text-white focus:outline-none focus:border-zinc-500"
                                >
                                    <option value="">Select a playlist...</option>
                                    {ritmikPlaylists.map((playlist) => (
                                        <option key={playlist.id} value={playlist.id}>
                                            {playlist.name}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div className="flex gap-3 mt-6">
                                <button
                                    onClick={() => setStep('playlists')}
                                    className="px-6 py-3 bg-zinc-800 hover:bg-zinc-700 text-white rounded-lg font-medium transition-colors"
                                >
                                    Back
                                </button>
                                <button
                                    onClick={handleStartImport}
                                    disabled={!selectedTargetPlaylist}
                                    className="flex-1 px-6 py-3 bg-white text-black rounded-lg font-semibold hover:bg-zinc-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    Start Import
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Step 3: Importing */}
                    {step === 'importing' && (
                        <div>
                            {progress && (
                                <div className="space-y-6">
                                    {/* Progress Bar */}
                                    <div>
                                        <div className="flex items-center justify-between mb-2">
                                            <span className="text-sm text-zinc-400">
                                                {progress.current} / {progress.total}
                                            </span>
                                            <span className="text-sm text-zinc-400">
                                                {Math.round((progress.current / progress.total) * 100)}%
                                            </span>
                                        </div>
                                        <div className="h-2 bg-zinc-800 rounded-full overflow-hidden">
                                            <div
                                                className="h-full bg-[#1DB954] transition-all duration-300"
                                                style={{ width: `${(progress.current / progress.total) * 100}%` }}
                                            />
                                        </div>
                                    </div>

                                    {/* Current Track */}
                                    <div className="bg-zinc-800/50 border border-zinc-700 rounded-lg p-4">
                                        <div className="flex items-start gap-4">
                                            {progress.match?.thumbnail ? (
                                                <img
                                                    src={progress.match.thumbnail}
                                                    alt={progress.track.name}
                                                    className="w-16 h-16 rounded object-cover shrink-0"
                                                    onError={(e) => {
                                                        const target = e.target as HTMLImageElement;
                                                        target.style.display = 'none';
                                                        const placeholder = target.nextElementSibling as HTMLElement;
                                                        if (placeholder) placeholder.style.display = 'flex';
                                                    }}
                                                />
                                            ) : null}
                                            <div
                                                className="w-16 h-16 rounded bg-zinc-700 shrink-0 items-center justify-center hidden"
                                                style={{ display: progress.match?.thumbnail ? 'none' : 'flex' }}
                                            >
                                                <svg className="w-8 h-8 text-zinc-500" fill="currentColor" viewBox="0 0 24 24">
                                                    <path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z" />
                                                </svg>
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2 mb-1">
                                                    {progress.status === 'searching' && (
                                                        <div className="animate-spin w-4 h-4 border-2 border-zinc-400 border-t-transparent rounded-full"></div>
                                                    )}
                                                    {progress.status === 'found' && (
                                                        <svg className="w-5 h-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                                                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                                        </svg>
                                                    )}
                                                    {progress.status === 'added' && (
                                                        <svg className="w-5 h-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                                                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                                        </svg>
                                                    )}
                                                    {progress.status === 'not_found' && (
                                                        <svg className="w-5 h-5 text-yellow-500" fill="currentColor" viewBox="0 0 20 20">
                                                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                                                        </svg>
                                                    )}
                                                    <span className="font-medium truncate">{progress.track.name}</span>
                                                </div>
                                                <p className="text-sm text-zinc-400 truncate">{progress.track.artist}</p>
                                                {progress.match && progress.status === 'added' && (
                                                    <p className="text-xs text-green-500 mt-1">✓ Matched: {progress.match.title}</p>
                                                )}
                                                {progress.status === 'not_found' && (
                                                    <p className="text-xs text-yellow-500 mt-1">⚠ No match found</p>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Summary */}
                                    {summary && (
                                        <div className="bg-green-950/30 border border-green-900/50 rounded-lg p-6">
                                            <h3 className="text-lg font-semibold text-green-400 mb-4">Import Complete!</h3>
                                            <div className="grid grid-cols-3 gap-4 text-center">
                                                <div>
                                                    <div className="text-2xl font-bold text-white">{summary.successful}</div>
                                                    <div className="text-xs text-zinc-400">Added</div>
                                                </div>
                                                <div>
                                                    <div className="text-2xl font-bold text-yellow-400">{summary.notFound}</div>
                                                    <div className="text-xs text-zinc-400">Not found</div>
                                                </div>
                                                <div>
                                                    <div className="text-2xl font-bold text-red-400">{summary.failed}</div>
                                                    <div className="text-xs text-zinc-400">Failed</div>
                                                </div>
                                            </div>
                                            <button
                                                onClick={handleClose}
                                                className="w-full mt-6 px-6 py-3 bg-white text-black rounded-lg font-semibold hover:bg-zinc-200 transition-colors"
                                            >
                                                Done
                                            </button>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
