const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Project = require('../models/Project');
const { GoogleGenerativeAI } = require("@google/generative-ai");

// Initialize Gemini
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// @route   POST /api/projects/save
// @desc    Create or Update a project
// @access  Private
router.post('/save', auth, async (req, res) => {
    try {
        const { title, domain, teamMembers, techStack, cocomo, diagrams, projectId } = req.body;
        
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
        } else {
            project = new Project({
                userId: req.user.id,
                title,
                domain,
                teamMembers,
                techStack,
                cocomo,
                diagrams
            });
        }

        await project.save();
        res.json(project);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route   POST /api/projects/generate-prototype
// @desc    Generate HTML/JS prototype using Gemini
// @access  Private
router.post('/generate-prototype', auth, async (req, res) => {
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

        res.json({ prototypeHtml: text });
    } catch (err) {
        console.error(err);
        res.status(500).send('AI Generation Error');
    }
});

// @route   GET /api/projects
// @desc    Get all projects for user
// @access  Private
router.get('/', auth, async (req, res) => {
    try {
        const projects = await Project.find({ userId: req.user.id }).sort({ date: -1 });
        res.json(projects);
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
