'use client';

import React, { useState, useEffect } from 'react';
import {
    Calendar,
    MapPin,
    User,
    Star,
    Clock,
    MessageSquare,
    Send,
    Users,
    Award,
    Shield,
    CheckCircle2,
    Sparkles,
    Briefcase,
    PlusCircle,
    X,
    Building2,
    Target,
    AlertCircle
} from 'lucide-react';

interface Camp {
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

interface ReviewItem {
    _id: string;
    campId: number;
    donorName: string;
    rating: number;
    feedback: string;
    waitingTimeMinutes: number;
    createdAt: string;
}

interface TopRatedCamp {
    campId: number;
    averageRating: number;
    totalReviews: number;
    averageWaitTime: number;
}

interface CampStaffMember {
    CAMPID: number;
    ASSIGNEDROLE: string;
    ASSIGNEDDATE: string;
    STAFFID: number;
    STAFFNAME: string;
    PRIMARYROLE: string;
    CONTACT: string;
    EMAIL: string;
}

interface CampVolunteerMember {
    CAMPID: number;
    ASSIGNEDROLE: string;
    ASSIGNEDDATE: string;
    VOLUNTEERID: number;
    VOLUNTEERNAME: string;
    CONTACT: string;
    SKILLS: string;
}

interface CampRoster {
    staff: CampStaffMember[];
    volunteers: CampVolunteerMember[];
}

interface VenueOption {
    VENUEID: number;
    NAME: string;
    CITY: string;
    ADDRESS: string;
    CAPACITY?: number;
}

interface OrganizerOption {
    STAFFID: number;
    NAME: string;
    ROLE: string;
}

export default function CampsPage() {
    const [camps, setCamps] = useState<Camp[]>([]);
    const [venues, setVenues] = useState<VenueOption[]>([]);
    const [organizers, setOrganizers] = useState<OrganizerOption[]>([]);
    const [topRated, setTopRated] = useState<TopRatedCamp[]>([]);
    const [reviewsByCamp, setReviewsByCamp] = useState<Record<number, ReviewItem[]>>({});
    const [rosterByCamp, setRosterByCamp] = useState<Record<number, CampRoster>>({});
    const [activeTabByCamp, setActiveTabByCamp] = useState<Record<number, 'reviews' | 'roster' | null>>({});
    const [loading, setLoading] = useState(true);

    // Review form state
    const [donorName, setDonorName] = useState('');
    const [rating, setRating] = useState('5');
    const [feedback, setFeedback] = useState('');
    const [waitingTime, setWaitingTime] = useState('15');
    const [submitting, setSubmitting] = useState(false);

    // Schedule Camp Modal State
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [campName, setCampName] = useState('');
    const [selectedVenueId, setSelectedVenueId] = useState('');
    const [selectedOrganizerId, setSelectedOrganizerId] = useState('');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [targetUnits, setTargetUnits] = useState('50');
    const [campStatus, setCampStatus] = useState('PLANNED');
    const [scheduling, setScheduling] = useState(false);
    const [scheduleBanner, setScheduleBanner] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

    // Venue Modal State
    const [showVenueModal, setShowVenueModal] = useState(false);
    const [venueName, setVenueName] = useState('');
    const [venueAddress, setVenueAddress] = useState('');
    const [venueCity, setVenueCity] = useState('');
    const [venueCapacity, setVenueCapacity] = useState('200');
    const [venueContact, setVenueContact] = useState('');
    const [savingVenue, setSavingVenue] = useState(false);
    const [venueBanner, setVenueBanner] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

    // Organizer (Staff) Modal State
    const [showStaffModal, setShowStaffModal] = useState(false);
    const [staffName, setStaffName] = useState('');
    const [staffRole, setStaffRole] = useState('Medical Officer');
    const [staffContact, setStaffContact] = useState('');
    const [staffEmail, setStaffEmail] = useState('');
    const [savingStaff, setSavingStaff] = useState(false);
    const [staffBanner, setStaffBanner] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

    const fetchCamps = async () => {
        try {
            setLoading(true);
            const [campsRes, topRes] = await Promise.all([
                fetch('/api/camps'),
                fetch('/api/nosql/reviews/top-rated'),
            ]);

            const campsJson = await campsRes.json();
            const topJson = await topRes.json();

            if (campsJson.success) {
                setCamps(campsJson.data || []);
                setVenues(campsJson.venues || []);
                setOrganizers(campsJson.organizers || []);
            }
            if (topJson.success) setTopRated(topJson.data || []);
        } catch (err) {
            console.error('Failed to load camps:', err);
        } finally {
            setLoading(false);
        }
    };

    const openCreateModal = () => {
        const today = new Date().toISOString().split('T')[0];
        setCampName('');
        setSelectedVenueId(venues.length > 0 ? String(venues[0].VENUEID) : '');
        setSelectedOrganizerId(organizers.length > 0 ? String(organizers[0].STAFFID) : '');
        setStartDate(today);
        setEndDate(today);
        setTargetUnits('50');
        setCampStatus('PLANNED');
        setScheduleBanner(null);
        setShowCreateModal(true);
    };

    const handleScheduleCamp = async (e: React.FormEvent) => {
        e.preventDefault();
        setScheduling(true);
        setScheduleBanner(null);

        if (new Date(endDate) < new Date(startDate)) {
            setScheduleBanner({
                type: 'error',
                message: 'End Date cannot be earlier than Start Date (enforced by CHK_CAMP_DATES).',
            });
            setScheduling(false);
            return;
        }

        try {
            const res = await fetch('/api/camps', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: campName,
                    venueId: selectedVenueId,
                    organizerId: selectedOrganizerId,
                    startDate,
                    endDate,
                    targetUnits,
                    status: campStatus,
                }),
            });

            const json = await res.json();
            if (json.success) {
                setScheduleBanner({ type: 'success', message: json.message });
                await fetchCamps();
                setTimeout(() => {
                    setShowCreateModal(false);
                }, 1400);
            } else {
                setScheduleBanner({ type: 'error', message: json.error || 'Failed to schedule camp.' });
            }
        } catch (err: any) {
            setScheduleBanner({ type: 'error', message: err.message || 'Network error scheduling camp.' });
        } finally {
            setScheduling(false);
        }
    };

    const handleAddVenue = async (e: React.FormEvent) => {
        e.preventDefault();
        setSavingVenue(true);
        setVenueBanner(null);
        try {
            const res = await fetch('/api/venues', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: venueName,
                    address: venueAddress,
                    city: venueCity,
                    capacity: venueCapacity,
                    contact: venueContact,
                }),
            });
            const json = await res.json();
            if (json.success) {
                setVenueBanner({ type: 'success', message: json.message });
                setVenues((prev) => [...prev, json.venue]);
                setSelectedVenueId(String(json.venue.VENUEID));
                setTimeout(() => {
                    setShowVenueModal(false);
                    setVenueName('');
                    setVenueAddress('');
                    setVenueCity('');
                    setVenueCapacity('200');
                    setVenueContact('');
                    setVenueBanner(null);
                }, 1000);
            } else {
                setVenueBanner({ type: 'error', message: json.error || 'Failed to add venue.' });
            }
        } catch (err: any) {
            setVenueBanner({ type: 'error', message: err.message || 'Network error.' });
        } finally {
            setSavingVenue(false);
        }
    };

    const handleAddStaff = async (e: React.FormEvent) => {
        e.preventDefault();
        setSavingStaff(true);
        setStaffBanner(null);
        try {
            const res = await fetch('/api/staff', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: staffName,
                    role: staffRole,
                    contact: staffContact,
                    email: staffEmail,
                }),
            });
            const json = await res.json();
            if (json.success) {
                setStaffBanner({ type: 'success', message: json.message });
                setOrganizers((prev) => [...prev, json.staff]);
                setSelectedOrganizerId(String(json.staff.STAFFID));
                setTimeout(() => {
                    setShowStaffModal(false);
                    setStaffName('');
                    setStaffRole('Medical Officer');
                    setStaffContact('');
                    setStaffEmail('');
                    setStaffBanner(null);
                }, 1000);
            } else {
                setStaffBanner({ type: 'error', message: json.error || 'Failed to add staff member.' });
            }
        } catch (err: any) {
            setStaffBanner({ type: 'error', message: err.message || 'Network error.' });
        } finally {
            setSavingStaff(false);
        }
    };

    const fetchReviewsForCamp = async (campId: number) => {
        try {
            const res = await fetch(`/api/nosql/reviews?campId=${campId}`);
            const json = await res.json();
            if (json.success) {
                setReviewsByCamp((prev) => ({ ...prev, [campId]: json.data || [] }));
            }
        } catch (err) {
            console.error('Failed to load reviews:', err);
        }
    };

    const fetchRosterForCamp = async (campId: number) => {
        try {
            const res = await fetch(`/api/camps/${campId}/roster`);
            const json = await res.json();
            if (json.success) {
                setRosterByCamp((prev) => ({
                    ...prev,
                    [campId]: { staff: json.staff || [], volunteers: json.volunteers || [] },
                }));
            }
        } catch (err) {
            console.error('Failed to load roster:', err);
        }
    };

    useEffect(() => {
        fetchCamps();
    }, []);

    const toggleTab = (campId: number, tab: 'reviews' | 'roster') => {
        setActiveTabByCamp((prev) => {
            const current = prev[campId];
            const nextTab = current === tab ? null : tab;
            return { ...prev, [campId]: nextTab };
        });

        if (tab === 'reviews' && !reviewsByCamp[campId]) {
            fetchReviewsForCamp(campId);
        } else if (tab === 'roster' && !rosterByCamp[campId]) {
            fetchRosterForCamp(campId);
        }
    };

    const handleSubmitReview = async (e: React.FormEvent, campId: number) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            const res = await fetch('/api/nosql/reviews', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    campId,
                    donorName,
                    rating: parseInt(rating, 10),
                    feedback,
                    waitingTimeMinutes: parseInt(waitingTime, 10),
                }),
            });

            if (res.ok) {
                setDonorName('');
                setFeedback('');
                fetchReviewsForCamp(campId);
                // Also refresh top rated
                const topRes = await fetch('/api/nosql/reviews/top-rated');
                const topJson = await topRes.json();
                if (topJson.success) setTopRated(topJson.data || []);
            }
        } catch (err) {
            console.error('Failed to submit review:', err);
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="max-w-7xl mx-auto p-6 md:p-10">
            {/* Header */}
            <div className="border-b border-slate-800 pb-6 mb-8">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-3xl font-bold text-white flex items-center gap-3">
                            <Calendar className="h-8 w-8 text-rose-500" />
                            Donation Camps, Rosters & Community Feedback
                        </h1>
                        <p className="text-slate-400 text-sm mt-1">
                            Oracle camp schedules & personnel assignments integrated with MongoDB donor satisfaction analytics
                        </p>
                    </div>
                    <div className="flex flex-wrap items-center gap-2.5">
                        <button
                            onClick={() => {
                                setVenueBanner(null);
                                setShowVenueModal(true);
                            }}
                            className="flex items-center gap-1.5 bg-slate-800/90 hover:bg-slate-700 text-slate-200 text-xs md:text-sm font-semibold px-3.5 py-2.5 rounded-xl border border-slate-700 transition active:scale-95 shadow"
                        >
                            <Building2 className="h-4 w-4 text-rose-400" />
                            + Host Venue
                        </button>
                        <button
                            onClick={() => {
                                setStaffBanner(null);
                                setShowStaffModal(true);
                            }}
                            className="flex items-center gap-1.5 bg-slate-800/90 hover:bg-slate-700 text-slate-200 text-xs md:text-sm font-semibold px-3.5 py-2.5 rounded-xl border border-slate-700 transition active:scale-95 shadow"
                        >
                            <User className="h-4 w-4 text-rose-400" />
                            + Organizer
                        </button>
                        <button
                            onClick={openCreateModal}
                            className="flex items-center gap-2 bg-gradient-to-r from-rose-600 to-rose-700 hover:from-rose-500 hover:to-rose-600 text-white text-xs md:text-sm font-semibold px-4 py-2.5 rounded-xl shadow-lg shadow-rose-950/50 border border-rose-500/30 transition transform active:scale-95"
                        >
                            <PlusCircle className="h-4 w-4" />
                            Schedule Camp
                        </button>
                    </div>
                </div>
            </div>

            {/* MongoDB Top-Rated Camps Leaderboard */}
            {topRated.length > 0 && (
                <div className="mb-10 bg-gradient-to-r from-rose-950/40 via-slate-900 to-amber-950/30 border border-rose-900/40 rounded-2xl p-6 shadow-xl">
                    <div className="flex items-center gap-2 mb-4">
                        <Award className="h-5 w-5 text-amber-400" />
                        <h2 className="text-lg font-bold text-white tracking-wide">
                            Top-Rated Donation Camps (MongoDB Aggregation Pipeline)
                        </h2>
                        <span className="ml-auto text-xs font-semibold px-2.5 py-1 bg-amber-500/20 text-amber-300 border border-amber-500/30 rounded-full flex items-center gap-1">
                            <Sparkles className="h-3 w-3" /> Live Feedback Leaderboard
                        </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                        {topRated.map((item, idx) => {
                            const matchedCamp = camps.find((c) => c.CAMPID === item.campId);
                            return (
                                <div
                                    key={item.campId}
                                    className="bg-slate-950/80 border border-slate-800 rounded-xl p-4 flex flex-col justify-between"
                                >
                                    <div>
                                        <div className="flex items-center justify-between mb-2">
                                            <span className="text-xs font-bold px-2 py-0.5 rounded-md bg-amber-950 text-amber-300 border border-amber-800">
                                                Rank #{idx + 1}
                                            </span>
                                            <div className="flex items-center text-amber-400 gap-1 font-bold text-sm">
                                                <Star className="h-4 w-4 fill-amber-400" />
                                                {item.averageRating.toFixed(1)} / 5.0
                                            </div>
                                        </div>
                                        <h3 className="text-sm font-semibold text-white truncate">
                                            {matchedCamp?.CAMPNAME || `Camp #${item.campId}`}
                                        </h3>
                                        <p className="text-xs text-slate-400 flex items-center gap-1 mt-1">
                                            <MapPin className="h-3 w-3 text-rose-500" />
                                            {matchedCamp ? `${matchedCamp.VENUENAME} (${matchedCamp.CITY})` : 'Registered Venue'}
                                        </p>
                                    </div>
                                    <div className="mt-3 pt-3 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400">
                                        <span>{item.totalReviews} donor review{item.totalReviews > 1 ? 's' : ''}</span>
                                        <span className="flex items-center gap-1 text-emerald-400 font-medium">
                                            <Clock className="h-3 w-3" /> ~{item.averageWaitTime} min wait
                                        </span>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* Camps List */}
            {loading ? (
                <div className="py-20 text-center text-slate-400">Loading donation camps from Oracle...</div>
            ) : camps.length === 0 ? (
                <div className="py-20 text-center text-slate-500">No campaigns found in Oracle database.</div>
            ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {camps.map((camp) => {
                        const target = camp.TARGETUNITS || 1;
                        const collected = camp.UNITSCOLLECTED || 0;
                        const pct = Math.min(100, Math.round((collected / target) * 100));
                        const activeTab = activeTabByCamp[camp.CAMPID] || null;
                        const reviews = reviewsByCamp[camp.CAMPID] || [];
                        const roster = rosterByCamp[camp.CAMPID] || { staff: [], volunteers: [] };

                        return (
                            <div
                                key={camp.CAMPID}
                                className="bg-slate-900 border border-slate-800 rounded-xl p-6 flex flex-col justify-between shadow-lg"
                            >
                                <div>
                                    <div className="flex items-start justify-between gap-2 mb-2">
                                        <div>
                                            <span
                                                className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider ${camp.STATUS === 'COMPLETED'
                                                    ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                                                    : camp.STATUS === 'ACTIVE'
                                                        ? 'bg-rose-950 text-rose-400 border border-rose-800 animate-pulse'
                                                        : 'bg-slate-800 text-slate-300'
                                                    }`}
                                            >
                                                {camp.STATUS}
                                            </span>
                                            <h2 className="text-xl font-bold text-white mt-1">{camp.CAMPNAME}</h2>
                                        </div>
                                        <span className="text-xs text-slate-400 font-mono">ID: #{camp.CAMPID}</span>
                                    </div>

                                    <div className="space-y-1.5 text-xs text-slate-400 mt-3">
                                        <p className="flex items-center gap-2">
                                            <MapPin className="h-3.5 w-3.5 text-rose-500" />
                                            {camp.VENUENAME}, {camp.ADDRESS} ({camp.CITY})
                                        </p>
                                        <p className="flex items-center gap-2">
                                            <User className="h-3.5 w-3.5 text-slate-500" />
                                            Lead Organizer: {camp.ORGANIZERNAME}
                                        </p>
                                        <p className="flex items-center gap-2">
                                            <Calendar className="h-3.5 w-3.5 text-slate-500" />
                                            {camp.STARTDATE} to {camp.ENDDATE}
                                        </p>
                                    </div>

                                    {/* Target Achievement Bar */}
                                    <div className="mt-5 p-3.5 bg-slate-950/70 border border-slate-800/80 rounded-lg">
                                        <div className="flex justify-between text-xs mb-1.5 font-medium">
                                            <span className="text-slate-400">Target Collection Quota</span>
                                            <span className="text-rose-400 font-bold">
                                                {collected} / {target} units ({pct}%)
                                            </span>
                                        </div>
                                        <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden">
                                            <div
                                                className="bg-rose-600 h-2 rounded-full transition-all duration-500"
                                                style={{ width: `${pct}%` }}
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* Multi-Database Action Tabs */}
                                <div className="mt-5 pt-4 border-t border-slate-800 flex flex-wrap items-center justify-between gap-2">
                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => toggleTab(camp.CAMPID, 'roster')}
                                            className={`flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg border transition ${activeTab === 'roster'
                                                ? 'bg-rose-600 text-white border-rose-500 shadow'
                                                : 'bg-slate-950 text-slate-300 border-slate-800 hover:text-white hover:border-slate-700'
                                                }`}
                                        >
                                            <Users className="h-3.5 w-3.5" />
                                            Personnel Roster (Oracle)
                                        </button>

                                        <button
                                            onClick={() => toggleTab(camp.CAMPID, 'reviews')}
                                            className={`flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg border transition ${activeTab === 'reviews'
                                                ? 'bg-amber-600 text-white border-amber-500 shadow'
                                                : 'bg-slate-950 text-slate-300 border-slate-800 hover:text-white hover:border-slate-700'
                                                }`}
                                        >
                                            <MessageSquare className="h-3.5 w-3.5" />
                                            Donor Reviews (MongoDB)
                                        </button>
                                    </div>

                                    <span className="text-xs text-slate-500">
                                        {reviewsByCamp[camp.CAMPID] ? `${reviews.length} reviews` : ''}
                                    </span>
                                </div>

                                {/* ROSTER DRAWER (Oracle Personnel) */}
                                {activeTab === 'roster' && (
                                    <div className="mt-4 pt-4 border-t border-slate-800/60 space-y-4">
                                        <div>
                                            <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-1.5 mb-2">
                                                <Briefcase className="h-3.5 w-3.5 text-rose-400" />
                                                Clinical Staff Assigned ({roster.staff.length})
                                            </h4>
                                            {roster.staff.length === 0 ? (
                                                <p className="text-xs text-slate-500 py-1">No medical staff explicitly rostered.</p>
                                            ) : (
                                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                                    {roster.staff.map((s) => (
                                                        <div key={s.STAFFID} className="bg-slate-950/70 border border-slate-800/80 rounded-lg p-2.5 text-xs">
                                                            <div className="font-semibold text-white">{s.STAFFNAME}</div>
                                                            <div className="text-rose-400 text-[11px] font-medium">{s.ASSIGNEDROLE || s.PRIMARYROLE}</div>
                                                            <div className="text-slate-400 text-[11px] mt-1">{s.CONTACT} • {s.EMAIL}</div>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>

                                        <div>
                                            <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-1.5 mb-2">
                                                <Shield className="h-3.5 w-3.5 text-emerald-400" />
                                                Volunteers Assigned ({roster.volunteers.length})
                                            </h4>
                                            {roster.volunteers.length === 0 ? (
                                                <p className="text-xs text-slate-500 py-1">No volunteers assigned to this campaign yet.</p>
                                            ) : (
                                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                                    {roster.volunteers.map((v) => (
                                                        <div key={v.VOLUNTEERID} className="bg-slate-950/70 border border-slate-800/80 rounded-lg p-2.5 text-xs">
                                                            <div className="font-semibold text-white">{v.VOLUNTEERNAME}</div>
                                                            <div className="text-emerald-400 text-[11px] font-medium">{v.ASSIGNEDROLE}</div>
                                                            <div className="text-slate-400 text-[11px] mt-1">Skills: {v.SKILLS || 'Logistics'}</div>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}

                                {/* REVIEWS DRAWER (MongoDB Feedback) */}
                                {activeTab === 'reviews' && (
                                    <div className="mt-4 pt-4 border-t border-slate-800/60 space-y-4">
                                        {/* Review Submission Form */}
                                        <form
                                            onSubmit={(e) => handleSubmitReview(e, camp.CAMPID)}
                                            className="bg-slate-950 p-4 rounded-lg border border-slate-800 text-xs space-y-3"
                                        >
                                            <h4 className="font-semibold text-slate-200 flex items-center gap-1.5">
                                                <Star className="h-3.5 w-3.5 text-amber-400" />
                                                Leave Experience Feedback
                                            </h4>
                                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                                                <input
                                                    required
                                                    type="text"
                                                    placeholder="Your Name"
                                                    value={donorName}
                                                    onChange={(e) => setDonorName(e.target.value)}
                                                    className="bg-slate-900 border border-slate-800 rounded px-2.5 py-1.5 text-slate-200"
                                                />
                                                <select
                                                    value={rating}
                                                    onChange={(e) => setRating(e.target.value)}
                                                    className="bg-slate-900 border border-slate-800 rounded px-2.5 py-1.5 text-slate-200"
                                                >
                                                    <option value="5">★★★★★ (5 Stars)</option>
                                                    <option value="4">★★★★☆ (4 Stars)</option>
                                                    <option value="3">★★★☆☆ (3 Stars)</option>
                                                    <option value="2">★★☆☆☆ (2 Stars)</option>
                                                    <option value="1">★☆☆☆☆ (1 Star)</option>
                                                </select>
                                                <input
                                                    type="number"
                                                    placeholder="Wait time (min)"
                                                    value={waitingTime}
                                                    onChange={(e) => setWaitingTime(e.target.value)}
                                                    className="bg-slate-900 border border-slate-800 rounded px-2.5 py-1.5 text-slate-200"
                                                />
                                            </div>
                                            <div className="flex gap-2">
                                                <input
                                                    required
                                                    type="text"
                                                    placeholder="Share your experience (staff friendliness, hygiene, wait time)..."
                                                    value={feedback}
                                                    onChange={(e) => setFeedback(e.target.value)}
                                                    className="flex-1 bg-slate-900 border border-slate-800 rounded px-2.5 py-1.5 text-slate-200"
                                                />
                                                <button
                                                    type="submit"
                                                    disabled={submitting}
                                                    className="bg-rose-600 hover:bg-rose-700 disabled:opacity-50 text-white font-semibold px-3 py-1.5 rounded transition flex items-center gap-1"
                                                >
                                                    <Send className="h-3 w-3" />
                                                    Post
                                                </button>
                                            </div>
                                        </form>

                                        {/* Existing Reviews List */}
                                        <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                                            {reviews.length === 0 ? (
                                                <p className="text-xs text-slate-500 py-3 text-center">
                                                    No reviews recorded yet for this drive. Be the first to review!
                                                </p>
                                            ) : (
                                                reviews.map((rev) => (
                                                    <div key={rev._id} className="p-3 bg-slate-950/60 rounded-lg border border-slate-800/80 text-xs">
                                                        <div className="flex justify-between items-center mb-1">
                                                            <div className="flex items-center gap-1.5">
                                                                <span className="font-semibold text-slate-200">{rev.donorName}</span>
                                                                <div className="flex text-amber-400">
                                                                    {Array.from({ length: rev.rating }).map((_, i) => (
                                                                        <Star key={i} className="h-3 w-3 fill-amber-400" />
                                                                    ))}
                                                                </div>
                                                            </div>
                                                            <span className="flex items-center gap-1 text-[10px] text-slate-400">
                                                                <Clock className="h-2.5 w-2.5" />
                                                                {rev.waitingTimeMinutes} min wait
                                                            </span>
                                                        </div>
                                                        <p className="text-slate-300 mt-1">{rev.feedback}</p>
                                                    </div>
                                                ))
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Schedule New Camp Modal */}
            {showCreateModal && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50 overflow-y-auto">
                    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 md:p-8 max-w-xl w-full shadow-2xl relative my-8 animate-in fade-in zoom-in duration-200">
                        <button
                            onClick={() => setShowCreateModal(false)}
                            className="absolute top-5 right-5 text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition"
                        >
                            <X className="h-5 w-5" />
                        </button>

                        <div className="flex items-center gap-3 mb-2">
                            <div className="p-2.5 rounded-xl bg-rose-950/80 border border-rose-800/80 text-rose-400">
                                <PlusCircle className="h-6 w-6" />
                            </div>
                            <div>
                                <h2 className="text-xl font-bold text-white">Schedule Donation Camp</h2>
                            </div>
                        </div>

                        {scheduleBanner && (
                            <div
                                className={`mt-4 p-3 rounded-xl border flex items-center gap-2.5 text-xs ${scheduleBanner.type === 'success'
                                    ? 'bg-emerald-950/60 border-emerald-800 text-emerald-300'
                                    : 'bg-red-950/60 border-red-800 text-red-300'
                                    }`}
                            >
                                {scheduleBanner.type === 'success' ? (
                                    <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-400" />
                                ) : (
                                    <AlertCircle className="h-4 w-4 shrink-0 text-rose-400" />
                                )}
                                <span>{scheduleBanner.message}</span>
                            </div>
                        )}

                        <form onSubmit={handleScheduleCamp} className="mt-5 space-y-4 text-xs">
                            <div>
                                <label className="block text-slate-300 mb-1.5 font-semibold">
                                    Camp Drive Name <span className="text-rose-500">*</span>
                                </label>
                                <input
                                    required
                                    type="text"
                                    placeholder="e.g. Galle Fort Youth Mobile Blood Drive 2026"
                                    value={campName}
                                    onChange={(e) => setCampName(e.target.value)}
                                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-slate-200 focus:outline-none focus:border-rose-500 transition"
                                />
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <div className="flex items-center justify-between mb-1.5">
                                        <label className="text-slate-300 font-semibold flex items-center gap-1.5">
                                            <Building2 className="h-3.5 w-3.5 text-rose-400" />
                                            Host Venue <span className="text-rose-500">*</span>
                                        </label>
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setVenueBanner(null);
                                                setShowVenueModal(true);
                                            }}
                                            className="text-[11px] text-rose-400 hover:text-rose-300 font-medium hover:underline flex items-center gap-0.5"
                                        >
                                            + Add Venue
                                        </button>
                                    </div>
                                    <select
                                        required
                                        value={selectedVenueId}
                                        onChange={(e) => setSelectedVenueId(e.target.value)}
                                        className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-slate-200 focus:outline-none focus:border-rose-500 transition"
                                    >
                                        <option value="" disabled>Select a registered venue</option>
                                        {venues.map((v) => (
                                            <option key={v.VENUEID} value={v.VENUEID}>
                                                {v.NAME} ({v.CITY}){v.CAPACITY ? ` - Cap: ${v.CAPACITY}` : ''}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div>
                                    <div className="flex items-center justify-between mb-1.5">
                                        <label className="text-slate-300 font-semibold flex items-center gap-1.5">
                                            <User className="h-3.5 w-3.5 text-rose-400" />
                                            Lead Medical Organizer <span className="text-rose-500">*</span>
                                        </label>
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setStaffBanner(null);
                                                setShowStaffModal(true);
                                            }}
                                            className="text-[11px] text-rose-400 hover:text-rose-300 font-medium hover:underline flex items-center gap-0.5"
                                        >
                                            + Add Organizer
                                        </button>
                                    </div>
                                    <select
                                        required
                                        value={selectedOrganizerId}
                                        onChange={(e) => setSelectedOrganizerId(e.target.value)}
                                        className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-slate-200 focus:outline-none focus:border-rose-500 transition"
                                    >
                                        <option value="" disabled>Select staff organizer</option>
                                        {organizers.map((s) => (
                                            <option key={s.STAFFID} value={s.STAFFID}>
                                                {s.NAME} ({s.ROLE})
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-slate-300 mb-1.5 font-semibold flex items-center gap-1.5">
                                        <Calendar className="h-3.5 w-3.5 text-slate-400" />
                                        Start Date <span className="text-rose-500">*</span>
                                    </label>
                                    <input
                                        required
                                        type="date"
                                        value={startDate}
                                        onChange={(e) => setStartDate(e.target.value)}
                                        className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-slate-200 focus:outline-none focus:border-rose-500 transition"
                                    />
                                </div>

                                <div>
                                    <label className="block text-slate-300 mb-1.5 font-semibold flex items-center gap-1.5">
                                        <Calendar className="h-3.5 w-3.5 text-slate-400" />
                                        End Date <span className="text-rose-500">*</span>
                                    </label>
                                    <input
                                        required
                                        type="date"
                                        value={endDate}
                                        onChange={(e) => setEndDate(e.target.value)}
                                        className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-slate-200 focus:outline-none focus:border-rose-500 transition"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-slate-300 mb-1.5 font-semibold flex items-center gap-1.5">
                                        <Target className="h-3.5 w-3.5 text-rose-400" />
                                        Target Quota (Units) <span className="text-rose-500">*</span>
                                    </label>
                                    <input
                                        required
                                        type="number"
                                        min="1"
                                        value={targetUnits}
                                        onChange={(e) => setTargetUnits(e.target.value)}
                                        className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-slate-200 font-mono focus:outline-none focus:border-rose-500 transition"
                                    />
                                </div>

                                <div>
                                    <label className="block text-slate-300 mb-1.5 font-semibold">
                                        Operational Status
                                    </label>
                                    <select
                                        value={campStatus}
                                        onChange={(e) => setCampStatus(e.target.value)}
                                        className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-slate-200 focus:outline-none focus:border-rose-500 transition"
                                    >
                                        <option value="PLANNED">PLANNED</option>
                                        <option value="ACTIVE">ACTIVE</option>
                                    </select>
                                </div>
                            </div>



                            <div className="flex justify-end gap-3 pt-2">
                                <button
                                    type="button"
                                    onClick={() => setShowCreateModal(false)}
                                    className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium transition"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={scheduling || !campName || !selectedVenueId || !selectedOrganizerId}
                                    className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-rose-600 to-rose-700 hover:from-rose-500 hover:to-rose-600 disabled:opacity-50 text-white font-semibold flex items-center gap-2 shadow-lg shadow-rose-950/40 transition"
                                >
                                    {scheduling ? 'Scheduling in Oracle...' : 'Schedule Camp Drive'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Add Host Venue Modal */}
            {showVenueModal && (
                <div className="fixed inset-0 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 z-[60] overflow-y-auto">
                    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 md:p-8 max-w-md w-full shadow-2xl relative my-8 animate-in fade-in zoom-in duration-200">
                        <button
                            onClick={() => setShowVenueModal(false)}
                            className="absolute top-5 right-5 text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition"
                        >
                            <X className="h-5 w-5" />
                        </button>

                        <div className="flex items-center gap-3 mb-2">
                            <div className="p-2.5 rounded-xl bg-rose-950/80 border border-rose-800/80 text-rose-400">
                                <Building2 className="h-6 w-6" />
                            </div>
                            <div>
                                <h2 className="text-lg font-bold text-white">Register Host Venue</h2>

                            </div>
                        </div>

                        {venueBanner && (
                            <div
                                className={`mt-4 p-3 rounded-xl border flex items-center gap-2.5 text-xs ${venueBanner.type === 'success'
                                        ? 'bg-emerald-950/60 border-emerald-800 text-emerald-300'
                                        : 'bg-red-950/60 border-red-800 text-red-300'
                                    }`}
                            >
                                {venueBanner.type === 'success' ? (
                                    <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-400" />
                                ) : (
                                    <AlertCircle className="h-4 w-4 shrink-0 text-rose-400" />
                                )}
                                <span>{venueBanner.message}</span>
                            </div>
                        )}

                        <form onSubmit={handleAddVenue} className="mt-4 space-y-3.5 text-xs">
                            <div>
                                <label className="block text-slate-300 mb-1 font-semibold">
                                    Venue Name <span className="text-rose-500">*</span>
                                </label>
                                <input
                                    required
                                    type="text"
                                    placeholder="e.g. St. Thomas Community Hall"
                                    value={venueName}
                                    onChange={(e) => setVenueName(e.target.value)}
                                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-slate-200 focus:outline-none focus:border-rose-500 transition"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-slate-300 mb-1 font-semibold">
                                        City <span className="text-rose-500">*</span>
                                    </label>
                                    <input
                                        required
                                        type="text"
                                        placeholder="e.g. Colombo"
                                        value={venueCity}
                                        onChange={(e) => setVenueCity(e.target.value)}
                                        className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-slate-200 focus:outline-none focus:border-rose-500 transition"
                                    />
                                </div>
                                <div>
                                    <label className="block text-slate-300 mb-1 font-semibold">
                                        Capacity (Persons)
                                    </label>
                                    <input
                                        required
                                        type="number"
                                        min="1"
                                        value={venueCapacity}
                                        onChange={(e) => setVenueCapacity(e.target.value)}
                                        className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-slate-200 font-mono focus:outline-none focus:border-rose-500 transition"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-slate-300 mb-1 font-semibold">
                                    Street Address <span className="text-rose-500">*</span>
                                </label>
                                <input
                                    required
                                    type="text"
                                    placeholder="e.g. 150 Galle Road, Kollupitiya"
                                    value={venueAddress}
                                    onChange={(e) => setVenueAddress(e.target.value)}
                                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-slate-200 focus:outline-none focus:border-rose-500 transition"
                                />
                            </div>

                            <div>
                                <label className="block text-slate-300 mb-1 font-semibold">
                                    Contact Phone <span className="text-rose-500">*</span>
                                </label>
                                <input
                                    required
                                    type="text"
                                    placeholder="e.g. +94 11 234 5678"
                                    value={venueContact}
                                    onChange={(e) => setVenueContact(e.target.value)}
                                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-slate-200 focus:outline-none focus:border-rose-500 transition"
                                />
                            </div>

                            <div className="flex justify-end gap-2.5 pt-2">
                                <button
                                    type="button"
                                    onClick={() => setShowVenueModal(false)}
                                    className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium transition"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={savingVenue || !venueName || !venueCity || !venueAddress || !venueContact}
                                    className="px-4 py-2 rounded-xl bg-gradient-to-r from-rose-600 to-rose-700 hover:from-rose-500 hover:to-rose-600 disabled:opacity-50 text-white font-semibold transition"
                                >
                                    {savingVenue ? 'Saving in Oracle...' : 'Save Host Venue'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Add Medical Organizer (Staff) Modal */}
            {showStaffModal && (
                <div className="fixed inset-0 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 z-[60] overflow-y-auto">
                    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 md:p-8 max-w-md w-full shadow-2xl relative my-8 animate-in fade-in zoom-in duration-200">
                        <button
                            onClick={() => setShowStaffModal(false)}
                            className="absolute top-5 right-5 text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition"
                        >
                            <X className="h-5 w-5" />
                        </button>

                        <div className="flex items-center gap-3 mb-2">
                            <div className="p-2.5 rounded-xl bg-rose-950/80 border border-rose-800/80 text-rose-400">
                                <User className="h-6 w-6" />
                            </div>
                            <div>
                                <h2 className="text-lg font-bold text-white">Register Medical Organizer</h2>
                            </div>
                        </div>

                        {staffBanner && (
                            <div
                                className={`mt-4 p-3 rounded-xl border flex items-center gap-2.5 text-xs ${staffBanner.type === 'success'
                                        ? 'bg-emerald-950/60 border-emerald-800 text-emerald-300'
                                        : 'bg-red-950/60 border-red-800 text-red-300'
                                    }`}
                            >
                                {staffBanner.type === 'success' ? (
                                    <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-400" />
                                ) : (
                                    <AlertCircle className="h-4 w-4 shrink-0 text-rose-400" />
                                )}
                                <span>{staffBanner.message}</span>
                            </div>
                        )}

                        <form onSubmit={handleAddStaff} className="mt-4 space-y-3.5 text-xs">
                            <div>
                                <label className="block text-slate-300 mb-1 font-semibold">
                                    Full Name <span className="text-rose-500">*</span>
                                </label>
                                <input
                                    required
                                    type="text"
                                    placeholder="e.g. Dr. Shanaka Wickramasinghe"
                                    value={staffName}
                                    onChange={(e) => setStaffName(e.target.value)}
                                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-slate-200 focus:outline-none focus:border-rose-500 transition"
                                />
                            </div>

                            <div>
                                <label className="block text-slate-300 mb-1 font-semibold">
                                    Medical Role <span className="text-rose-500">*</span>
                                </label>
                                <select
                                    value={staffRole}
                                    onChange={(e) => setStaffRole(e.target.value)}
                                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-slate-200 focus:outline-none focus:border-rose-500 transition"
                                >
                                    <option value="Medical Officer">Medical Officer</option>
                                    <option value="Head Phlebotomist">Head Phlebotomist</option>
                                    <option value="Medical Supervisor">Medical Supervisor</option>
                                    <option value="Camp Coordinator">Camp Coordinator</option>
                                    <option value="Consultant Hematologist">Consultant Hematologist</option>
                                    <option value="Clinical Lead">Clinical Lead</option>
                                </select>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-slate-300 mb-1 font-semibold">
                                        Contact Phone <span className="text-rose-500">*</span>
                                    </label>
                                    <input
                                        required
                                        type="text"
                                        placeholder="e.g. +94 77 123 4567"
                                        value={staffContact}
                                        onChange={(e) => setStaffContact(e.target.value)}
                                        className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-slate-200 focus:outline-none focus:border-rose-500 transition"
                                    />
                                </div>
                                <div>
                                    <label className="block text-slate-300 mb-1 font-semibold">
                                        Email Address <span className="text-rose-500">*</span>
                                    </label>
                                    <input
                                        required
                                        type="email"
                                        placeholder="e.g. shanaka@lifeline.lk"
                                        value={staffEmail}
                                        onChange={(e) => setStaffEmail(e.target.value)}
                                        className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-slate-200 focus:outline-none focus:border-rose-500 transition"
                                    />
                                </div>
                            </div>

                            <div className="flex justify-end gap-2.5 pt-2">
                                <button
                                    type="button"
                                    onClick={() => setShowStaffModal(false)}
                                    className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium transition"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={savingStaff || !staffName || !staffContact || !staffEmail}
                                    className="px-4 py-2 rounded-xl bg-gradient-to-r from-rose-600 to-rose-700 hover:from-rose-500 hover:to-rose-600 disabled:opacity-50 text-white font-semibold transition"
                                >
                                    {savingStaff ? 'Saving in Oracle...' : 'Save Medical Organizer'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}