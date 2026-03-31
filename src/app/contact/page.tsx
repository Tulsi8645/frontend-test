'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Bot, Mail, MapPin, Phone, Send, CheckCircle } from 'lucide-react';

export default function ContactPage() {
    const [submitted, setSubmitted] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        subject: '',
        message: ''
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitted(true);
    };

    return (
        <main className="min-h-screen bg-zinc-950 text-zinc-100 relative overflow-hidden">
            {/* Background Effects */}
            <div className="absolute inset-0">
                <div className="absolute top-0 left-1/4 w-96 h-96 bg-indigo-600/10 rounded-full blur-3xl"></div>
                <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-purple-600/10 rounded-full blur-3xl"></div>
            </div>
            <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:4rem_4rem]"></div>

            {/* Navigation */}
            <nav className="fixed top-0 left-0 right-0 z-50 bg-zinc-950/80 backdrop-blur-xl border-b border-zinc-800">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center justify-between h-16">
                        <Link href="/" className="flex items-center gap-2">
                            <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center">
                                <Bot className="w-5 h-5 text-white" />
                            </div>
                            <span className="font-bold text-xl">Sales AI</span>
                        </Link>
                        <div className="hidden md:flex items-center gap-8">
                            <Link href="/#features" className="text-sm text-zinc-400 hover:text-white transition-colors">Features</Link>
                            <Link href="/#pricing" className="text-sm text-zinc-400 hover:text-white transition-colors">Pricing</Link>
                            <Link href="/docs" className="text-sm text-zinc-400 hover:text-white transition-colors">Docs</Link>
                            <Link href="/contact" className="text-sm text-zinc-400 hover:text-white transition-colors">Contact</Link>
                        </div>
                        <div className="flex items-center gap-3">
                            <Link href="/business/login">
                                <Button variant="ghost" className="text-zinc-400 hover:text-white hover:bg-zinc-800">
                                    Sign In
                                </Button>
                            </Link>
                            <Link href="/business/signup">
                                <Button className="bg-indigo-600 hover:bg-indigo-700 text-white">
                                    Get Started
                                </Button>
                            </Link>
                        </div>
                    </div>
                </div>
            </nav>

            {/* Content */}
            <div className="relative pt-32 pb-20 px-4">
                <div className="max-w-6xl mx-auto">
                    <div className="text-center mb-16">
                        <h1 className="text-4xl md:text-5xl font-bold mb-4">
                            Get in{' '}
                            <span className="bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">
                                Touch
                            </span>
                        </h1>
                        <p className="text-xl text-zinc-400 max-w-2xl mx-auto">
                            Have questions? We&apos;d love to hear from you. Send us a message and we&apos;ll respond as soon as possible.
                        </p>
                    </div>

                    <div className="grid md:grid-cols-2 gap-12">
                        {/* Contact Info */}
                        <div className="space-y-8">
                            <div className="relative">
                                <div className="absolute -inset-1 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-2xl blur opacity-20"></div>
                                <div className="relative bg-zinc-900/80 backdrop-blur border border-zinc-800 rounded-2xl p-8">
                                    <h2 className="text-2xl font-bold mb-6">Contact Information</h2>
                                    
                                    <div className="space-y-6">
                                        <div className="flex items-start gap-4">
                                            <div className="w-12 h-12 bg-zinc-800 rounded-lg flex items-center justify-center flex-shrink-0">
                                                <Mail className="w-5 h-5 text-indigo-400" />
                                            </div>
                                            <div>
                                                <h3 className="font-semibold mb-1">Email</h3>
                                                <p className="text-zinc-400">support@tecobit.cloud</p>
                                                <p className="text-zinc-400">sales@tecobit.cloud</p>
                                            </div>
                                        </div>

                                        <div className="flex items-start gap-4">
                                            <div className="w-12 h-12 bg-zinc-800 rounded-lg flex items-center justify-center flex-shrink-0">
                                                <Phone className="w-5 h-5 text-indigo-400" />
                                            </div>
                                            <div>
                                                <h3 className="font-semibold mb-1">Phone</h3>
                                                <p className="text-zinc-400">+1 (555) 123-4567</p>
                                                <p className="text-sm text-zinc-500">Mon-Fri 9am-6pm EST</p>
                                            </div>
                                        </div>

                                        <div className="flex items-start gap-4">
                                            <div className="w-12 h-12 bg-zinc-800 rounded-lg flex items-center justify-center flex-shrink-0">
                                                <MapPin className="w-5 h-5 text-indigo-400" />
                                            </div>
                                            <div>
                                                <h3 className="font-semibold mb-1">Address</h3>
                                                <p className="text-zinc-400">
                                                    123 Tech Street<br />
                                                    San Francisco, CA 94102<br />
                                                    United States
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* FAQ Preview */}
                            <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-8">
                                <h3 className="text-xl font-bold mb-4">Frequently Asked Questions</h3>
                                <div className="space-y-4">
                                    <div>
                                        <h4 className="font-medium text-zinc-300 mb-1">How do I get started?</h4>
                                        <p className="text-sm text-zinc-500">Sign up for a free account and create your first Sales in minutes.</p>
                                    </div>
                                    <div>
                                        <h4 className="font-medium text-zinc-300 mb-1">Can I upgrade my plan later?</h4>
                                        <p className="text-sm text-zinc-500">Yes, you can upgrade or downgrade your plan at any time.</p>
                                    </div>
                                    <div>
                                        <h4 className="font-medium text-zinc-300 mb-1">Do you offer custom solutions?</h4>
                                        <p className="text-sm text-zinc-500">Yes, contact our sales team for enterprise solutions.</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Contact Form */}
                        <div className="relative">
                            <div className="absolute -inset-1 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-2xl blur opacity-20"></div>
                            <div className="relative bg-zinc-900/80 backdrop-blur border border-zinc-800 rounded-2xl p-8">
                                {submitted ? (
                                    <div className="text-center py-12">
                                        <div className="w-16 h-16 bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                                            <CheckCircle className="w-8 h-8 text-emerald-400" />
                                        </div>
                                        <h3 className="text-2xl font-bold mb-2">Message Sent!</h3>
                                        <p className="text-zinc-400 mb-6">
                                            Thank you for reaching out. We&apos;ll get back to you within 24 hours.
                                        </p>
                                        <Button 
                                            onClick={() => setSubmitted(false)} 
                                            variant="outline"
                                            className="border-zinc-700 text-zinc-300 hover:bg-zinc-800"
                                        >
                                            Send Another Message
                                        </Button>
                                    </div>
                                ) : (
                                    <>
                                        <h2 className="text-2xl font-bold mb-6">Send us a Message</h2>
                                        <form onSubmit={handleSubmit} className="space-y-6">
                                            <div className="grid md:grid-cols-2 gap-4">
                                                <div className="space-y-2">
                                                    <Label className="text-zinc-300">Name</Label>
                                                    <Input
                                                        value={formData.name}
                                                        onChange={(e) => setFormData({...formData, name: e.target.value})}
                                                        placeholder="John Doe"
                                                        className="bg-zinc-950/50 border-zinc-700 text-white placeholder:text-zinc-600"
                                                        required
                                                    />
                                                </div>
                                                <div className="space-y-2">
                                                    <Label className="text-zinc-300">Email</Label>
                                                    <Input
                                                        type="email"
                                                        value={formData.email}
                                                        onChange={(e) => setFormData({...formData, email: e.target.value})}
                                                        placeholder="john@example.com"
                                                        className="bg-zinc-950/50 border-zinc-700 text-white placeholder:text-zinc-600"
                                                        required
                                                    />
                                                </div>
                                            </div>

                                            <div className="space-y-2">
                                                <Label className="text-zinc-300">Subject</Label>
                                                <Input
                                                    value={formData.subject}
                                                    onChange={(e) => setFormData({...formData, subject: e.target.value})}
                                                    placeholder="How can we help?"
                                                    className="bg-zinc-950/50 border-zinc-700 text-white placeholder:text-zinc-600"
                                                    required
                                                />
                                            </div>

                                            <div className="space-y-2">
                                                <Label className="text-zinc-300">Message</Label>
                                                <Textarea
                                                    value={formData.message}
                                                    onChange={(e) => setFormData({...formData, message: e.target.value})}
                                                    placeholder="Tell us more about your inquiry..."
                                                    rows={5}
                                                    className="bg-zinc-950/50 border-zinc-700 text-white placeholder:text-zinc-600"
                                                    required
                                                />
                                            </div>

                                            <Button 
                                                type="submit" 
                                                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-6"
                                            >
                                                <Send className="w-4 h-4 mr-2" />
                                                Send Message
                                            </Button>
                                        </form>
                                    </>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </main>
    );
}
