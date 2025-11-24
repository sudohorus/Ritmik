interface ConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  isDanger?: boolean;
}

export default function ConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  isDanger = false,
}: ConfirmModalProps) {
  if (!isOpen) return null;

  const handleConfirm = () => {
    onConfirm();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={onClose}
      />
      
      <div className="relative bg-zinc-900 border border-zinc-800 rounded-lg p-6 max-w-md w-full shadow-xl">
        <h2 className="text-xl font-bold mb-3">{title}</h2>
        <p className="text-zinc-400 mb-6">{message}</p>
        
        <div className="flex gap-3 justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-white rounded-lg font-medium transition-colors"
          >
            {cancelText}
          </button>
          <button
            onClick={handleConfirm}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              isDanger
                ? 'bg-red-600 hover:bg-red-700 text-white'
                : 'bg-white hover:bg-zinc-200 text-black'
            }`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}



