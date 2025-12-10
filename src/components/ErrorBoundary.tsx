import React, { Component, ReactNode } from 'react';
import { showToast } from '@/lib/toast';

interface Props {
    children: ReactNode;
}

interface State {
    hasError: boolean;
    error: Error | null;
    errorInfo: React.ErrorInfo | null;
}

class ErrorBoundary extends Component<Props, State> {
    constructor(props: Props) {
        super(props);
        this.state = {
            hasError: false,
            error: null,
            errorInfo: null,
        };
    }

    static getDerivedStateFromError(error: Error): State {
        return {
            hasError: true,
            error,
            errorInfo: null,
        };
    }

    componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
        console.error('ErrorBoundary caught an error:', error, errorInfo);

        this.setState({
            error,
            errorInfo,
        });

        if (error.message?.includes('auth') || error.message?.includes('session')) {
            showToast.error('Authentication error. Please try logging in again.');
        }
    }

    handleReset = () => {
        this.setState({
            hasError: false,
            error: null,
            errorInfo: null,
        });
    };

    handleGoHome = () => {
        this.setState({
            hasError: false,
            error: null,
            errorInfo: null,
        });
        window.location.href = '/';
    };

    handleReload = () => {
        window.location.reload();
    };

    render() {
        if (this.state.hasError) {
            const isDev = process.env.NODE_ENV === 'development';
            const { error, errorInfo } = this.state;

            return (
                <div className="min-h-screen bg-zinc-950 text-zinc-100 flex items-center justify-center p-4">
                    <div className="max-w-2xl w-full">
                        <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-8">
                            <div className="flex items-center gap-3 mb-6">
                                <div className="w-12 h-12 rounded-full bg-red-950/50 flex items-center justify-center">
                                    <svg className="w-6 h-6 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                    </svg>
                                </div>
                                <div>
                                    <h1 className="text-2xl font-bold text-white">Something went wrong</h1>
                                    <p className="text-sm text-zinc-400 mt-1">
                                        {isDev ? 'Check the console for details' : 'An unexpected error occurred'}
                                    </p>
                                </div>
                            </div>

                            {isDev && error && (
                                <div className="mb-6 space-y-4">
                                    <div className="bg-red-950/20 border border-red-900/50 rounded-lg p-4">
                                        <h3 className="text-sm font-semibold text-red-400 mb-2">Error Message:</h3>
                                        <p className="text-sm text-red-300 font-mono">{error.message}</p>
                                    </div>

                                    {error.stack && (
                                        <details className="bg-zinc-950 border border-zinc-800 rounded-lg p-4">
                                            <summary className="text-sm font-semibold text-zinc-300 cursor-pointer">
                                                Stack Trace
                                            </summary>
                                            <pre className="mt-3 text-xs text-zinc-400 overflow-x-auto whitespace-pre-wrap">
                                                {error.stack}
                                            </pre>
                                        </details>
                                    )}

                                    {errorInfo?.componentStack && (
                                        <details className="bg-zinc-950 border border-zinc-800 rounded-lg p-4">
                                            <summary className="text-sm font-semibold text-zinc-300 cursor-pointer">
                                                Component Stack
                                            </summary>
                                            <pre className="mt-3 text-xs text-zinc-400 overflow-x-auto whitespace-pre-wrap">
                                                {errorInfo.componentStack}
                                            </pre>
                                        </details>
                                    )}
                                </div>
                            )}

                            <div className="flex flex-col gap-3">
                                <button
                                    onClick={this.handleReset}
                                    className="w-full px-6 py-3 bg-white text-black rounded-lg font-medium hover:bg-zinc-200 transition-colors"
                                >
                                    Try Again
                                </button>
                                <div className="flex gap-3">
                                    <button
                                        onClick={this.handleGoHome}
                                        className="flex-1 px-6 py-3 bg-zinc-800 text-white rounded-lg font-medium hover:bg-zinc-700 transition-colors border border-zinc-700"
                                    >
                                        Go to Home
                                    </button>
                                    <button
                                        onClick={this.handleReload}
                                        className="flex-1 px-6 py-3 bg-zinc-800 text-white rounded-lg font-medium hover:bg-zinc-700 transition-colors border border-zinc-700"
                                    >
                                        Reload Page
                                    </button>
                                </div>
                            </div>

                            {!isDev && (
                                <p className="mt-6 text-sm text-zinc-500 text-center">
                                    If this problem persists, please contact support
                                </p>
                            )}
                        </div>
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}

export default ErrorBoundary;
