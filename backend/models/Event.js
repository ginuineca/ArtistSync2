import mongoose from 'mongoose';

const ticketTierSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    price: {
        type: Number,
        required: true,
        min: 0
    },
    quantity: {
        type: Number,
        required: true,
        min: 0
    },
    quantitySold: {
        type: Number,
        default: 0
    },
    description: String,
    benefits: [String]
});

const eventSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true,
        trim: true
    },
    description: {
        type: String,
        required: true
    },
    venue: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Profile',
        required: true
    },
    artists: [{
        artist: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Profile'
        },
        setTime: {
            start: Date,
            end: Date
        },
        status: {
            type: String,
            enum: ['invited', 'confirmed', 'declined'],
            default: 'invited'
        },
        payment: {
            amount: Number,
            currency: {
                type: String,
                default: 'USD'
            },
            status: {
                type: String,
                enum: ['pending', 'paid', 'cancelled'],
                default: 'pending'
            }
        }
    }],
    date: {
        start: {
            type: Date,
            required: true
        },
        end: {
            type: Date,
            required: true
        },
        doorsOpen: Date
    },
    status: {
        type: String,
        enum: ['draft', 'published', 'cancelled', 'completed'],
        default: 'draft'
    },
    ticketing: {
        enabled: {
            type: Boolean,
            default: true
        },
        tiers: [ticketTierSchema],
        maxTicketsPerPurchase: {
            type: Number,
            default: 10
        }
    },
    categories: [{
        type: String,
        enum: ['concert', 'festival', 'club_night', 'private_event', 'workshop', 'other']
    }],
    genres: [{
        type: String
    }],
    media: {
        coverImage: String,
        images: [String],
        videos: [{
            url: String,
            title: String,
            thumbnail: String
        }]
    },
    ageRestriction: {
        type: String,
        enum: ['all_ages', '18+', '21+'],
        default: 'all_ages'
    },
    visibility: {
        type: String,
        enum: ['public', 'private', 'unlisted'],
        default: 'public'
    },
    capacity: {
        type: Number,
        required: true,
        min: 1
    },
    meta: {
        views: {
            type: Number,
            default: 0
        },
        likes: {
            type: Number,
            default: 0
        },
        shares: {
            type: Number,
            default: 0
        }
    },
    // Track who liked this event
    likedBy: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }],
    settings: {
        allowComments: {
            type: Boolean,
            default: true
        },
        showGuestList: {
            type: Boolean,
            default: false
        },
        showAttendees: {
            type: Boolean,
            default: true
        }
    },
    location: {
        type: {
            type: String,
            enum: ['Point'],
            default: 'Point'
        },
        coordinates: {
            type: [Number],
            default: [0, 0]
        },
        address: {
            street: String,
            city: String,
            state: String,
            country: String,
            postalCode: String
        }
    }
}, {
    timestamps: true
});

// Indexes for better query performance
eventSchema.index({ 'date.start': 1 });
eventSchema.index({ venue: 1 });
eventSchema.index({ 'artists.artist': 1 });
eventSchema.index({ status: 1 });
eventSchema.index({ categories: 1 });
eventSchema.index({ genres: 1 });
eventSchema.index({ 'location.coordinates': '2dsphere' });
eventSchema.index({ visibility: 1 });

// Virtual for checking if event is sold out
eventSchema.virtual('isSoldOut').get(function() {
    if (!this.ticketing.enabled) return false;
    return this.ticketing.tiers.every(tier => tier.quantitySold >= tier.quantity);
});

// Virtual for total tickets available
eventSchema.virtual('totalTicketsAvailable').get(function() {
    if (!this.ticketing.enabled) return 0;
    return this.ticketing.tiers.reduce((total, tier) => {
        return total + (tier.quantity - tier.quantitySold);
    }, 0);
});

// Virtual for checking if event has started
eventSchema.virtual('hasStarted').get(function() {
    return new Date() >= this.date.start;
});

// Virtual for checking if event has ended
eventSchema.virtual('hasEnded').get(function() {
    return new Date() >= this.date.end;
});

const Event = mongoose.models.Event || mongoose.model('Event', eventSchema);

export default Event;
