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
    Briefcase
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

export default function CampsPage() {
    const [camps, setCamps] = useState<Camp[]>([]);
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

    const fetchCamps = async () => {
        try {
            setLoading(true);
            const [campsRes, topRes] = await Promise.all([
                fetch('/api/camps'),
                fetch('/api/nosql/reviews/top-rated'),
            ]);

            const campsJson = await campsRes.json();
            const topJson = await topRes.json();

            if (campsJson.success) setCamps(campsJson.data || []);
            if (topJson.success) setTopRated(topJson.data || []);
        } catch (err) {
            console.error('Failed to load camps:', err);
        } finally {
            setLoading(false);
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
                                                className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider ${
                                                    camp.STATUS === 'COMPLETED'
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
                                            className={`flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg border transition ${
                                                activeTab === 'roster'
                                                    ? 'bg-rose-600 text-white border-rose-500 shadow'
                                                    : 'bg-slate-950 text-slate-300 border-slate-800 hover:text-white hover:border-slate-700'
                                            }`}
                                        >
                                            <Users className="h-3.5 w-3.5" />
                                            Personnel Roster (Oracle)
                                        </button>

                                        <button
                                            onClick={() => toggleTab(camp.CAMPID, 'reviews')}
                                            className={`flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg border transition ${
                                                activeTab === 'reviews'
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
        </div>
    );
}