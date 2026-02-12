const mongoose = require('mongoose');

const suggestionSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    userName: {
        type: String,
        required: true,
        trim: true
    },
    userEmail: {
        type: String,
        required: true,
        trim: true
    },
    title: {
        type: String,
        required: true,
        trim: true
    },
    description: {
        type: String,
        required: true,
        trim: true
    },
    priority: {
        type: String,
        enum: ['Low', 'Medium', 'High'],
        default: 'Medium'
    },
    status: {
        type: String,
        enum: ['Pending', 'In-Review', 'Planned', 'Completed', 'Rejected'],
        default: 'Pending'
    },
    source: {
        type: String,
        enum: ['anonymous', 'authenticated'],
        default: 'authenticated'
    }
}, { timestamps: true });

module.exports = mongoose.model('Suggestion', suggestionSchema);
