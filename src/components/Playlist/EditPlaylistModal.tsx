import { useState, useEffect } from 'react';
import { Playlist } from '@/types/playlist';

interface EditPlaylistModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUpdate: (data: { name: string; description?: string; is_public?: boolean; cover_image_url?: string }) => Promise<void>;
  playlist: Playlist | null;
}

export default function EditPlaylistModal({ isOpen, onClose, onUpdate, playlist }: EditPlaylistModalProps) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [coverImage, setCoverImage] = useState('');
  const [isPublic, setIsPublic] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (playlist) {
      setName(playlist.name);
      setDescription(playlist.description || '');
      setCoverImage(playlist.cover_image_url || '');
      setIsPublic(playlist.is_public);
    }
  }, [playlist]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      await onUpdate({ 
        name, 
        description: description || undefined,
        is_public: isPublic,
        cover_image_url: coverImage || undefined
      });
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update playlist');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen || !playlist) return null;

  return (
    <div
      className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm p-4 overflow-y-auto"
      onClick={onClose}
    >
      <div className="min-h-screen flex items-center justify-center">
        <div
          className="bg-zinc-900 rounded-lg p-6 w-full max-w-md"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-white">Edit Playlist</h2>
            <button
              onClick={onClose}
              className="text-zinc-400 hover:text-white transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-zinc-300 mb-2">
                Playlist Name
              </label>
              <input
                id="name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-4 py-3 bg-zinc-800 border border-zinc-700 rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:border-zinc-500 focus:ring-1 focus:ring-zinc-500 transition-colors"
                required
                autoFocus
                placeholder="My awesome playlist"
              />
            </div>

            <div>
              <label htmlFor="description" className="block text-sm font-medium text-zinc-300 mb-2">
                Description (optional)
              </label>
              <textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full px-4 py-3 bg-zinc-800 border border-zinc-700 rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:border-zinc-500 focus:ring-1 focus:ring-zinc-500 transition-colors resize-none"
                rows={3}
                placeholder="Describe your playlist..."
              />
            </div>

            <div>
              <label htmlFor="coverImage" className="block text-sm font-medium text-zinc-300 mb-2">
                Cover Image URL (optional)
              </label>
              <input
                id="coverImage"
                type="url"
                value={coverImage}
                onChange={(e) => setCoverImage(e.target.value)}
                className="w-full px-4 py-3 bg-zinc-800 border border-zinc-700 rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:border-zinc-500 focus:ring-1 focus:ring-zinc-500 transition-colors"
                placeholder="https://example.com/image.jpg"
              />
            </div>

            <div className="flex items-center gap-3">
              <input
                id="isPublic"
                type="checkbox"
                checked={isPublic}
                onChange={(e) => setIsPublic(e.target.checked)}
                className="w-4 h-4 bg-zinc-800 border-zinc-700 rounded text-white focus:ring-2 focus:ring-zinc-500"
              />
              <label htmlFor="isPublic" className="text-sm font-medium text-zinc-300">
                Make this playlist public
              </label>
            </div>

            {error && (
              <div className="p-3 bg-red-950/50 border border-red-900/50 rounded-lg text-red-400 text-sm">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-white text-black rounded-lg font-semibold hover:bg-zinc-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Saving...' : 'Save Changes'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}




