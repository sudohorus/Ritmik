import { useState, useRef, useEffect } from 'react';

interface VolumeControlProps {
  volume: number;
  onVolumeChange: (volume: number) => void;
}

export default function VolumeControl({ volume, onVolumeChange }: VolumeControlProps) {
  const [isDragging, setIsDragging] = useState(false);
  const sliderRef = useRef<HTMLDivElement>(null);

  const getVolumeFromPosition = (clientX: number) => {
    if (!sliderRef.current) return volume;
    const bounds = sliderRef.current.getBoundingClientRect();
    const x = clientX - bounds.left;
    return Math.max(0, Math.min(1, x / bounds.width));
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    const newVolume = getVolumeFromPosition(e.clientX);
    onVolumeChange(newVolume);
    e.preventDefault();
  };

  useEffect(() => {
    if (!isDragging) return;

    const handleMouseMove = (e: MouseEvent) => {
      const newVolume = getVolumeFromPosition(e.clientX);
      onVolumeChange(newVolume);
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, onVolumeChange]);

  const getVolumeIcon = () => {
    if (volume === 0) {
      return (
        <path d="M16.5 12c0-1.77-1.02-3.29-2.5-4.03v2.21l2.45 2.45c.03-.2.05-.41.05-.63zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51C20.63 14.91 21 13.5 21 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM4.27 3L3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06c1.38-.31 2.63-.95 3.69-1.81L19.73 21 21 19.73l-9-9L4.27 3zM12 4L9.91 6.09 12 8.18V4z" />
      );
    } else if (volume < 0.5) {
      return <path d="M7 9v6h4l5 5V4l-5 5H7z" />;
    } else {
      return <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02z" />;
    }
  };

  return (
    <div className="flex items-center gap-2">
      <button
        onClick={() => onVolumeChange(volume > 0 ? 0 : 1.0)}
        className="text-zinc-400 hover:text-white transition-colors shrink-0"
        title={volume === 0 ? 'Unmute' : 'Mute'}
      >
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
          {getVolumeIcon()}
        </svg>
      </button>
      
      <div
        ref={sliderRef}
        onMouseDown={handleMouseDown}
        className="relative w-20 h-1 bg-zinc-800 rounded-full cursor-pointer group"
      >
        <div
          className="absolute h-full bg-white rounded-full transition-all"
          style={{ width: `${volume * 100}%` }}
        />
        
        <div
          className="absolute top-1/2 w-3 h-3 bg-white rounded-full opacity-0 group-hover:opacity-100 group-hover:scale-110 transition-all shadow-lg pointer-events-none -translate-x-1/2 -translate-y-1/2"
          style={{ 
            left: `${volume * 100}%`,
          }}
        />
      </div>
    </div>
  );
}

