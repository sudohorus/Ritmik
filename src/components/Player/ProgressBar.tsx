import { formatDuration } from '@/utils/format';
import { useState, useRef, useEffect } from 'react';

interface ProgressBarProps {
  progress: number;
  duration: number;
  onSeek: (seconds: number) => void;
}

export default function ProgressBar({ progress, duration, onSeek }: ProgressBarProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [dragProgress, setDragProgress] = useState(0);
  const [hoverPosition, setHoverPosition] = useState<number | null>(null);
  const progressRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isDragging) {
      setDragProgress(progress);
    }
  }, [progress, isDragging]);

  const getPercentage = (clientX: number) => {
    if (!progressRef.current) return 0;
    const bounds = progressRef.current.getBoundingClientRect();
    const x = clientX - bounds.left;
    return Math.max(0, Math.min(1, x / bounds.width));
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    const percentage = getPercentage(e.clientX);
    const newProgress = percentage * duration;
    setDragProgress(newProgress);
    onSeek(newProgress);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    const percentage = getPercentage(e.clientX);
    setHoverPosition(percentage);

    if (isDragging) {
      const newProgress = percentage * duration;
      setDragProgress(newProgress);
      onSeek(newProgress);
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleMouseLeave = () => {
    setHoverPosition(null);
    if (isDragging) {
      setIsDragging(false);
    }
  };

  const displayProgress = isDragging ? dragProgress : progress;
  const percentage = duration > 0 ? (displayProgress / duration) * 100 : 0;

  return (
    <div className="w-full flex items-center gap-3">
      <span className="text-xs text-zinc-400 min-w-[38px] text-right tabular-nums">
        {formatDuration(Math.floor(displayProgress))}
      </span>
      
      <div
        ref={progressRef}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseLeave}
        className="relative flex-1 h-1 bg-zinc-800 rounded-full cursor-pointer group"
      >
        <div
          className="absolute h-full bg-white rounded-full transition-none"
          style={{ width: `${percentage}%` }}
        />
        
        <div
          className="absolute top-1/2 w-3 h-3 bg-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity shadow-md pointer-events-none"
          style={{ 
            left: `${percentage}%`, 
            transform: 'translate(-50%, -50%)',
          }}
        />

        {hoverPosition !== null && !isDragging && (
          <div
            className="absolute -top-8 px-2 py-1 bg-white text-zinc-900 text-xs rounded font-medium pointer-events-none shadow-lg"
            style={{ left: `${hoverPosition * 100}%`, transform: 'translateX(-50%)' }}
          >
            {formatDuration(Math.floor(hoverPosition * duration))}
          </div>
        )}
      </div>
      
      <span className="text-xs text-zinc-400 min-w-[38px] tabular-nums">
        {formatDuration(Math.floor(duration))}
      </span>
    </div>
  );
}

