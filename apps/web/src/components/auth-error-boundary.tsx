'use client';

import { Component, ReactNode } from 'react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

/**
 * Error boundary specifically for handling auth-related errors
 * like storage access issues in restricted browser contexts
 */
export class AuthErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    // Check if this is a storage access error (harmless)
    const isStorageError = error.message?.includes('Access to storage is not allowed');
    
    // Don't treat storage errors as fatal
    if (isStorageError) {
      console.warn('Storage access not available, some features may be limited');
      return { hasError: false };
    }
    
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Log error for debugging but don't crash for storage errors
    const isStorageError = error.message?.includes('Access to storage is not allowed');
    
    if (!isStorageError) {
      console.error('Auth Error:', error, errorInfo);
    }
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback || (
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <h2 className="text-lg font-semibold">Bir şeyler yanlış gitti</h2>
            <p className="text-muted-foreground mt-2">
              Lütfen sayfayı yenileyin veya daha sonra tekrar deneyin.
            </p>
            <button
              onClick={() => window.location.reload()}
              className="mt-4 px-4 py-2 bg-primary text-primary-foreground rounded-md"
            >
              Sayfayı Yenile
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

