'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { LogOut, User, Building2, Key, Settings, ChevronRight, Shield, Mail, Globe, Smartphone, MapPin } from 'lucide-react';
import { toast } from 'sonner';

interface BusinessProfile {
    _id: string;
    name: string;
    slug: string;
    email: string;
    website?: string;
    phone?: string;
    description?: string;
    address?: {
        street?: string;
        city?: string;
        state?: string;
        zip?: string;
        country?: string;
    };
    status: string;
}

interface UserProfile {
    username: string;
    role: string;
    isActive: boolean;
}

export default function ProfilePage() {
    const router = useRouter();
    const [business, setBusiness] = useState<BusinessProfile | null>(null);
    const [user, setUser] = useState<UserProfile | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchProfile();
        parseUserFromToken();
    }, []);

    const parseUserFromToken = () => {
        const token = document.cookie.match(/admin_token=([^;]+)/)?.[1];
        if (token) {
            try {
                const decoded = JSON.parse(atob(token));
                setUser({
                    username: decoded.username || 'admin',
                    role: decoded.role || 'admin',
                    isActive: true,
                });
            } catch {
                setUser({ username: 'admin', role: 'admin', isActive: true });
            }
        }
    };

    const fetchProfile = async () => {
        try {
            const response = await fetch('/api/admin/business/profile', {
                credentials: 'same-origin',
            });
            if (response.ok) {
                const data = await response.json();
                setBusiness(data.business);
            }
        } catch (err) {
            console.error('Failed to fetch profile:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleLogout = () => {
        document.cookie = 'admin_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
        router.push('/admin/login');
        toast.success('Logged out successfully');
    };

    const getInitials = (name: string) => {
        return name
            .split(' ')
            .map(n => n[0])
            .join('')
            .toUpperCase()
            .slice(0, 2);
    };

    const menuItems = [
        { icon: Settings, label: 'Settings', description: 'API keys & preferences', path: '/admin/settings' },
        { icon: Key, label: 'API Credentials', description: 'View and manage API keys', path: '/admin/settings?tab=api' },
        { icon: Building2, label: 'Business Profile', description: 'Company information', path: '/admin/dashboard' },
    ];

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500"></div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-3xl font-bold text-white">Profile</h1>
                <p className="text-zinc-400 mt-1">Manage your account and preferences</p>
            </div>

            {/* Profile Hero Card */}
            <Card className="bg-gradient-to-br from-emerald-900/20 to-zinc-900 border-emerald-800/30 backdrop-blur">
                <CardHeader className="pb-4">
                    <div className="flex items-center gap-4">
                        <Avatar className="h-20 w-20 ring-2 ring-emerald-500/30 ring-offset-4 ring-offset-zinc-950">
                            <AvatarFallback className="bg-gradient-to-br from-emerald-500 to-green-600 text-white text-2xl font-bold">
                                {business ? getInitials(business.name) : user ? getInitials(user.username) : 'AD'}
                            </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                            <CardTitle className="text-xl text-white truncate">
                                {business?.name || user?.username || 'Admin User'}
                            </CardTitle>
                            <CardDescription className="text-zinc-400 text-sm">
                                {user?.role === 'superadmin' ? 'Super Administrator' : 'Business Administrator'}
                            </CardDescription>
                            <div className="flex items-center gap-2 mt-3 flex-wrap">
                                <Badge className="text-xs bg-emerald-600/20 text-emerald-400 border-emerald-600/30">
                                    <Shield className="w-3 h-3 mr-1" />
                                    {user?.role === 'superadmin' ? 'Super Admin' : 'Admin'}
                                </Badge>
                                <Badge className="text-xs bg-green-600/20 text-green-400 border-green-600/30">
                                    {business?.status === 'verified' ? 'Verified' : business?.status || 'Active'}
                                </Badge>
                            </div>
                        </div>
                    </div>
                </CardHeader>
            </Card>

            <div className="grid md:grid-cols-2 gap-6">
                {/* Account Info */}
                <Card className="bg-zinc-900/50 border-zinc-800 backdrop-blur">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-zinc-400 flex items-center gap-2">
                            <Key className="w-4 h-4 text-emerald-400" />
                            Account
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="pt-0 space-y-4">
                        <div className="flex items-center justify-between p-3 rounded-lg bg-zinc-800/30">
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 bg-zinc-800 rounded-lg flex items-center justify-center">
                                    <User className="w-4 h-4 text-zinc-500" />
                                </div>
                                <div>
                                    <p className="text-sm text-zinc-400">Username</p>
                                    <p className="text-sm font-medium text-white">{user?.username || 'admin'}</p>
                                </div>
                            </div>
                        </div>
                        <div className="flex items-center justify-between p-3 rounded-lg bg-zinc-800/30">
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 bg-zinc-800 rounded-lg flex items-center justify-center">
                                    <Mail className="w-4 h-4 text-zinc-500" />
                                </div>
                                <div>
                                    <p className="text-sm text-zinc-400">Email</p>
                                    <p className="text-sm font-medium text-white">{business?.email || 'N/A'}</p>
                                </div>
                            </div>
                        </div>
                        <div className="flex items-center justify-between p-3 rounded-lg bg-zinc-800/30">
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 bg-zinc-800 rounded-lg flex items-center justify-center">
                                    <Shield className="w-4 h-4 text-zinc-500" />
                                </div>
                                <div>
                                    <p className="text-sm text-zinc-400">Role</p>
                                    <Badge variant="outline" className="text-xs border-emerald-600/50 text-emerald-400">
                                        {user?.role === 'superadmin' ? 'Super Administrator' : 'Administrator'}
                                    </Badge>
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Business Info */}
                <Card className="bg-zinc-900/50 border-zinc-800 backdrop-blur">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-zinc-400 flex items-center gap-2">
                            <Building2 className="w-4 h-4 text-purple-400" />
                            Business
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="pt-0 space-y-4">
                        <div className="flex items-center justify-between p-3 rounded-lg bg-zinc-800/30">
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 bg-zinc-800 rounded-lg flex items-center justify-center">
                                    <Building2 className="w-4 h-4 text-zinc-500" />
                                </div>
                                <div>
                                    <p className="text-sm text-zinc-400">Name</p>
                                    <p className="text-sm font-medium text-white">{business?.name || 'N/A'}</p>
                                </div>
                            </div>
                        </div>
                        <div className="flex items-center justify-between p-3 rounded-lg bg-zinc-800/30">
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 bg-zinc-800 rounded-lg flex items-center justify-center">
                                    <Globe className="w-4 h-4 text-zinc-500" />
                                </div>
                                <div>
                                    <p className="text-sm text-zinc-400">Website</p>
                                    <p className="text-sm font-medium text-emerald-400">
                                        {business?.website ? (
                                            <a href={business.website} target="_blank" rel="noopener noreferrer" className="hover:underline">
                                                {business.website.replace(/^https?:\/\//, '')}
                                            </a>
                                        ) : 'N/A'}
                                    </p>
                                </div>
                            </div>
                        </div>
                        <div className="flex items-center justify-between p-3 rounded-lg bg-zinc-800/30">
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 bg-zinc-800 rounded-lg flex items-center justify-center">
                                    <Smartphone className="w-4 h-4 text-zinc-500" />
                                </div>
                                <div>
                                    <p className="text-sm text-zinc-400">Phone</p>
                                    <p className="text-sm font-medium text-white">{business?.phone || 'N/A'}</p>
                                </div>
                            </div>
                        </div>
                        {business?.address && (business.address.city || business.address.country) && (
                            <div className="flex items-center justify-between p-3 rounded-lg bg-zinc-800/30">
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 bg-zinc-800 rounded-lg flex items-center justify-center">
                                        <MapPin className="w-4 h-4 text-zinc-500" />
                                    </div>
                                    <div>
                                        <p className="text-sm text-zinc-400">Location</p>
                                        <p className="text-sm font-medium text-white">
                                            {[business.address.city, business.address.country].filter(Boolean).join(', ')}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>

            {/* Quick Links */}
            <Card className="bg-zinc-900/50 border-zinc-800 backdrop-blur">
                <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-zinc-400">Quick Links</CardTitle>
                </CardHeader>
                <CardContent className="pt-0 space-y-2">
                    {menuItems.map((item) => (
                        <div 
                            key={item.label}
                            onClick={() => router.push(item.path)}
                            className="flex items-center justify-between p-3 rounded-lg bg-zinc-800/30 hover:bg-zinc-800/50 cursor-pointer transition-colors border border-zinc-700/50 hover:border-zinc-600"
                        >
                            <div className="flex items-center gap-3">
                                <div className="w-9 h-9 bg-zinc-800 rounded-lg flex items-center justify-center">
                                    <item.icon className="w-4 h-4 text-zinc-400" />
                                </div>
                                <div>
                                    <p className="font-medium text-white text-sm">{item.label}</p>
                                    <p className="text-xs text-zinc-500">{item.description}</p>
                                </div>
                            </div>
                            <ChevronRight className="w-5 h-5 text-zinc-500" />
                        </div>
                    ))}
                </CardContent>
            </Card>

            {/* Logout Button */}
            <Button
                variant="outline"
                onClick={handleLogout}
                className="w-full h-11 border-red-900/50 bg-red-950/20 text-red-400 hover:bg-red-950/40 hover:text-red-300 hover:border-red-800"
            >
                <LogOut className="w-4 h-4 mr-2" />
                Log Out
            </Button>
        </div>
    );
}
