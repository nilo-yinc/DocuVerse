const express = require('express');
const router = express.Router();
const isLoggedIn = require('../middlewares/isLoggedIn.middleware');
const Project = require('../models/Project');
const axios = require('axios');
// Brevo HTTP API for sending emails (Render blocks SMTP)
const { GoogleGenerativeAI } = require("@google/generative-ai");

// Initialize Gemini
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// Generate short unique shareId
const generateShareId = () => require('crypto').randomBytes(6).toString('hex');

const normalizeUserScale = (rawScale, otherScale) => {
    const candidates = [rawScale, otherScale].filter(Boolean).map(v => String(v).trim());
    for (const value of candidates) {
        const normalized = value.toLowerCase().replace(/[, ]+/g, '');
        if (normalized.includes('<100') || normalized.includes('under100')) return '<100';
        if (
            normalized.includes('100-1k') ||
            normalized.includes('100to1000') ||
            normalized.includes('100-1000')
        ) return '100-1k';
        if (
            normalized.includes('1k-100k') ||
            normalized.includes('1000-10000') ||
            normalized.includes('1000-100000') ||
            normalized.includes('10000+') ||
            normalized.includes('10k+')
        ) return '1k-100k';
        if (normalized.includes('>100k') || normalized.includes('100000+') || normalized.includes('100k+')) return '>100k';
    }
    return '100-1k';
};

const normalizePerformance = (rawValue, otherValue) => {
    const candidates = [rawValue, otherValue].filter(Boolean).map(v => String(v).trim().toLowerCase());
    for (const value of candidates) {
        if (value.includes('real-time') || value.includes('realtime') || value.includes('latency')) return 'Real-time';
        if (value.includes('high')) return 'High';
        if (value.includes('standard') || value.includes('normal') || value.includes('moderate')) return 'Normal';
    }
    return 'Normal';
};

const normalizeDetailLevel = (rawValue) => {
    const value = String(rawValue || '').toLowerCase();
    if (value.includes('enterprise')) return 'Enterprise-grade';
    if (value.includes('technical') || value.includes('standard')) return 'Technical';
    if (value.includes('brief') || value.includes('high-level') || value.includes('high level')) return 'High-level';
    return 'Technical';
};

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

const getPyBase = () => String(process.env.PY_API_BASE || 'http://127.0.0.1:8000').replace(/\/+$/, '');
const getPyGenerateTimeoutMs = () => {
    const raw = Number(process.env.PY_GENERATE_TIMEOUT_MS || 300000);
    if (!Number.isFinite(raw) || raw < 60000) return 300000;
    return raw;
};
const getPyWorkflowTimeoutMs = () => {
    const raw = Number(process.env.PY_WORKFLOW_TIMEOUT_MS || 70000);
    if (!Number.isFinite(raw) || raw < 15000) return 70000;
    return raw;
};

const toAbsolutePyUrl = (relativeOrAbsolute) => {
    if (!relativeOrAbsolute) return null;
    if (String(relativeOrAbsolute).startsWith('http')) return relativeOrAbsolute;
    const pyBase = getPyBase();
    return `${pyBase}${String(relativeOrAbsolute).startsWith('/') ? '' : '/'}${relativeOrAbsolute}`;
};

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const callPythonWithRetry = async (requestFactory, retries = 2) => {
    let lastError;
    for (let attempt = 0; attempt <= retries; attempt += 1) {
        try {
            return await requestFactory();
        } catch (error) {
            lastError = error;
            const status = error?.response?.status;
            const retryable = [502, 503, 504].includes(status) || !status;
            if (!retryable || attempt === retries) break;
            await sleep(1500 * (attempt + 1));
        }
    }
    throw lastError;
};

const toAbsoluteNodeDocLink = (documentLink) => {
    if (!documentLink) return '';
    if (String(documentLink).startsWith('http://') || String(documentLink).startsWith('https://')) {
        return documentLink;
    }
    const nodePublicUrl = String(process.env.NODE_PUBLIC_URL || process.env.BACKEND_PUBLIC_URL || '').replace(/\/+$/, '');
    if (nodePublicUrl && String(documentLink).startsWith('/')) {
        return `${nodePublicUrl}${documentLink}`;
    }
    return documentLink;
};

const extractFilenameFromLink = (documentLink, fallback = 'srs.docx') => {
    try {
        const clean = String(documentLink || '').split('?')[0];
        const tail = clean.substring(clean.lastIndexOf('/') + 1);
        return decodeURIComponent(tail || fallback);
    } catch (_) {
        return fallback;
    }
};

const sendReviewEmailDirectFromNode = async ({
    toEmail,
    subject,
    senderName,
    senderEmail,
    documentLink,
    projectName,
    docxBuffer,
    notes,
    isResend,
    reviewUrl
}) => {
    const gatewayUrl = process.env.GMAIL_APPS_SCRIPT_URL;
    const token = process.env.GMAIL_APPS_SCRIPT_TOKEN || 'docuverse-email-secret-2026';
    if (!gatewayUrl) throw new Error('GMAIL_APPS_SCRIPT_URL is not set');

    const absoluteDocLink = toAbsoluteNodeDocLink(documentLink);
    const safeSenderName = senderName || 'DocuVerse User';
    const safeProjectName = projectName || 'DocuVerse Project';
    const stageLabel = isResend ? 'REVISION REVIEW' : 'TECHNICAL REVIEW STAGE';

    // Format notes/content as HTML paragraphs
    const notesHtml = notes
        ? notes
            .split('\n')
            .filter(line => line.trim())
            .map(line => {
                const trimmed = line.trim();
                if (trimmed.startsWith('# '))
                    return `<h3 style="margin:14px 0 6px 0;color:#e6edf3;font-size:15px;">${trimmed.slice(2)}</h3>`;
                if (trimmed.startsWith('**') && trimmed.endsWith('**'))
                    return `<p style="margin:10px 0 4px 0;color:#e6edf3;font-weight:700;font-size:13px;">${trimmed.slice(2, -2)}</p>`;
                if (trimmed.startsWith('- '))
                    return `<p style="margin:2px 0 2px 12px;color:#8b949e;font-size:12px;">• ${trimmed.slice(2)}</p>`;
                return `<p style="margin:2px 0;color:#8b949e;font-size:12px;">${trimmed}</p>`;
            })
            .join('\n')
        : '';

    // Build the reply-to mailto link for "Request Changes"
    const requestChangesLink = reviewUrl || `mailto:${senderEmail || ''}?subject=${replySubject}&body=${replyBody}`;
    const approveLink = reviewUrl || `mailto:${senderEmail || ''}?subject=${encodeURIComponent(`Approved: ${safeProjectName}`)}&body=${encodeURIComponent(`Hi ${safeSenderName},\n\nI've reviewed and approved the document for "${safeProjectName}".\n\nLooks good — no changes needed.\n\nThank you.`)}`;

    const html = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;background:#0d1117;font-family:'Segoe UI',Arial,sans-serif;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#0d1117;">
<tr><td align="center" style="padding:24px 12px;">
<table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;">

  <!-- HEADER -->
  <tr><td style="background:linear-gradient(135deg,#161b22 0%,#0d1117 100%);border:1px solid #30363d;border-radius:12px 12px 0 0;padding:20px 24px;">
    <table role="presentation" cellpadding="0" cellspacing="0" style="border-collapse:collapse;">
      <tr>
        <td style="vertical-align:middle;">
          <div style="width:44px;height:44px;border-radius:10px;background:#0a0a0a;border:1px solid rgba(255,255,255,0.12);text-align:center;line-height:44px;font-family:'Courier New',monospace;font-weight:700;font-size:18px;">
            <span style="color:#22d3ee;">&gt;</span><span style="color:#fff;">_</span>
          </div>
        </td>
        <td style="padding-left:14px;vertical-align:middle;">
          <div style="color:#e6edf3;font-size:20px;font-weight:800;letter-spacing:-0.3px;">DocuVerse Studio: Review</div>
          <div style="color:#22d3ee;font-size:11px;font-weight:600;letter-spacing:0.5px;margin-top:3px;">Stage: [${stageLabel}]</div>
        </td>
      </tr>
    </table>
  </td></tr>

  <!-- BODY -->
  <tr><td style="background:#161b22;border-left:1px solid #30363d;border-right:1px solid #30363d;padding:24px;">

    <!-- Greeting -->
    <p style="margin:0 0 16px 0;color:#c9d1d9;font-size:14px;">Hello,</p>
    <p style="margin:0 0 16px 0;color:#c9d1d9;font-size:14px;">
      You have been invited to review the Software Requirements Specification (SRS) for: <strong style="color:#e6edf3;">${safeProjectName}</strong>
    </p>

    <!-- Document Link Card -->
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:16px 0;">
      <tr><td style="background:#0d1117;border:1px solid #30363d;border-radius:8px;padding:14px 16px;">
        <p style="margin:0 0 6px 0;color:#8b949e;font-size:11px;text-transform:uppercase;letter-spacing:0.5px;">📄 Document Link</p>
        <a href="${absoluteDocLink}" style="color:#58a6ff;font-size:13px;word-break:break-all;text-decoration:none;">${absoluteDocLink}</a>
      </td></tr>
    </table>

    <!-- Prepared By -->
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:12px 0;">
      <tr><td style="background:#0d1117;border:1px solid #30363d;border-radius:8px;padding:12px 16px;">
        <table role="presentation" cellpadding="0" cellspacing="0"><tr>
          <td style="color:#8b949e;font-size:12px;padding-right:8px;">Prepared by:</td>
          <td style="color:#e6edf3;font-size:13px;font-weight:600;">${safeSenderName}${senderEmail ? ` &lt;${senderEmail}&gt;` : ''}</td>
        </tr></table>
      </td></tr>
    </table>

    ${notesHtml ? `
    <!-- Additional Notes / Project Details -->
    <div style="margin:20px 0 16px 0;">
      <p style="margin:0 0 10px 0;color:#e6edf3;font-size:13px;font-weight:700;border-bottom:1px solid #30363d;padding-bottom:8px;">📋 Additional Notes:</p>
      <div style="background:#0d1117;border:1px solid #30363d;border-radius:8px;padding:14px 16px;font-size:12px;line-height:1.6;">
        ${notesHtml}
      </div>
    </div>
    ` : ''}

    <!-- Review Instructions -->
    <p style="margin:20px 0 8px 0;color:#c9d1d9;font-size:13px;">
      A ${isResend ? 'revised' : 'new'} SRS document has been generated and is ready for your technical review.
    </p>
    <p style="margin:0 0 20px 0;color:#8b949e;font-size:12px;">
      Please use the buttons below to Approve or Request Changes.
    </p>

    <!-- ACTION BUTTONS -->
    <table role="presentation" cellpadding="0" cellspacing="0" style="margin:6px 0 20px 0;">
      <tr>
        <td style="padding-right:12px;">
          <a href="${approveLink}" style="display:inline-block;background:#238636;color:#ffffff;text-decoration:none;padding:11px 22px;border-radius:8px;font-weight:700;font-size:13px;letter-spacing:0.2px;">
            Approve Document
          </a>
        </td>
        <td>
          <a href="${requestChangesLink}" style="display:inline-block;background:#da3633;color:#ffffff;text-decoration:none;padding:11px 22px;border-radius:8px;font-weight:700;font-size:13px;letter-spacing:0.2px;">
            Request Changes
          </a>
        </td>
      </tr>
    </table>

  </td></tr>

  <!-- FOOTER -->
  <tr><td style="background:#0d1117;border:1px solid #30363d;border-top:none;border-radius:0 0 12px 12px;padding:16px 24px;">
    <p style="margin:0;color:#484f58;font-size:11px;line-height:1.5;">
      This is an automated delivery from DocuVerse. Please reply directly to this email if you have specific questions for the author.
    </p>
  </td></tr>

</table>
</td></tr>
</table>
</body>
</html>`;

    const body = {
        token,
        to: toEmail,
        subject,
        fromName: 'DocuVerse',
        replyTo: senderEmail || undefined,
        html,
        text: `DocuVerse review request for ${safeProjectName}.\n\nPrepared by: ${safeSenderName}\nDocument: ${absoluteDocLink}\n\n${notes || ''}\n\nPlease review and reply to approve or request changes.`,
    };

    // Attach DOCX directly from buffer (base64 for Apps Script)
    if (docxBuffer && docxBuffer.length > 0) {
        body.attachments = [{
            filename: extractFilenameFromLink(absoluteDocLink) || 'SRS_Document.docx',
            content: Buffer.isBuffer(docxBuffer)
                ? docxBuffer.toString('base64')
                : docxBuffer,
            contentType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
        }];
    }

    const resp = await fetch(gatewayUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
        redirect: 'follow'
    });

    if (!resp.ok) {
        const errText = await resp.text();
        throw new Error(`Gmail gateway error ${resp.status}: ${errText}`);
    }

    const result = await resp.json();
    if (result.error) {
        throw new Error(`Gmail gateway error: ${result.error}`);
    }

    console.log('Review email sent via Gmail gateway:', JSON.stringify(result));
};

const applyDocFromPythonToProject = async (project, pyDownloadUrl) => {
    const absolute = toAbsolutePyUrl(pyDownloadUrl);
    if (!absolute) throw new Error('Invalid download URL from Python backend');
    const filename = String(pyDownloadUrl || '').split('/download_srs/')[1] || '';
    if (!filename) throw new Error('Python download_url missing filename');

    const docxResp = await axios.get(absolute, { responseType: 'arraybuffer', timeout: 120000 });
    const docxBuffer = Buffer.from(docxResp.data);

    // Store DOCX directly on the project document (always < 16 MB)
    const nodePublicUrl = String(process.env.NODE_PUBLIC_URL || process.env.BACKEND_PUBLIC_URL || '').replace(/\/+$/, '');
    project.docxBuffer = docxBuffer;
    project.docxFilename = filename;
    project.documentUrl = nodePublicUrl ? `${nodePublicUrl}/download_srs/${filename}` : `/download_srs/${filename}`;
    project.reviewedDocumentUrl = undefined;
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
            clientEmail,
            hq
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
        if (hq !== undefined) project.hq = { ...(project.hq || {}), ...hq };

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
                expected_user_scale: normalizeUserScale(
                    safeUserScale,
                    safeUserScale === 'Other' ? formData.userScale_other : ''
                ),
                performance_expectation: normalizePerformance(
                    safePerformance,
                    safePerformance === 'Other' ? formData.performance_other : ''
                )
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
                srs_detail_level: normalizeDetailLevel(safeDetailLevel),
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
        const frontendUrl = String(process.env.FRONTEND_URL || 'https://docuverse.app').replace(/\/+$/, '');
        srsRequest.project_identity.live_link = `${frontendUrl}/demo/${project._id}`;
        srsRequest.project_identity.project_id = project._id.toString();

        // 4. Call Python Backend (with expanded data)
        // In production free-tier environments, full mode can fail due cold-start/limits.
        // Fallback: if full fails, retry quick mode automatically.
        const pyBase = String(process.env.PY_API_BASE || 'http://127.0.0.1:8000').replace(/\/+$/, '');
        const pyGenerateTimeout = getPyGenerateTimeoutMs();

        // Warm up Python backend (helps on Render free-tier spin-up)
        try {
            await axios.get(`${pyBase}/health`, { timeout: 65000 });
        } catch (_) {}

        let pythonResponse;
        let usedMode = mode;
        let modeFallbackWarning = null;
        try {
            pythonResponse = await callPythonWithRetry(
                () => axios.post(
                    `${pyBase}/generate_srs?mode=${encodeURIComponent(mode)}`,
                    srsRequest,
                    { timeout: pyGenerateTimeout }
                ),
                2
            );
        } catch (firstErr) {
            if (mode === 'full') {
                modeFallbackWarning = 'Full mode failed; quick mode fallback used.';
                usedMode = 'quick';
                pythonResponse = await callPythonWithRetry(
                    () => axios.post(
                        `${pyBase}/generate_srs?mode=quick`,
                        srsRequest,
                        { timeout: pyGenerateTimeout }
                    ),
                    2
                );
            } else {
                throw firstErr;
            }
        }
        const pythonDownloadUrl = pythonResponse.data.download_url;
        const filename = String(pythonDownloadUrl || '').split('/download_srs/')[1] || '';
        if (!filename) {
            return res.status(500).json({ msg: 'Generation Engine Failed', details: 'Python did not return a valid download_url' });
        }

        await applyDocFromPythonToProject(project, pythonDownloadUrl);

        const enhancedStatusUrl = pythonResponse.data?.enhanced_status_url || `/srs_status/${project._id.toString()}`;
        const enhancedDownloadUrl = pythonResponse.data?.enhanced_download_url || null;
        project.hq = {
            ...(project.hq || {}),
            status: mode === 'quick' ? 'BUILDING' : 'READY',
            statusUrl: enhancedStatusUrl,
            downloadUrl: enhancedDownloadUrl,
            message: mode === 'quick'
                ? 'HQ enhancement is building in background. Open Studio to track progress.'
                : 'HQ document is ready.',
            lastError: '',
            lastCheckedAt: new Date()
        };
        // keep only latest docx => don't point to a deleted previous file
        project.reviewedDocumentUrl = undefined;
        project.contentMarkdown = buildMarkdownFromSrsRequest(srsRequest);
        await project.save();
        
        // 6. Return Download URL and Project ID
        // The Python backend returns a relative download_url like /download_srs/Filename.docx
        res.json({ 
            srs_document_path: project.documentUrl,
            projectId: project._id,
            mode: usedMode,
            warning: modeFallbackWarning,
            hq: project.hq
        });

    } catch (err) {
        console.error("Enterprise Generation ERROR [FULL]:", err);
        const errCode = err?.code || '';
        const isTimeout = errCode === 'ECONNABORTED' || String(err?.message || '').toLowerCase().includes('timeout');
        if (err.response) {
            console.error("Python Backend Error Data:", err.response.data);
            return res.status(500).json({ 
                msg: 'Generation Engine Failed', 
                details: err.response.data,
                error: err.message 
            });
        }
        if (isTimeout) {
            return res.status(504).json({
                msg: 'Generation Engine Timed Out',
                details: `Python generation exceeded timeout (${getPyGenerateTimeoutMs()} ms).`,
                error: err.message
            });
        }
        res.status(500).json({ 
            msg: 'Generation Engine Failed', 
            details: err.message,
            stack: process.env.NODE_ENV === 'development' ? err.stack : undefined 
        });
    }
});

// @route   GET /api/projects/:id/hq-status
// @desc    Check background HQ status and auto-apply enhanced DOCX when ready
// @access  Private
router.get('/:id/hq-status', isLoggedIn, async (req, res) => {
    try {
        const project = await Project.findById(req.params.id);
        if (!project) return res.status(404).json({ msg: 'Project not found' });
        if (project.userId.toString() !== req.user.id) return res.status(401).json({ msg: 'Not authorized' });

        const hq = project.hq || { status: 'IDLE' };
        if (!hq.statusUrl) {
            return res.json({ status: hq.status || 'IDLE', applied: false, documentUrl: project.documentUrl || null });
        }

        const pyStatusUrl = toAbsolutePyUrl(hq.statusUrl);
        const pyRes = await callPythonWithRetry(
            () => axios.get(pyStatusUrl, { timeout: 90000 }),
            2
        );
        const pyStatus = pyRes.data || {};
        const enhancedReady = Boolean(pyStatus.enhanced_ready || pyStatus.full_ready);
        const bestDownload = pyStatus.enhanced_download_url || pyStatus.full_download_url || hq.downloadUrl;

        project.hq.lastCheckedAt = new Date();

        if (!enhancedReady || !bestDownload) {
            project.hq.status = 'BUILDING';
            project.hq.message = 'HQ is still generating in background.';
            await project.save();
            return res.json({ status: 'BUILDING', applied: false, documentUrl: project.documentUrl || null, hq: project.hq });
        }

        if (project.hq.status !== 'APPLIED') {
            await applyDocFromPythonToProject(project, bestDownload);
            project.hq.status = 'APPLIED';
            project.hq.downloadUrl = bestDownload;
            project.hq.message = 'HQ document ready and applied.';
            project.workflowEvents = project.workflowEvents || [];
            project.workflowEvents.push({
                date: new Date().toISOString(),
                title: 'HQ Ready',
                description: 'Enhanced document generated in background and applied.',
                status: project.status || 'DRAFT'
            });
            await project.save();
        }

        return res.json({
            status: project.hq.status,
            applied: project.hq.status === 'APPLIED',
            documentUrl: project.documentUrl || null,
            hq: project.hq
        });
    } catch (err) {
        const status = err?.response?.status;
        if ([502, 503, 504].includes(status)) {
            return res.json({ status: 'BUILDING', applied: false, documentUrl: null, transient: true });
        }
        console.error('HQ status check failed:', err?.message || err);
        try {
            const project = await Project.findById(req.params.id);
            if (project) {
                project.hq = {
                    ...(project.hq || {}),
                    status: 'FAILED',
                    message: 'HQ generation failed.',
                    lastError: err?.message || 'Unknown error',
                    lastCheckedAt: new Date()
                };
                await project.save();
            }
        } catch (_) {
        }
        res.status(500).json({ msg: 'HQ status check failed', detail: err?.message || 'Unknown error' });
    }
});

// @route   POST /api/projects/:id/send-review
// @desc    Send review email directly from Node (no Python dependency)
// @access  Private
router.post('/:id/send-review', isLoggedIn, async (req, res) => {
    try {
        const project = await Project.findById(req.params.id);
        if (!project) return res.status(404).json({ msg: 'Project not found' });
        if (project.userId.toString() !== req.user.id) return res.status(401).json({ msg: 'Not authorized' });

        const {
            clientEmail,
            documentLink,
            senderEmail,
            senderName,
            projectName,
            notes,
            isResend = false
        } = req.body || {};

        if (!clientEmail) return res.status(400).json({ msg: 'Client email is required' });

        const finalDocumentLink = project.documentUrl || documentLink || undefined;
        const finalProjectName = projectName || project.title || 'DocuVerse Project';
        const finalSenderName = senderName || req.user.name || 'DocuVerse User';
        const finalSenderEmail = senderEmail || req.user.email || undefined;
        const finalNotes = notes || project.contentMarkdown || '';

        // Construct Review Page URL - Use env var or default to Vercel deployment
        const frontendUrl = (process.env.FRONTEND_URL || 'https://docuverse-l63v4w3x9-niloy-malliks-projects.vercel.app').replace(/\/+$/, '');
        const reviewUrl = `${frontendUrl}/review/${project._id}`;

        // Send email directly from Node — fast and reliable
        await sendReviewEmailDirectFromNode({
            toEmail: clientEmail,
            subject: isResend
                ? `[Revised] DocuVerse Review Update: ${finalProjectName}`
                : `[Action Required] DocuVerse Review: ${finalProjectName}`,
            senderName: finalSenderName,
            senderEmail: finalSenderEmail,
            documentLink: finalDocumentLink,
            reviewUrl,
            projectName: finalProjectName,
            docxBuffer: project.docxBuffer || null,
            notes: finalNotes,
            isResend
        });

        // Update project status
        project.clientEmail = clientEmail;
        project.status = 'IN_REVIEW';
        project.workflowEvents = project.workflowEvents || [];
        project.workflowEvents.push({
            date: new Date().toISOString(),
            title: isResend ? 'Review Resent' : 'Review Sent',
            description: `Document sent to ${clientEmail} for review.`,
            status: 'IN_REVIEW'
        });
        await project.save();

        // Fire-and-forget: sync to Python in background (don't wait)
        const pyBase = getPyBase();
        axios.post(`${pyBase}/api/project/create`, {
            id: project._id.toString(),
            name: finalProjectName,
            content: project.contentMarkdown || '',
            documentUrl: finalDocumentLink,
            status: 'IN_REVIEW',
            clientEmail
        }, { timeout: 30000 }).catch(() => {});

        res.json({
            status: 'IN_REVIEW',
            message: isResend ? 'Review resent successfully.' : 'Review sent successfully.'
        });
    } catch (err) {
        console.error('Send review failed:', err?.message || err);
        res.status(500).json({
            msg: 'Failed to send review',
            detail: err?.message || 'Unknown error'
        });
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

// @route   GET /api/projects/:id/public-review
// @desc    Get project details for public review page
// @access  Public
router.get('/:id/public-review', async (req, res) => {
    try {
        const project = await Project.findById(req.params.id).select('title status documentUrl reviewFeedback clientEmail');
        if (!project) return res.status(404).json({ msg: 'Project not found' });
        res.json(project);
    } catch (err) {
        console.error(err);
        if (err.kind === 'ObjectId') return res.status(404).json({ msg: 'Project not found' });
        res.status(500).send('Server Error');
    }
});

// @route   POST /api/projects/:id/submit-review
// @desc    Submit review feedback from public page
// @access  Public
router.post('/:id/submit-review', async (req, res) => {
    try {
        const { status, feedback } = req.body;
        if (!['APPROVED', 'CHANGES_REQUESTED'].includes(status)) {
            return res.status(400).json({ msg: 'Invalid status' });
        }

        const project = await Project.findById(req.params.id);
        if (!project) return res.status(404).json({ msg: 'Project not found' });

        project.status = status;
        project.reviewFeedback = project.reviewFeedback || [];
        
        project.reviewFeedback.push({
            id: new Date().getTime().toString(),
            date: new Date().toISOString(),
            user: project.clientEmail || 'Client Reviewer',
            content: feedback || (status === 'APPROVED' ? 'Approved by client.' : 'Changes requested.'),
            type: status === 'APPROVED' ? 'approval' : 'request_changes'
        });

        project.workflowEvents = project.workflowEvents || [];
        project.workflowEvents.push({
            date: new Date().toISOString(),
            title: status === 'APPROVED' ? 'Client Approved' : 'Changes Requested',
            description: status === 'APPROVED' 
                ? 'Document approved via review page.' 
                : 'Client requested changes via review page.',
            status: status
        });

        await project.save();
        res.json({ msg: 'Review submitted successfully' });

    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
});

module.exports = router;
