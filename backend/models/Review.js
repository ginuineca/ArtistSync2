import mongoose from 'mongoose';

// Set global Mongoose options
mongoose.set('bufferTimeoutMS', 30000);

const reviewSchema = new mongoose.Schema({
    rating: {
        type: Number,
        required: [true, 'Please add a rating between 1 and 5'],
        min: 1,
        max: 5
    },
    content: {
        type: String,
        required: [true, 'Please add review content'],
        trim: true,
        maxlength: [1000, 'Review content cannot be more than 1000 characters']
    },
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    artistId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Artist',
        required: true
    },
    helpfulVotes: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }]
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

// Ensure a user can only review an artist once
reviewSchema.index({ userId: 1, artistId: 1 }, { unique: true });

export const Review = mongoose.model('Review', reviewSchema);
