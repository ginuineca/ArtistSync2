import mongoose from 'mongoose';

// Set global Mongoose options
mongoose.set('bufferTimeoutMS', 30000);

const artistSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Please add a name'],
        unique: true,
        trim: true,
        maxlength: [50, 'Name cannot be more than 50 characters']
    },
    bio: {
        type: String,
        required: [true, 'Please add a bio'],
        trim: true,
        maxlength: [500, 'Bio cannot be more than 500 characters']
    },
    genres: [{
        type: String,
        required: [true, 'Please add at least one genre']
    }],
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    }
}, {
    timestamps: true
});

artistSchema.pre('save', function(next) {
    this.updatedAt = Date.now();
    next();
});

const Artist = mongoose.model('Artist', artistSchema);
export { Artist };
