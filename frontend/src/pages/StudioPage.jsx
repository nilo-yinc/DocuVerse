import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import IntegratedNotebook from '../components/home/IntegratedNotebook';
import { ArrowLeft } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const StudioPage = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [project, setProject] = useState(null);
    const [loading, setLoading] = useState(true);
    const { user } = useAuth();

    useEffect(() => {
        const fetchProject = async () => {
            // If ID is 'demo', use mock data or redirect
            if (id === 'demo') {
                setProject({
                    id: 'demo',
                    name: 'Demo Project',
                    contentMarkdown: "# Demo SRS\n\nThis is a demo project."
                });
                setLoading(false);
                return;
            }

            try {
                const res = await axios.get(`/api/project/${id}`);
                setProject(res.data);
            } catch (error) {
                console.error("Failed to load project", error);
            } finally {
                setLoading(false);
            }
        };
        fetchProject();
    }, [id]);

    useEffect(() => {
        if (!project || (project.status !== 'IN_REVIEW' && project.status !== 'CHANGES_REQUESTED')) return;
        const interval = setInterval(async () => {
            try {
                const res = await axios.get(`/api/project/${id}`);
                setProject(res.data);
            } catch (error) {
                console.error("Failed to refresh project", error);
            }
        }, 5000);
        return () => clearInterval(interval);
    }, [project, id]);

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
            />
        </div>
    );
};

export default StudioPage;
