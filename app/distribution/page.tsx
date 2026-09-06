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
    Layers,
    PlusCircle,
    X,
    Search,
    Filter,
    Clock,
    Boxes,
    AlertTriangle,
    ShieldAlert,
    Trash2,
    Archive,
    Check,
    Sparkles
} from 'lucide-react';

interface HospitalRequest {
    REQUESTID: number;
    HOSPITALID?: number;
    HOSPITALNAME: string;
    HOSPITALLOCATION: string;
    PRIORITY: 'CRITICAL' | 'URGENT' | 'NORMAL';
    REQUIREDDATE: string;
    REQUESTSTATUS: string;
    REQUESTEDBY?: string;
    REQUESTITEMID: number;
    BLOODGROUP: string;
    COMPONENTTYPE: string;
    UNITSREQUESTED: number;
    UNITSFULFILLED: number;
    UNITSREMAINING: number;
}

interface BloodUnit {
    UNITID: number;
    DONATIONID?: number;
    BLOODGROUP: string;
    COMPONENTTYPE: string;
    VOLUME_ML: number;
    STORAGELOCATION: string;
    COLLECTIONDATE?: string;
    EXPIRYDATE: string;
    DAYSREMAINING: number;
    STATUS?: string;
}

interface StaffMember {
    STAFFID: number;
    NAME: string;
    ROLE: string;
}

interface HospitalOption {
    HOSPITALID: number;
    NAME: string;
    LOCATION: string;
    CONTACT: string;
    EMAIL: string;
}

interface DonationOption {
    DONATIONID: number;
    DONORID?: number;
    DONORNAME: string;
    BLOODGROUP: string;
    DONATIONDATE: string;
    CAMPNAME?: string;
}

export default function DistributionPage() {
    const [requests, setRequests] = useState<HospitalRequest[]>([]);
    const [availableUnits, setAvailableUnits] = useState<BloodUnit[]>([]);
    const [staffList, setStaffList] = useState<StaffMember[]>([]);
    const [hospitals, setHospitals] = useState<HospitalOption[]>([]);
    const [donations, setDonations] = useState<DonationOption[]>([]);
    const [loading, setLoading] = useState(true);
    const [dispatching, setDispatching] = useState(false);

    // Active Tab View: Requisitions vs Inventory
    const [activeTab, setActiveTab] = useState<'requisitions' | 'inventory'>('requisitions');

    // Inventory Search & Filter State
    const [inventorySearch, setInventorySearch] = useState('');
    const [filterBg, setFilterBg] = useState('ALL');
    const [filterComponent, setFilterComponent] = useState('ALL');

    // Selected item for dispatch modal
    const [activeItem, setActiveItem] = useState<HospitalRequest | null>(null);
    const [selectedUnitId, setSelectedUnitId] = useState<string>('');
    const [selectedStaffId, setSelectedStaffId] = useState<string>('');
    const [dispatchNotes, setDispatchNotes] = useState<string>('');
    const [banner, setBanner] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

    // Add New Requisition Item Modal State
    const [showReqModal, setShowReqModal] = useState(false);
    const [reqHospitalId, setReqHospitalId] = useState('');
    const [reqDoctor, setReqDoctor] = useState('');
    const [reqPriority, setReqPriority] = useState<'CRITICAL' | 'URGENT' | 'NORMAL'>('URGENT');
    const [reqRequiredDate, setReqRequiredDate] = useState('');
    const [reqBloodGroup, setReqBloodGroup] = useState('O+');
    const [reqComponentType, setReqComponentType] = useState('WHOLE_BLOOD');
    const [reqUnits, setReqUnits] = useState('2');
    const [savingReq, setSavingReq] = useState(false);
    const [reqBanner, setReqBanner] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

    // Add New Hospital Modal State
    const [showHospitalModal, setShowHospitalModal] = useState(false);
    const [newHospitalName, setNewHospitalName] = useState('');
    const [newHospitalLocation, setNewHospitalLocation] = useState('');
    const [newHospitalContact, setNewHospitalContact] = useState('');
    const [newHospitalEmail, setNewHospitalEmail] = useState('');
    const [savingHospital, setSavingHospital] = useState(false);
    const [hospitalBanner, setHospitalBanner] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

    // Add Blood Inventory Unit Modal State
    const [showAddUnitModal, setShowAddUnitModal] = useState(false);
    const [unitDonationId, setUnitDonationId] = useState('');
    const [unitBloodGroup, setUnitBloodGroup] = useState('O+');
    const [unitComponentType, setUnitComponentType] = useState('WHOLE_BLOOD');
    const [unitVolume, setUnitVolume] = useState('450');
    const [unitStorageLoc, setUnitStorageLoc] = useState('FRIDGE-A-SHELF-1');
    const [unitCollectionDate, setUnitCollectionDate] = useState('');
    const [savingUnit, setSavingUnit] = useState(false);
    const [unitBanner, setUnitBanner] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

    // Remove / Discard Blood Unit Modal State
    const [showRemoveModal, setShowRemoveModal] = useState(false);
    const [selectedRemoveUnit, setSelectedRemoveUnit] = useState<BloodUnit | null>(null);
    const [removeActionType, setRemoveActionType] = useState<'discard' | 'delete'>('discard');
    const [discardReason, setDiscardReason] = useState('Expired / Past Shelf Life');
    const [removingUnitLoading, setRemovingUnitLoading] = useState(false);
    const [removeBanner, setRemoveBanner] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

    const loadData = async () => {
        try {
            setLoading(true);
            const res = await fetch('/api/distribution');
            const json = await res.json();
            if (json.success) {
                setRequests(json.requests || []);
                setAvailableUnits(json.availableUnits || []);
                setStaffList(json.staff || []);
                setHospitals(json.hospitals || []);

                let donationList: DonationOption[] = json.donations || [];

                // If not provided in distribution, fetch from /api/inventory
                if (!donationList || donationList.length === 0) {
                    try {
                        const invRes = await fetch('/api/inventory');
                        const invJson = await invRes.json();
                        if (invJson.success && invJson.donations?.length > 0) {
                            donationList = invJson.donations;
                        }
                    } catch {
                        // ignore
                    }
                }

                if (donationList.length > 0) {
                    setDonations(donationList);
                    if (!unitDonationId) {
                        setUnitDonationId(String(donationList[0].DONATIONID));
                        setUnitBloodGroup(donationList[0].BLOODGROUP || 'O+');
                    }
                }

                if (json.staff?.length > 0 && !selectedStaffId) {
                    setSelectedStaffId(String(json.staff[0].STAFFID));
                }
                if (json.hospitals?.length > 0 && !reqHospitalId) {
                    setReqHospitalId(String(json.hospitals[0].HOSPITALID));
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

    const openCreateRequisitionModal = () => {
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 2);
        const dateStr = tomorrow.toISOString().split('T')[0];

        setReqHospitalId(hospitals.length > 0 ? String(hospitals[0].HOSPITALID) : '');
        setReqDoctor('');
        setReqPriority('URGENT');
        setReqRequiredDate(dateStr);
        setReqBloodGroup('O+');
        setReqComponentType('WHOLE_BLOOD');
        setReqUnits('2');
        setReqBanner(null);
        setShowReqModal(true);
    };

    const handleCreateRequisition = async (e: React.FormEvent) => {
        e.preventDefault();
        setSavingReq(true);
        setReqBanner(null);

        try {
            const res = await fetch('/api/distribution', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: 'create_requisition',
                    hospitalId: reqHospitalId,
                    requestedBy: reqDoctor,
                    priority: reqPriority,
                    requiredDate: reqRequiredDate,
                    bloodGroup: reqBloodGroup,
                    componentType: reqComponentType,
                    unitsRequested: parseInt(reqUnits, 10),
                }),
            });

            const json = await res.json();
            if (json.success) {
                setBanner({ type: 'success', message: json.message });
                await loadData();
                setShowReqModal(false);
                setActiveTab('requisitions');
            } else {
                setReqBanner({ type: 'error', message: json.error || 'Failed to register requisition.' });
            }
        } catch (err: any) {
            setReqBanner({ type: 'error', message: err.message || 'Network error registering requisition.' });
        } finally {
            setSavingReq(false);
        }
    };

    const handleAddHospital = async (e: React.FormEvent) => {
        e.preventDefault();
        setSavingHospital(true);
        setHospitalBanner(null);

        try {
            const res = await fetch('/api/hospitals', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: newHospitalName,
                    location: newHospitalLocation,
                    contact: newHospitalContact,
                    email: newHospitalEmail,
                }),
            });

            const json = await res.json();
            if (json.success) {
                setHospitalBanner({ type: 'success', message: json.message });
                setHospitals((prev) => [...prev, json.hospital]);
                setReqHospitalId(String(json.hospital.HOSPITALID));
                setTimeout(() => {
                    setShowHospitalModal(false);
                    setNewHospitalName('');
                    setNewHospitalLocation('');
                    setNewHospitalContact('');
                    setNewHospitalEmail('');
                    setHospitalBanner(null);
                }, 1000);
            } else {
                setHospitalBanner({ type: 'error', message: json.error || 'Failed to register hospital.' });
            }
        } catch (err: any) {
            setHospitalBanner({ type: 'error', message: err.message || 'Network error registering hospital.' });
        } finally {
            setSavingHospital(false);
        }
    };

    const openAddUnitModal = () => {
        setUnitBanner(null);
        if (donations.length > 0) {
            setUnitDonationId(String(donations[0].DONATIONID));
            setUnitBloodGroup(donations[0].BLOODGROUP || 'O+');
        }
        setUnitComponentType('WHOLE_BLOOD');
        setUnitVolume('450');
        setUnitStorageLoc('FRIDGE-A-SHELF-1');
        setUnitCollectionDate(new Date().toISOString().split('T')[0]);
        setShowAddUnitModal(true);
    };

    const handleDonationChange = (id: string) => {
        setUnitDonationId(id);
        const matched = donations.find((d) => String(d.DONATIONID) === id);
        if (matched && matched.BLOODGROUP) {
            setUnitBloodGroup(matched.BLOODGROUP);
        }
    };

    const handleComponentChange = (type: string) => {
        setUnitComponentType(type);
        if (type === 'PLATELETS') setUnitVolume('250');
        else if (type === 'PLASMA') setUnitVolume('250');
        else if (type === 'RED_CELLS') setUnitVolume('300');
        else setUnitVolume('450');
    };

    const handleAddUnit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSavingUnit(true);
        setUnitBanner(null);

        try {
            const res = await fetch('/api/distribution', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: 'add_unit',
                    donationId: unitDonationId,
                    bloodGroup: unitBloodGroup,
                    componentType: unitComponentType,
                    volumeMl: parseInt(unitVolume, 10),
                    storageLocation: unitStorageLoc,
                    collectionDate: unitCollectionDate || undefined,
                }),
            });

            const json = await res.json();
            if (json.success) {
                setUnitBanner({ type: 'success', message: json.message });
                await loadData();
                setTimeout(() => {
                    setShowAddUnitModal(false);
                    setUnitBanner(null);
                }, 1200);
            } else {
                setUnitBanner({ type: 'error', message: json.error || 'Failed to add inventory unit.' });
            }
        } catch (err: any) {
            setUnitBanner({ type: 'error', message: err.message || 'Network error registering unit.' });
        } finally {
            setSavingUnit(false);
        }
    };

    const openRemoveModal = (unit: BloodUnit) => {
        setSelectedRemoveUnit(unit);
        setRemoveActionType('discard');
        setDiscardReason('Expired / Past Shelf Life');
        setRemoveBanner(null);
        setShowRemoveModal(true);
    };

    const handleRemoveUnit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedRemoveUnit) return;
        setRemovingUnitLoading(true);
        setRemoveBanner(null);

        try {
            const res = await fetch('/api/distribution', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: removeActionType === 'delete' ? 'delete_unit' : 'discard_unit',
                    unitId: selectedRemoveUnit.UNITID,
                    reason: discardReason,
                }),
            });

            const json = await res.json();
            if (json.success) {
                setRemoveBanner({ type: 'success', message: json.message });
                await loadData();
                setTimeout(() => {
                    setShowRemoveModal(false);
                    setSelectedRemoveUnit(null);
                    setRemoveBanner(null);
                }, 1100);
            } else {
                setRemoveBanner({ type: 'error', message: json.error || 'Failed to update unit.' });
            }
        } catch (err: any) {
            setRemoveBanner({ type: 'error', message: err.message || 'Network error removing unit.' });
        } finally {
            setRemovingUnitLoading(false);
        }
    };

    // Filtered inventory units
    const filteredUnits = availableUnits.filter((u) => {
        const matchesBg = filterBg === 'ALL' || u.BLOODGROUP === filterBg;
        const matchesComp = filterComponent === 'ALL' || u.COMPONENTTYPE === filterComponent;
        const searchLow = inventorySearch.toLowerCase();
        const matchesSearch =
            !inventorySearch ||
            String(u.UNITID).includes(searchLow) ||
            u.STORAGELOCATION.toLowerCase().includes(searchLow) ||
            (u.DONATIONID && String(u.DONATIONID).includes(searchLow));
        return matchesBg && matchesComp && matchesSearch;
    });

    // Units matching the modal selection
    const modalMatchingUnits = availableUnits.filter(
        (u) => u.BLOODGROUP === reqBloodGroup && u.COMPONENTTYPE === reqComponentType
    ).length;

    // Inventory Stats
    const totalInventoryCount = availableUnits.length;
    const expiringSoonCount = availableUnits.filter((u) => u.DAYSREMAINING <= 7).length;
    const plateletsCount = availableUnits.filter((u) => u.COMPONENTTYPE === 'PLATELETS').length;
    const wholeBloodCount = availableUnits.filter((u) => u.COMPONENTTYPE === 'WHOLE_BLOOD').length;
    const redCellsCount = availableUnits.filter((u) => u.COMPONENTTYPE === 'RED_CELLS').length;
    const plasmaCount = availableUnits.filter((u) => u.COMPONENTTYPE === 'PLASMA').length;

    return (
        <div className="max-w-7xl mx-auto p-6 md:p-10">
            {/* Header */}
            <div className="border-b border-slate-800 pb-6 mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-white flex items-center gap-3">
                        <Truck className="h-8 w-8 text-rose-500" />
                        Hospital Requisitions & Blood Inventory
                    </h1>
                    <p className="text-slate-400 text-sm mt-1">
                        Track serialized inventory units and fulfill requisitions verified by Oracle trigger <code className="text-rose-400">TRG_AFTER_DISTRIBUTION</code>
                    </p>
                </div>
                <div className="flex flex-wrap items-center gap-2.5">
                    <button
                        onClick={openAddUnitModal}
                        className="flex items-center gap-1.5 bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-500 hover:to-teal-600 text-white text-xs md:text-sm font-semibold px-3.5 py-2.5 rounded-xl border border-emerald-500/30 transition active:scale-95 shadow-lg shadow-emerald-950/40"
                    >
                        <Droplet className="h-4 w-4" />
                        + Add Blood Unit
                    </button>
                    <button
                        onClick={() => {
                            setHospitalBanner(null);
                            setShowHospitalModal(true);
                        }}
                        className="flex items-center gap-1.5 bg-slate-800/90 hover:bg-slate-700 text-slate-200 text-xs md:text-sm font-semibold px-3.5 py-2.5 rounded-xl border border-slate-700 transition active:scale-95 shadow"
                    >
                        <Building2 className="h-4 w-4 text-rose-400" />
                        + Hospital
                    </button>
                    <button
                        onClick={openCreateRequisitionModal}
                        className="flex items-center gap-2 bg-gradient-to-r from-rose-600 to-rose-700 hover:from-rose-500 hover:to-rose-600 text-white text-xs md:text-sm font-semibold px-4 py-2.5 rounded-xl shadow-lg shadow-rose-950/50 border border-rose-500/30 transition transform active:scale-95"
                    >
                        <PlusCircle className="h-4 w-4" />
                        + New Requisition Item
                    </button>
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

            {/* Navigation Tabs */}
            <div className="flex items-center gap-3 mb-6 border-b border-slate-800/80 pb-4">
                <button
                    onClick={() => setActiveTab('requisitions')}
                    className={`flex items-center gap-2 text-xs md:text-sm font-semibold px-4 py-2.5 rounded-xl border transition ${activeTab === 'requisitions'
                        ? 'bg-rose-600 text-white border-rose-500 shadow-md'
                        : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-white hover:border-slate-700'
                        }`}
                >
                    <PackageCheck className="h-4 w-4" />
                    Hospital Requisitions ({requests.length})
                </button>

                <button
                    onClick={() => setActiveTab('inventory')}
                    className={`flex items-center gap-2 text-xs md:text-sm font-semibold px-4 py-2.5 rounded-xl border transition ${activeTab === 'inventory'
                        ? 'bg-rose-600 text-white border-rose-500 shadow-md'
                        : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-white hover:border-slate-700'
                        }`}
                >
                    <Layers className="h-4 w-4" />
                    Available Inventory Units ({availableUnits.length})
                    {expiringSoonCount > 0 && (
                        <span className="ml-1 px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                            {expiringSoonCount} expiring
                        </span>
                    )}
                </button>
            </div>

            {/* TAB 1: HOSPITAL REQUISITIONS */}
            {activeTab === 'requisitions' && (
                <div className="space-y-6">
                    <div className="flex items-center justify-between">
                        <h2 className="text-lg font-bold text-white flex items-center gap-2">
                            <PackageCheck className="h-5 w-5 text-rose-500" />
                            Open Hospital Requisition Items ({requests.length})
                        </h2>
                        <button
                            onClick={openCreateRequisitionModal}
                            className="text-xs text-rose-400 hover:text-rose-300 font-semibold flex items-center gap-1"
                        >
                            <PlusCircle className="h-3.5 w-3.5" />
                            Add Requisition Item
                        </button>
                    </div>

                    {loading ? (
                        <div className="py-20 text-center text-slate-400">Loading requisitions from Oracle PDB...</div>
                    ) : requests.length === 0 ? (
                        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-12 text-center">
                            <CheckCircle2 className="h-12 w-12 text-emerald-400 mx-auto mb-3 opacity-80" />
                            <h3 className="text-lg font-bold text-white mb-1">All Hospital Requisitions Fulfilled!</h3>
                            <p className="text-slate-400 text-xs mb-6 max-w-md mx-auto">
                                There are currently no pending hospital blood requests. You can register a new requisition item when an emergency or standard requisition arrives.
                            </p>
                            <button
                                onClick={openCreateRequisitionModal}
                                className="inline-flex items-center gap-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold px-4 py-2.5 rounded-xl shadow transition"
                            >
                                <PlusCircle className="h-4 w-4" />
                                Create Hospital Requisition Item
                            </button>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {requests.map((req) => {
                                const matchingUnits = availableUnits.filter(
                                    (u) => u.BLOODGROUP === req.BLOODGROUP && u.COMPONENTTYPE === req.COMPONENTTYPE
                                );
                                const matchingCount = matchingUnits.length;
                                const fulfilledPct = Math.round((req.UNITSFULFILLED / req.UNITSREQUESTED) * 100);

                                return (
                                    <div
                                        key={req.REQUESTITEMID}
                                        className="bg-slate-900 border border-slate-800 rounded-xl p-5 flex flex-col justify-between shadow-lg relative overflow-hidden"
                                    >
                                        <div
                                            className={`absolute top-0 left-0 right-0 h-1 ${req.PRIORITY === 'CRITICAL'
                                                ? 'bg-red-500 animate-pulse'
                                                : req.PRIORITY === 'URGENT'
                                                    ? 'bg-amber-500'
                                                    : 'bg-blue-500'
                                                }`}
                                        />

                                        <div>
                                            <div className="flex items-start justify-between gap-2">
                                                <div>
                                                    <span
                                                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${req.PRIORITY === 'CRITICAL'
                                                            ? 'bg-red-950 text-red-400 border border-red-800'
                                                            : req.PRIORITY === 'URGENT'
                                                                ? 'bg-amber-950 text-amber-300 border border-amber-800'
                                                                : 'bg-blue-950 text-blue-300 border border-blue-800'
                                                            }`}
                                                    >
                                                        {req.PRIORITY} PRIORITY
                                                    </span>
                                                    <h3 className="text-base font-bold text-white mt-1.5 flex items-center gap-1.5">
                                                        <Building2 className="h-4 w-4 text-slate-400 shrink-0" />
                                                        {req.HOSPITALNAME}
                                                    </h3>
                                                    <p className="text-[11px] text-slate-500">
                                                        {req.HOSPITALLOCATION} • Req #{req.REQUESTID}
                                                    </p>
                                                </div>

                                                <div className="bg-rose-950/60 border border-rose-800/80 px-2.5 py-1 rounded-lg text-center">
                                                    <span className="text-[10px] text-slate-400 block font-semibold">Group</span>
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
            )}

            {/* TAB 2: AVAILABLE INVENTORY UNITS */}
            {activeTab === 'inventory' && (
                <div className="space-y-6">
                    {/* Inventory KPI Summary Cards */}
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                        <div className="bg-slate-900 border border-slate-800 rounded-xl p-3.5">
                            <span className="text-[11px] text-slate-400 font-medium block">Total Units</span>
                            <span className="text-xl font-bold text-white">{totalInventoryCount}</span>
                        </div>
                        <div className="bg-slate-900 border border-slate-800 rounded-xl p-3.5">
                            <span className="text-[11px] text-slate-400 font-medium block">Whole Blood</span>
                            <span className="text-xl font-bold text-rose-400">{wholeBloodCount}</span>
                        </div>
                        <div className="bg-slate-900 border border-slate-800 rounded-xl p-3.5">
                            <span className="text-[11px] text-slate-400 font-medium block">Red Cells</span>
                            <span className="text-xl font-bold text-red-400">{redCellsCount}</span>
                        </div>
                        <div className="bg-slate-900 border border-slate-800 rounded-xl p-3.5">
                            <span className="text-[11px] text-slate-400 font-medium block">Platelets</span>
                            <span className="text-xl font-bold text-amber-400">{plateletsCount}</span>
                        </div>
                        <div className="bg-slate-900 border border-slate-800 rounded-xl p-3.5">
                            <span className="text-[11px] text-slate-400 font-medium block">Plasma</span>
                            <span className="text-xl font-bold text-cyan-400">{plasmaCount}</span>
                        </div>
                        <div className="bg-slate-900 border border-amber-900/40 rounded-xl p-3.5">
                            <span className="text-[11px] text-amber-400 font-medium flex items-center gap-1">
                                <Clock className="h-3 w-3" /> Expiring &le; 7d
                            </span>
                            <span className="text-xl font-bold text-amber-300">{expiringSoonCount}</span>
                        </div>
                    </div>

                    {/* Filter & Search Controls */}
                    <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
                        <div className="flex items-center gap-2 w-full sm:w-auto flex-1 max-w-md">
                            <Search className="h-4 w-4 text-slate-500 shrink-0" />
                            <input
                                type="text"
                                placeholder="Search by Unit ID, Storage Location (e.g. FRIDGE-A)..."
                                value={inventorySearch}
                                onChange={(e) => setInventorySearch(e.target.value)}
                                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-rose-500"
                            />
                        </div>                        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
                            <div className="flex items-center gap-1">
                                <span className="text-slate-400 font-medium">Group:</span>
                                <select
                                    value={filterBg}
                                    onChange={(e) => setFilterBg(e.target.value)}
                                    className="bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-slate-200"
                                >
                                    <option value="ALL">All Groups</option>
                                    {['O+', 'O-', 'A+', 'A-', 'B+', 'B-', 'AB+', 'AB-'].map((bg) => (
                                        <option key={bg} value={bg}>{bg}</option>
                                    ))}
                                </select>
                            </div>

                            <div className="flex items-center gap-1">
                                <span className="text-slate-400 font-medium">Type:</span>
                                <select
                                    value={filterComponent}
                                    onChange={(e) => setFilterComponent(e.target.value)}
                                    className="bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-slate-200"
                                >
                                    <option value="ALL">All Components</option>
                                    <option value="WHOLE_BLOOD">Whole Blood</option>
                                    <option value="RED_CELLS">Red Cells</option>
                                    <option value="PLATELETS">Platelets</option>
                                    <option value="PLASMA">Plasma</option>
                                </select>
                            </div>

                            <button
                                onClick={openAddUnitModal}
                                className="flex items-center gap-1.5 bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-500 hover:to-teal-600 text-white text-xs font-semibold px-3 py-1.5 rounded-lg border border-emerald-500/30 transition active:scale-95 shadow shrink-0 ml-auto sm:ml-2"
                            >
                                <Droplet className="h-3.5 w-3.5" />
                                + Add Unit
                            </button>
                        </div>
                    </div>

                    {/* Inventory Table */}
                    {filteredUnits.length === 0 ? (
                        <div className="py-16 text-center text-slate-500 bg-slate-900 border border-slate-800 rounded-xl text-xs">
                            No blood units match the specified filters.
                        </div>
                    ) : (
                        <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-lg">
                            <div className="overflow-x-auto">
                                <table className="w-full text-left text-xs">
                                    <thead>
                                        <tr className="border-b border-slate-800 bg-slate-950/60 text-slate-400 uppercase font-semibold">
                                            <th className="py-3 px-4">Unit Serial</th>
                                            <th className="py-3 px-4">Blood Group</th>
                                            <th className="py-3 px-4">Component</th>
                                            <th className="py-3 px-4">Volume</th>
                                            <th className="py-3 px-4">Storage Location</th>
                                            <th className="py-3 px-4">Collected</th>
                                            <th className="py-3 px-4">Expiry Date</th>
                                            <th className="py-3 px-4">Shelf Life Remaining</th>
                                            <th className="py-3 px-4">Status</th>
                                            <th className="py-3 px-4 text-right">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-800/60">
                                        {filteredUnits.map((unit) => {
                                            const isCritical = unit.DAYSREMAINING <= 3;
                                            const isWarning = unit.DAYSREMAINING <= 7;

                                            return (
                                                <tr key={unit.UNITID} className="hover:bg-slate-800/30 transition">
                                                    <td className="py-3 px-4 font-mono font-bold text-slate-200">
                                                        #{unit.UNITID}
                                                        {unit.DONATIONID && (
                                                            <span className="block text-[10px] text-slate-500 font-normal">
                                                                Donation #{unit.DONATIONID}
                                                            </span>
                                                        )}
                                                    </td>
                                                    <td className="py-3 px-4">
                                                        <span className="inline-block font-mono font-black text-rose-400 bg-rose-950/50 border border-rose-800/60 px-2 py-0.5 rounded">
                                                            {unit.BLOODGROUP}
                                                        </span>
                                                    </td>
                                                    <td className="py-3 px-4 text-slate-200 font-medium">
                                                        {unit.COMPONENTTYPE}
                                                    </td>
                                                    <td className="py-3 px-4 text-slate-300 font-mono">
                                                        {unit.VOLUME_ML} ml
                                                    </td>
                                                    <td className="py-3 px-4 font-mono text-slate-300">
                                                        <span className="px-2 py-0.5 rounded bg-slate-950 border border-slate-800">
                                                            {unit.STORAGELOCATION}
                                                        </span>
                                                    </td>
                                                    <td className="py-3 px-4 text-slate-400">
                                                        {unit.COLLECTIONDATE || '-'}
                                                    </td>
                                                    <td className="py-3 px-4 text-slate-300 font-mono">
                                                        {unit.EXPIRYDATE}
                                                    </td>
                                                    <td className="py-3 px-4">
                                                        <span
                                                            className={`inline-flex items-center gap-1 font-mono font-bold px-2 py-0.5 rounded text-[11px] ${isCritical
                                                                ? 'bg-red-950/80 text-red-400 border border-red-800'
                                                                : isWarning
                                                                    ? 'bg-amber-950/80 text-amber-300 border border-amber-800'
                                                                    : 'bg-emerald-950/80 text-emerald-300 border border-emerald-800'
                                                                }`}
                                                        >
                                                            <Clock className="h-3 w-3" />
                                                            {unit.DAYSREMAINING} days
                                                        </span>
                                                    </td>
                                                    <td className="py-3 px-4">
                                                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-950 text-emerald-400 border border-emerald-800 uppercase">
                                                            {unit.STATUS || 'AVAILABLE'}
                                                        </span>
                                                    </td>
                                                    <td className="py-3 px-4 text-right whitespace-nowrap">
                                                        <button
                                                            onClick={() => openRemoveModal(unit)}
                                                            className="inline-flex items-center gap-1 text-[11px] font-medium text-rose-400 hover:text-white bg-rose-950/40 hover:bg-rose-900 border border-rose-800/60 rounded-lg px-2.5 py-1 transition"
                                                            title="Discard or permanently delete unit"
                                                        >
                                                            <Trash2 className="h-3 w-3" />
                                                            Discard / Remove
                                                        </button>
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* Dispatch Action Modal */}
            {activeItem && (
                <div className="fixed inset-0 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4 z-50">
                    <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 max-w-md w-full shadow-2xl animate-in fade-in zoom-in duration-200">
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

            {/* Create New Hospital Requisition Modal */}
            {showReqModal && (
                <div className="fixed inset-0 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 z-50 overflow-y-auto">
                    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 md:p-8 max-w-lg w-full shadow-2xl relative my-8 animate-in fade-in zoom-in duration-200">
                        <button
                            onClick={() => setShowReqModal(false)}
                            className="absolute top-5 right-5 text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition"
                        >
                            <X className="h-5 w-5" />
                        </button>

                        <div className="flex items-center gap-3 mb-2">
                            <div className="p-2.5 rounded-xl bg-rose-950/80 border border-rose-800/80 text-rose-400">
                                <PlusCircle className="h-6 w-6" />
                            </div>
                            <div>
                                <h2 className="text-xl font-bold text-white">Add Hospital Requisition Item</h2>

                            </div>
                        </div>

                        {reqBanner && (
                            <div
                                className={`mt-4 p-3 rounded-xl border flex items-center gap-2.5 text-xs ${reqBanner.type === 'success'
                                    ? 'bg-emerald-950/60 border-emerald-800 text-emerald-300'
                                    : 'bg-red-950/60 border-red-800 text-red-300'
                                    }`}
                            >
                                {reqBanner.type === 'success' ? (
                                    <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-400" />
                                ) : (
                                    <AlertCircle className="h-4 w-4 shrink-0 text-rose-400" />
                                )}
                                <span>{reqBanner.message}</span>
                            </div>
                        )}

                        <form onSubmit={handleCreateRequisition} className="mt-5 space-y-4 text-xs">
                            <div>
                                <div className="flex items-center justify-between mb-1.5">
                                    <label className="text-slate-300 font-semibold flex items-center gap-1.5">
                                        <Building2 className="h-3.5 w-3.5 text-rose-400" />
                                        Hospital <span className="text-rose-500">*</span>
                                    </label>
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setHospitalBanner(null);
                                            setShowHospitalModal(true);
                                        }}
                                        className="text-[11px] text-rose-400 hover:text-rose-300 font-medium hover:underline flex items-center gap-0.5"
                                    >
                                        + Add New Hospital
                                    </button>
                                </div>
                                <select
                                    required
                                    value={reqHospitalId}
                                    onChange={(e) => setReqHospitalId(e.target.value)}
                                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-slate-200 focus:outline-none focus:border-rose-500 transition"
                                >
                                    <option value="" disabled>Select receiving hospital</option>
                                    {hospitals.map((h) => (
                                        <option key={h.HOSPITALID} value={h.HOSPITALID}>
                                            {h.NAME} ({h.LOCATION})
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-slate-300 mb-1 font-semibold">
                                        Requesting Doctor / Officer <span className="text-rose-500">*</span>
                                    </label>
                                    <input
                                        required
                                        type="text"
                                        placeholder="e.g. Dr. Priyantha - ER Lead"
                                        value={reqDoctor}
                                        onChange={(e) => setReqDoctor(e.target.value)}
                                        className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-slate-200 focus:outline-none focus:border-rose-500 transition"
                                    />
                                </div>

                                <div>
                                    <label className="block text-slate-300 mb-1 font-semibold">
                                        Clinical Priority <span className="text-rose-500">*</span>
                                    </label>
                                    <select
                                        value={reqPriority}
                                        onChange={(e) => setReqPriority(e.target.value as any)}
                                        className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-slate-200 focus:outline-none focus:border-rose-500 transition"
                                    >
                                        <option value="CRITICAL">CRITICAL (Immediate Emergency)</option>
                                        <option value="URGENT">URGENT (Within 24 Hours)</option>
                                        <option value="NORMAL">NORMAL (Scheduled Surgery)</option>
                                    </select>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                                <div>
                                    <label className="block text-slate-300 mb-1 font-semibold">
                                        Blood Group <span className="text-rose-500">*</span>
                                    </label>
                                    <select
                                        value={reqBloodGroup}
                                        onChange={(e) => setReqBloodGroup(e.target.value)}
                                        className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-slate-200 font-mono font-bold focus:outline-none focus:border-rose-500 transition"
                                    >
                                        {['O+', 'O-', 'A+', 'A-', 'B+', 'B-', 'AB+', 'AB-'].map((bg) => (
                                            <option key={bg} value={bg}>{bg}</option>
                                        ))}
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-slate-300 mb-1 font-semibold">
                                        Component <span className="text-rose-500">*</span>
                                    </label>
                                    <select
                                        value={reqComponentType}
                                        onChange={(e) => setReqComponentType(e.target.value)}
                                        className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-slate-200 focus:outline-none focus:border-rose-500 transition"
                                    >
                                        <option value="WHOLE_BLOOD">Whole Blood</option>
                                        <option value="RED_CELLS">Red Cells</option>
                                        <option value="PLATELETS">Platelets</option>
                                        <option value="PLASMA">Plasma</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-slate-300 mb-1 font-semibold">
                                        Units Requested <span className="text-rose-500">*</span>
                                    </label>
                                    <input
                                        required
                                        type="number"
                                        min="1"
                                        max="50"
                                        value={reqUnits}
                                        onChange={(e) => setReqUnits(e.target.value)}
                                        className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-slate-200 font-mono focus:outline-none focus:border-rose-500 transition"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-slate-300 mb-1 font-semibold flex items-center gap-1.5">
                                    <Calendar className="h-3.5 w-3.5 text-slate-400" />
                                    Required By Date <span className="text-rose-500">*</span>
                                </label>
                                <input
                                    required
                                    type="date"
                                    value={reqRequiredDate}
                                    onChange={(e) => setReqRequiredDate(e.target.value)}
                                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-slate-200 focus:outline-none focus:border-rose-500 transition"
                                />
                            </div>

                            {/* Live Stock Matching Indicator */}
                            <div className="p-3 bg-slate-950/80 rounded-xl border border-slate-800 flex items-center justify-between text-xs">
                                <span className="text-slate-400">Current Available Stock ({reqBloodGroup} {reqComponentType}):</span>
                                <span
                                    className={`font-mono font-bold ${modalMatchingUnits >= parseInt(reqUnits || '1', 10)
                                        ? 'text-emerald-400'
                                        : modalMatchingUnits > 0
                                            ? 'text-amber-400'
                                            : 'text-rose-400'
                                        }`}
                                >
                                    {modalMatchingUnits} units in stock
                                </span>
                            </div>

                            <div className="flex justify-end gap-3 pt-2">
                                <button
                                    type="button"
                                    onClick={() => setShowReqModal(false)}
                                    className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium transition"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={savingReq || !reqHospitalId || !reqDoctor || !reqRequiredDate}
                                    className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-rose-600 to-rose-700 hover:from-rose-500 hover:to-rose-600 disabled:opacity-50 text-white font-semibold flex items-center gap-2 shadow-lg shadow-rose-950/40 transition"
                                >
                                    {savingReq ? 'Registering in Oracle...' : 'Register Requisition Item'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Register New Hospital Modal */}
            {showHospitalModal && (
                <div className="fixed inset-0 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 z-[60] overflow-y-auto">
                    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 md:p-8 max-w-md w-full shadow-2xl relative my-8 animate-in fade-in zoom-in duration-200">
                        <button
                            onClick={() => setShowHospitalModal(false)}
                            className="absolute top-5 right-5 text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition"
                        >
                            <X className="h-5 w-5" />
                        </button>

                        <div className="flex items-center gap-3 mb-2">
                            <div className="p-2.5 rounded-xl bg-rose-950/80 border border-rose-800/80 text-rose-400">
                                <Building2 className="h-6 w-6" />
                            </div>
                            <div>
                                <h2 className="text-lg font-bold text-white">Register Hospital</h2>
                            </div>
                        </div>

                        {hospitalBanner && (
                            <div
                                className={`mt-4 p-3 rounded-xl border flex items-center gap-2.5 text-xs ${hospitalBanner.type === 'success'
                                    ? 'bg-emerald-950/60 border-emerald-800 text-emerald-300'
                                    : 'bg-red-950/60 border-red-800 text-red-300'
                                    }`}
                            >
                                {hospitalBanner.type === 'success' ? (
                                    <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-400" />
                                ) : (
                                    <AlertCircle className="h-4 w-4 shrink-0 text-rose-400" />
                                )}
                                <span>{hospitalBanner.message}</span>
                            </div>
                        )}

                        <form onSubmit={handleAddHospital} className="mt-4 space-y-3.5 text-xs">
                            <div>
                                <label className="block text-slate-300 mb-1 font-semibold">
                                    Hospital Name <span className="text-rose-500">*</span>
                                </label>
                                <input
                                    required
                                    type="text"
                                    placeholder="e.g. Sri Jayewardenepura General Hospital"
                                    value={newHospitalName}
                                    onChange={(e) => setNewHospitalName(e.target.value)}
                                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-slate-200 focus:outline-none focus:border-rose-500 transition"
                                />
                            </div>

                            <div>
                                <label className="block text-slate-300 mb-1 font-semibold">
                                    Location / City <span className="text-rose-500">*</span>
                                </label>
                                <input
                                    required
                                    type="text"
                                    placeholder="e.g. Kotte, Colombo"
                                    value={newHospitalLocation}
                                    onChange={(e) => setNewHospitalLocation(e.target.value)}
                                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-slate-200 focus:outline-none focus:border-rose-500 transition"
                                />
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-slate-300 mb-1 font-semibold">
                                        Contact Phone <span className="text-rose-500">*</span>
                                    </label>
                                    <input
                                        required
                                        type="text"
                                        placeholder="e.g. +94 11 277 8610"
                                        value={newHospitalContact}
                                        onChange={(e) => setNewHospitalContact(e.target.value)}
                                        className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-slate-200 focus:outline-none focus:border-rose-500 transition"
                                    />
                                </div>
                                <div>
                                    <label className="block text-slate-300 mb-1 font-semibold">
                                        Official Email <span className="text-rose-500">*</span>
                                    </label>
                                    <input
                                        required
                                        type="email"
                                        placeholder="e.g. bloodbank@sjgh.health.lk"
                                        value={newHospitalEmail}
                                        onChange={(e) => setNewHospitalEmail(e.target.value)}
                                        className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-slate-200 focus:outline-none focus:border-rose-500 transition"
                                    />
                                </div>
                            </div>

                            <div className="flex justify-end gap-2.5 pt-2">
                                <button
                                    type="button"
                                    onClick={() => setShowHospitalModal(false)}
                                    className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium transition"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={savingHospital || !newHospitalName || !newHospitalLocation || !newHospitalContact || !newHospitalEmail}
                                    className="px-4 py-2 rounded-xl bg-gradient-to-r from-rose-600 to-rose-700 hover:from-rose-500 hover:to-rose-600 disabled:opacity-50 text-white font-semibold transition"
                                >
                                    {savingHospital ? 'Registering in Oracle...' : 'Save Hospital'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Add Blood Inventory Unit Modal */}
            {showAddUnitModal && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50 overflow-y-auto">
                    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 md:p-7 max-w-lg w-full shadow-2xl animate-in fade-in zoom-in duration-200">
                        <div className="flex items-center justify-between pb-4 border-b border-slate-800 mb-5">
                            <div className="flex items-center gap-2.5">
                                <div className="p-2 rounded-xl bg-emerald-950/70 border border-emerald-800/60 text-emerald-400">
                                    <Droplet className="h-5 w-5" />
                                </div>
                                <div>
                                    <h2 className="text-lg font-bold text-white">Add Blood Inventory Unit</h2>
                                </div>
                            </div>
                            <button
                                onClick={() => setShowAddUnitModal(false)}
                                className="text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-slate-800 transition"
                            >
                                <X className="h-5 w-5" />
                            </button>
                        </div>

                        {unitBanner && (
                            <div
                                className={`mb-5 p-3 rounded-xl border flex items-center gap-2.5 text-xs ${unitBanner.type === 'success'
                                    ? 'bg-emerald-950/70 border-emerald-800 text-emerald-300'
                                    : 'bg-red-950/70 border-red-800 text-red-300'
                                    }`}
                            >
                                {unitBanner.type === 'success' ? (
                                    <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-400" />
                                ) : (
                                    <AlertCircle className="h-4 w-4 shrink-0 text-red-400" />
                                )}
                                <span>{unitBanner.message}</span>
                            </div>
                        )}

                        <form onSubmit={handleAddUnit} className="space-y-4 text-xs">
                            {/* Donation Event */}
                            <div>
                                <label className="block text-slate-300 mb-1 font-semibold flex items-center justify-between">
                                    <span>Linked Donation Record <span className="text-rose-500">*</span></span>
                                </label>
                                {donations.length === 0 ? (
                                    <div className="p-2.5 bg-amber-950/40 border border-amber-900/60 rounded-xl text-amber-300 text-[11px]">
                                        Loading donations from Oracle...
                                    </div>
                                ) : (
                                    <select
                                        required
                                        value={unitDonationId}
                                        onChange={(e) => handleDonationChange(e.target.value)}
                                        className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-slate-200 focus:outline-none focus:border-emerald-500 transition"
                                    >
                                        {donations.map((d) => (
                                            <option key={d.DONATIONID} value={d.DONATIONID}>
                                                Donation #{d.DONATIONID} - {d.DONORNAME} ({d.BLOODGROUP}) • {d.DONATIONDATE} ({d.CAMPNAME || 'Walk-in'})
                                            </option>
                                        ))}
                                    </select>
                                )}
                            </div>

                            {/* Blood Group & Component Type */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-slate-300 mb-1 font-semibold">
                                        Blood Group <span className="text-rose-500">*</span>
                                    </label>
                                    <select
                                        required
                                        value={unitBloodGroup}
                                        onChange={(e) => setUnitBloodGroup(e.target.value)}
                                        className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-slate-200 font-mono font-bold focus:outline-none focus:border-emerald-500 transition"
                                    >
                                        {['O+', 'O-', 'A+', 'A-', 'B+', 'B-', 'AB+', 'AB-'].map((bg) => (
                                            <option key={bg} value={bg}>{bg}</option>
                                        ))}
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-slate-300 mb-1 font-semibold">
                                        Component Type <span className="text-rose-500">*</span>
                                    </label>
                                    <select
                                        required
                                        value={unitComponentType}
                                        onChange={(e) => handleComponentChange(e.target.value)}
                                        className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-slate-200 focus:outline-none focus:border-emerald-500 transition"
                                    >
                                        <option value="WHOLE_BLOOD">Whole Blood (35-day shelf life)</option>
                                        <option value="RED_CELLS">Red Cells (42-day shelf life)</option>
                                        <option value="PLATELETS">Platelets (5-day shelf life)</option>
                                        <option value="PLASMA">Plasma (365-day shelf life)</option>
                                    </select>
                                </div>
                            </div>

                            {/* Volume and Storage Location */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-slate-300 mb-1 font-semibold">
                                        Volume (ml) <span className="text-rose-500">*</span>
                                    </label>
                                    <input
                                        required
                                        type="number"
                                        min="50"
                                        max="1000"
                                        value={unitVolume}
                                        onChange={(e) => setUnitVolume(e.target.value)}
                                        className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-slate-200 focus:outline-none focus:border-emerald-500 transition font-mono"
                                    />
                                </div>

                                <div>
                                    <label className="block text-slate-300 mb-1 font-semibold">
                                        Storage Location <span className="text-rose-500">*</span>
                                    </label>
                                    <input
                                        required
                                        type="text"
                                        placeholder="e.g. FRIDGE-A-SHELF-2"
                                        value={unitStorageLoc}
                                        onChange={(e) => setUnitStorageLoc(e.target.value)}
                                        className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-slate-200 focus:outline-none focus:border-emerald-500 transition uppercase font-mono"
                                    />
                                </div>
                            </div>

                            {/* Collection Date */}
                            <div>
                                <label className="block text-slate-300 mb-1 font-semibold">
                                    Collection Date
                                </label>
                                <input
                                    type="date"
                                    value={unitCollectionDate}
                                    onChange={(e) => setUnitCollectionDate(e.target.value)}
                                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-slate-200 focus:outline-none focus:border-emerald-500 transition"
                                />
                            </div>


                            <div className="flex justify-end gap-2.5 pt-2">
                                <button
                                    type="button"
                                    onClick={() => setShowAddUnitModal(false)}
                                    className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium transition"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={savingUnit || !unitStorageLoc || !unitDonationId}
                                    className="px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 disabled:opacity-50 text-white font-semibold transition flex items-center gap-2 shadow-lg shadow-emerald-950/50"
                                >
                                    <Droplet className="h-4 w-4" />
                                    {savingUnit ? 'Saving to Oracle...' : 'Add Unit to Inventory'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Remove / Discard Blood Unit Modal */}
            {showRemoveModal && selectedRemoveUnit && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50 overflow-y-auto">
                    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 md:p-7 max-w-lg w-full shadow-2xl animate-in fade-in zoom-in duration-200">
                        <div className="flex items-center justify-between pb-4 border-b border-slate-800 mb-5">
                            <div className="flex items-center gap-2.5">
                                <div className="p-2 rounded-xl bg-rose-950/70 border border-rose-800/60 text-rose-400">
                                    <Trash2 className="h-5 w-5" />
                                </div>
                                <div>
                                    <h2 className="text-lg font-bold text-white">Remove / Discard Blood Unit</h2>
                                    <p className="text-xs text-slate-400">
                                        Audit-compliant inventory removal for Unit #{selectedRemoveUnit.UNITID}
                                    </p>
                                </div>
                            </div>
                            <button
                                onClick={() => {
                                    setShowRemoveModal(false);
                                    setSelectedRemoveUnit(null);
                                }}
                                className="text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-slate-800 transition"
                            >
                                <X className="h-5 w-5" />
                            </button>
                        </div>

                        {removeBanner && (
                            <div
                                className={`mb-5 p-3 rounded-xl border flex items-center gap-2.5 text-xs ${removeBanner.type === 'success'
                                    ? 'bg-emerald-950/70 border-emerald-800 text-emerald-300'
                                    : 'bg-red-950/70 border-red-800 text-red-300'
                                    }`}
                            >
                                {removeBanner.type === 'success' ? (
                                    <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-400" />
                                ) : (
                                    <AlertCircle className="h-4 w-4 shrink-0 text-red-400" />
                                )}
                                <span>{removeBanner.message}</span>
                            </div>
                        )}

                        {/* Unit Details Card */}
                        <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-3.5 mb-5 space-y-2 text-xs">
                            <div className="flex items-center justify-between">
                                <span className="text-slate-400 font-medium">Serial / ID:</span>
                                <span className="font-mono font-bold text-white text-sm">#{selectedRemoveUnit.UNITID}</span>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-slate-400 font-medium">Group & Component:</span>
                                <span className="font-semibold text-rose-400">
                                    {selectedRemoveUnit.BLOODGROUP} • {selectedRemoveUnit.COMPONENTTYPE} ({selectedRemoveUnit.VOLUME_ML} ml)
                                </span>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-slate-400 font-medium">Storage Location:</span>
                                <span className="font-mono text-slate-200">{selectedRemoveUnit.STORAGELOCATION}</span>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-slate-400 font-medium">Expiry Status:</span>
                                <span className="text-slate-300 font-mono">
                                    {selectedRemoveUnit.EXPIRYDATE} ({selectedRemoveUnit.DAYSREMAINING} days remaining)
                                </span>
                            </div>
                        </div>

                        <form onSubmit={handleRemoveUnit} className="space-y-4 text-xs">
                            <div>
                                <label className="block text-slate-300 mb-2 font-semibold">
                                    Action Type
                                </label>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                    <label
                                        onClick={() => setRemoveActionType('discard')}
                                        className={`p-3 rounded-xl border cursor-pointer transition flex flex-col justify-between ${removeActionType === 'discard'
                                            ? 'bg-amber-950/50 border-amber-600/80 text-amber-200'
                                            : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                                            }`}
                                    >
                                        <div className="flex items-center gap-2 font-semibold text-xs mb-1">
                                            <Archive className="h-4 w-4 text-amber-400" />
                                            <span>Mark as Discarded</span>
                                        </div>
                                        <p className="text-[10px] text-slate-400">
                                            (Recommended) Retains audit trail with status 'DISCARDED'.
                                        </p>
                                    </label>

                                    <label
                                        onClick={() => setRemoveActionType('delete')}
                                        className={`p-3 rounded-xl border cursor-pointer transition flex flex-col justify-between ${removeActionType === 'delete'
                                            ? 'bg-red-950/50 border-red-600/80 text-red-200'
                                            : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                                            }`}
                                    >
                                        <div className="flex items-center gap-2 font-semibold text-xs mb-1">
                                            <Trash2 className="h-4 w-4 text-red-400" />
                                            <span>Permanent Delete</span>
                                        </div>
                                        <p className="text-[10px] text-slate-400">
                                            Permanently removes row from Oracle database.
                                        </p>
                                    </label>
                                </div>
                            </div>

                            {removeActionType === 'discard' && (
                                <div>
                                    <label className="block text-slate-300 mb-1 font-semibold">
                                        Clinical Discard Reason <span className="text-rose-500">*</span>
                                    </label>
                                    <select
                                        value={discardReason}
                                        onChange={(e) => setDiscardReason(e.target.value)}
                                        className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-slate-200 focus:outline-none focus:border-amber-500 transition"
                                    >
                                        <option value="Expired / Past Shelf Life">Expired / Past Shelf Life</option>
                                        <option value="Hemolysis Observed">Hemolysis Observed</option>
                                        <option value="Clotted Blood Sample">Clotted Blood Sample</option>
                                        <option value="Bag Leakage / Seal Compromised">Bag Leakage / Seal Compromised</option>
                                        <option value="Storage Temperature Breach">Storage Temperature Breach</option>
                                        <option value="Bacterial / Contamination Suspected">Bacterial / Contamination Suspected</option>
                                        <option value="Routine Quality Control Discard">Routine Quality Control Discard</option>
                                    </select>
                                </div>
                            )}

                            <div className="flex justify-end gap-2.5 pt-2">
                                <button
                                    type="button"
                                    onClick={() => {
                                        setShowRemoveModal(false);
                                        setSelectedRemoveUnit(null);
                                    }}
                                    className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium transition"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={removingUnitLoading}
                                    className={`px-4 py-2 rounded-xl text-white font-semibold transition flex items-center gap-2 shadow-lg ${removeActionType === 'delete'
                                        ? 'bg-red-600 hover:bg-red-500 shadow-red-950/50'
                                        : 'bg-amber-600 hover:bg-amber-500 shadow-amber-950/50'
                                        }`}
                                >
                                    <Trash2 className="h-4 w-4" />
                                    {removingUnitLoading
                                        ? 'Processing...'
                                        : removeActionType === 'delete'
                                            ? 'Confirm Permanent Deletion'
                                            : 'Confirm Discard'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}