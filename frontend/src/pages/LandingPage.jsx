import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { motion } from 'framer-motion';
import {
    GraduationCap, Sparkles, Calculator, FileText,
    Lightbulb, BrainCircuit, Share2, Link, CheckCircle,
    ArrowRight, Code,
    Layout, Shield
} from 'lucide-react';

import IntegratedNotebook from '../components/home/IntegratedNotebook';
import LearningFeature from '../components/home/LearningFeature';
import AITutorFeature from '../components/home/AITutorFeature';
import { Card3D, Card3DBody, Card3DItem, CardSpotlight, NoiseBackground, GlowingButton } from '../components/ui/Card3D';
import { BackgroundRippleEffect } from '../components/ui/BackgroundRippleEffect';
import CLIHeader from '../components/layout/CLIHeader';
import SystemStatusFooter from '../components/layout/SystemStatusFooter';

const LandingPage = () => {
    const navigate = useNavigate();
    const { token } = useAuth();
    const [typedText, setTypedText] = useState('');
    const fullText = "Writes Itself.";
    const [showSample, setShowSample] = useState(false);

    // Typewriter effect
    useEffect(() => {
        let index = 0;
        const interval = setInterval(() => {
            setTypedText(fullText.substring(0, index));
            index++;
            if (index > fullText.length) clearInterval(interval);
        }, 150);
        return () => clearInterval(interval);
    }, []);

    const handleViewSample = () => {
        // Open the sample report from backend static file
        window.open('/static/sample_report.docx', '_blank');
    };

    return (
        <div className="min-h-screen bg-[#0d1117] text-[#c9d1d9] font-mono selection:bg-[#58a6ff] selection:text-[#0d1117] overflow-x-hidden relative pb-8">

            {/* CLI Header */}
            <CLIHeader />

            {/* Interactive Background Grid Effect */}
            <BackgroundRippleEffect
                className="opacity-40"
            />

            {/* Hero */}
            <section className="pt-40 pb-20 px-6 max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-12 relative z-10">
                <div className="space-y-8">
                    <div className="inline-block px-3 py-1 rounded-full border border-[#30363d] bg-[#161b22] text-xs text-[#79c0ff]">
                        v2.0.0 Stable Release
                    </div>
                    <h1 className="text-5xl md:text-7xl font-bold text-white tracking-tight leading-tight">
                        Documentation <br />
                        <span className="text-[#79c0ff]">{typedText}<span className="animate-pulse">_</span></span>
                    </h1>
                    <p className="text-lg text-[#8b949e] max-w-lg leading-relaxed">
                        Generate IEEE-standard SRS documents and live prototypes directly from your terminal... or right here.
                    </p>
                    <div className="flex gap-4 flex-wrap">
                        <NoiseBackground
                            containerClassName="rounded-lg"
                            gradientColors={["#238636", "#2ea043", "#58a6ff"]}
                        >
                            <button
                                onClick={() => navigate('/dashboard')}
                                className="px-6 py-3 bg-[#0d1117] text-white rounded-lg font-bold hover:bg-[#161b22] transition flex items-center gap-2"
                            >
                                <Code size={18} /> Initialize Project
                            </button>
                        </NoiseBackground>
                        <button onClick={handleViewSample} className="px-6 py-3 bg-[#21262d] text-[#c9d1d9] border border-[#30363d] rounded-lg font-medium hover:bg-[#30363d] transition flex items-center gap-2">
                            <FileText size={18} /> cat sample_report.docx
                        </button>
                    </div>
                </div>

                {/* Terminal Visual */}
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{
                        opacity: 1,
                        y: 0,
                        rotate: [0, 1, 0, -1, 0]
                    }}
                    transition={{
                        opacity: { duration: 0.5 },
                        y: { duration: 0.5 },
                        rotate: {
                            duration: 4,
                            repeat: Infinity,
                            ease: "easeInOut"
                        }
                    }}
                    style={{ transformOrigin: "top center" }}
                    className="hidden lg:block relative"
                >
                    <div className="w-full h-[400px] bg-[#0d1117] rounded-xl border border-[#30363d] shadow-2xl overflow-hidden font-mono text-sm relative group transform-style-3d">
                        {/* Terminal Header */}
                        <div className="h-8 bg-[#161b22] border-b border-[#30363d] flex items-center px-4 gap-2">
                            <div className="w-3 h-3 rounded-full bg-[#ff5f56]"></div>
                            <div className="w-3 h-3 rounded-full bg-[#ffbd2e]"></div>
                            <div className="w-3 h-3 rounded-full bg-[#27c93f]"></div>
                            <div className="ml-4 text-xs text-[#8b949e]">niloy@dev:~/autosrs</div>
                        </div>
                        {/* Terminal Body */}
                        <div className="p-6 text-[#c9d1d9] space-y-2">
                            <div>
                                <span className="text-[#79c0ff]">➜</span> <span className="text-[#7ee787]">~</span> <span className="text-[#c9d1d9]">autosrs analyze --input "Hospital System"</span>
                            </div>
                            <div className="text-[#8b949e] pl-4">
                                Analyzing requirements... <span className="text-[#7ee787]">Done</span><br />
                                Identifying modules... <span className="text-[#7ee787]">Done</span><br />
                                Generaring UML diagrams... <span className="text-[#7ee787]">Done</span>
                            </div>
                            <div className="mt-4">
                                <span className="text-[#79c0ff]">➜</span> <span className="text-[#7ee787]">~</span> <span className="text-[#c9d1d9]">autosrs generate --mode high-quality</span>
                            </div>
                            <div className="text-[#8b949e] pl-4">
                                Rendering IEEE 830-1998... <span className="text-[#7ee787]">Success</span><br />
                                Appending Appendix A (User Personas)... <span className="text-[#7ee787]">Success</span><br />
                                Appending Appendix B (Use Cases)... <span className="text-[#7ee787]">Success</span><br />
                                <span className="text-[#e2e8f0] font-bold"> Report generated: ./output/Hospital_SRS_Final.docx</span>
                            </div>
                            <div className="mt-4">
                                <span className="text-[#79c0ff]">➜</span> <span className="text-[#7ee787]">~</span> <span className="animate-pulse">▊</span>
                            </div>
                        </div>
                    </div>
                    {/* 3D Glow */}
                    <div className="absolute -inset-10 bg-gradient-to-tr from-[#238636] to-[#79c0ff] opacity-10 blur-[100px] -z-10"></div>
                </motion.div>
            </section>

            {/* --- NEW: Interactive Workspace Features --- */}

            {/* 1. Integrated Studio (Notebook + Diagrams) */}
            <IntegratedNotebook />

            {/* 3. Learning Center */}
            <LearningFeature />

            {/* 4. AI Tutor */}
            <AITutorFeature />

            {/* --- Existing Library Section --- */}
            <section className="py-24 bg-[#161b22]/50 relative z-10">
                <div className="max-w-7xl mx-auto px-6">
                    <div className="flex justify-between items-end mb-16">
                        <div>
                            <h2 className="text-3xl font-bold text-white mb-2">Explore Library</h2>
                            <p className="text-[#8b949e]">Select a development model to view prototypes.</p>
                        </div>
                        <button onClick={() => navigate('/library')} className="text-[#58a6ff] hover:underline text-sm font-mono">ls -la ./library</button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        {/* Classic Waterfall */}
                        <Card3D className="cursor-pointer" intensity={15}>
                            <Card3DBody
                                className="bg-[#0d1117] hover:border-[#58a6ff] h-full"
                                onClick={() => navigate('/library')}
                            >
                                <div className="absolute top-0 right-0 p-20 bg-[#58a6ff]/5 blur-[60px] rounded-full"></div>
                                <Card3DItem translateZ={60}>
                                    <Layout className="text-[#58a6ff] mb-6" size={40} />
                                </Card3DItem>
                                <Card3DItem translateZ={40}>
                                    <h3 className="text-xl font-bold text-white mb-2">Classic Waterfall</h3>
                                </Card3DItem>
                                <Card3DItem translateZ={30}>
                                    <p className="text-sm text-[#8b949e] mb-6">Linear sequential flow. Requirements → Design → Implementation.</p>
                                </Card3DItem>
                                <Card3DItem translateZ={50}>
                                    <div className="flex gap-2">
                                        <span className="text-xs border border-[#30363d] px-2 py-1 rounded text-[#79c0ff] bg-[#58a6ff]/10">Fixed Scope</span>
                                        <span className="text-xs border border-[#30363d] px-2 py-1 rounded text-[#79c0ff] bg-[#58a6ff]/10">Legacy</span>
                                    </div>
                                </Card3DItem>
                            </Card3DBody>
                        </Card3D>

                        {/* V-Shaped Model */}
                        <Card3D className="cursor-pointer" intensity={15}>
                            <Card3DBody
                                className="bg-[#0d1117] hover:border-[#2ea043] h-full"
                                onClick={() => navigate('/library')}
                            >
                                <div className="absolute top-0 right-0 p-20 bg-[#2ea043]/5 blur-[60px] rounded-full"></div>
                                <Card3DItem translateZ={60}>
                                    <Shield className="text-[#2ea043] mb-6" size={40} />
                                </Card3DItem>
                                <Card3DItem translateZ={40}>
                                    <h3 className="text-xl font-bold text-white mb-2">V-Shaped Model</h3>
                                </Card3DItem>
                                <Card3DItem translateZ={30}>
                                    <p className="text-sm text-[#8b949e] mb-6">Verification and Validation at every step. High reliability.</p>
                                </Card3DItem>
                                <Card3DItem translateZ={50}>
                                    <div className="flex gap-2">
                                        <span className="text-xs border border-[#30363d] px-2 py-1 rounded text-[#7ee787] bg-[#2ea043]/10">Medical</span>
                                        <span className="text-xs border border-[#30363d] px-2 py-1 rounded text-[#7ee787] bg-[#2ea043]/10">Automotive</span>
                                    </div>
                                </Card3DItem>
                            </Card3DBody>
                        </Card3D>

                        {/* Spiral Model */}
                        <Card3D className="cursor-pointer" intensity={15}>
                            <Card3DBody
                                className="bg-[#0d1117] hover:border-[#d29922] h-full"
                                onClick={() => navigate('/library')}
                            >
                                <div className="absolute top-0 right-0 p-20 bg-[#d29922]/5 blur-[60px] rounded-full"></div>
                                <Card3DItem translateZ={60}>
                                    <BrainCircuit className="text-[#d29922] mb-6" size={40} />
                                </Card3DItem>
                                <Card3DItem translateZ={40}>
                                    <h3 className="text-xl font-bold text-white mb-2">Spiral Model</h3>
                                </Card3DItem>
                                <Card3DItem translateZ={30}>
                                    <p className="text-sm text-[#8b949e] mb-6">Risk-driven. Iterative cycles of planning, risk analysis, and engineering.</p>
                                </Card3DItem>
                                <Card3DItem translateZ={50}>
                                    <div className="flex gap-2">
                                        <span className="text-xs border border-[#30363d] px-2 py-1 rounded text-[#d29922] bg-[#d29922]/10">High Risk</span>
                                        <span className="text-xs border border-[#30363d] px-2 py-1 rounded text-[#d29922] bg-[#d29922]/10">Complex</span>
                                    </div>
                                </Card3DItem>
                            </Card3DBody>
                        </Card3D>
                    </div>
                </div>
            </section>

            {/* System Status Footer */}
            <SystemStatusFooter />
        </div>
    );
};

export default LandingPage;
