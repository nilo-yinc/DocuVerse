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

// @route   POST /api/projects/save
// @desc    Create or Update a project
// @access  Private
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
        const { formData } = req.body;
        
        // 1. Map frontend formData to Python Backend SRSRequest Schema
        const srsRequest = {
            project_identity: {
                project_name: formData.projectName,
                author: formData.authors ? formData.authors.split('\n').filter(Boolean) : ['Unknown'],
                organization: formData.organization || 'Unspecified',
                problem_statement: formData.problemStatement,
                target_users: formData.targetUsers.length > 0 ? formData.targetUsers : ['End User']
            },
            system_context: {
                application_type: formData.appType,
                domain: formData.domain
            },
            functional_scope: {
                core_features: formData.coreFeatures ? formData.coreFeatures.split('\n').filter(Boolean) : ['Default Feature'],
                primary_user_flow: formData.userFlow
            },
            non_functional_requirements: {
                expected_user_scale: formData.userScale === '< 100 Users' ? '<100' :
                                   formData.userScale === '100 - 1,000 Users' ? '100-1k' :
                                   formData.userScale === '1,000 - 10,000 Users' ? '1k-100k' : '>100k',
                performance_expectation: formData.performance.includes('Standard') ? 'Normal' :
                                       formData.performance.includes('High') ? 'High' : 'Real-time'
            },
            security_and_compliance: {
                authentication_required: formData.authRequired === 'Yes',
                sensitive_data_handling: formData.sensitiveData === 'Yes',
                compliance_requirements: formData.compliance
            },
            technical_preferences: {
                preferred_backend: formData.backendPref !== 'No Preference' ? formData.backendPref : null,
                database_preference: formData.dbPref !== 'No Preference' ? formData.dbPref : null,
                deployment_preference: formData.deploymentPref !== 'No Preference' ? formData.deploymentPref : null
            },
            output_control: {
                // Map frontend "Standard", "Professional", "Brief" to backend valid levels
                srs_detail_level: formData.detailLevel.includes('Professional') ? 'Enterprise-grade' :
                                formData.detailLevel.includes('Standard') ? 'Technical' : 'High-level'
            }
        };

        // 2. Save Project Reference FIRST to generate ID and Link
        const shareId = require('crypto').randomBytes(6).toString('hex');
        const project = new Project({
            userId: req.user.id,
            title: formData.projectName,
            domain: formData.domain,
            enterpriseData: srsRequest, // Initial data
            shareId: shareId
        });
        await project.save();

        // 3. Inject Live Link and ID into SRS Request
        srsRequest.project_identity.live_link = `https://docuverse.app/demo/${project._id}`;
        srsRequest.project_identity.project_id = project._id.toString();

        // 4. Call Python Backend (with expanded data)
        // Assuming Python backend runs on port 8000
        const pythonResponse = await axios.post('http://127.0.0.1:8000/generate_srs', srsRequest);
        
        // 5. Send webhook notification
        await n8nWebhookService.notifySRSGenerated({
            ...project.toObject(),
            srsDocumentPath: pythonResponse.data.download_url,
            downloadUrl: pythonResponse.data.download_url
        });
        
        // 6. Return Download URL
        // The Python backend returns a relative download_url like /download_srs/Filename.docx
        res.json({ srs_document_path: pythonResponse.data.download_url });

    } catch (err) {
        console.error("Enterprise Generation Error:", err.message);
        if (err.response) {
            console.error("Python Backend Error:", err.response.data);
            return res.status(500).json({ msg: 'Generation Engine Failed', details: err.response.data });
        }
        res.status(500).send('Server Error');
    }
});

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

module.exports = router;
