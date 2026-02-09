import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { User, FileText, CheckCircle2, XCircle, Download, Sparkles } from 'lucide-react';
import ProfileSettings from './ProfileSettings';
import axios from 'axios';
import { saveAs } from 'file-saver';

const EnterpriseGeneration = () => {
    const loc = useLocation();
    const navigate = useNavigate();
    const { user } = useAuth();
    const [progress, setProgress] = useState(0);
    const [status, setStatus] = useState('Initializing Core...');
    const [showProfile, setShowProfile] = useState(false);
    const [complete, setComplete] = useState(false);
    const [error, setError] = useState(null);
    const [generatedBlob, setGeneratedBlob] = useState(null);
    const [hqBlob, setHqBlob] = useState(null);
    const [hqStatus, setHqStatus] = useState('');
    const [hqLoading, setHqLoading] = useState(false);
    const [secondsLeft, setSecondsLeft] = useState(60);
    const [recovering, setRecovering] = useState(false);
    const [downloadUrl, setDownloadUrl] = useState('');
    const [hqDownloadUrl, setHqDownloadUrl] = useState('');
    const [studioLoading, setStudioLoading] = useState(false);
    const formData = loc.state?.formData;
    const REQUEST_TIMEOUT_MS = 180000; // quality-first quick mode timeout

    const toList = (value) => {
        if (!value) return [];
        if (Array.isArray(value)) return value.map(v => String(v).trim()).filter(Boolean);
        return String(value)
            .split(/\r?\n|,|;/)
            .map(v => v.trim())
            .filter(Boolean);
    };

    const mapScale = (scale) => {
        const mapping = {
            '< 100 Users': '<100',
            '100 - 1,000 Users': '100-1k',
            '1,000 - 10,000 Users': '1k-100k',
            '10,000+ Users': '>100k',
        };
        return mapping[scale] || '100-1k';
    };

    const mapPerformance = (performance) => {
        const mapping = {
            'Standard (2-3s load)': 'Normal',
            'High Performance (< 1s load)': 'High',
            'Real-time (ms latency)': 'Real-time',
        };
        return mapping[performance] || 'Normal';
    };

    const mapDetailLevel = (detailLevel) => {
        const mapping = {
            'Standard (Academic)': 'High-level',
            'Professional (Enterprise)': 'Enterprise-grade',
            'Brief (Startup MVP)': 'High-level',
        };
        return mapping[detailLevel] || 'Enterprise-grade';
    };

    const buildSrsPayload = (fd) => ({
        project_identity: {
            project_name: (fd.projectName || 'Untitled Project').trim(),
            author: toList(fd.authors).length > 0 ? toList(fd.authors) : ['N/A'],
            organization: (fd.organization || 'Organization').trim(),
            problem_statement: (fd.problemStatement || 'Project problem statement not provided.').trim(),
            target_users: fd.targetUsers?.length ? fd.targetUsers : ['End User'],
            live_link: null,
            project_id: null,
        },
        system_context: {
            application_type: fd.appType || 'Web Application',
            domain: fd.domain || 'Enterprise Software',
        },
        functional_scope: {
            core_features: toList(fd.coreFeatures).length > 0 ? toList(fd.coreFeatures) : ['Core feature definition pending'],
            primary_user_flow: (fd.userFlow || '').trim() || null,
        },
        non_functional_requirements: {
            expected_user_scale: mapScale(fd.userScale),
            performance_expectation: mapPerformance(fd.performance),
        },
        security_and_compliance: {
            authentication_required: fd.authRequired === 'Yes',
            sensitive_data_handling: fd.sensitiveData === 'Yes',
            compliance_requirements: fd.compliance || [],
        },
        technical_preferences: {
            preferred_backend: fd.backendPref || null,
            database_preference: fd.dbPref || null,
            deployment_preference: fd.deploymentPref || null,
        },
        output_control: {
            srs_detail_level: mapDetailLevel(fd.detailLevel),
            additional_instructions: (fd.additionalInstructions || '').trim() || null,
        },
    });

    const toProjectKey = (name) => {
        const raw = String(name || 'Project');
        const safe = raw.replace(/[^a-zA-Z0-9_-]/g, '_').replace(/^_+|_+$/g, '');
        return safe || 'Project';
    };

    const tryRecoverTimedOutGeneration = async (projectKey, downloadNameBase) => {
        const maxAttempts = 60; // ~5 min recovery window
        for (let i = 0; i < maxAttempts; i++) {
            try {
                const statusRes = await axios.get(`/srs_status/${projectKey}`, { timeout: 5000 });
                const bestUrl =
                    statusRes?.data?.enhanced_download_url ||
                    statusRes?.data?.full_download_url ||
                    statusRes?.data?.quick_download_url ||
                    statusRes?.data?.instant_download_url;
                if (bestUrl) {
                    const recoveredRes = await axios.get(bestUrl, {
                        responseType: 'blob',
                        timeout: 15000,
                    });
                    setGeneratedBlob(recoveredRes.data);
                    saveAs(recoveredRes.data, `${downloadNameBase}_Enterprise_SRS.docx`);
                    setComplete(true);
                    setError(null);
                    setStatus('Recovered and downloaded generated document.');
                    setHqStatus('Document recovered after timeout. You can still generate HQ version.');
                    setRecovering(false);
                    return true;
                }
            } catch {
                // Keep retrying within bounded attempts.
            }
            if (i % 4 === 0) {
                setStatus('Server is still processing... auto-downloading when ready.');
            }
            await new Promise((resolve) => setTimeout(resolve, 3000));
        }
        setRecovering(false);
        return false;
    };

    const steps = [
        "Initializing Core...",
        "Analyzing Project Context...",
        "Drafting Functional Requirements...",
        "Validating Security Constraints...",
        "Optimizing Technical Architecture...",
        "Finalizing Documentation..."
    ];

    useEffect(() => {
        if (!formData) {
            navigate('/enterprise/form');
            return;
        }

        const runGeneration = async () => {
            let progressInterval = null;
            let statusInterval = null;
            let countdownInterval = null;
            let progressPollInterval = null;
            try {
                // Simulate steps for UI feedback
                let stepIndex = 0;
                setSecondsLeft(60);
                progressInterval = setInterval(() => {
                    setProgress(prev => {
                        const increment = prev < 60 ? 2 : prev < 90 ? 1 : 0;
                        const next = prev + increment;
                        if (next % 20 === 0 && stepIndex < steps.length - 1) {
                            stepIndex++;
                            setStatus(steps[stepIndex]);
                        }
                        return Math.min(next, 95);
                    });
                }, 400);

                // Keep UI alive with rotating messaging during longer backend work.
                statusInterval = setInterval(() => {
                    setStatus(prev => {
                        if (prev.startsWith('Finalizing')) {
                            return 'Still generating diagrams and formatting document...';
                        }
                        return 'Finalizing Documentation...';
                    });
                }, 8000);
                countdownInterval = setInterval(() => {
                    setSecondsLeft(prev => Math.max(prev - 1, 0));
                }, 1000);

                const payload = buildSrsPayload(formData);
                const projectKey = toProjectKey(formData.projectName);

                // Real backend stage progress polling
                progressPollInterval = setInterval(async () => {
                    try {
                        const res = await axios.get(`/srs_progress/${projectKey}`, { timeout: 4000 });
                        const p = res?.data;
                        if (!p) return;
                        if (typeof p.progress === 'number') {
                            setProgress(prev => Math.max(prev, Math.min(99, p.progress)));
                        }
                        if (p.message) {
                            setStatus(p.message);
                        }
                    } catch {
                        // keep silent; UI has fallback simulated progress
                    }
                }, 2000);

                const requestAndDownload = async (mode) => {
                    const { data } = await axios.post(`/generate_srs?mode=${mode}`, payload, {
                        timeout: REQUEST_TIMEOUT_MS,
                    });
                    if (!data?.download_url) {
                        throw new Error(`SRS generated in ${mode} mode but no download URL returned.`);
                    }
                    const fileResponse = await axios.get(data.download_url, { responseType: 'blob' });
                    return { data, blob: fileResponse.data };
                };

                // Phase 1: Quick SRS (quality-first baseline format)
                let data;
                let blob;
                try {
                    const res = await requestAndDownload('quick');
                    data = res.data;
                    blob = res.blob;
                } catch (quickErr) {
                    const quickStatus = quickErr?.response?.status;
                    if (quickStatus === 500) {
                        setStatus('Quick mode failed, switching to instant fallback...');
                        const fallbackRes = await requestAndDownload('instant');
                        data = fallbackRes.data;
                        blob = fallbackRes.blob;
                    } else {
                        throw quickErr;
                    }
                }
                setGeneratedBlob(blob); // Save for manual download
                if (data?.download_url) {
                    setDownloadUrl(data.download_url);
                }

                clearInterval(progressInterval);
                clearInterval(statusInterval);
                clearInterval(countdownInterval);
                clearInterval(progressPollInterval);
                progressInterval = null;
                statusInterval = null;
                countdownInterval = null;
                progressPollInterval = null;

                setStatus('Finalizing Document...');
                setProgress(100);
                setRecovering(false);

                setComplete(true);
                setHqStatus('Need richer formatting and all diagrams? Click "Generate High Quality".');

            } catch (err) {
                if (progressInterval) {
                    clearInterval(progressInterval);
                }
                if (statusInterval) {
                    clearInterval(statusInterval);
                }
                if (countdownInterval) {
                    clearInterval(countdownInterval);
                }
                if (progressPollInterval) {
                    clearInterval(progressPollInterval);
                }
                console.error("Generation Failed:", err);
                const timedOut = err?.code === 'ECONNABORTED';
                if (timedOut) {
                    try {
                        setRecovering(true);
                        setError(null);
                        setStatus('Timed out in browser, but generation is still running on server...');
                        const projectName = (formData.projectName || "Enterprise_SRS").replace(/[^a-zA-Z0-9-_]/g, '_');
                        const recovered = await tryRecoverTimedOutGeneration(toProjectKey(formData.projectName), projectName);
                        if (recovered) return;
                    } catch (fallbackErr) {
                        setRecovering(false);
                        const msg = fallbackErr?.message || 'Timeout recovery failed.';
                        setError(msg);
                        setStatus(`Failed: ${msg}`);
                        return;
                    }
                    setError('Server is still busy. Please retry once, or use Generate High Quality after base doc is ready.');
                    setStatus('Could not auto-recover in time.');
                    return;
                }

                const detail = err?.response?.data?.detail;
                const errorMsg =
                    (typeof detail === 'string' ? detail : (detail ? JSON.stringify(detail) : null)) ||
                    err?.response?.data?.message ||
                    err?.message ||
                    "Unknown Error during document generation";
                setRecovering(false);
                setError(errorMsg);
                setStatus(`Failed: ${errorMsg}`);
            }
        };

        runGeneration();
    }, [formData, navigate]);

    const handleGenerateHighQuality = async () => {
        if (!formData || hqLoading) return;
        try {
            setHqLoading(true);
            setHqStatus('Preparing enhanced SRS with more details and diagrams...');
            const payload = buildSrsPayload(formData);
            const projectKey = toProjectKey(formData.projectName);

            const tryDownloadEnhanced = async () => {
                const statusRes = await axios.get(`/srs_status/${projectKey}`, { timeout: 8000 });
                const enhancedUrl = statusRes?.data?.enhanced_download_url || statusRes?.data?.full_download_url;
                if (enhancedUrl) {
                    const res = await axios.get(enhancedUrl, { responseType: 'blob', timeout: 300000 });
                    setHqDownloadUrl(enhancedUrl);
                    return res.data;
                }
                return null;
            };

            // Prefer enhanced background version first
            let hqFile = await tryDownloadEnhanced();
            if (!hqFile) {
                setHqStatus('Enhanced version is still building. Retrying in the background...');
                for (let i = 0; i < 20; i++) {
                    await new Promise((r) => setTimeout(r, 5000));
                    hqFile = await tryDownloadEnhanced();
                    if (hqFile) break;
                }
            }

            if (!hqFile) {
                // Fallback: request full build if enhanced isn't ready yet.
                setHqStatus('Enhanced build not ready. Generating full quality now...');
                const { data } = await axios.post('/generate_srs?mode=full', payload, { timeout: 300000 });
                if (!data?.download_url) {
                    throw new Error('High quality document URL not returned.');
                }
                const res = await axios.get(data.download_url, { responseType: 'blob', timeout: 300000 });
                setHqDownloadUrl(data.download_url);
                hqFile = res.data;
            }

            const projectName = (formData.projectName || "Enterprise_SRS").replace(/[^a-zA-Z0-9-_]/g, '_');
            setHqBlob(hqFile);
            saveAs(hqFile, `${projectName}_Enterprise_SRS_HQ.docx`);
            setHqStatus('High quality document generated and downloaded.');
        } catch (err) {
            const msg = err?.response?.data?.detail || err?.message || 'Failed to generate high quality document.';
            setHqStatus(msg);
        } finally {
            setHqLoading(false);
        }
    };



    return (
        <div className="min-h-screen bg-black flex flex-col font-mono">
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

            {/* Main Content Area */}
            <div className="flex-1 flex items-center justify-center p-10">

                {!complete && !error ? (
                    <div className="w-full max-w-2xl text-center">
                        <motion.div
                            initial={{ scale: 0.8, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            className="mb-10 relative"
                        >
                            <div className="w-32 h-32 border-4 border-t-neon-blue border-r-neon-purple border-b-neon-green border-l-transparent rounded-full mx-auto animate-spin"></div>
                            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-white font-bold text-xl">
                                {progress}%
                            </div>
                        </motion.div>

                        <h2 className="text-2xl text-neon-blue mb-4 animate-pulse">{status}</h2>
                        {recovering && (
                            <p className="text-yellow-300 mb-3">Recovery mode: waiting for server file and auto-download...</p>
                        )}
                        <div className="text-gray-300 mb-2">Target: less than 1 minute</div>
                        <div className="text-neon-green mb-6">Watch: 00:{String(secondsLeft).padStart(2, '0')}</div>

                        <div className="w-full bg-gray-900 rounded-full h-4 border border-gray-700 overflow-hidden">
                            <motion.div
                                className="h-full bg-gradient-to-r from-neon-blue to-neon-purple"
                                style={{ width: `${progress}%` }}
                            ></motion.div>
                        </div>
                    </div>
                ) : error ? (
                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-center bg-[#11151c] border border-[#2b3137] p-10 rounded-2xl shadow-[0_30px_80px_rgba(0,0,0,0.45)]"
                    >
                        <div className="mx-auto mb-6 w-16 h-16 rounded-2xl bg-[#1b1f23] border border-[#2b3137] flex items-center justify-center">
                            <XCircle className="text-[#d97762]" size={30} />
                        </div>
                        <h1 className="text-4xl font-semibold text-[#f5f1e8] mb-4">Generation Failed</h1>
                        <p className="text-[#b3bbc2] mb-8 max-w-lg mx-auto">
                            {error}
                        </p>

                        <div className="flex gap-4 justify-center">
                            <button
                                onClick={() => navigate('/enterprise/form')}
                                className="bg-[#3a7ca5] text-[#0e1116] font-semibold px-8 py-4 rounded-lg hover:bg-[#2e6b90] transition"
                            >
                                Back to Form
                            </button>
                            <button
                                onClick={() => navigate('/dashboard')}
                                className="border border-[#3b434b] text-[#b3bbc2] px-8 py-4 rounded-lg hover:bg-[#1b1f23] transition"
                            >
                                Return to Dashboard
                            </button>
                        </div>
                    </motion.div>
                ) : (
                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-center bg-[#11151c] border border-[#2b3137] p-10 rounded-2xl shadow-[0_30px_80px_rgba(0,0,0,0.45)]"
                    >
                        <div className="mx-auto mb-6 w-16 h-16 rounded-2xl bg-[#1b1f23] border border-[#2b3137] flex items-center justify-center">
                            <CheckCircle2 className="text-[#55b38b]" size={30} />
                        </div>
                        <h1 className="text-4xl font-semibold text-[#f5f1e8] mb-4">Documentation Ready</h1>
                        <p className="text-[#b3bbc2] mb-8 max-w-lg mx-auto">
                            Your Enterprise SRS document has been generated and downloaded.
                        </p>
                        {hqStatus && (
                            <p className="text-[#7fb3d4] mb-6 max-w-lg mx-auto">{hqStatus}</p>
                        )}

                        <div className="flex flex-wrap gap-4 justify-center">
                            <button
                                onClick={() => {
                                    if (generatedBlob) {
                                        const projectName = (formData.projectName || "Enterprise_SRS").replace(/[^a-zA-Z0-9-_]/g, '_');
                                        saveAs(generatedBlob, `${projectName}_Enterprise_SRS.docx`);
                                        return;
                                    }
                                    if (downloadUrl) {
                                        const projectName = (formData.projectName || "Enterprise_SRS").replace(/[^a-zA-Z0-9-_]/g, '_');
                                        axios.get(downloadUrl, { responseType: 'blob' })
                                            .then(res => {
                                                setGeneratedBlob(res.data);
                                                saveAs(res.data, `${projectName}_Enterprise_SRS.docx`);
                                            })
                                            .catch(() => {
                                                setError('Failed to download document. Please regenerate.');
                                            });
                                    }
                                }}
                                className="bg-[#55b38b] text-[#0e1116] font-semibold px-8 py-3 rounded-lg hover:bg-[#4aa37d] transition w-full max-w-sm flex items-center justify-center gap-2"
                                id="manual-download-btn"
                            >
                                <Download size={16} /> Download Final
                            </button>
                            <button
                                onClick={handleGenerateHighQuality}
                                disabled={hqLoading}
                                className={`font-bold px-8 py-3 rounded-lg transition w-full max-w-sm flex items-center justify-center gap-2 ${hqLoading
                                    ? 'bg-[#2b3137] text-[#8e98a0] cursor-not-allowed'
                                    : 'bg-[#3a7ca5] text-[#0e1116] hover:bg-[#2e6b90]'
                                    }`}
                            >
                                <Sparkles size={16} /> {hqLoading ? 'Generating HQ...' : 'Generate High Quality'}
                            </button>
                            {hqBlob && (
                                <button
                                    onClick={() => {
                                        const projectName = (formData.projectName || "Enterprise_SRS").replace(/[^a-zA-Z0-9-_]/g, '_');
                                        if (hqBlob) {
                                            saveAs(hqBlob, `${projectName}_Enterprise_SRS_HQ.docx`);
                                            return;
                                        }
                                        if (hqDownloadUrl) {
                                            axios.get(hqDownloadUrl, { responseType: 'blob' })
                                                .then(res => {
                                                    setHqBlob(res.data);
                                                    saveAs(res.data, `${projectName}_Enterprise_SRS_HQ.docx`);
                                                })
                                                .catch(() => {
                                                    setHqStatus('Failed to re-download HQ file. Please generate again.');
                                                });
                                        }
                                    }}
                                    className="bg-[#c58a62] text-[#0e1116] font-semibold px-8 py-3 rounded-lg hover:bg-[#b87852] transition w-full max-w-sm flex items-center justify-center gap-2"
                                >
                                    <Download size={16} /> Download HQ Again
                                </button>
                            )}
                            <button
                                onClick={() => navigate('/enterprise/form')}
                                className="bg-[#1b1f23] text-[#f5f1e8] font-semibold px-8 py-4 rounded-lg border border-[#2b3137] hover:bg-[#232a31] transition"
                            >
                                Generate Another
                            </button>
                            <button
                                onClick={async () => {
                                    console.log("Open in Studio clicked");
                                    if (!formData) {
                                        console.error("No formData found");
                                        setError("Session data missing. Cannot create project.");
                                        return;
                                    }

                                    setStudioLoading(true);
                                    try {
                                        const projectName = formData.projectName || "Untitled Project";
                                        const coreFeaturesList = toList(formData.coreFeatures);
                                        const featureBlock = coreFeaturesList.length
                                            ? `- ${coreFeaturesList.join('\n- ')}`
                                            : "N/A";
                                        const initialMarkdown = `# ${projectName} - SRS Notes\n\n**Problem Statement:**\n${formData.problemStatement || "N/A"}\n\n**Core Features:**\n${featureBlock}\n\n**User Flow:**\n${formData.userFlow || "N/A"}`;

                                        // Use the best available URL
                                        const finalDocUrl = hqDownloadUrl || downloadUrl || null;
                                        console.log("Creating project with docUrl:", finalDocUrl);

                                        const res = await axios.post('/api/project/create', {
                                            name: projectName,
                                            content: initialMarkdown,
                                            documentUrl: finalDocUrl
                                        });
                                        console.log("Project created:", res.data);
                                        if (res.data.id) {
                                            navigate(`/studio/${res.data.id}`);
                                        } else {
                                            throw new Error("No project ID returned");
                                        }
                                    } catch (e) {
                                        console.error("Failed to create studio project", e);
                                        setError(`Failed to open Studio: ${e.response?.data?.detail || e.message}`);
                                    } finally {
                                        setStudioLoading(false);
                                    }
                                }}
                                disabled={studioLoading}
                                className={`bg-[#a371f7] text-white font-bold px-8 py-4 rounded-lg hover:bg-[#8957e5] transition border border-[#a371f7] shadow-[0_0_15px_rgba(163,113,247,0.3)] flex items-center justify-center gap-2 ${studioLoading ? 'opacity-70 cursor-wait' : ''}`}
                            >
                                {studioLoading ? (
                                    <>
                                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                        Creating Workspace...
                                    </>
                                ) : (
                                    <>
                                        <Sparkles size={16} /> Open in DocuVerse Studio
                                    </>
                                )}
                            </button>
                            <button
                                onClick={() => navigate('/dashboard')}
                                className="border border-[#3b434b] text-[#b3bbc2] px-8 py-4 rounded-lg hover:bg-[#1b1f23] transition"
                            >
                                Return to Dashboard
                            </button>
                        </div>
                    </motion.div>
                )}
            </div>

            {/* Profile Modal */}
            {showProfile && <ProfileSettings onClose={() => setShowProfile(false)} />}
        </div>
    );
};

export default EnterpriseGeneration;
