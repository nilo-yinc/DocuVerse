import React, { useState, useEffect } from 'react';
import Logo from '../components/ui/Logo';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import {
    Layout, Globe, Zap, Server, Shield, Cpu, FileText,
    CheckCircle, ChevronRight, ChevronLeft, Terminal, Activity,
    Fingerprint, Layers, Lock, Database, X
} from 'lucide-react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { defaultNodeBase, normalizeApiBase } from '../utils/apiBase';

// --- Utility ---
function cn(...inputs) {
    return twMerge(clsx(inputs));
}

const mapSrsRequestToFormData = (srsRequest) => {
    if (!srsRequest) return {};
    const pi = srsRequest.project_identity || {};
    const sc = srsRequest.system_context || {};
    const fs = srsRequest.functional_scope || {};
    const nfr = srsRequest.non_functional_requirements || {};
    const sec = srsRequest.security_and_compliance || {};
    const tech = srsRequest.technical_preferences || {};
    const out = srsRequest.output_control || {};

    const authorsStr = (pi.author || []).join('\n');
    const featuresStr = (fs.core_features || []).join('\n');

    const scaleMap = { '<100': '< 100 Users', '100-1k': '100 - 1,000 Users', '1k-100k': '1,000 - 10,000 Users', '>100k': '10,000+ Users' };
    const perfMap = { 'Normal': 'Standard (2-3s load)', 'High': 'High Performance (< 1s load)', 'Real-time': 'Real-time (ms latency)' };
    const detailMap = { 'Enterprise-grade': 'Professional (Enterprise)', 'Technical': 'Standard (Academic)', 'High-level': 'Brief (Startup MVP)' };

    // Technical Mapping Fallbacks
    const techMap = {
        'Node': 'Node.js', 'Nodejs': 'Node.js',
        'Python': 'Python (Django/FastAPI)', 'FastAPI': 'Python (Django/FastAPI)', 'Django': 'Python (Django/FastAPI)',
        'Java': 'Java (Spring)', 'Spring': 'Java (Spring)',
        'Go': 'Go', 'Golang': 'Go',
        'null': 'No Preference', 'undefined': 'No Preference', '': 'No Preference'
    };

    const dbMap = {
        'Postgres': 'PostgreSQL', 'Postgresql': 'PostgreSQL',
        'Mongo': 'MongoDB', 'Mongodb': 'MongoDB',
        'MySql': 'MySQL', 'Mysql': 'MySQL',
        'null': 'No Preference', 'undefined': 'No Preference', '': 'No Preference'
    };

    const normalizeTech = (val, map) => {
        if (!val || val === 'null' || val === 'undefined') return 'No Preference';
        if (Object.values(map).includes(val)) return val;
        return map[val] || val;
    };

    return {
        projectName: pi.project_name || '',
        authors: authorsStr,
        organization: pi.organization || '',
        problemStatement: pi.problem_statement || '',
        targetUsers: pi.target_users || [],
        appType: sc.application_type || '',
        domain: sc.domain || '',
        coreFeatures: featuresStr,
        userFlow: fs.primary_user_flow || '',
        userScale: scaleMap[nfr.expected_user_scale] || nfr.expected_user_scale || '100 - 1,000 Users',
        performance: perfMap[nfr.performance_expectation] || nfr.performance_expectation || 'Standard (2-3s load)',
        authRequired: sec.authentication_required === true ? 'Yes' : (sec.authentication_required === false ? 'No' : 'Yes'),
        sensitiveData: sec.sensitive_data_handling === true ? 'Yes' : (sec.sensitive_data_handling === false ? 'No' : 'Yes'),
        compliance: sec.compliance_requirements || [],
        backendPref: normalizeTech(tech.preferred_backend, techMap),
        dbPref: normalizeTech(tech.database_preference, dbMap),
        deploymentPref: tech.deployment_preference || 'Vercel/Netlify',
        detailLevel: detailMap[out.srs_detail_level] || out.srs_detail_level || 'Professional (Enterprise)',
        additionalInstructions: out.additional_instructions || ''
    };
};

const mapBaseProjectToFormData = (project) => {
    if (!project) return {};

    const techMap = { 'Node': 'Node.js', 'Python': 'Python (Django/FastAPI)', 'Java': 'Java (Spring)' };
    const dbMap = { 'Mongo': 'MongoDB', 'Postgres': 'PostgreSQL' };

    return {
        projectName: project.title || '',
        domain: project.domain || '',
        backendPref: techMap[project.techStack?.backend] || project.techStack?.backend || '',
        dbPref: dbMap[project.techStack?.database] || project.techStack?.database || '',
        authors: (project.teamMembers || []).map(m => m.name).join('\n')
    };
};

import useTitle from '../hooks/useTitle';

const EnterpriseSRS = () => {
    useTitle('System Requirements Study');
    const navigate = useNavigate();
    const location = useLocation();
    const { user, token } = useAuth();
    const [step, setStep] = useState(1);
    const [isLoaded, setIsLoaded] = useState(false);

    // --- State ---
    const [formData, setFormData] = useState({
        // 1. Project Identity
        projectName: '',
        authors: '',
        organization: '',
        problemStatement: '',
        targetUsers: [],
        otherUser: '',

        // 2. System Context
        appType: '',
        domain: '',
        domain_other: '',

        // 3. Functional Scope
        coreFeatures: '',
        userFlow: '',

        // 4. Non-Functional
        userScale: '',
        userScale_other: '',
        performance: '',
        performance_other: '',

        // 5. Security & Compliance
        authRequired: 'Yes',
        sensitiveData: 'Yes',
        compliance: [],

        // 6. Technical
        backendPref: 'No Preference',
        backendPref_other: '',
        dbPref: 'No Preference',
        dbPref_other: '',
        deploymentPref: 'Vercel/Netlify',
        deploymentPref_other: '',

        // 7. Output
        detailLevel: 'Professional (Enterprise)',
        additionalInstructions: ''
    });

    const [projectId, setProjectId] = useState(null);

    // --- Effects ---
    useEffect(() => {
        const initializeForm = async () => {
            const queryParams = new URLSearchParams(location.search);
            const pId = queryParams.get('projectId') || location.state?.projectId;

            let baseData = {
                projectName: '', authors: '', organization: '', problemStatement: '',
                targetUsers: [], otherUser: '', appType: '', domain: '', domain_other: '',
                coreFeatures: '', userFlow: '', userScale: '', userScale_other: '',
                performance: 'Standard (2-3s load)', performance_other: '', authRequired: 'Yes',
                sensitiveData: 'Yes', compliance: [], backendPref: 'No Preference', backendPref_other: '',
                dbPref: 'No Preference', dbPref_other: '', deploymentPref: 'Vercel/Netlify', deploymentPref_other: '',
                detailLevel: 'Professional (Enterprise)', additionalInstructions: ''
            };

            // 1. Try fetching from backend if projectId exists
            if (pId) {
                setProjectId(pId);
                try {
                    const nodeApiBase = normalizeApiBase(import.meta.env.VITE_NODE_API_URL, defaultNodeBase());
                    const authToken = token || localStorage.getItem('token');
                    const res = await axios.get(`${nodeApiBase}/api/projects/${pId}`, {
                        headers: authToken ? { Authorization: `Bearer ${authToken}` } : {}
                    });

                    const projectData = res.data;
                    if (projectData) {
                        // Fallback chain: enterpriseFormData -> enterpriseData (mapping) -> base project data
                        const restoredFromForm = projectData.enterpriseFormData || {};
                        const restoredFromSrs = mapSrsRequestToFormData(projectData.enterpriseData);
                        const restoredFromBase = mapBaseProjectToFormData(projectData);

                        baseData = {
                            ...baseData,
                            ...restoredFromBase,
                            ...restoredFromSrs,
                            ...restoredFromForm
                        };
                    }
                } catch (err) {
                    console.error("Failed to fetch project for restoration", err);
                }
            } else {
                // 2. Try Local Storage if not an update flow
                const savedData = localStorage.getItem('autoSRS_enterpriseForm');
                if (savedData) {
                    try {
                        const parsed = JSON.parse(savedData);
                        baseData = { ...baseData, ...parsed.formData };
                        if (parsed.step && !location.state?.step) setStep(parsed.step);
                    } catch (e) {
                        console.error("Failed to load saved form", e);
                    }
                }
            }

            // 3. Apply Prefills (Feedback, etc.) from location state
            if (location.state?.prefill) {
                baseData = { ...baseData, ...location.state.prefill };
            }
            if (location.state?.step) {
                setStep(location.state.step);
            }

            console.log("FINAL INITIALIZED FORM DATA:", baseData);
            setFormData(baseData);
            setIsLoaded(true);
        };

        initializeForm();
    }, [location.search, location.state]);

    useEffect(() => {
        if (isLoaded && !projectId) {
            const payload = { formData, step };
            localStorage.setItem('autoSRS_enterpriseForm', JSON.stringify(payload));
        }
    }, [formData, step, isLoaded, projectId]);

    // --- Handlers ---
    const updateField = (field, value) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const toggleCheckbox = (field, value) => {
        setFormData(prev => {
            const list = prev[field] || [];
            if (list.includes(value)) {
                return { ...prev, [field]: list.filter(i => i !== value) };
            } else {
                return { ...prev, [field]: [...list, value] };
            }
        });
    };

    const handleGenerate = () => {
        const normalizedUsers = (formData.targetUsers || []).map((u) => {
            if (u === 'Other') {
                return formData.otherUser ? `Other (${formData.otherUser})` : 'Other';
            }
            return u;
        });

        const normalizedCompliance = (formData.compliance || []).map((c) => {
            if (c === 'Other') {
                return formData.compliance_other ? `Other (${formData.compliance_other})` : 'Other';
            }
            return c;
        });

        const payload = {
            ...formData,
            projectId: projectId || '',
            targetUsers: normalizedUsers,
            compliance: normalizedCompliance,
            appType: formData.appType === 'Other' ? formData.appType_other : formData.appType,
            domain: formData.domain === 'Other' ? formData.domain_other : formData.domain,
            userScale: formData.userScale === 'Other' ? formData.userScale_other : formData.userScale,
            performance: formData.performance === 'Other' ? formData.performance_other : formData.performance,
            backendPref: formData.backendPref === 'Other' ? formData.backendPref_other : formData.backendPref,
            dbPref: formData.dbPref === 'Other' ? formData.dbPref_other : formData.dbPref,
            deploymentPref: formData.deploymentPref === 'Other' ? formData.deploymentPref_other : formData.deploymentPref
        };
        navigate('/enterprise/generation', { state: { formData: payload, projectId: projectId || '' } });
    };

    const handleClearForm = () => {
        if (window.confirm("Are you sure you want to clear the form? This will reset all fields.")) {
            localStorage.removeItem('autoSRS_enterpriseForm');
            window.location.href = '/enterprise/form'; // Redirect to fresh form
        }
    };

    // --- UI Components ---
    const renderInput = (label, field, placeholder, type = 'text') => (
        <div className="mb-8 group">
            <label className="block text-slate-400 text-xs font-bold mb-2 uppercase tracking-widest">{label}</label>
            {type === 'textarea' ? (
                <textarea
                    value={formData[field]}
                    onChange={e => updateField(field, e.target.value)}
                    className="w-full bg-black/40 border border-white/10 rounded-lg p-4 text-slate-200 focus:border-cyan-500/50 focus:shadow-[0_0_20px_rgba(6,182,212,0.1)] outline-none min-h-[120px] transition-all resize-none placeholder:text-slate-600"
                    placeholder={placeholder}
                />
            ) : (
                <input
                    type={type}
                    value={formData[field]}
                    onChange={e => updateField(field, e.target.value)}
                    className="w-full bg-[#0d1117] border border-[#30363d] rounded-lg p-4 text-slate-200 focus:border-[#58a6ff]/50 focus:shadow-[0_0_20px_rgba(88,166,255,0.1)] outline-none transition-all placeholder:text-slate-600"
                    placeholder={placeholder}
                />
            )}
        </div>
    );

    const renderSelect = (label, field, options) => {
        const isOtherSelected = formData[field] === 'Other';
        const otherField = `${field}_other`;

        return (
            <div className="mb-8 group">
                <label className="block text-slate-400 text-xs font-bold mb-2 uppercase tracking-widest">{label}</label>
                <div className="relative">
                    <select
                        value={isOtherSelected ? 'Other' : formData[field]}
                        onChange={e => {
                            const val = e.target.value;
                            if (val === 'Other') {
                                updateField(field, 'Other');
                            } else {
                                updateField(field, val);
                                updateField(otherField, '');
                            }
                        }}
                        className="w-full bg-black/40 border border-white/10 rounded-lg p-4 text-slate-200 focus:border-cyan-500/50 focus:shadow-[0_0_20px_rgba(6,182,212,0.1)] outline-none appearance-none transition-all cursor-pointer"
                    >
                        <option value="">Select Option...</option>
                        {options.map(o => <option key={o} value={o}>{o}</option>)}
                        <option value="Other">Other (Specify)</option>
                    </select>
                    <ChevronRight className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none rotate-90" size={16} />
                </div>

                <AnimatePresence>
                    {isOtherSelected && (
                        <motion.div
                            initial={{ opacity: 0, height: 0, y: -10 }}
                            animate={{ opacity: 1, height: 'auto', y: 0 }}
                            exit={{ opacity: 0, height: 0, y: -10 }}
                            className="mt-3 overflow-hidden"
                        >
                            <input
                                type="text"
                                value={formData[otherField] || ''}
                                onChange={e => updateField(otherField, e.target.value)}
                                className="w-full bg-[#161b22] border-[#58a6ff]/30 rounded-lg p-4 text-slate-200 focus:border-[#58a6ff] outline-none placeholder:text-slate-600 text-sm"
                                placeholder={`Specify custom ${label.toLowerCase()}...`}
                                autoFocus
                            />
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        );
    };

    const steps = [
        { id: 1, label: "Identity", icon: Fingerprint, desc: "Project Basics" },
        { id: 2, label: "Context", icon: Globe, desc: "System Environment" },
        { id: 3, label: "Scope", icon: Layers, desc: "Functional Reqs" },
        { id: 4, label: "Constraints", icon: Activity, desc: "Non-Functional" },
        { id: 5, label: "Security", icon: Shield, desc: "Compliance & Auth" },
        { id: 6, label: "Technical", icon: Cpu, desc: "Stack Preferences" },
        { id: 7, label: "Output", icon: FileText, desc: "Generation Control" },
    ];

    const currentStepInfo = steps.find(s => s.id === step);

    return (
        <div className="min-h-screen bg-[#0d1117] text-white font-sans selection:bg-[#58a6ff]/30 overflow-hidden relative flex">

            {/* --- Background Ambience --- */}
            <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-[#0d1117] via-[#161b22] to-[#0d1117] animate-gradient pointer-events-none opacity-50" />
            <div className="absolute top-0 left-0 w-[500px] h-[500px] bg-[#58a6ff]/10 rounded-full blur-[120px] pointer-events-none animate-pulse" />
            <div className="absolute bottom-0 right-0 w-[600px] h-[600px] bg-[#238636]/5 rounded-full blur-[100px] pointer-events-none" />
            <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-10 pointer-events-none mix-blend-overlay"></div>

            {/* --- Progress Rail (Sidebar) --- */}
            <div className="w-80 border-r border-white/5 bg-[#161b22] border-r border-[#30363d] backdrop-blur-md flex flex-col p-8 z-20 relative">
                <div
                    className="mb-10 cursor-pointer group"
                    onClick={() => navigate('/dashboard')}
                >
                    <Logo subText="ENTERPRISE_MODULE" className="group-hover:opacity-80 transition-opacity" />
                </div>

                <nav className="space-y-1 relative flex-1">
                    {/* Connective Line */}
                    <div className="absolute left-[19px] top-6 bottom-6 w-px bg-white/5 z-0"></div>

                    {steps.map((s) => (
                        <div
                            key={s.id}
                            onClick={() => setStep(s.id)}
                            className={cn(
                                "relative z-10 group cursor-pointer flex items-center gap-4 p-3 rounded-lg transition-all duration-300",
                                step === s.id ? "bg-white/5 border-l-2 border-[#58a6ff]" : "hover:bg-white/5 border-l-2 border-transparent"
                            )}
                        >
                            <div className={cn(
                                "w-10 h-10 rounded-lg flex items-center justify-center transition-all shadow-lg",
                                step === s.id ? "bg-[#58a6ff]/10 text-[#58a6ff] border border-[#58a6ff]/20" :
                                    step > s.id ? "bg-white/5 text-white/40 border border-white/5" : "bg-black/40 text-slate-600 border border-white/5"
                            )}>
                                {step > s.id ? <CheckCircle size={18} /> : <s.icon size={18} />}
                            </div>
                            <div className="flex flex-col">
                                <span className={cn(
                                    "text-sm font-bold tracking-wide transition-colors uppercase",
                                    step === s.id ? "text-white shadow-[0_0_10px_rgba(255,255,255,0.3)]" : "text-slate-500 group-hover:text-slate-300"
                                )}>{s.label}</span>
                                <span className="text-[10px] text-slate-600 font-mono">{s.desc}</span>
                            </div>
                        </div>
                    ))}

                    <div className="mt-6 px-3">
                        <button
                            onClick={handleClearForm}
                            className="w-full group flex items-center gap-3 px-3 py-2.5 rounded-lg border border-red-500/20 text-red-500/60 hover:text-red-400 hover:bg-red-500/5 transition-all text-[10px] font-bold uppercase tracking-widest"
                        >
                            <X size={14} className="group-hover:rotate-90 transition-transform" />
                            Clear Session Data
                        </button>
                    </div>
                </nav>

                <div className="mt-8 pt-6 border-t border-white/5">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center overflow-hidden border border-white/10 shrink-0">
                            {user?.profilePic ? <img src={user.profilePic} className="w-full h-full object-cover" /> : <div className="text-xs font-bold text-slate-400">USR</div>}
                        </div>
                        <div className="flex flex-col overflow-hidden">
                            <span className="text-xs font-bold text-white/90 truncate">{user?.name || 'Guest Engineer'}</span>
                            <span className="text-[10px] text-emerald-500 flex items-center gap-1">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                                ONLINE
                            </span>
                        </div>
                    </div>
                </div>

                {/* Global Styles for Options */}
                <style>{`
                    option {
                        background-color: #050505;
                        color: #e2e8f0;
                        padding: 10px;
                    }
                `}</style>
            </div>

            {/* --- Main Content (Glass Panel) --- */}
            <div className="flex-1 p-12 overflow-y-auto relative z-10 flex flex-col items-center">
                <AnimatePresence mode="wait">
                    <motion.div
                        key={step}
                        initial={{ opacity: 0, x: 20, scale: 0.98 }}
                        animate={{ opacity: 1, x: 0, scale: 1 }}
                        exit={{ opacity: 0, x: -20, scale: 0.98 }}
                        transition={{ duration: 0.4, ease: "anticipate" }}
                        className="w-full max-w-3xl"
                    >
                        {/* Header */}
                        <div className="mb-8 pl-1">
                            <h2 className="text-3xl font-bold mb-2 flex items-center gap-3">
                                <span className="text-[#58a6ff] text-lg font-mono">0{step}.</span>
                                {currentStepInfo.label}
                            </h2>
                            <p className="text-slate-400 text-sm max-w-lg">{currentStepInfo.desc} configuration.</p>
                        </div>

                        {/* Glass Form Container */}
                        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-10 shadow-2xl relative overflow-hidden">
                            <div className="absolute inset-0 bg-gradient-to-b from-white/5 to-transparent pointer-events-none"></div>

                            {/* Step 1: Project Identity */}
                            {step === 1 && (
                                <div className="space-y-4">
                                    {renderInput('Project Name', 'projectName', 'e.g. Nebula Core System')}
                                    {renderInput('Author(s)', 'authors', 'Dev Team Lead...', 'textarea')}
                                    {renderInput('Organization', 'organization', 'e.g. Acme Corp')}
                                    {renderInput('Problem Statement', 'problemStatement', 'Define the core business problem...', 'textarea')}

                                    <div className="mt-8">
                                        <label className="block text-slate-400 text-xs font-bold mb-4 uppercase tracking-widest">Target Users</label>
                                        <div className="flex flex-wrap gap-3">
                                            {['Admin', 'End User', 'Manager', 'Analyst', 'Customer', 'Other'].map(u => (
                                                <label key={u} className="relative group cursor-pointer">
                                                    <input
                                                        type="checkbox"
                                                        checked={formData.targetUsers.includes(u)}
                                                        onChange={() => toggleCheckbox('targetUsers', u)}
                                                        className="peer sr-only"
                                                    />
                                                    <div className="px-5 py-2.5 bg-black/40 border border-white/10 rounded-lg text-sm text-slate-400 transition-all peer-checked:bg-cyan-500/10 peer-checked:border-cyan-500/50 peer-checked:text-cyan-400 peer-checked:shadow-[0_0_15px_rgba(6,182,212,0.2)] hover:border-white/30">
                                                        {u}
                                                    </div>
                                                </label>
                                            ))}
                                        </div>
                                        <AnimatePresence>
                                            {formData.targetUsers.includes('Other') && (
                                                <motion.div
                                                    initial={{ opacity: 0, height: 0, y: -10 }}
                                                    animate={{ opacity: 1, height: 'auto', y: 0 }}
                                                    exit={{ opacity: 0, height: 0, y: -10 }}
                                                    className="mt-4"
                                                >
                                                    <input
                                                        type="text"
                                                        value={formData.otherUser || ''}
                                                        onChange={e => updateField('otherUser', e.target.value)}
                                                        className="w-full bg-[#161b22] border-[#58a6ff]/30 rounded-lg p-4 text-slate-200 focus:border-[#58a6ff] outline-none placeholder:text-slate-600 text-sm"
                                                        placeholder="Specify other target users (e.g., Supplier, Vendor, Auditor)..."
                                                    />
                                                </motion.div>
                                            )}
                                        </AnimatePresence>
                                    </div>
                                </div>
                            )}

                            {/* Step 2: System Context */}
                            {step === 2 && (
                                <div className="space-y-4">
                                    {renderSelect('Application Type', 'appType', ['Web Application', 'Mobile App', 'Desktop Software', 'API Service', 'Embedded System'])}
                                    {renderSelect('Project Domain', 'domain', ['Healthcare', 'FinTech', 'E-commerce', 'Logistics', 'Education', 'Social Media', 'Enterprise ERP', 'Web Development', 'Mobile App', 'Other'])}
                                </div>
                            )}

                            {/* Step 3: Functional Scope */}
                            {step === 3 && (
                                <div className="space-y-4">
                                    {renderInput('Core Features', 'coreFeatures', '• User Authentication\n• Real-time Dashboard\n• Report Generation', 'textarea')}
                                    {renderInput('Primary User Flow', 'userFlow', 'User logs in -> Selects Item -> Checks out...', 'textarea')}
                                </div>
                            )}

                            {/* Step 4: Non-Functional */}
                            {step === 4 && (
                                <div className="space-y-4">
                                    {renderSelect('Expected User Scale', 'userScale', ['< 100 Users', '100 - 1,000 Users', '1,000 - 10,000 Users', '10,000+ Users'])}
                                    {renderSelect('Performance Tier', 'performance', ['Standard (2-3s load)', 'High Performance (< 1s load)', 'Real-time (ms latency)'])}
                                </div>
                            )}

                            {/* Step 5: Security */}
                            {step === 5 && (
                                <div className="space-y-8">
                                    <div>
                                        <label className="block text-slate-400 text-xs font-bold mb-4 uppercase tracking-widest">Authentication Required?</label>
                                        <div className="flex gap-4">
                                            {['Yes', 'No'].map(opt => (
                                                <label key={opt} className="flex-1 cursor-pointer">
                                                    <input
                                                        type="radio"
                                                        name="authRequired"
                                                        checked={formData.authRequired === opt}
                                                        onChange={() => updateField('authRequired', opt)}
                                                        className="peer sr-only"
                                                    />
                                                    <div className="text-center py-4 bg-black/40 border border-white/10 rounded-lg text-slate-400 transition-all peer-checked:bg-cyan-500/10 peer-checked:border-cyan-500/50 peer-checked:text-cyan-400 peer-checked:shadow-[0_0_15px_rgba(6,182,212,0.2)]">
                                                        {opt}
                                                    </div>
                                                </label>
                                            ))}
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-slate-400 text-xs font-bold mb-4 uppercase tracking-widest">Compliance Standards</label>
                                        <div className="grid grid-cols-2 gap-3">
                                            {['GDPR', 'HIPAA', 'PCI-DSS', 'SOC2', 'Other'].map(c => (
                                                <label key={c} className="relative group cursor-pointer">
                                                    <input
                                                        type="checkbox"
                                                        checked={formData.compliance.includes(c)}
                                                        onChange={() => toggleCheckbox('compliance', c)}
                                                        className="peer sr-only"
                                                    />
                                                    <div className="flex items-center gap-3 px-5 py-3 bg-black/40 border border-white/10 rounded-lg text-sm text-slate-400 transition-all peer-checked:bg-violet-500/10 peer-checked:border-violet-500/50 peer-checked:text-violet-400 peer-checked:shadow-[0_0_15px_rgba(139,92,246,0.2)] hover:border-white/30">
                                                        <Shield size={16} />
                                                        {c}
                                                    </div>
                                                </label>
                                            ))}
                                        </div>
                                        <AnimatePresence>
                                            {formData.compliance.includes('Other') && (
                                                <motion.div
                                                    initial={{ opacity: 0, height: 0, y: -10 }}
                                                    animate={{ opacity: 1, height: 'auto', y: 0 }}
                                                    exit={{ opacity: 0, height: 0, y: -10 }}
                                                    className="mt-4"
                                                >
                                                    <input
                                                        type="text"
                                                        value={formData.compliance_other || ''}
                                                        onChange={e => updateField('compliance_other', e.target.value)}
                                                        className="w-full bg-black/40 border border-violet-500/30 rounded-lg p-4 text-slate-200 focus:border-violet-500 outline-none placeholder:text-slate-600 text-sm"
                                                        placeholder="Specify other compliance standards (e.g., ISO 27001, SOX)..."
                                                    />
                                                </motion.div>
                                            )}
                                        </AnimatePresence>
                                    </div>
                                </div>
                            )}

                            {/* Step 6: Technical */}
                            {step === 6 && (
                                <div className="space-y-4">
                                    {renderSelect('Preferred Backend', 'backendPref', ['Node.js', 'Python (Django/FastAPI)', 'Java (Spring)', 'Go', 'No Preference'])}
                                    {renderSelect('Database', 'dbPref', ['PostgreSQL', 'MongoDB', 'MySQL', 'Firebase', 'No Preference'])}
                                    {renderSelect('Deployment Cloud', 'deploymentPref', ['AWS', 'Google Cloud', 'Azure', 'Vercel/Netlify', 'On-Premise'])}
                                </div>
                            )}

                            {/* Step 7: Output (Final) */}
                            {step === 7 && (
                                <div className="space-y-8">
                                    {renderSelect('SRS Detail Level', 'detailLevel', ['Standard (Academic)', 'Professional (Enterprise)', 'Brief (Startup MVP)'])}
                                    {renderInput('Extra Instructions', 'additionalInstructions', 'Add precise instructions for the AI...', 'textarea')}

                                    <div className="mt-12 pt-8 border-t border-white/10">
                                        <button
                                            onClick={handleGenerate}
                                            className="w-full bg-gradient-to-r from-[#238636] via-[#2eaa44] to-[#238636] animate-gradient text-white p-4 rounded-xl flex items-center justify-center gap-3 transition-all shadow-lg hover:scale-[1.01] shadow-green-900/40 group font-bold tracking-widest uppercase"
                                        >
                                            <Activity className="text-white animate-pulse" size={20} />
                                            INITIALIZE GENERATOR
                                        </button>
                                    </div>
                                </div>
                            )}

                        </div>

                        {/* Footer Nav */}
                        <div className="mt-8 flex justify-between items-center px-4">
                            <button
                                onClick={() => setStep(Math.max(1, step - 1))}
                                disabled={step === 1}
                                className="text-slate-500 hover:text-white disabled:opacity-0 transition-colors flex items-center gap-2 text-sm font-mono"
                            >
                                <ChevronLeft size={16} /> BACK
                            </button>

                            <button
                                onClick={handleClearForm}
                                className="text-red-500/70 hover:text-red-500 transition-colors text-xs font-mono uppercase tracking-widest border border-red-500/20 px-4 py-1.5 rounded-full hover:bg-red-500/10"
                            >
                                Clear Form
                            </button>

                            {step < 7 && (
                                <button
                                    onClick={() => setStep(Math.min(7, step + 1))}
                                    className="px-6 py-2 bg-white/5 border border-white/10 rounded-full hover:bg-white/10 text-white font-bold flex items-center gap-2 text-sm transition-all"
                                >
                                    NEXT <ChevronRight size={16} />
                                </button>
                            )}
                        </div>

                    </motion.div>
                </AnimatePresence>
            </div>
        </div>
    );
};

export default EnterpriseSRS;
