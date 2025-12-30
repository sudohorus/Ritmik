import { useState, useRef } from 'react';
import { Turnstile, TurnstileInstance } from '@marsidev/react-turnstile';
import { nsfwValidator } from '@/lib/nsfw-validator';

interface CreatePlaylistModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreate: (data: { name: string; description?: string; is_public?: boolean; cover_image_url?: string | null; banner_image_url?: string | null; token: string }) => Promise<void>;
}

export default function CreatePlaylistModal({ isOpen, onClose, onCreate }: CreatePlaylistModalProps) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [coverImage, setCoverImage] = useState('');
  const [bannerImage, setBannerImage] = useState('');
  const [isPublic, setIsPublic] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [token, setToken] = useState<string | null>(null);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const turnstileRef = useRef<TurnstileInstance | null>(null);

  if (isOpen) {
    nsfwValidator.preload();
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (isSubmitting || loading) {
      return;
    }

    if (!token) {
      setError('Please complete the security check');
      return;
    }

    let active = true;
    setIsSubmitting(true);
    setLoading(true);
    setError(null);

    try {
      if (coverImage.trim()) {
        const result = await nsfwValidator.validateImage(coverImage.trim());
        if (!result.isSafe) {
          throw new Error(`Cover image rejected: ${result.reason}`);
        }
      }

      if (bannerImage.trim()) {
        const result = await nsfwValidator.validateImage(bannerImage.trim());
        if (!result.isSafe) {
          throw new Error(`Banner image rejected: ${result.reason}`);
        }
      }

      const createPromise = onCreate({
        name: name.trim(),
        description: description.trim() || undefined,
        is_public: isPublic,
        cover_image_url: coverImage.trim() || null,
        banner_image_url: bannerImage.trim() || null,
        token
      });

      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Request timeout - please try again')), 15000)
      );

      await Promise.race([createPromise, timeoutPromise]);

      if (!active) return;

      setName('');
      setDescription('');
      setCoverImage('');
      setBannerImage('');
      setIsPublic(true);
      setToken(null);
      onClose();
    } catch (err) {
      if (active) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to create playlist';

        if (errorMessage.includes('timeout')) {
          setError('Connection timeout. Please check your internet and try again.');
        } else if (errorMessage.includes('network')) {
          setError('Network error. Please check your connection and try again.');
        } else if (errorMessage.includes('permission')) {
          setError('Permission denied. Please try logging out and back in.');
        } else {
          setError(errorMessage);
        }
        if (turnstileRef.current) {
          turnstileRef.current.reset();
        }
        setToken(null);
      }
    } finally {
      if (active) {
        setLoading(false);
        setTimeout(() => {
          setIsSubmitting(false);
        }, 1000);
      }
    }

    return () => {
      active = false;
    };
  };

  if (!isOpen) return null;

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
            <h2 className="text-2xl font-bold text-white">Create Playlist</h2>
            <button
              onClick={onClose}
              disabled={loading}
              className="text-zinc-400 hover:text-white transition-colors p-1 hover:bg-zinc-800 rounded-lg disabled:opacity-50"
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
                disabled={loading}
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
                disabled={loading}
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
                disabled={loading}
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
                disabled={loading}
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
                  disabled={loading}
                />
                <div className="w-11 h-6 bg-zinc-700 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-zinc-600 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600 peer-disabled:opacity-50"></div>
              </label>
            </div>

            <div className="flex justify-center">
              <Turnstile
                ref={turnstileRef}
                siteKey={process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY!}
                onSuccess={(token) => {
                  console.log('[Turnstile Widget] Token received successfully');
                  setToken(token);
                }}
                onExpire={() => {
                  console.log('[Turnstile Widget] Token expired');
                  setToken(null);
                }}
                onError={(error) => {
                  console.error('[Turnstile Widget] Error:', error);
                  setError('Security verification failed. Please refresh the page and try again.');
                }}
              />
            </div>

            {error && (
              <div className="p-3 bg-red-950/50 border border-red-900/50 rounded-lg text-red-400 text-sm flex items-start gap-2">
                <svg className="w-5 h-5 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <div>
                  <div className="font-medium mb-1">Error creating playlist</div>
                  <div>{error}</div>
                  {error.includes('timeout') && (
                    <div className="mt-2 text-xs">
                      Tip: Try using a shorter name/description or check your internet connection
                    </div>
                  )}
                </div>
              </div>
            )}

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={onClose}
                disabled={loading}
                className="flex-1 py-3 bg-zinc-800 text-zinc-300 rounded-lg font-medium hover:bg-zinc-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading || !name.trim() || isSubmitting || !token}
                className="flex-1 py-3 bg-white text-black rounded-lg font-semibold hover:bg-zinc-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-white flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
                    {isSubmitting ? 'Checking...' : 'Creating...'}
                  </>
                ) : (
                  'Create'
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}