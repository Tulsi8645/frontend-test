import mongoose, { Schema, Document, Types } from 'mongoose';

export interface IChatMessage {
    role: 'user' | 'bot' | 'admin';
    text: string;
    timestamp: Date;
    adminId?: string;
}

export type ChannelType = 'website' | 'facebook' | 'whatsapp';

export interface IChatSession extends Document {
    sessionId: string;
    businessId: Types.ObjectId;
    channel: ChannelType;
    externalId?: string;  // Facebook PSID or WhatsApp phone number
    pageId?: string;      // For Facebook pages
    status: 'active' | 'taken_over' | 'closed';
    messages: IChatMessage[];
    takenOverBy?: string;
    takenOverAt?: Date;
    userInfo?: {
        name?: string;     // From Facebook/WhatsApp
        userAgent?: string;
        ip?: string;
        referrer?: string;
    };
    createdAt: Date;
    updatedAt: Date;
    lastActivityAt: Date;
    expiresAt?: Date;
}

const ChatMessageSchema = new Schema<IChatMessage>({
    role: { type: String, enum: ['user', 'bot', 'admin'], required: true },
    text: { type: String, required: true },
    timestamp: { type: Date, default: Date.now },
    adminId: { type: String },
}, { _id: false });

const ChatSessionSchema = new Schema<IChatSession>(
    {
        sessionId: { type: String, required: true, unique: true, index: true },
        businessId: { type: Schema.Types.ObjectId, ref: 'Business', required: true, index: true },
        channel: { type: String, enum: ['website', 'facebook', 'whatsapp'], default: 'website' },
        externalId: { type: String },  // Facebook PSID or WhatsApp phone
        pageId: { type: String },        // For Facebook pages
        status: { type: String, enum: ['active', 'taken_over', 'closed'], default: 'active' },
        messages: [ChatMessageSchema],
        takenOverBy: { type: String },
        takenOverAt: { type: Date },
        userInfo: {
            name: String,
            userAgent: String,
            ip: String,
            referrer: String,
        },
        lastActivityAt: { type: Date, default: Date.now },
        expiresAt: { type: Date, default: () => new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) },
    },
    { timestamps: true }
);

// Indexes optimized for finding specific tenants' sessions
ChatSessionSchema.index({ businessId: 1, status: 1, lastActivityAt: -1 });
ChatSessionSchema.index({ businessId: 1, createdAt: -1 });
// TTL index - documents will be auto-deleted after expiresAt
ChatSessionSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

const ChatSession = mongoose.models.ChatSession || mongoose.model<IChatSession>('ChatSession', ChatSessionSchema);

export default ChatSession;
