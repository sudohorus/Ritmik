import { User } from '@/types/auth';
import { DecorationService } from '@/services/decoration-service';
import { ProfileCustomizationService } from '@/services/profile-customization-service';
import { showToast } from '@/lib/toast';
import GenericDecorationModal from './GenericDecorationModal';

interface TenHoursDecorationModalProps {
    user: User;
    onClose: () => void;
}

export default function TenHoursDecorationModal({ user, onClose }: TenHoursDecorationModalProps) {
    const handleClaim = async (shouldEquip: boolean) => {
        try {
            const claimResult = await DecorationService.claimDecorationSecure('10 Hours Listener');
            if (!claimResult.success) {
                showToast.error(claimResult.error || 'Failed to claim decoration');
                return { success: false, error: claimResult.error };
            }

            if (shouldEquip) {
                const decoration = await DecorationService.getDecorationByName('10 Hours Listener');
                if (decoration) {
                    const equipResult = await DecorationService.equipDecoration(user.id, decoration.id);
                    if (!equipResult.success) {
                        showToast.error('Failed to equip decoration');
                        return { success: false, error: equipResult.error };
                    }

                    await ProfileCustomizationService.upsertCustomization(user.id, {
                        avatar_decoration_id: decoration.id
                    });

                    showToast.success('Decoration claimed and equipped!');
                }
            } else {
                showToast.success('Decoration claimed! Go to Settings → Account to equip it.');
            }

            return { success: true };
        } catch (error) {
            showToast.error('Something went wrong. Please try again.');
            return { success: false, error };
        }
    };

    const previewDecoration = {
        id: 'preview_10h',
        name: '10 Hours Listener',
        description: 'Awarded for listening to 10+ hours of music',
        image_url: '/decorations/10h-listener.png',
        type: 'static' as const,
        is_free: false,
        created_at: new Date().toISOString()
    };

    return (
        <GenericDecorationModal
            user={user}
            decoration={previewDecoration}
            title="Achievement Unlocked!"
            subtitle="10 Hours Listener"
            description={
                <p>
                    You've listened to over 10 hours of music on Ritmik!
                    As a reward, you've unlocked this exclusive avatar decoration.
                </p>
            }
            onClaim={handleClaim}
            onClose={onClose}
            themeColor="#2563eb" 
        />
    );
}
