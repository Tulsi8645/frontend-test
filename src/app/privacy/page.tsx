import Link from 'next/link';
import { Bot, Shield, Mail, Database, Lock, Eye, Trash2, FileText } from 'lucide-react';

export const metadata = {
    title: 'Privacy Policy | Sales AI Bot',
    description: 'Privacy policy for Sales AI Bot - How we collect, use, and protect your data.',
};

export default function PrivacyPolicyPage() {
    return (
        <main className="min-h-screen bg-zinc-950 text-zinc-100">
            {/* Header */}
            <nav className="fixed top-0 left-0 right-0 z-50 bg-zinc-950/80 backdrop-blur-xl border-b border-zinc-800">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center justify-between h-16">
                        <Link href="/" className="flex items-center gap-2">
                            <div className="w-8 h-8 bg-emerald-600 rounded-lg flex items-center justify-center">
                                <Bot className="w-5 h-5 text-white" />
                            </div>
                            <span className="font-bold text-xl">Sales AI Bot</span>
                        </Link>
                        <Link href="/" className="text-sm text-zinc-400 hover:text-white transition-colors">
                            Back to Home
                        </Link>
                    </div>
                </div>
            </nav>

            {/* Content */}
            <div className="pt-32 pb-20 px-4">
                <div className="max-w-3xl mx-auto">
                    {/* Title */}
                    <div className="text-center mb-12">
                        <div className="w-16 h-16 bg-emerald-600/20 rounded-2xl flex items-center justify-center mx-auto mb-6">
                            <Shield className="w-8 h-8 text-emerald-400" />
                        </div>
                        <h1 className="text-4xl font-bold mb-4">Privacy Policy</h1>
                        <p className="text-zinc-400">Last updated: April 4, 2026</p>
                    </div>

                    {/* Introduction */}
                    <section className="mb-10">
                        <p className="text-zinc-300 leading-relaxed">
                            Sales AI Bot ("we," "our," or "us") is committed to protecting your privacy. 
                            This Privacy Policy explains how we collect, use, disclose, and safeguard your 
                            information when you use our AI-powered chatbot service through Facebook Messenger, 
                            Instagram Direct, WhatsApp, and our website chat widget.
                        </p>
                    </section>

                    {/* Information We Collect */}
                    <section className="mb-10">
                        <div className="flex items-center gap-3 mb-4">
                            <Database className="w-6 h-6 text-emerald-400" />
                            <h2 className="text-2xl font-semibold">Information We Collect</h2>
                        </div>
                        <div className="space-y-4 text-zinc-300">
                            <p><strong className="text-white">Messages and Conversations:</strong> We store chat messages between users and our AI bot to provide conversational context and improve responses.</p>
                            <p><strong className="text-white">User Profile Information:</strong> When available through messaging platforms (Facebook, Instagram, WhatsApp), we may collect your name and profile information to personalize conversations.</p>
                            <p><strong className="text-white">Technical Information:</strong> We collect session IDs, device information, and timestamps to maintain service quality and security.</p>
                            <p><strong className="text-white">Business Information:</strong> For businesses using our service, we collect company name, contact details, and configuration settings.</p>
                        </div>
                    </section>

                    {/* How We Use Information */}
                    <section className="mb-10">
                        <div className="flex items-center gap-3 mb-4">
                            <Eye className="w-6 h-6 text-emerald-400" />
                            <h2 className="text-2xl font-semibold">How We Use Your Information</h2>
                        </div>
                        <ul className="space-y-3 text-zinc-300 list-disc list-inside">
                            <li>To provide AI-powered chat responses and customer support</li>
                            <li>To enable human handover when requested by users or businesses</li>
                            <li>To maintain conversation history for context-aware responses</li>
                            <li>To improve our AI models and service quality</li>
                            <li>To send administrative communications and service updates</li>
                            <li>To prevent fraud and ensure platform security</li>
                        </ul>
                    </section>

                    {/* Data Storage */}
                    <section className="mb-10">
                        <div className="flex items-center gap-3 mb-4">
                            <Lock className="w-6 h-6 text-emerald-400" />
                            <h2 className="text-2xl font-semibold">Data Storage and Security</h2>
                        </div>
                        <div className="space-y-4 text-zinc-300">
                            <p>We implement industry-standard security measures to protect your data:</p>
                            <ul className="space-y-2 list-disc list-inside">
                                <li>All data is encrypted in transit using TLS/SSL</li>
                                <li>Database connections are secured and access-controlled</li>
                                <li>API credentials are encrypted at rest</li>
                                <li>Regular security audits and monitoring</li>
                                <li>Limited employee access to user data on a need-to-know basis</li>
                            </ul>
                        </div>
                    </section>

                    {/* Data Retention */}
                    <section className="mb-10">
                        <div className="flex items-center gap-3 mb-4">
                            <Trash2 className="w-6 h-6 text-emerald-400" />
                            <h2 className="text-2xl font-semibold">Data Retention</h2>
                        </div>
                        <p className="text-zinc-300 leading-relaxed">
                            Chat messages and conversation history are retained for up to 90 days, 
                            after which they are automatically deleted. Business account information 
                            is retained as long as the account is active. Upon account deletion, 
                            all associated data is permanently removed within 30 days.
                        </p>
                    </section>

                    {/* Your Rights */}
                    <section className="mb-10">
                        <div className="flex items-center gap-3 mb-4">
                            <FileText className="w-6 h-6 text-emerald-400" />
                            <h2 className="text-2xl font-semibold">Your Rights</h2>
                        </div>
                        <p className="text-zinc-300 mb-4">You have the right to:</p>
                        <ul className="space-y-2 text-zinc-300 list-disc list-inside">
                            <li>Access your personal data stored in our systems</li>
                            <li>Request correction of inaccurate information</li>
                            <li>Request deletion of your data</li>
                            <li>Opt-out of non-essential data processing</li>
                            <li>Export your conversation history</li>
                        </ul>
                    </section>

                    {/* Third Parties */}
                    <section className="mb-10">
                        <h2 className="text-2xl font-semibold mb-4">Third-Party Services</h2>
                        <p className="text-zinc-300 leading-relaxed">
                            We use trusted third-party services to operate our platform:
                        </p>
                        <ul className="space-y-2 mt-3 text-zinc-300 list-disc list-inside">
                            <li><strong className="text-white">Google Gemini:</strong> AI processing for generating chat responses</li>
                            <li><strong className="text-white">Meta (Facebook/Instagram):</strong> Messaging platform integration</li>
                            <li><strong className="text-white">Twilio:</strong> WhatsApp messaging services</li>
                            <li><strong className="text-white">MongoDB Atlas:</strong> Secure data storage</li>
                        </ul>
                        <p className="text-zinc-300 mt-4">
                            Each third-party service has their own privacy policy governing their use of your information.
                        </p>
                    </section>

                    {/* Contact */}
                    <section className="mb-10">
                        <div className="flex items-center gap-3 mb-4">
                            <Mail className="w-6 h-6 text-emerald-400" />
                            <h2 className="text-2xl font-semibold">Contact Us</h2>
                        </div>
                        <p className="text-zinc-300 mb-4">
                            If you have questions about this Privacy Policy or want to exercise your data rights, 
                            please contact us:
                        </p>
                        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
                            <p className="text-zinc-300">
                                <strong className="text-white">Sales AI Bot</strong><br />
                                Email: tulsi.gautam0000@gmail.com<br />
                                Website: https://app.tecobit.cloud
                            </p>
                        </div>
                    </section>

                    {/* Footer */}
                    <div className="border-t border-zinc-800 pt-8 mt-12">
                        <p className="text-zinc-500 text-sm text-center">
                            By using Sales AI Bot, you agree to this Privacy Policy and our Terms of Service.
                        </p>
                    </div>
                </div>
            </div>
        </main>
    );
}
