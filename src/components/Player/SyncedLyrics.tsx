import { useEffect, useRef } from 'react';
import { LyricsLine } from '@/services/lyrics-service';

interface SyncedLyricsProps {
  lines: LyricsLine[];
  currentTime: number;
  onSeek: (time: number) => void;
}

export default function SyncedLyrics({ lines, currentTime, onSeek }: SyncedLyricsProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const activeLineRef = useRef<HTMLDivElement>(null);

  const currentIndex = lines.findIndex((line, index) => {
    const nextLine = lines[index + 1];
    return currentTime >= line.time && (!nextLine || currentTime < nextLine.time);
  });

  useEffect(() => {
    if (activeLineRef.current && containerRef.current) {
      const container = containerRef.current;
      const activeLine = activeLineRef.current;
      
      const containerHeight = container.clientHeight;
      const lineTop = activeLine.offsetTop;
      const lineHeight = activeLine.clientHeight;
      
      const scrollTo = lineTop - containerHeight / 2 + lineHeight / 2;
      
      container.scrollTo({
        top: scrollTo,
        behavior: 'smooth'
      });
    }
  }, [currentIndex]);

  return (
    <div 
      ref={containerRef}
      className="overflow-y-auto min-h-[400px] max-h-[600px] px-4 py-4"
    >
      <div className="space-y-4">
        {lines.map((line, index) => (
          <div
            key={index}
            ref={index === currentIndex ? activeLineRef : null}
            onClick={() => onSeek(line.time)}
            className={`text-base leading-loose font-sans transition-all duration-500 ease-out cursor-pointer hover:text-zinc-300 ${
              index <= currentIndex
                ? 'text-white'
                : 'text-zinc-600'
            }`}
          >
            {line.text}
          </div>
        ))}
      </div>
    </div>
  );
}

