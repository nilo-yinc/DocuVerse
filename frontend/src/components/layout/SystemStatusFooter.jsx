import React from 'react';
import { GitBranch, CheckCircle, Wifi, Bell, XCircle, AlertTriangle } from 'lucide-react';

// ============================================
// SYSTEM STATUS FOOTER COMPONENT
// VS Code / Vim style status bar
// ============================================

const SystemStatusFooter = () => {
    return (
        <footer className="fixed bottom-0 w-full z-50 bg-[#007acc] text-white text-xs font-mono select-none flex items-center px-2 h-6 border-t border-[#1f1f1f]">
            {/* Left Section: System Info */}
            <div className="flex items-center gap-4 h-full shrink-0">
                <div className="flex items-center gap-1 hover:bg-white/10 px-2 h-full cursor-pointer transition-colors">
                    <GitBranch size={10} />
                    <span>main*</span>
                </div>

                <div className="flex items-center gap-2 hover:bg-white/10 px-2 h-full cursor-pointer transition-colors">
                    <XCircle size={10} className="text-white/80" />
                    <span>0</span>
                    <AlertTriangle size={10} className="text-white/80" />
                    <span>0</span>
                </div>

                <div className="hidden lg:flex items-center hover:bg-white/10 px-2 h-full cursor-pointer transition-colors border-r border-white/10">
                    <span>v2.2.0 Stable</span>
                </div>

                <div className="hidden lg:flex items-center px-2 h-full text-white/50 italic">
                    © 2026 DocuVerse. All rights reserved.
                </div>
            </div>

            {/* Spacer */}
            <div className="flex-1" />

            {/* Center Section: Credits */}
            <div className="hidden lg:flex items-center gap-2 h-full shrink-0 mx-4">
                <span className="opacity-60 italic pr-2 border-r border-white/20">Creative Logic Engine</span>
                <span className="opacity-80 ml-2">Designed & Developed by</span>
                <a
                    href="https://www.linkedin.com/in/niloy-mallik/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-bold hover:underline hover:text-white transition-all hover:drop-shadow-[0_0_8px_rgba(255,255,255,0.8)]"
                >
                    Niloy Mallik
                </a>
            </div>

            {/* Spacer */}
            <div className="flex-1" />

            {/* Right Section: Meta & Links */}
            <div className="flex items-center gap-4 h-full shrink-0">
                <div className="hidden sm:flex items-center gap-3">
                    <span className="hover:bg-white/10 px-2 h-full flex items-center cursor-pointer">UTF-8</span>
                    <span className="hover:bg-white/10 px-2 h-full flex items-center cursor-pointer">javascript</span>
                    <span className="hover:bg-white/10 px-2 h-full flex items-center cursor-pointer">Privacy</span>
                </div>

                <div className="flex items-center gap-2 hover:bg-white/10 px-2 h-full cursor-pointer transition-colors">
                    <div className="relative flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                    </div>
                    <span className="hidden sm:inline">System Operational</span>
                </div>

                <div className="hover:bg-white/10 px-2 h-full flex items-center cursor-pointer">
                    <Bell size={10} />
                </div>
            </div>
        </footer>
    );
};

export default SystemStatusFooter;
