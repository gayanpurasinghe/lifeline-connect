'use client';

import React, { useState, useEffect } from 'react';
import {
    Users,
    UserPlus,
    Stethoscope,
    HeartHandshake,
    Shield,
    Search,
    CheckCircle2,
    AlertCircle,
    Phone,
    Mail,
    Calendar,
    Briefcase,
    Tag,
    X,
    Filter,
    Activity,
    Award,
    ClipboardList,
    PlusCircle,
    Trash2,
    MapPin,
    Target
} from 'lucide-react';
import { useAuth } from '@/lib/auth/AuthContext';

interface StaffMember {
    STAFFID: number;
    NAME: string;
    ROLE: string;
    CONTACT: string;
    EMAIL: string;
    STATUS: 'ACTIVE' | 'INACTIVE' | 'ON_LEAVE';
    ASSIGNEDCAMPSCOUNT?: number;
}

interface Volunteer {
    VOLUNTEERID: number;
    NAME: string;
    CONTACT: string;
    EMAIL?: string;
    SKILLS: string;
    STATUS: 'ACTIVE' | 'INACTIVE';
    ASSIGNEDCAMPSCOUNT?: number;
}

interface CampOption {
    CAMPID: number;
    CAMPNAME: string;
    CITY: string;
    VENUENAME: string;
    STARTDATE: string;
    ENDDATE: string;
    STATUS: string;
    TARGETUNITS: number;
}

interface AssignedStaff {
    ASSIGNMENTID: number;
    CAMPID: number;
    STAFFID: number;
    STAFFNAME: string;
    PRIMARYROLE: string;
    ASSIGNEDROLE: string;
    ASSIGNEDDATE: string;
    CONTACT: string;
    EMAIL: string;
}

interface AssignedVolunteer {
    ASSIGNMENTID: number;
    CAMPID: number;
    VOLUNTEERID: number;
    VOLUNTEERNAME: string;
    ASSIGNEDROLE: string;
    ASSIGNEDDATE: string;
    CONTACT: string;
    SKILLS: string;
}

export default function PersonnelPage() {
    const { user } = useAuth();
    const [activeTab, setActiveTab] = useState<'staff' | 'volunteers' | 'rosters'>('staff');

    // Data lists
    const [staffList, setStaffList] = useState<StaffMember[]>([]);
    const [volunteerList, setVolunteerList] = useState<Volunteer[]>([]);
    const [campsList, setCampsList] = useState<CampOption[]>([]);
    const [selectedCampId, setSelectedCampId] = useState<number | null>(null);
    const [campRoster, setCampRoster] = useState<{ staff: AssignedStaff[]; volunteers: AssignedVolunteer[] }>({
        staff: [],
        volunteers: [],
    });

    const [loading, setLoading] = useState(true);
    const [rosterLoading, setRosterLoading] = useState(false);
    const [actionBanner, setActionBanner] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

    // Search & Filters
    const [staffSearch, setStaffSearch] = useState('');
    const [staffStatusFilter, setStaffStatusFilter] = useState('ALL');
    const [staffRoleFilter, setStaffRoleFilter] = useState('ALL');

    const [volSearch, setVolSearch] = useState('');
    const [volStatusFilter, setVolStatusFilter] = useState('ALL');

    // Modals
    const [showAddStaffModal, setShowAddStaffModal] = useState(false);
    const [showAddVolModal, setShowAddVolModal] = useState(false);
    const [showAssignModal, setShowAssignModal] = useState(false);
    const [submitting, setSubmitting] = useState(false);

    // New Staff Form
    const [newStaff, setNewStaff] = useState({
        name: '',
        role: 'Phlebotomist',
        contact: '',
        email: '',
        status: 'ACTIVE',
    });

    // New Volunteer Form
    const [newVolunteer, setNewVolunteer] = useState({
        name: '',
        contact: '',
        email: '',
        skills: 'First Aid, Registration',
        status: 'ACTIVE',
    });

    // Assign to Camp Form
    const [assignForm, setAssignForm] = useState({
        campId: '',
        type: 'STAFF' as 'STAFF' | 'VOLUNTEER',
        personId: '',
        role: 'Lead Phlebotomist',
    });

    const loadData = async () => {
        setLoading(true);
        try {
            const [staffRes, volRes, campsRes] = await Promise.all([
                fetch('/api/staff'),
                fetch('/api/volunteers'),
                fetch('/api/camps'),
            ]);
            const staffJson = await staffRes.json();
            const volJson = await volRes.json();
            const campsJson = await campsRes.json();

            if (staffJson.success) setStaffList(staffJson.data || []);
            if (volJson.success) setVolunteerList(volJson.data || []);
            if (campsJson.success && campsJson.data?.length > 0) {
                setCampsList(campsJson.data);
                if (!selectedCampId) {
                    setSelectedCampId(campsJson.data[0].CAMPID);
                }
            }
        } catch (err: any) {
            console.error('Failed to load personnel:', err);
        } finally {
            setLoading(false);
        }
    };

    const loadRoster = async (campId: number) => {
        setRosterLoading(true);
        try {
            const res = await fetch(`/api/camps/${campId}/roster`);
            const data = await res.json();
            if (data.success) {
                setCampRoster({
                    staff: data.staff || [],
                    volunteers: data.volunteers || [],
                });
            }
        } catch (err) {
            console.error('Failed to load roster:', err);
        } finally {
            setRosterLoading(false);
        }
    };

    useEffect(() => {
        loadData();
    }, []);

    useEffect(() => {
        if (selectedCampId) {
            loadRoster(selectedCampId);
        }
    }, [selectedCampId]);

    // Open Assign Modal with pre-selection
    const openAssignModalForPerson = (type: 'STAFF' | 'VOLUNTEER', personId: number, defaultRole?: string) => {
        setAssignForm({
            campId: selectedCampId ? String(selectedCampId) : (campsList[0]?.CAMPID ? String(campsList[0].CAMPID) : ''),
            type,
            personId: String(personId),
            role: defaultRole || (type === 'STAFF' ? 'Lead Phlebotomist' : 'Donor Registration'),
        });
        setShowAssignModal(true);
    };

    // Add Staff Handler
    const handleAddStaff = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);
        setActionBanner(null);

        try {
            const res = await fetch('/api/staff', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(newStaff),
            });
            const data = await res.json();
            if (data.success) {
                setActionBanner({ type: 'success', message: data.message });
                setShowAddStaffModal(false);
                setNewStaff({ name: '', role: 'Phlebotomist', contact: '', email: '', status: 'ACTIVE' });
                loadData();
            } else {
                setActionBanner({ type: 'error', message: data.error || 'Failed to add staff.' });
            }
        } catch (err: any) {
            setActionBanner({ type: 'error', message: err.message });
        } finally {
            setSubmitting(false);
        }
    };

    // Update Staff Status
    const handleUpdateStaffStatus = async (staffId: number, status: string) => {
        try {
            const res = await fetch('/api/staff', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ staffId, status }),
            });
            const data = await res.json();
            if (data.success) {
                setActionBanner({ type: 'success', message: data.message });
                loadData();
            } else {
                setActionBanner({ type: 'error', message: data.error });
            }
        } catch (err: any) {
            setActionBanner({ type: 'error', message: err.message });
        }
    };

    // Add Volunteer Handler
    const handleAddVolunteer = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);
        setActionBanner(null);

        try {
            const res = await fetch('/api/volunteers', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(newVolunteer),
            });
            const data = await res.json();
            if (data.success) {
                setActionBanner({ type: 'success', message: data.message });
                setShowAddVolModal(false);
                setNewVolunteer({ name: '', contact: '', email: '', skills: 'First Aid, Registration', status: 'ACTIVE' });
                loadData();
            } else {
                setActionBanner({ type: 'error', message: data.error || 'Failed to add volunteer.' });
            }
        } catch (err: any) {
            setActionBanner({ type: 'error', message: err.message });
        } finally {
            setSubmitting(false);
        }
    };

    // Update Volunteer Status
    const handleUpdateVolunteerStatus = async (volunteerId: number, status: string) => {
        try {
            const res = await fetch('/api/volunteers', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ volunteerId, status }),
            });
            const data = await res.json();
            if (data.success) {
                setActionBanner({ type: 'success', message: data.message });
                loadData();
            } else {
                setActionBanner({ type: 'error', message: data.error });
            }
        } catch (err: any) {
            setActionBanner({ type: 'error', message: err.message });
        }
    };

    // Assign to Camp Handler
    const handleAssignToCamp = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);
        setActionBanner(null);

        try {
            const res = await fetch(`/api/camps/${assignForm.campId}/roster`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    type: assignForm.type,
                    personId: assignForm.personId,
                    role: assignForm.role,
                }),
            });
            const data = await res.json();
            if (data.success) {
                setActionBanner({ type: 'success', message: data.message });
                setShowAssignModal(false);
                loadData();
                if (Number(assignForm.campId) === selectedCampId) {
                    loadRoster(selectedCampId);
                }
            } else {
                setActionBanner({ type: 'error', message: data.error || 'Failed to assign.' });
            }
        } catch (err: any) {
            setActionBanner({ type: 'error', message: err.message });
        } finally {
            setSubmitting(false);
        }
    };

    // Delete Assignment Handler
    const handleRemoveAssignment = async (type: 'STAFF' | 'VOLUNTEER', assignmentId: number) => {
        if (!selectedCampId) return;
        if (!confirm(`Are you sure you want to unassign this ${type.toLowerCase()} from the camp roster?`)) return;

        try {
            const res = await fetch(`/api/camps/${selectedCampId}/roster?type=${type}&assignmentId=${assignmentId}`, {
                method: 'DELETE',
            });
            const data = await res.json();
            if (data.success) {
                setActionBanner({ type: 'success', message: data.message });
                loadData();
                loadRoster(selectedCampId);
            } else {
                setActionBanner({ type: 'error', message: data.error });
            }
        } catch (err: any) {
            setActionBanner({ type: 'error', message: err.message });
        }
    };

    // Filtered Staff
    const filteredStaff = staffList.filter((s) => {
        const matchesSearch =
            s.NAME.toLowerCase().includes(staffSearch.toLowerCase()) ||
            s.EMAIL.toLowerCase().includes(staffSearch.toLowerCase()) ||
            s.ROLE.toLowerCase().includes(staffSearch.toLowerCase());
        const matchesStatus = staffStatusFilter === 'ALL' || s.STATUS === staffStatusFilter;
        const matchesRole = staffRoleFilter === 'ALL' || s.ROLE === staffRoleFilter;
        return matchesSearch && matchesStatus && matchesRole;
    });

    // Filtered Volunteers
    const filteredVolunteers = volunteerList.filter((v) => {
        const matchesSearch =
            v.NAME.toLowerCase().includes(volSearch.toLowerCase()) ||
            v.SKILLS.toLowerCase().includes(volSearch.toLowerCase()) ||
            (v.EMAIL && v.EMAIL.toLowerCase().includes(volSearch.toLowerCase()));
        const matchesStatus = volStatusFilter === 'ALL' || v.STATUS === volStatusFilter;
        return matchesSearch && matchesStatus;
    });

    // Selected Camp Object
    const currentCamp = campsList.find((c) => c.CAMPID === selectedCampId);

    // Aggregate Stats
    const totalStaff = staffList.length;
    const activeStaff = staffList.filter((s) => s.STATUS === 'ACTIVE').length;
    const totalVolunteers = volunteerList.length;
    const activeVolunteers = volunteerList.filter((v) => v.STATUS === 'ACTIVE').length;
    const totalAssignments = staffList.reduce((acc, s) => acc + (s.ASSIGNEDCAMPSCOUNT || 0), 0) +
        volunteerList.reduce((acc, v) => acc + (v.ASSIGNEDCAMPSCOUNT || 0), 0);

    return (
        <div className="max-w-7xl mx-auto p-6 md:p-10 space-y-8">
            {/* Top Header */}
            <div className="border-b border-slate-800 pb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-black text-white flex items-center gap-3 tracking-tight">
                        <Users className="h-8 w-8 text-rose-500" />
                        Personnel, Volunteers & Camp Duty Rosters
                    </h1>
                    <p className="text-slate-400 text-sm mt-1">
                        Oracle 3NF Relational Tables: <code className="text-rose-400 font-mono">STAFF</code>,{' '}
                        <code className="text-emerald-400 font-mono">VOLUNTEER</code>,{' '}
                        <code className="text-cyan-400 font-mono">CAMP_STAFF</code>,{' '}
                        <code className="text-purple-400 font-mono">CAMP_VOLUNTEER</code>
                    </p>
                </div>

                <div className="flex items-center gap-2.5 flex-wrap">
                    <button
                        onClick={() => {
                            setAssignForm({
                                campId: selectedCampId ? String(selectedCampId) : (campsList[0]?.CAMPID ? String(campsList[0].CAMPID) : ''),
                                type: 'STAFF',
                                personId: staffList[0]?.STAFFID ? String(staffList[0].STAFFID) : '',
                                role: 'Lead Phlebotomist',
                            });
                            setShowAssignModal(true);
                        }}
                        className="px-4 py-2 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white rounded-xl text-xs font-semibold shadow-lg shadow-cyan-950/50 flex items-center gap-2 transition"
                    >
                        <ClipboardList className="w-4 h-4" />
                        <span>Deploy to Camp</span>
                    </button>
                    <button
                        onClick={() => setShowAddStaffModal(true)}
                        className="px-4 py-2 bg-gradient-to-r from-rose-600 to-rose-700 hover:from-rose-500 hover:to-rose-600 text-white rounded-xl text-xs font-semibold shadow-lg shadow-rose-950/50 flex items-center gap-2 transition"
                    >
                        <UserPlus className="w-4 h-4" />
                        <span>Add Medical Staff</span>
                    </button>
                    <button
                        onClick={() => setShowAddVolModal(true)}
                        className="px-4 py-2 bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-500 hover:to-emerald-600 text-white rounded-xl text-xs font-semibold shadow-lg shadow-emerald-950/50 flex items-center gap-2 transition"
                    >
                        <HeartHandshake className="w-4 h-4" />
                        <span>Register Volunteer</span>
                    </button>
                </div>
            </div>

            {/* Notification Banner */}
            {actionBanner && (
                <div
                    className={`p-4 rounded-xl border flex items-center justify-between text-sm ${actionBanner.type === 'success'
                        ? 'bg-emerald-950/60 border-emerald-800 text-emerald-300'
                        : 'bg-rose-950/60 border-rose-800 text-rose-300'
                        }`}
                >
                    <div className="flex items-center gap-2.5">
                        {actionBanner.type === 'success' ? (
                            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                        ) : (
                            <AlertCircle className="w-5 h-5 text-rose-400 shrink-0" />
                        )}
                        <span>{actionBanner.message}</span>
                    </div>
                    <button onClick={() => setActionBanner(null)} className="text-slate-400 hover:text-white">
                        <X className="w-4 h-4" />
                    </button>
                </div>
            )}

            {/* Metrics Ribbon */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-xl">
                    <div className="flex items-center justify-between text-slate-400 text-xs font-semibold mb-2">
                        <span>Medical Staff</span>
                        <Stethoscope className="w-4 h-4 text-rose-400" />
                    </div>
                    <div className="text-2xl font-black text-white">{totalStaff}</div>
                    <div className="text-[11px] text-emerald-400 font-medium mt-1">
                        {activeStaff} Active on Duty
                    </div>
                </div>

                <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-xl">
                    <div className="flex items-center justify-between text-slate-400 text-xs font-semibold mb-2">
                        <span>Community Volunteers</span>
                        <HeartHandshake className="w-4 h-4 text-emerald-400" />
                    </div>
                    <div className="text-2xl font-black text-white">{totalVolunteers}</div>
                    <div className="text-[11px] text-emerald-400 font-medium mt-1">
                        {activeVolunteers} Ready for Duty
                    </div>
                </div>

                <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-xl">
                    <div className="flex items-center justify-between text-slate-400 text-xs font-semibold mb-2">
                        <span>Camp Deployments</span>
                        <ClipboardList className="w-4 h-4 text-cyan-400" />
                    </div>
                    <div className="text-2xl font-black text-cyan-400">{totalAssignments}</div>
                    <div className="text-[11px] text-slate-400 mt-1">Active Roster Placements</div>
                </div>

                <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-xl">
                    <div className="flex items-center justify-between text-slate-400 text-xs font-semibold mb-2">
                        <span>Camps Tracked</span>
                        <Calendar className="w-4 h-4 text-purple-400" />
                    </div>
                    <div className="text-2xl font-black text-purple-400">{campsList.length}</div>
                    <div className="text-[11px] text-slate-400 mt-1">Regional Blood Drives</div>
                </div>
            </div>

            {/* Navigation Tabs */}
            <div className="flex border-b border-slate-800 gap-6">
                <button
                    onClick={() => setActiveTab('staff')}
                    className={`pb-3 text-sm font-bold flex items-center gap-2 transition border-b-2 ${activeTab === 'staff'
                        ? 'border-rose-500 text-rose-400'
                        : 'border-transparent text-slate-400 hover:text-white'
                        }`}
                >
                    <Stethoscope className="w-4 h-4" />
                    <span>Medical Staff Directory ({staffList.length})</span>
                </button>

                <button
                    onClick={() => setActiveTab('volunteers')}
                    className={`pb-3 text-sm font-bold flex items-center gap-2 transition border-b-2 ${activeTab === 'volunteers'
                        ? 'border-emerald-500 text-emerald-400'
                        : 'border-transparent text-slate-400 hover:text-white'
                        }`}
                >
                    <HeartHandshake className="w-4 h-4" />
                    <span>Volunteers Network ({volunteerList.length})</span>
                </button>

                <button
                    onClick={() => setActiveTab('rosters')}
                    className={`pb-3 text-sm font-bold flex items-center gap-2 transition border-b-2 ${activeTab === 'rosters'
                        ? 'border-cyan-500 text-cyan-400'
                        : 'border-transparent text-slate-400 hover:text-white'
                        }`}
                >
                    <ClipboardList className="w-4 h-4" />
                    <span>Camp Duty Rosters & Assignments</span>
                </button>
            </div>

            {/* TAB 1: MEDICAL STAFF DIRECTORY */}
            {activeTab === 'staff' && (
                <div className="space-y-4">
                    {/* Filter Bar */}
                    <div className="flex flex-col md:flex-row gap-3 items-center justify-between bg-slate-900/80 p-4 rounded-xl border border-slate-800">
                        <div className="relative w-full md:w-80">
                            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                            <input
                                type="text"
                                value={staffSearch}
                                onChange={(e) => setStaffSearch(e.target.value)}
                                placeholder="Search by name, role, email..."
                                className="w-full pl-9 pr-4 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-white placeholder-slate-500 focus:outline-none focus:border-rose-500"
                            />
                        </div>

                        <div className="flex items-center gap-3 w-full md:w-auto">
                            <select
                                value={staffStatusFilter}
                                onChange={(e) => setStaffStatusFilter(e.target.value)}
                                className="bg-slate-950 border border-slate-800 text-slate-300 text-xs rounded-lg px-3 py-2"
                            >
                                <option value="ALL">All Statuses</option>
                                <option value="ACTIVE">Active</option>
                                <option value="ON_LEAVE">On Leave</option>
                                <option value="INACTIVE">Inactive</option>
                            </select>

                            <select
                                value={staffRoleFilter}
                                onChange={(e) => setStaffRoleFilter(e.target.value)}
                                className="bg-slate-950 border border-slate-800 text-slate-300 text-xs rounded-lg px-3 py-2"
                            >
                                <option value="ALL">All Roles</option>
                                <option value="Medical Officer">Medical Officer</option>
                                <option value="Phlebotomist">Phlebotomist</option>
                                <option value="Screening Officer">Screening Officer</option>
                                <option value="Camp Coordinator">Camp Coordinator</option>
                                <option value="Lab Technician">Lab Technician</option>
                            </select>
                        </div>
                    </div>

                    {/* Staff Table */}
                    <div className="bg-slate-900/90 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl">
                        {loading ? (
                            <div className="p-16 text-center text-slate-400 text-sm">Loading staff members from Oracle...</div>
                        ) : filteredStaff.length === 0 ? (
                            <div className="p-16 text-center text-slate-500 text-sm">No medical staff found matching filters.</div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full text-left text-xs">
                                    <thead>
                                        <tr className="border-b border-slate-800 bg-slate-950/60 text-slate-400 uppercase font-semibold">
                                            <th className="py-3.5 px-4">Staff Member</th>
                                            <th className="py-3.5 px-4">Clinical Role</th>
                                            <th className="py-3.5 px-4">Contact Info</th>
                                            <th className="py-3.5 px-4">Camp Deployments</th>
                                            <th className="py-3.5 px-4">Status</th>
                                            <th className="py-3.5 px-4 text-right">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-800/60">
                                        {filteredStaff.map((s) => (
                                            <tr key={s.STAFFID} className="hover:bg-slate-800/30 transition">
                                                <td className="py-3 px-4">
                                                    <div className="font-bold text-white flex items-center gap-2">
                                                        <span className="h-2 w-2 rounded-full bg-rose-500" />
                                                        {s.NAME}
                                                    </div>
                                                    <div className="text-[10px] text-slate-500 font-mono">ID #{s.STAFFID}</div>
                                                </td>
                                                <td className="py-3 px-4">
                                                    <span className="px-2.5 py-1 rounded-md text-[11px] font-medium bg-slate-800 text-slate-200 border border-slate-700">
                                                        {s.ROLE}
                                                    </span>
                                                </td>
                                                <td className="py-3 px-4">
                                                    <div className="text-slate-300 flex items-center gap-1.5">
                                                        <Phone className="w-3 h-3 text-slate-500" />
                                                        {s.CONTACT}
                                                    </div>
                                                    <div className="text-slate-400 text-[11px] flex items-center gap-1.5 mt-0.5 font-mono">
                                                        <Mail className="w-3 h-3 text-slate-500" />
                                                        {s.EMAIL}
                                                    </div>
                                                </td>
                                                <td className="py-3 px-4">
                                                    <span className="px-2 py-0.5 rounded text-[11px] font-mono font-bold bg-slate-800 text-cyan-300">
                                                        {s.ASSIGNEDCAMPSCOUNT || 0} Camps
                                                    </span>
                                                </td>
                                                <td className="py-3 px-4">
                                                    <span
                                                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold border uppercase ${s.STATUS === 'ACTIVE'
                                                            ? 'bg-emerald-950/80 text-emerald-300 border-emerald-800'
                                                            : s.STATUS === 'ON_LEAVE'
                                                                ? 'bg-amber-950/80 text-amber-300 border-amber-800'
                                                                : 'bg-rose-950/80 text-rose-300 border-rose-800'
                                                            }`}
                                                    >
                                                        {s.STATUS}
                                                    </span>
                                                </td>
                                                <td className="py-3 px-4 text-right">
                                                    <div className="inline-flex items-center gap-1.5">
                                                        {s.STATUS === 'ACTIVE' && (
                                                            <button
                                                                onClick={() => openAssignModalForPerson('STAFF', s.STAFFID, s.ROLE)}
                                                                className="px-2.5 py-1 bg-cyan-950/80 hover:bg-cyan-800 text-cyan-300 border border-cyan-800 rounded text-[10px] font-semibold transition flex items-center gap-1"
                                                            >
                                                                <ClipboardList className="w-3 h-3" />
                                                                Deploy
                                                            </button>
                                                        )}
                                                        {s.STATUS !== 'ACTIVE' && (
                                                            <button
                                                                onClick={() => handleUpdateStaffStatus(s.STAFFID, 'ACTIVE')}
                                                                className="px-2 py-1 bg-emerald-950/80 hover:bg-emerald-800 text-emerald-300 border border-emerald-800 rounded text-[10px] font-medium transition"
                                                            >
                                                                Set Active
                                                            </button>
                                                        )}
                                                        {s.STATUS !== 'ON_LEAVE' && (
                                                            <button
                                                                onClick={() => handleUpdateStaffStatus(s.STAFFID, 'ON_LEAVE')}
                                                                className="px-2 py-1 bg-amber-950/80 hover:bg-amber-800 text-amber-300 border border-amber-800 rounded text-[10px] font-medium transition"
                                                            >
                                                                On Leave
                                                            </button>
                                                        )}
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* TAB 2: COMMUNITY VOLUNTEERS */}
            {activeTab === 'volunteers' && (
                <div className="space-y-4">
                    {/* Filter Bar */}
                    <div className="flex flex-col md:flex-row gap-3 items-center justify-between bg-slate-900/80 p-4 rounded-xl border border-slate-800">
                        <div className="relative w-full md:w-80">
                            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                            <input
                                type="text"
                                value={volSearch}
                                onChange={(e) => setVolSearch(e.target.value)}
                                placeholder="Search by name, skills, contact..."
                                className="w-full pl-9 pr-4 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                            />
                        </div>

                        <select
                            value={volStatusFilter}
                            onChange={(e) => setVolStatusFilter(e.target.value)}
                            className="bg-slate-950 border border-slate-800 text-slate-300 text-xs rounded-lg px-3 py-2 w-full md:w-auto"
                        >
                            <option value="ALL">All Statuses</option>
                            <option value="ACTIVE">Active</option>
                            <option value="INACTIVE">Inactive</option>
                        </select>
                    </div>

                    {/* Volunteers Grid */}
                    {loading ? (
                        <div className="p-16 text-center text-slate-400 text-sm">Loading volunteers from Oracle...</div>
                    ) : filteredVolunteers.length === 0 ? (
                        <div className="p-16 text-center text-slate-500 text-sm">No community volunteers found matching filters.</div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {filteredVolunteers.map((v) => (
                                <div
                                    key={v.VOLUNTEERID}
                                    className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 hover:border-slate-700 shadow-xl transition space-y-3"
                                >
                                    <div className="flex items-start justify-between">
                                        <div>
                                            <h3 className="font-bold text-white text-sm flex items-center gap-2">
                                                {v.NAME}
                                            </h3>
                                            <span className="text-[10px] text-slate-500 font-mono">Volunteer #{v.VOLUNTEERID}</span>
                                        </div>
                                        <span
                                            className={`px-2 py-0.5 rounded-full text-[9px] font-bold border uppercase ${v.STATUS === 'ACTIVE'
                                                ? 'bg-emerald-950/80 text-emerald-300 border-emerald-800'
                                                : 'bg-slate-800 text-slate-400 border-slate-700'
                                                }`}
                                        >
                                            {v.STATUS}
                                        </span>
                                    </div>

                                    {/* Contact Details */}
                                    <div className="space-y-1 text-xs text-slate-300">
                                        <div className="flex items-center gap-2">
                                            <Phone className="w-3.5 h-3.5 text-slate-500" />
                                            <span>{v.CONTACT}</span>
                                        </div>
                                        {v.EMAIL && (
                                            <div className="flex items-center gap-2 text-[11px] text-slate-400 font-mono">
                                                <Mail className="w-3.5 h-3.5 text-slate-500" />
                                                <span className="truncate">{v.EMAIL}</span>
                                            </div>
                                        )}
                                    </div>

                                    {/* Skills Tags */}
                                    <div>
                                        <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1.5 flex items-center gap-1">
                                            <Tag className="w-3 h-3 text-emerald-400" />
                                            <span>Competencies & Skills</span>
                                        </div>
                                        <div className="flex flex-wrap gap-1.5">
                                            {v.SKILLS.split(',').map((skill, i) => (
                                                <span
                                                    key={i}
                                                    className="px-2 py-0.5 rounded text-[10px] font-medium bg-slate-800/80 text-slate-300 border border-slate-700/80"
                                                >
                                                    {skill.trim()}
                                                </span>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Footer Actions */}
                                    <div className="pt-3 border-t border-slate-800 flex items-center justify-between text-xs">
                                        <span className="text-[11px] text-slate-400">
                                            Deployments:{' '}
                                            <strong className="text-white font-mono">{v.ASSIGNEDCAMPSCOUNT || 0}</strong>
                                        </span>
                                        <div className="flex items-center gap-2">
                                            {v.STATUS === 'ACTIVE' && (
                                                <button
                                                    onClick={() => openAssignModalForPerson('VOLUNTEER', v.VOLUNTEERID, 'Donor Care')}
                                                    className="px-2.5 py-1 bg-cyan-950/80 hover:bg-cyan-800 text-cyan-300 border border-cyan-800 rounded text-[10px] font-semibold transition flex items-center gap-1"
                                                >
                                                    <ClipboardList className="w-3 h-3" />
                                                    Deploy
                                                </button>
                                            )}
                                            <button
                                                onClick={() =>
                                                    handleUpdateVolunteerStatus(
                                                        v.VOLUNTEERID,
                                                        v.STATUS === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE'
                                                    )
                                                }
                                                className={`px-2 py-1 rounded text-[10px] font-semibold transition ${v.STATUS === 'ACTIVE'
                                                    ? 'bg-rose-950/60 hover:bg-rose-900 text-rose-300 border border-rose-800'
                                                    : 'bg-emerald-950/60 hover:bg-emerald-900 text-emerald-300 border border-emerald-800'
                                                    }`}
                                            >
                                                {v.STATUS === 'ACTIVE' ? 'Set Inactive' : 'Activate'}
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* TAB 3: CAMP DUTY ROSTERS & ASSIGNMENT TRACKING */}
            {activeTab === 'rosters' && (
                <div className="space-y-6">
                    {/* Camp Selector Bar */}
                    <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div className="space-y-1">
                            <label className="text-xs font-bold text-slate-300 uppercase tracking-wider block">
                                Select Donation Camp to Inspect Roster:
                            </label>
                            <select
                                value={selectedCampId || ''}
                                onChange={(e) => setSelectedCampId(Number(e.target.value))}
                                className="bg-slate-950 border border-slate-700 text-white font-bold text-sm rounded-xl px-4 py-2.5 focus:outline-none focus:border-cyan-500 w-full md:w-96"
                            >
                                {campsList.map((c) => (
                                    <option key={c.CAMPID} value={c.CAMPID}>
                                        {c.CAMPNAME} ({c.CITY} • {c.STATUS})
                                    </option>
                                ))}
                            </select>
                        </div>

                        {currentCamp && (
                            <div className="flex items-center gap-4 text-xs">
                                <div className="bg-slate-950/60 border border-slate-800 px-3 py-2 rounded-xl">
                                    <span className="text-slate-400 block text-[10px]">Host Venue</span>
                                    <span className="font-semibold text-slate-200">{currentCamp.VENUENAME}</span>
                                </div>
                                <div className="bg-slate-950/60 border border-slate-800 px-3 py-2 rounded-xl">
                                    <span className="text-slate-400 block text-[10px]">Dates</span>
                                    <span className="font-semibold text-slate-200">{currentCamp.STARTDATE} to {currentCamp.ENDDATE}</span>
                                </div>
                                <button
                                    onClick={() => {
                                        setAssignForm({
                                            campId: String(currentCamp.CAMPID),
                                            type: 'STAFF',
                                            personId: staffList[0]?.STAFFID ? String(staffList[0].STAFFID) : '',
                                            role: 'Lead Phlebotomist',
                                        });
                                        setShowAssignModal(true);
                                    }}
                                    className="px-4 py-2.5 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white rounded-xl text-xs font-semibold shadow flex items-center gap-1.5"
                                >
                                    <PlusCircle className="w-4 h-4" />
                                    <span>Deploy Person</span>
                                </button>
                            </div>
                        )}
                    </div>

                    {/* Active Camp Roster Lists */}
                    {rosterLoading ? (
                        <div className="p-16 text-center text-slate-400 text-sm">Loading camp roster from Oracle...</div>
                    ) : (
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            {/* Medical Personnel Assigned (CAMP_STAFF) */}
                            <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
                                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                                    <h3 className="font-bold text-white text-sm flex items-center gap-2">
                                        <Stethoscope className="w-4 h-4 text-rose-500" />
                                        <span>Medical Staff Assigned ({campRoster.staff.length})</span>
                                    </h3>
                                    <span className="text-[10px] text-slate-400 font-mono">CAMP_STAFF</span>
                                </div>

                                {campRoster.staff.length === 0 ? (
                                    <div className="p-10 text-center text-slate-500 text-xs">
                                        No medical personnel assigned to this camp drive yet.
                                    </div>
                                ) : (
                                    <div className="space-y-2.5">
                                        {campRoster.staff.map((s) => (
                                            <div
                                                key={s.ASSIGNMENTID}
                                                className="p-3.5 bg-slate-950/70 border border-slate-800 rounded-xl flex items-center justify-between gap-3 text-xs hover:border-slate-700 transition"
                                            >
                                                <div className="min-w-0">
                                                    <div className="font-bold text-white flex items-center gap-2">
                                                        <span>{s.STAFFNAME}</span>
                                                        <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-rose-950/80 text-rose-300 border border-rose-800">
                                                            {s.ASSIGNEDROLE}
                                                        </span>
                                                    </div>
                                                    <div className="text-[11px] text-slate-400 mt-1 flex items-center gap-3">
                                                        <span>Phone: {s.CONTACT}</span>
                                                        <span>Assigned: {s.ASSIGNEDDATE}</span>
                                                    </div>
                                                </div>
                                                <button
                                                    onClick={() => handleRemoveAssignment('STAFF', s.ASSIGNMENTID)}
                                                    title="Remove from Camp Roster"
                                                    className="p-2 text-slate-500 hover:text-rose-400 hover:bg-rose-950/40 rounded-lg transition"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {/* Community Volunteers Assigned (CAMP_VOLUNTEER) */}
                            <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
                                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                                    <h3 className="font-bold text-white text-sm flex items-center gap-2">
                                        <HeartHandshake className="w-4 h-4 text-emerald-500" />
                                        <span>Community Volunteers Assigned ({campRoster.volunteers.length})</span>
                                    </h3>
                                    <span className="text-[10px] text-slate-400 font-mono">CAMP_VOLUNTEER</span>
                                </div>

                                {campRoster.volunteers.length === 0 ? (
                                    <div className="p-10 text-center text-slate-500 text-xs">
                                        No community volunteers assigned to this camp drive yet.
                                    </div>
                                ) : (
                                    <div className="space-y-2.5">
                                        {campRoster.volunteers.map((v) => (
                                            <div
                                                key={v.ASSIGNMENTID}
                                                className="p-3.5 bg-slate-950/70 border border-slate-800 rounded-xl flex items-center justify-between gap-3 text-xs hover:border-slate-700 transition"
                                            >
                                                <div className="min-w-0">
                                                    <div className="font-bold text-white flex items-center gap-2">
                                                        <span>{v.VOLUNTEERNAME}</span>
                                                        <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-950/80 text-emerald-300 border border-emerald-800">
                                                            {v.ASSIGNEDROLE}
                                                        </span>
                                                    </div>
                                                    <div className="text-[11px] text-slate-400 mt-1 flex items-center gap-3">
                                                        <span>Phone: {v.CONTACT}</span>
                                                        <span>Assigned: {v.ASSIGNEDDATE}</span>
                                                    </div>
                                                </div>
                                                <button
                                                    onClick={() => handleRemoveAssignment('VOLUNTEER', v.ASSIGNMENTID)}
                                                    title="Remove from Camp Roster"
                                                    className="p-2 text-slate-500 hover:text-rose-400 hover:bg-rose-950/40 rounded-lg transition"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* MODAL: DEPLOY PERSONNEL TO CAMP */}
            {showAssignModal && (
                <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
                    <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md p-6 shadow-2xl space-y-4">
                        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                            <h3 className="font-bold text-white text-base flex items-center gap-2">
                                <ClipboardList className="w-5 h-5 text-cyan-400" />
                                <span>Deploy Personnel to Donation Camp</span>
                            </h3>
                            <button onClick={() => setShowAssignModal(false)} className="text-slate-400 hover:text-white">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <form onSubmit={handleAssignToCamp} className="space-y-3.5 text-xs">
                            <div>
                                <label className="block text-slate-300 font-semibold mb-1">Target Donation Camp</label>
                                <select
                                    required
                                    value={assignForm.campId}
                                    onChange={(e) => setAssignForm({ ...assignForm, campId: e.target.value })}
                                    className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-lg text-white font-bold"
                                >
                                    {campsList.map((c) => (
                                        <option key={c.CAMPID} value={c.CAMPID}>
                                            {c.CAMPNAME} ({c.CITY})
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="block text-slate-300 font-semibold mb-1">Personnel Category</label>
                                <div className="grid grid-cols-2 gap-2">
                                    <button
                                        type="button"
                                        onClick={() =>
                                            setAssignForm({
                                                ...assignForm,
                                                type: 'STAFF',
                                                personId: staffList[0]?.STAFFID ? String(staffList[0].STAFFID) : '',
                                                role: 'Lead Phlebotomist',
                                            })
                                        }
                                        className={`py-2 rounded-lg font-bold border transition ${assignForm.type === 'STAFF'
                                            ? 'bg-rose-950 border-rose-500 text-rose-300'
                                            : 'bg-slate-950 border-slate-800 text-slate-400'
                                            }`}
                                    >
                                        Medical Staff
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() =>
                                            setAssignForm({
                                                ...assignForm,
                                                type: 'VOLUNTEER',
                                                personId: volunteerList[0]?.VOLUNTEERID ? String(volunteerList[0].VOLUNTEERID) : '',
                                                role: 'Donor Care',
                                            })
                                        }
                                        className={`py-2 rounded-lg font-bold border transition ${assignForm.type === 'VOLUNTEER'
                                            ? 'bg-emerald-950 border-emerald-500 text-emerald-300'
                                            : 'bg-slate-950 border-slate-800 text-slate-400'
                                            }`}
                                    >
                                        Volunteer
                                    </button>
                                </div>
                            </div>

                            <div>
                                <label className="block text-slate-300 font-semibold mb-1">
                                    Select {assignForm.type === 'STAFF' ? 'Staff Member' : 'Volunteer'}
                                </label>
                                <select
                                    required
                                    value={assignForm.personId}
                                    onChange={(e) => setAssignForm({ ...assignForm, personId: e.target.value })}
                                    className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-lg text-white"
                                >
                                    {assignForm.type === 'STAFF' ? (
                                        staffList
                                            .filter((s) => s.STATUS === 'ACTIVE')
                                            .map((s) => (
                                                <option key={s.STAFFID} value={s.STAFFID}>
                                                    {s.NAME} ({s.ROLE})
                                                </option>
                                            ))
                                    ) : (
                                        volunteerList
                                            .filter((v) => v.STATUS === 'ACTIVE')
                                            .map((v) => (
                                                <option key={v.VOLUNTEERID} value={v.VOLUNTEERID}>
                                                    {v.NAME} ({v.SKILLS})
                                                </option>
                                            ))
                                    )}
                                </select>
                            </div>

                            <div>
                                <label className="block text-slate-300 font-semibold mb-1">Assigned Camp Role / Duty</label>
                                <input
                                    type="text"
                                    required
                                    value={assignForm.role}
                                    onChange={(e) => setAssignForm({ ...assignForm, role: e.target.value })}
                                    placeholder="e.g. Lead Phlebotomist, Screening Officer, Donor Care"
                                    className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-lg text-white"
                                />
                                <div className="flex gap-1.5 mt-2 flex-wrap">
                                    {assignForm.type === 'STAFF' ? (
                                        ['Lead Phlebotomist', 'Screening Officer', 'Medical Officer', 'Camp Coordinator'].map((r) => (
                                            <button
                                                key={r}
                                                type="button"
                                                onClick={() => setAssignForm({ ...assignForm, role: r })}
                                                className="px-2 py-0.5 rounded text-[10px] bg-slate-800 hover:bg-slate-700 text-slate-300"
                                            >
                                                {r}
                                            </button>
                                        ))
                                    ) : (
                                        ['Donor Care', 'Registration & Queue', 'First Aid Support', 'Refreshments & Logistics'].map((r) => (
                                            <button
                                                key={r}
                                                type="button"
                                                onClick={() => setAssignForm({ ...assignForm, role: r })}
                                                className="px-2 py-0.5 rounded text-[10px] bg-slate-800 hover:bg-slate-700 text-slate-300"
                                            >
                                                {r}
                                            </button>
                                        ))
                                    )}
                                </div>
                            </div>

                            <div className="pt-3 border-t border-slate-800 flex justify-end gap-2">
                                <button
                                    type="button"
                                    onClick={() => setShowAssignModal(false)}
                                    className="px-3 py-2 text-slate-400 hover:text-white"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={submitting || !assignForm.personId || !assignForm.campId}
                                    className="px-4 py-2 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white rounded-lg font-semibold disabled:opacity-50"
                                >
                                    {submitting ? 'Assigning...' : 'Confirm Camp Assignment'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* MODAL: ADD MEDICAL STAFF */}
            {showAddStaffModal && (
                <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
                    <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md p-6 shadow-2xl space-y-4">
                        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                            <h3 className="font-bold text-white text-base flex items-center gap-2">
                                <Stethoscope className="w-5 h-5 text-rose-500" />
                                <span>Register New Medical Staff</span>
                            </h3>
                            <button onClick={() => setShowAddStaffModal(false)} className="text-slate-400 hover:text-white">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <form onSubmit={handleAddStaff} className="space-y-3 text-xs">
                            <div>
                                <label className="block text-slate-300 font-semibold mb-1">Full Name</label>
                                <input
                                    type="text"
                                    required
                                    value={newStaff.name}
                                    onChange={(e) => setNewStaff({ ...newStaff, name: e.target.value })}
                                    placeholder="e.g. Dr. Nihal Senaratne"
                                    className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-lg text-white"
                                />
                            </div>

                            <div>
                                <label className="block text-slate-300 font-semibold mb-1">Clinical Role</label>
                                <select
                                    value={newStaff.role}
                                    onChange={(e) => setNewStaff({ ...newStaff, role: e.target.value })}
                                    className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-lg text-white"
                                >
                                    <option value="Medical Officer">Medical Officer (Doctor)</option>
                                    <option value="Phlebotomist">Phlebotomist</option>
                                    <option value="Screening Officer">Screening Officer</option>
                                    <option value="Camp Coordinator">Camp Coordinator</option>
                                    <option value="Lab Technician">Lab Technician</option>
                                    <option value="Administrator">Data Administrator</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-slate-300 font-semibold mb-1">Contact Phone</label>
                                <input
                                    type="text"
                                    required
                                    value={newStaff.contact}
                                    onChange={(e) => setNewStaff({ ...newStaff, contact: e.target.value })}
                                    placeholder="+94 7X XXX XXXX"
                                    className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-lg text-white"
                                />
                            </div>

                            <div>
                                <label className="block text-slate-300 font-semibold mb-1">Email Address</label>
                                <input
                                    type="email"
                                    required
                                    value={newStaff.email}
                                    onChange={(e) => setNewStaff({ ...newStaff, email: e.target.value })}
                                    placeholder="staff@lifeline.lk"
                                    className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-lg text-white"
                                />
                            </div>

                            <div>
                                <label className="block text-slate-300 font-semibold mb-1">Status</label>
                                <select
                                    value={newStaff.status}
                                    onChange={(e) => setNewStaff({ ...newStaff, status: e.target.value })}
                                    className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-lg text-white"
                                >
                                    <option value="ACTIVE">Active</option>
                                    <option value="ON_LEAVE">On Leave</option>
                                    <option value="INACTIVE">Inactive</option>
                                </select>
                            </div>

                            <div className="pt-2 flex justify-end gap-2">
                                <button
                                    type="button"
                                    onClick={() => setShowAddStaffModal(false)}
                                    className="px-3 py-2 text-slate-400 hover:text-white"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={submitting}
                                    className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-lg font-semibold disabled:opacity-50"
                                >
                                    {submitting ? 'Adding...' : 'Save Staff Member'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* MODAL: REGISTER VOLUNTEER */}
            {showAddVolModal && (
                <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
                    <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md p-6 shadow-2xl space-y-4">
                        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                            <h3 className="font-bold text-white text-base flex items-center gap-2">
                                <HeartHandshake className="w-5 h-5 text-emerald-500" />
                                <span>Register Community Volunteer</span>
                            </h3>
                            <button onClick={() => setShowAddVolModal(false)} className="text-slate-400 hover:text-white">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <form onSubmit={handleAddVolunteer} className="space-y-3 text-xs">
                            <div>
                                <label className="block text-slate-300 font-semibold mb-1">Full Name</label>
                                <input
                                    type="text"
                                    required
                                    value={newVolunteer.name}
                                    onChange={(e) => setNewVolunteer({ ...newVolunteer, name: e.target.value })}
                                    placeholder="e.g. Malith Perera"
                                    className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-lg text-white"
                                />
                            </div>

                            <div>
                                <label className="block text-slate-300 font-semibold mb-1">Contact Phone</label>
                                <input
                                    type="text"
                                    required
                                    value={newVolunteer.contact}
                                    onChange={(e) => setNewVolunteer({ ...newVolunteer, contact: e.target.value })}
                                    placeholder="+94 7X XXX XXXX"
                                    className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-lg text-white"
                                />
                            </div>

                            <div>
                                <label className="block text-slate-300 font-semibold mb-1">Email (Optional)</label>
                                <input
                                    type="email"
                                    value={newVolunteer.email}
                                    onChange={(e) => setNewVolunteer({ ...newVolunteer, email: e.target.value })}
                                    placeholder="volunteer@example.com"
                                    className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-lg text-white"
                                />
                            </div>

                            <div>
                                <label className="block text-slate-300 font-semibold mb-1">Skills / Specializations</label>
                                <input
                                    type="text"
                                    required
                                    value={newVolunteer.skills}
                                    onChange={(e) => setNewVolunteer({ ...newVolunteer, skills: e.target.value })}
                                    placeholder="e.g. First Aid, Registration, Logistics, Crowd Control"
                                    className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-lg text-white"
                                />
                                <p className="text-[10px] text-slate-500 mt-1">Separate multiple competencies with commas.</p>
                            </div>

                            <div className="pt-2 flex justify-end gap-2">
                                <button
                                    type="button"
                                    onClick={() => setShowAddVolModal(false)}
                                    className="px-3 py-2 text-slate-400 hover:text-white"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={submitting}
                                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-semibold disabled:opacity-50"
                                >
                                    {submitting ? 'Registering...' : 'Register Volunteer'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
