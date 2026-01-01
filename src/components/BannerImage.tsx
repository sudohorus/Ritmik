import React from 'react';

interface BannerImageProps {
    src: string;
    alt?: string;
    className?: string;
    style?: React.CSSProperties;
    blur?: string;
    brightness?: number;
    overlayClassName?: string;
}

export default function BannerImage({
    src,
    alt = '',
    className = '',
    style = {},
    blur = '0px',
    brightness = 1,
    overlayClassName = "absolute inset-0 bg-linear-to-b from-black/20 via-zinc-950/40 to-zinc-950 z-10"
}: BannerImageProps) {
    return (
        <div className={`relative w-full h-full overflow-hidden ${className}`} style={style}>
            {/* Background Layer: Blurred and scaled to fill */}
            <div className="absolute inset-0 z-0">
                <img
                    src={src}
                    alt=""
                    className="w-full h-full object-cover scale-110"
                    style={{
                        filter: `blur(40px) brightness(${brightness * 0.8})`,
                    }}
                />
            </div>

            {/* Foreground Layer: Sharp image maintaining aspect ratio (or cover with better handling) */}
            <div className="absolute inset-0 z-0 flex items-center justify-center">
                <img
                    src={src}
                    alt={alt}
                    className="w-full h-full object-cover transition-opacity duration-500"
                    style={{
                        filter: `blur(${blur}) brightness(${brightness})`,
                    }}
                />
            </div>

            {/* Gradient Overlay */}
            <div className={overlayClassName} />
        </div>
    );
}
