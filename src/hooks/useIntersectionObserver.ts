import { useEffect, useRef } from 'react';

interface UseIntersectionObserverProps {
    threshold?: number;
    root?: Element | null;
    rootMargin?: string;
    onIntersect?: () => void;
    enabled?: boolean;
}

export function useIntersectionObserver({
    threshold = 0,
    root = null,
    rootMargin = '0%',
    onIntersect,
    enabled = true,
}: UseIntersectionObserverProps) {
    const targetRef = useRef<HTMLDivElement | null>(null);

    useEffect(() => {
        if (!enabled || !targetRef.current) return;

        const observer = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    if (entry.isIntersecting) {
                        onIntersect?.();
                    }
                });
            },
            {
                threshold,
                root,
                rootMargin,
            }
        );

        observer.observe(targetRef.current);

        return () => {
            observer.disconnect();
        };
    }, [threshold, root, rootMargin, onIntersect, enabled]);

    return targetRef;
}
