import React from 'react';
import { AvatarDecoration } from '@/types/avatar-decoration';
import { DECORATION_STYLES, DEFAULT_DECORATION_STYLE, DECORATION_FILTERS } from '@/config/decoration-styles';

interface AvatarDecorationOverlayProps {
    decoration: AvatarDecoration | null;
}

export default function AvatarDecorationOverlay({ decoration }: AvatarDecorationOverlayProps) {
    if (!decoration) return null;

    const style = DECORATION_STYLES[decoration.name] || DEFAULT_DECORATION_STYLE;
    const filter = DECORATION_FILTERS[decoration.name];

    return (
        <div className={style}>
            <img
                src={decoration.image_url}
                alt={decoration.name}
                className="w-full h-full object-contain"
                style={filter ? { filter } : undefined}
            />
        </div>
    );
}
