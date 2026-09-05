'use client';

import React, { useState, useEffect } from 'react';
import { Calendar, MapPin, User, Star, Clock, MessageSquare, Send, CheckCircle2 } from 'lucide-react';

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

export default function CampsPage() {
    const [camps, setCamps] = useState<Camp[]>([]);
    const [reviewsByCamp, setReviewsByCamp] = useState<Record<number, ReviewItem[]>>({});
    const [selectedCampId, setSelectedCampId] = useState<number | null>(null);
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
            const res = await fetch('/api/camps');
            const json = await res.json();
            if (json.success) {
                setCamps(json.data || []);
            }
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

    useEffect(() => {
        fetchCamps();
    }, []);

    const handleOpenReviews = (campId: number) => {
        if (selectedCampId === campId) {
            setSelectedCampId(null);
        } else {
            setSelectedCampId(campId);
            if (!reviewsByCamp[campId]) {
                fetchReviewsForCamp(campId);
            }
        }
    };

    const handleSubmitReview = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedCampId) return;

        setSubmitting(true);
        try {
            const res = await fetch('/api/nosql/reviews', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    campId: selectedCampId,
                    donorName,
                    rating: parseInt(rating, 10),
                    feedback,
                    waitingTimeMinutes: parseInt(waitingTime, 10),
                }),
            });

            if (res.ok) {
                setDonorName('');
                setFeedback('');
                fetchReviewsForCamp(selectedCampId);
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
                <h1 className="text-3xl font-bold text-white flex items-center gap-3">
                    <Calendar className="h-8 w-8 text-rose-500" />
                    Donation Camps & Community Feedback
                </h1>
                <p className="text-slate-400 text-sm mt-1">
                    Relational schedule execution mapped with MongoDB donor reviews & operational ratings
                </p>
            </div>

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
                        const isDrawerOpen = selectedCampId === camp.CAMPID;
                        const reviews = reviewsByCamp[camp.CAMPID] || [];

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
                                            Organizer: {camp.ORGANIZERNAME}
                                        </p>
                                        <p className="flex items-center gap-2">
                                            <Calendar className="h-3.5 w-3.5 text-slate-500" />
                                            {camp.STARTDATE} to {camp.ENDDATE}
                                        </p>
                                    </div>

                                    {/* Target Achievement Bar */}
                                    <div className="mt-5 p-3.5 bg-slate-950/70 border border-slate-800/80 rounded-lg">
                                        <div className="flex justify-between text-xs mb-1.5 font-medium">
                                            <span className="text-slate-400">Target Achievement</span>
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

                                {/* Review Toggle Button */}
                                <div className="mt-5 pt-4 border-t border-slate-800 flex items-center justify-between">
                                    <button
                                        onClick={() => handleOpenReviews(camp.CAMPID)}
                                        className="flex items-center gap-2 text-xs font-semibold text-rose-400 hover:text-rose-300 transition"
                                    >
                                        <MessageSquare className="h-4 w-4" />
                                        {isDrawerOpen ? 'Hide Feedback Drawer' : 'Donor Reviews & Ratings (MongoDB)'}
                                    </button>
                                    <span className="text-xs text-slate-500">
                                        {reviewsByCamp[camp.CAMPID] ? `${reviews.length} reviews` : ''}
                                    </span>
                                </div>

                                {/* Reviews Expansion Drawer */}
                                {isDrawerOpen && (
                                    <div className="mt-4 pt-4 border-t border-slate-800/60 space-y-4">
                                        {/* Review Submission Form */}
                                        <form onSubmit={handleSubmitReview} className="bg-slate-950 p-4 rounded-lg border border-slate-800 text-xs space-y-3">
                                            <h4 className="font-semibold text-slate-200">Leave Experience Feedback</h4>
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
                                                <p className="text-xs text-slate-500 py-3 text-center">No reviews recorded yet for this drive.</p>
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