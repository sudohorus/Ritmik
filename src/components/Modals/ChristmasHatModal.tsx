import { User } from '@/types/auth';
import { DecorationService } from '@/services/decoration-service';
import { ProfileCustomizationService } from '@/services/profile-customization-service';
import { showToast } from '@/lib/toast';
import { dismissChristmasModal } from '@/lib/christmas-utils';
import GenericDecorationModal from './GenericDecorationModal';

interface ChristmasHatModalProps {
    user: User;
    onClose: () => void;
}

export default function ChristmasHatModal({ user, onClose }: ChristmasHatModalProps) {
    const handleClose = () => {
        dismissChristmasModal();
        onClose();
    };

    const handleClaim = async (shouldEquip: boolean) => {
        try {
            const claimResult = await DecorationService.claimDecorationSecure('Santa Hat');
            if (!claimResult.success) {
                showToast.error(claimResult.error || 'Failed to claim Santa Hat');
                return { success: false, error: claimResult.error };
            }

            if (shouldEquip) {
                const decoration = await DecorationService.getDecorationByName('Santa Hat');
                if (decoration) {
                    const equipResult = await DecorationService.equipDecoration(user.id, decoration.id);
                    if (!equipResult.success) {
                        showToast.error('Failed to equip Santa Hat');
                        return { success: false, error: equipResult.error };
                    }

                    await ProfileCustomizationService.upsertCustomization(user.id, {
                        avatar_decoration_id: decoration.id
                    });

                    showToast.success('Santa Hat claimed and equipped!');
                }
            } else {
                showToast.success('Santa Hat claimed! Go to Settings → Account to equip it.');
            }

            dismissChristmasModal();
            return { success: true };
        } catch (error) {
            showToast.error('Something went wrong. Please try again.');
            return { success: false, error };
        }
    };

    const previewDecoration = {
        id: 'preview_santa_hat',
        name: 'Santa Hat',
        description: 'Exclusive Santa Hat decoration',
        image_url: '/decorations/santa-hat.png',
        type: 'static' as const,
        is_free: true,
        created_at: new Date().toISOString()
    };

    return (
        <GenericDecorationModal
            user={user}
            decoration={previewDecoration}
            title="Christmas Gift"
            subtitle="Exclusive Item"
            description={
                <div className="space-y-2">
                    <p>
                        Celebrate the holidays with this exclusive Santa Hat decoration for your avatar.
                    </p>
                    <p className="text-zinc-500 text-xs">
                        Available only December 23-25, 2025
                    </p>
                </div>
            }
            onClaim={handleClaim}
            onClose={handleClose}
            themeColor="#ef4444" 
        />
    );
}
