import { User } from '@/types/auth';
import { DecorationService } from '@/services/decoration-service';
import { ProfileCustomizationService } from '@/services/profile-customization-service';
import { showToast } from '@/lib/toast';
import GenericDecorationModal from './GenericDecorationModal';

interface BizarreListenerDecorationModalProps {
    user: User;
    onClose: () => void;
}

export default function BizarreListenerDecorationModal({ user, onClose }: BizarreListenerDecorationModalProps) {
    const handleClaim = async (shouldEquip: boolean) => {
        try {
            const claimResult = await DecorationService.claimDecorationSecure('Bizarre Listener');
            if (!claimResult.success) {
                showToast.error(claimResult.error || 'Failed to claim decoration');
                return { success: false, error: claimResult.error };
            }

            if (shouldEquip) {
                const decoration = await DecorationService.getDecorationByName('Bizarre Listener');
                if (decoration) {
                    const equipResult = await DecorationService.equipDecoration(user.id, decoration.id);
                    if (!equipResult.success) {
                        showToast.error('Failed to equip decoration');
                        return { success: false, error: equipResult.error };
                    }

                    await ProfileCustomizationService.upsertCustomization(user.id, {
                        avatar_decoration_id: decoration.id
                    });

                    showToast.success('Decoration equipped!');
                }
            } else {
                showToast.success('Decoration claimed!');
            }

            return { success: true };
        } catch (error) {
            showToast.error('Something went wrong. Please try again.');
            return { success: false, error };
        }
    };

    const previewDecoration = {
        id: 'preview_bizarre',
        name: 'Bizarre Listener',
        description: 'For the true OGs.',
        image_url: '/decorations/bizarre-listener.png',
        type: 'static' as const,
        is_free: true,
        created_at: new Date().toISOString()
    };

    return (
        <GenericDecorationModal
            user={user}
            decoration={previewDecoration}
            title="Bizarre Listener"
            subtitle="Beta Tester Reward"
            description={
                <p>
                    Thank you for being an early supporter. This exclusive decoration is for users who joined before <span className="text-white font-bold">December 15th, 2025</span>.
                </p>
            }
            onClaim={handleClaim}
            onClose={onClose}
            themeColor="#a855f7"
        />
    );
}
