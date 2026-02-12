const express = require('express');
const router = express.Router();
const isLoggedIn = require('../middlewares/isLoggedIn.middleware');
const Project = require('../models/Project');
const axios = require('axios');
const { GoogleGenerativeAI } = require("@google/generative-ai");
const n8nWebhookService = require('../services/n8n-webhook.service');

// Initialize Gemini
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// Generate short unique shareId
const generateShareId = () => require('crypto').randomBytes(6).toString('hex');

const buildMarkdownFromSrsRequest = (srsRequest) => {
    if (!srsRequest) return "# System Requirements\n\nStart typing...";
    const pi = srsRequest.project_identity || {};
    const fs = srsRequest.functional_scope || {};
    const nfr = srsRequest.non_functional_requirements || {};
    const sc = srsRequest.system_context || {};
    const sec = srsRequest.security_and_compliance || {};
    const tech = srsRequest.technical_preferences || {};

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

// @route   POST /api/projects/save
// @desc    Create or Update a project
// @access  Private
// @route   PUT /api/projects/:id
// @desc    Update project content
// @access  Private
router.put('/:id', isLoggedIn, async (req, res) => {
    try {
        const {
            contentMarkdown,
            status,
            title,
            documentUrl,
            reviewedDocumentUrl,
            reviewFeedback,
            workflowEvents,
            insights,
            clientEmail
        } = req.body;
        const project = await Project.findById(req.params.id);
        
        if (!project) return res.status(404).json({ msg: 'Project not found' });
        if (project.userId.toString() !== req.user.id) return res.status(401).json({ msg: 'Not authorized' });

        if (contentMarkdown !== undefined) project.contentMarkdown = contentMarkdown;
        if (status !== undefined) project.status = status;
        if (title !== undefined) project.title = title;
        if (documentUrl !== undefined) project.documentUrl = documentUrl;
        if (reviewedDocumentUrl !== undefined) project.reviewedDocumentUrl = reviewedDocumentUrl;
        if (reviewFeedback !== undefined) project.reviewFeedback = reviewFeedback;
        if (workflowEvents !== undefined) project.workflowEvents = workflowEvents;
        if (insights !== undefined) project.insights = insights;
        if (clientEmail !== undefined) project.clientEmail = clientEmail;

        await project.save();
        res.json(project);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

router.post('/save', isLoggedIn, async (req, res) => {
    try {
        const { title, domain, teamMembers, techStack, cocomo, diagrams, projectId, isPublic } = req.body;
        
        let project;
        if (projectId) {
            project = await Project.findById(projectId);
            if (!project) return res.status(404).json({ msg: 'Project not found' });
            if (project.userId.toString() !== req.user.id) return res.status(401).json({ msg: 'Not authorized' });

            project.title = title || project.title;
            project.domain = domain || project.domain;
            project.teamMembers = teamMembers || project.teamMembers;
            project.techStack = techStack || project.techStack;
            project.cocomo = cocomo || project.cocomo;
            project.diagrams = diagrams || project.diagrams;
            if (typeof isPublic === 'boolean') project.isPublic = isPublic;
        } else {
            let shareId = generateShareId();
            while (await Project.findOne({ shareId })) shareId = generateShareId();
            project = new Project({
                userId: req.user.id,
                title,
                domain,
                teamMembers,
                techStack,
                cocomo,
                diagrams,
                shareId
            });
        }

        await project.save();
        
        // Send webhook notification to n8n
        await n8nWebhookService.notifyProjectCreated(project);
        
        res.json(project);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route   POST /api/projects/generate-prototype
// @desc    Generate HTML/JS prototype using Gemini
// @access  Private
router.post('/generate-prototype', isLoggedIn, async (req, res) => {
    try {
        const { projectId, features, themeColor } = req.body;
        const project = await Project.findById(projectId);
        
        if (!project) return res.status(404).json({ msg: 'Project not found' });
        if (project.userId.toString() !== req.user.id) return res.status(401).json({ msg: 'Not authorized' });

        const model = genAI.getGenerativeModel({ model: "gemini-pro" });
        const prompt = `Generate a single-file HTML/JS responsive landing page for a '${project.title}'. Use Tailwind CSS via CDN. Features to include: ${features}. Color theme: ${themeColor}. Return ONLY raw HTML code. Do not use markdown blocks.`;

        const result = await model.generateContent(prompt);
        const response = await result.response;
        let text = response.text();
        
        // Sanitize
        text = text.replace(/```html/g, '').replace(/```/g, '');

        project.prototypeHtml = text;
        project.hasPrototype = true;
        await project.save();
        
        // Send webhook notification
        await n8nWebhookService.notifyPrototypeGenerated(projectId, `/demo/${projectId}`);

        res.json({ prototypeHtml: text });
    } catch (err) {
        console.error(err);
        res.status(500).send('AI Generation Error');
    }
});

// @route   POST /api/projects/enterprise/generate
// @desc    Generate Enterprise SRS via Python Backend
// @access  Private
router.post('/enterprise/generate', isLoggedIn, async (req, res) => {
    try {
        const { formData, projectId: bodyProjectId, mode = 'quick' } = req.body;
        
        // 1. Map frontend formData to Python Backend SRSRequest Schema
        const safePerformance = formData.performance || '';
        const safeUserScale = formData.userScale || '';
        const safeDetailLevel = formData.detailLevel || '';
        const srsRequest = {
            project_identity: {
                project_name: formData.projectName || 'Untitled Project',
                author: formData.authors ? formData.authors.split('\n').filter(Boolean) : ['Unknown'],
                organization: formData.organization || 'Unspecified',
                problem_statement: formData.problemStatement || 'No problem statement provided.',
                target_users: (formData.targetUsers && formData.targetUsers.length > 0) ? formData.targetUsers : ['End User']
            },
            system_context: {
                application_type: (formData.appType === 'Other' && formData.appType_other) ? formData.appType_other : (formData.appType || 'Web Application'),
                domain: (formData.domain === 'Other' && formData.domain_other) ? formData.domain_other : (formData.domain || 'General')
            },
            functional_scope: {
                core_features: formData.coreFeatures ? formData.coreFeatures.split('\n').filter(Boolean) : ['Default Feature'],
                primary_user_flow: formData.userFlow || 'Standard user flow.'
            },
            non_functional_requirements: {
                expected_user_scale: (safeUserScale === 'Other' && formData.userScale_other) ? formData.userScale_other :
                                   safeUserScale === '< 100 Users' ? '<100' :
                                   safeUserScale === '100 - 1,000 Users' ? '100-1k' :
                                   safeUserScale === '1,000 - 10,000 Users' ? '1k-100k' : 
                                   safeUserScale === '10,000+ Users' ? '>100k' : safeUserScale,
                performance_expectation: (safePerformance === 'Other' && formData.performance_other) ? formData.performance_other :
                                       safePerformance.includes('Standard') ? 'Normal' :
                                       safePerformance.includes('High') ? 'High' : 
                                       safePerformance === 'Real-time (ms latency)' ? 'Real-time' : safePerformance
            },
            security_and_compliance: {
                authentication_required: formData.authRequired === 'Yes',
                sensitive_data_handling: formData.sensitiveData === 'Yes',
                compliance_requirements: formData.compliance || []
            },
            technical_preferences: {
                preferred_backend: (formData.backendPref === 'Other' && formData.backendPref_other) ? formData.backendPref_other : (formData.backendPref !== 'No Preference' ? formData.backendPref : null),
                database_preference: (formData.dbPref === 'Other' && formData.dbPref_other) ? formData.dbPref_other : (formData.dbPref !== 'No Preference' ? formData.dbPref : null),
                deployment_preference: (formData.deploymentPref === 'Other' && formData.deploymentPref_other) ? formData.deploymentPref_other : (formData.deploymentPref !== 'No Preference' ? formData.deploymentPref : null)
            },
            output_control: {
                // Map frontend "Standard", "Professional", "Brief" to backend valid levels
                srs_detail_level: safeDetailLevel.includes('Professional') ? 'Enterprise-grade' :
                                safeDetailLevel.includes('Standard') ? 'Technical' : 'High-level',
                additional_instructions: formData.additionalInstructions || ''
            }
        };
        console.log("DEBUG: srsRequest constructed:", JSON.stringify(srsRequest, null, 2));

        // 2. Save Project Reference FIRST to generate ID and Link
        let resolvedProjectId = bodyProjectId || formData.projectId;
        if (resolvedProjectId === 'null' || resolvedProjectId === 'undefined' || !resolvedProjectId) {
            resolvedProjectId = null;
        }
        
        let project;
        if (resolvedProjectId) {
            project = await Project.findById(resolvedProjectId);
            if (!project) return res.status(404).json({ msg: 'Project not found' });
            if (project.userId.toString() !== req.user.id) return res.status(401).json({ msg: 'Not authorized' });
            const normalizedDomain = (formData.domain === 'Other' && formData.domain_other) ? formData.domain_other : (formData.domain || 'General');
            project.title = formData.projectName || 'Untitled Project';
            project.domain = normalizedDomain;
            project.techStack = {
                backend: (formData.backendPref === 'Other' && formData.backendPref_other) ? formData.backendPref_other : formData.backendPref,
                database: (formData.dbPref === 'Other' && formData.dbPref_other) ? formData.dbPref_other : formData.dbPref
            };
            project.enterpriseData = srsRequest;
            project.enterpriseFormData = formData;
            project.status = 'DRAFT';
            project.workflowEvents = project.workflowEvents || [];
            project.workflowEvents.push({
                date: new Date().toISOString(),
                title: 'Document Regenerated',
                description: `SRS updated/regenerated with new inputs or feedback in ${mode} mode.`,
                status: 'DRAFT'
            });
        } else {
            let shareId = generateShareId();
            while (await Project.findOne({ shareId })) shareId = generateShareId();

            const normalizedDomain = (formData.domain === 'Other' && formData.domain_other) ? formData.domain_other : (formData.domain || 'General');
            project = new Project({
                userId: req.user.id,
                title: formData.projectName || 'Untitled Project',
                domain: normalizedDomain,
                enterpriseData: srsRequest,
                enterpriseFormData: formData,
                shareId: shareId,
                status: 'DRAFT',
                workflowEvents: [{
                    date: new Date().toISOString(),
                    title: 'Project Created',
                    description: 'Draft initialized via Enterprise Wizard.',
                    status: 'DRAFT'
                }]
            });
        }
        await project.save();

        // 3. Inject Live Link and ID into SRS Request
        srsRequest.project_identity.live_link = `https://docuverse.app/demo/${project._id}`;
        srsRequest.project_identity.project_id = project._id.toString();

        // 4. Call Python Backend (with expanded data)
        // Pass mode=quick by default to match the frontend expectation and performance
        const pythonResponse = await axios.post(`http://127.0.0.1:8000/generate_srs?mode=${mode}`, srsRequest);
        const downloadUrl = pythonResponse.data.download_url;

        // 4b. Save document URL + initial requirements markdown to project
        if (project.documentUrl && project.documentUrl !== downloadUrl) {
            project.reviewedDocumentUrl = project.documentUrl;
        }
        project.documentUrl = downloadUrl;
        project.contentMarkdown = buildMarkdownFromSrsRequest(srsRequest);
        await project.save();
        
        // 5. Send webhook notification
        await n8nWebhookService.notifySRSGenerated({
            ...project.toObject(),
            srsDocumentPath: downloadUrl,
            downloadUrl: downloadUrl
        });
        
        // 6. Return Download URL and Project ID
        // The Python backend returns a relative download_url like /download_srs/Filename.docx
        res.json({ 
            srs_document_path: downloadUrl,
            projectId: project._id 
        });

    } catch (err) {
        console.error("Enterprise Generation Error:", err.message);
        if (err.response) {
            console.error("Python Backend Error:", err.response.data);
            return res.status(500).json({ msg: 'Generation Engine Failed', details: err.response.data });
        }
        res.status(500).json({ msg: err.message || 'Server Error' });
    }
});

// @route   GET /api/projects/:id
// @desc    Get project by ID
// @access  Private
router.get('/:id', isLoggedIn, async (req, res) => {
    try {
        const project = await Project.findById(req.params.id);
        if (!project) return res.status(404).json({ msg: 'Project not found' });
        if (project.userId.toString() !== req.user.id) return res.status(401).json({ msg: 'Not authorized' });
        res.json(project);
    } catch (err) {
        console.error(err.message);
        if (err.kind === 'ObjectId') return res.status(404).json({ msg: 'Project not found' });
        res.status(500).send('Server Error');
    }
});

// @route   GET /api/projects
// @desc    Get all projects for user

// @route   GET /api/projects
// @desc    Get all projects for user
// @access  Private
router.get('/', isLoggedIn, async (req, res) => {
    try {
        const projects = await Project.find({ userId: req.user.id }).sort({ updatedAt: -1 });
        res.json(projects);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route   GET /api/projects/view/:shareId
// @desc    Public route - get project by shareId only if isPublic
// @access  Public
router.get('/view/:shareId', async (req, res) => {
    try {
        const project = await Project.findOne({ shareId: req.params.shareId });
        if (!project) return res.status(404).json({ msg: 'Project not found' });
        if (!project.isPublic) return res.status(403).json({ msg: 'Project is not shared publicly' });
        res.json(project);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route   GET /api/projects/demo/:id
// @desc    Serve the prototype HTML
// @access  Public (technically, but maybe obfuscated)
router.get('/demo/:id', async (req, res) => {
    try {
        const project = await Project.findById(req.params.id);
        if (!project || !project.hasPrototype) {
            return res.status(404).send('Prototype not found or not generated yet.');
        }
        res.setHeader('Content-Type', 'text/html');
        res.send(project.prototypeHtml);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route   DELETE /api/projects/:id
// @desc    Delete project
// @access  Private
router.delete('/:id', isLoggedIn, async (req, res) => {
    try {
        const project = await Project.findById(req.params.id);
        if (!project) return res.status(404).json({ msg: 'Project not found' });
        if (project.userId.toString() !== req.user.id) return res.status(401).json({ msg: 'Not authorized' });

        await project.deleteOne();
        res.json({ success: true });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

module.exports = router;
