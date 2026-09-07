'use client';

import React, { useState } from 'react';
import {
    Database,
    Server,
    Download,
    CheckCircle2,
    AlertCircle,
    X,
    HardDrive,
    Layers,
    Shield,
    FileText,
    Clock,
    RefreshCw
} from 'lucide-react';

interface BackupSummary {
    timestamp: string;
    oracle: Record<string, number>;
    mongodb: Record<string, number>;
    totalRecords: number;
    storageLocation: string;
}

interface BackupModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export default function BackupModal({ isOpen, onClose }: BackupModalProps) {
    const [running, setRunning] = useState(false);
    const [summary, setSummary] = useState<BackupSummary | null>(null);
    const [backupData, setBackupData] = useState<any | null>(null);
    const [error, setError] = useState<string | null>(null);

    if (!isOpen) return null;

    const handleRunBackup = async () => {
        setRunning(true);
        setError(null);
        setSummary(null);
        setBackupData(null);

        try {
            const res = await fetch('/api/backup', { method: 'POST' });
            const data = await res.json();

            if (data.success) {
                setSummary(data.summary);
                setBackupData(data.backupData);
            } else {
                setError(data.error || 'Failed to complete dual-database backup.');
            }
        } catch (err: any) {
            setError(err.message || 'Network error occurred during backup.');
        } finally {
            setRunning(false);
        }
    };

    const handleDownload = () => {
        if (!backupData) return;
        const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `lifeline_dual_db_backup_${new Date().toISOString().replace(/[:.]/g, '-')}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };

    return (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
            <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-2xl p-6 md:p-8 shadow-2xl space-y-6 relative my-8 animate-in fade-in zoom-in duration-200">
                {/* Close Button */}
                <button
                    onClick={onClose}
                    className="absolute top-5 right-5 text-slate-400 hover:text-white p-2 rounded-xl hover:bg-slate-800 transition"
                >
                    <X className="w-5 h-5" />
                </button>

                {/* Header */}
                <div className="flex items-center gap-3.5">
                    <div className="p-3 rounded-2xl bg-gradient-to-br from-rose-500 to-rose-700 text-white shadow-lg shadow-rose-950/50">
                        <HardDrive className="w-6 h-6" />
                    </div>
                    <div>
                        <h2 className="text-xl font-bold text-white flex items-center gap-2">
                            Dual-Database Disaster Recovery & Backup
                        </h2>
                        <p className="text-xs text-slate-400 mt-0.5">
                            Synchronous backup across Oracle Database 21c (PDB: XEPDB1) & MongoDB NoSQL.
                        </p>
                    </div>
                </div>

                {/* Target Information Chips */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800 flex items-center gap-3">
                        <Database className="w-5 h-5 text-rose-400 shrink-0" />
                        <div className="min-w-0 text-xs">
                            <div className="font-bold text-white truncate">Oracle 21c (3NF Relational)</div>
                            <div className="text-[11px] text-slate-400">14 Schema Tables • Constraints • Triggers</div>
                        </div>
                    </div>

                    <div className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800 flex items-center gap-3">
                        <Server className="w-5 h-5 text-emerald-400 shrink-0" />
                        <div className="min-w-0 text-xs">
                            <div className="font-bold text-white truncate">MongoDB NoSQL (Document Store)</div>
                            <div className="text-[11px] text-slate-400">Campaign Media • Reviews • Appeals</div>
                        </div>
                    </div>
                </div>

                {/* Error Banner */}
                {error && (
                    <div className="p-4 rounded-xl bg-rose-950/60 border border-rose-800 text-rose-200 text-xs flex items-center gap-2.5">
                        <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                        <span>{error}</span>
                    </div>
                )}

                {/* Success Summary */}
                {summary && (
                    <div className="space-y-4 animate-in fade-in duration-300">
                        <div className="p-4 rounded-xl bg-emerald-950/60 border border-emerald-800 text-emerald-200 text-xs flex items-center justify-between">
                            <div className="flex items-center gap-2.5">
                                <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                                <div>
                                    <div className="font-bold text-white">Backup Snapshot Created Successfully!</div>
                                    <div className="text-[11px] text-emerald-300">
                                        Total Records Exported: <strong className="font-mono">{summary.totalRecords}</strong>
                                    </div>
                                </div>
                            </div>
                            <button
                                onClick={handleDownload}
                                className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-semibold flex items-center gap-1.5 transition shadow"
                            >
                                <Download className="w-3.5 h-3.5" />
                                <span>Download Archive</span>
                            </button>
                        </div>

                        {/* Breakdown Tables */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                            {/* Oracle Breakdown */}
                            <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 space-y-2">
                                <div className="font-bold text-rose-400 flex items-center justify-between border-b border-slate-800 pb-2">
                                    <span className="flex items-center gap-1.5">
                                        <Database className="w-3.5 h-3.5" />
                                        Oracle 3NF Tables
                                    </span>
                                    <span className="text-[10px] text-slate-500 font-mono">14 Entities</span>
                                </div>
                                <div className="max-h-40 overflow-y-auto space-y-1 pr-1">
                                    {Object.entries(summary.oracle).map(([tbl, count]) => (
                                        <div key={tbl} className="flex justify-between py-0.5 text-slate-300 text-[11px]">
                                            <span className="font-mono">{tbl}:</span>
                                            <span className="font-bold text-white font-mono">{count} rows</span>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* MongoDB Breakdown */}
                            <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 space-y-2">
                                <div className="font-bold text-emerald-400 flex items-center justify-between border-b border-slate-800 pb-2">
                                    <span className="flex items-center gap-1.5">
                                        <Server className="w-3.5 h-3.5" />
                                        MongoDB Collections
                                    </span>
                                    <span className="text-[10px] text-slate-500 font-mono">Document Store</span>
                                </div>
                                <div className="space-y-1">
                                    {Object.entries(summary.mongodb).map(([coll, count]) => (
                                        <div key={coll} className="flex justify-between py-1 text-slate-300 text-[11px]">
                                            <span className="font-mono">{coll}:</span>
                                            <span className="font-bold text-white font-mono">{count} docs</span>
                                        </div>
                                    ))}
                                </div>

                                <div className="pt-3 border-t border-slate-800 text-[10px] text-slate-500">
                                    Saved to: <code className="text-cyan-400 font-mono">{summary.storageLocation}</code>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Primary Action Buttons */}
                <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-3">
                    <div className="text-[11px] text-slate-500 flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-slate-400" />
                        <span>Creates snapshot in <code className="text-slate-400 font-mono">resourses/backups/</code></span>
                    </div>

                    <div className="flex items-center gap-2 w-full sm:w-auto">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition w-full sm:w-auto"
                        >
                            Close
                        </button>
                        <button
                            type="button"
                            onClick={handleRunBackup}
                            disabled={running}
                            className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-rose-600 to-rose-700 hover:from-rose-500 hover:to-rose-600 disabled:opacity-50 text-white text-xs font-bold shadow-lg shadow-rose-950/50 flex items-center justify-center gap-2 transition w-full sm:w-auto"
                        >
                            {running ? (
                                <>
                                    <RefreshCw className="w-4 h-4 animate-spin" />
                                    <span>Exporting Databases...</span>
                                </>
                            ) : (
                                <>
                                    <HardDrive className="w-4 h-4" />
                                    <span>Trigger Dual-DB Backup</span>
                                </>
                            )}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
