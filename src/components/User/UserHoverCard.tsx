import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { PublicProfileService, PublicProfile } from '@/services/public-profile-service';
import { FollowerService } from '@/services/follower-service';
import { useAuth } from '@/contexts/AuthContext';
import { showToast } from '@/lib/toast';
import { ProfileCustomizationService } from '@/services/profile-customization-service';
import { ProfileCustomization } from '@/types/profile-customization';
import BannerImage from '@/components/BannerImage';

interface UserHoverCardProps {
    userId?: string;
    username: string;
    children: React.ReactNode;
    className?: string;
}

const profileCache = new Map<string, { profile: PublicProfile; customization: ProfileCustomization | null; timestamp: number }>();
const CACHE_DURATION = 5 * 60 * 1000; 

export default function UserHoverCard({ userId, username, children, className = '' }: UserHoverCardProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [profile, setProfile] = useState<PublicProfile | null>(null);
    const [customization, setCustomization] = useState<ProfileCustomization | null>(null);
    const [dataReady, setDataReady] = useState(false);
    const [loading, setLoading] = useState(false);
    const [coords, setCoords] = useState({ top: 0, left: 0 });
    const [position, setPosition] = useState<'top' | 'bottom'>('bottom');
    const [horizontalAlign, setHorizontalAlign] = useState<'center' | 'left' | 'right'>('center');
    const [isFollowing, setIsFollowing] = useState(false);
    const [followLoading, setFollowLoading] = useState(false);

    const timeoutRef = useRef<NodeJS.Timeout | null>(null);
    const hoverDelayRef = useRef<NodeJS.Timeout | null>(null);
    const triggerRef = useRef<HTMLDivElement>(null);
    const cardRef = useRef<HTMLDivElement>(null);
    const { user: currentUser } = useAuth();
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
        return () => setMounted(false);
    }, []);

    useEffect(() => {
        if (dataReady && isOpen && cardRef.current) {
            setTimeout(() => {
                updatePosition();
            }, 10);
        }
    }, [dataReady, isOpen]);

    const updatePosition = () => {
        if (triggerRef.current) {
            const rect = triggerRef.current.getBoundingClientRect();
            const cardWidth = 320;

            let cardHeight = 400;
            if (cardRef.current) {
                const cardRect = cardRef.current.getBoundingClientRect();
                if (cardRect.height > 0) {
                    cardHeight = cardRect.height;
                }
            }

            const margin = 16;
            const gap = 10;

            const spaceAbove = rect.top;
            const spaceBelow = window.innerHeight - rect.bottom;

            let showOnTop = false;

            if (spaceBelow < cardHeight + margin) {
                if (spaceAbove > cardHeight + margin) {
                    showOnTop = true;
                } else {
                    showOnTop = spaceAbove > spaceBelow;
                }
            }

            let top: number;
            if (showOnTop) {
                top = rect.top - gap - cardHeight;
            } else {
                top = rect.bottom + gap;
            }

            if (top < margin) {
                top = margin;
            } else if (top + cardHeight > window.innerHeight - margin) {
                top = window.innerHeight - margin - cardHeight;
            }

            const centerX = rect.left + (rect.width / 2);
            let left = centerX;
            let align: 'center' | 'left' | 'right' = 'center';

            const cardLeftEdge = centerX - (cardWidth / 2);
            const cardRightEdge = centerX + (cardWidth / 2);

            if (cardRightEdge > window.innerWidth - margin) {
                align = 'right';
                left = Math.min(centerX, window.innerWidth - margin);
            } else if (cardLeftEdge < margin) {
                align = 'left';
                left = Math.max(centerX, margin);
            }

            setPosition(showOnTop ? 'top' : 'bottom');
            setHorizontalAlign(align);
            setCoords({ top, left });
        }
    };

    const handleMouseEnter = () => {
        if (timeoutRef.current) clearTimeout(timeoutRef.current);
        if (hoverDelayRef.current) clearTimeout(hoverDelayRef.current);

        updatePosition();

        const cached = profileCache.get(username);
        if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
            setProfile(cached.profile);
            setCustomization(cached.customization);
            setDataReady(true);
            setIsOpen(true);

            if (currentUser && cached.profile.id !== currentUser.id) {
                FollowerService.getFollowerStats(cached.profile.id, currentUser.id)
                    .then(stats => {
                        setIsFollowing(stats.isFollowing);
                    })
                    .catch(() => { });
            }
            return;
        }

        hoverDelayRef.current = setTimeout(() => {
            setIsOpen(true);
            if (!profile && !loading) {
                fetchProfile();
            } else if (profile && !loading) {
                setDataReady(true);
            }
        }, 200);
    };

    const handleMouseLeave = () => {
        if (hoverDelayRef.current) clearTimeout(hoverDelayRef.current);
        timeoutRef.current = setTimeout(() => {
            setIsOpen(false);
            setDataReady(false);
        }, 300);
    };

    const fetchProfile = async () => {
        setLoading(true);
        try {
            const { data } = await PublicProfileService.getProfileByUsername(username);
            if (data) {
                setProfile(data);
                setDataReady(true);

                if (currentUser && data.id !== currentUser.id) {
                    FollowerService.getFollowerStats(data.id, currentUser.id)
                        .then(stats => {
                            setIsFollowing(stats.isFollowing);
                        })
                        .catch(() => { });
                }

                ProfileCustomizationService.getCustomization(data.id)
                    .then(customizationData => {
                        setCustomization(customizationData);
                        profileCache.set(username, {
                            profile: data,
                            customization: customizationData,
                            timestamp: Date.now()
                        });
                    })
                    .catch(() => {
                        setCustomization(null);
                        profileCache.set(username, {
                            profile: data,
                            customization: null,
                            timestamp: Date.now()
                        });
                    });
            }
        } catch (error) {

        } finally {
            setLoading(false);
        }
    };

    const handleFollow = async () => {
        if (!currentUser || !profile || followLoading) return;

        setFollowLoading(true);
        try {
            if (isFollowing) {
                await FollowerService.unfollowUser(profile.id);
                setIsFollowing(false);
                showToast.success(`Unfollowed ${profile.username}`);
            } else {
                await FollowerService.followUser(profile.id);
                setIsFollowing(true);
                showToast.success(`Following ${profile.username}`);
            }
        } catch (error) {
            showToast.error('Failed to update follow status');
        } finally {
            setFollowLoading(false);
        }
    };

    const getTransform = () => {
        if (horizontalAlign === 'center') {
            return 'translateX(-50%)';
        } else if (horizontalAlign === 'right') {
            return 'translateX(-100%)';
        }
        return 'translateX(0)';
    };

    const cardContent = (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    ref={cardRef}
                    initial={{ opacity: 0, scale: 0.9, y: position === 'top' ? 10 : -10 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, transition: { duration: 0.15 } }}
                    transition={{ type: "spring", stiffness: 400, damping: 25 }}
                    className="fixed z-9999 w-80 bg-[#18181b] border border-zinc-800 rounded-xl shadow-[0_0_40px_-10px_rgba(0,0,0,0.7)] overflow-hidden"
                    style={{
                        top: coords.top,
                        left: coords.left,
                        transform: getTransform(),
                        pointerEvents: 'auto'
                    }}
                    onMouseEnter={() => {
                        if (timeoutRef.current) clearTimeout(timeoutRef.current);
                    }}
                    onMouseLeave={handleMouseLeave}
                    onClick={(e) => e.stopPropagation()}
                >
                    <div
                        className="absolute left-0 right-0 h-8"
                        style={{
                            top: position === 'top' ? '100%' : 'auto',
                            bottom: position === 'bottom' ? '100%' : 'auto'
                        }}
                    />

                    {!dataReady ? (
                        <div className="p-8 flex flex-col items-center justify-center gap-3">
                            <div className="w-8 h-8 border-2 border-zinc-700 border-t-zinc-400 rounded-full animate-spin" />
                            <span className="text-xs text-zinc-500 font-medium">Loading profile...</span>
                        </div>
                    ) : profile ? (
                        <div className="relative">
                            {customization?.background_mode === 'full-bg' && profile.banner_url ? (
                                <>
                                    <div className="absolute inset-0 z-0">
                                        <BannerImage
                                            src={profile.banner_url}
                                            alt=""
                                            blur={`${customization.background_blur}px`}
                                            brightness={customization.background_brightness / 100}
                                            crop={customization.banner_crop}
                                        />
                                        <div className="absolute inset-0 bg-linear-to-b from-black/20 via-zinc-950/60 to-zinc-950/90" />
                                    </div>
                                    <div className="h-28 relative" />
                                </>
                            ) : (
                                <div className="h-28 relative bg-zinc-800">
                                    {profile.banner_url ? (
                                        <img
                                            src={profile.banner_url}
                                            alt="Banner"
                                            className="w-full h-full object-cover"
                                        />
                                    ) : (
                                        <div className="w-full h-full bg-linear-to-br from-zinc-800 to-zinc-900" />
                                    )}
                                    <div className="absolute inset-0 bg-linear-to-b from-transparent via-black/20 to-[#18181b]" />
                                </div>
                            )}

                            <div className="px-5 pb-5 relative">
                                <div className="flex justify-between items-end -mt-12 mb-4">
                                    <div className="relative group">
                                        <div className="w-24 h-24 rounded-full border-[5px] border-[#18181b] bg-zinc-800 overflow-hidden shadow-xl">
                                            {profile.avatar_url ? (
                                                <img src={profile.avatar_url} alt={profile.username || ''} className="w-full h-full object-cover" />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center text-3xl font-bold text-zinc-500 bg-zinc-800">
                                                    {profile.username?.[0]?.toUpperCase()}
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {currentUser?.id !== profile.id && (
                                        <button
                                            onClick={handleFollow}
                                            disabled={followLoading}
                                            className={`mb-2 px-6 py-2 text-sm font-bold rounded-full transition-all shadow-lg ${isFollowing
                                                ? 'bg-zinc-800 text-white hover:bg-zinc-700 border border-zinc-700'
                                                : 'bg-white text-black hover:bg-zinc-200 hover:scale-105 active:scale-95 shadow-white/10'
                                                }`}
                                        >
                                            {followLoading ? '...' : isFollowing ? 'Following' : 'Follow'}
                                        </button>
                                    )}
                                </div>

                                <div className="space-y-1">
                                    <h3 className="text-xl font-bold text-white leading-tight flex items-center gap-2">
                                        {profile.display_name || profile.username}
                                    </h3>
                                    <p className="text-zinc-400 font-medium">@{profile.username}</p>
                                </div>

                                <div className="mt-4 pt-4 border-t border-zinc-800 flex items-center gap-6 text-xs font-medium text-zinc-500">
                                    <div className="flex items-center gap-1.5">
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                        </svg>
                                        <span>Joined {new Date(profile.created_at).toLocaleDateString(undefined, { month: 'short', year: 'numeric' })}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="p-6 text-center text-zinc-500 text-sm">
                            <div className="mb-2">User not found</div>
                        </div>
                    )}
                </motion.div>
            )}
        </AnimatePresence>
    );

    return (
        <>
            <div
                ref={triggerRef}
                className={`inline-block ${className}`}
                onMouseEnter={handleMouseEnter}
                onMouseLeave={handleMouseLeave}
            >
                {children}
            </div>
            {mounted && createPortal(cardContent, document.body)}
        </>
    );
}