'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { SessionProvider } from 'next-auth/react';
import { ThemeProvider } from 'next-themes';
import { useState, useEffect } from 'react';
import { Toaster } from '@/components/ui/sonner';
import { AuthErrorBoundary } from '@/components/auth-error-boundary';

// Check if storage is available (can be blocked by browser settings)
function isStorageAvailable(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    const testKey = '__storage_test__';
    window.localStorage.setItem(testKey, testKey);
    window.localStorage.removeItem(testKey);
    return true;
  } catch {
    return false;
  }
}

// Polyfill BroadcastChannel for environments where it's not available
function setupBroadcastChannelPolyfill() {
  if (typeof window === 'undefined') return;
  
  // If BroadcastChannel exists but storage is blocked, create a no-op version
  if (!isStorageAvailable() && typeof BroadcastChannel !== 'undefined') {
    const OriginalBroadcastChannel = window.BroadcastChannel;
    
    // Create a mock BroadcastChannel that doesn't throw errors
    window.BroadcastChannel = class MockBroadcastChannel {
      name: string;
      onmessage: ((event: MessageEvent) => void) | null = null;
      onmessageerror: ((event: MessageEvent) => void) | null = null;
      
      constructor(name: string) {
        this.name = name;
      }
      
      postMessage() {
        // No-op - silently ignore
      }
      
      close() {
        // No-op
      }
      
      addEventListener() {
        // No-op
      }
      
      removeEventListener() {
        // No-op
      }
      
      dispatchEvent(): boolean {
        return true;
      }
    } as unknown as typeof BroadcastChannel;
  }
}

export function Providers({ children }: { children: React.ReactNode }) {
  const [mounted, setMounted] = useState(false);
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 60 * 1000,
            refetchOnWindowFocus: false,
          },
        },
      })
  );

  // Setup polyfill, error handlers, and mount
  useEffect(() => {
    setupBroadcastChannelPolyfill();
    
    // Handle unhandled promise rejections for storage errors
    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      const message = event.reason?.message || event.reason?.toString() || '';
      
      // Prevent these specific errors from showing in console
      if (
        message.includes('Access to storage is not allowed') ||
        message.includes('message channel closed') ||
        message.includes('storage is not allowed')
      ) {
        event.preventDefault();
        event.stopPropagation();
        return false;
      }
    };
    
    // Handle console errors for storage access
    const originalError = console.error;
    console.error = (...args: any[]) => {
      const message = args.join(' ');
      if (
        message.includes('Access to storage is not allowed') ||
        message.includes('message channel closed') ||
        message.includes('storage is not allowed')
      ) {
        return; // Suppress these errors
      }
      originalError.apply(console, args);
    };
    
    window.addEventListener('unhandledrejection', handleUnhandledRejection);
    setMounted(true);
    
    return () => {
      window.removeEventListener('unhandledrejection', handleUnhandledRejection);
      console.error = originalError; // Restore original
    };
  }, []);

  // Always render SessionProvider, but configure it based on mount state and storage availability
  // This ensures useSession hooks work even during initial render
  const storageAvailable = mounted && isStorageAvailable();

  return (
    <AuthErrorBoundary>
      <SessionProvider 
        refetchOnWindowFocus={false}
        // Disable refetch interval if storage is not available or not mounted
        refetchInterval={storageAvailable ? 5 * 60 : 0}
      >
        <QueryClientProvider client={queryClient}>
          <ThemeProvider
            attribute="class"
            defaultTheme="dark"
            enableSystem
            disableTransitionOnChange
          >
            {children}
            <Toaster position="top-right" richColors />
          </ThemeProvider>
        </QueryClientProvider>
      </SessionProvider>
    </AuthErrorBoundary>
  );
}
