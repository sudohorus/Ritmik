import { User } from '@/types/auth';
import { DecorationService } from '@/services/decoration-service';
import { ProfileCustomizationService } from '@/services/profile-customization-service';
import { showToast } from '@/lib/toast';
import GenericDecorationModal from './GenericDecorationModal';

interface NewYearDecorationModalProps {
    user: User;
    onClose: () => void;
}

export default function NewYearDecorationModal({ user, onClose }: NewYearDecorationModalProps) {
    const handleClaim = async (shouldEquip: boolean) => {
        try {
            const claimResult = await DecorationService.claimDecorationSecure('New Year 2026');
            if (!claimResult.success) {
                showToast.error(claimResult.error || 'Failed to claim decoration');
                return { success: false, error: claimResult.error };
            }

            if (shouldEquip) {
                const decoration = await DecorationService.getDecorationByName('New Year 2026');
                if (decoration) {
                    const equipResult = await DecorationService.equipDecoration(user.id, decoration.id);
                    if (!equipResult.success) {
                        showToast.error('Failed to equip decoration');
                        return { success: false, error: equipResult.error };
                    }

                    await ProfileCustomizationService.upsertCustomization(user.id, {
                        avatar_decoration_id: decoration.id
                    });

                    showToast.success('Happy New Year! Decoration equipped!');
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
        id: 'preview_new_year',
        name: 'New Year 2026',
        description: 'Welcome to 2026! Y2K Style.',
        image_url: '/decorations/new-year-2026.png',
        type: 'static' as const,
        is_free: true,
        created_at: new Date().toISOString()
    };

    return (
        <GenericDecorationModal
            user={user}
            decoration={previewDecoration}
            title="2026"
            subtitle="Happy New Year"
            description={
                <p>
                    Celebrate the arrival of 2026 with this exclusive <span className="text-white font-bold">Y2K Chrome</span> decoration.
                </p>
            }
            onClaim={handleClaim}
            onClose={onClose}
            themeColor="#ffffff"
        />
    );
}
