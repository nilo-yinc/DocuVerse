import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Layout, Code, Shield, BrainCircuit, ArrowLeft, GitBranch, Activity,
    Play, Pause, RotateCcw, CheckCircle, Terminal
} from 'lucide-react';

// --- Visualizers (Enhanced for Full Screen) ---

const WaterfallVisualizer = ({ active, currentStep, steps }) => {
    return (
        <div className="relative h-full w-full flex flex-col items-center justify-center p-10 perspective-1000">
            <div className="relative transform-style-3d rotate-x-12 rotate-y-12 scale-125">
                {steps.map((step, index) => (
                    <motion.div
                        key={index}
                        initial={{ opacity: 0, x: -50, y: -50 }}
                        animate={{
                            opacity: 1,
                            x: index * 40,
                            y: index * 60,
                            scale: currentStep === index ? 1.1 : 1,
                            backgroundColor: currentStep === index ? "#58a6ff" : "#161b22",
                            borderColor: currentStep === index ? "#79c0ff" : "#30363d",
                            boxShadow: currentStep === index ? "0 0 30px rgba(88,166,255,0.4)" : "none"
                        }}
                        transition={{ duration: 0.5 }}
                        className={`absolute w-64 p-6 border rounded-lg backdrop-blur-sm z-${10 - index}
                            ${currentStep > index ? 'text-[#c9d1d9] border-[#30363d] opacity-50' : ''}
                            ${currentStep === index ? 'text-[#0d1117] font-bold' : 'text-[#8b949e] border-[#30363d]'}
                        `}
                        style={{ top: 0, left: 0 }}
                    >
                        <div className="flex items-center gap-3">
                            <div className="text-sm font-mono opacity-50">0{index + 1}</div>
                            {step.title}
                            {currentStep > index && <CheckCircle size={18} className="ml-auto text-[#238636]" />}
                        </div>
                    </motion.div>
                ))}
            </div>
        </div>
    );
};

const AgileVisualizer = ({ active, currentStep }) => {
    const [rotation, setRotation] = useState(0);

    useEffect(() => {
        if (!active) return;
        const interval = setInterval(() => {
            setRotation(prev => prev + 2); // Smoother rotation
        }, 50);
        return () => clearInterval(interval);
    }, [active]);

    const items = ["Plan", "Design", "Develop", "Test", "Deploy", "Review"];

    return (
        <div className="relative h-full w-full flex items-center justify-center scale-125 transition-transform duration-1000">
            {/* Background Particles */}
            {[...Array(20)].map((_, i) => (
                <motion.div
                    key={i}
                    className="absolute w-1 h-1 bg-[#e9c46a] rounded-full"
                    animate={{
                        x: [Math.random() * 400 - 200, Math.random() * 400 - 200],
                        y: [Math.random() * 400 - 200, Math.random() * 400 - 200],
                        opacity: [0, 1, 0]
                    }}
                    transition={{
                        duration: Math.random() * 3 + 2,
                        repeat: Infinity,
                        ease: "easeInOut"
                    }}
                />
            ))}

            <motion.div
                animate={{ rotate: rotation }}
                transition={{ duration: 0, ease: "linear" }}
                className="relative w-96 h-96"
            >
                {items.map((item, i) => {
                    const angle = (i * 360) / items.length;
                    const rad = (angle * Math.PI) / 180;
                    const x = Math.cos(rad) * 180;
                    const y = Math.sin(rad) * 180;

                    return (
                        <motion.div
                            key={i}
                            className={`absolute w-24 h-24 rounded-full flex items-center justify-center text-sm font-bold border-2 bg-[#0d1117] z-10 shadow-lg
                                ${currentStep === i // Rough mapping loop
                                    ? 'border-[#e9c46a] text-[#e9c46a] shadow-[0_0_20px_rgba(233,196,106,0.3)] scale-110'
                                    : 'border-[#30363d] text-[#8b949e]'}
                            `}
                            style={{
                                left: `calc(50% + ${x}px - 48px)`,
                                top: `calc(50% + ${y}px - 48px)`,
                            }}
                        >
                            <motion.div
                                animate={{ rotate: -rotation }}
                                transition={{ duration: 0, ease: "linear" }}
                            >
                                {item}
                            </motion.div>
                        </motion.div>
                    );
                })}
                {/* Connecting Ring */}
                <div className="absolute inset-0 rounded-full border-4 border-[#30363d] opacity-30"></div>
                <motion.div
                    className="absolute inset-0 rounded-full border-t-4 border-[#e9c46a]"
                    animate={{ rotate: 360 }}
                    transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                />
            </motion.div>

            <div className="absolute text-center z-20 bg-[#0d1117]/80 backdrop-blur px-6 py-4 rounded-xl border border-[#30363d]">
                <div className="text-3xl font-bold text-white tracking-widest">SPRINT</div>
                <div className="text-xs text-[#e9c46a] animate-pulse uppercase tracking-wider mt-1">Iteration Cycle Active</div>
            </div>
        </div>
    );
};

// Iterative Waterfall Model Visualizer - 3D Cascade with Feedback Loops
const IterativeWaterfallVisualizer = ({ active, currentStep, steps }) => {
    const [feedbackActive, setFeedbackActive] = useState(-1);

    useEffect(() => {
        if (!active) return;
        // Simulate feedback arrows activating
        const interval = setInterval(() => {
            setFeedbackActive(prev => (prev + 1) % steps.length);
        }, 2000);
        return () => clearInterval(interval);
    }, [active, steps.length]);

    const phaseColors = [
        { bg: 'bg-[#2ea043]', border: 'border-[#3fb950]', text: 'text-[#3fb950]', glow: 'shadow-green-500/30' },
        { bg: 'bg-[#2ea043]', border: 'border-[#3fb950]', text: 'text-[#3fb950]', glow: 'shadow-green-500/30' },
        { bg: 'bg-[#58a6ff]', border: 'border-[#79c0ff]', text: 'text-[#79c0ff]', glow: 'shadow-blue-500/30' },
        { bg: 'bg-[#e9c46a]', border: 'border-[#f2cc60]', text: 'text-[#f2cc60]', glow: 'shadow-yellow-500/30' },
        { bg: 'bg-[#f78166]', border: 'border-[#ffa198]', text: 'text-[#ffa198]', glow: 'shadow-orange-500/30' },
        { bg: 'bg-[#db61a2]', border: 'border-[#f778ba]', text: 'text-[#f778ba]', glow: 'shadow-pink-500/30' },
    ];

    return (
        <div className="relative h-full w-full flex items-center justify-center overflow-hidden">
            {/* Background gradient effect */}
            <div className="absolute inset-0 bg-gradient-to-br from-[#0d1117] via-[#161b22] to-[#0d1117]"></div>

            {/* Feedback Loop Line - Left side */}
            <motion.div
                className="absolute left-16 top-20 bottom-20 w-[3px] border-l-2 border-dashed border-[#db61a2] opacity-60"
                animate={{ opacity: [0.3, 0.8, 0.3] }}
                transition={{ duration: 2, repeat: Infinity }}
            />
            <div className="absolute left-10 top-1/2 -translate-y-1/2 -rotate-90 text-[#db61a2] text-sm font-bold tracking-wider">
                FEEDBACK
            </div>

            {/* Animated feedback arrows */}
            {steps.slice(0, -1).map((_, idx) => (
                <motion.div
                    key={`feedback-${idx}`}
                    className="absolute left-14 w-4 h-4"
                    style={{ top: `${20 + (idx * 12)}%` }}
                    animate={{
                        x: feedbackActive === idx ? [-5, 0] : 0,
                        opacity: feedbackActive === idx ? [0, 1, 1, 0] : 0.3,
                    }}
                    transition={{ duration: 1.5 }}
                >
                    <svg viewBox="0 0 24 24" fill="none" className="text-[#db61a2]">
                        <path d="M19 12H5M12 5l-7 7 7 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                </motion.div>
            ))}

            {/* Main Cascade Structure */}
            <div className="relative z-10 flex flex-col items-center" style={{ transform: 'perspective(1000px) rotateX(5deg)' }}>
                {steps.map((step, index) => {
                    const color = phaseColors[index % phaseColors.length];
                    const isActive = currentStep === index;
                    const isPast = currentStep > index;

                    return (
                        <div key={index} className="relative">
                            {/* Phase Box */}
                            <motion.div
                                initial={{ opacity: 0, x: -100 }}
                                animate={{
                                    opacity: 1,
                                    x: index * 35,
                                    scale: isActive ? 1.05 : 1,
                                    boxShadow: isActive ? `0 0 40px ${color.glow.replace('shadow-', 'rgba(').replace('/30', ', 0.4)')}` : 'none'
                                }}
                                transition={{ duration: 0.5, delay: index * 0.1 }}
                                className={`w-56 px-6 py-4 rounded-lg border-2 backdrop-blur-sm transition-all duration-300
                                    ${isActive ? `${color.bg} ${color.border} shadow-xl` : 'bg-[#161b22]/90 border-[#30363d]'}
                                    ${isPast ? 'opacity-50' : 'opacity-100'}
                                `}
                            >
                                <div className="flex items-center gap-3">
                                    <span className={`text-xs font-mono ${isActive ? 'text-white' : 'text-[#8b949e]'}`}>
                                        {String(index + 1).padStart(2, '0')}
                                    </span>
                                    <span className={`font-bold ${isActive ? 'text-white' : 'text-[#c9d1d9]'}`}>
                                        {step.title}
                                    </span>
                                    {isPast && (
                                        <motion.div
                                            initial={{ scale: 0 }}
                                            animate={{ scale: 1 }}
                                            className="ml-auto"
                                        >
                                            <CheckCircle size={16} className="text-[#238636]" />
                                        </motion.div>
                                    )}
                                </div>
                            </motion.div>

                            {/* Connector Arrow Down and Right */}
                            {index < steps.length - 1 && (
                                <motion.div
                                    className="relative h-8 flex items-center"
                                    style={{ marginLeft: `${index * 35 + 100}px` }}
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    transition={{ delay: index * 0.1 + 0.3 }}
                                >
                                    <svg width="60" height="32" viewBox="0 0 60 32" fill="none" className="text-[#30363d]">
                                        <path
                                            d="M10 0 V16 Q10 24 18 24 H52"
                                            stroke="currentColor"
                                            strokeWidth="2"
                                            strokeDasharray={isActive ? "0" : "4 4"}
                                        />
                                        <path
                                            d="M48 20 L56 24 L48 28"
                                            stroke="currentColor"
                                            strokeWidth="2"
                                            fill="none"
                                        />
                                    </svg>

                                    {/* Animated flow indicator */}
                                    {isActive && (
                                        <motion.div
                                            className="absolute w-2 h-2 bg-white rounded-full"
                                            animate={{
                                                x: [10, 50],
                                                y: [0, 16, 20],
                                            }}
                                            transition={{
                                                duration: 1,
                                                repeat: Infinity,
                                                ease: "easeInOut"
                                            }}
                                        />
                                    )}
                                </motion.div>
                            )}
                        </div>
                    );
                })}
            </div>

            {/* Model Label */}
            <div className="absolute bottom-8 left-1/2 -translate-x-1/2 text-center">
                <div className="text-lg font-bold text-white tracking-wide">Iterative Waterfall Model</div>
                <div className="text-xs text-[#8b949e] mt-1">Sequential phases with feedback capability</div>
            </div>

            {/* Legend */}
            <div className="absolute bottom-8 right-8 bg-[#161b22]/80 backdrop-blur border border-[#30363d] rounded-lg p-4 text-xs">
                <div className="flex items-center gap-2 mb-2">
                    <div className="w-3 h-3 bg-[#2ea043] rounded"></div>
                    <span className="text-[#8b949e]">Planning & Analysis</span>
                </div>
                <div className="flex items-center gap-2 mb-2">
                    <div className="w-3 h-3 bg-[#58a6ff] rounded"></div>
                    <span className="text-[#8b949e]">Design</span>
                </div>
                <div className="flex items-center gap-2 mb-2">
                    <div className="w-3 h-3 bg-[#e9c46a] rounded"></div>
                    <span className="text-[#8b949e]">Implementation</span>
                </div>
                <div className="flex items-center gap-2">
                    <svg width="20" height="10" className="text-[#db61a2]">
                        <path d="M15 5 H5 M8 2 L5 5 L8 8" stroke="currentColor" strokeWidth="1.5" fill="none" strokeDasharray="2 2" />
                    </svg>
                    <span className="text-[#8b949e]">Feedback Loop</span>
                </div>
            </div>
        </div>
    );
};

// V-Shaped Model Visualizer - Verification & Validation with symmetric design
const VShapedVisualizer = ({ active, currentStep, steps }) => {
    const [flowProgress, setFlowProgress] = useState(0);

    useEffect(() => {
        if (!active) return;
        const interval = setInterval(() => {
            setFlowProgress(prev => (prev + 1) % 100);
        }, 50);
        return () => clearInterval(interval);
    }, [active]);

    // V-Model phases - Left side (Verification) and Right side (Validation)
    const leftPhases = [
        { title: "Requirement Design", short: "Requirements" },
        { title: "System Design", short: "System" },
        { title: "Architecture Design", short: "Architecture" },
        { title: "Module Design", short: "Module" }
    ];

    const rightPhases = [
        { title: "Acceptance Test", short: "UAT" },
        { title: "System Test", short: "System" },
        { title: "Integration Test", short: "Integration" },
        { title: "Unit Test", short: "Unit" }
    ];

    // Calculate which phase is active based on currentStep
    const totalPhases = leftPhases.length + 1 + rightPhases.length; // left + coding + right
    const isLeftPhase = currentStep < leftPhases.length;
    const isCodingPhase = currentStep === leftPhases.length;
    const isRightPhase = currentStep > leftPhases.length;
    const rightIndex = currentStep - leftPhases.length - 1;

    return (
        <div className="relative h-full w-full flex items-center justify-center overflow-hidden">
            {/* Background */}
            <div className="absolute inset-0 bg-gradient-to-b from-[#0d1117] via-[#161b22] to-[#0d1117]"></div>

            {/* Main V-Structure */}
            <div className="relative z-10 w-full max-w-4xl px-8">

                {/* Verification Label - Left */}
                <motion.div
                    className="absolute left-4 top-1/2 -translate-y-1/2"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                >
                    <div className="bg-[#e9c46a] text-black px-4 py-2 rounded-lg font-bold text-sm shadow-lg">
                        Verification
                    </div>
                </motion.div>

                {/* Validation Label - Right */}
                <motion.div
                    className="absolute right-4 top-1/2 -translate-y-1/2"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                >
                    <div className="bg-[#8b949e] text-black px-4 py-2 rounded-lg font-bold text-sm shadow-lg">
                        Validation
                    </div>
                </motion.div>

                {/* V-Shape Container */}
                <div className="relative flex flex-col items-center gap-2 py-8">

                    {/* Phase Rows */}
                    {leftPhases.map((leftPhase, index) => {
                        const rightPhase = rightPhases[index];
                        const isLeftActive = isLeftPhase && currentStep === index;
                        const isRightActive = isRightPhase && rightIndex === index;
                        const leftPast = currentStep > index;
                        const rightPast = isRightPhase && rightIndex > index;

                        // Calculate indentation for V-shape
                        const indent = (index + 1) * 30;

                        return (
                            <div key={index} className="relative w-full flex items-center justify-center gap-4">
                                {/* Left Phase (Verification) */}
                                <motion.div
                                    initial={{ opacity: 0, x: -50 }}
                                    animate={{
                                        opacity: 1,
                                        x: 0,
                                        scale: isLeftActive ? 1.05 : 1,
                                    }}
                                    transition={{ delay: index * 0.1 }}
                                    style={{ marginRight: `${indent}px` }}
                                    className={`w-44 px-4 py-3 rounded-lg transform skew-x-[-8deg] transition-all duration-300
                                        ${isLeftActive
                                            ? 'bg-[#e9c46a] text-black shadow-lg shadow-yellow-500/30'
                                            : leftPast
                                                ? 'bg-[#e9c46a]/50 text-black/70'
                                                : 'bg-[#e9c46a]/80 text-black/90'
                                        }
                                    `}
                                >
                                    <div className="transform skew-x-[8deg] text-center">
                                        <div className="font-bold text-sm">{leftPhase.title}</div>
                                    </div>
                                </motion.div>

                                {/* Connecting Arrow */}
                                <motion.div
                                    className="flex-shrink-0"
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    transition={{ delay: index * 0.1 + 0.3 }}
                                >
                                    <svg width="60" height="24" viewBox="0 0 60 24" fill="none">
                                        <path
                                            d="M0 12 H50"
                                            stroke={isLeftActive || isRightActive ? "#e9c46a" : "#30363d"}
                                            strokeWidth="2"
                                        />
                                        <path
                                            d="M45 6 L55 12 L45 18"
                                            stroke={isLeftActive || isRightActive ? "#e9c46a" : "#30363d"}
                                            strokeWidth="2"
                                            fill="none"
                                        />
                                        {/* Animated flow dot */}
                                        {(isLeftActive || isRightActive) && (
                                            <motion.circle
                                                cx="5"
                                                cy="12"
                                                r="4"
                                                fill="#e9c46a"
                                                animate={{ cx: [5, 50] }}
                                                transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
                                            />
                                        )}
                                    </svg>
                                </motion.div>

                                {/* Right Phase (Validation) */}
                                <motion.div
                                    initial={{ opacity: 0, x: 50 }}
                                    animate={{
                                        opacity: 1,
                                        x: 0,
                                        scale: isRightActive ? 1.05 : 1,
                                    }}
                                    transition={{ delay: index * 0.1 }}
                                    style={{ marginLeft: `${indent}px` }}
                                    className={`w-44 px-4 py-3 rounded-lg transform skew-x-[8deg] transition-all duration-300
                                        ${isRightActive
                                            ? 'bg-[#8b949e] text-white shadow-lg shadow-gray-500/30'
                                            : rightPast
                                                ? 'bg-[#8b949e]/50 text-white/70'
                                                : 'bg-[#8b949e]/80 text-white/90'
                                        }
                                    `}
                                >
                                    <div className="transform skew-x-[-8deg] text-center">
                                        <div className="font-bold text-sm">{rightPhase.title}</div>
                                    </div>
                                </motion.div>
                            </div>
                        );
                    })}

                    {/* Coding Phase - Bottom of V */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{
                            opacity: 1,
                            y: 0,
                            scale: isCodingPhase ? 1.05 : 1,
                        }}
                        transition={{ delay: 0.5 }}
                        className={`mt-4 w-80 px-8 py-5 rounded-lg text-center transition-all duration-300
                            ${isCodingPhase
                                ? 'bg-[#e9c46a] text-black shadow-xl shadow-yellow-500/40'
                                : 'bg-[#e9c46a]/90 text-black'
                            }
                        `}
                        style={{
                            clipPath: 'polygon(10% 0%, 90% 0%, 100% 100%, 0% 100%)'
                        }}
                    >
                        <div className="font-bold text-xl">Coding</div>
                        <div className="text-xs opacity-70 mt-1">Implementation Phase</div>
                    </motion.div>
                </div>

                {/* Progress Indicator */}
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-2">
                    {Array.from({ length: totalPhases }).map((_, i) => (
                        <motion.div
                            key={i}
                            className={`w-2 h-2 rounded-full transition-all duration-300
                                ${currentStep === i ? 'bg-[#e9c46a] scale-150' : currentStep > i ? 'bg-[#238636]' : 'bg-[#30363d]'}
                            `}
                        />
                    ))}
                </div>
            </div>

            {/* Legend */}
            <div className="absolute top-8 right-8 bg-[#161b22]/80 backdrop-blur border border-[#30363d] rounded-lg p-4 text-xs">
                <div className="text-white font-bold mb-3">V-Model Phases</div>
                <div className="flex items-center gap-2 mb-2">
                    <div className="w-3 h-3 bg-[#e9c46a] rounded transform skew-x-[-8deg]"></div>
                    <span className="text-[#8b949e]">Verification (Design)</span>
                </div>
                <div className="flex items-center gap-2 mb-2">
                    <div className="w-3 h-3 bg-[#8b949e] rounded transform skew-x-[8deg]"></div>
                    <span className="text-[#8b949e]">Validation (Testing)</span>
                </div>
                <div className="flex items-center gap-2">
                    <svg width="20" height="10" className="text-[#e9c46a]">
                        <path d="M0 5 H15 M12 2 L18 5 L12 8" stroke="currentColor" strokeWidth="1.5" fill="none" />
                    </svg>
                    <span className="text-[#8b949e]">Corresponding Tests</span>
                </div>
            </div>

            {/* Model Title */}
            <div className="absolute bottom-8 left-8 text-left">
                <div className="text-lg font-bold text-white">V-Shaped Model</div>
                <div className="text-xs text-[#8b949e] mt-1">Verification & Validation at every level</div>
            </div>
        </div>
    );
};

// Spiral Model Visualizer - 4 Quadrants with Expanding Spiral Loops
const SpiralVisualizer = ({ active, currentStep, steps }) => {
    const [rotation, setRotation] = useState(0);
    const [activeLoop, setActiveLoop] = useState(0);

    useEffect(() => {
        if (!active) return;
        const interval = setInterval(() => {
            setRotation(prev => (prev + 0.5) % 360);
        }, 30);
        return () => clearInterval(interval);
    }, [active]);

    useEffect(() => {
        if (!active) return;
        const interval = setInterval(() => {
            setActiveLoop(prev => (prev + 1) % 4);
        }, 3000);
        return () => clearInterval(interval);
    }, [active]);

    // Quadrant definitions
    const quadrants = [
        { name: "Plan", color: "#2ea043", position: "top-left", desc: "Objectives, Constraints, Alternatives" },
        { name: "Risk Analysis", color: "#58a6ff", position: "top-right", desc: "Risk Management, Prototypes" },
        { name: "Engineering", color: "#e9c46a", position: "bottom-right", desc: "Design, Coding, Testing" },
        { name: "Evaluate", color: "#db61a2", position: "bottom-left", desc: "Review, Feedback, Next Phase" }
    ];

    // Spiral loop phases
    const spiralPhases = [
        { loop: 1, items: ["Concept", "Risk ID", "Prototype", "Review"] },
        { loop: 2, items: ["Requirements", "Risk Analysis", "Design", "Validation"] },
        { loop: 3, items: ["Detail Design", "Risk Resolution", "Coding", "Testing"] },
        { loop: 4, items: ["Implementation", "Final Review", "Integration", "Deployment"] }
    ];

    // Generate spiral path
    const generateSpiralPath = (loops, baseRadius, growth) => {
        let path = "M 0 0";
        const points = 360 * loops;
        for (let i = 0; i <= points; i++) {
            const angle = (i * Math.PI) / 180;
            const radius = baseRadius + (growth * i) / 360;
            const x = Math.cos(angle) * radius;
            const y = Math.sin(angle) * radius;
            path += ` L ${x} ${y}`;
        }
        return path;
    };

    return (
        <div className="relative h-full w-full flex items-center justify-center overflow-hidden">
            {/* Background with quadrant colors */}
            <div className="absolute inset-0">
                {/* Top-left: Plan (Green) */}
                <div className="absolute top-0 left-0 w-1/2 h-1/2 bg-gradient-to-br from-[#2ea043]/20 to-transparent"></div>
                {/* Top-right: Risk Analysis (Blue) */}
                <div className="absolute top-0 right-0 w-1/2 h-1/2 bg-gradient-to-bl from-[#58a6ff]/20 to-transparent"></div>
                {/* Bottom-right: Engineering (Yellow) */}
                <div className="absolute bottom-0 right-0 w-1/2 h-1/2 bg-gradient-to-tl from-[#e9c46a]/20 to-transparent"></div>
                {/* Bottom-left: Evaluate (Pink) */}
                <div className="absolute bottom-0 left-0 w-1/2 h-1/2 bg-gradient-to-tr from-[#db61a2]/20 to-transparent"></div>
            </div>

            {/* Axis Lines */}
            <div className="absolute inset-0 flex items-center justify-center">
                <div className="absolute w-full h-[2px] bg-[#30363d]"></div>
                <div className="absolute h-full w-[2px] bg-[#30363d]"></div>
            </div>

            {/* Quadrant Labels */}
            <motion.div
                className="absolute top-8 left-8"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
            >
                <div className="text-[#2ea043] font-bold text-2xl">Plan</div>
                <div className="text-xs text-[#8b949e] max-w-[120px]">Objectives & Alternatives</div>
            </motion.div>
            <motion.div
                className="absolute top-8 right-8 text-right"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
            >
                <div className="text-[#58a6ff] font-bold text-2xl">Risk</div>
                <div className="text-[#58a6ff] font-bold text-2xl">Analysis</div>
                <div className="text-xs text-[#8b949e]">Identify & Mitigate</div>
            </motion.div>
            <motion.div
                className="absolute bottom-8 right-8 text-right"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
            >
                <div className="text-[#e9c46a] font-bold text-2xl">Engineering</div>
                <div className="text-xs text-[#8b949e]">Design, Code, Test</div>
            </motion.div>
            <motion.div
                className="absolute bottom-8 left-8"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
            >
                <div className="text-[#db61a2] font-bold text-2xl">Evaluate</div>
                <div className="text-xs text-[#8b949e]">Review & Iterate</div>
            </motion.div>

            {/* Spiral Visualization - Only the rings rotate */}
            <div className="relative z-10">
                <svg
                    width="500"
                    height="500"
                    viewBox="-250 -250 500 500"
                    style={{ transform: `rotate(${rotation}deg)` }}
                >
                    {/* Multiple spiral loops */}
                    {[1, 2, 3, 4].map((loop, idx) => {
                        const isActive = activeLoop === idx || currentStep === idx;
                        const colors = ["#2ea043", "#58a6ff", "#e9c46a", "#db61a2"];
                        return (
                            <motion.circle
                                key={loop}
                                cx="0"
                                cy="0"
                                r={40 + idx * 45}
                                fill="none"
                                stroke={colors[idx]}
                                strokeWidth={isActive ? 8 : 4}
                                strokeDasharray={isActive ? "0" : "10 5"}
                                opacity={isActive ? 1 : 0.5}
                                initial={{ pathLength: 0 }}
                                animate={{
                                    pathLength: 1,
                                    opacity: isActive ? 1 : 0.5,
                                    strokeWidth: isActive ? 8 : 4
                                }}
                                transition={{ duration: 2, delay: idx * 0.5 }}
                            />
                        );
                    })}

                    {/* Spiral connecting line */}
                    <motion.path
                        d={generateSpiralPath(4, 40, 45)}
                        fill="none"
                        stroke="#30363d"
                        strokeWidth="2"
                        strokeDasharray="5 5"
                        initial={{ pathLength: 0 }}
                        animate={{ pathLength: 1 }}
                        transition={{ duration: 3 }}
                    />

                    {/* Phase markers on each loop */}
                    {spiralPhases.map((phase, loopIdx) => (
                        phase.items.map((item, itemIdx) => {
                            const angle = (itemIdx * 90 + 45) * (Math.PI / 180);
                            const radius = 40 + loopIdx * 45;
                            const x = Math.cos(angle) * radius;
                            const y = Math.sin(angle) * radius;
                            const isActivePhase = activeLoop === loopIdx;

                            return (
                                <motion.circle
                                    key={`${loopIdx}-${itemIdx}`}
                                    cx={x}
                                    cy={y}
                                    r={isActivePhase ? 6 : 4}
                                    fill={isActivePhase ? "#fff" : "#8b949e"}
                                    animate={{ scale: isActivePhase ? [1, 1.3, 1] : 1 }}
                                    transition={{ duration: 1, repeat: Infinity }}
                                />
                            );
                        })
                    ))}
                </svg>

                {/* Static Center Point and Label - Does NOT rotate */}
                <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 flex flex-col items-center">
                    <motion.div
                        className="w-8 h-8 rounded-full bg-[#0d1117] border-2 border-[#58a6ff] flex items-center justify-center"
                        animate={{ scale: [1, 1.2, 1] }}
                        transition={{ duration: 2, repeat: Infinity }}
                    >
                        <span className="text-[#58a6ff] text-[8px] font-bold">START</span>
                    </motion.div>
                </div>
            </div>

            {/* Current Phase Info - Static, does NOT rotate */}
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 translate-y-32 text-center pointer-events-none z-20">
                <motion.div
                    key={activeLoop}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-[#0d1117]/95 backdrop-blur-md border border-[#30363d] rounded-xl px-8 py-4 shadow-xl"
                >
                    <div className="text-xs text-[#8b949e] uppercase tracking-wider mb-2">Iteration {activeLoop + 1}</div>
                    <div className="text-white font-bold text-lg whitespace-nowrap">
                        {spiralPhases[activeLoop]?.items.join(" → ")}
                    </div>
                </motion.div>
            </div>

            {/* Loop Legend */}
            <div className="absolute top-8 left-1/2 -translate-x-1/2 bg-[#161b22]/80 backdrop-blur border border-[#30363d] rounded-lg px-6 py-3 flex items-center gap-6">
                <div className="text-white font-bold text-lg">Spiral Model</div>
                <div className="h-6 w-px bg-[#30363d]"></div>
                <div className="flex items-center gap-4">
                    {["Loop 1", "Loop 2", "Loop 3", "Loop 4"].map((label, idx) => (
                        <div key={idx} className="flex items-center gap-2">
                            <div
                                className={`w-3 h-3 rounded-full ${activeLoop === idx ? 'ring-2 ring-white ring-offset-2 ring-offset-[#161b22]' : ''}`}
                                style={{ backgroundColor: ["#2ea043", "#58a6ff", "#e9c46a", "#db61a2"][idx] }}
                            ></div>
                            <span className={`text-xs ${activeLoop === idx ? 'text-white' : 'text-[#8b949e]'}`}>{label}</span>
                        </div>
                    ))}
                </div>
            </div>

            {/* Progress through quadrants */}
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-4 bg-[#161b22]/80 backdrop-blur border border-[#30363d] rounded-lg px-6 py-3">
                {quadrants.map((q, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                        <motion.div
                            className="w-4 h-4 rounded"
                            style={{ backgroundColor: q.color }}
                            animate={{
                                scale: Math.floor(rotation / 90) % 4 === idx ? [1, 1.3, 1] : 1,
                                opacity: Math.floor(rotation / 90) % 4 === idx ? 1 : 0.5
                            }}
                            transition={{ duration: 0.5 }}
                        />
                        <span className="text-xs text-[#8b949e]">{q.name}</span>
                    </div>
                ))}
            </div>
        </div>
    );
};

// Big Bang Model Visualizer - Cosmic Universe Expansion Effect
const BigBangVisualizer = ({ active, currentStep, steps }) => {
    const [explosionPhase, setExplosionPhase] = useState(0);
    const [particles, setParticles] = useState([]);

    // Generate particles on mount
    useEffect(() => {
        const newParticles = [];
        for (let i = 0; i < 100; i++) {
            newParticles.push({
                id: i,
                angle: Math.random() * 360,
                speed: 0.5 + Math.random() * 2,
                size: 1 + Math.random() * 3,
                delay: Math.random() * 2,
                color: ['#fff', '#58a6ff', '#f78166', '#e9c46a', '#db61a2', '#2ea043'][Math.floor(Math.random() * 6)]
            });
        }
        setParticles(newParticles);
    }, []);

    useEffect(() => {
        if (!active) return;
        const interval = setInterval(() => {
            setExplosionPhase(prev => (prev + 1) % 4);
        }, 4000);
        return () => clearInterval(interval);
    }, [active]);

    // Input resources
    const inputs = [
        { icon: "T", label: "Time", color: "#58a6ff" },
        { icon: "E", label: "Effort", color: "#e9c46a" },
        { icon: "R", label: "Resources", color: "#2ea043" }
    ];

    return (
        <div className="relative h-full w-full flex items-center justify-center overflow-hidden">
            {/* Deep Space Background */}
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_#1a1a2e_0%,_#0d0d1a_50%,_#000_100%)]"></div>

            {/* Starfield */}
            {[...Array(80)].map((_, i) => (
                <motion.div
                    key={`star-${i}`}
                    className="absolute rounded-full bg-white"
                    style={{
                        width: Math.random() * 2 + 1,
                        height: Math.random() * 2 + 1,
                        left: `${Math.random() * 100}%`,
                        top: `${Math.random() * 100}%`,
                    }}
                    animate={{
                        opacity: [0.3, 1, 0.3],
                        scale: [1, 1.5, 1]
                    }}
                    transition={{
                        duration: 2 + Math.random() * 3,
                        repeat: Infinity,
                        delay: Math.random() * 2
                    }}
                />
            ))}

            {/* Nebula Glow Effects */}
            <motion.div
                className="absolute w-[600px] h-[600px] rounded-full"
                style={{
                    background: 'radial-gradient(circle, rgba(88,166,255,0.1) 0%, transparent 70%)',
                    filter: 'blur(60px)'
                }}
                animate={{
                    scale: [1, 1.2, 1],
                    opacity: [0.3, 0.6, 0.3]
                }}
                transition={{ duration: 4, repeat: Infinity }}
            />
            <motion.div
                className="absolute w-[400px] h-[400px] rounded-full"
                style={{
                    background: 'radial-gradient(circle, rgba(247,129,102,0.15) 0%, transparent 70%)',
                    filter: 'blur(40px)'
                }}
                animate={{
                    scale: [1.2, 1, 1.2],
                    rotate: [0, 180, 360]
                }}
                transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
            />

            {/* Input Resources - Left Side */}
            <div className="absolute left-8 top-1/2 -translate-y-1/2 flex flex-col gap-6 z-20">
                {inputs.map((input, idx) => (
                    <motion.div
                        key={idx}
                        initial={{ x: -50, opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        transition={{ delay: idx * 0.2 }}
                        className="relative"
                    >
                        <motion.div
                            className="bg-[#161b22] border-2 border-dashed rounded-xl px-4 py-3 flex items-center gap-3"
                            style={{ borderColor: input.color }}
                            animate={{
                                x: explosionPhase === idx ? [0, 10, 0] : 0,
                                boxShadow: explosionPhase === idx ? `0 0 20px ${input.color}` : 'none'
                            }}
                            transition={{ duration: 0.5 }}
                        >
                            <span className="text-2xl">{input.icon}</span>
                            <span className="font-bold" style={{ color: input.color }}>{input.label}</span>
                        </motion.div>

                        {/* Particle stream to center */}
                        <motion.div
                            className="absolute right-0 top-1/2 -translate-y-1/2 w-20 h-[2px]"
                            style={{
                                background: `linear-gradient(90deg, ${input.color}, transparent)`,
                                transformOrigin: 'left'
                            }}
                            animate={{
                                scaleX: [0, 1, 0],
                                opacity: [0, 1, 0]
                            }}
                            transition={{
                                duration: 2,
                                repeat: Infinity,
                                delay: idx * 0.5
                            }}
                        />
                    </motion.div>
                ))}
            </div>

            {/* Central Big Bang Explosion */}
            <div className="relative z-10">
                {/* Explosion Core */}
                <motion.div
                    className="w-32 h-32 rounded-full flex items-center justify-center relative"
                    style={{
                        background: 'radial-gradient(circle, #f78166 0%, #e9c46a 30%, #58a6ff 60%, transparent 100%)'
                    }}
                    animate={{
                        scale: [1, 1.3, 1],
                        rotate: [0, 360]
                    }}
                    transition={{
                        scale: { duration: 2, repeat: Infinity },
                        rotate: { duration: 20, repeat: Infinity, ease: "linear" }
                    }}
                >
                    {/* Inner Core */}
                    <motion.div
                        className="w-20 h-20 rounded-full bg-white"
                        style={{
                            boxShadow: '0 0 60px #fff, 0 0 100px #f78166, 0 0 150px #e9c46a'
                        }}
                        animate={{
                            scale: [1, 1.2, 1],
                            opacity: [0.8, 1, 0.8]
                        }}
                        transition={{ duration: 1, repeat: Infinity }}
                    />
                </motion.div>

                {/* Explosion Rings */}
                {[1, 2, 3, 4].map((ring, idx) => (
                    <motion.div
                        key={ring}
                        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full border-2"
                        style={{
                            width: 150 + idx * 80,
                            height: 150 + idx * 80,
                            borderColor: ['#f78166', '#e9c46a', '#58a6ff', '#2ea043'][idx],
                            opacity: 0.3
                        }}
                        animate={{
                            scale: [1, 1.5, 1],
                            opacity: [0.1, 0.5, 0.1],
                            rotate: [0, idx % 2 === 0 ? 180 : -180]
                        }}
                        transition={{
                            duration: 3 + idx,
                            repeat: Infinity,
                            delay: idx * 0.3
                        }}
                    />
                ))}

                {/* Exploding Particles */}
                {particles.map((particle) => (
                    <motion.div
                        key={particle.id}
                        className="absolute top-1/2 left-1/2 rounded-full"
                        style={{
                            width: particle.size,
                            height: particle.size,
                            backgroundColor: particle.color,
                            boxShadow: `0 0 ${particle.size * 2}px ${particle.color}`
                        }}
                        animate={{
                            x: [0, Math.cos(particle.angle * Math.PI / 180) * 250 * particle.speed],
                            y: [0, Math.sin(particle.angle * Math.PI / 180) * 250 * particle.speed],
                            opacity: [1, 0],
                            scale: [1, 0.5]
                        }}
                        transition={{
                            duration: 3,
                            repeat: Infinity,
                            delay: particle.delay,
                            ease: "easeOut"
                        }}
                    />
                ))}

                {/* Big Bang Label */}
                <motion.div
                    className="absolute -bottom-16 left-1/2 -translate-x-1/2 text-center"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                >
                    <div className="flex items-center gap-2 justify-center mb-1">
                        <motion.div
                            className="w-8 h-8 rounded-full bg-[#f78166] flex items-center justify-center"
                            animate={{ rotate: 360 }}
                            transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                        >
                            <span className="text-white text-lg">↻</span>
                        </motion.div>
                        <span className="text-2xl font-bold text-white">Big Bang</span>
                    </div>
                </motion.div>
            </div>

            {/* Output - Software Star (Right Side) */}
            <motion.div
                className="absolute right-12 top-1/2 -translate-y-1/2 z-20"
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 1 }}
            >
                {/* Particle stream from center */}
                <motion.div
                    className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-full w-24 h-[3px]"
                    style={{
                        background: 'linear-gradient(90deg, transparent, #e9c46a, #f78166)'
                    }}
                    animate={{
                        opacity: [0, 1, 0],
                        scaleX: [0, 1, 1]
                    }}
                    transition={{
                        duration: 2,
                        repeat: Infinity
                    }}
                />

                {/* Star Burst */}
                <motion.div
                    className="relative"
                    animate={{
                        scale: [1, 1.1, 1],
                        rotate: [0, 10, -10, 0]
                    }}
                    transition={{ duration: 2, repeat: Infinity }}
                >
                    <svg width="120" height="120" viewBox="0 0 120 120">
                        <motion.path
                            d="M60 5 L70 40 L105 40 L78 60 L88 95 L60 75 L32 95 L42 60 L15 40 L50 40 Z"
                            fill="#e9c46a"
                            stroke="#f78166"
                            strokeWidth="2"
                            animate={{
                                fill: ['#e9c46a', '#f78166', '#e9c46a']
                            }}
                            transition={{ duration: 2, repeat: Infinity }}
                            style={{
                                filter: 'drop-shadow(0 0 20px #e9c46a)'
                            }}
                        />
                        <text x="60" y="58" textAnchor="middle" fill="#000" fontSize="11" fontWeight="bold">Software</text>
                    </svg>
                </motion.div>
            </motion.div>

            {/* Phase Info - Bottom */}
            <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-20">
                <motion.div
                    className="bg-[#0d1117]/95 backdrop-blur-md border border-[#30363d] rounded-xl px-8 py-4 text-center"
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                >
                    <div className="text-xs text-[#8b949e] uppercase tracking-wider mb-2">Big Bang Model</div>
                    <div className="text-white font-bold text-lg">
                        {["1. Combine Inputs", "2. Explosion of Code", "3. Create Software", "4. Hope It Works!"][explosionPhase]}
                    </div>
                    <div className="text-xs text-[#f78166] mt-2">
                        Minimal planning → Maximum chaos → Pray for success
                    </div>
                </motion.div>
            </div>

            {/* Timeline - Expansion Reference */}
            <div className="absolute top-8 left-1/2 -translate-x-1/2 z-20">
                <div className="bg-[#161b22]/80 backdrop-blur border border-[#30363d] rounded-lg px-6 py-3 flex items-center gap-4">
                    <span className="text-white font-bold">Big Bang Model</span>
                    <div className="h-4 w-px bg-[#30363d]"></div>
                    <div className="flex items-center gap-2 text-xs">
                        <span className="text-[#8b949e]">Inputs</span>
                        <span className="text-[#f78166]">→</span>
                        <span className="text-[#e9c46a] font-bold">BANG</span>
                        <span className="text-[#f78166]">→</span>
                        <span className="text-[#8b949e]">Output</span>
                    </div>
                </div>
            </div>

            {/* Warning Badge */}
            <motion.div
                className="absolute bottom-8 right-8 bg-[#f78166]/20 border border-[#f78166] rounded-lg px-4 py-2 z-20"
                animate={{ opacity: [0.5, 1, 0.5] }}
                transition={{ duration: 2, repeat: Infinity }}
            >
                <span className="text-[#f78166] text-xs font-bold">! High Risk Approach</span>
            </motion.div>
        </div>
    );
};

// ... (Other visualizers can be similarly enhanced or reused) ...


const ModelSimulation = () => {
    const { modelId } = useParams();
    const navigate = useNavigate();
    const [isPlaying, setIsPlaying] = useState(true);
    const [currentStep, setCurrentStep] = useState(0);

    // --- Model Data (Simulation Scripts) ---
    const models = {
        "waterfall": {
            title: "Waterfall Model",
            color: "text-[#58a6ff]",
            bgColor: "bg-[#58a6ff]/10",
            icon: Layout,
            Visualizer: WaterfallVisualizer,
            steps: [
                {
                    title: "Requirements Analysis",
                    desc: "System requirements are gathered from the customer and documented in the SRS. This phase defines 'WHAT' the system should do."
                },
                {
                    title: "System Design",
                    desc: "Based on requirements, the system architecture and detailed design are created. This defines 'HOW' the system will work."
                },
                {
                    title: "Implementation",
                    desc: "Developers convert the design into actual code units. This is the longest phase of the lifecycle."
                },
                {
                    title: "Testing",
                    desc: "The code is tested against requirements to ensure it is bug-free and meets the client's needs."
                },
                {
                    title: "Deployment",
                    desc: "The system is deployed to the production environment for user access."
                },
                {
                    title: "Maintenance",
                    desc: "Ongoing support, bug fixes, and updates to keep the system running smoothly."
                }
            ]
        },
        "agile": {
            title: "Agile / Scrum",
            color: "text-[#e9c46a]",
            bgColor: "bg-[#e9c46a]/10",
            icon: Code,
            Visualizer: AgileVisualizer,
            steps: [
                { title: "Product Backlog", desc: "The Product Owner defines and prioritizes a list of features (User Stories) required for the product." },
                { title: "Sprint Planning", desc: "The team selects a subset of items from the backlog to complete in the upcoming Sprint (2-4 weeks)." },
                { title: "Daily Standups", desc: "Every day, the team meets for 15 mins to discuss progress and blockers." },
                { title: "Development & Test", desc: "The team works on designing, coding, and testing the selected features." },
                { title: "Sprint Review", desc: "At the end of the sprint, the team demonstrates the working software to stakeholders." },
                { title: "Retrospective", desc: "The team reflects on the sprint to identify improvements for the next cycle." }
            ]
        },
        // Fallback for others to Waterfall for demo
        "v-shape": {
            title: "V-Shaped Model",
            color: "text-[#2ea043]",
            bgColor: "bg-[#2ea043]/10",
            icon: Shield,
            Visualizer: VShapedVisualizer,
            steps: [
                { title: "Requirement Design", desc: "Gather and analyze business requirements. Create the Business Requirements Document (BRD) and System Requirements Specification (SRS)." },
                { title: "System Design", desc: "Define the overall system architecture and create the High-Level Design (HLD) document. Plan system modules and interfaces." },
                { title: "Architecture Design", desc: "Detail the technical architecture including database design, API specifications, and technology stack decisions." },
                { title: "Module Design", desc: "Create Low-Level Design (LLD) for individual modules. Define data structures, algorithms, and component interfaces." },
                { title: "Coding", desc: "Implement the design into actual code. This is the bottom of the V where development happens." },
                { title: "Unit Test", desc: "Test individual modules in isolation. Verify that each component works according to its module design specification." },
                { title: "Integration Test", desc: "Test the interfaces between modules. Verify components work together as specified in the architecture design." },
                { title: "System Test", desc: "Test the complete integrated system. Validate that the system meets the high-level design requirements." },
                { title: "Acceptance Test", desc: "User Acceptance Testing (UAT). Validate the system meets business requirements with stakeholder sign-off." }
            ]
        },
        "spiral": {
            title: "Spiral Model",
            color: "text-[#d29922]",
            bgColor: "bg-[#d29922]/10",
            icon: BrainCircuit,
            Visualizer: SpiralVisualizer,
            steps: [
                { title: "Planning - Iteration 1", desc: "Define objectives, identify constraints, and explore alternative approaches. Concept development phase." },
                { title: "Risk Analysis - Iteration 1", desc: "Identify potential risks and create mitigation strategies. Build initial prototypes to validate assumptions." },
                { title: "Engineering - Iteration 1", desc: "Develop the first version based on prototype feedback. Create functional specifications." },
                { title: "Evaluation - Iteration 1", desc: "Customer evaluation of the deliverable. Gather feedback and plan the next iteration." },
                { title: "Planning - Iteration 2", desc: "Refine requirements based on feedback. Plan detailed system design and architecture." },
                { title: "Risk Analysis - Iteration 2", desc: "Analyze technical risks. Evaluate build vs. buy decisions and technology choices." },
                { title: "Engineering - Iteration 2", desc: "Detailed design and initial coding. Integration of components begins." },
                { title: "Evaluation - Iteration 2", desc: "System testing and quality assurance. Prepare for broader deployment." }
            ]
        },
        "iterative": {
            title: "Iterative Waterfall Model",
            color: "text-[#db61a2]",
            bgColor: "bg-[#db61a2]/10",
            icon: GitBranch,
            Visualizer: IterativeWaterfallVisualizer,
            steps: [
                { title: "Feasibility Study", desc: "Analyze technical, economic, and operational feasibility before committing resources. Define project scope and constraints." },
                { title: "Requirement Analysis", desc: "Gather and document all functional and non-functional requirements. Create the SRS document with stakeholder input." },
                { title: "Design", desc: "Transform requirements into system architecture and detailed design. Create HLD (High-Level Design) and LLD (Low-Level Design) documents." },
                { title: "Coding", desc: "Implement the design into actual code modules. Developers write, review, and unit test the code." },
                { title: "Testing", desc: "Validate the software against requirements. Perform integration testing, system testing, and UAT (User Acceptance Testing)." },
                { title: "Maintenance", desc: "Deploy to production and provide ongoing support. Fix bugs, optimize performance, and implement enhancements based on feedback." }
            ]
        },
        "bigbang": {
            title: "Big Bang Model",
            color: "text-[#f78166]",
            bgColor: "bg-[#f78166]/10",
            icon: Activity,
            Visualizer: BigBangVisualizer,
            steps: [
                { title: "Combine Inputs", desc: "Gather all available resources - time, effort, budget, and tools. No formal planning phase, just collect everything needed." },
                { title: "Explosion of Code", desc: "Start coding immediately without detailed requirements or design. All development happens simultaneously with minimal coordination." },
                { title: "Create Software", desc: "The product emerges from the chaos. Integration happens organically as pieces come together." },
                { title: "Hope It Works", desc: "Deploy and test in production. Fix issues as they appear. Pray that everything connects properly!" }
            ]
        },
    };

    const model = models[modelId] || models["waterfall"];
    const VisualizerComponent = model.Visualizer;

    // --- Simulation Timer ---
    useEffect(() => {
        let interval;
        if (isPlaying) {
            interval = setInterval(() => {
                setCurrentStep((prev) => (prev + 1) % model.steps.length);
            }, 4000); // 4 seconds per step for reading
        }
        return () => clearInterval(interval);
    }, [isPlaying, model.steps.length]);


    return (
        <div className="min-h-screen bg-[#0d1117] text-[#c9d1d9] font-mono selection:bg-[#58a6ff] selection:text-[#0d1117] overflow-hidden flex flex-col">

            {/* Header */}
            <header className="h-16 flex items-center justify-between px-6 border-b border-[#30363d] bg-[#161b22] z-50">
                <div className="flex items-center gap-4">
                    <button onClick={() => navigate('/library')} className="p-2 hover:bg-[#21262d] rounded-lg transition">
                        <ArrowLeft size={20} />
                    </button>
                    <div className={`p-2 rounded-lg ${model.bgColor}`}>
                        <model.icon className={model.color} size={20} />
                    </div>
                    <h1 className="text-lg font-bold text-white">{model.title} <span className="text-[#8b949e] font-normal">// Simulation</span></h1>
                </div>

                <div className="flex items-center gap-2">
                    <button
                        onClick={() => setCurrentStep(0)}
                        className="p-2 hover:bg-[#21262d] rounded-lg text-[#8b949e] hover:text-white transition" title="Restart"
                    >
                        <RotateCcw size={18} />
                    </button>
                    <button
                        onClick={() => setIsPlaying(!isPlaying)}
                        className={`flex items-center gap-2 px-4 py-1.5 rounded-lg font-bold text-sm transition ${isPlaying ? 'bg-[#238636] text-white' : 'bg-[#21262d] text-[#c9d1d9]'}`}
                    >
                        {isPlaying ? <><Pause size={14} /> Pause</> : <><Play size={14} /> Resume</>}
                    </button>
                </div>
            </header>

            {/* Main Content */}
            <div className="flex-1 flex overflow-hidden">

                {/* Left Panel: AI Terminal / Explanation */}
                <div className="w-[400px] border-r border-[#30363d] bg-[#0d1117] flex flex-col">
                    <div className="p-4 border-b border-[#30363d] flex items-center gap-2 text-xs text-[#8b949e] bg-[#161b22]">
                        <Terminal size={12} />
                        <span>AI Assistant @ DocuVerse</span>
                    </div>

                    <div className="flex-1 p-6 overflow-y-auto space-y-6">
                        <AnimatePresence mode='wait'>
                            <motion.div
                                key={currentStep}
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: 20 }}
                                transition={{ duration: 0.3 }}
                                className="space-y-4"
                            >
                                <div className="text-xs font-bold text-[#58a6ff] uppercase tracking-wider">
                                    Current Phase: 0{currentStep + 1}
                                </div>
                                <h2 className="text-2xl font-bold text-white leading-tight">
                                    {model.steps[currentStep].title}
                                </h2>
                                <p className="text-[#8b949e] leading-7 text-sm">
                                    {model.steps[currentStep].desc}
                                </p>

                                <div className="pt-6 border-t border-[#30363d] mt-6">
                                    <div className="text-xs text-[#8b949e] mb-2">Key Activities:</div>
                                    <div className="bg-[#161b22] p-3 rounded border border-[#30363d] text-xs text-[#7ee787] font-mono">
                                        &gt; Initiating sub-processes...<br />
                                        &gt; Verifying constraints...<br />
                                        &gt; {model.steps[currentStep].title} in progress...
                                    </div>
                                </div>
                            </motion.div>
                        </AnimatePresence>
                    </div>

                    {/* Progress Bar */}
                    <div className="p-6 border-t border-[#30363d]">
                        <div className="flex justify-between text-xs text-[#8b949e] mb-2">
                            <span>Progress</span>
                            <span>{Math.round(((currentStep + 1) / model.steps.length) * 100)}%</span>
                        </div>
                        <div className="h-1 bg-[#21262d] rounded-full overflow-hidden">
                            <motion.div
                                className="h-full bg-[#238636]"
                                initial={{ width: 0 }}
                                animate={{ width: `${((currentStep + 1) / model.steps.length) * 100}%` }}
                                transition={{ duration: 0.5 }}
                            />
                        </div>
                    </div>
                </div>

                {/* Right Panel: 3D Visualization */}
                <div className="flex-1 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-[#1f2428] to-[#0d1117] relative overflow-hidden perspective-2000">
                    <div className="absolute inset-0 opacity-20"
                        style={{
                            backgroundImage: 'linear-gradient(#30363d 1px, transparent 1px), linear-gradient(90deg, #30363d 1px, transparent 1px)',
                            backgroundSize: '40px 40px',
                            transform: 'perspective(500px) rotateX(60deg) scale(2) translateY(-100px)'
                        }}
                    ></div>

                    <VisualizerComponent active={isPlaying} currentStep={currentStep} steps={model.steps} />
                </div>

            </div>
        </div>
    );
};

export default ModelSimulation;
