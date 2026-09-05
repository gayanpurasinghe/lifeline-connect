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
    ExternalLink
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
                            className="bg-slate-900 border border-slate-700 text-slate-200 text-sm rounded-lg pl-9 pr-4 py-2 w-64 focus:outline-none focus:border-rose-500"
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
                </div>
            </div>

            {/* Info Banner about Schema Flexibility */}
            <div className="mb-8 p-4 bg-slate-900/80 border border-slate-800 rounded-xl flex items-start gap-3">
                <FileText className="h-5 w-5 text-cyan-400 shrink-0 mt-0.5" />
                <div className="text-xs text-slate-300">
                    <span className="font-bold text-white">MongoDB Dynamic Schema Demonstration: </span>
                    Unlike relational Oracle tables with fixed columns, each campaign document stores varied, polymorphic metadata—such as dietary advice and minimum hemoglobin for guidelines, or resolution dimensions and color palettes for promotional banner kits.
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

                            {/* Download / Resource Link */}
                            <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between">
                                <span className="text-[10px] text-slate-500">
                                    Added {new Date(item.createdAt).toLocaleDateString()}
                                </span>
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
                    ))}
                </div>
            )}
        </div>
    );
}
