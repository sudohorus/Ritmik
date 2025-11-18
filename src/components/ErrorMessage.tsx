interface ErrorMessageProps {
  message: string;
}

export default function ErrorMessage({ message }: ErrorMessageProps) {
  return (
    <div className="mb-6 p-4 bg-red-950/50 border border-red-900 rounded-lg">
      <p className="text-red-400 text-sm">
        <span className="font-semibold">Error:</span> {message}
      </p>
    </div>
  );
}

