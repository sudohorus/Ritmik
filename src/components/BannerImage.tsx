import { CropData } from '@/types/profile-customization';

interface BannerImageProps {
    src: string;
    alt?: string;
    className?: string;
    style?: React.CSSProperties;
    blur?: string;
    brightness?: number;
    crop?: CropData | null;
    overlayClassName?: string;
}

export default function BannerImage({
    src,
    alt = '',
    className = '',
    style = {},
    blur = '0px',
    brightness = 1,
    crop = null,
    overlayClassName = "absolute inset-0 bg-linear-to-b from-black/20 via-zinc-950/40 to-zinc-950 z-10"
}: BannerImageProps) {
    const transformStyle = crop
        ? {
            objectPosition: crop.percentage
                ? `${crop.percentage.x}% ${crop.percentage.y}%`
                : `${crop.x}% ${crop.y}%`, 
            transform: `scale(${crop.zoom})`,
            transformOrigin: 'center',
            width: '100%',
            height: '100%',
            objectFit: 'cover' as const,
        }
        : {
            width: '100%',
            height: '100%',
            objectFit: 'cover' as const,
            objectPosition: 'center',
        };

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
            <div className="absolute inset-0 z-0 flex items-center justify-center overflow-hidden">
                <div className="w-full h-full relative overflow-hidden">
                    <img
                        src={src}
                        alt={alt}
                        className="transition-opacity duration-500"
                        style={{
                            ...transformStyle,
                            filter: `blur(${blur}) brightness(${brightness})`,
                        }}
                    />
                </div>
            </div>

            {/* Gradient Overlay */}
            <div className={overlayClassName} />
        </div>
    );
}
