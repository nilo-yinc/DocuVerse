import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import IntegratedNotebook from '../components/home/IntegratedNotebook';
import { ArrowLeft } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const buildMarkdownFromEnterpriseData = (enterpriseData) => {
    if (!enterpriseData) return "# New Project\n\nNo content yet.";
    const pi = enterpriseData.project_identity || {};
    const fs = enterpriseData.functional_scope || {};
    const nfr = enterpriseData.non_functional_requirements || {};
    const sc = enterpriseData.system_context || {};
    const sec = enterpriseData.security_and_compliance || {};
    const tech = enterpriseData.technical_preferences || {};

    const lines = [
        `# ${pi.project_name || 'System Requirements'}`,
        '',
        `**Problem Statement:**`,
        pi.problem_statement || 'Not specified.',
        '',
        `**Target Users:**`,
        (pi.target_users || []).join(', ') || 'Not specified.',
        '',
        `**Domain:** ${sc.domain || 'Not specified.'}`,
        `**Application Type:** ${sc.application_type || 'Not specified.'}`,
        '',
        `**Core Features:**`,
        ...(fs.core_features || ['Not specified.']).map(f => `- ${f}`),
        '',
        `**Primary User Flow:**`,
        fs.primary_user_flow || 'Not specified.',
        '',
        `**Non-Functional Requirements:**`,
        `- Expected Scale: ${nfr.expected_user_scale || 'Not specified.'}`,
        `- Performance: ${nfr.performance_expectation || 'Not specified.'}`,
        '',
        `**Security & Compliance:**`,
        `- Authentication Required: ${sec.authentication_required ? 'Yes' : 'No'}`,
        `- Sensitive Data Handling: ${sec.sensitive_data_handling ? 'Yes' : 'No'}`,
        `- Compliance: ${(sec.compliance_requirements || []).join(', ') || 'None'}`,
        '',
        `**Technical Preferences:**`,
        `- Backend: ${tech.preferred_backend || 'No preference'}`,
        `- Database: ${tech.database_preference || 'No preference'}`,
        `- Deployment: ${tech.deployment_preference || 'No preference'}`
    ];

    return lines.join('\n');
};

const buildQuickDocUrl = (projectTitle) => {
    if (!projectTitle) return null;
    const safe = projectTitle.replace(/[^a-zA-Z0-9_-]+/g, '_').replace(/^_+|_+$/g, '') || 'Project';
    return `/download_srs/${safe}_SRS_quick.docx`;
};

const StudioPage = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [project, setProject] = useState(null);
    const [loading, setLoading] = useState(true);
    const { user, token } = useAuth();

    useEffect(() => {
        const fetchProject = async () => {
            if (id === 'demo') {
                setProject({
                    id: 'demo',
                    name: 'Demo Project',
                    contentMarkdown: "# Demo SRS\n\nThis is a demo project.",
                    status: 'DRAFT',
                    documentUrl: null,
                    reviewFeedback: [],
                    workflowEvents: [],
                    insights: []
                });
                setLoading(false);
                return;
            }

            try {
                const nodeApiBase = import.meta.env.VITE_NODE_API_URL
                    || (typeof window !== 'undefined' ? `http://${window.location.hostname || 'localhost'}:5000` : 'http://localhost:5000');
                const res = await axios.get(`${nodeApiBase}/api/projects/${id}`, {
                    headers: token ? { Authorization: `Bearer ${token}` } : {}
                });
                const data = res.data;
                const derivedMarkdown = buildMarkdownFromEnterpriseData(data.enterpriseData);
                if (!data.contentMarkdown && token) {
                    try {
                        await axios.put(`${nodeApiBase}/api/projects/${id}`, { contentMarkdown: derivedMarkdown }, {
                            headers: { Authorization: `Bearer ${token}` }
                        });
                    } catch {
                        // ignore
                    }
                }
                const derivedDocUrl = data.documentUrl || buildQuickDocUrl(data.title);
                const normalizedDocUrl = (derivedDocUrl && derivedDocUrl.startsWith('/download_srs/'))
                    ? `${nodeApiBase}${derivedDocUrl}`
                    : derivedDocUrl;
                setProject({
                    id: data._id,
                    name: data.title,
                    contentMarkdown: data.contentMarkdown || derivedMarkdown,
                    status: data.status || 'DRAFT',
                    documentUrl: normalizedDocUrl,
                    reviewFeedback: data.reviewFeedback || [],
                    workflowEvents: data.workflowEvents || [],
                    insights: data.insights || [],
                    clientEmail: data.clientEmail || "",
                    enterpriseFormData: data.enterpriseFormData || {}
                });
            } catch (error) {
                console.error("Failed to load project", error);
            } finally {
                setLoading(false);
            }
        };
        fetchProject();
    }, [id]);

    useEffect(() => {
        if (!project || !id) return;
        const interval = setInterval(async () => {
            try {
                const nodeApiBase = import.meta.env.VITE_NODE_API_URL
                    || (typeof window !== 'undefined' ? `http://${window.location.hostname || 'localhost'}:5000` : 'http://localhost:5000');
                const res = await axios.get(`${nodeApiBase}/api/projects/${id}`, {
                    headers: token ? { Authorization: `Bearer ${token}` } : {}
                });
                const data = res.data;
                setProject(prev => ({
                    ...prev,
                    status: data.status,
                    reviewFeedback: data.reviewFeedback,
                    workflowEvents: data.workflowEvents,
                    documentUrl: data.documentUrl || prev.documentUrl
                }));
            } catch (error) {
                console.error("Failed to refresh project", error);
            }
        }, 5000);
        return () => clearInterval(interval);
    }, [project, id, token]);

    if (loading) return (
        <div className="min-h-screen bg-[#0d1117] flex items-center justify-center text-[#8b949e]">
            Loading Studio...
        </div>
    );

    if (!project) return (
        <div className="min-h-screen bg-[#0d1117] flex items-center justify-center text-[#ff7b72]">
            Project not found.
        </div>
    );

    return (
        <div className="min-h-screen bg-[#0d1117] flex flex-col">
            {/* Studio Header */}
            <div className="h-14 border-b border-[#30363d] bg-[#161b22] flex items-center px-4 justify-between">
                <div className="flex items-center gap-4">
                    <button onClick={() => navigate('/dashboard')} className="text-[#8b949e] hover:text-white transition">
                        <ArrowLeft size={20} />
                    </button>
                    <div>
                        <h1 className="text-white font-bold text-sm">{project.name}</h1>
                        <span className="text-xs text-[#8b949e] font-mono">ID: {project.id.substring(0, 8)}...</span>
                    </div>
                </div>
                <div className="flex gap-2">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-bold border 
                        ${project.status === 'APPROVED' ? 'bg-green-900/20 text-green-400 border-green-900' :
                            project.status === 'IN_REVIEW' ? 'bg-yellow-900/20 text-yellow-400 border-yellow-900' :
                                'bg-gray-800 text-gray-400 border-gray-700'}`}>
                        {project.status}
                    </span>
                </div>
            </div>

            {/* Main Content */}
            <IntegratedNotebook
                initialContent={project.contentMarkdown}
                projectId={project.id}
                projectName={project.name}
                currentUserEmail={user?.email}
                initialStatus={project.status}
                initialFeedback={project.reviewFeedback || []}
                workflowEvents={project.workflowEvents || []}
                documentUrl={project.documentUrl}
                reviewedDocumentUrl={project.reviewedDocumentUrl}
                initialClientEmail={project.clientEmail}
                enterpriseFormData={project.enterpriseFormData}
            />
        </div>
    );
};

export default StudioPage;
