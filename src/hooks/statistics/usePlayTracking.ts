import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { StatisticsService } from '@/services/statistics-service';

export function usePlayTracking(
    currentTrack: any,
    progress: number,
    duration: number,
    isPlaying: boolean
) {
    const { user } = useAuth();
    const playRecordedRef = useRef<string | null>(null);
    const playStartTimeRef = useRef<number>(0);
    const lastProgressRef = useRef<number>(0);

    useEffect(() => {
        if (!currentTrack || !user) return;

        if (playRecordedRef.current !== currentTrack.videoId) {
            playRecordedRef.current = currentTrack.videoId;
            playStartTimeRef.current = Date.now();
            lastProgressRef.current = 0;
        }
    }, [currentTrack?.videoId, user]);

    useEffect(() => {
        if (!currentTrack || !user || !isPlaying) return;

        lastProgressRef.current = progress;

        const completionThreshold = duration * 0.5; 
        const hasListenedEnough = progress >= completionThreshold && duration > 0;

        if (hasListenedEnough && playRecordedRef.current === currentTrack.videoId) {
            const listenDuration = Math.floor((Date.now() - playStartTimeRef.current) / 1000);

            StatisticsService.recordPlay({
                user_id: user.id,
                video_id: currentTrack.videoId,
                title: currentTrack.title,
                artist: currentTrack.artist,
                thumbnail_url: currentTrack.thumbnail,
                duration: Math.floor(duration),
                listen_duration: listenDuration,
                completed: true,
            })

            playRecordedRef.current = null;
        }
    }, [progress, duration, currentTrack, user, isPlaying]);

    const recordSkip = () => {
        if (!currentTrack || !user || playRecordedRef.current !== currentTrack.videoId) return;

        const listenDuration = Math.floor((Date.now() - playStartTimeRef.current) / 1000);
        const listenedPercentage = duration > 0 ? (lastProgressRef.current / duration) : 0;

        if (listenedPercentage >= 0.3) {

            StatisticsService.recordPlay({
                user_id: user.id,
                video_id: currentTrack.videoId,
                title: currentTrack.title,
                artist: currentTrack.artist,
                thumbnail_url: currentTrack.thumbnail,
                duration: Math.floor(duration),
                listen_duration: listenDuration,
                completed: false,
            })
        }

        playRecordedRef.current = null;
    };

    return { recordSkip };
}
