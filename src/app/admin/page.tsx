"use client";

import { useEffect, useState, ChangeEvent, FormEvent } from "react";
import { useRouter } from "next/navigation";
import { db, auth } from "@/lib/firebase";
import {
    collection,
    addDoc,
    getDocs,
    deleteDoc,
    doc,
    query,
    where,
    DocumentData,
} from "firebase/firestore";
import { onAuthStateChanged, signOut } from "firebase/auth";
import toast, { Toaster } from "react-hot-toast";
import {
    BookOpen,
    Shield,
    GraduationCap,
    LogOut,
    Upload,
    Trash2,
    Plus,
    ExternalLink,
    Download,
    Play,
    Settings,
    Database,
    Globe,
    Tag,
    Loader2,
    Search
} from "lucide-react";

type Tab = "resources" | "grades" | "subjects" | "mediums" | "categories";

interface Resource {
    id: string;
    title: string;
    grade: string;
    subject: string;
    medium: string;
    category: string;
    fileUrl?: string;
    filePath?: string;
    videoUrl?: string;
}

export default function AdminPanel() {
    const router = useRouter();
    const [tab, setTab] = useState<Tab>("resources");
    const [loading, setLoading] = useState(true);

    // Loading states for different actions
    const [uploadLoading, setUploadLoading] = useState(false);
    const [deleteResourceLoading, setDeleteResourceLoading] = useState<string | null>(null);
    const [addOptionLoading, setAddOptionLoading] = useState(false);
    const [deleteOptionLoading, setDeleteOptionLoading] = useState<string | null>(null);
    const [logoutLoading, setLogoutLoading] = useState(false);

    const [grades, setGrades] = useState<string[]>([]);
    const [subjects, setSubjects] = useState<string[]>([]);
    const [mediums, setMediums] = useState<string[]>([]);
    const [categories, setCategories] = useState<string[]>([]);

    const [resources, setResources] = useState<Resource[]>([]);
    const [file, setFile] = useState<File | null>(null);
    const [resourceForm, setResourceForm] = useState({
        title: "",
        grade: "",
        subject: "",
        medium: "",
        category: "",
        videoUrl: "",
    });
    const [newOption, setNewOption] = useState("");

    // Search states
    const [searchQuery, setSearchQuery] = useState("");

    // Filtered data based on search
    const filteredResources = resources.filter(resource =>
        resource.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        resource.grade.toLowerCase().includes(searchQuery.toLowerCase()) ||
        resource.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
        resource.medium.toLowerCase().includes(searchQuery.toLowerCase()) ||
        resource.category.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const getFilteredOptions = (options: string[]) => {
        return options.filter(option =>
            option.toLowerCase().includes(searchQuery.toLowerCase())
        );
    };

    // Auth check
    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (user) => {
            if (!user) router.push("/login");
            else setLoading(false);
        });
        return () => unsubscribe();
    }, [router]);

    const loadDropdowns = async () => {
        const load = async (col: string) =>
            (await getDocs(collection(db, col))).docs.map((d) => (d.data() as DocumentData).name);
        setGrades(await load("grades"));
        setSubjects(await load("subjects"));
        setMediums(await load("mediums"));
        setCategories(await load("categories"));
    };

    const loadResources = async () => {
        const snapshot = await getDocs(collection(db, "resources"));
        setResources(snapshot.docs.map((doc) => ({
            id: doc.id,
            ...(doc.data() as Omit<Resource, 'id'>)
        })));
    };

    useEffect(() => {
        if (!loading) {
            loadDropdowns();
            loadResources();
        }
    }, [loading]);

    const handleResourceInputChange = (
        e: ChangeEvent<HTMLInputElement | HTMLSelectElement>
    ) => {
        setResourceForm({ ...resourceForm, [e.target.name]: e.target.value });
    };

    const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) setFile(e.target.files[0]);
    };

    const handleAddOption = async (
        type: "grades" | "subjects" | "mediums" | "categories"
    ) => {
        if (!newOption.trim()) return toast.error("Enter a value first");

        setAddOptionLoading(true);
        try {
            await addDoc(collection(db, type), { name: newOption });
            setNewOption("");
            toast.success(`${type.slice(0, -1)} added successfully!`);
            await loadDropdowns();
        } catch (error) {
            toast.error("Failed to add option");
        } finally {
            setAddOptionLoading(false);
        }
    };

    const handleDeleteOption = async (
        type: "grades" | "subjects" | "mediums" | "categories",
        name: string
    ) => {
        setDeleteOptionLoading(name);
        try {
            const q = query(collection(db, type), where("name", "==", name));
            const snapshot = await getDocs(q);
            if (!snapshot.empty) {
                await deleteDoc(doc(db, type, snapshot.docs[0].id));
                toast.success(`${type.slice(0, -1)} deleted successfully!`);
                await loadDropdowns();
            }
        } catch (error) {
            toast.error("Failed to delete option");
        } finally {
            setDeleteOptionLoading(null);
        }
    };

    const handleUpload = async (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (!file && resourceForm.category !== "Video" && !resourceForm.videoUrl)
            return toast.error("Upload file or provide video URL");

        setUploadLoading(true);
        try {
            let fileUrl = "";
            let filePath = "";

            if (resourceForm.category !== "Video" && file) {
                const formData = new FormData();
                formData.append("file", file);
                formData.append("grade", resourceForm.grade);
                formData.append("subject", resourceForm.subject);
                formData.append("medium", resourceForm.medium);

                const res = await fetch("/api/upload", { method: "POST", body: formData });
                const data = await res.json();
                if (data.success) {
                    fileUrl = data.fileUrl;
                    filePath = data.relativePath;
                } else {
                    toast.error(data.error || "File upload failed");
                    return;
                }
            }

            await addDoc(collection(db, "resources"), {
                ...resourceForm,
                fileUrl,
                filePath,
                createdAt: new Date(),
            });

            toast.success("Resource uploaded successfully!");
            setResourceForm({ title: "", grade: "", subject: "", medium: "", category: "", videoUrl: "" });
            setFile(null);
            loadResources();
        } catch (err) {
            console.error(err);
            toast.error("Upload failed");
        } finally {
            setUploadLoading(false);
        }
    };

    const handleDeleteResource = async (id: string, filePath?: string) => {
        setDeleteResourceLoading(id);
        try {
            if (filePath)
                await fetch("/api/delete", {
                    method: "DELETE",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ filePath }),
                });
            await deleteDoc(doc(db, "resources", id));
            toast.success("Resource deleted successfully!");
            loadResources();
        } catch (err) {
            console.error(err);
            toast.error("Delete failed");
        } finally {
            setDeleteResourceLoading(null);
        }
    };

    const handleLogout = async () => {
        setLogoutLoading(true);
        try {
            await signOut(auth);
            router.push("/login");
        } catch (error) {
            toast.error("Logout failed");
            setLogoutLoading(false);
        }
    };

    const getTabIcon = (tabName: Tab) => {
        switch (tabName) {
            case "resources": return BookOpen;
            case "grades": return GraduationCap;
            case "subjects": return Database;
            case "mediums": return Globe;
            case "categories": return Tag;
            default: return Settings;
        }
    };

    const getTabColor = (tabName: Tab) => {
        switch (tabName) {
            case "resources": return "text-blue-400";
            case "grades": return "text-cyan-400";
            case "subjects": return "text-indigo-400";
            case "mediums": return "text-sky-400";
            case "categories": return "text-blue-300";
            default: return "text-gray-400";
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-navy-900 flex items-center justify-center">
                <div className="text-center space-y-4">
                    <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-400 mx-auto"></div>
                    <p className="text-blue-300 text-lg">Loading Admin Panel...</p>
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
                <div className="flex justify-between items-center mb-8">
                    <div className="flex items-center space-x-4">
                        <div className="inline-flex items-center justify-center w-12 h-12 bg-gradient-to-r from-blue-600 to-cyan-600 rounded-xl shadow-lg">
                            <Shield className="w-6 h-6 text-white" />
                        </div>
                        <div>
                            <h1 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-cyan-400 to-indigo-400">
                                Admin Panel
                            </h1>
                            <p className="text-blue-300">Manage your educational resources</p>
                        </div>
                    </div>

                    <button
                        onClick={handleLogout}
                        disabled={logoutLoading}
                        className="group flex items-center space-x-2 px-4 py-2 bg-red-500/20 hover:bg-red-500/30 border border-red-500/30 text-red-300 rounded-xl transition-all duration-300 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                    >
                        {logoutLoading ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                            <LogOut className="w-4 h-4" />
                        )}
                        <span>Logout</span>
                    </button>
                </div>

                {/* Navigation Tabs */}
                <div className="flex flex-wrap gap-2 mb-8">
                    {["resources", "grades", "subjects", "mediums", "categories"].map((t) => {
                        const IconComponent = getTabIcon(t as Tab);
                        const isActive = tab === t;
                        return (
                            <button
                                key={t}
                                onClick={() => setTab(t as Tab)}
                                className={`group flex items-center space-x-2 px-4 py-3 rounded-xl font-medium transition-all duration-300 ${
                                    isActive
                                        ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-500/25"
                                        : "bg-white/10 backdrop-blur-lg border border-white/20 text-gray-300 hover:bg-white/20"
                                }`}
                            >
                                <IconComponent className={`w-4 h-4 ${isActive ? "text-white" : getTabColor(t as Tab)}`} />
                                <span>{t.charAt(0).toUpperCase() + t.slice(1)}</span>
                            </button>
                        );
                    })}
                </div>

                {/* Content Area */}
                <div className="bg-white/10 backdrop-blur-lg rounded-2xl border border-white/20 p-8">
                    {/* Search Bar - Always visible */}
                    <div className="mb-8">
                        <div className="relative">
                            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                            <input
                                type="text"
                                placeholder={`Search ${tab === 'resources' ? 'resources...' : `${tab}...`}`}
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full bg-white/10 border border-white/20 rounded-xl pl-12 pr-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                            {searchQuery && (
                                <button
                                    onClick={() => setSearchQuery("")}
                                    className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white transition-colors"
                                >
                                    ✕
                                </button>
                            )}
                        </div>
                        {searchQuery && (
                            <p className="text-sm text-gray-400 mt-2">
                                {tab === 'resources'
                                    ? `Found ${filteredResources.length} resource(s) matching "${searchQuery}"`
                                    : `Found ${getFilteredOptions(
                                        tab === "grades" ? grades :
                                            tab === "subjects" ? subjects :
                                                tab === "mediums" ? mediums : categories
                                    ).length} ${tab.slice(0, -1)}(s) matching "${searchQuery}"`
                                }
                            </p>
                        )}
                    </div>

                    {/* Resource Tab */}
                    {tab === "resources" && (
                        <div className="space-y-8">
                            {/* Upload Form */}
                            <div className="bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/10">
                                <h2 className="text-xl font-semibold text-white mb-6 flex items-center space-x-2">
                                    <Upload className="w-5 h-5 text-blue-400" />
                                    <span>Upload New Resource</span>
                                </h2>

                                <form className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4" onSubmit={handleUpload}>
                                    <input
                                        type="text"
                                        name="title"
                                        placeholder="Resource Title"
                                        value={resourceForm.title}
                                        onChange={handleResourceInputChange}
                                        disabled={uploadLoading}
                                        className="bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed"
                                        required
                                    />

                                    <select
                                        name="grade"
                                        value={resourceForm.grade}
                                        onChange={handleResourceInputChange}
                                        disabled={uploadLoading}
                                        className="bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                                        required
                                    >
                                        <option value="" className="bg-gray-800">Select Grade</option>
                                        {grades.map((g, i) => (
                                            <option key={`${g}-${i}`} value={g} className="bg-gray-800">{g}</option>
                                        ))}
                                    </select>

                                    <select
                                        name="subject"
                                        value={resourceForm.subject}
                                        onChange={handleResourceInputChange}
                                        disabled={uploadLoading}
                                        className="bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                                        required
                                    >
                                        <option value="" className="bg-gray-800">Select Subject</option>
                                        {subjects.map((s, i) => (
                                            <option key={`${s}-${i}`} value={s} className="bg-gray-800">{s}</option>
                                        ))}
                                    </select>

                                    <select
                                        name="medium"
                                        value={resourceForm.medium}
                                        onChange={handleResourceInputChange}
                                        disabled={uploadLoading}
                                        className="bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                                        required
                                    >
                                        <option value="" className="bg-gray-800">Select Medium</option>
                                        {mediums.map((m, i) => (
                                            <option key={`${m}-${i}`} value={m} className="bg-gray-800">{m}</option>
                                        ))}
                                    </select>

                                    <select
                                        name="category"
                                        value={resourceForm.category}
                                        onChange={handleResourceInputChange}
                                        disabled={uploadLoading}
                                        className="bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                                        required
                                    >
                                        <option value="" className="bg-gray-800">Select Category</option>
                                        {categories.map((c, i) => (
                                            <option key={`${c}-${i}`} value={c} className="bg-gray-800">{c}</option>
                                        ))}
                                    </select>

                                    {resourceForm.category === "Video" ? (
                                        <input
                                            type="text"
                                            name="videoUrl"
                                            placeholder="Video URL"
                                            value={resourceForm.videoUrl}
                                            onChange={handleResourceInputChange}
                                            disabled={uploadLoading}
                                            className="bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                                            required
                                        />
                                    ) : (
                                        <input
                                            type="file"
                                            onChange={handleFileChange}
                                            disabled={uploadLoading}
                                            className="bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-white file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-blue-600 file:text-white hover:file:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                                            required={!file && resourceForm.category !== "Video"}
                                            key={`file-input-${resourceForm.category}`}
                                        />
                                    )}

                                    <button
                                        type="submit"
                                        disabled={uploadLoading}
                                        className="md:col-span-2 lg:col-span-3 group flex items-center justify-center space-x-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg font-semibold hover:scale-105 transition-all duration-300 shadow-lg hover:shadow-blue-500/25 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                                    >
                                        {uploadLoading ? (
                                            <Loader2 className="w-5 h-5 animate-spin" />
                                        ) : (
                                            <Upload className="w-5 h-5" />
                                        )}
                                        <span>{uploadLoading ? "Uploading..." : "Upload Resource"}</span>
                                    </button>
                                </form>
                            </div>

                            {/* Resources List */}
                            <div>
                                <h2 className="text-xl font-semibold text-white mb-6 flex items-center space-x-2">
                                    <Database className="w-5 h-5 text-cyan-400" />
                                    <span>
                                        {searchQuery ? `Search Results (${filteredResources.length})` : `Existing Resources (${resources.length})`}
                                    </span>
                                </h2>

                                {filteredResources.length === 0 ? (
                                    <div className="text-center py-12 text-gray-400">
                                        {searchQuery ? (
                                            <div>
                                                <Search className="w-12 h-12 mx-auto mb-4 opacity-50" />
                                                <p className="text-lg">No resources found matching "{searchQuery}"</p>
                                                <p className="text-sm mt-2">Try adjusting your search terms</p>
                                            </div>
                                        ) : (
                                            <p>No resources uploaded yet</p>
                                        )}
                                    </div>
                                ) : (
                                    <div className="grid gap-4">
                                        {filteredResources.map((r) => (
                                            <div
                                                key={r.id}
                                                className="bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/10 hover:bg-white/10 transition-all duration-300 group"
                                            >
                                                <div className="flex justify-between items-start">
                                                    <div className="flex-1">
                                                        <h3 className="text-lg font-semibold text-white mb-2">{r.title}</h3>
                                                        <div className="flex flex-wrap gap-2 mb-4">
                                                            <span className="px-2 py-1 bg-blue-500/20 text-blue-300 rounded-lg text-sm border border-blue-500/30">{r.grade}</span>
                                                            <span className="px-2 py-1 bg-cyan-500/20 text-cyan-300 rounded-lg text-sm border border-cyan-500/30">{r.subject}</span>
                                                            <span className="px-2 py-1 bg-indigo-500/20 text-indigo-300 rounded-lg text-sm border border-indigo-500/30">{r.medium}</span>
                                                            <span className="px-2 py-1 bg-sky-500/20 text-sky-300 rounded-lg text-sm border border-sky-500/30">{r.category}</span>
                                                        </div>

                                                        <div className="flex flex-wrap gap-3">
                                                            {r.fileUrl && (
                                                                <a
                                                                    href={r.fileUrl}
                                                                    target="_blank"
                                                                    rel="noreferrer"
                                                                    className="flex items-center space-x-2 text-blue-400 hover:text-blue-300 transition-colors group"
                                                                >
                                                                    <Download className="w-4 h-4" />
                                                                    <span>Download File</span>
                                                                    <ExternalLink className="w-3 h-3" />
                                                                </a>
                                                            )}
                                                            {r.videoUrl && (
                                                                <a
                                                                    href={r.videoUrl}
                                                                    target="_blank"
                                                                    rel="noreferrer"
                                                                    className="flex items-center space-x-2 text-green-400 hover:text-green-300 transition-colors group"
                                                                >
                                                                    <Play className="w-4 h-4" />
                                                                    <span>Watch Video</span>
                                                                    <ExternalLink className="w-3 h-3" />
                                                                </a>
                                                            )}
                                                        </div>
                                                    </div>

                                                    <button
                                                        onClick={() => handleDeleteResource(r.id, r.filePath)}
                                                        disabled={deleteResourceLoading === r.id}
                                                        className="flex items-center space-x-2 px-3 py-2 bg-red-500/20 hover:bg-red-500/30 border border-red-500/30 text-red-300 rounded-lg transition-all duration-300 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                                                    >
                                                        {deleteResourceLoading === r.id ? (
                                                            <Loader2 className="w-4 h-4 animate-spin" />
                                                        ) : (
                                                            <Trash2 className="w-4 h-4" />
                                                        )}
                                                        <span>{deleteResourceLoading === r.id ? "Deleting..." : "Delete"}</span>
                                                    </button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Management Tabs */}
                    {["grades", "subjects", "mediums", "categories"].includes(tab) && (
                        <div className="space-y-6">
                            <div className="flex items-center space-x-3 mb-6">
                                {(() => {
                                    const IconComponent = getTabIcon(tab);
                                    return <IconComponent className={`w-6 h-6 ${getTabColor(tab)}`} />;
                                })()}
                                <h2 className="text-2xl font-semibold text-white">
                                    Manage {tab.charAt(0).toUpperCase() + tab.slice(1)}
                                </h2>
                            </div>

                            {/* Add new item */}
                            <div className="bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/10">
                                <div className="flex gap-3">
                                    <input
                                        type="text"
                                        value={newOption}
                                        onChange={(e) => setNewOption(e.target.value)}
                                        disabled={addOptionLoading}
                                        className="flex-1 bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                                        placeholder={`Add new ${tab.slice(0, -1)}`}
                                    />
                                    <button
                                        onClick={() => handleAddOption(tab as any)}
                                        disabled={addOptionLoading}
                                        className="flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-lg font-semibold hover:scale-105 transition-all duration-300 shadow-lg hover:shadow-green-500/25 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                                    >
                                        {addOptionLoading ? (
                                            <Loader2 className="w-4 h-4 animate-spin" />
                                        ) : (
                                            <Plus className="w-4 h-4" />
                                        )}
                                        <span>{addOptionLoading ? "Adding..." : "Add"}</span>
                                    </button>
                                </div>
                            </div>

                            {/* Items list */}
                            <div className="space-y-3">
                                {(() => {
                                    const currentOptions = tab === "grades" ? grades : tab === "subjects" ? subjects : tab === "mediums" ? mediums : categories;
                                    const filteredOptions = getFilteredOptions(currentOptions);

                                    if (filteredOptions.length === 0) {
                                        return (
                                            <div className="text-center py-12 text-gray-400">
                                                {searchQuery ? (
                                                    <div>
                                                        <Search className="w-12 h-12 mx-auto mb-4 opacity-50" />
                                                        <p className="text-lg">No {tab.slice(0, -1)} found matching "{searchQuery}"</p>
                                                        <p className="text-sm mt-2">Try adjusting your search terms</p>
                                                    </div>
                                                ) : (
                                                    <p>No {tab} added yet</p>
                                                )}
                                            </div>
                                        );
                                    }

                                    return filteredOptions.map((item, index) => (
                                        <div
                                            key={`${item}-${index}`}
                                            className="bg-white/5 backdrop-blur-sm rounded-lg p-4 border border-white/10 flex justify-between items-center hover:bg-white/10 transition-all duration-300 group"
                                        >
                                            <span className="text-white font-medium">{item}</span>
                                            <button
                                                onClick={() => handleDeleteOption(tab as any, item)}
                                                disabled={deleteOptionLoading === item}
                                                className="flex items-center space-x-2 px-3 py-2 bg-red-500/20 hover:bg-red-500/30 border border-red-500/30 text-red-300 rounded-lg transition-all duration-300 hover:scale-105 opacity-0 group-hover:opacity-100 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                                            >
                                                {deleteOptionLoading === item ? (
                                                    <Loader2 className="w-4 h-4 animate-spin" />
                                                ) : (
                                                    <Trash2 className="w-4 h-4" />
                                                )}
                                                <span>{deleteOptionLoading === item ? "Deleting..." : "Delete"}</span>
                                            </button>
                                        </div>
                                    ));
                                })()}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
