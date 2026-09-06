'use client';

import React, { useState, useEffect } from 'react';
import {
    FileText,
    Download,
    Tag,
    Layers,
    Search,
    Filter,
    Plus,
    BookOpen,
    Image as ImageIcon,
    Sparkles,
    Check,
    Clock,
    ExternalLink,
    Trash2,
    X,
    AlertCircle,
    CheckCircle2,
    PlusCircle,
    Globe
} from 'lucide-react';

interface CampaignMediaItem {
    _id: string;
    title: string;
    category: 'AWARENESS' | 'GUIDELINE' | 'PROMOTIONAL_MEDIA';
    fileFormat: string;
    fileUrl: string;
    tags: string[];
    flexibleMetadata: Record<string, any>;
    createdAt: string;
}

export default function MediaPage() {
    const [mediaList, setMediaList] = useState<CampaignMediaItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedCategory, setSelectedCategory] = useState<string>('');
    const [searchQuery, setSearchQuery] = useState('');

    // Add Media Modal State
    const [showAddModal, setShowAddModal] = useState(false);
    const [formTitle, setFormTitle] = useState('');
    const [formCategory, setFormCategory] = useState<'GUIDELINE' | 'AWARENESS' | 'PROMOTIONAL_MEDIA'>('GUIDELINE');
    const [formFormat, setFormFormat] = useState('PDF');
    const [formUrl, setFormUrl] = useState('');
    const [formTags, setFormTags] = useState('');

    // Dynamic Flexible Metadata fields
    const [metaTargetAudience, setMetaTargetAudience] = useState('First-time donors');
    const [metaAuthorRole, setMetaAuthorRole] = useState('Senior Medical Officer');
    const [metaMinHb, setMetaMinHb] = useState('12.5 g/dL');
    const [metaReadingTime, setMetaReadingTime] = useState('3');
    const [metaConditions, setMetaConditions] = useState('Emergency Trauma, Platelet Support');
    const [metaDimensions, setMetaDimensions] = useState('1080x1080, 1920x1080');
    const [metaLanguages, setMetaLanguages] = useState('English, Sinhala, Tamil');
    const [metaLicense, setMetaLicense] = useState('CC-BY-4.0');
    const [customAttrs, setCustomAttrs] = useState<{ key: string; value: string }[]>([]);

    const [saving, setSaving] = useState(false);
    const [banner, setBanner] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

    const fetchMedia = async () => {
        try {
            setLoading(true);
            let url = '/api/nosql/media';
            if (selectedCategory) {
                url += `?category=${selectedCategory}`;
            }
            const res = await fetch(url);
            const json = await res.json();
            if (json.success) {
                setMediaList(json.data || []);
            }
        } catch (err) {
            console.error('Failed to load media assets:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchMedia();
    }, [selectedCategory]);

    const openAddModal = () => {
        setFormTitle('');
        setFormCategory('GUIDELINE');
        setFormFormat('PDF');
        setFormUrl('https://lifeline.lk/docs/guidelines.pdf');
        setFormTags('DonorHealth, Clinical');
        setMetaTargetAudience('First-time donors');
        setMetaAuthorRole('Senior Medical Officer');
        setMetaMinHb('12.5 g/dL');
        setMetaReadingTime('3');
        setCustomAttrs([]);
        setBanner(null);
        setShowAddModal(true);
    };

    const addCustomAttr = () => {
        setCustomAttrs((prev) => [...prev, { key: '', value: '' }]);
    };

    const removeCustomAttr = (index: number) => {
        setCustomAttrs((prev) => prev.filter((_, i) => i !== index));
    };

    const updateCustomAttr = (index: number, field: 'key' | 'value', text: string) => {
        setCustomAttrs((prev) =>
            prev.map((item, i) => (i === index ? { ...item, [field]: text } : item))
        );
    };

    const handleAddMedia = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        setBanner(null);

        try {
            const flexMeta: Record<string, any> = {};

            if (formCategory === 'GUIDELINE') {
                if (metaTargetAudience) flexMeta.targetAudience = metaTargetAudience;
                if (metaAuthorRole) flexMeta.authorRole = metaAuthorRole;
                if (metaMinHb) flexMeta.minimumHbRecommended = metaMinHb;
                if (metaReadingTime) flexMeta.readingTimeMinutes = parseInt(metaReadingTime, 10) || 3;
            } else if (formCategory === 'AWARENESS') {
                if (metaConditions) {
                    flexMeta.targetConditions = metaConditions
                        .split(',')
                        .map((s) => s.trim())
                        .filter(Boolean);
                }
                if (metaReadingTime) flexMeta.readingTimeMinutes = parseInt(metaReadingTime, 10) || 2;
            } else if (formCategory === 'PROMOTIONAL_MEDIA') {
                if (metaDimensions) {
                    flexMeta.dimensions = metaDimensions
                        .split(',')
                        .map((s) => s.trim())
                        .filter(Boolean);
                }
                if (metaLanguages) {
                    flexMeta.languagesAvailable = metaLanguages
                        .split(',')
                        .map((s) => s.trim())
                        .filter(Boolean);
                }
                if (metaLicense) flexMeta.campaignLicense = metaLicense;
            }

            // Append custom attributes
            customAttrs.forEach((attr) => {
                if (attr.key.trim()) {
                    flexMeta[attr.key.trim()] = attr.value.trim();
                }
            });

            const res = await fetch('/api/nosql/media', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    title: formTitle,
                    category: formCategory,
                    fileFormat: formFormat,
                    fileUrl: formUrl,
                    tags: formTags,
                    flexibleMetadata: flexMeta,
                }),
            });

            const json = await res.json();
            if (json.success) {
                setBanner({ type: 'success', message: json.message });
                await fetchMedia();
                setTimeout(() => {
                    setShowAddModal(false);
                    setBanner(null);
                }, 1200);
            } else {
                setBanner({ type: 'error', message: json.error || 'Failed to save media asset.' });
            }
        } catch (err: any) {
            setBanner({ type: 'error', message: err.message || 'Network error saving media asset.' });
        } finally {
            setSaving(false);
        }
    };

    const handleDeleteMedia = async (id: string, itemTitle: string) => {
        if (!confirm(`Are you sure you want to delete '${itemTitle}'?`)) return;
        try {
            const res = await fetch(`/api/nosql/media?id=${id}`, { method: 'DELETE' });
            const json = await res.json();
            if (json.success) {
                await fetchMedia();
            } else {
                alert(json.error || 'Failed to delete media asset.');
            }
        } catch (err: any) {
            alert(err.message || 'Error deleting media asset.');
        }
    };

    const filteredMedia = mediaList.filter((item) => {
        if (!searchQuery.trim()) return true;
        const q = searchQuery.toLowerCase();
        const matchesTitle = item.title.toLowerCase().includes(q);
        const matchesTags = item.tags?.some((t) => t.toLowerCase().includes(q));
        const matchesCategory = item.category.toLowerCase().includes(q);
        return matchesTitle || matchesTags || matchesCategory;
    });

    const getCategoryBadge = (category: string) => {
        switch (category) {
            case 'GUIDELINE':
                return 'bg-emerald-950 text-emerald-300 border-emerald-800';
            case 'PROMOTIONAL_MEDIA':
                return 'bg-purple-950 text-purple-300 border-purple-800';
            case 'AWARENESS':
            default:
                return 'bg-rose-950 text-rose-300 border-rose-800';
        }
    };

    const getCategoryIcon = (category: string) => {
        switch (category) {
            case 'GUIDELINE':
                return <BookOpen className="h-4 w-4 text-emerald-400" />;
            case 'PROMOTIONAL_MEDIA':
                return <ImageIcon className="h-4 w-4 text-purple-400" />;
            case 'AWARENESS':
            default:
                return <Sparkles className="h-4 w-4 text-rose-400" />;
        }
    };

    return (
        <div className="max-w-7xl mx-auto p-6 md:p-10">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-6 mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-white flex items-center gap-3">
                        <Layers className="h-8 w-8 text-rose-500" />
                        Campaign Media & Medical Guidelines
                    </h1>
                    <p className="text-slate-400 text-sm mt-1">
                        MongoDB schema-flexible document store capturing donor medical guides, awareness media, and campaign kits
                    </p>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                    <div className="relative">
                        <Search className="h-4 w-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                        <input
                            type="text"
                            placeholder="Filter title or tags..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="bg-slate-900 border border-slate-700 text-slate-200 text-sm rounded-lg pl-9 pr-4 py-2 w-56 focus:outline-none focus:border-rose-500"
                        />
                    </div>

                    <select
                        value={selectedCategory}
                        onChange={(e) => setSelectedCategory(e.target.value)}
                        className="bg-slate-900 border border-slate-700 text-slate-200 text-sm rounded-lg px-3 py-2 focus:outline-none focus:border-rose-500"
                    >
                        <option value="">All Categories</option>
                        <option value="GUIDELINE">Medical Guidelines</option>
                        <option value="AWARENESS">Awareness Materials</option>
                        <option value="PROMOTIONAL_MEDIA">Promotional Media</option>
                    </select>

                    <button
                        onClick={openAddModal}
                        className="flex items-center gap-2 bg-gradient-to-r from-rose-600 to-rose-700 hover:from-rose-500 hover:to-rose-600 text-white text-xs md:text-sm font-semibold px-4 py-2 rounded-xl shadow-lg shadow-rose-950/50 border border-rose-500/30 transition transform active:scale-95"
                    >
                        <Plus className="h-4 w-4" />
                        + Add Asset
                    </button>
                </div>
            </div>


            {/* Media Cards Grid */}
            {loading ? (
                <div className="py-20 text-center text-slate-400">Loading flexible documents from MongoDB...</div>
            ) : filteredMedia.length === 0 ? (
                <div className="py-20 text-center text-slate-500">No media documents matching your filter.</div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredMedia.map((item) => (
                        <div
                            key={item._id}
                            className="bg-slate-900 border border-slate-800 hover:border-slate-700 transition rounded-xl p-5 flex flex-col justify-between shadow-lg"
                        >
                            <div>
                                <div className="flex items-center justify-between gap-2 mb-3">
                                    <span
                                        className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full border flex items-center gap-1.5 uppercase ${getCategoryBadge(
                                            item.category
                                        )}`}
                                    >
                                        {getCategoryIcon(item.category)}
                                        {item.category.replace('_', ' ')}
                                    </span>
                                    <span className="text-[11px] font-mono text-slate-400 bg-slate-950 px-2 py-0.5 rounded border border-slate-800">
                                        {item.fileFormat}
                                    </span>
                                </div>

                                <h3 className="text-lg font-bold text-white mb-2 leading-snug">{item.title}</h3>

                                {/* Tags */}
                                <div className="flex flex-wrap gap-1.5 mb-4">
                                    {item.tags?.map((tag, tIdx) => (
                                        <span
                                            key={tIdx}
                                            className="text-[10px] font-medium bg-slate-950 text-slate-400 border border-slate-800 px-2 py-0.5 rounded-md flex items-center gap-1"
                                        >
                                            <Tag className="h-2.5 w-2.5 text-rose-500" />
                                            {tag}
                                        </span>
                                    ))}
                                </div>

                                {/* Polymorphic Flexible Metadata Drawer */}
                                {item.flexibleMetadata && Object.keys(item.flexibleMetadata).length > 0 && (
                                    <div className="bg-slate-950/70 border border-slate-800/80 rounded-lg p-3 text-xs mb-4">
                                        <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                                            Flexible Attributes (NoSQL JSON)
                                        </div>
                                        <div className="space-y-1.5">
                                            {Object.entries(item.flexibleMetadata).map(([key, val]) => (
                                                <div key={key} className="flex justify-between items-start gap-2">
                                                    <span className="text-slate-400 capitalize">{key.replace(/([A-Z])/g, ' $1')}:</span>
                                                    <span className="text-slate-200 font-medium text-right">
                                                        {Array.isArray(val) ? val.join(', ') : String(val)}
                                                    </span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Download / Resource Link & Delete */}
                            <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between">
                                <span className="text-[10px] text-slate-500">
                                    Added {new Date(item.createdAt).toLocaleDateString()}
                                </span>
                                <div className="flex items-center gap-3">
                                    <button
                                        onClick={() => handleDeleteMedia(item._id, item.title)}
                                        className="text-slate-500 hover:text-red-400 p-1 rounded hover:bg-red-950/40 transition"
                                        title="Delete Asset"
                                    >
                                        <Trash2 className="h-3.5 w-3.5" />
                                    </button>
                                    <a
                                        href={item.fileUrl}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="inline-flex items-center gap-1.5 text-xs font-semibold text-rose-400 hover:text-rose-300 transition"
                                    >
                                        <Download className="h-3.5 w-3.5" />
                                        Access Asset
                                    </a>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Add Campaign Media & Medical Guidelines Modal */}
            {showAddModal && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50 overflow-y-auto">
                    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 md:p-7 max-w-xl w-full shadow-2xl animate-in fade-in zoom-in duration-200 my-8">
                        <div className="flex items-center justify-between pb-4 border-b border-slate-800 mb-5">
                            <div className="flex items-center gap-2.5">
                                <div className="p-2 rounded-xl bg-rose-950/70 border border-rose-800/60 text-rose-400">
                                    <Layers className="h-5 w-5" />
                                </div>
                                <div>
                                    <h2 className="text-lg font-bold text-white">Add Campaign Media / Guideline</h2>
                                </div>
                            </div>
                            <button
                                onClick={() => setShowAddModal(false)}
                                className="text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-slate-800 transition"
                            >
                                <X className="h-5 w-5" />
                            </button>
                        </div>

                        {banner && (
                            <div
                                className={`mb-5 p-3 rounded-xl border flex items-center gap-2.5 text-xs ${banner.type === 'success'
                                    ? 'bg-emerald-950/70 border-emerald-800 text-emerald-300'
                                    : 'bg-red-950/70 border-red-800 text-red-300'
                                    }`}
                            >
                                {banner.type === 'success' ? (
                                    <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-400" />
                                ) : (
                                    <AlertCircle className="h-4 w-4 shrink-0 text-red-400" />
                                )}
                                <span>{banner.message}</span>
                            </div>
                        )}

                        <form onSubmit={handleAddMedia} className="space-y-4 text-xs">
                            {/* Category Selector */}
                            <div>
                                <label className="block text-slate-300 mb-1.5 font-semibold">
                                    Document Category <span className="text-rose-500">*</span>
                                </label>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5">
                                    <button
                                        type="button"
                                        onClick={() => setFormCategory('GUIDELINE')}
                                        className={`p-3 rounded-xl border text-left transition flex flex-col justify-between ${formCategory === 'GUIDELINE'
                                            ? 'bg-emerald-950/50 border-emerald-600 text-emerald-200'
                                            : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                                            }`}
                                    >
                                        <div className="flex items-center gap-1.5 font-semibold mb-1">
                                            <BookOpen className="h-3.5 w-3.5 text-emerald-400" />
                                            <span>Guideline</span>
                                        </div>
                                        <p className="text-[10px] text-slate-400">
                                            Clinical donor diet & health deferral protocols.
                                        </p>
                                    </button>

                                    <button
                                        type="button"
                                        onClick={() => setFormCategory('AWARENESS')}
                                        className={`p-3 rounded-xl border text-left transition flex flex-col justify-between ${formCategory === 'AWARENESS'
                                            ? 'bg-rose-950/50 border-rose-600 text-rose-200'
                                            : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                                            }`}
                                    >
                                        <div className="flex items-center gap-1.5 font-semibold mb-1">
                                            <Sparkles className="h-3.5 w-3.5 text-rose-400" />
                                            <span>Awareness</span>
                                        </div>
                                        <p className="text-[10px] text-slate-400">
                                            Community health posters & donor infographics.
                                        </p>
                                    </button>

                                    <button
                                        type="button"
                                        onClick={() => setFormCategory('PROMOTIONAL_MEDIA')}
                                        className={`p-3 rounded-xl border text-left transition flex flex-col justify-between ${formCategory === 'PROMOTIONAL_MEDIA'
                                            ? 'bg-purple-950/50 border-purple-600 text-purple-200'
                                            : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                                            }`}
                                    >
                                        <div className="flex items-center gap-1.5 font-semibold mb-1">
                                            <ImageIcon className="h-3.5 w-3.5 text-purple-400" />
                                            <span>Promotion</span>
                                        </div>
                                        <p className="text-[10px] text-slate-400">
                                            Drive kits, social banners & press assets.
                                        </p>
                                    </button>
                                </div>
                            </div>

                            {/* Title */}
                            <div>
                                <label className="block text-slate-300 mb-1 font-semibold">
                                    Asset / Guideline Title <span className="text-rose-500">*</span>
                                </label>
                                <input
                                    required
                                    type="text"
                                    placeholder="e.g. Post-Donation Recovery & Hydration Protocol"
                                    value={formTitle}
                                    onChange={(e) => setFormTitle(e.target.value)}
                                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-slate-200 focus:outline-none focus:border-rose-500 transition"
                                />
                            </div>

                            {/* Format & URL */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-slate-300 mb-1 font-semibold">
                                        File Format <span className="text-rose-500">*</span>
                                    </label>
                                    <select
                                        value={formFormat}
                                        onChange={(e) => setFormFormat(e.target.value)}
                                        className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-slate-200 focus:outline-none focus:border-rose-500 transition"
                                    >
                                        <option value="PDF">PDF Document</option>
                                        <option value="PNG">PNG Infographic</option>
                                        <option value="SVG">SVG Vector</option>
                                        <option value="MP4">MP4 Video Clip</option>
                                        <option value="ZIP (PNG/SVG)">ZIP Package (PNG/SVG)</option>
                                        <option value="DOCX">Word Document</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-slate-300 mb-1 font-semibold">
                                        File / Resource URL <span className="text-rose-500">*</span>
                                    </label>
                                    <input
                                        required
                                        type="text"
                                        placeholder="https://... or /media/..."
                                        value={formUrl}
                                        onChange={(e) => setFormUrl(e.target.value)}
                                        className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-slate-200 focus:outline-none focus:border-rose-500 transition"
                                    />
                                </div>
                            </div>

                            {/* Tags */}
                            <div>
                                <label className="block text-slate-300 mb-1 font-semibold">
                                    Tags (Comma-separated)
                                </label>
                                <input
                                    type="text"
                                    placeholder="e.g. DonorHealth, Nutrition, Hemoglobin, Recovery"
                                    value={formTags}
                                    onChange={(e) => setFormTags(e.target.value)}
                                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-slate-200 focus:outline-none focus:border-rose-500 transition"
                                />
                            </div>

                            {/* Category-Specific Polymorphic Metadata */}
                            <div className="border-t border-slate-800 pt-3">
                                <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                                    <Sparkles className="h-3 w-3 text-rose-400" />
                                    <span>Category-Specific Metadata (Dynamic NoSQL Attributes)</span>
                                </div>

                                {formCategory === 'GUIDELINE' && (
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 bg-slate-950/60 p-3 rounded-xl border border-slate-800/80">
                                        <div>
                                            <label className="block text-slate-400 mb-1 text-[11px]">Target Audience</label>
                                            <input
                                                type="text"
                                                value={metaTargetAudience}
                                                onChange={(e) => setMetaTargetAudience(e.target.value)}
                                                className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-slate-200 text-xs"
                                                placeholder="e.g. First-time donors"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-slate-400 mb-1 text-[11px]">Author / Medical Role</label>
                                            <input
                                                type="text"
                                                value={metaAuthorRole}
                                                onChange={(e) => setMetaAuthorRole(e.target.value)}
                                                className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-slate-200 text-xs"
                                                placeholder="e.g. Senior Medical Officer"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-slate-400 mb-1 text-[11px]">Minimum Hb Required</label>
                                            <input
                                                type="text"
                                                value={metaMinHb}
                                                onChange={(e) => setMetaMinHb(e.target.value)}
                                                className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-slate-200 text-xs"
                                                placeholder="e.g. 12.5 g/dL"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-slate-400 mb-1 text-[11px]">Estimated Read Time (Mins)</label>
                                            <input
                                                type="number"
                                                value={metaReadingTime}
                                                onChange={(e) => setMetaReadingTime(e.target.value)}
                                                className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-slate-200 text-xs"
                                                placeholder="e.g. 3"
                                            />
                                        </div>
                                    </div>
                                )}

                                {formCategory === 'AWARENESS' && (
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 bg-slate-950/60 p-3 rounded-xl border border-slate-800/80">
                                        <div className="md:col-span-2">
                                            <label className="block text-slate-400 mb-1 text-[11px]">Target Clinical Conditions</label>
                                            <input
                                                type="text"
                                                value={metaConditions}
                                                onChange={(e) => setMetaConditions(e.target.value)}
                                                className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-slate-200 text-xs"
                                                placeholder="e.g. Leukemia, Thalassemia, Trauma"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-slate-400 mb-1 text-[11px]">Reading Time (Mins)</label>
                                            <input
                                                type="number"
                                                value={metaReadingTime}
                                                onChange={(e) => setMetaReadingTime(e.target.value)}
                                                className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-slate-200 text-xs"
                                            />
                                        </div>
                                    </div>
                                )}

                                {formCategory === 'PROMOTIONAL_MEDIA' && (
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 bg-slate-950/60 p-3 rounded-xl border border-slate-800/80">
                                        <div>
                                            <label className="block text-slate-400 mb-1 text-[11px]">Dimensions</label>
                                            <input
                                                type="text"
                                                value={metaDimensions}
                                                onChange={(e) => setMetaDimensions(e.target.value)}
                                                className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-slate-200 text-xs"
                                                placeholder="e.g. 1080x1080, 1920x1080"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-slate-400 mb-1 text-[11px]">Languages</label>
                                            <input
                                                type="text"
                                                value={metaLanguages}
                                                onChange={(e) => setMetaLanguages(e.target.value)}
                                                className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-slate-200 text-xs"
                                                placeholder="e.g. English, Sinhala, Tamil"
                                            />
                                        </div>
                                        <div className="md:col-span-2">
                                            <label className="block text-slate-400 mb-1 text-[11px]">Campaign License</label>
                                            <input
                                                type="text"
                                                value={metaLicense}
                                                onChange={(e) => setMetaLicense(e.target.value)}
                                                className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-slate-200 text-xs"
                                                placeholder="e.g. CC-BY-4.0"
                                            />
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Custom Key-Value Attribute Builder */}
                            <div className="border-t border-slate-800 pt-3">
                                <div className="flex items-center justify-between mb-2">
                                    <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                                        Additional Custom Attributes (Schema-Less)
                                    </span>
                                    <button
                                        type="button"
                                        onClick={addCustomAttr}
                                        className="text-[11px] font-semibold text-rose-400 hover:text-rose-300 flex items-center gap-1"
                                    >
                                        <PlusCircle className="h-3 w-3" />
                                        + Add Attribute
                                    </button>
                                </div>

                                {customAttrs.map((attr, idx) => (
                                    <div key={idx} className="flex items-center gap-2 mb-2">
                                        <input
                                            type="text"
                                            placeholder="Attribute Key (e.g. dietaryTip)"
                                            value={attr.key}
                                            onChange={(e) => updateCustomAttr(idx, 'key', e.target.value)}
                                            className="flex-1 bg-slate-950 border border-slate-800 rounded-lg p-2 text-slate-200 text-xs"
                                        />
                                        <input
                                            type="text"
                                            placeholder="Attribute Value"
                                            value={attr.value}
                                            onChange={(e) => updateCustomAttr(idx, 'value', e.target.value)}
                                            className="flex-1 bg-slate-950 border border-slate-800 rounded-lg p-2 text-slate-200 text-xs"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => removeCustomAttr(idx)}
                                            className="text-slate-500 hover:text-red-400 p-1"
                                        >
                                            <X className="h-3.5 w-3.5" />
                                        </button>
                                    </div>
                                ))}
                            </div>

                            <div className="flex justify-end gap-2.5 pt-2 border-t border-slate-800">
                                <button
                                    type="button"
                                    onClick={() => setShowAddModal(false)}
                                    className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium transition"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={saving || !formTitle || !formUrl}
                                    className="px-4 py-2 rounded-xl bg-gradient-to-r from-rose-600 to-rose-700 hover:from-rose-500 hover:to-rose-600 disabled:opacity-50 text-white font-semibold transition flex items-center gap-2 shadow-lg shadow-rose-950/50"
                                >
                                    <Layers className="h-4 w-4" />
                                    {saving ? 'Saving Document...' : 'Save to MongoDB'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
