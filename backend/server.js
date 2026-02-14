const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const path = require('path');
require('dotenv').config({ path: process.env.DOTENV_PATH || path.resolve(__dirname, '../.env') });
const { streamDocxByFilename } = require('./utils/docxGridfs');
const Project = require('./models/Project');

// Connect to DB using the package's config
require('./config/mongoose-connection');

const app = express();
const PORT = process.env.PORT || 5000;

const localOrigins = [
    'http://localhost:5173',
    'http://localhost:5174',
    'http://127.0.0.1:5173',
    'http://127.0.0.1:5174'
];
const envOrigins = String(process.env.CORS_ORIGINS || process.env.FRONTEND_URL || '')
    .split(',')
    .map(s => s.trim())
    .filter(Boolean);
const allowVercel = String(process.env.ALLOW_VERCEL_APP_ORIGINS || '').toLowerCase() === 'true';
const allowedOrigins = Array.from(new Set([...localOrigins, ...envOrigins]));

app.use(cors({
    origin: (origin, callback) => {
        // allow non-browser clients (curl/postman) with no Origin header
        if (!origin) return callback(null, true);
        if (allowedOrigins.includes(origin)) return callback(null, true);
        if (allowVercel && /^https:\/\/.+\.vercel\.app$/.test(origin)) return callback(null, true);
        return callback(new Error(`CORS blocked for origin: ${origin}`));
    },
    credentials: true,
    allowedHeaders: ['Content-Type', 'Authorization', 'x-auth-token']
}));
app.use(express.json({ limit: '15mb' }));
app.use(express.urlencoded({ extended: true, limit: '15mb' }));
app.use(cookieParser());

// Serve static files from the beta folder (e.g., sample documents)
app.use('/static', express.static(path.join(__dirname, 'beta/static')));

// Public DOCX downloads – served from Project.docxBuffer (direct storage)
// Falls back to GridFS for any legacy docs still stored there
app.get('/download_srs/:filename', async (req, res) => {
    try {
        const filename = req.params.filename;
        const project = await Project.findOne({ docxFilename: filename }).select('docxBuffer docxFilename');
        if (project && project.docxBuffer) {
            res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
            res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
            return res.send(project.docxBuffer);
        }
        // Fallback to GridFS for older documents
        streamDocxByFilename(res, filename);
    } catch (err) {
        console.error('DOCX download error:', err?.message || err);
        res.status(500).send('DOCX download failed');
    }
});

// Routes
app.use('/api/v1/users', require('./routes/user.routes'));
app.use('/api/projects', require('./routes/projects'));
app.use('/api/support', require('./routes/support'));
app.use('/api', require('./routes/pythonProxy'));

// Fallback explicit routes for password OTP (in case of router mismatch)
const { requestPasswordOTP, verifyPasswordOTP } = require('./controllers/user.controller');
const isLoggedIn = require('./middlewares/isLoggedIn.middleware');
app.post('/api/v1/users/request-password-otp', isLoggedIn, requestPasswordOTP);
app.post('/api/v1/users/verify-password-otp', isLoggedIn, verifyPasswordOTP);

// Fallback explicit route for project fetch (in case router mismatch)
const Project = require('./models/Project');
app.get('/api/projects/:id', isLoggedIn, async (req, res) => {
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

// Fallback explicit route for project delete (in case router mismatch)
app.delete('/api/projects/:id', isLoggedIn, async (req, res) => {
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

app.get('/health', (req, res) => {
    res.json({ status: 'UP', service: 'Node API', timestamp: new Date() });
});

app.get('/', (req, res) => {
    res.send('DocuVerse API Running');
});

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
