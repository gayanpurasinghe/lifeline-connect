'use client';

import React, { useEffect } from 'react';
import { AlertOctagon, RotateCcw } from 'lucide-react';

export default function GlobalError({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    useEffect(() => {
        console.error('Unhandled Application Error:', error);
    }, [error]);

    return (
        <div className="min-h-[70vh] flex flex-col items-center justify-center p-6 text-center">
            <div className="p-4 bg-rose-950/60 border border-rose-800 rounded-2xl mb-4 text-rose-400">
                <AlertOctagon className="h-10 w-10 mx-auto" />
            </div>
            <h2 className="text-2xl font-bold text-white mb-2">Database Operation Failed</h2>
            <p className="text-xs text-slate-400 max-w-md mb-6 leading-relaxed">
                {error.message || 'An unexpected connection failure occurred while communicating with the database pool.'}
            </p>
            <button
                onClick={() => reset()}
                className="flex items-center gap-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold px-4 py-2.5 rounded-lg transition"
            >
                <RotateCcw className="h-3.5 w-3.5" />
                Retry Database Transaction
            </button>
        </div>
    );
}