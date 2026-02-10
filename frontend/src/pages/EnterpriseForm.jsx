import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
// import { buildEnterpriseDocx } from '../utils/buildEnterpriseDocx'; // Will create next
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { User, FileText } from 'lucide-react';
import ProfileSettings from './ProfileSettings';

const EnterpriseForm = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { user } = useAuth();
    const [showProfile, setShowProfile] = useState(false);
    const [step, setStep] = useState(1);

    // State matching the provided images
    const [formData, setFormData] = useState({
        projectId: '',
        // 1. Project Identity
        projectName: '',
        authors: '', // 'Name 1\nName 2'
        organization: '',
        problemStatement: '',
        targetUsers: [], // ['Admin', 'End User', etc]
        otherUser: '',

        // 2. System Context
        appType: '', // Web, Mobile, etc
        domain: '', // FinTech, Health, etc
        domain_other: '',

        // 3. Functional Scope
        coreFeatures: '', // per line
        userFlow: '',

        // 4. Non-Functional
        userScale: '',
        userScale_other: '',
        performance: '',
        performance_other: '',

        // 5. Security
        authRequired: 'Yes',
        sensitiveData: 'Yes',
        compliance: [], // GDPR, HIPAA etc

        // 6. Technical
        backendPref: '',
        backendPref_other: '',
        dbPref: '',
        dbPref_other: '',
        deploymentPref: '',
        deploymentPref_other: '',

        // 7. Output
        detailLevel: 'Professional',
        additionalInstructions: ''
    });

    const [isLoaded, setIsLoaded] = useState(false);

    // Load from Local Storage on Mount
    const defaultFormData = {
        projectId: '',
        projectName: '',
        authors: '',
        organization: '',
        problemStatement: '',
        targetUsers: [],
        otherUser: '',
        appType: '',
        domain: '',
        domain_other: '',
        coreFeatures: '',
        userFlow: '',
        userScale: '',
        userScale_other: '',
        performance: '',
        performance_other: '',
        authRequired: 'Yes',
        sensitiveData: 'Yes',
        compliance: [],
        backendPref: '',
        backendPref_other: '',
        dbPref: '',
        dbPref_other: '',
        deploymentPref: '',
        deploymentPref_other: '',
        detailLevel: 'Professional',
        additionalInstructions: ''
    };

    useEffect(() => {
        const params = new URLSearchParams(location.search);
        const shouldReset = location.state?.resetForm || params.get('new') === '1';
        const isUpdateFlow = params.get('update') === '1' || location.state?.update === true;
        if (shouldReset) {
            localStorage.removeItem('autoSRS_enterpriseForm');
            localStorage.removeItem('autoSRS_activeProjectId');
            setFormData(defaultFormData);
            setStep(1);
            setIsLoaded(true);
            return;
        }
        const savedData = localStorage.getItem('autoSRS_enterpriseForm');
        if (savedData) {
            try {
                const parsed = JSON.parse(savedData);
                // Merge carefully, maybe deep merge if needed, but shallow merge is usually fine for flat structure
                setFormData(prev => ({ ...prev, ...parsed.formData }));
                if (parsed.step) setStep(parsed.step);
            } catch (e) {
                console.error("Failed to load saved form", e);
            }
        }
        const incomingProjectId = location.state?.projectId || params.get('projectId');
        if (isUpdateFlow && incomingProjectId) {
            localStorage.setItem('autoSRS_activeProjectId', incomingProjectId);
            setFormData(prev => ({ ...prev, projectId: incomingProjectId }));
        } else if (!isUpdateFlow) {
            localStorage.removeItem('autoSRS_activeProjectId');
            setFormData(prev => ({ ...prev, projectId: '' }));
        }
        setIsLoaded(true); // Mark as loaded so we can start saving
    }, [location.state, location.search]);

    useEffect(() => {
        const prefill = location.state?.prefill;
        const prefillStep = location.state?.step;
        if (prefill) {
            setFormData(prev => ({ ...prev, ...prefill }));
        }
        if (prefillStep) {
            setStep(prefillStep);
        }
    }, [location.state]);

    // Save to Local Storage on Change
    useEffect(() => {
        if (isLoaded) {
            const payload = { formData, step };
            localStorage.setItem('autoSRS_enterpriseForm', JSON.stringify(payload));
        }
    }, [formData, step, isLoaded]);

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
        const params = new URLSearchParams(location.search);
        const isUpdateFlow = params.get('update') === '1' || location.state?.update === true;
        const storedProjectId = localStorage.getItem('autoSRS_activeProjectId');
        const projectId = isUpdateFlow ? (location.state?.projectId || formData.projectId || storedProjectId) : null;
        const payload = { ...formData, projectId: projectId || '' };
        navigate('/enterprise/generation', { state: { formData: payload, projectId, update: isUpdateFlow } });
    };

    const sectionVariants = {
        hidden: { opacity: 0, x: 20 },
        visible: { opacity: 1, x: 0 },
        exit: { opacity: 0, x: -20 }
    };

    const renderInput = (label, field, placeholder, type = 'text') => (
        <div className="mb-6">
            <label className="block text-neon-blue text-sm font-bold mb-2 uppercase">{label} <span className="text-red-500">*</span></label>
            {type === 'textarea' ? (
                <textarea
                    value={formData[field]}
                    onChange={e => updateField(field, e.target.value)}
                    className="w-full bg-dark-input border border-gray-700 rounded p-3 text-white focus:border-neon-blue outline-none min-h-[100px]"
                    placeholder={placeholder}
                />
            ) : (
                <input
                    type={type}
                    value={formData[field]}
                    onChange={e => updateField(field, e.target.value)}
                    className="w-full bg-dark-input border border-gray-700 rounded p-3 text-white focus:border-neon-blue outline-none"
                    placeholder={placeholder}
                />
            )}
        </div>
    );

    const renderSelect = (label, field, options) => {
        const isOtherSelected = formData[field] === 'Other';
        const otherField = `${field}_other`;

        return (
            <div className="mb-6">
                <label className="block text-neon-blue text-sm font-bold mb-2 uppercase">{label} <span className="text-red-500">*</span></label>
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
                    className="w-full bg-dark-input border border-gray-700 rounded p-3 text-white focus:border-neon-blue outline-none"
                >
                    <option value="">Select...</option>
                    {options.map(o => <option key={o} value={o}>{o}</option>)}
                    <option value="Other">Other (Specify)</option>
                </select>

                {isOtherSelected && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        className="mt-3"
                    >
                        <input
                            type="text"
                            value={formData[otherField] || ''}
                            onChange={e => updateField(otherField, e.target.value)}
                            className="w-full bg-dark-input border border-neon-blue/50 rounded p-3 text-white focus:border-neon-blue outline-none placeholder:text-gray-600"
                            placeholder={`Specify other ${label.toLowerCase()}...`}
                        />
                    </motion.div>
                )}
            </div>
        );
    };

    return (
        <div className="min-h-screen bg-dark-bg text-white font-sans flex flex-col">
            {/* Top Navigation Bar with Profile */}
            <nav className="h-16 bg-gray-900/90 backdrop-blur-md border-b border-gray-800 z-50 flex items-center justify-between px-6">
                <div className="flex items-center gap-3 cursor-pointer group" onClick={() => navigate('/dashboard')}>
                    <div className="p-2 bg-gray-800 rounded-lg group-hover:bg-neon-blue/20 transition duration-300">
                        <FileText className="text-neon-blue group-hover:scale-110 transition-transform" size={20} />
                    </div>
                    <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-neon-blue to-neon-purple tracking-tight">DocuVerse</span>
                </div>

                <div className="flex items-center gap-6">
                    <div className="text-right hidden sm:block">
                        <div className="text-sm font-bold text-white tracking-wide">{user?.name || 'User'}</div>
                        <div className="text-xs text-gray-400 font-medium uppercase tracking-wider">Enterprise SRS</div>
                    </div>

                    <div
                        onClick={() => setShowProfile(true)}
                        className="w-10 h-10 rounded-full bg-gray-800 border-2 border-gray-700 hover:border-neon-blue cursor-pointer flex items-center justify-center overflow-hidden transition-all duration-300 hover:shadow-[0_0_15px_rgba(0,243,255,0.3)]"
                    >
                        {user?.profilePic ? (
                            <img src={user.profilePic} alt="Profile" className="w-full h-full object-cover" />
                        ) : (
                            <User className="text-gray-400" size={20} />
                        )}
                    </div>
                </div>
            </nav>

            {/* Main Content with Sidebar */}
            <div className="flex flex-1">
                {/* Left Sidebar Steps */}
                <div className="w-64 bg-gray-900 border-r border-gray-800 p-6 overflow-y-auto">
                    <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-neon-blue to-neon-purple mb-8">
                        SRS Generator
                    </h1>
                    <div className="space-y-2">
                        {['Project Identity', 'System Context', 'Functional Scope', 'Non-Functional', 'Security & Compliance', 'Technical Prefs', 'Output Control'].map((s, i) => (
                            <div
                                key={i}
                                onClick={() => setStep(i + 1)}
                                className={`p-3 rounded cursor-pointer transition-all ${step === i + 1
                                    ? 'bg-neon-blue/20 text-neon-blue border-l-4 border-neon-blue'
                                    : 'text-gray-500 hover:text-gray-300'
                                    }`}
                            >
                                {s}
                            </div>
                        ))}
                    </div>
                </div>

                {/* Main Content */}
                <div className="flex-1 p-10 max-w-4xl overflow-y-auto">
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={step}
                            variants={sectionVariants}
                            initial="hidden"
                            animate="visible"
                            exit="exit"
                            transition={{ duration: 0.3 }}
                        >
                            {step === 1 && (
                                <div>
                                    <h2 className="text-3xl font-bold text-white mb-6 border-l-4 border-neon-purple pl-4">I. Project Identity</h2>
                                    {renderInput('Project Name', 'projectName', 'e.g. Customer Churn Prediction System')}
                                    {renderInput('Author(s)', 'authors', 'Enter names (one per line)', 'textarea')}
                                    {renderInput('Organization', 'organization', 'e.g. TechCorp Solutions')}
                                    {renderInput('Problem Statement', 'problemStatement', 'Describe the core problem...', 'textarea')}

                                    <div className="mb-6">
                                        <label className="block text-neon-blue text-sm font-bold mb-2 uppercase">Target Users <span className="text-red-500">*</span></label>
                                        <div className="flex flex-wrap gap-4">
                                            {['Admin', 'End User', 'Manager', 'Analyst', 'Customer'].map(u => (
                                                <label key={u} className="flex items-center space-x-2 bg-dark-input px-4 py-2 rounded cursor-pointer border border-gray-700 hover:border-neon-purple transition">
                                                    <input
                                                        type="checkbox"
                                                        checked={formData.targetUsers.includes(u)}
                                                        onChange={() => toggleCheckbox('targetUsers', u)}
                                                        className="form-checkbox text-neon-purple bg-gray-800 border-gray-600 rounded focus:ring-0"
                                                    />
                                                    <span>{u}</span>
                                                </label>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            )}

                            {step === 2 && (
                                <div>
                                    <h2 className="text-3xl font-bold text-white mb-6 border-l-4 border-neon-purple pl-4">II. System Context</h2>
                                    {renderSelect('Application Type', 'appType', ['Web Application', 'Mobile App', 'Desktop Software', 'API Service', 'Embedded System'])}
                                    {renderSelect('Domain/Industry', 'domain', ['FinTech', 'Healthcare', 'E-commerce', 'Education', 'Social Media', 'Enterprise Resource Planning'])}
                                </div>
                            )}

                            {step === 3 && (
                                <div>
                                    <h2 className="text-3xl font-bold text-white mb-6 border-l-4 border-neon-purple pl-4">III. Functional Scope</h2>
                                    {renderInput('Core Features', 'coreFeatures', 'List features (one per line)...', 'textarea')}
                                    {renderInput('Primary User Flow', 'userFlow', 'e.g. User logs in -> Uploads Data -> Views Results...', 'textarea')}
                                </div>
                            )}

                            {step === 4 && (
                                <div>
                                    <h2 className="text-3xl font-bold text-white mb-6 border-l-4 border-neon-purple pl-4">IV. Non-Functional Requirements</h2>
                                    {renderSelect('Expected User Scale', 'userScale', ['< 100 Users', '100 - 1,000 Users', '1,000 - 10,000 Users', '10,000+ Users'])}
                                    {renderSelect('Performance Expectation', 'performance', ['Standard (2-3s load)', 'High Performance (< 1s load)', 'Real-time (ms latency)'])}
                                </div>
                            )}

                            {step === 5 && (
                                <div>
                                    <h2 className="text-3xl font-bold text-white mb-6 border-l-4 border-neon-purple pl-4">V. Security & Compliance</h2>
                                    <div className="mb-6">
                                        <label className="block text-neon-blue text-sm font-bold mb-2 uppercase">Authentication Required?</label>
                                        <div className="flex gap-4">
                                            {['Yes', 'No'].map(opt => (
                                                <label key={opt} className="flex items-center space-x-2 cursor-pointer">
                                                    <input
                                                        type="radio"
                                                        name="authRequired"
                                                        checked={formData.authRequired === opt}
                                                        onChange={() => updateField('authRequired', opt)}
                                                        className="text-neon-purple focus:ring-0"
                                                    />
                                                    <span>{opt}</span>
                                                </label>
                                            ))}
                                        </div>
                                    </div>
                                    <div className="mb-6">
                                        <label className="block text-neon-blue text-sm font-bold mb-2 uppercase">Compliance Requirements</label>
                                        <div className="flex flex-wrap gap-4">
                                            {['GDPR', 'HIPAA', 'PCI-DSS', 'SOC2'].map(c => (
                                                <label key={c} className="flex items-center space-x-2 bg-dark-input px-4 py-2 rounded cursor-pointer border border-gray-700 hover:border-neon-purple transition">
                                                    <input
                                                        type="checkbox"
                                                        checked={formData.compliance.includes(c)}
                                                        onChange={() => toggleCheckbox('compliance', c)}
                                                        className="form-checkbox text-neon-purple rounded"
                                                    />
                                                    <span>{c}</span>
                                                </label>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            )}

                            {step === 6 && (
                                <div>
                                    <h2 className="text-3xl font-bold text-white mb-6 border-l-4 border-neon-purple pl-4">VI. Technical Preferences</h2>
                                    {renderSelect('Preferred Backend', 'backendPref', ['Node.js', 'Python (Django/FastAPI)', 'Java (Spring)', 'Go', 'No Preference'])}
                                    {renderSelect('Database Preference', 'dbPref', ['PostgreSQL', 'MongoDB', 'MySQL', 'Firebase', 'No Preference'])}
                                    {renderSelect('Deployment Preference', 'deploymentPref', ['AWS', 'Google Cloud', 'Azure', 'Vercel/Netlify', 'On-Premise'])}
                                </div>
                            )}

                            {step === 7 && (
                                <div>
                                    <h2 className="text-3xl font-bold text-white mb-6 border-l-4 border-neon-purple pl-4">VII. Output Control</h2>
                                    {renderSelect('SRS Detail Level', 'detailLevel', ['Standard (Academic)', 'Professional (Enterprise)', 'Brief (Startup MVP)'])}
                                    {renderInput('Other / Extra Instructions', 'additionalInstructions', 'Add any extra instructions or changes to include in the SRS...', 'textarea')}

                                    <div className="mt-10 border-t border-gray-800 pt-6">
                                        <button
                                            onClick={handleGenerate}
                                            className="w-full bg-neon-purple hover:bg-purple-700 text-white font-bold py-4 rounded shadow-[0_0_20px_rgba(188,19,254,0.4)] transition-all transform hover:scale-[1.01]"
                                        >
                                            GENERATE ENTERPRISE SRS
                                        </button>
                                    </div>
                                </div>
                            )}
                        </motion.div>
                    </AnimatePresence>

                    <div className="mt-8 flex justify-between">
                        <button
                            onClick={() => setStep(Math.max(1, step - 1))}
                            className={`px-6 py-2 rounded border border-gray-600 hover:bg-gray-800 text-gray-300 ${step === 1 ? 'opacity-0 cursor-default' : ''}`}
                        >
                            Previous
                        </button>
                        {step < 7 && (
                            <button
                                onClick={() => setStep(Math.min(7, step + 1))}
                                className="px-6 py-2 rounded bg-neon-blue text-black font-bold hover:bg-cyan-400 shadow-[0_0_10px_rgba(0,243,255,0.4)]"
                            >
                                Next Step
                            </button>
                        )}
                    </div>
                </div>
            </div>

            {/* Profile Modal */}
            {showProfile && <ProfileSettings onClose={() => setShowProfile(false)} />}
        </div>
    );
};

export default EnterpriseForm;
