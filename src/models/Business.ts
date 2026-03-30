import mongoose, { Schema, Document, Types, Model } from 'mongoose';
import crypto from 'crypto';

export interface IBusiness extends Document {
    name: string;
    slug: string;
    description?: string;
    website?: string;
    email: string;
    phone?: string;
    address?: {
        street?: string;
        city?: string;
        state?: string;
        zip?: string;
        country?: string;
    };
    status: 'pending' | 'verified' | 'suspended';
    apiKey?: string;
    apiSecret?: string;
    adminUserId?: Types.ObjectId;
    settings: {
        enableAI: boolean;
        allowHumanHandover: boolean;
        customWelcomeMessage?: string;
        themeColor?: string;
    };
    createdAt: Date;
    updatedAt: Date;
    verifiedAt?: Date;
    verifiedBy?: Types.ObjectId;
    verifyApiSecret(secret: string): boolean;
    regenerateApiCredentials(): { apiKey: string; apiSecret: string };
}

export interface IBusinessModel extends Model<IBusiness> {
    findByApiKey(apiKey: string): Promise<IBusiness | null>;
    generateCredentials(): { apiKey: string; apiSecret: string };
}

const BusinessSchema = new Schema<IBusiness>(
    {
        name: {
            type: String,
            required: true,
            trim: true,
        },
        slug: {
            type: String,
            required: true,
            unique: true,
            lowercase: true,
            trim: true,
            index: true,
        },
        description: {
            type: String,
            trim: true,
        },
        website: {
            type: String,
            trim: true,
        },
        email: {
            type: String,
            required: true,
            unique: true,
            lowercase: true,
            trim: true,
        },
        phone: {
            type: String,
            trim: true,
        },
        address: {
            street: String,
            city: String,
            state: String,
            zip: String,
            country: String,
        },
        status: {
            type: String,
            enum: ['pending', 'verified', 'suspended'],
            default: 'pending',
        },
        apiKey: {
            type: String,
            unique: true,
            sparse: true,
            index: true,
        },
        apiSecret: {
            type: String,
        },
        adminUserId: {
            type: Schema.Types.ObjectId,
            ref: 'User',
        },
        settings: {
            enableAI: { type: Boolean, default: true },
            allowHumanHandover: { type: Boolean, default: true },
            customWelcomeMessage: { type: String },
            themeColor: { type: String, default: '#4f46e5' },
        },
        verifiedAt: {
            type: Date,
        },
        verifiedBy: {
            type: Schema.Types.ObjectId,
            ref: 'User',
        },
    },
    {
        timestamps: true,
    }
);

// Indexes
BusinessSchema.index({ status: 1, createdAt: -1 });

// Method to verify API secret
BusinessSchema.methods.verifyApiSecret = function (secret: string): boolean {
    return this.apiSecret === secret;
};

// Static method to find business by API key
BusinessSchema.statics.findByApiKey = function (apiKey: string) {
    return this.findOne({ apiKey, status: 'verified' });
};

// Static method to generate new API credentials
BusinessSchema.statics.generateCredentials = function () {
    return {
        apiKey: `pk_${crypto.randomBytes(24).toString('hex')}`,
        apiSecret: `sk_${crypto.randomBytes(32).toString('hex')}`
    };
};

// Generate new API credentials
BusinessSchema.methods.regenerateApiCredentials = function () {
    this.apiKey = `pk_${crypto.randomBytes(24).toString('hex')}`;
    this.apiSecret = `sk_${crypto.randomBytes(32).toString('hex')}`;
    return { apiKey: this.apiKey, apiSecret: this.apiSecret };
};

const Business = (mongoose.models.Business as IBusinessModel) || mongoose.model<IBusiness, IBusinessModel>('Business', BusinessSchema);

export default Business;
