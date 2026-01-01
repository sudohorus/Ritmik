import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { DecorationService } from '@/services/decoration-service';
import { StatisticsService } from '@/services/statistics-service';
import { supabase } from '@/lib/supabase';
import TenHoursDecorationModal from '@/components/Modals/TenHoursDecorationModal';
import BizarreListenerDecorationModal from '@/components/Modals/BizarreListenerDecorationModal';
import UFCBeltDecorationModal from '@/components/Modals/UFCBeltDecorationModal';
import NewYearDecorationModal from '@/components/Modals/NewYearDecorationModal';
import DiscordPromoModal from '@/components/Modals/DiscordPromoModal';

export default function DecorationManager() {
    const { user } = useAuth();
    const [showTenHoursModal, setShowTenHoursModal] = useState(false);
    const [showBizarreListenerModal, setShowBizarreListenerModal] = useState(false);
    const [showUFCBeltModal, setShowUFCBeltModal] = useState(false);
    const [showNewYearModal, setShowNewYearModal] = useState(false);
    const [showDiscordPromoModal, setShowDiscordPromoModal] = useState(false);

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

    useEffect(() => {
        const checkBizarreListenerAchievement = async () => {
            if (!user) return;

            try {
                const createdDate = new Date(user.created_at);
                const cutoffDate = new Date('2025-12-14T23:59:59');

                if (createdDate <= cutoffDate) {
                    const decorations = await DecorationService.getAvailableDecorations(user.id);
                    const hasDecoration = decorations.some(d => d.name === 'Bizarre Listener');

                    if (!hasDecoration) {
                        setShowBizarreListenerModal(true);
                    }
                }
            } catch (error) {
                console.error('Error checking Bizarre Listener achievement:', error);
            }
        };

        checkBizarreListenerAchievement();
    }, [user]);

    useEffect(() => {
        const checkUFCBeltAvailability = async () => {
            if (!user) return;

            const allowedUsers = ['sudohorus', 'kiuzo'];
            if (!allowedUsers.includes(user.username || '')) return;

            try {
                const decorations = await DecorationService.getAvailableDecorations(user.id);
                const hasDecoration = decorations.some(d => d.name === 'UFC Belt');

                if (!hasDecoration) {
                    const decoration = await DecorationService.getDecorationByName('UFC Belt');
                    if (decoration) {
                        setShowUFCBeltModal(true);
                    }
                }
            } catch (error) {
                console.error('Error checking UFC Belt availability:', error);
            }
        };

        checkUFCBeltAvailability();
    }, [user]);

    useEffect(() => {
        const checkNewYearAvailability = async () => {
            if (!user) return;

            const now = new Date();
            const start = new Date('2025-12-31T00:00:00-03:00');
            const end = new Date('2026-01-02T23:59:59-03:00');

            if (now >= start && now <= end) {
                try {
                    const { data: decoration } = await supabase
                        .from('avatar_decorations')
                        .select('id')
                        .eq('name', 'New Year 2026')
                        .single();

                    if (!decoration) return;

                    const { data: userDecoration } = await supabase
                        .from('user_decorations')
                        .select('id')
                        .eq('user_id', user.id)
                        .eq('decoration_id', decoration.id)
                        .single();

                    if (!userDecoration) {
                        setShowNewYearModal(true);
                    }
                } catch (error) {
                    console.error('[New Year] Error:', error);
                }
            }
        };

        checkNewYearAvailability();
    }, [user]);

    useEffect(() => {
        const checkDiscordPromo = async () => {
            if (!user) return;

            const hasSeenPromo = localStorage.getItem('discord_promo_seen');
            if (hasSeenPromo) return;

            try {
                const decorations = await DecorationService.getAvailableDecorations(user.id);
                const hasSiff = decorations.some(d => d.name === 'Sif Wolf');
                const hasDarksign = decorations.some(d => d.name === 'Darksign');

                if (!hasSiff || !hasDarksign) {
                    setShowDiscordPromoModal(true);
                    localStorage.setItem('discord_promo_seen', 'true');
                }
            } catch (error) {
                console.error('Error checking Discord promo:', error);
            }
        };

        checkDiscordPromo();
    }, [user]);

    return (
        <>
            {showTenHoursModal && user && (
                <TenHoursDecorationModal
                    user={user}
                    onClose={() => setShowTenHoursModal(false)}
                />
            )}
            {showBizarreListenerModal && user && (
                <BizarreListenerDecorationModal
                    user={user}
                    onClose={() => setShowBizarreListenerModal(false)}
                />
            )}
            {showUFCBeltModal && user && (
                <UFCBeltDecorationModal
                    user={user}
                    onClose={() => setShowUFCBeltModal(false)}
                />
            )}
            {showNewYearModal && user && (
                <NewYearDecorationModal
                    user={user}
                    onClose={() => setShowNewYearModal(false)}
                />
            )}
            {showDiscordPromoModal && user && (
                <DiscordPromoModal
                    isOpen={showDiscordPromoModal}
                    onClose={() => setShowDiscordPromoModal(false)}
                />
            )}
        </>
    );
}
