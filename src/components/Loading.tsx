interface LoadingProps {
  fullScreen?: boolean;
  text?: string;
  size?: 'sm' | 'md' | 'lg';
}

export default function Loading({ fullScreen = false, text = 'Loading...', size = 'md' }: LoadingProps) {
  const sizeClasses = {
    sm: 'w-6 h-6',
    md: 'w-10 h-10',
    lg: 'w-16 h-16'
  };

  const textSizeClasses = {
    sm: 'text-sm',
    md: 'text-lg',
    lg: 'text-xl'
  };

  const content = (
    <div className="flex flex-col items-center justify-center gap-4">
      <div className={`${sizeClasses[size]} border-4 border-zinc-700 border-t-white rounded-full animate-spin`}></div>
      {text && <p className={`text-zinc-400 ${textSizeClasses[size]}`}>{text}</p>}
    </div>
  );

  if (fullScreen) {
    return (
      <div className="min-h-screen bg-zinc-950 text-zinc-100 flex items-center justify-center">
        {content}
      </div>
    );
  }

  return content;
}

