import React, { createContext, ReactNode, useState, useEffect, useRef } from 'react';
import { JamSession, JamParticipant, JamState } from '@/types/jam';
import { Track } from '@/types/track';
import { useAuth } from './AuthContext';
import { JamService } from '@/services/jam-service';
import { supabase } from '@/lib/supabase';
import { RealtimeChannel } from '@supabase/supabase-js';
import { showToast } from '@/lib/toast';

interface JamContextValue {
    currentJam: JamSession | null;
    participants: JamParticipant[];
    isHost: boolean;
    isInJam: boolean;
    createJam: (name: string) => Promise<string>;
    joinJam: (code: string) => Promise<void>;
    leaveJam: () => Promise<void>;
    endJam: () => Promise<void>;
    updateJamState: (state: Partial<JamState>) => Promise<void>;
    timeOffset: number;
}

export const JamContext = createContext<JamContextValue | undefined>(undefined);

interface JamProviderProps {
    children: ReactNode;
}

export function JamProvider({ children }: JamProviderProps) {
    const { user } = useAuth();
    const [currentJam, setCurrentJam] = useState<JamSession | null>(null);
    const [participants, setParticipants] = useState<JamParticipant[]>([]);
    const [timeOffset, setTimeOffset] = useState(0);
    const channelRef = useRef<RealtimeChannel | null>(null);
    const tokenRef = useRef<string | null>(null);

    const isHost = currentJam?.host_user_id === user?.id;
    const isInJam = currentJam !== null;

    useEffect(() => {
        const updateToken = async () => {
            const { data } = await supabase.auth.getSession();
            tokenRef.current = data.session?.access_token || null;
        };
        updateToken();

        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            tokenRef.current = session?.access_token || null;
        });

        return () => {
            subscription.unsubscribe();
        };
    }, []);

    useEffect(() => {
        if (!user) {
            setCurrentJam(null);
            setParticipants([]);
            return;
        }

        const checkActiveJam = async () => {
            try {
                const jam = await JamService.isUserInJam(user.id);
                if (jam) {
                    setCurrentJam(jam);
                    const parts = await JamService.getActiveParticipants(jam.id);
                    setParticipants(parts);
                    subscribeToJam(jam.id);
                }
            } catch (error) {
                console.error('Error checking active jam:', error);
            }
        };

        checkActiveJam();

        return () => {
            if (channelRef.current) {
                supabase.removeChannel(channelRef.current);
                channelRef.current = null;
            }
        };
    }, [user]);

    useEffect(() => {
        if (!currentJam || !user) return;

        const sendHeartbeat = async () => {
            try {
                const token = (await supabase.auth.getSession()).data.session?.access_token;
                if (!token) return;

                await fetch('/api/jam/heartbeat', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`,
                    },
                    body: JSON.stringify({ jamId: currentJam.id }),
                });
            } catch (error) {
                console.error('Heartbeat error:', error);
            }
        };

        sendHeartbeat();
        const heartbeatInterval = setInterval(sendHeartbeat, 60000);

        const handleBeforeUnload = () => {
            if (currentJam && user && tokenRef.current) {
                const blob = new Blob([JSON.stringify({ jamId: currentJam.id, token: tokenRef.current })], { type: 'application/json' });
                navigator.sendBeacon('/api/jam/leave', blob);
            }
        };

        window.addEventListener('beforeunload', handleBeforeUnload);

        return () => {
            clearInterval(heartbeatInterval);
            window.removeEventListener('beforeunload', handleBeforeUnload);
        };
    }, [currentJam?.id, user]);


    const subscribeToJam = (jamId: string) => {
        if (channelRef.current) {
            supabase.removeChannel(channelRef.current);
        }

        const channel = supabase.channel(`jam:${jamId}`);

        channel
            .on('broadcast', { event: 'jam:state_update' }, ({ payload }) => {
                setCurrentJam(prev => prev ? { ...prev, ...payload } : null);
            })
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'jam_sessions',
                    filter: `id=eq.${jamId}`,
                },
                (payload) => {
                    if (payload.eventType === 'DELETE') {
                        setCurrentJam(null);
                        setParticipants([]);
                        showToast.info('The host has ended the jam session');
                        if (channelRef.current) {
                            supabase.removeChannel(channelRef.current);
                            channelRef.current = null;
                        }
                    } else if (payload.eventType === 'UPDATE') {
                        setCurrentJam(prev => prev ? { ...prev, ...payload.new } : null);
                    }
                }
            )
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'jam_participants',
                    filter: `jam_session_id=eq.${jamId}`,
                },
                async (payload) => {

                    const parts = await JamService.getActiveParticipants(jamId);
                    setParticipants(parts);
                }
            )
            .subscribe();

        channelRef.current = channel;
    };

    const createJam = async (name: string): Promise<string> => {
        if (!user) throw new Error('Must be logged in');

        const token = (await supabase.auth.getSession()).data.session?.access_token;
        if (!token) throw new Error('No session');

        const response = await fetch('/api/jam/create', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`,
            },
            body: JSON.stringify({ name }),
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Failed to create jam');
        }

        const { jam, serverTime } = await response.json();
        if (serverTime) {
            const offset = serverTime - Date.now();
            setTimeOffset(offset);
        }
        setCurrentJam(jam);

        const parts = await JamService.getActiveParticipants(jam.id);
        setParticipants(parts);

        subscribeToJam(jam.id);

        return jam.code;
    };

    const joinJam = async (code: string): Promise<void> => {
        if (!user) throw new Error('Must be logged in');

        const token = (await supabase.auth.getSession()).data.session?.access_token;
        if (!token) throw new Error('No session');

        const response = await fetch('/api/jam/join', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`,
            },
            body: JSON.stringify({ code }),
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Failed to join jam');
        }

        const { jam, serverTime } = await response.json();
        if (serverTime) {
            const offset = serverTime - Date.now();
            setTimeOffset(offset);
        }
        setCurrentJam(jam);

        const parts = await JamService.getActiveParticipants(jam.id);
        setParticipants(parts);

        subscribeToJam(jam.id);

        if (channelRef.current) {
            await channelRef.current.send({
                type: 'broadcast',
                event: 'jam:participant_joined',
                payload: {},
            });
        }
    };

    const leaveJam = async (): Promise<void> => {
        if (!currentJam || !user) return;

        if (isHost) {
            return endJam();
        }

        const token = (await supabase.auth.getSession()).data.session?.access_token;
        if (!token) throw new Error('No session');

        if (channelRef.current) {
            await channelRef.current.send({
                type: 'broadcast',
                event: 'jam:participant_left',
                payload: {},
            });
        }

        try {
            await fetch('/api/jam/leave', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
                body: JSON.stringify({ jamId: currentJam.id }),
            });
        } catch (error) {
            console.error('Error leaving jam:', error);
        } finally {
            setCurrentJam(null);
            setParticipants([]);

            if (channelRef.current) {
                supabase.removeChannel(channelRef.current);
                channelRef.current = null;
            }
        }
    };


    const endJam = async (): Promise<void> => {
        if (!currentJam || !user || !isHost) return;

        const token = (await supabase.auth.getSession()).data.session?.access_token;
        if (!token) throw new Error('No session');

        if (channelRef.current) {
            await channelRef.current.send({
                type: 'broadcast',
                event: 'jam:ended',
                payload: {},
            });
        }

        await fetch(`/api/jam/${currentJam.id}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${token}`,
            },
        });

        setCurrentJam(null);
        setParticipants([]);

        if (channelRef.current) {
            supabase.removeChannel(channelRef.current);
            channelRef.current = null;
        }
    };

    const updateJamState = async (state: Partial<JamState>): Promise<void> => {
        if (!currentJam || !user || !isHost) return;

        const token = (await supabase.auth.getSession()).data.session?.access_token;
        if (!token) throw new Error('No session');

        const updateData: any = {};

        if (state.currentTrack !== undefined) {
            updateData.current_track_id = state.currentTrack?.videoId || null;
        }

        if (state.position !== undefined) {
            updateData.current_position = state.position;
        }

        if (state.isPlaying !== undefined) {
            updateData.is_playing = state.isPlaying;
        }

        if (state.queue !== undefined) {
            updateData.queue = state.queue;
        }

        setCurrentJam(prev => prev ? { ...prev, ...updateData } : null);

        await fetch(`/api/jam/${currentJam.id}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`,
            },
            body: JSON.stringify(updateData),
        });

        if (channelRef.current) {
            await channelRef.current.send({
                type: 'broadcast',
                event: 'jam:state_update',
                payload: updateData,
            });
        }
    };

    useEffect(() => {
        if (!currentJam?.id) return;

        let cleanupCounter = 0;

        const interval = setInterval(async () => {
            try {
                const updatedJam = await JamService.getJamById(currentJam.id);

                if (!updatedJam) {
                    setCurrentJam(null);
                    setParticipants([]);
                    showToast.info('The host has ended the jam session');
                    return;
                }

                if (updatedJam) {
                    setCurrentJam(prev => {
                        if (!prev) return updatedJam;

                        if (!updatedJam.is_active) {
                            setCurrentJam(null);
                            setParticipants([]);
                            showToast.info('The host has ended the jam session');
                            return null;
                        }

                        const isHost = prev.host_user_id === user?.id;

                        if (isHost) {
                            const hasChanged = prev.updated_at !== updatedJam.updated_at;

                            if (hasChanged) {
                                return {
                                    ...updatedJam,
                                    current_track_id: prev.current_track_id,
                                    is_playing: prev.is_playing,
                                    current_position: prev.current_position,
                                    queue: prev.queue
                                };
                            }
                            return prev;
                        }

                        const hasChanged =
                            prev.current_track_id !== updatedJam.current_track_id ||
                            prev.is_playing !== updatedJam.is_playing ||
                            prev.updated_at !== updatedJam.updated_at ||
                            JSON.stringify(prev.queue) !== JSON.stringify(updatedJam.queue);

                        if (hasChanged) {
                            return updatedJam;
                        }
                        return prev;
                    });
                }

                const parts = await JamService.getActiveParticipants(currentJam.id);
                setParticipants(prev => {
                    if (prev.length !== parts.length) return parts;
                    const hasChanged = prev.some((p, i) =>
                        p.user_id !== parts[i].user_id ||
                        p.is_active !== parts[i].is_active
                    );
                    return hasChanged ? parts : prev;
                });

                cleanupCounter++;
                if (cleanupCounter >= 12) {
                    cleanupCounter = 0;
                    if (isHost) {
                        try {
                            await fetch('/api/jam/cleanup', { method: 'POST' });
                        } catch { }
                    }
                }

            } catch { }
        }, 20000);

        return () => clearInterval(interval);
    }, [currentJam?.id]);

    return (
        <JamContext.Provider
            value={{
                currentJam,
                participants,
                isHost,
                isInJam,
                createJam,
                joinJam,
                leaveJam,
                endJam,
                updateJamState,
                timeOffset,
            }}
        >
            {children}
        </JamContext.Provider>
    );
}

export function useJam() {
    const context = React.useContext(JamContext);
    if (context === undefined) {
        throw new Error('useJam must be used within JamProvider');
    }
    return context;
}
