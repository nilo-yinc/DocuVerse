const axios = require('axios');
const Project = require('../models/Project');

/**
 * n8n Webhook Service
 * Handles all webhook interactions with n8n for automation workflows
 */

class N8nWebhookService {
    constructor() {
        this.n8nBaseUrl = process.env.N8N_WEBHOOK_URL || 'http://localhost:5678';
        this.isEnabled = process.env.N8N_ENABLED === 'true';
    }

    /**
     * Send SRS Generation Notification to n8n
     * Triggered when SRS document is generated
     */
    async notifySRSGenerated(projectData) {
        if (!this.isEnabled) {
            console.log('[n8n] Webhook disabled, skipping notification');
            return { success: false, message: 'n8n disabled' };
        }

        try {
            const payload = {
                event: 'srs.generated',
                timestamp: new Date().toISOString(),
                project: {
                    id: projectData._id || projectData.projectId,
                    name: projectData.title || projectData.projectName,
                    domain: projectData.domain,
                    shareId: projectData.shareId,
                    documentPath: projectData.srsDocumentPath,
                    author: projectData.userId,
                    createdAt: projectData.createdAt || new Date().toISOString()
                },
                links: {
                    view: `${process.env.FRONTEND_URL}/projects/${projectData.shareId}`,
                    download: projectData.downloadUrl
                }
            };

            const webhookUrl = `${this.n8nBaseUrl}/webhook/srs-generated`;
            const response = await axios.post(webhookUrl, payload, {
                timeout: 5000,
                headers: {
                    'Content-Type': 'application/json',
                    'X-Source': 'DocuVerse-Backend'
                }
            });

            console.log('[n8n] SRS generation notification sent successfully');
            return { success: true, data: response.data };

        } catch (error) {
            console.error('[n8n] Failed to send SRS notification:', error.message);
            return { success: false, error: error.message };
        }
    }

    /**
     * Send Project Created Notification
     */
    async notifyProjectCreated(projectData) {
        if (!this.isEnabled) return { success: false };

        try {
            const payload = {
                event: 'project.created',
                timestamp: new Date().toISOString(),
                project: {
                    id: projectData._id,
                    name: projectData.title,
                    domain: projectData.domain,
                    shareId: projectData.shareId,
                    userId: projectData.userId
                }
            };

            const webhookUrl = `${this.n8nBaseUrl}/webhook/project-created`;
            await axios.post(webhookUrl, payload, { timeout: 5000 });
            
            console.log('[n8n] Project created notification sent');
            return { success: true };

        } catch (error) {
            console.error('[n8n] Project notification failed:', error.message);
            return { success: false, error: error.message };
        }
    }

    /**
     * Send Prototype Generated Notification
     */
    async notifyPrototypeGenerated(projectId, prototypeUrl) {
        if (!this.isEnabled) return { success: false };

        try {
            const project = await Project.findById(projectId);
            if (!project) throw new Error('Project not found');

            const payload = {
                event: 'prototype.generated',
                timestamp: new Date().toISOString(),
                project: {
                    id: project._id,
                    name: project.title,
                    shareId: project.shareId,
                    prototypeUrl: prototypeUrl
                },
                links: {
                    demo: `${process.env.FRONTEND_URL}/demo/${project._id}`
                }
            };

            const webhookUrl = `${this.n8nBaseUrl}/webhook/prototype-generated`;
            await axios.post(webhookUrl, payload, { timeout: 5000 });
            
            console.log('[n8n] Prototype notification sent');
            return { success: true };

        } catch (error) {
            console.error('[n8n] Prototype notification failed:', error.message);
            return { success: false, error: error.message };
        }
    }

    /**
     * Send User Activity Event
     */
    async trackUserActivity(userId, action, metadata = {}) {
        if (!this.isEnabled) return { success: false };

        try {
            const payload = {
                event: 'user.activity',
                timestamp: new Date().toISOString(),
                user: { id: userId },
                action: action,
                metadata: metadata
            };

            const webhookUrl = `${this.n8nBaseUrl}/webhook/user-activity`;
            await axios.post(webhookUrl, payload, { 
                timeout: 3000,
                headers: { 'X-Source': 'DocuVerse-Backend' }
            });
            
            return { success: true };

        } catch (error) {
            // Silent fail for analytics
            return { success: false };
        }
    }

    /**
     * Receive Webhook from n8n (Incoming Webhook Handler)
     * For n8n to trigger actions in DocuVerse
     */
    async handleIncomingWebhook(webhookType, payload) {
        console.log(`[n8n] Received webhook: ${webhookType}`);

        switch (webhookType) {
            case 'regenerate-srs':
                return await this.handleRegenerateSRS(payload);
            
            case 'update-project':
                return await this.handleUpdateProject(payload);
            
            case 'send-email-notification':
                return await this.handleEmailNotification(payload);
            
            default:
                return { 
                    success: false, 
                    message: `Unknown webhook type: ${webhookType}` 
                };
        }
    }

    /**
     * Handle SRS Regeneration Request from n8n
     */
    async handleRegenerateSRS(payload) {
        try {
            const { projectId, options } = payload;
            const project = await Project.findById(projectId);
            
            if (!project) {
                return { success: false, message: 'Project not found' };
            }

            // Trigger regeneration (would call your SRS generation logic)
            console.log(`[n8n] Regenerating SRS for project: ${projectId}`);
            
            return { 
                success: true, 
                message: 'SRS regeneration triggered',
                projectId: projectId
            };

        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    /**
     * Handle Project Update from n8n
     */
    async handleUpdateProject(payload) {
        try {
            const { projectId, updates } = payload;
            const project = await Project.findById(projectId);
            
            if (!project) {
                return { success: false, message: 'Project not found' };
            }

            // Apply updates
            Object.assign(project, updates);
            await project.save();
            
            return { 
                success: true, 
                message: 'Project updated',
                project: project
            };

        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    /**
     * Handle Email Notification Request
     */
    async handleEmailNotification(payload) {
        try {
            // Would integrate with your email service
            console.log('[n8n] Email notification request:', payload);
            
            return { 
                success: true, 
                message: 'Email notification queued'
            };

        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    /**
     * Test n8n Connection
     */
    async testConnection() {
        try {
            const testUrl = `${this.n8nBaseUrl}/webhook/health-check`;
            const response = await axios.post(testUrl, {
                source: 'DocuVerse',
                timestamp: new Date().toISOString()
            }, { timeout: 3000 });

            return { 
                success: true, 
                message: 'n8n connection successful',
                response: response.data 
            };

        } catch (error) {
            return { 
                success: false, 
                message: 'n8n connection failed',
                error: error.message 
            };
        }
    }
}

module.exports = new N8nWebhookService();
