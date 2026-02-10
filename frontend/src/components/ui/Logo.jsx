import React from 'react';
import { Terminal } from 'lucide-react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs) {
    return twMerge(clsx(inputs));
}

const Logo = ({ className, showText = true, size = "md", subText }) => {
    // Size variants
    const sizes = {
        sm: { container: "w-8 h-8 rounded-lg", icon: 16, text: "text-lg" },
        md: { container: "w-10 h-10 rounded-xl", icon: 20, text: "text-xl" },
        lg: { container: "w-12 h-12 rounded-2xl", icon: 24, text: "text-2xl" }
    };

    const s = sizes[size] || sizes.md;

    return (
        <div className={cn("flex items-center gap-3 select-none", className)}>
            <div className={cn(
                "bg-[#0A0A0A] border border-white/10 flex items-center justify-center shadow-lg relative overflow-hidden group",
                s.container
            )}>
                {/* Subtle Gradient Glow */}
                <div className="absolute inset-0 bg-gradient-to-br from-cyan-900/20 to-violet-900/20 opacity-100 group-hover:opacity-100 transition-opacity"></div>

                {/* Terminal Prompt Icon */}
                <div className="font-mono font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-cyan-200 relative z-10 flex tracking-tighter" style={{ fontSize: s.icon }}>
                    <span className="text-cyan-400 mr-[1px]">&gt;</span>
                    <span className="text-white animate-pulse">_</span>
                </div>
            </div>

            {showText && (
                <div className="flex flex-col">
                    <h1 className={cn("font-bold tracking-tight text-white leading-none", s.text)}>
                        DocuVerse
                    </h1>
                    {subText && (
                        <span className="text-[10px] font-bold tracking-wider text-slate-500 bg-white/5 px-1.5 py-0.5 rounded mt-1 self-start uppercase">
                            {subText}
                        </span>
                    )}
                </div>
            )}
        </div>
    );
};

export default Logo;
