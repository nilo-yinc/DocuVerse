const express = require('express');
const axios = require('axios');

const router = express.Router();

const getPyBase = () => String(process.env.PY_API_BASE || 'http://127.0.0.1:8000').replace(/\/+$/, '');

const forward = (method, path) => async (req, res) => {
    try {
        const pyBase = getPyBase();
        const response = await axios({
            method,
            url: `${pyBase}${path}`,
            data: req.body,
            params: req.query,
            headers: {
                'Content-Type': 'application/json'
            },
            validateStatus: () => true
        });

        return res.status(response.status).json(response.data);
    } catch (err) {
        console.error(`Python proxy error [${method.toUpperCase()} ${path}]:`, err?.message || err);
        return res.status(500).json({
            detail: 'Python proxy request failed',
            error: err?.message || 'Unknown error'
        });
    }
};

const forwardHtml = (method, path) => async (req, res) => {
    try {
        const pyBase = getPyBase();
        const response = await axios({
            method,
            url: `${pyBase}${path}`,
            data: req.body,
            params: req.query,
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded'
            },
            responseType: 'text',
            validateStatus: () => true
        });
        const contentType = response.headers?.['content-type'] || 'text/html; charset=utf-8';
        res.setHeader('Content-Type', contentType);
        return res.status(response.status).send(response.data);
    } catch (err) {
        console.error(`Python HTML proxy error [${method.toUpperCase()} ${path}]:`, err?.message || err);
        return res.status(500).send('Workflow review proxy failed');
    }
};

router.post('/notebook/analyze', forward('post', '/api/notebook/analyze'));
router.post('/notebook/chat', forward('post', '/api/notebook/chat'));
router.post('/notebook/diagram', forward('post', '/api/notebook/diagram'));
router.post('/notebook/image', forward('post', '/api/notebook/image'));
router.post('/notebook/diagram-image', forward('post', '/api/notebook/diagram-image'));
router.get('/notebook/diagram-image/status', forward('get', '/api/notebook/diagram-image/status'));
router.get('/notebook/image/status', forward('get', '/api/notebook/image/status'));

router.post('/workflow/start-review', forward('post', '/api/workflow/start-review'));
router.post('/workflow/resend-review', forward('post', '/api/workflow/resend-review'));
router.get('/workflow/review', forwardHtml('get', '/api/workflow/review'));
router.post('/workflow/review-feedback', async (req, res) => {
    try {
        const pyBase = getPyBase();
        const payload = new URLSearchParams();
        Object.entries(req.body || {}).forEach(([key, value]) => {
            if (value !== undefined && value !== null) payload.append(key, String(value));
        });
        const response = await axios({
            method: 'post',
            url: `${pyBase}/api/workflow/review-feedback`,
            data: payload.toString(),
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            responseType: 'text',
            validateStatus: () => true
        });
        const contentType = response.headers?.['content-type'] || 'text/html; charset=utf-8';
        res.setHeader('Content-Type', contentType);
        return res.status(response.status).send(response.data);
    } catch (err) {
        console.error('Python proxy error [POST /workflow/review-feedback]:', err?.message || err);
        return res.status(500).send('Workflow feedback proxy failed');
    }
});

router.post('/project/create', forward('post', '/api/project/create'));
router.get('/project/:projectId', (req, res, next) => {
    const path = `/api/project/${encodeURIComponent(req.params.projectId)}`;
    return forward('get', path)(req, res, next);
});

module.exports = router;
