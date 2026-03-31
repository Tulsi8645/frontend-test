'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Bot, ArrowLeft, User, Lock, AlertCircle, Shield } from 'lucide-react';

export default function AdminLoginPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [formData, setFormData] = useState({
        username: '',
        password: '',
    });

    const handleChange = (field: string, value: string) => {
        setFormData(prev => ({ ...prev, [field]: value }));
        setError('');
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            const res = await fetch('/api/admin/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData),
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.error || 'Login failed');
            }

            // Set the admin token cookie
            document.cookie = `admin_token=${data.token}; path=/; max-age=604800; SameSite=Lax`;
            
            router.push(data.redirect || '/admin/dashboard');
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

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
                            <span className="font-bold text-xl">Sales AI</span>
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
            <div className="relative p-50 px-4">
                <div className="max-w-md mx-auto">
                    {/* Header */}
                    <div className="text-center mb-10">
                        <h1 className="text-4xl md:text-5xl font-bold mb-4">
                            Login{' '}
                            <span className="bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">
                                Portal
                            </span>
                        </h1>
                        <p className="text-lg text-zinc-500">
                            Sign in to access the admin dashboard
                        </p>
                    </div>

                    {/* Form Card */}
                    <div className="relative">
                        <div className="absolute -inset-0.5 bg-gradient-to-r from-indigo-600/20 to-purple-600/20 rounded-3xl blur opacity-50"></div>
                        <div className="relative bg-zinc-900/90 backdrop-blur border border-zinc-800/50 rounded-3xl p-8 md:p-10">
                            <form onSubmit={handleSubmit} className="space-y-6">
                                {error && (
                                    <Alert className="mb-6 bg-red-500/10 border-red-500/30">
                                        <AlertCircle className="h-4 w-4 text-red-400" />
                                        <AlertDescription className="text-red-400">{error}</AlertDescription>
                                    </Alert>
                                )}

                                <div className="space-y-5">
                                    <div className="space-y-2">
                                        <Label className="text-zinc-300 flex items-center gap-2">
                                            <User className="w-4 h-4 text-zinc-500" />
                                            Username
                                        </Label>
                                        <Input
                                            value={formData.username}
                                            onChange={(e) => handleChange('username', e.target.value)}
                                            placeholder="Enter your username"
                                            className="bg-zinc-950/50 border-zinc-700/50 text-white placeholder:text-zinc-600 focus:border-indigo-500 focus:ring-indigo-500/20 h-12"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-zinc-300 flex items-center gap-2">
                                            <Lock className="w-4 h-4 text-zinc-500" />
                                            Password
                                        </Label>
                                        <Input
                                            type="password"
                                            value={formData.password}
                                            onChange={(e) => handleChange('password', e.target.value)}
                                            placeholder="Enter your password"
                                            className="bg-zinc-950/50 border-zinc-700/50 text-white placeholder:text-zinc-600 focus:border-indigo-500 focus:ring-indigo-500/20 h-12"
                                        />
                                    </div>
                                </div>

                                <Button 
                                    type="submit" 
                                    disabled={loading}
                                    className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white h-12 font-semibold shadow-lg shadow-indigo-600/25"
                                >
                                    {loading ? 'Signing in...' : 'Sign In'}
                                </Button>
                            </form>
                        </div>
                    </div>

                    {/* Business Login Link */}
                    <div className="mt-8 text-center">
                        <p className="text-zinc-500">
                            Business owner?{' '}
                            <Link href="/business/login" className="text-indigo-400 hover:text-indigo-300 font-medium transition-colors">
                                Login here
                            </Link>
                        </p>
                    </div>
                </div>
            </div>
        </main>
    );
}
