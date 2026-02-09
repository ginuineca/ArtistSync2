import mongoose from 'mongoose';

const profileSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        unique: true
    },
    profileType: {
        type: String,
        enum: ['artist', 'venue'],
        required: true
    },
    // Common fields for both artist and venue
    name: {
        type: String,
        required: true
    },
    description: {
        type: String,
        default: ''
    },
    profilePicture: {
        type: String,
        default: ''
    },
    coverImage: {
        type: String,
        default: ''
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
    },
    // Artist-specific fields
    artistDetails: {
        genres: [{
            type: String
        }],
        instruments: [{
            type: String
        }],
        performanceTypes: [{
            type: String
        }],
        pricing: {
            hourlyRate: Number,
            minimumBookingHours: Number,
            currency: {
                type: String,
                default: 'USD'
            }
        },
        portfolio: [{
            type: {
                type: String,
                enum: ['audio', 'video', 'image']
            },
            title: String,
            description: String,
            url: String,
            thumbnailUrl: String,
            uploadDate: Date
        }],
        availability: [{
            day: {
                type: String,
                enum: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
            },
            available: Boolean,
            hours: [{
                start: String,
                end: String
            }]
        }]
    },
    // Venue-specific fields
    venueDetails: {
        capacity: Number,
        amenities: [{
            type: String
        }],
        eventTypes: [{
            type: String
        }],
        pricing: {
            basePrice: Number,
            currency: {
                type: String,
                default: 'USD'
            }
        },
        facilities: [{
            name: String,
            description: String,
            quantity: Number
        }],
        rules: [{
            type: String
        }]
    },
    socialLinks: {
        website: String,
        facebook: String,
        twitter: String,
        instagram: String,
        youtube: String,
        spotify: String,
        soundcloud: String
    },
    stats: {
        totalBookings: {
            type: Number,
            default: 0
        },
        rating: {
            type: Number,
            default: 0,
            min: 0,
            max: 5
        },
        reviewCount: {
            type: Number,
            default: 0
        },
        followers: {
            type: Number,
            default: 0
        },
        profileViews: {
            type: Number,
            default: 0
        }
    },
    // Track who viewed this profile
    views: [{
        viewer: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        },
        viewedAt: {
            type: Date,
            default: Date.now
        }
    }],
    visibility: {
        isPublic: {
            type: Boolean,
            default: true
        },
        showContactInfo: {
            type: Boolean,
            default: true
        },
        showPricing: {
            type: Boolean,
            default: true
        }
    }
}, {
    timestamps: true
});

// Add indexes for better query performance
profileSchema.index({ user: 1 });
profileSchema.index({ 'location.coordinates': '2dsphere' });
profileSchema.index({ profileType: 1 });
profileSchema.index({ 'artistDetails.genres': 1 });
profileSchema.index({ 'stats.rating': -1 });

const Profile = mongoose.models.Profile || mongoose.model('Profile', profileSchema);

export default Profile;
