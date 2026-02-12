const Suggestion = require('../models/Suggestion');
const User = require('../models/user.models');
const { sendSuggestionAcknowledgement } = require('../utils/sendingMail.utils');

/**
 * Handle Feature Suggestion
 */
exports.suggestFeature = async (req, res) => {
    try {
        const { title, description, priority } = req.body;

        if (!title || !description) {
            return res.status(400).json({ 
                success: false, 
                message: 'Please provide both title and description for your suggestion.' 
            });
        }

        const userId = req.user?.id || req.user?._id;
        if (!userId) {
            return res.status(401).json({
                success: false,
                message: 'Unauthorized. Please log in to submit suggestions.'
            });
        }

        const user = await User.findById(userId).select('name email');
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found. Please log in again.'
            });
        }

        const suggestionData = {
            userId,
            userName: user.name,
            userEmail: user.email,
            title,
            description,
            priority: priority || 'Medium',
            source: 'authenticated'
        };

        console.log(`[Support] Saving feature suggestion from ${user.email} (${userId})`);

        // 1. Save to MongoDB
        const newSuggestion = new Suggestion(suggestionData);
        await newSuggestion.save();

        // 2. Email acknowledgement (best-effort; don't fail request if email fails)
        const ack = await sendSuggestionAcknowledgement({
            email: user.email,
            name: user.name,
            title,
            priority: suggestionData.priority
        });
        if (ack !== true) {
            console.warn('[Support] Suggestion saved, but acknowledgement email failed:', ack?.error || ack);
        }

        res.json({ 
            success: true, 
            message: 'Thank you for your suggestion! It has been saved to our database.' 
        });

    } catch (err) {
        console.error('Suggestion Save Error:', err);
        res.status(500).json({ 
            success: false, 
            message: 'Failed to submit suggestion. Please try again later.' 
        });
    }
};
