import mongoose from 'mongoose';
import mongoosePaginate from 'mongoose-paginate-v2';

const commentSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  text: {
    type: String,
    required: [true, 'Please add a comment'],
    trim: true,
    maxlength: [300, 'Comment cannot be more than 300 characters']
  },
  name: {
    type: String,
    required: true
  }
}, {
  timestamps: true
});

const musicSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Title is required'],
    trim: true,
    maxlength: [100, 'Title cannot be more than 100 characters']
  },
  description: {
    type: String,
    trim: true,
    maxlength: [500, 'Description cannot be more than 500 characters']
  },
  artist: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  genre: {
    type: String,
    required: [true, 'Genre is required'],
    enum: {
      values: ['pop', 'rock', 'jazz', 'classical', 'electronic', 'hip-hop', 'r&b', 'country', 'other'],
      message: '{VALUE} is not a supported genre'
    }
  },
  filePath: {
    type: String,
    required: [true, 'File path is required']
  },
  fileName: {
    type: String,
    required: [true, 'File name is required']
  },
  coverArt: {
    type: String,
    default: null
  },
  fileHash: {
    type: String,
    unique: true,
    sparse: true  // Allow multiple null values
  },
  duration: {
    type: Number,
    min: [0, 'Duration must be a positive number']
  },
  plays: {
    type: Number,
    default: 0,
    min: [0, 'Plays cannot be negative']
  },
  likes: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  comments: [commentSchema],
  isPublic: {
    type: Boolean,
    default: true
  },
  tags: [{
    type: String,
    trim: true
  }]
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual for like count
musicSchema.virtual('likeCount').get(function() {
  return this.likes.length;
});

// Virtual for comment count
musicSchema.virtual('commentCount').get(function() {
  return this.comments.length;
});

// Pre-save middleware to ensure required fields
musicSchema.pre('save', function(next) {
  if (!this.description) {
    this.description = `${this.title} by ${this.artist.name}`;
  }
  next();
});

// Method to increment play count
musicSchema.methods.incrementPlays = async function() {
  this.plays += 1;
  return this.save();
};

// Static method to get popular music
musicSchema.statics.getPopular = function(limit = 10) {
  return this.find()
    .sort('-plays -likes')
    .limit(limit)
    .populate('artist', 'name');
};

// Only create indexes in non-test environment
if (process.env.NODE_ENV !== 'test') {
  // Indexes for better query performance
  musicSchema.index({ artist: 1, createdAt: -1 });
  musicSchema.index({ genre: 1 });
  musicSchema.index({ title: 'text', description: 'text', tags: 'text' });
}

// Add pagination plugin
musicSchema.plugin(mongoosePaginate);

// Add text index for search
musicSchema.index({ title: 'text', description: 'text', tags: 'text' });

const Music = mongoose.model('Music', musicSchema);

export default Music;
