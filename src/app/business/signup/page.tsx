'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Checkbox } from '@/components/ui/checkbox';
import { 
  Bot, ArrowLeft, Building2, User, Lock, Mail, Phone, Globe, MapPin, 
  CheckCircle, AlertCircle, Sparkles, Shield, Zap, Palette,
  ChevronRight, ChevronLeft, Loader2
} from 'lucide-react';

export default function BusinessSignup() {
    const router = useRouter();
    const [step, setStep] = useState(1);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);

    const [formData, setFormData] = useState({
        businessName: '',
        slug: '',
        description: '',
        website: '',
        email: '',
        phone: '',
        address: { street: '', city: '', state: '', zip: '', country: '' },
        adminUsername: '',
        adminPassword: '',
        confirmPassword: '',
        agreeTerms: false,
        enableAI: true,
        allowHumanHandover: true,
        customWelcomeMessage: '',
        themeColor: '#4f46e5',
    });

    const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

    const handleChange = (field: string, value: string) => {
        if (field.startsWith('address.')) {
            const addressField = field.split('.')[1];
            setFormData(prev => ({ ...prev, address: { ...prev.address, [addressField]: value } }));
        } else {
            setFormData(prev => ({ ...prev, [field]: value }));
        }
        if (validationErrors[field]) {
            setValidationErrors(prev => ({ ...prev, [field]: '' }));
        }
    };

    const validateStep1 = () => {
        const errors: Record<string, string> = {};
        if (!formData.businessName.trim()) errors.businessName = 'Business name is required';
        if (!formData.slug.trim()) {
            errors.slug = 'Slug is required';
        } else if (!/^[a-z0-9-_]+$/i.test(formData.slug)) {
            errors.slug = 'Only letters, numbers, hyphens, and underscores';
        }
        if (!formData.email.trim()) {
            errors.email = 'Email is required';
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
            errors.email = 'Please enter a valid email';
        }
        setValidationErrors(errors);
        return Object.keys(errors).length === 0;
    };

    const validateStep2 = () => {
        const errors: Record<string, string> = {};
        if (!formData.adminUsername.trim()) errors.adminUsername = 'Username is required';
        if (!formData.adminPassword) {
            errors.adminPassword = 'Password is required';
        } else if (formData.adminPassword.length < 8) {
            errors.adminPassword = 'Min 8 characters';
        }
        if (formData.adminPassword !== formData.confirmPassword) {
            errors.confirmPassword = 'Passwords do not match';
        }
        setValidationErrors(errors);
        return Object.keys(errors).length === 0;
    };

    const validateStep3 = () => {
        const errors: Record<string, string> = {};
        if (formData.customWelcomeMessage && formData.customWelcomeMessage.length > 200) {
            errors.customWelcomeMessage = 'Max 200 characters';
        }
        setValidationErrors(errors);
        return Object.keys(errors).length === 0;
    };

    const validateStep4 = () => {
        const errors: Record<string, string> = {};
        if (!formData.agreeTerms) {
            errors.agreeTerms = 'You must agree to continue';
        }
        setValidationErrors(errors);
        return Object.keys(errors).length === 0;
    };

    const handleNext = () => {
        if (step === 1 && validateStep1()) setStep(2);
        else if (step === 2 && validateStep2()) setStep(3);
        else if (step === 3 && validateStep3()) setStep(4);
    };

    const handleBack = () => step > 1 && setStep(step - 1);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!validateStep4()) return;
        setLoading(true);
        setError('');

        try {
            const response = await fetch('/api/business/signup', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    businessName: formData.businessName,
                    slug: formData.slug,
                    description: formData.description,
                    website: formData.website,
                    email: formData.email,
                    phone: formData.phone,
                    address: formData.address,
                    adminUsername: formData.adminUsername,
                    adminPassword: formData.adminPassword,
                    settings: {
                        enableAI: formData.enableAI,
                        allowHumanHandover: formData.allowHumanHandover,
                        customWelcomeMessage: formData.customWelcomeMessage,
                        themeColor: formData.themeColor,
                    },
                }),
            });

            const data = await response.json();
            if (response.ok) {
                setSuccess(true);
            } else {
                setError(data.error || 'Failed to create account');
            }
        } catch (err) {
            setError('An error occurred. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    if (success) {
        return (
            <main className="min-h-screen bg-zinc-950 text-zinc-100 relative overflow-hidden">
                <div className="absolute inset-0">
                    <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-emerald-600/10 rounded-full blur-3xl"></div>
                    <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-indigo-600/10 rounded-full blur-3xl"></div>
                </div>

                <nav className="fixed top-0 left-0 right-0 z-50 bg-zinc-950/80 backdrop-blur-xl border-b border-zinc-800">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                        <div className="flex items-center justify-between h-16">
                            <Link href="/" className="flex items-center gap-2">
                                <div className="w-8 h-8 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-lg flex items-center justify-center">
                                    <Bot className="w-5 h-5 text-white" />
                                </div>
                                <span className="font-bold text-xl">ChatBot AI</span>
                            </Link>
                        </div>
                    </div>
                </nav>

                <div className="relative flex items-center justify-center min-h-screen px-4 pt-20">
                    <div className="w-full max-w-lg">
                        <div className="relative">
                            <div className="absolute -inset-1 bg-gradient-to-r from-emerald-600 to-green-600 rounded-3xl blur opacity-25"></div>
                            <div className="relative bg-zinc-900/90 backdrop-blur border border-emerald-500/30 rounded-3xl p-10 text-center">
                                <div className="w-20 h-20 bg-gradient-to-br from-emerald-500 to-green-500 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg shadow-emerald-500/25">
                                    <CheckCircle className="w-10 h-10 text-white" />
                                </div>
                                <h1 className="text-3xl font-bold mb-3">You're All Set!</h1>
                                <p className="text-zinc-400 mb-8 leading-relaxed">
                                    Your business account has been created successfully and is pending verification. You'll receive an email once approved.
                                </p>
                                <Link href="/admin/login">
                                    <Button className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white py-6 text-lg font-semibold shadow-lg shadow-indigo-600/25">
                                        Go to Dashboard
                                    </Button>
                                </Link>
                            </div>
                        </div>
                    </div>
                </div>
            </main>
        );
    }

    return (
        <main className="min-h-screen bg-zinc-950 text-zinc-100 relative overflow-hidden">
            {/* Background */}
            <div className="absolute inset-0">
                <div className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-indigo-600/10 rounded-full blur-3xl"></div>
                <div className="absolute bottom-0 right-1/4 w-[600px] h-[600px] bg-purple-600/10 rounded-full blur-3xl"></div>
            </div>
            <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.015)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.015)_1px,transparent_1px)] bg-[size:5rem_5rem]"></div>

            {/* Navigation */}
            <nav className="fixed top-0 left-0 right-0 z-50 bg-zinc-950/80 backdrop-blur-xl border-b border-zinc-800/50">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center justify-between h-16">
                        <Link href="/" className="flex items-center gap-2 group">
                            <div className="w-8 h-8 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-lg flex items-center justify-center group-hover:scale-105 transition-transform">
                                <Bot className="w-5 h-5 text-white" />
                            </div>
                            <span className="font-bold text-xl">ChatBot AI</span>
                        </Link>
                        <Link href="/">
                            <Button variant="ghost" className="text-zinc-400 hover:text-white hover:bg-zinc-800/50">
                                <ArrowLeft className="w-4 h-4 mr-2" />
                                Back
                            </Button>
                        </Link>
                    </div>
                </div>
            </nav>

            {/* Main Content */}
            <div className="relative pt-28 pb-20 px-4">
                <div className="max-w-3xl mx-auto">
                    {/* Header */}
                    <div className="text-center mb-10">
                        <h1 className="text-4xl md:text-5xl font-bold mb-4">
                            Create Your{' '}
                            <span className="bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">
                                Account
                            </span>
                        </h1>
                        <p className="text-lg text-zinc-500">
                            Set up your AI-powered chatbot in 4 simple steps
                        </p>
                    </div>

                    {/* Progress Steps */}
                    <div className="mb-10">
                        <div className="flex items-center justify-between relative">
                            <div className="absolute left-0 right-0 top-1/2 -translate-y-1/2 h-0.5 bg-zinc-800">
                                <div 
                                    className="h-full bg-gradient-to-r from-indigo-600 to-purple-600 transition-all duration-500"
                                    style={{ width: `${((step - 1) / 3) * 100}%` }}
                                ></div>
                            </div>
                            {[
                                { num: 1, label: 'Business' },
                                { num: 2, label: 'Account' },
                                { num: 3, label: 'AI Setup' },
                                { num: 4, label: 'Review' }
                            ].map((s) => (
                                <div key={s.num} className="relative z-10 flex flex-col items-center">
                                    <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold transition-all duration-300 ${
                                        step >= s.num 
                                            ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg shadow-indigo-600/25' 
                                            : 'bg-zinc-900 border border-zinc-700 text-zinc-600'
                                    }`}>
                                        {step > s.num ? <CheckCircle className="w-5 h-5" /> : s.num}
                                    </div>
                                    <span className={`mt-2 text-xs font-medium transition-colors ${
                                        step >= s.num ? 'text-zinc-300' : 'text-zinc-600'
                                    }`}>
                                        {s.label}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Form Card */}
                    <div className="relative">
                        <div className="absolute -inset-0.5 bg-gradient-to-r from-indigo-600/20 to-purple-600/20 rounded-3xl blur opacity-50"></div>
                        <div className="relative bg-zinc-900/90 backdrop-blur border border-zinc-800/50 rounded-3xl p-8 md:p-10">
                            {/* Step Title */}
                            <div className="mb-8">
                                <div className="flex items-center gap-3 mb-2">
                                    {step === 1 && <Building2 className="w-6 h-6 text-indigo-400" />}
                                    {step === 2 && <User className="w-6 h-6 text-indigo-400" />}
                                    {step === 3 && <Sparkles className="w-6 h-6 text-indigo-400" />}
                                    {step === 4 && <Shield className="w-6 h-6 text-indigo-400" />}
                                    <h2 className="text-2xl font-bold">
                                        {step === 1 ? 'Business Information' : 
                                         step === 2 ? 'Create Admin Account' :
                                         step === 3 ? 'AI Chatbot Settings' : 'Review & Confirm'}
                                    </h2>
                                </div>
                                <p className="text-zinc-500 ml-9">
                                    {step === 1 ? 'Tell us about your business' :
                                     step === 2 ? 'Set up your administrator credentials' :
                                     step === 3 ? 'Customize how your AI chatbot behaves' :
                                     'Review everything before creating your account'}
                                </p>
                            </div>

                            {error && (
                                <Alert className="mb-6 bg-red-500/10 border-red-500/30">
                                    <AlertCircle className="h-4 w-4 text-red-400" />
                                    <AlertDescription className="text-red-400">{error}</AlertDescription>
                                </Alert>
                            )}

                            <form onSubmit={step === 4 ? handleSubmit : (e) => { e.preventDefault(); handleNext(); }} className="space-y-6">
                                {step === 1 && (
                                    <div className="space-y-5">
                                        <div className="grid md:grid-cols-2 gap-5">
                                            <div className="space-y-2">
                                                <Label className="text-zinc-300 flex items-center gap-2">
                                                    <Building2 className="w-4 h-4 text-zinc-500" />
                                                    Business Name *
                                                </Label>
                                                <Input
                                                    value={formData.businessName}
                                                    onChange={(e) => handleChange('businessName', e.target.value)}
                                                    placeholder="Acme Corp"
                                                    className="bg-zinc-950/50 border-zinc-700/50 text-white placeholder:text-zinc-600 focus:border-indigo-500 focus:ring-indigo-500/20 h-12"
                                                />
                                                {validationErrors.businessName && (
                                                    <p className="text-xs text-red-400">{validationErrors.businessName}</p>
                                                )}
                                            </div>
                                            <div className="space-y-2">
                                                <Label className="text-zinc-300 flex items-center gap-2">
                                                    <Globe className="w-4 h-4 text-zinc-500" />
                                                    Business Slug *
                                                </Label>
                                                <Input
                                                    value={formData.slug}
                                                    onChange={(e) => handleChange('slug', e.target.value.toLowerCase())}
                                                    placeholder="acme-corp"
                                                    className="bg-zinc-950/50 border-zinc-700/50 text-white placeholder:text-zinc-600 focus:border-indigo-500 focus:ring-indigo-500/20 h-12"
                                                />
                                                {validationErrors.slug && (
                                                    <p className="text-xs text-red-400">{validationErrors.slug}</p>
                                                )}
                                            </div>
                                        </div>
                                        <div className="space-y-2">
                                            <Label className="text-zinc-300">Description</Label>
                                            <Textarea
                                                value={formData.description}
                                                onChange={(e) => handleChange('description', e.target.value)}
                                                placeholder="What does your business do?"
                                                rows={3}
                                                className="bg-zinc-950/50 border-zinc-700/50 text-white placeholder:text-zinc-600 focus:border-indigo-500 focus:ring-indigo-500/20 resize-none"
                                            />
                                        </div>
                                        <div className="grid md:grid-cols-2 gap-5">
                                            <div className="space-y-2">
                                                <Label className="text-zinc-300 flex items-center gap-2">
                                                    <Mail className="w-4 h-4 text-zinc-500" />
                                                    Business Email *
                                                </Label>
                                                <Input
                                                    type="email"
                                                    value={formData.email}
                                                    onChange={(e) => handleChange('email', e.target.value)}
                                                    placeholder="contact@company.com"
                                                    className="bg-zinc-950/50 border-zinc-700/50 text-white placeholder:text-zinc-600 focus:border-indigo-500 focus:ring-indigo-500/20 h-12"
                                                />
                                                {validationErrors.email && (
                                                    <p className="text-xs text-red-400">{validationErrors.email}</p>
                                                )}
                                            </div>
                                            <div className="space-y-2">
                                                <Label className="text-zinc-300 flex items-center gap-2">
                                                    <Phone className="w-4 h-4 text-zinc-500" />
                                                    Phone
                                                </Label>
                                                <Input
                                                    value={formData.phone}
                                                    onChange={(e) => handleChange('phone', e.target.value)}
                                                    placeholder="+1 (555) 123-4567"
                                                    className="bg-zinc-950/50 border-zinc-700/50 text-white placeholder:text-zinc-600 focus:border-indigo-500 focus:ring-indigo-500/20 h-12"
                                                />
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {step === 2 && (
                                    <div className="space-y-5">
                                        <div className="space-y-2">
                                            <Label className="text-zinc-300 flex items-center gap-2">
                                                <User className="w-4 h-4 text-zinc-500" />
                                                Admin Username *
                                            </Label>
                                            <Input
                                                value={formData.adminUsername}
                                                onChange={(e) => handleChange('adminUsername', e.target.value)}
                                                placeholder="Choose a username"
                                                className="bg-zinc-950/50 border-zinc-700/50 text-white placeholder:text-zinc-600 focus:border-indigo-500 focus:ring-indigo-500/20 h-12"
                                            />
                                            {validationErrors.adminUsername && (
                                                <p className="text-xs text-red-400">{validationErrors.adminUsername}</p>
                                            )}
                                        </div>
                                        <div className="grid md:grid-cols-2 gap-5">
                                            <div className="space-y-2">
                                                <Label className="text-zinc-300 flex items-center gap-2">
                                                    <Lock className="w-4 h-4 text-zinc-500" />
                                                    Password *
                                                </Label>
                                                <Input
                                                    type="password"
                                                    value={formData.adminPassword}
                                                    onChange={(e) => handleChange('adminPassword', e.target.value)}
                                                    placeholder="Min 8 characters"
                                                    className="bg-zinc-950/50 border-zinc-700/50 text-white placeholder:text-zinc-600 focus:border-indigo-500 focus:ring-indigo-500/20 h-12"
                                                />
                                                {validationErrors.adminPassword && (
                                                    <p className="text-xs text-red-400">{validationErrors.adminPassword}</p>
                                                )}
                                            </div>
                                            <div className="space-y-2">
                                                <Label className="text-zinc-300 flex items-center gap-2">
                                                    <Lock className="w-4 h-4 text-zinc-500" />
                                                    Confirm Password *
                                                </Label>
                                                <Input
                                                    type="password"
                                                    value={formData.confirmPassword}
                                                    onChange={(e) => handleChange('confirmPassword', e.target.value)}
                                                    placeholder="Re-enter password"
                                                    className="bg-zinc-950/50 border-zinc-700/50 text-white placeholder:text-zinc-600 focus:border-indigo-500 focus:ring-indigo-500/20 h-12"
                                                />
                                                {validationErrors.confirmPassword && (
                                                    <p className="text-xs text-red-400">{validationErrors.confirmPassword}</p>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {step === 3 && (
                                    <div className="space-y-6">
                                        <div className="grid md:grid-cols-2 gap-5">
                                            <div className="flex items-start space-x-3 p-5 bg-zinc-950/50 border border-zinc-800/50 rounded-xl hover:border-indigo-500/30 transition-colors">
                                                <Checkbox
                                                    id="enableAI"
                                                    checked={formData.enableAI}
                                                    onCheckedChange={(checked) => setFormData(prev => ({ ...prev, enableAI: checked === true }))}
                                                    className="mt-1 border-zinc-600 data-[state=checked]:bg-indigo-600 data-[state=checked]:border-indigo-600"
                                                />
                                                <div className="space-y-1">
                                                    <Label htmlFor="enableAI" className="font-medium cursor-pointer text-zinc-200 flex items-center gap-2">
                                                        <Zap className="w-4 h-4 text-yellow-500" />
                                                        Enable AI Responses
                                                    </Label>
                                                    <p className="text-sm text-zinc-500">AI automatically answers customer questions</p>
                                                </div>
                                            </div>
                                            <div className="flex items-start space-x-3 p-5 bg-zinc-950/50 border border-zinc-800/50 rounded-xl hover:border-indigo-500/30 transition-colors">
                                                <Checkbox
                                                    id="allowHumanHandover"
                                                    checked={formData.allowHumanHandover}
                                                    onCheckedChange={(checked) => setFormData(prev => ({ ...prev, allowHumanHandover: checked === true }))}
                                                    className="mt-1 border-zinc-600 data-[state=checked]:bg-indigo-600 data-[state=checked]:border-indigo-600"
                                                />
                                                <div className="space-y-1">
                                                    <Label htmlFor="allowHumanHandover" className="font-medium cursor-pointer text-zinc-200 flex items-center gap-2">
                                                        <User className="w-4 h-4 text-indigo-400" />
                                                        Human Handover
                                                    </Label>
                                                    <p className="text-sm text-zinc-500">Let users request to chat with a human</p>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="space-y-2">
                                            <Label className="text-zinc-300 flex items-center gap-2">
                                                <Sparkles className="w-4 h-4 text-zinc-500" />
                                                Welcome Message
                                            </Label>
                                            <Textarea
                                                value={formData.customWelcomeMessage}
                                                onChange={(e) => handleChange('customWelcomeMessage', e.target.value)}
                                                placeholder="Hello! Welcome to our store. How can I help you today?"
                                                rows={3}
                                                className="bg-zinc-950/50 border-zinc-700/50 text-white placeholder:text-zinc-600 focus:border-indigo-500 focus:ring-indigo-500/20 resize-none"
                                            />
                                            <p className="text-xs text-zinc-500">Max 200 characters</p>
                                        </div>
                                        <div className="space-y-2">
                                            <Label className="text-zinc-300 flex items-center gap-2">
                                                <Palette className="w-4 h-4 text-zinc-500" />
                                                Theme Color
                                            </Label>
                                            <div className="flex items-center gap-3">
                                                <input
                                                    type="color"
                                                    value={formData.themeColor}
                                                    onChange={(e) => handleChange('themeColor', e.target.value)}
                                                    className="w-12 h-12 rounded-xl cursor-pointer border-0 p-0 bg-transparent"
                                                />
                                                <Input
                                                    value={formData.themeColor}
                                                    onChange={(e) => handleChange('themeColor', e.target.value)}
                                                    placeholder="#4f46e5"
                                                    className="flex-1 font-mono bg-zinc-950/50 border-zinc-700/50 text-white h-12"
                                                />
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {step === 4 && (
                                    <div className="space-y-5">
                                        <div className="space-y-4">
                                            <div className="bg-zinc-950/50 border border-zinc-800/50 rounded-xl p-5">
                                                <h3 className="font-semibold text-zinc-200 mb-4 flex items-center gap-2">
                                                    <Building2 className="w-4 h-4 text-indigo-400" />
                                                    Business Details
                                                </h3>
                                                <div className="grid grid-cols-2 gap-4 text-sm">
                                                    <div><span className="text-zinc-500">Name:</span><p className="font-medium text-zinc-300">{formData.businessName}</p></div>
                                                    <div><span className="text-zinc-500">Slug:</span><p className="font-medium text-zinc-300">{formData.slug}</p></div>
                                                    <div className="col-span-2"><span className="text-zinc-500">Email:</span><p className="font-medium text-zinc-300">{formData.email}</p></div>
                                                </div>
                                            </div>
                                            <div className="bg-zinc-950/50 border border-zinc-800/50 rounded-xl p-5">
                                                <h3 className="font-semibold text-zinc-200 mb-4 flex items-center gap-2">
                                                    <Sparkles className="w-4 h-4 text-indigo-400" />
                                                    AI Configuration
                                                </h3>
                                                <div className="grid grid-cols-2 gap-4 text-sm">
                                                    <div className="flex items-center gap-2">
                                                        <div className={`w-2 h-2 rounded-full ${formData.enableAI ? 'bg-emerald-500' : 'bg-zinc-600'}`}></div>
                                                        <span className="text-zinc-400">AI Enabled</span>
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        <div className={`w-2 h-2 rounded-full ${formData.allowHumanHandover ? 'bg-emerald-500' : 'bg-zinc-600'}`}></div>
                                                        <span className="text-zinc-400">Human Handover</span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex items-start space-x-3 pt-4">
                                            <Checkbox
                                                id="terms"
                                                checked={formData.agreeTerms}
                                                onCheckedChange={(checked) => setFormData(prev => ({ ...prev, agreeTerms: checked === true }))}
                                                className="mt-0.5 border-zinc-600 data-[state=checked]:bg-indigo-600 data-[state=checked]:border-indigo-600"
                                            />
                                            <Label htmlFor="terms" className="text-sm font-normal leading-relaxed cursor-pointer text-zinc-400">
                                                I agree to the <Link href="/terms" className="text-indigo-400 hover:text-indigo-300">Terms of Service</Link> and <Link href="/privacy" className="text-indigo-400 hover:text-indigo-300">Privacy Policy</Link>
                                            </Label>
                                        </div>
                                        {validationErrors.agreeTerms && (
                                            <p className="text-xs text-red-400 -mt-2">{validationErrors.agreeTerms}</p>
                                        )}
                                    </div>
                                )}

                                <div className="flex gap-4 pt-4">
                                    {step > 1 && (
                                        <Button 
                                            type="button" 
                                            variant="outline" 
                                            onClick={handleBack} 
                                            disabled={loading}
                                            className="flex-1 border-zinc-700 text-zinc-400 hover:bg-zinc-800 hover:text-white h-12"
                                        >
                                            <ChevronLeft className="w-4 h-4 mr-2" />
                                            Back
                                        </Button>
                                    )}
                                    <Button 
                                        type="submit" 
                                        disabled={loading}
                                        className="flex-1 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white h-12 font-semibold shadow-lg shadow-indigo-600/25"
                                    >
                                        {loading ? (
                                            <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Processing...</>
                                        ) : step === 4 ? (
                                            'Create Account'
                                        ) : (
                                            <><span className="mr-2">Next Step</span><ChevronRight className="w-4 h-4" /></>
                                        )}
                                    </Button>
                                </div>
                            </form>
                        </div>
                    </div>

                    {/* Sign In Link */}
                    <div className="mt-8 text-center">
                        <p className="text-zinc-500">
                            Already have an account?{' '}
                            <Link href="/business/login" className="text-indigo-400 hover:text-indigo-300 font-medium transition-colors">
                                Sign in
                            </Link>
                        </p>
                    </div>
                </div>
            </div>
        </main>
    );
}
