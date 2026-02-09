const express = require('express');
const router = express.Router();
const n8nWebhookService = require('../services/n8n-webhook.service');
const isLoggedIn = require('../middlewares/isLoggedIn.middleware');

/**
 * Incoming Webhooks from n8n
 * These routes allow n8n to trigger actions in DocuVerse
 */

// @route   POST /api/webhooks/n8n/:webhookType
// @desc    Receive webhook from n8n
// @access  Public (but should validate with secret token)
router.post('/n8n/:webhookType', async (req, res) => {
    try {
        // Optional: Verify webhook secret
        const webhookSecret = req.headers['x-webhook-secret'];
        if (process.env.N8N_WEBHOOK_SECRET && webhookSecret !== process.env.N8N_WEBHOOK_SECRET) {
            return res.status(401).json({ message: 'Invalid webhook secret' });
        }

        const { webhookType } = req.params;
        const payload = req.body;

        const result = await n8nWebhookService.handleIncomingWebhook(webhookType, payload);
        
        res.json(result);

    } catch (error) {
        console.error('[Webhook] Error:', error.message);
        res.status(500).json({ 
            success: false, 
            message: 'Webhook processing failed',
            error: error.message 
        });
    }
});

// @route   POST /api/webhooks/test
// @desc    Test n8n connection
// @access  Private
router.post('/test', isLoggedIn, async (req, res) => {
    try {
        const result = await n8nWebhookService.testConnection();
        res.json(result);
    } catch (error) {
        res.status(500).json({ 
            success: false, 
            message: error.message 
        });
    }
});

// @route   GET /api/webhooks/status
// @desc    Get n8n webhook configuration status
// @access  Private
router.get('/status', isLoggedIn, async (req, res) => {
    try {
        res.json({
            enabled: n8nWebhookService.isEnabled,
            baseUrl: n8nWebhookService.n8nBaseUrl,
            endpoints: {
                srsGenerated: `${n8nWebhookService.n8nBaseUrl}/webhook/srs-generated`,
                projectCreated: `${n8nWebhookService.n8nBaseUrl}/webhook/project-created`,
                prototypeGenerated: `${n8nWebhookService.n8nBaseUrl}/webhook/prototype-generated`,
                userActivity: `${n8nWebhookService.n8nBaseUrl}/webhook/user-activity`
            }
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @route   POST /api/webhooks/manual-trigger
// @desc    Manually trigger a webhook (for testing)
// @access  Private
router.post('/manual-trigger', isLoggedIn, async (req, res) => {
    try {
        const { eventType, projectId } = req.body;
        const Project = require('../models/Project');
        
        if (!projectId) {
            return res.status(400).json({ message: 'projectId required' });
        }

        const project = await Project.findById(projectId);
        if (!project) {
            return res.status(404).json({ message: 'Project not found' });
        }

        if (project.userId.toString() !== req.user.id) {
            return res.status(403).json({ message: 'Not authorized' });
        }

        let result;
        switch (eventType) {
            case 'srs-generated':
                result = await n8nWebhookService.notifySRSGenerated(project);
                break;
            case 'project-created':
                result = await n8nWebhookService.notifyProjectCreated(project);
                break;
            case 'prototype-generated':
                result = await n8nWebhookService.notifyPrototypeGenerated(projectId, `/demo/${projectId}`);
                break;
            default:
                return res.status(400).json({ message: 'Invalid event type' });
        }

        res.json(result);

    } catch (error) {
        res.status(500).json({ 
            success: false, 
            message: error.message 
        });
    }
});

module.exports = router;
