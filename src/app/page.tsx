import Link from "next/link";
import { BookOpen, Shield, GraduationCap, Users, Sparkles, ArrowRight } from "lucide-react";

export default function Home() {
    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-navy-900 relative overflow-hidden">
            {/* Animated background elements */}
            <div className="absolute inset-0 overflow-hidden">
                <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-500 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-pulse"></div>
                <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-cyan-500 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-pulse"></div>
                <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-indigo-500 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-pulse"></div>
            </div>

            {/* Grid overlay */}
            <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.02)_1px,transparent_1px)] bg-[size:100px_100px]"></div>

            {/* Main content */}
            <div className="relative z-10 min-h-screen flex flex-col items-center justify-center px-4 sm:px-8">
                {/* Header section */}
                <div className="text-center mb-12 space-y-6">
                    <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-r from-blue-600 to-cyan-600 rounded-2xl mb-6 shadow-2xl">
                        <GraduationCap className="w-10 h-10 text-white" />
                    </div>

                    <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-cyan-400 to-indigo-400 leading-tight">
                        Edu Resources
                    </h1>

                    <div className="flex items-center justify-center space-x-2 text-blue-300">
                        <Sparkles className="w-5 h-5" />
                        <span className="text-xl font-medium">Portal</span>
                        <Sparkles className="w-5 h-5" />
                    </div>
                </div>

                {/* Description */}
                <p className="text-center mb-12 text-gray-300 max-w-2xl text-lg leading-relaxed">
                    Your comprehensive educational hub featuring curated textbooks, model papers,
                    concise study notes, and engaging video content. Empowering learners and educators
                    with seamless resource management.
                </p>

                {/* Feature cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-12 max-w-4xl w-full">
                    <div className="bg-white/10 backdrop-blur-lg rounded-xl p-4 border border-white/20 hover:bg-white/20 transition-all duration-300 group">
                        <BookOpen className="w-8 h-8 text-blue-400 mb-2 group-hover:scale-110 transition-transform" />
                        <h3 className="text-white font-semibold text-sm">Textbooks</h3>
                    </div>
                    <div className="bg-white/10 backdrop-blur-lg rounded-xl p-4 border border-white/20 hover:bg-white/20 transition-all duration-300 group">
                        <Shield className="w-8 h-8 text-cyan-400 mb-2 group-hover:scale-110 transition-transform" />
                        <h3 className="text-white font-semibold text-sm">Model Papers</h3>
                    </div>
                    <div className="bg-white/10 backdrop-blur-lg rounded-xl p-4 border border-white/20 hover:bg-white/20 transition-all duration-300 group">
                        <Users className="w-8 h-8 text-indigo-400 mb-2 group-hover:scale-110 transition-transform" />
                        <h3 className="text-white font-semibold text-sm">Study Notes</h3>
                    </div>
                    <div className="bg-white/10 backdrop-blur-lg rounded-xl p-4 border border-white/20 hover:bg-white/20 transition-all duration-300 group">
                        <Sparkles className="w-8 h-8 text-sky-400 mb-2 group-hover:scale-110 transition-transform" />
                        <h3 className="text-white font-semibold text-sm">Videos</h3>
                    </div>
                </div>

                {/* Action buttons */}
                <div className="flex flex-col sm:flex-row gap-6 mb-16">
                    <Link
                        href="/admin"
                        className="group relative px-8 py-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-2xl text-lg font-semibold shadow-2xl hover:shadow-blue-500/25 hover:scale-105 transition-all duration-300 flex items-center justify-center space-x-3"
                    >
                        <Shield className="w-5 h-5" />
                        <span>Admin Panel</span>
                        <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                        <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl blur opacity-75 group-hover:opacity-100 transition-opacity -z-10"></div>
                    </Link>

                    <Link
                        href="/resources"
                        className="group relative px-8 py-4 bg-white/10 backdrop-blur-lg border-2 border-white/20 text-white rounded-2xl text-lg font-semibold hover:bg-white/20 hover:border-white/40 hover:scale-105 transition-all duration-300 flex items-center justify-center space-x-3"
                    >
                        <BookOpen className="w-5 h-5" />
                        <span>View Resources</span>
                        <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                    </Link>
                </div>

                {/* Stats section */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-8 mb-16 max-w-2xl w-full">
                    <div className="text-center">
                        <div className="text-2xl sm:text-3xl font-bold text-white mb-1">500+</div>
                        <div className="text-sm text-gray-400">Resources</div>
                    </div>
                    <div className="text-center">
                        <div className="text-2xl sm:text-3xl font-bold text-white mb-1">50K+</div>
                        <div className="text-sm text-gray-400">Students</div>
                    </div>
                    <div className="text-center">
                        <div className="text-2xl sm:text-3xl font-bold text-white mb-1">100+</div>
                        <div className="text-sm text-gray-400">Subjects</div>
                    </div>
                    <div className="text-center">
                        <div className="text-2xl sm:text-3xl font-bold text-white mb-1">24/7</div>
                        <div className="text-sm text-gray-400">Access</div>
                    </div>
                </div>

                {/* Footer */}
                <footer className="text-center text-gray-500 text-sm backdrop-blur-sm bg-white/5 px-6 py-3 rounded-full border border-white/10">
          <span className="flex items-center justify-center space-x-2">
            <span>&copy; 2025 Edu Resources Portal.</span>
            <Sparkles className="w-4 h-4" />
            <span>Crafted with passion</span>
          </span>
                </footer>
            </div>
        </div>
    );
}