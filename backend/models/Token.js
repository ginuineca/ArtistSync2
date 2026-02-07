import mongoose from 'mongoose';

const tokenSchema = new mongoose.Schema({
    token: {
        type: String,
        required: true,
        index: true
    },
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    type: {
        type: String,
        enum: ['access', 'refresh'],
        required: true
    },
    expires: {
        type: Date,
        required: true,
        index: true
    },
    blacklisted: {
        type: Boolean,
        default: false
    }
}, {
    timestamps: true
});

// Create TTL index on expires field
tokenSchema.index({ expires: 1 }, { expireAfterSeconds: 0 });

const Token = mongoose.model('Token', tokenSchema);

export default Token;
