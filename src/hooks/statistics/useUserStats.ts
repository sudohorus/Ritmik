import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { StatisticsService, UserStats } from '@/services/statistics-service';

export function useUserStats(userId?: string) {
    const { user } = useAuth();
    const [stats, setStats] = useState<UserStats | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const mountedRef = useRef(true);

    const targetUserId = userId || user?.id;

    useEffect(() => {
        mountedRef.current = true;
        return () => {
            mountedRef.current = false;
        };
    }, []);

    useEffect(() => {
        if (!targetUserId) {
            setLoading(false);
            return;
        }

        const loadStats = async () => {
            try {
                setLoading(true);
                setError(null);

                const data = await StatisticsService.getUserStats(targetUserId);

                if (mountedRef.current) {
                    setStats(data);
                }
            } catch (err) {
                if (mountedRef.current) {
                    setError(err instanceof Error ? err.message : 'Failed to load stats');
                }
            } finally {
                if (mountedRef.current) {
                    setLoading(false);
                }
            }
        };

        loadStats();
    }, [targetUserId]);

    return { stats, loading, error };
}
