import { User } from '@/types/auth';
import { DecorationService } from '@/services/decoration-service';
import { ProfileCustomizationService } from '@/services/profile-customization-service';
import { showToast } from '@/lib/toast';
import GenericDecorationModal from './GenericDecorationModal';

interface UFCBeltDecorationModalProps {
    user: User;
    onClose: () => void;
}

export default function UFCBeltDecorationModal({ user, onClose }: UFCBeltDecorationModalProps) {
    const handleClaim = async (shouldEquip: boolean) => {
        try {
            const claimResult = await DecorationService.claimDecorationSecure('UFC Belt');
            if (!claimResult.success) {
                showToast.error(claimResult.error || 'Failed to claim decoration');
                return { success: false, error: claimResult.error };
            }

            if (shouldEquip) {
                const decoration = await DecorationService.getDecorationByName('UFC Belt');
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
        id: 'preview_ufc',
        name: 'UFC Belt',
        description: 'Be a Stronger Fighter (only the owner of ritmik can give this item)',
        image_url: '/decorations/ufc-belt.png',
        type: 'static' as const,
        is_free: false,
        created_at: new Date().toISOString()
    };

    return (
        <GenericDecorationModal
            user={user}
            decoration={previewDecoration}
            title="Champion Reward!"
            subtitle="UFC Belt"
            description={
                <p>
                    You are a true champion! Claim this exclusive UFC Belt to show off your strength (only the owner of ritmik can give this item).
                </p>
            }
            onClaim={handleClaim}
            onClose={onClose}
            themeColor="#ca8a04" 
        />
    );
}
