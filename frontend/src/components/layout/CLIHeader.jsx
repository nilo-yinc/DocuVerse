import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
    Terminal, Play, ChevronRight, X, Minus, Square,
    Home, Library, FileText, Settings, User, Sparkles
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

// ============================================
// CLI HEADER COMPONENT
// VS Code / Terminal themed navigation header
// ============================================

const CLIHeader = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { user, token } = useAuth();
    const [cursorVisible, setCursorVisible] = useState(true);

    // Blinking cursor effect
    useEffect(() => {
        const interval = setInterval(() => {
            setCursorVisible(prev => !prev);
        }, 530);
        return () => clearInterval(interval);
    }, []);

    // Get current page name for terminal prompt
    const getCurrentPage = () => {
        const path = location.pathname;
        if (path === '/') return 'home';
        if (path === '/dashboard') return 'dashboard';
        if (path === '/library') return 'library';
        if (path === '/studio') return 'studio';
        if (path.includes('/project')) return 'project';
        return path.replace('/', '') || 'home';
    };

    // Navigation tabs (like VS Code tabs)
    const tabs = [
        { id: 'home', label: 'index.jsx', path: '/', icon: Home },
        { id: 'dashboard', label: 'dashboard.jsx', path: '/dashboard', icon: FileText },
        { id: 'library', label: 'library.jsx', path: '/library', icon: Library },
    ];

    const isActive = (tabPath) => {
        if (tabPath === '/') return location.pathname === '/';
        return location.pathname.startsWith(tabPath);
    };

    return (
        <header className="fixed w-full z-50 font-mono">
            {/* Window Chrome Bar (like VS Code title bar) */}
            <div className="bg-[#1e1e1e] border-b border-[#3c3c3c] h-8 flex items-center justify-end px-4 relative">

                {/* Center: Window title */}
                <div className="absolute left-1/2 -translate-x-1/2 text-[#8b8b8b] text-xs flex items-center gap-2">
                    <Terminal size={12} />
                    <span>DocuVerse - {getCurrentPage()}.jsx</span>
                </div>

                {/* Right: Minimize/Maximize/Close */}
                <div className="flex items-center gap-3 text-[#8b8b8b]">
                    <Minus size={14} className="hover:text-white cursor-pointer" />
                    <Square size={12} className="hover:text-white cursor-pointer" />
                    <X size={14} className="hover:text-white cursor-pointer" />
                </div>
            </div>

            {/* Main Navigation Bar */}
            <nav className="bg-[#0f0f12]/95 backdrop-blur-md border-b border-white/10">
                <div className="flex items-center justify-between h-10">
                    {/* Left: Tab Bar */}
                    <div className="flex items-center h-full">
                        {/* Logo / Terminal Prompt */}
                        <motion.div
                            className="flex items-center gap-1 px-4 h-full bg-[#1e1e1e] border-r border-white/5 cursor-pointer group"
                            onClick={() => navigate('/')}
                            whileHover={{ backgroundColor: 'rgba(255,255,255,0.05)' }}
                        >
                            <span className="text-[#569cd6]">~/</span>
                            <span className="text-[#4ec9b0]">DocuVerse</span>
                            <span className="text-[#8b8b8b]">/</span>
                            <span className="text-[#dcdcaa]">{getCurrentPage()}</span>
                            <span className={`text-[#58a6ff] ml-1 ${cursorVisible ? 'opacity-100' : 'opacity-0'}`}>▋</span>
                        </motion.div>

                        {/* File Tabs */}
                        <div className="flex h-full">
                            {tabs.map((tab) => {
                                const active = isActive(tab.path);
                                const Icon = tab.icon;
                                return (
                                    <motion.button
                                        key={tab.id}
                                        onClick={() => navigate(tab.path)}
                                        className={`relative flex items-center gap-2 px-4 h-full text-xs transition-colors ${active
                                            ? 'text-white bg-[#1e1e1e]'
                                            : 'text-[#8b8b8b] hover:text-white hover:bg-white/5'
                                            }`}
                                        whileHover={{ backgroundColor: active ? undefined : 'rgba(255,255,255,0.05)' }}
                                    >
                                        {/* Active tab top accent */}
                                        {active && (
                                            <motion.div
                                                className="absolute top-0 left-0 right-0 h-[2px] bg-[#58a6ff]"
                                                layoutId="activeTab"
                                                transition={{ type: "spring", stiffness: 500, damping: 30 }}
                                            />
                                        )}
                                        <Icon size={14} className={active ? 'text-[#58a6ff]' : ''} />
                                        <span>{tab.label}</span>
                                        {/* Close icon on tab */}
                                        <X size={12} className="opacity-0 group-hover:opacity-50 hover:opacity-100 ml-1" />
                                    </motion.button>
                                );
                            })}
                        </div>
                    </div>

                    {/* Right: Actions */}
                    <div className="flex items-center gap-2 px-4 h-full">
                        {/* Run Project Button */}
                        <motion.button
                            onClick={() => navigate('/dashboard')}
                            className="flex items-center gap-2 px-3 py-1.5 bg-[#238636] hover:bg-[#2ea043] text-white text-xs rounded transition-colors"
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                        >
                            <Play size={12} fill="white" />
                            <span>Run</span>
                        </motion.button>

                        {/* User Profile / Terminal Prompt */}
                        <motion.div
                            className="flex items-center gap-2 px-3 py-1.5 text-xs text-[#8b8b8b] hover:text-white hover:bg-white/5 rounded cursor-pointer transition-colors"
                            onClick={() => navigate('/dashboard')}
                            whileHover={{ backgroundColor: 'rgba(255,255,255,0.05)' }}
                        >
                            <User size={12} className="text-[#4ec9b0]" />
                            <span>
                                <span className="text-[#4ec9b0]">{user?.name || 'guest'}</span>
                                <span className="text-[#8b8b8b]">@docuverse</span>
                                <span className="text-[#569cd6]">:~$</span>
                            </span>
                        </motion.div>
                    </div>
                </div>
            </nav>
        </header>
    );
};

export default CLIHeader;
