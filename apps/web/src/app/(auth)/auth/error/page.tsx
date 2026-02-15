'use client';

import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Suspense } from 'react';

function ErrorContent() {
    const searchParams = useSearchParams();
    const error = searchParams.get('error');

    return (
        <div className="flex min-h-screen flex-col items-center justify-center bg-gray-100">
            <div className="w-full max-w-md rounded-lg bg-white p-8 shadow-md">
                <h1 className="mb-4 text-2xl font-bold text-red-600">Authentication Error</h1>
                <p className="mb-6 text-gray-700">
                    {error === 'Configuration' && (
                        <span>
                            There is a problem with the server configuration. Check if the Keycloak environment variables are set correctly.
                        </span>
                    )}
                    {error === 'AccessDenied' && (
                        <span>
                            You do not have permission to sign in.
                        </span>
                    )}
                    {error === 'Verification' && (
                        <span>
                            The sign in link is no longer valid. It may have been used already or it may have expired.
                        </span>
                    )}
                    {!error && <span>An unknown error occurred.</span>}
                </p>
                <div className="text-center">
                    <Link
                        href="/login"
                        className="rounded bg-blue-600 px-4 py-2 font-bold text-white hover:bg-blue-700"
                    >
                        Back to Login
                    </Link>
                </div>
            </div>
        </div>
    );
}

export default function AuthErrorPage() {
    return (
        <Suspense fallback={<div>Loading...</div>}>
            <ErrorContent />
        </Suspense>
    );
}
