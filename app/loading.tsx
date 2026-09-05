import React from 'react';
import { RefreshCw } from 'lucide-react';

export default function Loading() {
    return (
        <div className="min-h-[70vh] flex flex-col items-center justify-center gap-4 text-slate-400">
            <RefreshCw className="h-10 w-10 text-rose-500 animate-spin" />
            <div className="text-center space-y-1">
                <p className="text-base font-semibold text-white">Querying Dual-Database Engine</p>
                <p className="text-xs text-slate-500">Streaming datasets from Oracle PDB and MongoDB...</p>
            </div>
        </div>
    );
}