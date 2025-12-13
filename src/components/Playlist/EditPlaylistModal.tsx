import { useState, useEffect } from 'react';
import { Playlist } from '@/types/playlist';

interface EditPlaylistModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUpdate: (data: { name: string; description?: string; is_public?: boolean; cover_image_url?: string; banner_image_url?: string }) => Promise<void>;
  playlist: Playlist | null;
}

export default function EditPlaylistModal({ isOpen, onClose, onUpdate, playlist }: EditPlaylistModalProps) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [coverImage, setCoverImage] = useState('');
  const [bannerImage, setBannerImage] = useState('');
  const [isPublic, setIsPublic] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (playlist) {
      setName(playlist.name);
      setDescription(playlist.description || '');
      setCoverImage(playlist.cover_image_url || '');
      setBannerImage(playlist.banner_image_url || '');
      setIsPublic(playlist.is_public);
    }
  }, [playlist]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    let active = true;

    setLoading(true);
    setError(null);

    try {
      await onUpdate({
        name,
        description: description || undefined,
        is_public: isPublic,
        cover_image_url: coverImage || undefined,
        banner_image_url: bannerImage || undefined
      });
      if (!active) return;
      onClose();
    } catch (err) {
      if (active) {
        setError(err instanceof Error ? err.message : 'Failed to update playlist');
      }
    } finally {
      if (active) {
        setLoading(false);
      }
    }
  };

  if (!isOpen || !playlist) return null;

  return (
    <div
      className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm p-4 overflow-y-auto"
      onClick={onClose}
    >
      <div className="min-h-screen flex items-center justify-center py-8">
        <div
          className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 w-full max-w-md shadow-2xl"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-white">Edit Playlist</h2>
            <button
              onClick={onClose}
              className="text-zinc-400 hover:text-white transition-colors p-1 hover:bg-zinc-800 rounded-lg"
              aria-label="Close"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-zinc-300 mb-2">
                Playlist Name *
              </label>
              <input
                id="name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-4 py-3 bg-zinc-800 border border-zinc-700 rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:border-zinc-600 focus:ring-2 focus:ring-zinc-600/50 transition-all"
                required
                autoFocus
                placeholder="My awesome playlist"
                maxLength={100}
              />
            </div>

            <div>
              <label htmlFor="description" className="block text-sm font-medium text-zinc-300 mb-2">
                Description
              </label>
              <textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full px-4 py-3 bg-zinc-800 border border-zinc-700 rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:border-zinc-600 focus:ring-2 focus:ring-zinc-600/50 transition-all resize-none"
                rows={3}
                placeholder="Describe your playlist..."
                maxLength={500}
              />
            </div>

            <div>
              <label htmlFor="coverImage" className="block text-sm font-medium text-zinc-300 mb-2">
                Cover Image URL
              </label>
              <input
                id="coverImage"
                type="url"
                value={coverImage}
                onChange={(e) => setCoverImage(e.target.value)}
                className="w-full px-4 py-3 bg-zinc-800 border border-zinc-700 rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:border-zinc-600 focus:ring-2 focus:ring-zinc-600/50 transition-all"
                placeholder="https://example.com/image.jpg"
              />
            </div>

            <div>
              <label htmlFor="bannerImage" className="block text-sm font-medium text-zinc-300 mb-2">
                Banner Image URL
              </label>
              <input
                id="bannerImage"
                type="url"
                value={bannerImage}
                onChange={(e) => setBannerImage(e.target.value)}
                className="w-full px-4 py-3 bg-zinc-800 border border-zinc-700 rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:border-zinc-600 focus:ring-2 focus:ring-zinc-600/50 transition-all"
                placeholder="https://example.com/banner.jpg"
              />
            </div>

            <div className="flex items-center justify-between p-4 bg-zinc-800/50 rounded-lg border border-zinc-800">
              <div>
                <label htmlFor="isPublic" className="text-sm font-medium text-zinc-300 cursor-pointer">
                  Public Playlist
                </label>
                <p className="text-xs text-zinc-500 mt-1">
                  Anyone can discover and view this playlist
                </p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  id="isPublic"
                  type="checkbox"
                  checked={isPublic}
                  onChange={(e) => setIsPublic(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-zinc-700 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-zinc-600 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>

            {error && (
              <div className="p-3 bg-red-950/50 border border-red-900/50 rounded-lg text-red-400 text-sm flex items-start gap-2">
                <svg className="w-5 h-5 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>{error}</span>
              </div>
            )}

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 py-3 bg-zinc-800 text-zinc-300 rounded-lg font-medium hover:bg-zinc-700 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading || !name.trim()}
                className="flex-1 py-3 bg-white text-black rounded-lg font-semibold hover:bg-zinc-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-white"
              >
                {loading ? 'Saving...' : 'Save'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}




