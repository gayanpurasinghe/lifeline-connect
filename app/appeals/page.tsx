'use client';

import React, { useState, useEffect } from 'react';
import { AlertCircle, Plus, Send, MessageSquare, MapPin, Droplet, Clock } from 'lucide-react';

interface Comment {
    _id?: string;
    authorName: string;
    contactNumber: string;
    message: string;
    postedAt: string;
}

interface Appeal {
    _id: string;
    hospitalName: string;
    bloodGroup: string;
    unitsNeeded: number;
    urgency: 'CRITICAL' | 'URGENT' | 'STANDARD';
    location: string;
    isActive: boolean;
    comments: Comment[];
    createdAt: string;
}

export default function AppealsPage() {
    const [appeals, setAppeals] = useState<Appeal[]>([]);
    const [loading, setLoading] = useState(true);
    const [filterGroup, setFilterGroup] = useState('');
    const [keyword, setKeyword] = useState('');

    // Form State
    const [showModal, setShowModal] = useState(false);
    const [hospitalName, setHospitalName] = useState('');
    const [bloodGroup, setBloodGroup] = useState('O+');
    const [unitsNeeded, setUnitsNeeded] = useState('2');
    const [urgency, setUrgency] = useState<'CRITICAL' | 'URGENT' | 'STANDARD'>('URGENT');
    const [location, setLocation] = useState('');

    // Comment Box State per appeal
    const [commentInputs, setCommentInputs] = useState<Record<string, { author: string; phone: string; msg: string }>>({});

    const loadAppeals = async () => {
        try {
            setLoading(true);
            const url = `/api/nosql/appeals?bloodGroup=${filterGroup}&keyword=${encodeURIComponent(keyword)}`;
            const res = await fetch(url);
            const json = await res.json();
            if (json.success) setAppeals(json.data || []);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadAppeals();
    }, [filterGroup, keyword]);

    const handleCreateAppeal = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const res = await fetch('/api/nosql/appeals', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    hospitalName,
                    bloodGroup,
                    unitsNeeded: parseInt(unitsNeeded, 10),
                    urgency,
                    location,
                }),
            });
            if (res.ok) {
                setShowModal(false);
                setHospitalName('');
                setLocation('');
                loadAppeals();
            }
        } catch (err) {
            console.error(err);
        }
    };

    const handlePostComment = async (appealId: string) => {
        const input = commentInputs[appealId];
        if (!input?.author || !input?.msg) return;

        try {
            const res = await fetch(`/api/nosql/appeals/${appealId}/comments`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    authorName: input.author,
                    contactNumber: input.phone,
                    message: input.msg,
                }),
            });
            if (res.ok) {
                setCommentInputs((prev) => ({ ...prev, [appealId]: { author: '', phone: '', msg: '' } }));
                loadAppeals();
            }
        } catch (err) {
            console.error(err);
        }
    };

    return (
        <div className="max-w-7xl mx-auto p-6 md:p-10">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-6 mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-white flex items-center gap-3">
                        <AlertCircle className="h-8 w-8 text-rose-500" />
                        Emergency Blood Appeals
                    </h1>
                    <p className="text-slate-400 text-sm mt-1">
                        Real-time critical requisitions powered by MongoDB NoSQL nested comment threads
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    <input
                        type="text"
                        placeholder="Search hospital, city, or discussions..."
                        value={keyword}
                        onChange={(e) => setKeyword(e.target.value)}
                        className="bg-slate-900 border border-slate-700 text-slate-200 text-sm rounded-lg px-3 py-2 w-64 focus:outline-none focus:border-rose-500"
                    />
                    <select
                        value={filterGroup}
                        onChange={(e) => setFilterGroup(e.target.value)}
                        className="bg-slate-900 border border-slate-700 text-slate-200 text-sm rounded-lg px-3 py-2"
                    >
                        <option value="">All Blood Groups</option>
                        {['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map((bg) => (
                            <option key={bg} value={bg}>{bg}</option>
                        ))}
                    </select>
                    <button
                        onClick={() => setShowModal(true)}
                        className="flex items-center gap-2 bg-rose-600 hover:bg-rose-700 text-white text-sm font-semibold px-4 py-2 rounded-lg transition"
                    >
                        <Plus className="h-4 w-4" />
                        New Appeal
                    </button>
                </div>
            </div>

            {/* Appeals Grid */}
            {loading ? (
                <div className="text-center py-20 text-slate-400">Loading active appeals from MongoDB...</div>
            ) : appeals.length === 0 ? (
                <div className="text-center py-20 text-slate-500">No active appeals found. Create one above.</div>
            ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {appeals.map((appeal) => (
                        <div
                            key={appeal._id}
                            className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-md flex flex-col justify-between"
                        >
                            <div>
                                <div className="flex items-start justify-between gap-2">
                                    <div>
                                        <span
                                            className={`inline-block text-xs font-bold px-2.5 py-0.5 rounded-full mb-2 ${appeal.urgency === 'CRITICAL'
                                                    ? 'bg-rose-950 text-rose-400 border border-rose-800'
                                                    : appeal.urgency === 'URGENT'
                                                        ? 'bg-amber-950 text-amber-400 border border-amber-800'
                                                        : 'bg-blue-950 text-blue-400 border border-blue-800'
                                                }`}
                                        >
                                            {appeal.urgency}
                                        </span>
                                        <h3 className="text-xl font-bold text-white">{appeal.hospitalName}</h3>
                                    </div>
                                    <div className="flex flex-col items-center justify-center bg-rose-950/40 border border-rose-800/80 rounded-lg px-3 py-1.5 text-center min-w-[70px]">
                                        <span className="text-xs text-rose-400 uppercase font-bold">Group</span>
                                        <span className="text-2xl font-black text-rose-500">{appeal.bloodGroup}</span>
                                    </div>
                                </div>

                                <div className="flex flex-wrap gap-4 text-xs text-slate-400 mt-3 pb-4 border-b border-slate-800">
                                    <span className="flex items-center gap-1">
                                        <Droplet className="h-3.5 w-3.5 text-rose-400" />
                                        Required: {appeal.unitsNeeded} units
                                    </span>
                                    <span className="flex items-center gap-1">
                                        <MapPin className="h-3.5 w-3.5 text-slate-500" />
                                        {appeal.location}
                                    </span>
                                    <span className="flex items-center gap-1">
                                        <Clock className="h-3.5 w-3.5 text-slate-500" />
                                        {new Date(appeal.createdAt).toLocaleDateString()}
                                    </span>
                                </div>

                                {/* MongoDB Embedded Thread Comments */}
                                <div className="mt-4">
                                    <h4 className="text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2 flex items-center gap-1">
                                        <MessageSquare className="h-3.5 w-3.5" />
                                        Responses ({appeal.comments?.length || 0})
                                    </h4>
                                    <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                                        {appeal.comments?.map((c, i) => (
                                            <div key={i} className="bg-slate-950/70 border border-slate-800 rounded-lg p-2.5 text-xs">
                                                <div className="flex items-center justify-between text-slate-400 font-medium">
                                                    <span className="text-rose-400">{c.authorName}</span>
                                                    <span className="text-[10px]">{new Date(c.postedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                                </div>
                                                <p className="text-slate-200 mt-1">{c.message}</p>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            {/* Add Comment Input */}
                            <div className="mt-5 pt-3 border-t border-slate-800/80">
                                <div className="grid grid-cols-2 gap-2 mb-2">
                                    <input
                                        type="text"
                                        placeholder="Your Name"
                                        value={commentInputs[appeal._id]?.author || ''}
                                        onChange={(e) =>
                                            setCommentInputs((prev) => ({
                                                ...prev,
                                                [appeal._id]: { ...(prev[appeal._id] || { author: '', phone: '', msg: '' }), author: e.target.value },
                                            }))
                                        }
                                        className="bg-slate-950 border border-slate-800 rounded px-2 py-1 text-xs text-slate-200"
                                    />
                                    <input
                                        type="text"
                                        placeholder="Contact No"
                                        value={commentInputs[appeal._id]?.phone || ''}
                                        onChange={(e) =>
                                            setCommentInputs((prev) => ({
                                                ...prev,
                                                [appeal._id]: { ...(prev[appeal._id] || { author: '', phone: '', msg: '' }), phone: e.target.value },
                                            }))
                                        }
                                        className="bg-slate-950 border border-slate-800 rounded px-2 py-1 text-xs text-slate-200"
                                    />
                                </div>
                                <div className="flex gap-2">
                                    <input
                                        type="text"
                                        placeholder="Write a message (e.g. On my way to donate...)"
                                        value={commentInputs[appeal._id]?.msg || ''}
                                        onChange={(e) =>
                                            setCommentInputs((prev) => ({
                                                ...prev,
                                                [appeal._id]: { ...(prev[appeal._id] || { author: '', phone: '', msg: '' }), msg: e.target.value },
                                            }))
                                        }
                                        className="flex-1 bg-slate-950 border border-slate-800 rounded px-2 py-1 text-xs text-slate-200"
                                    />
                                    <button
                                        onClick={() => handlePostComment(appeal._id)}
                                        className="bg-slate-800 hover:bg-rose-600 text-white px-3 py-1 rounded text-xs transition"
                                    >
                                        <Send className="h-3.5 w-3.5" />
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Modal for creating a new Appeal */}
            {showModal && (
                <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50">
                    <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 max-w-md w-full shadow-2xl">
                        <h2 className="text-xl font-bold text-white mb-4">Post Emergency Appeal</h2>
                        <form onSubmit={handleCreateAppeal} className="space-y-4 text-sm">
                            <div>
                                <label className="block text-slate-400 mb-1">Hospital Name</label>
                                <input
                                    required
                                    type="text"
                                    value={hospitalName}
                                    onChange={(e) => setHospitalName(e.target.value)}
                                    placeholder="e.g. National Hospital Colombo"
                                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white"
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-slate-400 mb-1">Blood Group</label>
                                    <select
                                        value={bloodGroup}
                                        onChange={(e) => setBloodGroup(e.target.value)}
                                        className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white"
                                    >
                                        {['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map((bg) => (
                                            <option key={bg} value={bg}>{bg}</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-slate-400 mb-1">Units Needed</label>
                                    <input
                                        required
                                        type="number"
                                        min="1"
                                        value={unitsNeeded}
                                        onChange={(e) => setUnitsNeeded(e.target.value)}
                                        className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white"
                                    />
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-slate-400 mb-1">Urgency</label>
                                    <select
                                        value={urgency}
                                        onChange={(e) => setUrgency(e.target.value as any)}
                                        className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white"
                                    >
                                        <option value="CRITICAL">Critical</option>
                                        <option value="URGENT">Urgent</option>
                                        <option value="STANDARD">Standard</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-slate-400 mb-1">Location / City</label>
                                    <input
                                        required
                                        type="text"
                                        value={location}
                                        onChange={(e) => setLocation(e.target.value)}
                                        placeholder="e.g. Colombo 07"
                                        className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white"
                                    />
                                </div>
                            </div>
                            <div className="flex justify-end gap-2 pt-4">
                                <button
                                    type="button"
                                    onClick={() => setShowModal(false)}
                                    className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="px-4 py-2 rounded-lg bg-rose-600 hover:bg-rose-700 text-white font-semibold"
                                >
                                    Broadcast Appeal
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}