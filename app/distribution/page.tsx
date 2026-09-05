'use client';

import React, { useState, useEffect } from 'react';
import {
    Truck,
    PackageCheck,
    CheckCircle2,
    AlertCircle,
    Building2,
    Droplet,
    Send,
    Calendar,
    Layers
} from 'lucide-react';

interface HospitalRequest {
    REQUESTID: number;
    HOSPITALNAME: string;
    HOSPITALLOCATION: string;
    PRIORITY: 'CRITICAL' | 'URGENT' | 'NORMAL';
    REQUIREDDATE: string;
    REQUESTSTATUS: string;
    REQUESTITEMID: number;
    BLOODGROUP: string;
    COMPONENTTYPE: string;
    UNITSREQUESTED: number;
    UNITSFULFILLED: number;
    UNITSREMAINING: number;
}

interface BloodUnit {
    UNITID: number;
    BLOODGROUP: string;
    COMPONENTTYPE: string;
    VOLUME_ML: number;
    STORAGELOCATION: string;
    EXPIRYDATE: string;
    DAYSREMAINING: number;
}

interface StaffMember {
    STAFFID: number;
    NAME: string;
    ROLE: string;
}

export default function DistributionPage() {
    const [requests, setRequests] = useState<HospitalRequest[]>([]);
    const [availableUnits, setAvailableUnits] = useState<BloodUnit[]>([]);
    const [staffList, setStaffList] = useState<StaffMember[]>([]);
    const [loading, setLoading] = useState(true);
    const [dispatching, setDispatching] = useState(false);

    // Selected item for dispatch modal
    const [activeItem, setActiveItem] = useState<HospitalRequest | null>(null);
    const [selectedUnitId, setSelectedUnitId] = useState<string>('');
    const [selectedStaffId, setSelectedStaffId] = useState<string>('');
    const [dispatchNotes, setDispatchNotes] = useState<string>('');
    const [banner, setBanner] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

    const loadData = async () => {
        try {
            setLoading(true);
            const res = await fetch('/api/distribution');
            const json = await res.json();
            if (json.success) {
                setRequests(json.requests || []);
                setAvailableUnits(json.availableUnits || []);
                setStaffList(json.staff || []);
                if (json.staff?.length > 0) {
                    setSelectedStaffId(String(json.staff[0].STAFFID));
                }
            }
        } catch (err) {
            console.error('Failed to load requisitions:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadData();
    }, []);

    const openDispatchModal = (item: HospitalRequest) => {
        setActiveItem(item);
        setBanner(null);
        setDispatchNotes(`Dispatched to ${item.HOSPITALNAME} for Req #${item.REQUESTID}`);

        // Filter available units matching blood group & component
        const matching = availableUnits.filter(
            (u) => u.BLOODGROUP === item.BLOODGROUP && u.COMPONENTTYPE === item.COMPONENTTYPE
        );
        if (matching.length > 0) {
            setSelectedUnitId(String(matching[0].UNITID));
        } else {
            setSelectedUnitId('');
        }
    };

    const handleDispatch = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!activeItem || !selectedUnitId || !selectedStaffId) return;

        setDispatching(true);
        setBanner(null);

        try {
            const res = await fetch('/api/distribution', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    requestItemId: activeItem.REQUESTITEMID,
                    unitId: parseInt(selectedUnitId, 10),
                    staffId: parseInt(selectedStaffId, 10),
                    notes: dispatchNotes,
                }),
            });

            const json = await res.json();
            if (json.success) {
                setBanner({ type: 'success', message: json.message });
                setActiveItem(null);
                loadData(); // Re-fetch to reflect trigger execution
            } else {
                setBanner({ type: 'error', message: json.error || 'Dispatch transaction failed' });
            }
        } catch (err: any) {
            setBanner({ type: 'error', message: err.message });
        } finally {
            setDispatching(false);
        }
    };

    return (
        <div className="max-w-7xl mx-auto p-6 md:p-10">
            {/* Header */}
            <div className="border-b border-slate-800 pb-6 mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-white flex items-center gap-3">
                        <Truck className="h-8 w-8 text-rose-500" />
                        Hospital Requisitions & Distribution
                    </h1>
                    <p className="text-slate-400 text-sm mt-1">
                        Requisition fulfillment verified by Oracle trigger <code className="text-rose-400">TRG_AFTER_DISTRIBUTION</code>
                    </p>
                </div>
                <div className="flex items-center gap-2 text-xs">
                    <span className="bg-slate-900 border border-slate-800 text-slate-300 px-3 py-1.5 rounded-lg flex items-center gap-1.5">
                        <Layers className="h-3.5 w-3.5 text-rose-400" />
                        Available Inventory: {availableUnits.length} units
                    </span>
                </div>
            </div>

            {banner && (
                <div
                    className={`mb-8 p-4 rounded-xl border flex items-center gap-3 text-sm ${banner.type === 'success'
                            ? 'bg-emerald-950/60 border-emerald-800 text-emerald-300'
                            : 'bg-red-950/60 border-red-800 text-red-300'
                        }`}
                >
                    {banner.type === 'success' ? (
                        <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-400" />
                    ) : (
                        <AlertCircle className="h-5 w-5 shrink-0 text-red-400" />
                    )}
                    <span>{banner.message}</span>
                </div>
            )}

            {/* Main Content: Requisitions Grid */}
            <div className="space-y-6">
                <h2 className="text-lg font-bold text-white flex items-center gap-2">
                    <PackageCheck className="h-5 w-5 text-rose-500" />
                    Open Hospital Requisition Items ({requests.length})
                </h2>

                {loading ? (
                    <div className="py-20 text-center text-slate-400">Loading requisitions from Oracle PDB...</div>
                ) : requests.length === 0 ? (
                    <div className="py-20 text-center text-slate-500 bg-slate-900/50 rounded-xl border border-slate-800">
                        All hospital requests are completely fulfilled!
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {requests.map((req) => {
                            const matchingCount = availableUnits.filter(
                                (u) => u.BLOODGROUP === req.BLOODGROUP && u.COMPONENTTYPE === req.COMPONENTTYPE
                            ).length;
                            const fulfilledPct = Math.round((req.UNITSFULFILLED / req.UNITSREQUESTED) * 100);

                            return (
                                <div
                                    key={req.REQUESTITEMID}
                                    className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg flex flex-col justify-between"
                                >
                                    <div>
                                        <div className="flex items-start justify-between gap-2 mb-3">
                                            <div>
                                                <span
                                                    className={`text-[10px] font-extrabold px-2.5 py-0.5 rounded-full uppercase tracking-wider ${req.PRIORITY === 'CRITICAL'
                                                            ? 'bg-rose-950 text-rose-400 border border-rose-800 animate-pulse'
                                                            : req.PRIORITY === 'URGENT'
                                                                ? 'bg-amber-950 text-amber-400 border border-amber-800'
                                                                : 'bg-blue-950 text-blue-400 border border-blue-800'
                                                        }`}
                                                >
                                                    {req.PRIORITY} PRIORITY
                                                </span>
                                                <h3 className="text-base font-bold text-white mt-1.5 flex items-center gap-1.5">
                                                    <Building2 className="h-4 w-4 text-slate-400" />
                                                    {req.HOSPITALNAME}
                                                </h3>
                                                <p className="text-xs text-slate-500">{req.HOSPITALLOCATION}</p>
                                            </div>

                                            <div className="flex flex-col items-center bg-rose-950/40 border border-rose-800/80 rounded-lg px-2.5 py-1">
                                                <span className="text-[10px] text-rose-400 font-bold uppercase">Type</span>
                                                <span className="text-lg font-black text-rose-500">{req.BLOODGROUP}</span>
                                            </div>
                                        </div>

                                        <div className="space-y-1.5 text-xs text-slate-400 mt-4 pb-3 border-b border-slate-800">
                                            <p className="flex items-center justify-between">
                                                <span>Component:</span>
                                                <span className="font-semibold text-slate-200">{req.COMPONENTTYPE}</span>
                                            </p>
                                            <p className="flex items-center justify-between">
                                                <span>Required By:</span>
                                                <span className="text-slate-300 flex items-center gap-1">
                                                    <Calendar className="h-3 w-3 text-slate-500" />
                                                    {req.REQUIREDDATE}
                                                </span>
                                            </p>
                                            <p className="flex items-center justify-between">
                                                <span>Matching in Stock:</span>
                                                <span
                                                    className={`font-mono font-bold ${matchingCount > 0 ? 'text-emerald-400' : 'text-rose-400'
                                                        }`}
                                                >
                                                    {matchingCount} units
                                                </span>
                                            </p>
                                        </div>

                                        {/* Progress */}
                                        <div className="mt-3">
                                            <div className="flex justify-between text-xs mb-1">
                                                <span className="text-slate-400">Fulfillment Status</span>
                                                <span className="text-slate-200 font-medium">
                                                    {req.UNITSFULFILLED} / {req.UNITSREQUESTED} ({fulfilledPct}%)
                                                </span>
                                            </div>
                                            <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden">
                                                <div
                                                    className="bg-rose-600 h-2 rounded-full transition-all duration-300"
                                                    style={{ width: `${fulfilledPct}%` }}
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    <div className="mt-5 pt-3 border-t border-slate-800">
                                        <button
                                            onClick={() => openDispatchModal(req)}
                                            disabled={matchingCount === 0}
                                            className="w-full bg-rose-600 hover:bg-rose-700 disabled:opacity-40 disabled:cursor-not-allowed text-white text-xs font-semibold py-2 rounded-lg transition flex items-center justify-center gap-2"
                                        >
                                            <Send className="h-3.5 w-3.5" />
                                            {matchingCount === 0 ? 'Out of Matching Stock' : 'Dispatch Unit to Hospital'}
                                        </button>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* Dispatch Action Modal */}
            {activeItem && (
                <div className="fixed inset-0 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4 z-50">
                    <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 max-w-md w-full shadow-2xl">
                        <h2 className="text-lg font-bold text-white mb-1">Dispatch Blood Unit</h2>
                        <p className="text-xs text-slate-400 mb-4">
                            Fulfilling Item #{activeItem.REQUESTITEMID} for {activeItem.HOSPITALNAME}
                        </p>

                        <form onSubmit={handleDispatch} className="space-y-4 text-xs">
                            <div>
                                <label className="block text-slate-400 mb-1 font-semibold">
                                    Select Unit ({activeItem.BLOODGROUP} - {activeItem.COMPONENTTYPE})
                                </label>
                                <select
                                    required
                                    value={selectedUnitId}
                                    onChange={(e) => setSelectedUnitId(e.target.value)}
                                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-slate-200"
                                >
                                    {availableUnits
                                        .filter(
                                            (u) =>
                                                u.BLOODGROUP === activeItem.BLOODGROUP &&
                                                u.COMPONENTTYPE === activeItem.COMPONENTTYPE
                                        )
                                        .map((u) => (
                                            <option key={u.UNITID} value={u.UNITID}>
                                                Unit #{u.UNITID} - Loc: {u.STORAGELOCATION} (Expires in {u.DAYSREMAINING}d)
                                            </option>
                                        ))}
                                </select>
                            </div>

                            <div>
                                <label className="block text-slate-400 mb-1 font-semibold">Authorizing Staff</label>
                                <select
                                    required
                                    value={selectedStaffId}
                                    onChange={(e) => setSelectedStaffId(e.target.value)}
                                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-slate-200"
                                >
                                    {staffList.map((s) => (
                                        <option key={s.STAFFID} value={s.STAFFID}>
                                            {s.NAME} ({s.ROLE})
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="block text-slate-400 mb-1 font-semibold">Distribution Notes</label>
                                <input
                                    type="text"
                                    value={dispatchNotes}
                                    onChange={(e) => setDispatchNotes(e.target.value)}
                                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-slate-200"
                                />
                            </div>

                            <div className="bg-slate-950 p-3 rounded-lg border border-slate-800 text-[11px] text-slate-400">
                                <span className="text-rose-400 font-bold block mb-1">Trigger Execution Notice:</span>
                                Submitting this dispatch executes <code className="text-slate-300">TRG_AFTER_DISTRIBUTION</code>, which will automatically transition the unit to <strong>DISTRIBUTED</strong> and increment fulfilled units.
                            </div>

                            <div className="flex justify-end gap-2 pt-2">
                                <button
                                    type="button"
                                    onClick={() => setActiveItem(null)}
                                    className="px-3.5 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={dispatching || !selectedUnitId}
                                    className="px-4 py-2 rounded-lg bg-rose-600 hover:bg-rose-700 disabled:opacity-50 text-white font-semibold flex items-center gap-1.5"
                                >
                                    {dispatching ? 'Executing Dispatch...' : 'Confirm Dispatch'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}