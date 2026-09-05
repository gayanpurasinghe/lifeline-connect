'use client';

import React, { useState, useEffect } from 'react';
import {
    Activity,
    AlertTriangle,
    Calendar,
    Database,
    FileText,
    HeartHandshake,
    RefreshCw
} from 'lucide-react';

interface ReportOption {
    id: string;
    name: string;
    description: string;
    defaultParam?: string;
    paramLabel?: string;
}

const REPORTS: ReportOption[] = [
    {
        id: 'units-by-camp',
        name: 'Report 1: Collection by Camp',
        description: 'Aggregated blood units collected across venues and blood groups.',
    },
    {
        id: 'expiring-inventory',
        name: 'Report 2: Expiring Inventory',
        description: 'Predictive forecast of blood units expiring within specified days.',
        defaultParam: '30',
        paramLabel: 'Days Threshold',
    },
    {
        id: 'donor-history',
        name: 'Report 3: Donor History & Eligibility',
        description: 'Clinical vitals, eligibility logs, and donation history for a donor.',
        defaultParam: '1',
        paramLabel: 'Donor ID',
    },
    {
        id: 'hospital-fulfillment',
        name: 'Report 4: Hospital Fulfillment & Shortages',
        description: 'Hospital requisitions categorized by priority and fulfillment deficits.',
    },
    {
        id: 'camp-performance',
        name: 'Report 5: Camp Target Achievement',
        description: 'Target vs. actual collection rates and organizer performance.',
    },
];

export default function DashboardPage() {
    const [selectedReport, setSelectedReport] = useState<string>('units-by-camp');
    const [paramValue, setParamValue] = useState<string>('');
    const [reportData, setReportData] = useState<any[]>([]);
    const [loading, setLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);

    const activeConfig = REPORTS.find((r) => r.id === selectedReport);

    useEffect(() => {
        if (activeConfig?.defaultParam) {
            setParamValue(activeConfig.defaultParam);
        } else {
            setParamValue('');
        }
    }, [selectedReport]);

    const fetchReport = async () => {
        setLoading(true);
        setError(null);
        try {
            let url = `/api/reports/${selectedReport}`;
            if (selectedReport === 'expiring-inventory' && paramValue) {
                url += `?days=${paramValue}`;
            } else if (selectedReport === 'donor-history' && paramValue) {
                url += `?donorId=${paramValue}`;
            }

            const res = await fetch(url);
            const json = await res.json();

            if (!res.ok || !json.success) {
                throw new Error(json.error || 'Failed to fetch report');
            }

            setReportData(json.data || []);
        } catch (err: any) {
            setError(err.message);
            setReportData([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchReport();
    }, [selectedReport]);

    return (
        <div className="min-h-screen bg-slate-950 text-slate-100 p-6 md:p-10">
            {/* Header */}
            <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-6 mb-8">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-white flex items-center gap-3">
                        <Activity className="h-8 w-8 text-rose-500" />
                        LifeLine Connect Dashboard
                    </h1>
                    <p className="text-slate-400 text-sm mt-1">
                        Oracle PL/SQL Analytical Reporting & Dual-Database Management
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-emerald-950 text-emerald-400 border border-emerald-800">
                        <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                        PDB & NoSQL Live
                    </span>
                </div>
            </div>

            {/* KPI Cards */}
            <div className="max-w-7xl mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
                    <div className="flex items-center justify-between">
                        <span className="text-slate-400 text-xs uppercase font-semibold">Active Engine</span>
                        <Database className="h-5 w-5 text-rose-400" />
                    </div>
                    <p className="text-xl font-bold mt-2 text-white">Oracle 3NF</p>
                    <span className="text-xs text-slate-500">14 Relational Tables</span>
                </div>

                <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
                    <div className="flex items-center justify-between">
                        <span className="text-slate-400 text-xs uppercase font-semibold">Reports Package</span>
                        <FileText className="h-5 w-5 text-cyan-400" />
                    </div>
                    <p className="text-xl font-bold mt-2 text-white">5 Procedures</p>
                    <span className="text-xs text-slate-500">LIFELINE_REPORTS_PKG</span>
                </div>

                <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
                    <div className="flex items-center justify-between">
                        <span className="text-slate-400 text-xs uppercase font-semibold">Blood Appeals</span>
                        <AlertTriangle className="h-5 w-5 text-amber-400" />
                    </div>
                    <p className="text-xl font-bold mt-2 text-white">MongoDB</p>
                    <span className="text-xs text-slate-500">Unstructured Document Store</span>
                </div>

                <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
                    <div className="flex items-center justify-between">
                        <span className="text-slate-400 text-xs uppercase font-semibold">Audit Triggers</span>
                        <HeartHandshake className="h-5 w-5 text-emerald-400" />
                    </div>
                    <p className="text-xl font-bold mt-2 text-white">3 Active</p>
                    <span className="text-xs text-slate-500">Auto-Expiry & Eligibility</span>
                </div>
            </div>

            {/* Report Explorer Panel */}
            <div className="max-w-7xl mx-auto bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-xl">
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-6 border-b border-slate-800">
                    <div>
                        <h2 className="text-lg font-semibold text-white">PL/SQL Business Reports Explorer</h2>
                        <p className="text-slate-400 text-sm mt-0.5">{activeConfig?.description}</p>
                    </div>

                    <div className="flex flex-wrap items-center gap-3">
                        <select
                            value={selectedReport}
                            onChange={(e) => setSelectedReport(e.target.value)}
                            className="bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-rose-500"
                        >
                            {REPORTS.map((r) => (
                                <option key={r.id} value={r.id}>
                                    {r.name}
                                </option>
                            ))}
                        </select>

                        {activeConfig?.paramLabel && (
                            <div className="flex items-center gap-2">
                                <input
                                    type="number"
                                    value={paramValue}
                                    onChange={(e) => setParamValue(e.target.value)}
                                    placeholder={activeConfig.paramLabel}
                                    className="w-28 bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-rose-500"
                                />
                            </div>
                        )}

                        <button
                            onClick={fetchReport}
                            disabled={loading}
                            className="flex items-center gap-2 bg-rose-600 hover:bg-rose-700 disabled:opacity-50 text-white text-sm font-medium px-4 py-2 rounded-lg transition"
                        >
                            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                            Run Report
                        </button>
                    </div>
                </div>

                {/* Dynamic Table Output */}
                <div className="mt-6 overflow-x-auto">
                    {error && (
                        <div className="p-4 rounded-lg bg-red-950/50 border border-red-800 text-red-300 text-sm">
                            PL/SQL Error: {error}
                        </div>
                    )}

                    {loading ? (
                        <div className="py-16 text-center text-slate-400">
                            <RefreshCw className="h-8 w-8 animate-spin mx-auto text-rose-500 mb-2" />
                            Fetching output from Oracle SYS_REFCURSOR...
                        </div>
                    ) : reportData.length === 0 && !error ? (
                        <div className="py-16 text-center text-slate-500 text-sm">
                            No records returned for the current parameters.
                        </div>
                    ) : (
                        <table className="w-full text-left text-sm border-collapse">
                            <thead>
                                <tr className="border-b border-slate-800 text-slate-400 uppercase text-xs">
                                    {reportData.length > 0 &&
                                        Object.keys(reportData[0]).map((key) => (
                                            <th key={key} className="py-3 px-4 font-semibold tracking-wider">
                                                {key.replace(/_/g, ' ')}
                                            </th>
                                        ))}
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-800/60">
                                {reportData.map((row, idx) => (
                                    <tr key={idx} className="hover:bg-slate-800/40 transition">
                                        {Object.values(row).map((val: any, cIdx) => (
                                            <td key={cIdx} className="py-3 px-4 text-slate-200">
                                                {val !== null && val !== undefined ? String(val) : '-'}
                                            </td>
                                        ))}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>
            </div>
        </div>
    );
}