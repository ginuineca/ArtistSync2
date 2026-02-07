import mongoose from 'mongoose';

const conversationSchema = new mongoose.Schema({
    type: {
        type: String,
        enum: ['direct', 'group'],
        required: true
    },
    participants: [{
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true
        },
        role: {
            type: String,
            enum: ['admin', 'member'],
            default: 'member'
        },
        joinedAt: {
            type: Date,
            default: Date.now
        },
        lastSeen: Date,
        notifications: {
            muted: {
                type: Boolean,
                default: false
            },
            mutedUntil: Date
        }
    }],
    groupInfo: {
        name: {
            type: String,
            trim: true,
            maxlength: 100
        },
        description: {
            type: String,
            trim: true,
            maxlength: 500
        },
        avatar: String,
        isPublic: {
            type: Boolean,
            default: false
        }
    },
    lastMessage: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Message'
    },
    metadata: {
        unreadCount: {
            type: Map,
            of: Number,
            default: new Map()
        },
        pinnedMessages: [{
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Message'
        }],
        customColor: String,
        archived: {
            type: Map,
            of: Boolean,
            default: new Map()
        }
    },
    settings: {
        onlyAdminsCanPost: {
            type: Boolean,
            default: false
        },
        onlyAdminsCanAddMembers: {
            type: Boolean,
            default: false
        },
        onlyAdminsCanChangeInfo: {
            type: Boolean,
            default: true
        },
        disappearingMessages: {
            enabled: {
                type: Boolean,
                default: false
            },
            duration: {
                type: Number, // Duration in hours
                default: 24
            }
        }
    }
}, {
    timestamps: true
});

// Indexes for better query performance
conversationSchema.index({ 'participants.user': 1 });
conversationSchema.index({ type: 1 });
conversationSchema.index({ 'groupInfo.isPublic': 1 });
conversationSchema.index({ updatedAt: -1 });

// Virtual for checking if a user is admin
conversationSchema.methods.isAdmin = function(userId) {
    const participant = this.participants.find(
        p => p.user.toString() === userId.toString()
    );
    return participant?.role === 'admin';
};

// Virtual for checking if a user is participant
conversationSchema.methods.isParticipant = function(userId) {
    return this.participants.some(
        p => p.user.toString() === userId.toString()
    );
};

// Method to update unread count
conversationSchema.methods.updateUnreadCount = async function(userId, increment = true) {
    const count = this.metadata.unreadCount.get(userId.toString()) || 0;
    this.metadata.unreadCount.set(
        userId.toString(),
        increment ? count + 1 : 0
    );
    await this.save();
};

// Method to add participant
conversationSchema.methods.addParticipant = async function(userId, role = 'member') {
    if (!this.isParticipant(userId)) {
        this.participants.push({
            user: userId,
            role,
            joinedAt: new Date()
        });
        await this.save();
    }
};

// Method to remove participant
conversationSchema.methods.removeParticipant = async function(userId) {
    const index = this.participants.findIndex(
        p => p.user.toString() === userId.toString()
    );
    if (index !== -1) {
        this.participants.splice(index, 1);
        await this.save();
    }
};

// Method to update participant role
conversationSchema.methods.updateParticipantRole = async function(userId, newRole) {
    const participant = this.participants.find(
        p => p.user.toString() === userId.toString()
    );
    if (participant) {
        participant.role = newRole;
        await this.save();
    }
};

const Conversation = mongoose.models.Conversation || mongoose.model('Conversation', conversationSchema);

export default Conversation;
