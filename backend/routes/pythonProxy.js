const express = require('express');
const axios = require('axios');

const router = express.Router();

const getPyBase = () => String(process.env.PY_API_BASE || 'http://127.0.0.1:8000').replace(/\/+$/, '');
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const requestPython = async (requestFactory, { attempts = 2, wakeDelayMs = 1500 } = {}) => {
    let lastError;
    for (let attempt = 1; attempt <= attempts; attempt++) {
        try {
            return await requestFactory();
        } catch (err) {
            lastError = err;
            const networkError = !err.response;
            if (!networkError || attempt === attempts) break;
            try {
                const pyBase = getPyBase();
                await axios.get(`${pyBase}/health`, { timeout: 65000 });
            } catch (_) {
            }
            await sleep(wakeDelayMs);
        }
    }
    throw lastError;
};

const forward = (method, path, options = {}) => async (req, res) => {
    try {
        const pyBase = getPyBase();
        const response = await requestPython(() => axios({
            method,
            url: `${pyBase}${path}`,
            data: req.body,
            params: req.query,
            headers: {
                'Content-Type': 'application/json'
            },
            timeout: options.timeoutMs || 70000,
            validateStatus: () => true
        }), { attempts: options.attempts || 2, wakeDelayMs: options.wakeDelayMs || 1500 });

        return res.status(response.status).json(response.data);
    } catch (err) {
        console.error(`Python proxy error [${method.toUpperCase()} ${path}]:`, err?.message || err);
        return res.status(502).json({
            detail: 'Python proxy request failed',
            error: err?.message || 'Unknown error'
        });
    }
};

const forwardHtml = (method, path, options = {}) => async (req, res) => {
    try {
        const pyBase = getPyBase();
        const response = await requestPython(() => axios({
            method,
            url: `${pyBase}${path}`,
            data: req.body,
            params: req.query,
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded'
            },
            responseType: 'text',
            timeout: options.timeoutMs || 70000,
            validateStatus: () => true
        }), { attempts: options.attempts || 2, wakeDelayMs: options.wakeDelayMs || 1500 });
        const contentType = response.headers?.['content-type'] || 'text/html; charset=utf-8';
        res.setHeader('Content-Type', contentType);
        return res.status(response.status).send(response.data);
    } catch (err) {
        console.error(`Python HTML proxy error [${method.toUpperCase()} ${path}]:`, err?.message || err);
        return res.status(502).send('Workflow review proxy failed');
    }
};

router.post('/notebook/analyze', forward('post', '/api/notebook/analyze', { timeoutMs: 90000, attempts: 3 }));
router.post('/notebook/chat', forward('post', '/api/notebook/chat', { timeoutMs: 90000, attempts: 3 }));
router.post('/notebook/diagram', forward('post', '/api/notebook/diagram', { timeoutMs: 120000, attempts: 3 }));
router.post('/notebook/image', forward('post', '/api/notebook/image', { timeoutMs: 120000, attempts: 3 }));
router.post('/notebook/diagram-image', forward('post', '/api/notebook/diagram-image', { timeoutMs: 120000, attempts: 3 }));
router.get('/notebook/diagram-image/status', forward('get', '/api/notebook/diagram-image/status', { timeoutMs: 90000, attempts: 3 }));
router.get('/notebook/image/status', forward('get', '/api/notebook/image/status', { timeoutMs: 90000, attempts: 3 }));

router.post('/workflow/start-review', forward('post', '/api/workflow/start-review', { timeoutMs: 180000, attempts: 3, wakeDelayMs: 2500 }));
router.post('/workflow/resend-review', forward('post', '/api/workflow/resend-review', { timeoutMs: 180000, attempts: 3, wakeDelayMs: 2500 }));
router.get('/workflow/review', forwardHtml('get', '/api/workflow/review', { timeoutMs: 120000, attempts: 3 }));
router.post('/workflow/review-feedback', async (req, res) => {
    try {
        const pyBase = getPyBase();
        const payload = new URLSearchParams();
        Object.entries(req.body || {}).forEach(([key, value]) => {
            if (value !== undefined && value !== null) payload.append(key, String(value));
        });
        const response = await requestPython(() => axios({
            method: 'post',
            url: `${pyBase}/api/workflow/review-feedback`,
            data: payload.toString(),
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            responseType: 'text',
            timeout: 70000,
            validateStatus: () => true
        }));
        const contentType = response.headers?.['content-type'] || 'text/html; charset=utf-8';
        res.setHeader('Content-Type', contentType);
        return res.status(response.status).send(response.data);
    } catch (err) {
        console.error('Python proxy error [POST /workflow/review-feedback]:', err?.message || err);
        return res.status(502).send('Workflow feedback proxy failed');
    }
});

router.post('/project/create', forward('post', '/api/project/create', { timeoutMs: 120000, attempts: 3, wakeDelayMs: 2000 }));
router.get('/project/:projectId', (req, res, next) => {
    const path = `/api/project/${encodeURIComponent(req.params.projectId)}`;
    return forward('get', path, { timeoutMs: 120000, attempts: 3, wakeDelayMs: 2000 })(req, res, next);
});

module.exports = router;
