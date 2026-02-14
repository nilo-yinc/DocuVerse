import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import { CheckCircle, XCircle, FileText, AlertCircle, Download, Send } from 'lucide-react';

const ClientReview = () => {
    const { id } = useParams();
    const [project, setProject] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [action, setAction] = useState(null); // 'APPROVE' | 'REQUEST_CHANGES' | 'SUCCESS'
    const [feedback, setFeedback] = useState('');
    const [submitting, setSubmitting] = useState(false);

    // Dynamic API base URL based on environment
    const apiBase = import.meta.env.VITE_API_URL || 'https://docuverse-node.onrender.com';

    useEffect(() => {
        fetchProject();
    }, [id]);

    const fetchProject = async () => {
        try {
            const res = await axios.get(`${apiBase}/api/projects/${id}/public-review`);
            setProject(res.data);
            setLoading(false);
        } catch (err) {
            console.error(err);
            setError('Project not found or link has expired.');
            setLoading(false);
        }
    };

    const handleSubmit = async (status) => {
        if (status === 'CHANGES_REQUESTED' && !feedback.trim()) {
            alert('Please provide feedback for the changes required.');
            return;
        }

        setSubmitting(true);
        try {
            await axios.post(`${apiBase}/api/projects/${id}/submit-review`, {
                status,
                feedback: status === 'CHANGES_REQUESTED' ? feedback : 'Approved by client.'
            });
            setAction('SUCCESS');
            fetchProject(); // Refresh status
        } catch (err) {
            console.error(err);
            alert('Failed to submit review. Please try again.');
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) return (
        <div className="min-h-screen bg-[#0d1117] flex items-center justify-center text-white">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#22d3ee]"></div>
        </div>
    );

    if (error) return (
        <div className="min-h-screen bg-[#0d1117] flex items-center justify-center text-white p-4">
            <div className="max-w-md w-full bg-[#161b22] border border-[#30363d] rounded-xl p-8 text-center">
                <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
                <h2 className="text-xl font-bold mb-2">Unavailable</h2>
                <p className="text-[#8b949e]">{error}</p>
            </div>
        </div>
    );

    if (action === 'SUCCESS' || project.status === 'APPROVED') return (
        <div className="min-h-screen bg-[#0d1117] flex items-center justify-center text-white p-4">
            <div className="max-w-md w-full bg-[#161b22] border border-[#30363d] rounded-xl p-8 text-center">
                <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-6" />
                <h2 className="text-2xl font-bold mb-2">Thank You!</h2>
                <p className="text-[#8b949e]">
                    The project <strong>{project.title}</strong> has been {project.status === 'APPROVED' ? 'approved' : 'reviewed'}.
                    <br />The team has been notified.
                </p>
            </div>
        </div>
    );

    return (
        <div className="min-h-screen bg-[#0d1117] text-[#e6edf3] font-sans selection:bg-[#22d3ee] selection:text-[#0d1117]">
            {/* Header */}
            <header className="border-b border-[#30363d] bg-[#161b22]/50 backdrop-blur-md sticky top-0 z-10">
                <div className="max-w-3xl mx-auto px-6 h-16 flex items-center">
                    <div className="w-8 h-8 rounded bg-[#0a0a0a] border border-white/10 flex items-center justify-center mr-3 font-mono font-bold">
                        <span className="text-[#22d3ee] mr-0.5">&gt;</span>_
                    </div>
                    <div className="font-bold text-lg tracking-tight">DocuVerse Studio</div>
                </div>
            </header>

            <main className="max-w-3xl mx-auto px-6 py-12">
                <div className="mb-8">
                    <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-[#1f6feb]/10 border border-[#1f6feb]/20 text-[#2f81f7] text-xs font-bold uppercase tracking-wider mb-4">
                        Review Stage
                    </div>
                    <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight mb-4">
                        {project.title}
                    </h1>
                    <p className="text-[#8b949e] text-lg leading-relaxed">
                        Please review the attached Software Requirements Specification (SRS) document below. You can approve it directly or request specific changes.
                    </p>
                </div>

                {/* Document Card */}
                <div className="bg-[#161b22] border border-[#30363d] rounded-xl p-6 mb-8 hover:border-[#8b949e]/50 transition-colors group">
                    <div className="flex items-start justify-between">
                        <div className="flex items-start space-x-4">
                            <div className="p-3 bg-[#0d1117] border border-[#30363d] rounded-lg group-hover:border-[#22d3ee]/30 transition-colors">
                                <FileText className="w-8 h-8 text-[#22d3ee]" />
                            </div>
                            <div>
                                <h3 className="font-bold text-lg mb-1">SRS_Document.docx</h3>
                                <p className="text-[#8b949e] text-sm">Latest version generated for review</p>
                            </div>
                        </div>
                        <a
                            href={project.documentUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center space-x-2 px-4 py-2 bg-[#238636] hover:bg-[#2ea043] text-white rounded-lg font-semibold transition-all shadow-lg hover:shadow-green-900/20"
                        >
                            <Download className="w-4 h-4" />
                            <span>Download</span>
                        </a>
                    </div>
                </div>

                {/* Action Area */}
                {action === 'REQUEST_CHANGES' ? (
                    <div className="bg-[#161b22] border border-[#30363d] rounded-xl p-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
                        <h3 className="font-bold text-lg mb-4 flex items-center">
                            <span className="w-2 h-8 bg-red-500 rounded-full mr-3"></span>
                            Request Changes
                        </h3>
                        <textarea
                            className="w-full bg-[#0d1117] border border-[#30363d] rounded-lg p-4 text-[#e6edf3] focus:ring-2 focus:ring-[#22d3ee] focus:border-transparent outline-none min-h-[150px] mb-4 placeholder-[#8b949e]"
                            placeholder="Describe the changes you'd like to see..."
                            value={feedback}
                            onChange={(e) => setFeedback(e.target.value)}
                            disabled={submitting}
                        ></textarea>
                        <div className="flex justify-end space-x-3">
                            <button
                                onClick={() => setAction(null)}
                                className="px-5 py-2.5 text-[#e6edf3] hover:bg-[#30363d] rounded-lg font-semibold transition-colors disabled:opacity-50"
                                disabled={submitting}
                            >
                                Cancel
                            </button>
                            <button
                                onClick={() => handleSubmit('CHANGES_REQUESTED')}
                                className="flex items-center space-x-2 px-5 py-2.5 bg-red-600 hover:bg-red-500 text-white rounded-lg font-semibold transition-all shadow-lg hover:shadow-red-900/20 disabled:opacity-50 disabled:cursor-not-allowed"
                                disabled={submitting || !feedback.trim()}
                            >
                                {submitting ? (
                                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                ) : (
                                    <Send className="w-4 h-4" />
                                )}
                                <span>Submit Feedback</span>
                            </button>
                        </div>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <button
                            onClick={() => handleSubmit('APPROVED')}
                            className="flex items-center justify-center space-x-3 p-6 bg-[#161b22] border border-[#238636]/30 hover:border-[#238636] hover:bg-[#238636]/10 rounded-xl transition-all group"
                        >
                            <div className="p-3 bg-[#238636]/10 rounded-full group-hover:bg-[#238636] transition-colors">
                                <CheckCircle className="w-8 h-8 text-[#238636] group-hover:text-white" />
                            </div>
                            <div className="text-left">
                                <div className="font-bold text-lg text-[#e6edf3]">Approve Document</div>
                                <div className="text-[#8b949e] text-sm group-hover:text-[#c9d1d9]">No changes needed</div>
                            </div>
                        </button>

                        <button
                            onClick={() => setAction('REQUEST_CHANGES')}
                            className="flex items-center justify-center space-x-3 p-6 bg-[#161b22] border border-[#da3633]/30 hover:border-[#da3633] hover:bg-[#da3633]/10 rounded-xl transition-all group"
                        >
                            <div className="p-3 bg-[#da3633]/10 rounded-full group-hover:bg-[#da3633] transition-colors">
                                <XCircle className="w-8 h-8 text-[#da3633] group-hover:text-white" />
                            </div>
                            <div className="text-left">
                                <div className="font-bold text-lg text-[#e6edf3]">Request Changes</div>
                                <div className="text-[#8b949e] text-sm group-hover:text-[#c9d1d9]">Provide feedback</div>
                            </div>
                        </button>
                    </div>
                )}
            </main>
        </div>
    );
};

export default ClientReview;
