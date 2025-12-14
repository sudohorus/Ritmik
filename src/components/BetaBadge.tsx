import { useMemo } from 'react';

interface BetaBadgeProps {
    createdAt: string;
    className?: string;
}

export default function BetaBadge({ createdAt, className = '' }: BetaBadgeProps) {
    const isBetaTester = useMemo(() => {
        const createdDate = new Date(createdAt);
        const cutoffDate = new Date('2025-12-14T23:59:59');
        return createdDate <= cutoffDate;
    }, [createdAt]);

    if (!isBetaTester) return null;

    return (
        <div
            className={`group relative inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-black/40 backdrop-blur-md border border-white/10 shadow-lg hover:bg-black/50 hover:border-white/20 transition-all animate-in fade-in zoom-in duration-500 ${className}`}
            aria-label="Beta Tester"
        >
            <svg
                className="w-4 h-4 text-yellow-500 drop-shadow-[0_0_8px_rgba(234,179,8,0.5)] group-hover:rotate-12 transition-transform duration-300"
                fill="currentColor"
                viewBox="0 0 24 24"
            >
                <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
            </svg>

            <span className="text-xs font-medium text-zinc-200 tracking-wide">
                Beta Tester
            </span>

            {/* Tooltip */}
            <div className="absolute top-full right-0 mt-2 px-3 py-1.5 bg-zinc-900/95 backdrop-blur-sm text-xs text-zinc-300 rounded-lg opacity-0 group-hover:opacity-100 transition-all duration-200 pointer-events-none whitespace-nowrap border border-white/10 shadow-xl z-50 translate-y-2 group-hover:translate-y-0">
                Joined on {new Date(createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                <div className="absolute bottom-full right-4 border-4 border-transparent border-b-zinc-900/95" />
            </div>
        </div>
    );
}
