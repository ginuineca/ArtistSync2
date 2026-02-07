import mongoose from 'mongoose';

const messageSchema = new mongoose.Schema({
    conversation: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Conversation',
        required: true
    },
    sender: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    content: {
        type: String,
        required: true,
        trim: true,
        maxlength: 2000
    },
    attachments: [{
        type: {
            type: String,
            enum: ['image', 'video', 'audio', 'document'],
            required: true
        },
        url: {
            type: String,
            required: true
        },
        name: String,
        size: Number,
        mimeType: String
    }],
    readBy: [{
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        },
        readAt: {
            type: Date,
            default: Date.now
        }
    }],
    status: {
        type: String,
        enum: ['sent', 'delivered', 'read'],
        default: 'sent'
    },
    replyTo: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Message'
    },
    reactions: [{
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        },
        type: {
            type: String,
            enum: ['❤️', '👍', '👎', '😂', '😮', '😢', '😡']
        }
    }],
    metadata: {
        edited: {
            type: Boolean,
            default: false
        },
        editedAt: Date,
        deletedForUsers: [{
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        }]
    }
}, {
    timestamps: true
});

// Indexes for better query performance
messageSchema.index({ conversation: 1, createdAt: -1 });
messageSchema.index({ sender: 1 });
messageSchema.index({ 'readBy.user': 1 });

const Message = mongoose.models.Message || mongoose.model('Message', messageSchema);

export default Message;
