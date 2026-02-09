import mongoose from 'mongoose';

const bookingSchema = new mongoose.Schema({
    // Event booking
    event: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Event',
        required: true
    },
    // Who is booking (venue or event organizer)
    booker: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    // Artist being booked
    artist: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Profile',
        required: true
    },
    // Booking details
    status: {
        type: String,
        enum: ['pending', 'accepted', 'declined', 'cancelled', 'completed'],
        default: 'pending'
    },
    // Performance details
    performance: {
        date: {
            type: Date,
            required: true
        },
        startTime: String,
        endTime: String,
        setDuration: Number, // in minutes
        paymentAmount: {
            amount: Number,
            currency: {
                type: String,
                default: 'USD'
            }
        },
        riderRequirements: [String],
        equipmentNeeded: [String]
    },
    // Payment info
    payment: {
        status: {
            type: String,
            enum: ['unpaid', 'partial', 'paid', 'refunded'],
            default: 'unpaid'
        },
        paidAmount: {
            type: Number,
            default: 0
        },
        paymentMethod: String,
        paymentDate: Date,
        transactionId: String
    },
    // Messages/negotiations
    messages: [{
        sender: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        },
        message: String,
        timestamp: {
            type: Date,
            default: Date.now
        }
    }],
    // Contract
    contract: {
        agreed: {
            type: Boolean,
            default: false
        },
        agreedAt: Date,
        terms: String
    }
}, {
    timestamps: true
});

// Indexes for better query performance
bookingSchema.index({ event: 1 });
bookingSchema.index({ booker: 1 });
bookingSchema.index({ artist: 1 });
bookingSchema.index({ status: 1 });
bookingSchema.index({ 'performance.date': 1 });

// Virtual for checking if booking is upcoming
bookingSchema.virtual('isUpcoming').get(function() {
    return this.performance.date > new Date() && this.status === 'accepted';
});

// Virtual for checking if booking can be cancelled
bookingSchema.virtual('canCancel').get(function() {
    return ['pending', 'accepted'].includes(this.status) && this.performance.date > new Date();
});

const Booking = mongoose.models.Booking || mongoose.model('Booking', bookingSchema);

export default Booking;
