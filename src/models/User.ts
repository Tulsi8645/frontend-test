import mongoose, { Schema, Document, Types } from 'mongoose';
import crypto from 'crypto';

export interface IUser extends Document {
    username: string;
    passwordHash: string;
    role: 'superadmin' | 'admin' | 'user';
    businessId?: Types.ObjectId;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
    verifyPassword(password: string): boolean;
}

const UserSchema = new Schema<IUser>(
    {
        username: {
            type: String,
            required: true,
            unique: true,
            trim: true,
            lowercase: true,
        },
        passwordHash: {
            type: String,
            required: true,
        },
        role: {
            type: String,
            enum: ['superadmin', 'admin', 'user'],
            default: 'user',
        },
        businessId: {
            type: Schema.Types.ObjectId,
            ref: 'Business',
        },
        isActive: {
            type: Boolean,
            default: true,
        },
    },
    {
        timestamps: true,
    }
);

// Index for faster multi-tenant querying
UserSchema.index({ businessId: 1 });

// Hash password using SHA-256 (simple hash for demo purposes)
UserSchema.methods.verifyPassword = function (password: string): boolean {
    const hash = crypto.createHash('sha256').update(password).digest('hex');
    return this.passwordHash === hash;
};

// Static method to hash password
export function hashPassword(password: string): string {
    return crypto.createHash('sha256').update(password).digest('hex');
}

const User = mongoose.models.User || mongoose.model<IUser>('User', UserSchema);

export default User;
