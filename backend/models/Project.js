const mongoose = require('mongoose');

const ProjectSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    title: {
        type: String,
        required: true
    },
    domain: {
        type: String, // web, app, ai
        required: true
    },
    teamMembers: [{
        name: String,
        rollNo: String,
        univRollNo: String
    }],
    techStack: {
        frontend: String,
        backend: String,
        database: String
    },
    cocomo: {
        kloc: Number,
        effort: Number,
        cost: Number,
        time: Number
    },
    diagrams: {
        useCase: String,
        dfd0: String,
        dfd1: String,
        classDiagram: String
    },
    isPublic: {
        type: Boolean,
        default: false
    },
    shareId: {
        type: String,
        unique: true,
        sparse: true
    },
    prototypeHtml: {
        type: String
    },
    hasPrototype: {
        type: Boolean,
        default: false
    },
    enterpriseData: {
        type: Object, // Stores the full SRSRequest JSON
        required: false
    },
    enterpriseFormData: {
        type: Object, // Stores the raw form inputs for restoration
        required: false
    },
    documentUrl: {
        type: String,
        required: false
    },
    // DOCX binary stored directly (always < 16 MB)
    docxBuffer: {
        type: Buffer,
        required: false
    },
    docxFilename: {
        type: String,
        required: false
    },
    reviewedDocumentUrl: {
        type: String,
        required: false
    },
    reviewFeedback: {
        type: Array,
        default: []
    },
    workflowEvents: {
        type: Array,
        default: []
    },
    insights: {
        type: Array,
        default: []
    },
    clientEmail: {
        type: String,
        required: false
    },
    contentMarkdown: {
        type: String,
        required: false
    },
    status: {
        type: String,
        enum: ['DRAFT', 'IN_REVIEW', 'APPROVED', 'CHANGES_REQUESTED'],
        default: 'DRAFT'
    },
    hq: {
        status: {
            type: String,
            enum: ['IDLE', 'BUILDING', 'READY', 'APPLIED', 'FAILED'],
            default: 'IDLE'
        },
        statusUrl: String,
        downloadUrl: String,
        message: String,
        lastError: String,
        lastCheckedAt: Date
    }
}, {
    timestamps: true,
    toJSON: {
        transform(doc, ret) {
            delete ret.docxBuffer; // never send binary to API consumers
            return ret;
        }
    },
    toObject: {
        transform(doc, ret) {
            delete ret.docxBuffer;
            return ret;
        }
    }
});

module.exports = mongoose.model('Project', ProjectSchema);
