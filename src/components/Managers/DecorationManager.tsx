import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { DecorationService } from '@/services/decoration-service';
import { StatisticsService } from '@/services/statistics-service';
import TenHoursDecorationModal from '@/components/Modals/TenHoursDecorationModal';

export default function DecorationManager() {
    const { user } = useAuth();
    const [showTenHoursModal, setShowTenHoursModal] = useState(false);

    useEffect(() => {
        const checkTenHoursAchievement = async () => {
            if (!user) return;

            try {
                const stats = await StatisticsService.getUserStats(user.id);
                if (!stats) return;

                if (stats.total_listen_time >= 36000) {
                    const decorations = await DecorationService.getAvailableDecorations(user.id);
                    const hasDecoration = decorations.some(d => d.name === '10 Hours Listener');

                    if (!hasDecoration) {
                        setShowTenHoursModal(true);
                    }
                }
            } catch (error) {
                console.error('Error checking 10h achievement:', error);
            }
        };

        checkTenHoursAchievement();
    }, [user]);

    return (
        <>
            {showTenHoursModal && user && (
                <TenHoursDecorationModal
                    user={user}
                    onClose={() => setShowTenHoursModal(false)}
                />
            )}
        </>
    );
}
