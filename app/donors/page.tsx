'use client';

import React, { useState, useEffect } from 'react';
import { UserCheck, UserX, UserPlus, HeartPulse, ShieldAlert, CheckCircle2, Clock } from 'lucide-react';

interface DonorRecord {
    DONORID: number;
    NAME: string;
    BLOODGROUP: string;
    CONTACT: string;
    EMAIL: string;
    REGDATE: string;
    WEIGHT?: number;
    BLOODPRESSURE?: string;
    HEMOGLOBIN?: number;
    ELIGIBLE?: string;
    DEFERRALREASON?: string;
    CHECKEDBYSTAFF?: string;
}

export default function DonorsPage() {
    const [donors, setDonors] = useState<DonorRecord[]>([]);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [statusBanner, setStatusBanner] = useState<{ type: 'success' | 'warning' | 'error'; message: string } | null>(null);

    // Form State
    const [name, setName] = useState('');
    const [dob, setDob] = useState('2000-01-01');
    const [bloodGroup, setBloodGroup] = useState('O+');
    const [contact, setContact] = useState('');
    const [email, setEmail] = useState('');
    const [address, setAddress] = useState('');
    const [weight, setWeight] = useState('65');
    const [bloodPressure, setBloodPressure] = useState('120/80');
    const [hemoglobin, setHemoglobin] = useState('14.0');
    const [checkedBy, setCheckedBy] = useState('1');

    const fetchDonors = async () => {
        try {
            setLoading(true);
            const res = await fetch('/api/donors');
            const json = await res.json();
            if (json.success) setDonors(json.data || []);
        } catch (err) {
            console.error('Failed to load donors:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchDonors();
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);
        setStatusBanner(null);

        try {
            const res = await fetch('/api/donors', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name,
                    dob,
                    bloodGroup,
                    contact,
                    email,
                    address,
                    weight,
                    bloodPressure,
                    hemoglobin,
                    checkedBy,
                }),
            });

            const json = await res.json();
            if (json.success) {
                if (json.eligible) {
                    setStatusBanner({ type: 'success', message: json.message });
                } else {
                    setStatusBanner({ type: 'warning', message: json.message });
                }
                // Reset form
                setName('');
                setContact('');
                setEmail('');
                setAddress('');
                fetchDonors();
            } else {
                setStatusBanner({ type: 'error', message: json.error || 'Registration failed' });
            }
        } catch (err: any) {
            setStatusBanner({ type: 'error', message: err.message });
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="max-w-7xl mx-auto p-6 md:p-10">
            {/* Header */}
            <div className="border-b border-slate-800 pb-6 mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-white flex items-center gap-3">
                        <HeartPulse className="h-8 w-8 text-rose-500" />
                        Donor Registration & Clinical Intake
                    </h1>
                    <p className="text-slate-400 text-sm mt-1">
                        Automated screening verified by Oracle business trigger <code className="text-rose-400">TRG_CHECK_ELIGIBILITY</code>
                    </p>
                </div>
            </div>

            {statusBanner && (
                <div
                    className={`mb-8 p-4 rounded-xl border flex items-center gap-3 text-sm ${statusBanner.type === 'success'
                            ? 'bg-emerald-950/60 border-emerald-800 text-emerald-300'
                            : statusBanner.type === 'warning'
                                ? 'bg-amber-950/60 border-amber-800 text-amber-300'
                                : 'bg-red-950/60 border-red-800 text-red-300'
                        }`}
                >
                    {statusBanner.type === 'success' ? (
                        <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-400" />
                    ) : (
                        <ShieldAlert className="h-5 w-5 shrink-0 text-amber-400" />
                    )}
                    <span>{statusBanner.message}</span>
                </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Registration Form */}
                <div className="lg:col-span-1 bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-xl h-fit">
                    <h2 className="text-lg font-bold text-white flex items-center gap-2 mb-4">
                        <UserPlus className="h-5 w-5 text-rose-500" />
                        New Donor Screening
                    </h2>

                    <form onSubmit={handleSubmit} className="space-y-4 text-xs">
                        <div>
                            <label className="block text-slate-400 mb-1 font-semibold">Full Name</label>
                            <input
                                required
                                type="text"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                placeholder="e.g. Kasun Rajakaruna"
                                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-slate-200"
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-2">
                            <div>
                                <label className="block text-slate-400 mb-1 font-semibold">Date of Birth</label>
                                <input
                                    required
                                    type="date"
                                    value={dob}
                                    onChange={(e) => setDob(e.target.value)}
                                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-slate-200"
                                />
                            </div>
                            <div>
                                <label className="block text-slate-400 mb-1 font-semibold">Blood Group</label>
                                <select
                                    value={bloodGroup}
                                    onChange={(e) => setBloodGroup(e.target.value)}
                                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-slate-200"
                                >
                                    {['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map((bg) => (
                                        <option key={bg} value={bg}>{bg}</option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-2">
                            <div>
                                <label className="block text-slate-400 mb-1 font-semibold">Contact Phone</label>
                                <input
                                    required
                                    type="text"
                                    value={contact}
                                    onChange={(e) => setContact(e.target.value)}
                                    placeholder="+94 7X XXX XXXX"
                                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-slate-200"
                                />
                            </div>
                            <div>
                                <label className="block text-slate-400 mb-1 font-semibold">Email</label>
                                <input
                                    required
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder="donor@example.com"
                                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-slate-200"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-slate-400 mb-1 font-semibold">Residential Address</label>
                            <input
                                type="text"
                                value={address}
                                onChange={(e) => setAddress(e.target.value)}
                                placeholder="City / Region"
                                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-slate-200"
                            />
                        </div>

                        {/* Vitals Section */}
                        <div className="pt-3 border-t border-slate-800">
                            <span className="text-[11px] font-bold uppercase tracking-wider text-rose-400 block mb-2">
                                Clinical Vitals (Trigger Evaluated)
                            </span>

                            <div className="grid grid-cols-3 gap-2">
                                <div>
                                    <label className="block text-slate-400 mb-1">Weight (kg)</label>
                                    <input
                                        required
                                        type="number"
                                        step="0.1"
                                        value={weight}
                                        onChange={(e) => setWeight(e.target.value)}
                                        className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-slate-200 font-mono"
                                    />
                                </div>
                                <div>
                                    <label className="block text-slate-400 mb-1">BP (mmHg)</label>
                                    <input
                                        required
                                        type="text"
                                        value={bloodPressure}
                                        onChange={(e) => setBloodPressure(e.target.value)}
                                        className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-slate-200 font-mono"
                                    />
                                </div>
                                <div>
                                    <label className="block text-slate-400 mb-1">Hb (g/dL)</label>
                                    <input
                                        required
                                        type="number"
                                        step="0.1"
                                        value={hemoglobin}
                                        onChange={(e) => setHemoglobin(e.target.value)}
                                        className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-slate-200 font-mono"
                                    />
                                </div>
                            </div>
                            <p className="text-[10px] text-slate-500 mt-2">
                                Threshold: Weight $\ge 50$ kg and Hemoglobin $\ge 12.5$ g/dL for clearance.
                            </p>
                        </div>

                        <button
                            type="submit"
                            disabled={submitting}
                            className="w-full bg-rose-600 hover:bg-rose-700 disabled:opacity-50 text-white font-semibold py-2.5 rounded-lg transition"
                        >
                            {submitting ? 'Screening via Trigger...' : 'Register & Evaluate Eligibility'}
                        </button>
                    </form>
                </div>

                {/* Registered Donors List */}
                <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-xl">
                    <h2 className="text-lg font-bold text-white mb-4 flex items-center justify-between">
                        <span>Registered Donors & Eligibility Logs</span>
                        <span className="text-xs text-slate-400 font-normal">{donors.length} records</span>
                    </h2>

                    {loading ? (
                        <div className="py-20 text-center text-slate-400">Loading donor logs from Oracle...</div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-xs">
                                <thead>
                                    <tr className="border-b border-slate-800 text-slate-400 uppercase font-semibold">
                                        <th className="py-3 px-3">Donor</th>
                                        <th className="py-3 px-3">Blood Group</th>
                                        <th className="py-3 px-3">Latest Vitals</th>
                                        <th className="py-3 px-3">Eligibility</th>
                                        <th className="py-3 px-3">Evaluation / Reason</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-800/60">
                                    {donors.map((d) => {
                                        const isEligible = d.ELIGIBLE === 'Y';
                                        return (
                                            <tr key={d.DONORID} className="hover:bg-slate-800/30 transition">
                                                <td className="py-3 px-3">
                                                    <p className="font-semibold text-slate-200">{d.NAME}</p>
                                                    <p className="text-[11px] text-slate-500">{d.CONTACT}</p>
                                                </td>
                                                <td className="py-3 px-3">
                                                    <span className="inline-block font-mono font-bold text-rose-400 bg-rose-950/50 border border-rose-800/70 px-2 py-0.5 rounded">
                                                        {d.BLOODGROUP}
                                                    </span>
                                                </td>
                                                <td className="py-3 px-3 text-slate-300 font-mono">
                                                    {d.WEIGHT ? (
                                                        <div>
                                                            <span>{d.WEIGHT} kg | {d.HEMOGLOBIN} g/dL</span>
                                                            <p className="text-[10px] text-slate-500">BP: {d.BLOODPRESSURE}</p>
                                                        </div>
                                                    ) : (
                                                        <span className="text-slate-600">Pending intake</span>
                                                    )}
                                                </td>
                                                <td className="py-3 px-3">
                                                    {d.ELIGIBLE ? (
                                                        <span
                                                            className={`inline-flex items-center gap-1 font-bold px-2 py-0.5 rounded text-[10px] uppercase ${isEligible
                                                                    ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                                                                    : 'bg-rose-950 text-rose-400 border border-rose-800'
                                                                }`}
                                                        >
                                                            {isEligible ? <UserCheck className="h-3 w-3" /> : <UserX className="h-3 w-3" />}
                                                            {isEligible ? 'Eligible' : 'Deferred'}
                                                        </span>
                                                    ) : (
                                                        <span className="text-slate-500">-</span>
                                                    )}
                                                </td>
                                                <td className="py-3 px-3 text-slate-400 max-w-[200px]">
                                                    {d.DEFERRALREASON ? (
                                                        <span className="text-rose-300 text-[11px]">{d.DEFERRALREASON}</span>
                                                    ) : isEligible ? (
                                                        <span className="text-emerald-400/80 text-[11px]">Cleared for collection</span>
                                                    ) : (
                                                        '-'
                                                    )}
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}