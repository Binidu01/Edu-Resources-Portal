"use client";

import { useEffect, useState, ChangeEvent } from "react";
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
    Download,
    Play,
    Settings,
    Database,
    Globe,
    Tag,
    Loader2
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

    // Loading states
    const [uploadLoading, setUploadLoading] = useState(false);
    const [addOptionLoading, setAddOptionLoading] = useState(false);
    const [deleteOptionLoading, setDeleteOptionLoading] = useState<string | null>(null);
    const [deleteResourceLoading, setDeleteResourceLoading] = useState<string | null>(null);
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
        setResources(
            snapshot.docs.map((doc) => {
                const data = doc.data() as Partial<Resource>;
                return {
                    id: doc.id,
                    title: data.title || "",
                    grade: data.grade || "",
                    subject: data.subject || "",
                    medium: data.medium || "",
                    category: data.category || "",
                    fileUrl: data.fileUrl,
                    filePath: data.filePath,
                    videoUrl: data.videoUrl,
                };
            })
        );
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
        } catch {
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
        } catch {
            toast.error("Failed to delete option");
        } finally {
            setDeleteOptionLoading(null);
        }
    };

    const handleUpload = async () => {
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
                } else return toast.error(data.error || "File upload failed");
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
        } catch {
            toast.error("Failed to upload resource");
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
        } catch {
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
        } catch {
            toast.error("Failed to logout");
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
            {/* Animated background */}
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
                    {/* Resource Tab */}
                    {tab === "resources" && (
                        <div className="space-y-8">
                            {/* Upload Form */}
                            <div className="bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/10">
                                <h2 className="text-xl font-semibold text-white mb-6 flex items-center space-x-2">
                                    <Upload className="w-5 h-5 text-blue-400" />
                                    <span>Upload New Resource</span>
                                </h2>

                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
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
                                            type="url"
                                            name="videoUrl"
                                            placeholder="Video URL"
                                            value={resourceForm.videoUrl}
                                            onChange={handleResourceInputChange}
                                            disabled={uploadLoading}
                                            className="bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                                        />
                                    ) : (
                                        <input
                                            type="file"
                                            onChange={handleFileChange}
                                            disabled={uploadLoading}
                                            className="bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                                        />
                                    )}

                                    <button
                                        onClick={handleUpload}
                                        disabled={uploadLoading}
                                        className="flex items-center justify-center space-x-2 bg-blue-600 hover:bg-blue-700 rounded-lg px-4 py-3 text-white font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        {uploadLoading && <Loader2 className="w-4 h-4 animate-spin" />}
                                        <span>Upload Resource</span>
                                    </button>
                                </div>
                            </div>

                            {/* Resource List */}
                            <div className="bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/10">
                                <h2 className="text-xl font-semibold text-white mb-4 flex items-center space-x-2">
                                    <BookOpen className="w-5 h-5 text-blue-400" />
                                    <span>All Resources</span>
                                </h2>

                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                    {resources.map((res) => (
                                        <div key={res.id} className="bg-white/10 border border-white/20 rounded-lg p-4 text-white flex flex-col justify-between space-y-2">
                                            <h3 className="font-semibold text-lg">{res.title}</h3>
                                            <p className="text-sm text-gray-300">
                                                {res.grade} - {res.subject} - {res.medium} - {res.category}
                                            </p>

                                            <div className="flex space-x-2 mt-2">
                                                {res.fileUrl && (
                                                    <a href={res.fileUrl} target="_blank" rel="noopener noreferrer" className="flex items-center space-x-1 bg-blue-500/20 px-2 py-1 rounded hover:bg-blue-500/30 text-sm">
                                                        <Download className="w-4 h-4" />
                                                        <span>Download</span>
                                                    </a>
                                                )}
                                                {res.videoUrl && (
                                                    <a href={res.videoUrl} target="_blank" rel="noopener noreferrer" className="flex items-center space-x-1 bg-cyan-500/20 px-2 py-1 rounded hover:bg-cyan-500/30 text-sm">
                                                        <Play className="w-4 h-4" />
                                                        <span>Watch</span>
                                                    </a>
                                                )}
                                                <button
                                                    onClick={() => handleDeleteResource(res.id, res.filePath)}
                                                    disabled={deleteResourceLoading === res.id}
                                                    className="flex items-center space-x-1 bg-red-500/20 px-2 py-1 rounded hover:bg-red-500/30 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                                                >
                                                    {deleteResourceLoading === res.id ? (
                                                        <Loader2 className="w-4 h-4 animate-spin" />
                                                    ) : (
                                                        <Trash2 className="w-4 h-4" />
                                                    )}
                                                    <span>Delete</span>
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Other tabs (grades, subjects, mediums, categories) */}
                    {tab !== "resources" && (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {tab === "grades" && grades.map((g) => (
                                <OptionCard key={g} name={g} type="grades" deleteOption={handleDeleteOption} loading={deleteOptionLoading} />
                            ))}
                            {tab === "subjects" && subjects.map((s) => (
                                <OptionCard key={s} name={s} type="subjects" deleteOption={handleDeleteOption} loading={deleteOptionLoading} />
                            ))}
                            {tab === "mediums" && mediums.map((m) => (
                                <OptionCard key={m} name={m} type="mediums" deleteOption={handleDeleteOption} loading={deleteOptionLoading} />
                            ))}
                            {tab === "categories" && categories.map((c) => (
                                <OptionCard key={c} name={c} type="categories" deleteOption={handleDeleteOption} loading={deleteOptionLoading} />
                            ))}

                            {/* Add New Option */}
                            <div className="bg-white/10 border border-white/20 rounded-lg p-4 flex space-x-2">
                                <input
                                    type="text"
                                    value={newOption}
                                    onChange={(e) => setNewOption(e.target.value)}
                                    disabled={addOptionLoading}
                                    placeholder={`New ${tab.slice(0, -1)}`}
                                    className="bg-white/10 border border-white/20 rounded-lg px-4 py-2 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed flex-1"
                                />
                                <button
                                    onClick={() => handleAddOption(tab)}
                                    disabled={addOptionLoading}
                                    className="flex items-center justify-center px-4 py-2 bg-blue-600 rounded-lg text-white font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {addOptionLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

interface OptionCardProps {
    name: string;
    type: "grades" | "subjects" | "mediums" | "categories";
    deleteOption: (type: "grades" | "subjects" | "mediums" | "categories", name: string) => void;
    loading: string | null;
}

const OptionCard = ({ name, type, deleteOption, loading }: OptionCardProps) => (
    <div className="bg-white/10 border border-white/20 rounded-lg p-4 flex justify-between items-center">
        <span className="text-white">{name}</span>
        <button
            onClick={() => deleteOption(type, name)}
            disabled={loading === name}
            className="flex items-center space-x-1 bg-red-500/20 px-2 py-1 rounded hover:bg-red-500/30 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
        >
            {loading === name ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
            <span>Delete</span>
        </button>
    </div>
);
