import mongoose, { Schema, Document, Types } from 'mongoose';

// Types of knowledge entries - generic for any business
export type KnowledgeType = 'sentence' | 'key_value' | 'product' | 'service' | 'business_info' | 'list' | 'faq';

// Base interface for all knowledge entries
export interface IKnowledge extends Document {
    businessId: Types.ObjectId;
    type: KnowledgeType;
    key: string;           // Unique identifier/key for the knowledge
    value: any;            // The actual value (flexible based on type)
    category?: string;     // Optional category for organization
    tags?: string[];       // Optional tags for filtering
    priority?: number;     // Priority for display/retrieval (higher = more important)
    isActive: boolean;     // Whether this knowledge is active
    metadata?: Record<string, any>; // Additional flexible metadata
    createdAt: Date;
    updatedAt: Date;
}

// Schema definition with flexible value field
const KnowledgeSchema = new Schema<IKnowledge>(
    {
        businessId: {
            type: Schema.Types.ObjectId,
            ref: 'Business',
            required: true,
            index: true,
        },
        type: {
            type: String,
            enum: ['sentence', 'key_value', 'product', 'service', 'business_info', 'list', 'faq'],
            required: true,
        },
        key: {
            type: String,
            required: true,
        },
        value: {
            type: Schema.Types.Mixed,
            required: true,
        },
        category: {
            type: String,
            default: 'general',
        },
        tags: {
            type: [String],
            default: [],
        },
        priority: {
            type: Number,
            default: 0,
        },
        isActive: {
            type: Boolean,
            default: true,
        },
        metadata: {
            type: Schema.Types.Mixed,
            default: {},
        },
    },
    {
        timestamps: true,
    }
);

// Index for faster queries
KnowledgeSchema.index({ businessId: 1, key: 1 }, { unique: true });
KnowledgeSchema.index({ businessId: 1, category: 1, isActive: 1 });
KnowledgeSchema.index({ businessId: 1, tags: 1 });
KnowledgeSchema.index({ businessId: 1, type: 1, isActive: 1 });

/**
 * Helper function to convert knowledge entries to JSON format for AI processing.
 * This transforms database entries into a format the AI can easily understand.
 * 
 * Output format:
 * - sentence/key_value/business_info/faq: { key: value }
 * - product: { products: [...] }
 * - service: { services: [...] }
 * - list: { key: [...] }
 */
export function knowledgeToJSONFormat(entries: IKnowledge[]): Record<string, any> {
    const result: Record<string, any> = {};
    const products: any[] = [];
    const services: any[] = [];

    for (const entry of entries) {
        if (!entry.isActive) continue;

        switch (entry.type) {
            case 'sentence':
            case 'key_value':
            case 'business_info':
            case 'faq':
                result[entry.key] = entry.value;
                break;
            case 'product':
                products.push(entry.value);
                break;
            case 'service':
                services.push(entry.value);
                break;
            case 'list':
                if (!result[entry.key]) {
                    result[entry.key] = [];
                }
                if (Array.isArray(entry.value)) {
                    result[entry.key].push(...entry.value);
                } else {
                    result[entry.key].push(entry.value);
                }
                break;
        }
    }

    // Add products and services arrays if any exist
    if (products.length > 0) {
        result.products = products;
    }
    if (services.length > 0) {
        result.services = services;
    }

    return result;
}

/**
 * Helper function to format a product entry
 */
export function createProductEntry(
    name: string,
    price: number | string,
    description?: string,
    category?: string,
    inStock?: boolean,
    metadata?: Record<string, any>
): Record<string, any> {
    return {
        name,
        price,
        description,
        category,
        inStock,
        ...metadata,
    };
}

/**
 * Helper function to format a service entry
 */
export function createServiceEntry(
    name: string,
    price: number | string,
    description?: string,
    duration?: string,
    category?: string,
    metadata?: Record<string, any>
): Record<string, any> {
    return {
        name,
        price,
        description,
        duration,
        category,
        ...metadata,
    };
}

// Get or create the model
const Knowledge = mongoose.models.Knowledge || mongoose.model<IKnowledge>('Knowledge', KnowledgeSchema);

export default Knowledge;
