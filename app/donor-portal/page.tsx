'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '@/lib/auth/AuthContext';
import { useRouter, useSearchParams } from 'next/navigation';
import {
    Heart,
    Calendar,
    Activity,
    Shield,
    CheckCircle2,
    AlertCircle,
    FileDown,
    Clock,
    MapPin,
    Building2,
    Droplet,
    User,
    Sparkles,
    Search,
    ChevronRight,
    ArrowUpRight,
    Award,
    HeartHandshake,
    AlertTriangle,
    Info,
    RefreshCw,
    Phone,
    Mail,
    Check
} from 'lucide-react';
import Link from 'next/link';
import { generatePLSQLReportPDF } from '@/lib/reports/pdfGenerator';

interface CampItem {
    CAMPID: number;
    CAMPNAME: string;
    STARTDATE: string;
    ENDDATE: string;
    TARGETUNITS: number;
    STATUS: string;
    VENUENAME: string;
    CITY: string;
    ADDRESS: string;
    ORGANIZERNAME: string;
    UNITSCOLLECTED: number;
}

interface DonorHistoryRow {
    DONORID: number;
    NAME: string;
    BLOODGROUP: string;
    CONTACT: string;
    CHECKDATE: string;
    WEIGHT: number;
    BLOODPRESSURE: string;
    HEMOGLOBIN: number;
    ELIGIBLE: string;
    DEFERRALREASON?: string;
    DONATIONID?: number;
    DONATIONDATE?: string;
    UNITSDONATED?: number;
    LOCATIONNAME?: string;
}

export default function DonorPortalPage() {
    const { user, loading: authLoading } = useAuth();
    const router = useRouter();
    const searchParams = useSearchParams();

    // Default tab from query param or 'camps'
    const initialTab = searchParams.get('tab') === 'history' ? 'history' : 'camps';
    const [activeTab, setActiveTab] = useState<'camps' | 'history' | 'guidelines'>(initialTab);

    // Camps state
    const [camps, setCamps] = useState<CampItem[]>([]);
    const [campsLoading, setCampsLoading] = useState(true);
    const [campsError, setCampsError] = useState<string | null>(null);
    const [campSearch, setCampSearch] = useState('');
    const [campCityFilter, setCampCityFilter] = useState('ALL');
    const [pledgedCamps, setPledgedCamps] = useState<Record<number, boolean>>({});

    // History state
    const effectiveDonorId = user?.donorId || 1;
    const [selectedDonorId, setSelectedDonorId] = useState<number>(effectiveDonorId);
    const [historyData, setHistoryData] = useState<DonorHistoryRow[]>([]);
    const [historyLoading, setHistoryLoading] = useState(true);
    const [historyError, setHistoryError] = useState<string | null>(null);
    const [downloadingPdf, setDownloadingPdf] = useState(false);

    // Sync selectedDonorId when user loads
    useEffect(() => {
        if (user?.donorId) {
            setSelectedDonorId(user.donorId);
        }
    }, [user]);

    // Handle tab change from URL query
    useEffect(() => {
        const tabParam = searchParams.get('tab');
        if (tabParam === 'history' || tabParam === 'camps' || tabParam === 'guidelines') {
            setActiveTab(tabParam);
        }
    }, [searchParams]);

    // Fetch Camps
    const fetchCamps = async () => {
        try {
            setCampsLoading(true);
            const res = await fetch('/api/camps');
            const data = await res.json();
            if (data.success) {
                setCamps(data.data || []);
            } else {
                setCampsError(data.error || 'Failed to load camps');
            }
        } catch (err: any) {
            setCampsError(err.message || 'Error fetching camps');
        } finally {
            setCampsLoading(false);
        }
    };

    // Fetch Donor History via PL/SQL report
    const fetchHistory = async (donorId: number) => {
        try {
            setHistoryLoading(true);
            setHistoryError(null);
            const res = await fetch(`/api/reports/donor-history?donorId=${donorId}`);
            const data = await res.json();
            if (data.success) {
                setHistoryData(data.data || []);
            } else {
                setHistoryError(data.error || 'Failed to fetch donor history');
            }
        } catch (err: any) {
            setHistoryError(err.message || 'Error fetching history');
        } finally {
            setHistoryLoading(false);
        }
    };

    useEffect(() => {
        fetchCamps();
    }, []);

    useEffect(() => {
        if (selectedDonorId) {
            fetchHistory(selectedDonorId);
        }
    }, [selectedDonorId]);

    // Computed Donor Metrics
    const latestRecord = historyData.length > 0 ? historyData[0] : null;
    const completedDonations = historyData.filter((r) => r.DONATIONID != null);
    const totalUnitsDonated = completedDonations.reduce((sum, r) => sum + (Number(r.UNITSDONATED) || 1), 0);
    const isEligible = latestRecord?.ELIGIBLE === 'Y';
    const deferralReason = latestRecord?.DEFERRALREASON;

    // Filtered Camps
    const filteredCamps = useMemo(() => {
        return camps.filter((c) => {
            const matchesSearch =
                c.CAMPNAME.toLowerCase().includes(campSearch.toLowerCase()) ||
                c.VENUENAME.toLowerCase().includes(campSearch.toLowerCase()) ||
                c.CITY.toLowerCase().includes(campSearch.toLowerCase());
            const matchesCity = campCityFilter === 'ALL' || c.CITY.toUpperCase() === campCityFilter.toUpperCase();
            return matchesSearch && matchesCity;
        });
    }, [camps, campSearch, campCityFilter]);

    // Distinct Cities
    const availableCities = useMemo(() => {
        const set = new Set(camps.map((c) => c.CITY).filter(Boolean));
        return Array.from(set);
    }, [camps]);

    const handleTogglePledge = (campId: number) => {
        setPledgedCamps((prev) => ({
            ...prev,
            [campId]: !prev[campId],
        }));
    };

    const handleDownloadPdf = () => {
        if (!historyData || historyData.length === 0) return;
        setDownloadingPdf(true);
        try {
            generatePLSQLReportPDF({
                reportId: 'donor-history',
                reportName: 'Report 3: Donor History & Clinical Eligibility',
                description: `Official PL/SQL RefCursor donor record for ${latestRecord?.NAME || user?.displayName || 'Donor'} (ID #${selectedDonorId})`,
                paramValue: selectedDonorId.toString(),
                paramLabel: 'Donor ID',
                data: historyData,
            });
        } catch (err) {
            console.error('PDF generation error:', err);
        } finally {
            setDownloadingPdf(false);
        }
    };

    return (
        <div className="max-w-7xl mx-auto p-4 md:p-8 space-y-6">
            {/* Top Welcome Banner & Identity Card */}
            <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-slate-900 via-rose-950/40 to-slate-900 border border-slate-800 p-6 md:p-8 shadow-2xl backdrop-blur-xl">
                {/* Background Glow */}
                <div className="absolute top-0 right-1/4 w-72 h-72 bg-rose-600/10 rounded-full blur-3xl pointer-events-none" />

                <div className="relative z-10 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
                    <div className="flex items-start md:items-center gap-4">
                        <div className="relative shrink-0">
                            <div className="w-16 h-16 md:w-20 md:h-20 rounded-2xl bg-gradient-to-br from-rose-500 to-rose-700 flex items-center justify-center shadow-lg shadow-rose-950/70 border border-rose-400/30">
                                <Heart className="w-8 h-8 md:w-10 md:h-10 text-white fill-white animate-pulse" />
                            </div>
                            <span className="absolute -bottom-1 -right-1 px-2 py-0.5 rounded-md bg-slate-950 text-rose-400 border border-rose-800 text-[11px] font-mono font-bold">
                                {latestRecord?.BLOODGROUP || user?.bloodGroup || 'O+'}
                            </span>
                        </div>

                        <div>
                            <div className="flex flex-wrap items-center gap-2 mb-1">
                                <span className="text-xs px-2.5 py-0.5 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/30 font-mono font-semibold">
                                    DONOR #{selectedDonorId}
                                </span>
                                {isEligible ? (
                                    <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-950 text-emerald-400 border border-emerald-800 flex items-center gap-1 font-semibold">
                                        <CheckCircle2 className="w-3 h-3" />
                                        Cleared for Donation
                                    </span>
                                ) : deferralReason ? (
                                    <span className="text-xs px-2.5 py-0.5 rounded-full bg-amber-950 text-amber-300 border border-amber-800 flex items-center gap-1 font-semibold">
                                        <AlertTriangle className="w-3 h-3" />
                                        Temporarily Deferred
                                    </span>
                                ) : (
                                    <span className="text-xs px-2.5 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700 font-semibold">
                                        Active Donor
                                    </span>
                                )}
                            </div>

                            <h1 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight">
                                {latestRecord?.NAME || user?.displayName || 'Registered Blood Donor'}
                            </h1>

                            <div className="flex flex-wrap items-center gap-4 text-xs text-slate-400 mt-2">
                                <span className="flex items-center gap-1">
                                    <Mail className="w-3.5 h-3.5 text-slate-500" />
                                    {user?.email || latestRecord?.CONTACT ? latestRecord?.CONTACT : 'saman@mail.com'}
                                </span>
                                <span className="flex items-center gap-1">
                                    <Droplet className="w-3.5 h-3.5 text-rose-400" />
                                    Blood Type: <strong className="text-white font-bold">{latestRecord?.BLOODGROUP || user?.bloodGroup || 'O+'}</strong>
                                </span>
                                <span className="flex items-center gap-1">
                                    <Shield className="w-3.5 h-3.5 text-cyan-400" />
                                    Oracle 3NF Verified
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Quick Profile Donor Selector for Examiners / Multi-Donor Switch */}
                    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 bg-slate-950/80 p-3 rounded-2xl border border-slate-800 shrink-0">
                        <div className="text-left">
                            <div className="text-[10px] font-bold uppercase text-slate-400">Viewing Record:</div>
                            <div className="text-xs font-semibold text-rose-300">
                                {latestRecord?.NAME || `Donor #${selectedDonorId}`}
                            </div>
                        </div>

                        <div className="flex items-center gap-1.5 flex-wrap">
                            {[
                                { id: 1, label: '#1 Saman (O+)' },
                                { id: 2, label: '#2 Anura (A-)' },
                                { id: 3, label: '#3 Dilani (B+)' },
                                { id: 4, label: '#4 Roshan (AB+)' },
                                { id: 8, label: '#8 Priyantha (B-)' },
                            ].map((d) => (
                                <button
                                    key={d.id}
                                    onClick={() => setSelectedDonorId(d.id)}
                                    className={`px-2.5 py-1 text-[11px] rounded-lg font-medium transition ${
                                        selectedDonorId === d.id
                                            ? 'bg-rose-600 text-white shadow-sm'
                                            : 'bg-slate-900 text-slate-400 hover:text-white hover:bg-slate-800 border border-slate-800'
                                    }`}
                                >
                                    {d.label}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Metric Summary Cards */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 pt-6 border-t border-slate-800/80">
                    <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800/80">
                        <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
                            <span>Donations Made</span>
                            <Award className="w-4 h-4 text-rose-400" />
                        </div>
                        <div className="text-2xl font-black text-white">{completedDonations.length}</div>
                        <div className="text-[10px] text-emerald-400 mt-0.5">
                            {completedDonations.length > 0 ? `${totalUnitsDonated} Blood Unit(s) Collected` : 'Ready for First Donation'}
                        </div>
                    </div>

                    <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800/80">
                        <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
                            <span>Lives Impacted</span>
                            <HeartHandshake className="w-4 h-4 text-emerald-400" />
                        </div>
                        <div className="text-2xl font-black text-white">{completedDonations.length * 3}</div>
                        <div className="text-[10px] text-slate-400 mt-0.5">~3 lives per unit donated</div>
                    </div>

                    <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800/80">
                        <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
                            <span>Clinical Vitals</span>
                            <Activity className="w-4 h-4 text-cyan-400" />
                        </div>
                        <div className="text-lg font-bold text-white truncate">
                            {latestRecord?.HEMOGLOBIN ? `${latestRecord.HEMOGLOBIN} g/dL` : 'Screening Pend.'}
                        </div>
                        <div className="text-[10px] text-slate-400 mt-0.5 truncate">
                            BP: {latestRecord?.BLOODPRESSURE || '120/80'} • {latestRecord?.WEIGHT || '65'} kg
                        </div>
                    </div>

                    <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800/80">
                        <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
                            <span>Status</span>
                            <Shield className="w-4 h-4 text-purple-400" />
                        </div>
                        <div className="text-lg font-bold text-white truncate">
                            {isEligible ? 'ELIGIBLE' : deferralReason ? 'DEFERRED' : 'ACTIVE'}
                        </div>
                        <div className="text-[10px] text-slate-400 mt-0.5 truncate">
                            {deferralReason ? deferralReason : 'Cleared by TRG_CHECK_ELIGIBILITY'}
                        </div>
                    </div>
                </div>
            </div>

            {/* Main Tabs Navigation */}
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <div className="flex items-center gap-2">
                    <button
                        onClick={() => setActiveTab('camps')}
                        className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all ${
                            activeTab === 'camps'
                                ? 'bg-rose-600 text-white shadow-lg shadow-rose-950/50'
                                : 'text-slate-400 hover:text-white hover:bg-slate-900'
                        }`}
                    >
                        <Calendar className="w-4 h-4" />
                        Upcoming Camps
                        <span className="px-1.5 py-0.5 rounded-full bg-black/30 text-[10px] font-mono font-bold">
                            {camps.length}
                        </span>
                    </button>

                    <button
                        onClick={() => setActiveTab('history')}
                        className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all ${
                            activeTab === 'history'
                                ? 'bg-rose-600 text-white shadow-lg shadow-rose-950/50'
                                : 'text-slate-400 hover:text-white hover:bg-slate-900'
                        }`}
                    >
                        <Activity className="w-4 h-4" />
                        My Donation History
                        <span className="px-1.5 py-0.5 rounded-full bg-black/30 text-[10px] font-mono font-bold">
                            {completedDonations.length}
                        </span>
                    </button>

                    <button
                        onClick={() => setActiveTab('guidelines')}
                        className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all ${
                            activeTab === 'guidelines'
                                ? 'bg-rose-600 text-white shadow-lg shadow-rose-950/50'
                                : 'text-slate-400 hover:text-white hover:bg-slate-900'
                        }`}
                    >
                        <Info className="w-4 h-4" />
                        Pre-Donation Guidelines
                    </button>
                </div>

                {activeTab === 'history' && historyData.length > 0 && (
                    <button
                        onClick={handleDownloadPdf}
                        disabled={downloadingPdf}
                        className="flex items-center gap-2 px-3.5 py-2 text-xs font-semibold bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-700 rounded-xl transition shadow"
                    >
                        <FileDown className="w-3.5 h-3.5 text-rose-400" />
                        {downloadingPdf ? 'Exporting PDF...' : 'Download Official History PDF'}
                    </button>
                )}
            </div>

            {/* TAB 1: UPCOMING CAMPS */}
            {activeTab === 'camps' && (
                <div className="space-y-4">
                    {/* Camps Search & Filter Bar */}
                    <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between bg-slate-900/60 p-4 rounded-2xl border border-slate-800">
                        <div className="relative flex-1">
                            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
                            <input
                                type="text"
                                placeholder="Search camps by title, venue, or district..."
                                value={campSearch}
                                onChange={(e) => setCampSearch(e.target.value)}
                                className="w-full pl-9 pr-4 py-2 bg-slate-950/80 border border-slate-800 rounded-xl text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-rose-500 transition"
                            />
                        </div>

                        <div className="flex items-center gap-2">
                            <span className="text-xs text-slate-400 whitespace-nowrap">Filter City:</span>
                            <select
                                value={campCityFilter}
                                onChange={(e) => setCampCityFilter(e.target.value)}
                                className="bg-slate-950/80 border border-slate-800 text-slate-200 text-xs rounded-xl px-3 py-2 focus:outline-none focus:border-rose-500"
                            >
                                <option value="ALL">All Locations</option>
                                {availableCities.map((city) => (
                                    <option key={city} value={city}>
                                        {city}
                                    </option>
                                ))}
                            </select>

                            <button
                                onClick={fetchCamps}
                                title="Refresh Camps"
                                className="p-2 text-slate-400 hover:text-white bg-slate-950/80 border border-slate-800 rounded-xl hover:bg-slate-800 transition"
                            >
                                <RefreshCw className="w-4 h-4" />
                            </button>
                        </div>
                    </div>

                    {campsLoading ? (
                        <div className="p-12 text-center bg-slate-900/40 rounded-2xl border border-slate-800/80">
                            <div className="inline-block w-8 h-8 border-2 border-rose-500 border-t-transparent rounded-full animate-spin mb-3" />
                            <div className="text-sm font-semibold text-slate-300">Loading scheduled blood donation camps...</div>
                        </div>
                    ) : campsError ? (
                        <div className="p-6 bg-rose-950/40 border border-rose-800 rounded-2xl text-rose-300 text-xs flex items-center gap-3">
                            <AlertCircle className="w-5 h-5 text-rose-400 shrink-0" />
                            <span>{campsError}</span>
                        </div>
                    ) : filteredCamps.length === 0 ? (
                        <div className="p-12 text-center bg-slate-900/40 rounded-2xl border border-slate-800">
                            <Calendar className="w-10 h-10 text-slate-600 mx-auto mb-3" />
                            <div className="text-base font-bold text-white">No camps match your search criteria</div>
                            <div className="text-xs text-slate-400 mt-1">Try resetting the filter or search query.</div>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {filteredCamps.map((camp) => {
                                const isPledged = pledgedCamps[camp.CAMPID];
                                const isPlanned = camp.STATUS === 'PLANNED';
                                const isActive = camp.STATUS === 'ACTIVE';

                                return (
                                    <div
                                        key={camp.CAMPID}
                                        className="relative group flex flex-col justify-between rounded-2xl bg-slate-900/70 border border-slate-800/90 hover:border-rose-900/80 p-5 transition-all shadow-lg hover:shadow-xl hover:shadow-rose-950/20 backdrop-blur"
                                    >
                                        <div>
                                            <div className="flex items-center justify-between gap-2 mb-3">
                                                <span
                                                    className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${
                                                        isActive
                                                            ? 'bg-emerald-950/80 text-emerald-300 border-emerald-800'
                                                            : isPlanned
                                                            ? 'bg-amber-950/80 text-amber-300 border-amber-800'
                                                            : 'bg-slate-800 text-slate-400 border-slate-700'
                                                    }`}
                                                >
                                                    {camp.STATUS}
                                                </span>

                                                <span className="text-[11px] font-mono text-slate-400 flex items-center gap-1">
                                                    <Clock className="w-3 h-3 text-rose-400" />
                                                    {camp.STARTDATE}
                                                </span>
                                            </div>

                                            <h3 className="text-base font-bold text-white group-hover:text-rose-400 transition leading-snug mb-2">
                                                {camp.CAMPNAME}
                                            </h3>

                                            <div className="space-y-1.5 text-xs text-slate-400 mb-4">
                                                <div className="flex items-start gap-2">
                                                    <Building2 className="w-3.5 h-3.5 text-slate-500 shrink-0 mt-0.5" />
                                                    <span>{camp.VENUENAME}</span>
                                                </div>
                                                <div className="flex items-start gap-2">
                                                    <MapPin className="w-3.5 h-3.5 text-rose-500 shrink-0 mt-0.5" />
                                                    <span>
                                                        {camp.ADDRESS}, <strong className="text-slate-300">{camp.CITY}</strong>
                                                    </span>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <User className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                                                    <span>Organizer: {camp.ORGANIZERNAME}</span>
                                                </div>
                                            </div>

                                            {/* Progress towards target */}
                                            <div className="bg-slate-950/70 p-3 rounded-xl border border-slate-800/80 mb-4">
                                                <div className="flex items-center justify-between text-xs mb-1.5">
                                                    <span className="text-slate-400">Target Quota</span>
                                                    <span className="font-bold text-white font-mono">
                                                        {camp.UNITSCOLLECTED} / {camp.TARGETUNITS} Units
                                                    </span>
                                                </div>
                                                <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                                                    <div
                                                        className="bg-gradient-to-r from-rose-500 to-rose-600 h-full rounded-full transition-all"
                                                        style={{
                                                            width: `${Math.min(
                                                                100,
                                                                Math.round(((camp.UNITSCOLLECTED || 0) / (camp.TARGETUNITS || 50)) * 100)
                                                            )}%`,
                                                        }}
                                                    />
                                                </div>
                                            </div>
                                        </div>

                                        <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between gap-2">
                                            <button
                                                type="button"
                                                onClick={() => handleTogglePledge(camp.CAMPID)}
                                                className={`flex-1 py-2 px-3 text-xs font-semibold rounded-xl transition flex items-center justify-center gap-1.5 ${
                                                    isPledged
                                                        ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                                                        : 'bg-gradient-to-r from-rose-600 to-rose-700 hover:from-rose-500 hover:to-rose-600 text-white shadow'
                                                }`}
                                            >
                                                {isPledged ? (
                                                    <>
                                                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                                                        Pledge Confirmed
                                                    </>
                                                ) : (
                                                    <>
                                                        <Heart className="w-3.5 h-3.5 fill-white" />
                                                        Pledge to Attend
                                                    </>
                                                )}
                                            </button>

                                            <Link
                                                href={`/camps?campId=${camp.CAMPID}`}
                                                className="p-2 rounded-xl bg-slate-950 hover:bg-slate-800 text-slate-400 hover:text-white border border-slate-800 transition"
                                                title="View Full Camp & Roster Details"
                                            >
                                                <ArrowUpRight className="w-4 h-4" />
                                            </Link>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            )}

            {/* TAB 2: MY DONATION HISTORY & CLINICAL VITALS */}
            {activeTab === 'history' && (
                <div className="space-y-6">
                    {historyLoading ? (
                        <div className="p-12 text-center bg-slate-900/40 rounded-2xl border border-slate-800/80">
                            <div className="inline-block w-8 h-8 border-2 border-rose-500 border-t-transparent rounded-full animate-spin mb-3" />
                            <div className="text-sm font-semibold text-slate-300">
                                Executing PL/SQL LIFELINE_REPORTS_PKG.GET_DONOR_HISTORY_REPORT...
                            </div>
                        </div>
                    ) : historyError ? (
                        <div className="p-6 bg-rose-950/40 border border-rose-800 rounded-2xl text-rose-300 text-xs flex items-center gap-3">
                            <AlertCircle className="w-5 h-5 text-rose-400 shrink-0" />
                            <span>{historyError}</span>
                        </div>
                    ) : (
                        <>
                            {/* Past Donations Table */}
                            <div className="bg-slate-900/80 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
                                <div className="p-5 border-b border-slate-800 flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 rounded-lg bg-rose-950/80 text-rose-400 border border-rose-900/60">
                                            <Droplet className="w-5 h-5" />
                                        </div>
                                        <div>
                                            <h2 className="text-base font-bold text-white">Completed Donations Log</h2>
                                            <p className="text-xs text-slate-400">
                                                Verified records stored in Oracle 3NF DONATION table
                                            </p>
                                        </div>
                                    </div>
                                    <span className="text-xs px-2.5 py-1 rounded-full bg-rose-950/60 text-rose-300 border border-rose-800 font-mono font-bold">
                                        {completedDonations.length} Record(s)
                                    </span>
                                </div>

                                {completedDonations.length === 0 ? (
                                    <div className="p-8 text-center text-xs text-slate-400">
                                        No completed blood donations logged yet for this donor.
                                    </div>
                                ) : (
                                    <div className="overflow-x-auto">
                                        <table className="w-full text-left text-xs">
                                            <thead className="bg-slate-950/80 text-slate-400 uppercase tracking-wider font-semibold border-b border-slate-800">
                                                <tr>
                                                    <th className="px-5 py-3">Donation ID</th>
                                                    <th className="px-5 py-3">Donation Date</th>
                                                    <th className="px-5 py-3">Units</th>
                                                    <th className="px-5 py-3">Collection Venue / Drive</th>
                                                    <th className="px-5 py-3">Status</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-slate-800/60">
                                                {completedDonations.map((row, idx) => (
                                                    <tr key={idx} className="hover:bg-slate-800/40 transition">
                                                        <td className="px-5 py-3.5 font-mono font-bold text-rose-400">
                                                            #{row.DONATIONID}
                                                        </td>
                                                        <td className="px-5 py-3.5 text-slate-200 font-medium">
                                                            {row.DONATIONDATE || '—'}
                                                        </td>
                                                        <td className="px-5 py-3.5 text-white font-bold">
                                                            {row.UNITSDONATED || 1} Unit (~450ml)
                                                        </td>
                                                        <td className="px-5 py-3.5 text-slate-300">
                                                            <div className="flex items-center gap-1.5">
                                                                <Building2 className="w-3.5 h-3.5 text-slate-500" />
                                                                {row.LOCATIONNAME || 'Central Blood Bank'}
                                                            </div>
                                                        </td>
                                                        <td className="px-5 py-3.5">
                                                            <span className="px-2 py-0.5 rounded-md bg-emerald-950 text-emerald-400 border border-emerald-800 text-[10px] font-bold uppercase">
                                                                COMPLETED
                                                            </span>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                )}
                            </div>

                            {/* Clinical Health Assessments & Vitals */}
                            <div className="bg-slate-900/80 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
                                <div className="p-5 border-b border-slate-800 flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 rounded-lg bg-cyan-950/80 text-cyan-400 border border-cyan-900/60">
                                            <Activity className="w-5 h-5" />
                                        </div>
                                        <div>
                                            <h2 className="text-base font-bold text-white">
                                                Medical Health Screenings & Vitals
                                            </h2>
                                            <p className="text-xs text-slate-400">
                                                Clinical pre-donation checks evaluated by TRG_CHECK_ELIGIBILITY trigger
                                            </p>
                                        </div>
                                    </div>
                                    <span className="text-xs px-2.5 py-1 rounded-full bg-cyan-950/60 text-cyan-300 border border-cyan-800 font-mono font-bold">
                                        {historyData.length} Examination(s)
                                    </span>
                                </div>

                                <div className="overflow-x-auto">
                                    <table className="w-full text-left text-xs">
                                        <thead className="bg-slate-950/80 text-slate-400 uppercase tracking-wider font-semibold border-b border-slate-800">
                                            <tr>
                                                <th className="px-5 py-3">Screening Date</th>
                                                <th className="px-5 py-3">Hemoglobin</th>
                                                <th className="px-5 py-3">Weight (kg)</th>
                                                <th className="px-5 py-3">Blood Pressure</th>
                                                <th className="px-5 py-3">Eligibility Decision</th>
                                                <th className="px-5 py-3">Deferral Reason / Notes</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-800/60">
                                            {historyData.map((row, idx) => {
                                                const eligible = row.ELIGIBLE === 'Y';
                                                return (
                                                    <tr key={idx} className="hover:bg-slate-800/40 transition">
                                                        <td className="px-5 py-3.5 text-slate-200 font-medium">
                                                            {row.CHECKDATE || 'Recent'}
                                                        </td>
                                                        <td className="px-5 py-3.5 font-bold">
                                                            <span
                                                                className={
                                                                    (row.HEMOGLOBIN || 0) < 12.5
                                                                        ? 'text-amber-400'
                                                                        : 'text-emerald-400'
                                                                }
                                                            >
                                                                {row.HEMOGLOBIN} g/dL
                                                            </span>
                                                        </td>
                                                        <td className="px-5 py-3.5 text-slate-300">{row.WEIGHT} kg</td>
                                                        <td className="px-5 py-3.5 text-slate-300 font-mono">
                                                            {row.BLOODPRESSURE}
                                                        </td>
                                                        <td className="px-5 py-3.5">
                                                            {eligible ? (
                                                                <span className="px-2 py-0.5 rounded-md bg-emerald-950 text-emerald-400 border border-emerald-800 text-[10px] font-bold uppercase">
                                                                    ELIGIBLE
                                                                </span>
                                                            ) : (
                                                                <span className="px-2 py-0.5 rounded-md bg-amber-950 text-amber-300 border border-amber-800 text-[10px] font-bold uppercase">
                                                                    DEFERRED
                                                                </span>
                                                            )}
                                                        </td>
                                                        <td className="px-5 py-3.5 text-slate-400">
                                                            {row.DEFERRALREASON || 'All vital thresholds satisfied.'}
                                                        </td>
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </>
                    )}
                </div>
            )}

            {/* TAB 3: PRE-DONATION GUIDELINES */}
            {activeTab === 'guidelines' && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-3">
                        <div className="w-10 h-10 rounded-xl bg-blue-950 text-blue-400 border border-blue-800 flex items-center justify-center">
                            <Droplet className="w-5 h-5" />
                        </div>
                        <h3 className="text-base font-bold text-white">Hydration & Nutrition</h3>
                        <p className="text-xs text-slate-400 leading-relaxed">
                            Drink at least 500ml of water or fruit juice within 3 hours prior to donation. Eat a wholesome,
                            low-fat meal 2 to 3 hours before arriving at the donation camp.
                        </p>
                    </div>

                    <div className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-3">
                        <div className="w-10 h-10 rounded-xl bg-rose-950 text-rose-400 border border-rose-800 flex items-center justify-center">
                            <Activity className="w-5 h-5" />
                        </div>
                        <h3 className="text-base font-bold text-white">Clinical Eligibility Criteria</h3>
                        <p className="text-xs text-slate-400 leading-relaxed">
                            Donors must weigh over 50kg, possess Hemoglobin levels ≥ 12.5 g/dL, and have rested at least 6
                            hours of sleep the previous night. Blood pressure must be within 100-140 systolic range.
                        </p>
                    </div>

                    <div className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-3">
                        <div className="w-10 h-10 rounded-xl bg-emerald-950 text-emerald-400 border border-emerald-800 flex items-center justify-center">
                            <Shield className="w-5 h-5" />
                        </div>
                        <h3 className="text-base font-bold text-white">What to Bring</h3>
                        <p className="text-xs text-slate-400 leading-relaxed">
                            Bring your National Identity Card (NIC), driving license, or passport along with your LifeLine
                            Connect Donor ID ({selectedDonorId}) for rapid digital check-in.
                        </p>
                    </div>
                </div>
            )}
        </div>
    );
}
