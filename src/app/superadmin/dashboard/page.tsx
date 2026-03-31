'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import Link from 'next/link';
import {
    Building2,
    MessageSquare,
    Clock,
    Database,
    Activity,
    TrendingUp,
    ArrowRight,
    AlertCircle,
    CheckCircle,
    XCircle,
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

export default function OverviewPage() {
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

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'verified':
                return <Badge className="bg-emerald-500"><CheckCircle className="w-3 h-3 mr-1" /> Active</Badge>;
            case 'pending':
                return <Badge variant="secondary"><Clock className="w-3 h-3 mr-1" /> Pending</Badge>;
            case 'suspended':
                return <Badge variant="destructive"><XCircle className="w-3 h-3 mr-1" /> Suspended</Badge>;
            default:
                return <Badge variant="secondary">{status}</Badge>;
        }
    };

    const maxSessions = analytics?.dailySessions?.reduce((max, d) => Math.max(max, d.count), 0) || 1;

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

            {/* Quick Stats */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <Card className="relative overflow-hidden bg-zinc-900/50 border-zinc-800 backdrop-blur">
                    <div className="absolute inset-0 bg-gradient-to-br from-emerald-600/10 to-transparent"></div>
                    <CardHeader className="relative flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium text-zinc-400">Active Businesses</CardTitle>
                        <div className="w-10 h-10 bg-emerald-600/20 rounded-lg flex items-center justify-center">
                            <Building2 className="w-5 h-5 text-emerald-400" />
                        </div>
                    </CardHeader>
                    <CardContent className="relative">
                        <div className="text-3xl font-bold text-white">{analytics?.businesses.active || 0}</div>
                        <p className="text-xs text-emerald-400 mt-1 flex items-center gap-1">
                            <TrendingUp className="w-3 h-3" />
                            +{analytics?.businesses.newThisMonth || 0} this month
                        </p>
                    </CardContent>
                </Card>

                <Card className="relative overflow-hidden bg-zinc-900/50 border-zinc-800 backdrop-blur">
                    <div className="absolute inset-0 bg-gradient-to-br from-green-600/10 to-transparent"></div>
                    <CardHeader className="relative flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium text-zinc-400">Sessions Today</CardTitle>
                        <div className="w-10 h-10 bg-green-600/20 rounded-lg flex items-center justify-center">
                            <MessageSquare className="w-5 h-5 text-green-400" />
                        </div>
                    </CardHeader>
                    <CardContent className="relative">
                        <div className="text-3xl font-bold text-white">{analytics?.sessions.today || 0}</div>
                        <p className="text-xs text-zinc-500 mt-1">
                            {analytics?.sessions.active || 0} active now
                        </p>
                    </CardContent>
                </Card>

                <Card className="relative overflow-hidden bg-zinc-900/50 border-zinc-800 backdrop-blur">
                    <div className="absolute inset-0 bg-gradient-to-br from-amber-600/10 to-transparent"></div>
                    <CardHeader className="relative flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium text-zinc-400">Pending Approval</CardTitle>
                        <div className="w-10 h-10 bg-amber-600/20 rounded-lg flex items-center justify-center">
                            <Clock className="w-5 h-5 text-amber-400" />
                        </div>
                    </CardHeader>
                    <CardContent className="relative">
                        <div className="text-3xl font-bold text-white">{analytics?.businesses.pending || 0}</div>
                        <p className="text-xs text-amber-400 mt-1">
                            Awaiting verification
                        </p>
                    </CardContent>
                </Card>

                <Card className="relative overflow-hidden bg-zinc-900/50 border-zinc-800 backdrop-blur">
                    <div className="absolute inset-0 bg-gradient-to-br from-teal-600/10 to-transparent"></div>
                    <CardHeader className="relative flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium text-zinc-400">Knowledge Entries</CardTitle>
                        <div className="w-10 h-10 bg-teal-600/20 rounded-lg flex items-center justify-center">
                            <Database className="w-5 h-5 text-teal-400" />
                        </div>
                    </CardHeader>
                    <CardContent className="relative">
                        <div className="text-3xl font-bold text-white">{analytics?.knowledge.active || 0}</div>
                        <p className="text-xs text-zinc-500 mt-1">
                            Across all businesses
                        </p>
                    </CardContent>
                </Card>
            </div>

            {/* Charts Row */}
            <div className="grid lg:grid-cols-2 gap-6">
                {/* Sessions Chart */}
                <Card className="bg-zinc-900/50 border-zinc-800 backdrop-blur">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-white">
                            <Activity className="w-5 h-5 text-emerald-400" />
                            Sessions (Last 7 Days)
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-end gap-2 h-40">
                            {analytics?.dailySessions?.map((day, i) => (
                                <div key={i} className="flex-1 flex flex-col items-center gap-1">
                                    <div
                                        className="w-full bg-gradient-to-t from-emerald-600 to-green-500 rounded-t-sm transition-all hover:from-emerald-500 hover:to-green-400"
                                        style={{ height: `${(day.count / maxSessions) * 100}%`, minHeight: '4px' }}
                                    />
                                    <span className="text-xs text-zinc-500">
                                        {new Date(day._id).toLocaleDateString('en', { weekday: 'short' })}
                                    </span>
                                </div>
                            ))}
                            {analytics?.dailySessions?.length === 0 && (
                                <div className="text-zinc-500 text-center w-full">No data</div>
                            )}
                        </div>
                    </CardContent>
                </Card>

                {/* Top Businesses */}
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

            {/* Recent Businesses & Knowledge Distribution */}
            <div className="grid lg:grid-cols-2 gap-6">
                {/* Recent Businesses */}
                <Card className="bg-zinc-900/50 border-zinc-800 backdrop-blur">
                    <CardHeader className="flex flex-row items-center justify-between">
                        <CardTitle className="flex items-center gap-2 text-white">
                            <Building2 className="w-5 h-5 text-emerald-400" />
                            Recent Businesses
                        </CardTitle>
                        <Link href="/superadmin/businesses">
                            <Button variant="ghost" size="sm" className="text-emerald-400 hover:text-emerald-300 hover:bg-zinc-800">
                                View All <ArrowRight className="w-4 h-4 ml-2" />
                            </Button>
                        </Link>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-3">
                            {analytics?.recentBusinesses?.map((business) => (
                                <div key={business._id} className="flex items-center justify-between p-3 rounded-lg bg-zinc-800/30 hover:bg-zinc-800/50 border border-zinc-700/50 transition-colors">
                                    <div>
                                        <p className="font-medium text-sm text-white">{business.name}</p>
                                        <p className="text-xs text-zinc-500">{business.email}</p>
                                    </div>
                                    {getStatusBadge(business.status)}
                                </div>
                            ))}
                            {analytics?.recentBusinesses?.length === 0 && (
                                <div className="text-zinc-500 text-center py-4">No businesses yet</div>
                            )}
                        </div>
                    </CardContent>
                </Card>

                {/* Knowledge Distribution */}
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
            </div>
        </div>
    );
}
