'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import {
    Globe,
    MessageSquare,
    Bot,
    Users,
    Database,
    Zap,
    TrendingUp,
    Activity,
    AlertCircle,
    CheckCircle,
    Clock,
    BarChart3,
} from 'lucide-react';

interface Analytics {
    businesses: {
        total: number;
        active: number;
        pending: number;
        suspended: number;
        newThisMonth: number;
    };
    users: {
        total: number;
        superadmins: number;
        admins: number;
        activeAdmins: number;
    };
    sessions: {
        total: number;
        active: number;
        today: number;
        thisWeek: number;
        thisMonth: number;
        takenOver: number;
    };
    knowledge: {
        total: number;
        active: number;
        byType: { _id: string; count: number }[];
    };
    topBusinesses: {
        businessId: string;
        businessName: string;
        businessSlug: string;
        sessionCount: number;
    }[];
    dailySessions: { _id: string; count: number }[];
    recentBusinesses: {
        _id: string;
        name: string;
        email: string;
        status: 'pending' | 'verified' | 'suspended';
    }[];
}

export default function AnalyticsPage() {
    const router = useRouter();
    const [analytics, setAnalytics] = useState<Analytics | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        fetchAnalytics();
    }, []);

    const fetchAnalytics = async () => {
        try {
            const response = await fetch('/api/superadmin/analytics', {
                credentials: 'same-origin',
            });

            if (response.status === 401) {
                router.push('/admin/login');
                return;
            }

            const data = await response.json();
            if (response.ok) {
                setAnalytics(data);
            } else {
                setError(data.error || 'Failed to fetch analytics');
            }
        } catch (err) {
            console.error('Failed to fetch analytics:', err);
            setError('Network error');
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500"></div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {error && (
                <Alert variant="destructive" className="mb-6 bg-red-950/50 border-red-900">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>{error}</AlertDescription>
                </Alert>
            )}

            {/* Platform Overview Stats */}
            <div className="grid lg:grid-cols-3 gap-6">
                <Card className="bg-zinc-900/50 border-zinc-800 backdrop-blur">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-white">
                            <Globe className="w-5 h-5 text-emerald-400" />
                            Platform Overview
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex justify-between items-center">
                            <span className="text-zinc-500">Total Businesses</span>
                            <span className="font-bold text-white">{analytics?.businesses.total || 0}</span>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="text-zinc-500">Active Businesses</span>
                            <Badge className="bg-emerald-600/20 text-emerald-400 border-emerald-600/30">
                                {analytics?.businesses.active || 0}
                            </Badge>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="text-zinc-500">Total Users</span>
                            <span className="font-bold text-white">{analytics?.users.total || 0}</span>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="text-zinc-500">Active Admins</span>
                            <span className="font-bold text-white">{analytics?.users.activeAdmins || 0}</span>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="text-zinc-500">Super Admins</span>
                            <span className="font-bold text-amber-400">{analytics?.users.superadmins || 0}</span>
                        </div>
                    </CardContent>
                </Card>

                <Card className="bg-zinc-900/50 border-zinc-800 backdrop-blur">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-white">
                            <MessageSquare className="w-5 h-5 text-green-400" />
                            Session Statistics
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex justify-between items-center">
                            <span className="text-zinc-500">Total Sessions</span>
                            <span className="font-bold text-white">{analytics?.sessions.total || 0}</span>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="text-zinc-500">Today</span>
                            <Badge className="bg-emerald-600/20 text-emerald-400 border-emerald-600/30">
                                {analytics?.sessions.today || 0}
                            </Badge>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="text-zinc-500">This Week</span>
                            <span className="font-bold text-white">{analytics?.sessions.thisWeek || 0}</span>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="text-zinc-500">This Month</span>
                            <span className="font-bold text-white">{analytics?.sessions.thisMonth || 0}</span>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="text-zinc-500">Active Now</span>
                            <span className="font-bold text-emerald-400">{analytics?.sessions.active || 0}</span>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="text-zinc-500">Human Takeovers</span>
                            <span className="font-bold text-amber-400">{analytics?.sessions.takenOver || 0}</span>
                        </div>
                    </CardContent>
                </Card>

                <Card className="bg-zinc-900/50 border-zinc-800 backdrop-blur">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-white">
                            <Bot className="w-5 h-5 text-teal-400" />
                            AI Performance
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex justify-between items-center">
                            <span className="text-zinc-500">Knowledge Entries</span>
                            <span className="font-bold text-white">{analytics?.knowledge.total || 0}</span>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="text-zinc-500">Active Entries</span>
                            <Badge className="bg-emerald-600/20 text-emerald-400 border-emerald-600/30">
                                {analytics?.knowledge.active || 0}
                            </Badge>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="text-zinc-500">AI Response Rate</span>
                            <span className="font-bold text-emerald-400">
                                {analytics?.sessions.total && analytics?.sessions.takenOver !== undefined
                                    ? `${Math.round(((analytics.sessions.total - analytics.sessions.takenOver) / analytics.sessions.total) * 100)}%`
                                    : '100%'}
                            </span>
                        </div>
                        <div className="pt-2">
                            <div className="h-2 bg-zinc-800 rounded-full overflow-hidden">
                                <div
                                    className="h-full bg-gradient-to-r from-emerald-600 to-green-500 transition-all"
                                    style={{
                                        width: analytics?.sessions.total
                                            ? `${((analytics.sessions.total - (analytics.sessions.takenOver || 0)) / analytics.sessions.total) * 100}%`
                                            : '100%'
                                    }}
                                />
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Services & Features Usage */}
            <Card className="bg-zinc-900/50 border-zinc-800 backdrop-blur">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-white">
                        <Zap className="w-5 h-5 text-amber-400" />
                        Services & Features Usage
                    </CardTitle>
                    <CardDescription className="text-zinc-500">Features enabled across all businesses</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
                        <div className="p-4 rounded-lg bg-zinc-800/30 border border-zinc-700/50 hover:border-zinc-600 transition-colors">
                            <div className="flex items-center gap-3 mb-3">
                                <div className="w-10 h-10 bg-emerald-600/20 rounded-lg flex items-center justify-center">
                                    <Bot className="w-5 h-5 text-emerald-400" />
                                </div>
                                <span className="font-medium text-white">AI Sales</span>
                            </div>
                            <p className="text-2xl font-bold text-white">{analytics?.businesses.active || 0}</p>
                            <p className="text-xs text-zinc-500">businesses enabled</p>
                        </div>

                        <div className="p-4 rounded-lg bg-zinc-800/30 border border-zinc-700/50 hover:border-zinc-600 transition-colors">
                            <div className="flex items-center gap-3 mb-3">
                                <div className="w-10 h-10 bg-green-600/20 rounded-lg flex items-center justify-center">
                                    <Users className="w-5 h-5 text-green-400" />
                                </div>
                                <span className="font-medium text-white">Human Handover</span>
                            </div>
                            <p className="text-2xl font-bold text-white">{analytics?.sessions.takenOver || 0}</p>
                            <p className="text-xs text-zinc-500">sessions transferred</p>
                        </div>

                        <div className="p-4 rounded-lg bg-zinc-800/30 border border-zinc-700/50 hover:border-zinc-600 transition-colors">
                            <div className="flex items-center gap-3 mb-3">
                                <div className="w-10 h-10 bg-blue-600/20 rounded-lg flex items-center justify-center">
                                    <Globe className="w-5 h-5 text-blue-400" />
                                </div>
                                <span className="font-medium text-white">Website Widget</span>
                            </div>
                            <p className="text-2xl font-bold text-white">{analytics?.businesses.active || 0}</p>
                            <p className="text-xs text-zinc-500">active widgets</p>
                        </div>

                        <div className="p-4 rounded-lg bg-zinc-800/30 border border-zinc-700/50 hover:border-zinc-600 transition-colors">
                            <div className="flex items-center gap-3 mb-3">
                                <div className="w-10 h-10 bg-teal-600/20 rounded-lg flex items-center justify-center">
                                    <Database className="w-5 h-5 text-teal-400" />
                                </div>
                                <span className="font-medium text-white">Knowledge Base</span>
                            </div>
                            <p className="text-2xl font-bold text-white">{analytics?.knowledge.active || 0}</p>
                            <p className="text-xs text-zinc-500">total entries</p>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Knowledge Distribution */}
            <div className="grid lg:grid-cols-2 gap-6">
                <Card className="bg-zinc-900/50 border-zinc-800 backdrop-blur">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-white">
                            <Database className="w-5 h-5 text-teal-400" />
                            Knowledge Distribution
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {analytics?.knowledge?.byType?.map((type) => {
                                const percentage = (type.count / (analytics?.knowledge.active || 1)) * 100;
                                return (
                                    <div key={type._id} className="space-y-2">
                                        <div className="flex items-center justify-between text-sm">
                                            <span className="capitalize text-zinc-300">{type._id?.replace('_', ' ') || 'Unknown'}</span>
                                            <span className="font-medium text-white">{type.count}</span>
                                        </div>
                                        <Progress value={percentage} className="h-2 bg-zinc-800 [&>div]:bg-gradient-to-r [&>div]:from-emerald-600 [&>div]:to-green-500" />
                                    </div>
                                );
                            })}
                            {analytics?.knowledge?.byType?.length === 0 && (
                                <div className="text-zinc-500 text-center py-4">No knowledge entries</div>
                            )}
                        </div>
                    </CardContent>
                </Card>

                <Card className="bg-zinc-900/50 border-zinc-800 backdrop-blur">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-white">
                            <TrendingUp className="w-5 h-5 text-emerald-400" />
                            Top Businesses by Sessions
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {analytics?.topBusinesses?.map((business, i) => (
                                <div key={business.businessId} className="flex items-center justify-between p-3 rounded-lg bg-zinc-800/30 hover:bg-zinc-800/50 transition-colors">
                                    <div className="flex items-center gap-3">
                                        <span className="text-sm font-bold text-emerald-400 bg-emerald-600/20 w-6 h-6 rounded flex items-center justify-center">#{i + 1}</span>
                                        <div>
                                            <p className="font-medium text-sm text-white">{business.businessName}</p>
                                            <p className="text-xs text-zinc-500">{business.businessSlug}</p>
                                        </div>
                                    </div>
                                    <Badge className="bg-emerald-600/20 text-emerald-400 border-emerald-600/30">{business.sessionCount} sessions</Badge>
                                </div>
                            ))}
                            {analytics?.topBusinesses?.length === 0 && (
                                <div className="text-zinc-500 text-center py-4">No data</div>
                            )}
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Business Status Breakdown */}
            <Card className="bg-zinc-900/50 border-zinc-800 backdrop-blur">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-white">
                        <BarChart3 className="w-5 h-5 text-emerald-400" />
                        Business Status Breakdown
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="grid md:grid-cols-4 gap-4">
                        <div className="p-4 rounded-lg bg-emerald-900/20 border border-emerald-800/50">
                            <div className="flex items-center gap-2 mb-2">
                                <CheckCircle className="w-5 h-5 text-emerald-400" />
                                <span className="text-sm text-emerald-300">Verified</span>
                            </div>
                            <p className="text-3xl font-bold text-emerald-400">{analytics?.businesses.active || 0}</p>
                        </div>
                        <div className="p-4 rounded-lg bg-amber-900/20 border border-amber-800/50">
                            <div className="flex items-center gap-2 mb-2">
                                <Clock className="w-5 h-5 text-amber-400" />
                                <span className="text-sm text-amber-300">Pending</span>
                            </div>
                            <p className="text-3xl font-bold text-amber-400">{analytics?.businesses.pending || 0}</p>
                        </div>
                        <div className="p-4 rounded-lg bg-red-900/20 border border-red-800/50">
                            <div className="flex items-center gap-2 mb-2">
                                <Activity className="w-5 h-5 text-red-400" />
                                <span className="text-sm text-red-300">Suspended</span>
                            </div>
                            <p className="text-3xl font-bold text-red-400">{analytics?.businesses.suspended || 0}</p>
                        </div>
                        <div className="p-4 rounded-lg bg-zinc-800/50 border border-zinc-700/50">
                            <div className="flex items-center gap-2 mb-2">
                                <TrendingUp className="w-5 h-5 text-zinc-400" />
                                <span className="text-sm text-zinc-300">New This Month</span>
                            </div>
                            <p className="text-3xl font-bold text-white">{analytics?.businesses.newThisMonth || 0}</p>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
