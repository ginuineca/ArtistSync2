import Joi from 'joi';

const loginSchema = Joi.object({
    email: Joi.string()
        .email()
        .required()
        .messages({
            'string.email': 'Please provide a valid email address',
            'any.required': 'Email is required'
        }),
    password: Joi.string()
        .required()
        .messages({
            'any.required': 'Password is required'
        })
});

const profileSchema = Joi.object({
    name: Joi.string()
        .min(2)
        .max(100)
        .required()
        .messages({
            'string.min': 'Name must be at least 2 characters long',
            'string.max': 'Name cannot exceed 100 characters',
            'any.required': 'Name is required'
        }),
    bio: Joi.string()
        .max(500)
        .allow('')
        .optional()
        .messages({
            'string.max': 'Bio cannot exceed 500 characters'
        }),
    location: Joi.string()
        .max(100)
        .allow('')
        .optional()
        .messages({
            'string.max': 'Location cannot exceed 100 characters'
        })
});

const eventSchema = Joi.object({
    title: Joi.string()
        .min(3)
        .max(200)
        .required()
        .messages({
            'string.min': 'Title must be at least 3 characters long',
            'string.max': 'Title cannot exceed 200 characters',
            'any.required': 'Title is required'
        }),
    description: Joi.string()
        .min(10)
        .max(2000)
        .required()
        .messages({
            'string.min': 'Description must be at least 10 characters long',
            'string.max': 'Description cannot exceed 2000 characters',
            'any.required': 'Description is required'
        }),
    date: Joi.object({
        start: Joi.date()
            .greater('now')
            .required()
            .messages({
                'date.greater': 'Start date must be in the future',
                'any.required': 'Start date is required'
            }),
        end: Joi.date()
            .greater(Joi.ref('start'))
            .required()
            .messages({
                'date.greater': 'End date must be after start date',
                'any.required': 'End date is required'
            }),
        doorsOpen: Joi.date()
            .greater('now')
            .less(Joi.ref('start'))
            .optional()
            .messages({
                'date.greater': 'Doors open time must be in the future',
                'date.less': 'Doors open time must be before event start'
            })
    }).required(),
    categories: Joi.array()
        .items(Joi.string().valid('concert', 'festival', 'club_night', 'private_event', 'workshop', 'other'))
        .min(1)
        .required()
        .messages({
            'array.min': 'At least one category is required',
            'any.required': 'Categories are required'
        }),
    genres: Joi.array()
        .items(Joi.string())
        .min(1)
        .required()
        .messages({
            'array.min': 'At least one genre is required',
            'any.required': 'Genres are required'
        }),
    capacity: Joi.number()
        .integer()
        .min(1)
        .required()
        .messages({
            'number.base': 'Capacity must be a number',
            'number.min': 'Capacity must be at least 1',
            'any.required': 'Capacity is required'
        }),
    ageRestriction: Joi.string()
        .valid('all_ages', '18+', '21+')
        .required()
        .messages({
            'any.only': 'Invalid age restriction',
            'any.required': 'Age restriction is required'
        }),
    ticketing: Joi.object({
        enabled: Joi.boolean().default(true),
        tiers: Joi.array().items(Joi.object({
            name: Joi.string().required(),
            price: Joi.number().min(0).required(),
            quantity: Joi.number().integer().min(0).required(),
            description: Joi.string().optional(),
            benefits: Joi.array().items(Joi.string()).optional()
        })).min(1).when('enabled', {
            is: true,
            then: Joi.required()
        }),
        maxTicketsPerPurchase: Joi.number().integer().min(1).default(10)
    }).required(),
    visibility: Joi.string()
        .valid('public', 'private', 'unlisted')
        .default('public')
});

const reviewSchema = Joi.object({
    target: Joi.string()
        .pattern(/^[0-9a-fA-F]{24}$/)
        .required()
        .messages({
            'string.pattern.base': 'Invalid target ID format',
            'any.required': 'Target ID is required'
        }),
    targetType: Joi.string()
        .valid('artist', 'venue')
        .required()
        .messages({
            'any.only': 'Target type must be either artist or venue',
            'any.required': 'Target type is required'
        }),
    event: Joi.string()
        .pattern(/^[0-9a-fA-F]{24}$/)
        .optional()
        .messages({
            'string.pattern.base': 'Invalid event ID format'
        }),
    rating: Joi.number()
        .min(1)
        .max(5)
        .required()
        .messages({
            'number.min': 'Rating must be at least 1',
            'number.max': 'Rating cannot exceed 5',
            'any.required': 'Rating is required'
        }),
    title: Joi.string()
        .min(3)
        .max(100)
        .required()
        .messages({
            'string.min': 'Title must be at least 3 characters long',
            'string.max': 'Title cannot exceed 100 characters',
            'any.required': 'Title is required'
        }),
    content: Joi.string()
        .min(10)
        .max(1000)
        .required()
        .messages({
            'string.min': 'Content must be at least 10 characters long',
            'string.max': 'Content cannot exceed 1000 characters',
            'any.required': 'Content is required'
        })
});

const conversationSchema = Joi.object({
    type: Joi.string()
        .valid('direct', 'group')
        .required()
        .messages({
            'any.only': 'Conversation type must be either direct or group',
            'any.required': 'Conversation type is required'
        }),
    participants: Joi.array()
        .items(Joi.string().pattern(/^[0-9a-fA-F]{24}$/))
        .min(2)
        .required()
        .messages({
            'array.min': 'At least two participants are required',
            'any.required': 'Participants are required',
            'string.pattern.base': 'Invalid participant ID format'
        }),
    name: Joi.string()
        .when('type', {
            is: 'group',
            then: Joi.required(),
            otherwise: Joi.forbidden()
        })
        .messages({
            'any.required': 'Group name is required for group conversations',
            'any.forbidden': 'Name is not allowed for direct conversations'
        })
});

const messageSchema = Joi.object({
    content: Joi.string()
        .max(2000)
        .when('attachments', {
            is: Joi.exist(),
            then: Joi.optional(),
            otherwise: Joi.required()
        })
        .messages({
            'string.max': 'Message content cannot exceed 2000 characters',
            'any.required': 'Message content is required when no attachments are present'
        }),
    replyTo: Joi.string()
        .pattern(/^[0-9a-fA-F]{24}$/)
        .optional()
        .messages({
            'string.pattern.base': 'Invalid reply message ID format'
        })
});

export const validateLoginInput = (req, res, next) => {
    try {
        const { error } = loginSchema.validate(req.body, { abortEarly: false });
        if (error) {
            const errors = error.details.map(detail => ({
                field: detail.path[0],
                message: detail.message
            }));
            return res.status(400).json({ errors });
        }
        next();
    } catch (error) {
        next(error);
    }
};

export const validateProfileUpdate = (req, res, next) => {
    try {
        const { error } = profileSchema.validate(req.body, { abortEarly: false });
        if (error) {
            const errors = error.details.map(detail => ({
                field: detail.path[0],
                message: detail.message
            }));
            return res.status(400).json({ errors });
        }
        next();
    } catch (error) {
        next(error);
    }
};

export const validateEvent = (req, res, next) => {
    try {
        const { error } = eventSchema.validate(req.body, { abortEarly: false });
        if (error) {
            const errors = error.details.map(detail => ({
                field: detail.path.join('.'),
                message: detail.message
            }));
            return res.status(400).json({ errors });
        }
        next();
    } catch (error) {
        next(error);
    }
};

export const validateReview = (req, res, next) => {
    try {
        const { error } = reviewSchema.validate(req.body, { abortEarly: false });
        if (error) {
            const errors = error.details.map(detail => ({
                field: detail.path.join('.'),
                message: detail.message
            }));
            return res.status(400).json({ errors });
        }
        next();
    } catch (error) {
        next(error);
    }
};

export const validateConversation = (req, res, next) => {
    try {
        const { error } = conversationSchema.validate(req.body, { abortEarly: false });
        if (error) {
            const errors = error.details.map(detail => ({
                field: detail.path.join('.'),
                message: detail.message
            }));
            return res.status(400).json({ errors });
        }
        next();
    } catch (error) {
        next(error);
    }
};

export const validateMessage = (req, res, next) => {
    try {
        const { error } = messageSchema.validate(req.body, { abortEarly: false });
        if (error) {
            const errors = error.details.map(detail => ({
                field: detail.path.join('.'),
                message: detail.message
            }));
            return res.status(400).json({ errors });
        }
        next();
    } catch (error) {
        next(error);
    }
};
