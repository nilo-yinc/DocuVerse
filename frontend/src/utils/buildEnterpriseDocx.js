import {
    Document,
    Packer,
    Paragraph,
    TextRun,
    HeadingLevel,
    AlignmentType,
    PageBreak,
    Header,
} from 'docx';

/**
 * Builds an Enterprise SRS DOCX document locally (no backend API calls).
 * Generates IEEE 830-1998 compliant Software Requirements Specification.
 * 
 * @param {Object} formData - The form data collected from the wizard
 * @returns {Promise<Blob>} - A Blob containing the generated DOCX file
 */
export async function buildEnterpriseDocx(formData) {
    try {
        const { 
            projectName = 'Untitled Project',
            authors = '',
            organization = 'Organization',
            problemStatement = '',
            targetUsers = '',
            appType = '',
            domain = '',
            coreFeatures = '',
            userFlow = '',
            userScale = '',
            performance = '',
            authRequired = 'No',
            sensitiveData = 'No',
            compliance = [],
            backendPref = '',
            dbPref = '',
            deploymentPref = '',
            detailLevel = 'Professional'
        } = formData;

        const children = [];

        // Header
        const header = new Header({
            children: [
                new Paragraph({
                    alignment: AlignmentType.RIGHT,
                    children: [new TextRun({ text: organization, bold: true, size: 20, color: '808080' })]
                }),
            ],
        });

        // ===== COVER PAGE =====
        children.push(
            new Paragraph({ text: '', spacing: { before: 2400 } }),
            new Paragraph({
                alignment: AlignmentType.CENTER,
                children: [
                    new TextRun({ text: 'SOFTWARE REQUIREMENTS SPECIFICATION', bold: true, size: 36, color: '2E74B5' }),
                ],
            }),
            new Paragraph({ text: '', spacing: { before: 400 } }),
            new Paragraph({
                alignment: AlignmentType.CENTER,
                children: [new TextRun({ text: `For ${projectName}`, size: 28, italics: true })],
            }),
            new Paragraph({ text: '', spacing: { before: 2000 } }),
            new Paragraph({
                alignment: AlignmentType.CENTER,
                children: [new TextRun({ text: 'Version 1.0', size: 24 })],
            }),
            new Paragraph({
                alignment: AlignmentType.CENTER,
                children: [new TextRun({ text: `Date: ${new Date().toLocaleDateString()}`, size: 24 })],
            }),
            new Paragraph({ text: '', spacing: { before: 800 } }),
            new Paragraph({
                alignment: AlignmentType.CENTER,
                children: [new TextRun({ text: 'Prepared By:', bold: true, size: 24 })],
            }),
            ...(authors ? authors.split('\n').map(a => new Paragraph({
                alignment: AlignmentType.CENTER,
                children: [new TextRun({ text: a.trim() || 'N/A', size: 22 })],
            })) : [new Paragraph({ alignment: AlignmentType.CENTER, text: 'N/A' })]),
            new Paragraph({ children: [new PageBreak()] })
        );

        // ===== SECTION 1: INTRODUCTION =====
        children.push(
            new Paragraph({ 
                text: '1. INTRODUCTION',
                heading: HeadingLevel.HEADING_1,
                spacing: { before: 400, after: 200 }
            }),
            new Paragraph({ 
                text: '1.1 Purpose',
                heading: HeadingLevel.HEADING_2,
                spacing: { before: 200, after: 100 }
            }),
            new Paragraph({ 
                text: `This Software Requirements Specification (SRS) document describes the functional and non-functional requirements for the ${projectName} system. It serves as a comprehensive guide for development, testing, validation, and maintenance of the software product.`,
                spacing: { after: 200 }
            }),
            new Paragraph({ 
                text: '1.2 Problem Statement',
                heading: HeadingLevel.HEADING_2,
                spacing: { before: 200, after: 100 }
            }),
            new Paragraph({ 
                text: problemStatement || 'No problem statement provided.',
                spacing: { after: 200 }
            }),
            new Paragraph({ 
                text: '1.3 Scope',
                heading: HeadingLevel.HEADING_2,
                spacing: { before: 200, after: 100 }
            }),
            new Paragraph({ 
                text: `Project: ${projectName}`,
                spacing: { after: 100 }
            }),
            new Paragraph({ 
                text: `Domain: ${domain || 'Not specified'}`,
                spacing: { after: 100 }
            }),
            new Paragraph({ 
                text: `Application Type: ${appType || 'Not specified'}`,
                spacing: { after: 200 }
            }),
            new Paragraph({ children: [new PageBreak()] })
        );

        // ===== SECTION 2: OVERALL DESCRIPTION =====
        children.push(
            new Paragraph({ 
                text: '2. OVERALL DESCRIPTION',
                heading: HeadingLevel.HEADING_1,
                spacing: { before: 400, after: 200 }
            }),
            new Paragraph({ 
                text: '2.1 Product Perspective',
                heading: HeadingLevel.HEADING_2,
                spacing: { before: 200, after: 100 }
            }),
            new Paragraph({ 
                text: `Organization: ${organization}`,
                spacing: { after: 100 }
            }),
            new Paragraph({ 
                text: `Target Users/Stakeholders: ${Array.isArray(targetUsers) ? targetUsers.join(', ') : targetUsers || 'Not specified'}`,
                spacing: { after: 200 }
            }),
            new Paragraph({ 
                text: '2.2 Product Features',
                heading: HeadingLevel.HEADING_2,
                spacing: { before: 200, after: 100 }
            }),
            new Paragraph({ 
                text: coreFeatures || 'Core features not specified.',
                spacing: { after: 200 }
            }),
            new Paragraph({ children: [new PageBreak()] })
        );

        // ===== SECTION 3: SYSTEM FEATURES & REQUIREMENTS =====
        children.push(
            new Paragraph({ 
                text: '3. SYSTEM FEATURES & REQUIREMENTS',
                heading: HeadingLevel.HEADING_1,
                spacing: { before: 400, after: 200 }
            }),
            new Paragraph({ 
                text: '3.1 Functional Requirements',
                heading: HeadingLevel.HEADING_2,
                spacing: { before: 200, after: 100 }
            }),
            new Paragraph({ 
                text: 'The system shall provide the following functional capabilities:',
                spacing: { after: 100 }
            }),
            new Paragraph({ 
                text: `• ${coreFeatures || 'Core features to be determined'}`,
                spacing: { after: 200 }
            }),
            new Paragraph({ 
                text: '3.2 User Workflows & Interactions',
                heading: HeadingLevel.HEADING_2,
                spacing: { before: 200, after: 100 }
            }),
            new Paragraph({ 
                text: userFlow || 'User workflows not specified.',
                spacing: { after: 200 }
            }),
            new Paragraph({ children: [new PageBreak()] })
        );

        // ===== SECTION 4: NON-FUNCTIONAL REQUIREMENTS =====
        children.push(
            new Paragraph({ 
                text: '4. NON-FUNCTIONAL REQUIREMENTS',
                heading: HeadingLevel.HEADING_1,
                spacing: { before: 400, after: 200 }
            }),
            new Paragraph({ 
                text: '4.1 Performance Requirements',
                heading: HeadingLevel.HEADING_2,
                spacing: { before: 200, after: 100 }
            }),
            new Paragraph({ 
                text: `Expected User Scale: ${userScale || 'Not specified'} users`,
                spacing: { after: 100 }
            }),
            new Paragraph({ 
                text: `Performance Targets: ${performance || 'Not specified'}`,
                spacing: { after: 200 }
            }),
            new Paragraph({ 
                text: '4.2 Security & Compliance',
                heading: HeadingLevel.HEADING_2,
                spacing: { before: 200, after: 100 }
            }),
            new Paragraph({ 
                text: `Authentication Required: ${authRequired === 'Yes' ? 'Yes' : 'No'}`,
                spacing: { after: 100 }
            }),
            new Paragraph({ 
                text: `Handles Sensitive Data: ${sensitiveData === 'Yes' ? 'Yes' : 'No'}`,
                spacing: { after: 100 }
            }),
            new Paragraph({ 
                text: `Compliance Requirements: ${Array.isArray(compliance) && compliance.length > 0 ? compliance.join(', ') : 'None specified'}`,
                spacing: { after: 200 }
            }),
            new Paragraph({ children: [new PageBreak()] })
        );

        // ===== SECTION 5: TECHNICAL ARCHITECTURE =====
        children.push(
            new Paragraph({ 
                text: '5. TECHNICAL ARCHITECTURE',
                heading: HeadingLevel.HEADING_1,
                spacing: { before: 400, after: 200 }
            }),
            new Paragraph({ 
                text: '5.1 Technology Stack',
                heading: HeadingLevel.HEADING_2,
                spacing: { before: 200, after: 100 }
            }),
            new Paragraph({ 
                text: `Recommended Backend: ${backendPref || 'Not specified'}`,
                spacing: { after: 100 }
            }),
            new Paragraph({ 
                text: `Database Technology: ${dbPref || 'Not specified'}`,
                spacing: { after: 100 }
            }),
            new Paragraph({ 
                text: `Deployment Environment: ${deploymentPref || 'Not specified'}`,
                spacing: { after: 200 }
            }),
            new Paragraph({ children: [new PageBreak()] })
        );

        // ===== FOOTER SECTION =====
        children.push(
            new Paragraph({ 
                text: '6. DOCUMENT INFORMATION',
                heading: HeadingLevel.HEADING_1,
                spacing: { before: 400, after: 200 }
            }),
            new Paragraph({ text: `Version: 1.0`, spacing: { after: 100 } }),
            new Paragraph({ text: `Generated: ${new Date().toLocaleString()}`, spacing: { after: 100 } }),
            new Paragraph({ text: `Detail Level: ${detailLevel}`, spacing: { after: 100 } }),
            new Paragraph({ text: `This document was auto-generated by DocuVerse using the docx library.`, spacing: { after: 200 } }),
            new Paragraph({ 
                text: '© 2026 DocuVerse. All rights reserved.',
                alignment: AlignmentType.CENTER,
                spacing: { before: 400 }
            })
        );

        // Create and generate DOCX
        const doc = new Document({
            sections: [{
                headers: { default: header },
                children
            }],
        });

        const blob = await Packer.toBlob(doc);
        return blob;

    } catch (error) {
        console.error("Error generating Enterprise SRS:", error);
        throw new Error(`DOCX Generation failed: ${error.message}`);
    }
}
