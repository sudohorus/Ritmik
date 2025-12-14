import { useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { showToast } from '@/lib/toast';

export default function ForgotPassword() {
    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(false);
    const { resetPassword } = useAuth();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        const { error } = await resetPassword(email);

        if (!error) {
            showToast.success('Password reset email sent. Please check your inbox.');
            setEmail('');
        }

        setLoading(false);
    };

    return (
        <div className="min-h-screen bg-zinc-950 text-zinc-100 flex items-center justify-center p-4">
            <div className="w-full max-w-md">
                <div className="text-center mb-8">
                    <h1 className="text-4xl font-bold tracking-tight mb-2">Reset Password</h1>
                    <p className="text-zinc-400">Enter your email to receive a reset link</p>
                </div>

                <div className="bg-zinc-900/50 rounded-lg p-8 border border-zinc-800">
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div>
                            <label htmlFor="email" className="block text-sm font-medium text-zinc-300 mb-2">
                                Email
                            </label>
                            <input
                                id="email"
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="w-full px-4 py-3 bg-zinc-800 border border-zinc-700 rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:border-zinc-500 focus:ring-1 focus:ring-zinc-500 transition-colors"
                                required
                                autoFocus
                                placeholder="you@example.com"
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full py-3 bg-white text-black rounded-lg font-semibold hover:bg-zinc-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {loading ? 'Sending...' : 'Send Reset Link'}
                        </button>
                    </form>

                    <div className="mt-6 text-center">
                        <Link href="/login" className="text-sm text-zinc-400 hover:text-white transition-colors">
                            ← Back to login
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
}
