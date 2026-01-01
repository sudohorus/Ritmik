import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { User } from '@/types/auth';
import { ProfileService } from '@/services/profile-service';
import { showToast } from '@/lib/toast';

interface OnboardingModalProps {
    user: User;
    onClose: () => void;
}

const steps = [
    {
        title: "Welcome to Ritmik",
        description: "Experience music streaming the way it should be: simple, social, and completely ad-free.",
        icon: (
            <svg className="w-16 h-16 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
            </svg>
        )
    },
    {
        title: "Create & Curate",
        description: "Easily create your own playlists. Search for any song and add it to your collection with a single click.",
        icon: (
            <svg className="w-16 h-16 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
            </svg>
        )
    },
    {
        title: "Your Profile, Your Style",
        description: "Customize your profile with banners, avatars, and themes. Show the world your musical taste.",
        icon: (
            <svg className="w-16 h-16 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5.121 17.804A13.937 13.937 0 0112 16c2.5 0 4.847.655 6.879 1.804M15 10a3 3 0 11-6 0 3 3 0 016 0zm6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
        )
    }
];

export default function OnboardingModal({ user, onClose }: OnboardingModalProps) {
    const [currentStep, setCurrentStep] = useState(0);
    const [loading, setLoading] = useState(false);

    const handleNext = async () => {
        if (currentStep < steps.length - 1) {
            setCurrentStep(prev => prev + 1);
        } else {
            setLoading(true);
            try {
                const { error } = await ProfileService.completeOnboarding(user.id);
                if (error) throw error;
                onClose();
                showToast.success("Welcome to Ritmik!");
            } catch (err) {
                console.error(err);
                showToast.error("Failed to complete onboarding");
            } finally {
                setLoading(false);
            }
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl"
            >
                <div className="p-8 text-center">
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={currentStep}
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            transition={{ duration: 0.2 }}
                            className="flex flex-col items-center"
                        >
                            <div className="mb-6 p-4 bg-zinc-800/50 rounded-full">
                                {steps[currentStep].icon}
                            </div>
                            <h2 className="text-2xl font-bold text-white mb-3">
                                {steps[currentStep].title}
                            </h2>
                            <p className="text-zinc-400 mb-8 min-h-3rem">
                                {steps[currentStep].description}
                            </p>
                        </motion.div>
                    </AnimatePresence>

                    <div className="flex items-center justify-center gap-2 mb-8">
                        {steps.map((_, index) => (
                            <div
                                key={index}
                                className={`h-1.5 rounded-full transition-all duration-300 ${index === currentStep ? 'w-6 bg-blue-500' : 'w-1.5 bg-zinc-700'
                                    }`}
                            />
                        ))}
                    </div>

                    <button
                        onClick={handleNext}
                        disabled={loading}
                        className="w-full py-3 bg-white text-black font-bold rounded-lg hover:bg-zinc-200 transition-colors disabled:opacity-50"
                    >
                        {loading ? 'Setting up...' : currentStep === steps.length - 1 ? "Let's Go!" : 'Next'}
                    </button>
                </div>
            </motion.div>
        </div>
    );
}
