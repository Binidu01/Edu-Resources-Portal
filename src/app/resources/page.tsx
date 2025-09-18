"use client";

import { useEffect, useState, ChangeEvent } from "react";
import { db } from "@/lib/firebase";
import { collection, getDocs } from "firebase/firestore";
import toast, { Toaster } from "react-hot-toast";
import { useRouter } from "next/navigation";
import {
    BookOpen,
    Filter,
    Download,
    Play,
    ExternalLink,
    ArrowLeft,
    Search,
    Grid3X3,
    List,
    Sparkles,
    GraduationCap,
    Database,
    Globe,
    Tag,
    FileText,
    Video,
} from "lucide-react";

interface Resource {
    id: string;
    title: string;
    grade: string;
    subject: string;
    medium: string;
    category: string;
    fileUrl?: string;
    videoUrl?: string;
}

interface ResourceData {
    title: string;
    grade: string;
    subject: string;
    medium: string;
    category: string;
    fileUrl?: string;
    videoUrl?: string;
}

interface Filters {
    grade: string;
    subject: string;
    medium: string;
    category: string;
}

export default function ViewResources() {
    const router = useRouter();
    const [resources, setResources] = useState<Resource[]>([]);
    const [grades, setGrades] = useState<string[]>([]);
    const [subjects, setSubjects] = useState<string[]>([]);
    const [mediums, setMediums] = useState<string[]>([]);
    const [categories, setCategories] = useState<string[]>([]);
    const [filters, setFilters] = useState<Filters>({
        grade: "",
        subject: "",
        medium: "",
        category: "",
    });
    const [searchTerm, setSearchTerm] = useState("");
    const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
    const [loading, setLoading] = useState(true);

    // Load dropdown values
    const loadDropdowns = async () => {
        const load = async (col: string) =>
            (await getDocs(collection(db, col))).docs.map((d) => (d.data() as { name: string }).name);

        setGrades(await load("grades"));
        setSubjects(await load("subjects"));
        setMediums(await load("mediums"));
        setCategories(await load("categories"));
    };

    // Load resources
    const loadResources = async () => {
        try {
            const snapshot = await getDocs(collection(db, "resources"));

            const resData: Resource[] = snapshot.docs.map((doc) => {
                const data = doc.data() as ResourceData;
                return {
                    id: doc.id,
                    title: data.title,
                    grade: data.grade,
                    subject: data.subject,
                    medium: data.medium,
                    category: data.category,
                    fileUrl: data.fileUrl,
                    videoUrl: data.videoUrl,
                };
            });

            setResources(resData);
            setLoading(false);
        } catch (err) {
            console.error(err);
            toast.error("Failed to load resources");
            setLoading(false);
        }
    };

    useEffect(() => {
        (async () => {
            await loadDropdowns();
            await loadResources();
        })();
    }, []);

    const handleFilterChange = (e: ChangeEvent<HTMLSelectElement>) => {
        setFilters({ ...filters, [e.target.name]: e.target.value });
    };

    const filteredResources = resources.filter((r) => {
        const matchesFilters =
            (!filters.grade || r.grade === filters.grade) &&
            (!filters.subject || r.subject === filters.subject) &&
            (!filters.medium || r.medium === filters.medium) &&
            (!filters.category || r.category === filters.category);

        const matchesSearch =
            !searchTerm ||
            r.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
            r.grade.toLowerCase().includes(searchTerm.toLowerCase()) ||
            r.subject.toLowerCase().includes(searchTerm.toLowerCase());

        return matchesFilters && matchesSearch;
    });

    const clearFilters = () => {
        setFilters({ grade: "", subject: "", medium: "", category: "" });
        setSearchTerm("");
    };

    const getCategoryIcon = (category: string) => {
        switch (category.toLowerCase()) {
            case "video":
                return Video;
            case "textbook":
                return BookOpen;
            default:
                return FileText;
        }
    };

    // Deduplicate dropdown values
    const uniqueGrades = Array.from(new Set(grades));
    const uniqueSubjects = Array.from(new Set(subjects));
    const uniqueMediums = Array.from(new Set(mediums));
    const uniqueCategories = Array.from(new Set(categories));

    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-navy-900 flex items-center justify-center">
                <div className="text-center space-y-4">
                    <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-400 mx-auto"></div>
                    <p className="text-blue-300 text-lg">Loading Resources...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-navy-900 relative overflow-hidden">
            <Toaster position="top-right" />

            {/* Animated background elements */}
            <div className="absolute inset-0 overflow-hidden">
                <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-500 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-pulse"></div>
                <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-cyan-500 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-pulse"></div>
                <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-indigo-500 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-pulse"></div>
            </div>

            {/* Grid overlay */}
            <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.02)_1px,transparent_1px)] bg-[size:100px_100px]"></div>

            {/* Main content */}
            <div className="relative z-10 p-8">
                {/* Header */}
                <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 mb-8">
                    <div className="flex items-center space-x-4">
                        <button
                            onClick={() => router.back()}
                            className="group flex items-center space-x-2 px-4 py-2 bg-white/10 backdrop-blur-lg border border-white/20 text-gray-300 rounded-xl hover:bg-white/20 transition-all duration-300 hover:scale-105"
                        >
                            <ArrowLeft className="w-4 h-4" />
                            <span>Back</span>
                        </button>

                        <div className="flex items-center space-x-4">
                            <div className="inline-flex items-center justify-center w-12 h-12 bg-gradient-to-r from-blue-600 to-cyan-600 rounded-xl shadow-lg">
                                <BookOpen className="w-6 h-6 text-white" />
                            </div>
                            <div>
                                <h1 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-cyan-400 to-indigo-400">
                                    Resources Library
                                </h1>
                                <p className="text-blue-300">Discover educational content</p>
                            </div>
                        </div>
                    </div>

                    {/* View Toggle */}
                    <div className="flex items-center space-x-2 bg-white/10 backdrop-blur-lg rounded-xl p-1 border border-white/20">
                        <button
                            onClick={() => setViewMode("grid")}
                            className={`flex items-center space-x-2 px-3 py-2 rounded-lg transition-all duration-300 ${
                                viewMode === "grid"
                                    ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg"
                                    : "text-gray-300 hover:text-white"
                            }`}
                        >
                            <Grid3X3 className="w-4 h-4" />
                            <span className="hidden sm:inline">Grid</span>
                        </button>
                        <button
                            onClick={() => setViewMode("list")}
                            className={`flex items-center space-x-2 px-3 py-2 rounded-lg transition-all duration-300 ${
                                viewMode === "list"
                                    ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg"
                                    : "text-gray-300 hover:text-white"
                            }`}
                        >
                            <List className="w-4 h-4" />
                            <span className="hidden sm:inline">List</span>
                        </button>
                    </div>
                </div>

                {/* Search and Filters */}
                <div className="bg-white/10 backdrop-blur-lg rounded-2xl border border-white/20 p-6 mb-8">
                    <div className="flex items-center space-x-2 mb-6">
                        <Filter className="w-5 h-5 text-blue-400" />
                        <h2 className="text-xl font-semibold text-white">Search & Filter</h2>
                        <div className="flex-1"></div>
                        <button
                            onClick={clearFilters}
                            className="px-3 py-1 bg-red-500/20 hover:bg-red-500/30 border border-red-500/30 text-red-300 rounded-lg transition-all duration-300 text-sm"
                        >
                            Clear All
                        </button>
                    </div>

                    {/* Search Bar */}
                    <div className="relative mb-6">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Search resources by title, grade, or subject..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                    </div>

                    {/* Filter Dropdowns */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                        <div className="relative">
                            <GraduationCap className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-blue-400" />
                            <select
                                name="grade"
                                value={filters.grade}
                                onChange={handleFilterChange}
                                className="w-full pl-10 pr-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none"
                            >
                                <option value="" className="bg-gray-800">
                                    All Grades
                                </option>
                                {uniqueGrades.map((g, idx) => (
                                    <option key={`grade-${g}-${idx}`} value={g} className="bg-gray-800">
                                        {g}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div className="relative">
                            <Database className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-cyan-400" />
                            <select
                                name="subject"
                                value={filters.subject}
                                onChange={handleFilterChange}
                                className="w-full pl-10 pr-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none"
                            >
                                <option value="" className="bg-gray-800">
                                    All Subjects
                                </option>
                                {uniqueSubjects.map((s, idx) => (
                                    <option key={`subject-${s}-${idx}`} value={s} className="bg-gray-800">
                                        {s}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div className="relative">
                            <Globe className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-indigo-400" />
                            <select
                                name="medium"
                                value={filters.medium}
                                onChange={handleFilterChange}
                                className="w-full pl-10 pr-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none"
                            >
                                <option value="" className="bg-gray-800">
                                    All Mediums
                                </option>
                                {uniqueMediums.map((m, idx) => (
                                    <option key={`medium-${m}-${idx}`} value={m} className="bg-gray-800">
                                        {m}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div className="relative">
                            <Tag className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-sky-400" />
                            <select
                                name="category"
                                value={filters.category}
                                onChange={handleFilterChange}
                                className="w-full pl-10 pr-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none"
                            >
                                <option value="" className="bg-gray-800">
                                    All Categories
                                </option>
                                {uniqueCategories.map((c, idx) => (
                                    <option key={`category-${c}-${idx}`} value={c} className="bg-gray-800">
                                        {c}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>

                    {/* Results Summary */}
                    <div className="mt-4 pt-4 border-t border-white/10 flex items-center justify-between text-sm text-gray-300">
                        <span>Found {filteredResources.length} resources</span>
                        {(filters.grade || filters.subject || filters.medium || filters.category || searchTerm) && (
                            <div className="flex items-center space-x-2">
                                <Sparkles className="w-4 h-4 text-blue-400" />
                                <span>Filters active</span>
                            </div>
                        )}
                    </div>
                </div>

                {/* Resource List/Grid */}
                {filteredResources.length === 0 ? (
                    <div className="bg-white/10 backdrop-blur-lg rounded-2xl border border-white/20 p-12 text-center">
                        <BookOpen className="w-16 h-16 text-blue-400 mx-auto mb-4" />
                        <h3 className="text-xl font-semibold text-white mb-2">No resources found</h3>
                        <p className="text-gray-300 mb-4">Try adjusting your search criteria or filters</p>
                        <button
                            onClick={clearFilters}
                            className="px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg hover:scale-105 transition-all duration-300"
                        >
                            Clear Filters
                        </button>
                    </div>
                ) : (
                    <div className={viewMode === "grid" ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" : "space-y-4"}>
                        {filteredResources.map((r) => {
                            const CategoryIcon = getCategoryIcon(r.category);

                            if (viewMode === "grid") {
                                return (
                                    <div
                                        key={r.id}
                                        className="bg-white/10 backdrop-blur-lg rounded-xl border border-white/20 p-6 hover:bg-white/20 transition-all duration-300 hover:scale-105 group"
                                    >
                                        <div className="flex items-start space-x-3 mb-4">
                                            <div className="flex-shrink-0">
                                                <CategoryIcon className="w-8 h-8 text-blue-400" />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <h3 className="text-lg font-semibold text-white mb-2 group-hover:text-blue-300 transition-colors truncate">
                                                    {r.title}
                                                </h3>
                                                <div className="flex flex-wrap gap-2 mb-4">
                                                    <span className="px-2 py-1 bg-blue-500/20 text-blue-300 rounded-lg text-xs border border-blue-500/30">{r.grade}</span>
                                                    <span className="px-2 py-1 bg-cyan-500/20 text-cyan-300 rounded-lg text-xs border border-cyan-500/30">{r.subject}</span>
                                                    <span className="px-2 py-1 bg-indigo-500/20 text-indigo-300 rounded-lg text-xs border border-indigo-500/30">{r.medium}</span>
                                                    <span className="px-2 py-1 bg-sky-500/20 text-sky-300 rounded-lg text-xs border border-sky-500/30">{r.category}</span>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="flex flex-wrap gap-3">
                                            {r.fileUrl && (
                                                <a
                                                    href={r.fileUrl}
                                                    download
                                                    className="flex items-center space-x-2 px-3 py-2 bg-blue-500/20 hover:bg-blue-500/30 border border-blue-500/30 text-blue-300 rounded-lg transition-all duration-300 hover:scale-105 text-sm"
                                                >
                                                    <Download className="w-4 h-4" />
                                                    <span>Download</span>
                                                </a>
                                            )}
                                            {r.videoUrl && (
                                                <a
                                                    href={r.videoUrl}
                                                    target="_blank"
                                                    rel="noreferrer"
                                                    className="flex items-center space-x-2 px-3 py-2 bg-green-500/20 hover:bg-green-500/30 border border-green-500/30 text-green-300 rounded-lg transition-all duration-300 hover:scale-105 text-sm"
                                                >
                                                    <Play className="w-4 h-4" />
                                                    <span>Watch</span>
                                                    <ExternalLink className="w-3 h-3" />
                                                </a>
                                            )}
                                        </div>
                                    </div>
                                );
                            } else {
                                return (
                                    <div
                                        key={r.id}
                                        className="bg-white/10 backdrop-blur-lg rounded-xl border border-white/20 p-6 hover:bg-white/20 transition-all duration-300 group"
                                    >
                                        <div className="flex justify-between items-start">
                                            <div className="flex items-start space-x-4 flex-1">
                                                <CategoryIcon className="w-6 h-6 text-blue-400 mt-1 flex-shrink-0" />
                                                <div className="flex-1 min-w-0">
                                                    <h3 className="text-lg font-semibold text-white mb-2 group-hover:text-blue-300 transition-colors">{r.title}</h3>
                                                    <div className="flex flex-wrap gap-2 mb-3">
                                                        <span className="px-2 py-1 bg-blue-500/20 text-blue-300 rounded-lg text-sm border border-blue-500/30">{r.grade}</span>
                                                        <span className="px-2 py-1 bg-cyan-500/20 text-cyan-300 rounded-lg text-sm border border-cyan-500/30">{r.subject}</span>
                                                        <span className="px-2 py-1 bg-indigo-500/20 text-indigo-300 rounded-lg text-sm border border-indigo-500/30">{r.medium}</span>
                                                        <span className="px-2 py-1 bg-sky-500/20 text-sky-300 rounded-lg text-sm border border-sky-500/30">{r.category}</span>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="flex gap-3 ml-4">
                                                {r.fileUrl && (
                                                    <a
                                                        href={r.fileUrl}
                                                        download
                                                        className="flex items-center space-x-2 px-3 py-2 bg-blue-500/20 hover:bg-blue-500/30 border border-blue-500/30 text-blue-300 rounded-lg transition-all duration-300 hover:scale-105 text-sm"
                                                    >
                                                        <Download className="w-4 h-4" />
                                                        <span className="hidden sm:inline">Download</span>
                                                    </a>
                                                )}
                                                {r.videoUrl && (
                                                    <a
                                                        href={r.videoUrl}
                                                        target="_blank"
                                                        rel="noreferrer"
                                                        className="flex items-center space-x-2 px-3 py-2 bg-green-500/20 hover:bg-green-500/30 border border-green-500/30 text-green-300 rounded-lg transition-all duration-300 hover:scale-105 text-sm"
                                                    >
                                                        <Play className="w-4 h-4" />
                                                        <span className="hidden sm:inline">Watch</span>
                                                        <ExternalLink className="w-3 h-3" />
                                                    </a>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                );
                            }
                        })}
                    </div>
                )}
            </div>
        </div>
    );
}
