'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Progress } from '@/components/ui/progress';
import {
    MessageSquare,
    Users,
    Database,
    TrendingUp,
    Activity,
    ArrowRight,
    Bot,
    UserCheck,
    Clock,
    BarChart3,
} from 'lucide-react';
import Link from 'next/link';

interface DashboardStats {
    totalSessions: number;
    activeSessions: number;
    takenOverSessions: number;
    totalKnowledge: number;
    recentSessions: any[];
    knowledgeByType: Record<string, number>;
}

export default function AdminDashboard() {
    const router = useRouter();
    const [stats, setStats] = useState<DashboardStats>({
        totalSessions: 0,
        activeSessions: 0,
        takenOverSessions: 0,
        totalKnowledge: 0,
        recentSessions: [],
        knowledgeByType: {},
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchDashboardData();
        const interval = setInterval(fetchDashboardData, 5000);
        return () => clearInterval(interval);
    }, []);

    const fetchDashboardData = async () => {
        try {
            const sessionsRes = await fetch('/api/admin/sessions?status=all&limit=10', {
                credentials: 'same-origin',
            });
            const knowledgeRes = await fetch('/api/admin/knowledge', {
                credentials: 'same-origin',
            });

            if (sessionsRes.status === 401 || knowledgeRes.status === 401) {
                router.push('/admin/login');
                return;
            }

            const sessionsData = await sessionsRes.json();
            const knowledgeData = await knowledgeRes.json();

            const sessions = sessionsData.sessions || [];
            const knowledge = knowledgeData.entries || [];

            const knowledgeByType: Record<string, number> = {};
            knowledge.forEach((entry: any) => {
                knowledgeByType[entry.type] = (knowledgeByType[entry.type] || 0) + 1;
            });

            setStats({
                totalSessions: sessions.length,
                activeSessions: sessions.filter((s: any) => s.status === 'active').length,
                takenOverSessions: sessions.filter((s: any) => s.status === 'taken_over').length,
                totalKnowledge: knowledge.length,
                recentSessions: sessions.slice(0, 5),
                knowledgeByType,
            });
        } catch (error) {
            console.error('Failed to fetch dashboard data:', error);
        } finally {
            setLoading(false);
        }
    };

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'active':
                return <Badge className="bg-emerald-500">Active</Badge>;
            case 'taken_over':
                return <Badge className="bg-amber-500">Taken Over</Badge>;
            case 'closed':
                return <Badge variant="secondary" className="bg-zinc-700 text-zinc-300">Closed</Badge>;
            default:
                return <Badge variant="secondary">{status}</Badge>;
        }
    };

    if (loading) {
        return (
            <div className="min-h-[60vh] flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500"></div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div>
                    <h1 className="text-3xl font-bold text-white">Dashboard</h1>
                    <p className="text-zinc-400 mt-1">
                        Welcome back, monitor your business performance
                    </p>
                </div>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <Card className="relative overflow-hidden bg-zinc-900/50 border-zinc-800 backdrop-blur">
                    <div className="absolute inset-0 bg-gradient-to-br from-emerald-600/10 to-transparent"></div>
                    <CardHeader className="relative flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium text-zinc-400">Active Chats</CardTitle>
                        <div className="w-10 h-10 bg-emerald-600/20 rounded-lg flex items-center justify-center">
                            <MessageSquare className="w-5 h-5 text-emerald-400" />
                        </div>
                    </CardHeader>
                    <CardContent className="relative">
                        <div className="text-3xl font-bold text-white">{stats.activeSessions}</div>
                        <p className="text-xs text-zinc-500 mt-1">
                            {stats.takenOverSessions > 0 && `${stats.takenOverSessions} taken over by admin`}
                        </p>
                    </CardContent>
                </Card>

                <Card className="relative overflow-hidden bg-zinc-900/50 border-zinc-800 backdrop-blur">
                    <div className="absolute inset-0 bg-gradient-to-br from-green-600/10 to-transparent"></div>
                    <CardHeader className="relative flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium text-zinc-400">Total Sessions</CardTitle>
                        <div className="w-10 h-10 bg-green-600/20 rounded-lg flex items-center justify-center">
                            <Users className="w-5 h-5 text-green-400" />
                        </div>
                    </CardHeader>
                    <CardContent className="relative">
                        <div className="text-3xl font-bold text-white">{stats.totalSessions}</div>
                        <p className="text-xs text-zinc-500 mt-1">All time sessions</p>
                    </CardContent>
                </Card>

                <Card className="relative overflow-hidden bg-zinc-900/50 border-zinc-800 backdrop-blur">
                    <div className="absolute inset-0 bg-gradient-to-br from-teal-600/10 to-transparent"></div>
                    <CardHeader className="relative flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium text-zinc-400">Knowledge Base</CardTitle>
                        <div className="w-10 h-10 bg-teal-600/20 rounded-lg flex items-center justify-center">
                            <Database className="w-5 h-5 text-teal-400" />
                        </div>
                    </CardHeader>
                    <CardContent className="relative">
                        <div className="text-3xl font-bold text-white">{stats.totalKnowledge}</div>
                        <p className="text-xs text-zinc-500 mt-1">Total entries</p>
                    </CardContent>
                </Card>

                <Card className="relative overflow-hidden bg-zinc-900/50 border-zinc-800 backdrop-blur">
                    <div className="absolute inset-0 bg-gradient-to-br from-purple-600/10 to-transparent"></div>
                    <CardHeader className="relative flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium text-zinc-400">Bot Status</CardTitle>
                        <div className="w-10 h-10 bg-purple-600/20 rounded-lg flex items-center justify-center">
                            <Bot className="w-5 h-5 text-purple-400" />
                        </div>
                    </CardHeader>
                    <CardContent className="relative">
                        <div className="text-3xl font-bold text-emerald-400">Active</div>
                        <p className="text-xs text-zinc-500 mt-1">AI responding normally</p>
                    </CardContent>
                </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Knowledge Distribution */}
                <Card className="lg:col-span-1 bg-zinc-900/50 border-zinc-800 backdrop-blur">
                    <CardHeader>
                        <CardTitle className="text-lg text-white flex items-center gap-2">
                            <BarChart3 className="w-5 h-5 text-emerald-400" />
                            Knowledge Distribution
                        </CardTitle>
                        <CardDescription className="text-zinc-500">By entry type</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {Object.entries(stats.knowledgeByType).map(([type, count]) => {
                                const percentage = (count / stats.totalKnowledge) * 100;
                                return (
                                    <div key={type} className="space-y-2">
                                        <div className="flex items-center justify-between text-sm">
                                            <span className="capitalize text-zinc-400">{type.replace('_', ' ')}</span>
                                            <span className="font-medium text-white">{count}</span>
                                        </div>
                                        <Progress value={percentage} className="h-2 bg-zinc-800 [&>div]:bg-gradient-to-r [&>div]:from-emerald-600 [&>div]:to-green-500" />
                                    </div>
                                );
                            })}
                            {stats.totalKnowledge === 0 && (
                                <p className="text-sm text-zinc-500 text-center py-4">
                                    No knowledge entries yet
                                </p>
                            )}
                        </div>
                        <Separator className="my-4 bg-zinc-800" />
                        <Link href="/admin/knowledge">
                            <Button variant="outline" className="w-full border-zinc-700 text-zinc-300 hover:text-white hover:bg-zinc-800">
                                Manage Knowledge
                                <ArrowRight className="w-4 h-4 ml-2" />
                            </Button>
                        </Link>
                    </CardContent>
                </Card>

                {/* Recent Sessions */}
                <Card className="lg:col-span-2 bg-zinc-900/50 border-zinc-800 backdrop-blur">
                    <CardHeader className="flex flex-row items-center justify-between">
                        <div>
                            <CardTitle className="text-lg text-white flex items-center gap-2">
                                <Clock className="w-5 h-5 text-emerald-400" />
                                Recent Chat Sessions
                            </CardTitle>
                            <CardDescription className="text-zinc-500">Latest customer conversations</CardDescription>
                        </div>
                        <Link href="/admin/sessions">
                            <Button variant="outline" size="sm" className="border-zinc-700 text-zinc-300 hover:text-white hover:bg-zinc-800">
                                View All
                                <ArrowRight className="w-4 h-4 ml-2" />
                            </Button>
                        </Link>
                    </CardHeader>
                    <CardContent>
                        <ScrollArea className="h-[300px]">
                            {stats.recentSessions.length === 0 ? (
                                <div className="text-center text-zinc-500 py-8">
                                    <MessageSquare className="w-12 h-12 mx-auto mb-4 opacity-50" />
                                    <p>No chat sessions yet</p>
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    {stats.recentSessions.map((session: any) => (
                                        <div
                                            key={session._id}
                                            className="flex items-center justify-between p-3 rounded-lg bg-zinc-800/30 border border-zinc-700/50 hover:bg-zinc-800/50 transition-colors"
                                        >
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-lg bg-zinc-800 flex items-center justify-center">
                                                    {session.status === 'taken_over' ? (
                                                        <UserCheck className="w-5 h-5 text-amber-400" />
                                                    ) : (
                                                        <MessageSquare className="w-5 h-5 text-zinc-500" />
                                                    )}
                                                </div>
                                                <div>
                                                    <p className="font-medium text-sm text-white">
                                                        Session {session.sessionId.slice(0, 12)}...
                                                    </p>
                                                    <p className="text-xs text-zinc-500">
                                                        {session.messages.length} messages
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                {getStatusBadge(session.status)}
                                                <Link href={`/admin/sessions/${session.sessionId}`}>
                                                    <Button variant="ghost" size="sm" className="text-zinc-400 hover:text-white hover:bg-zinc-800">
                                                        View
                                                    </Button>
                                                </Link>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </ScrollArea>
                    </CardContent>
                </Card>
            </div>

            {/* Quick Actions */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card className="relative overflow-hidden bg-gradient-to-br from-emerald-900/20 to-zinc-900 border-emerald-800/30 backdrop-blur">
                    <div className="absolute inset-0 bg-gradient-to-br from-emerald-600/5 to-transparent"></div>
                    <CardHeader className="relative">
                        <CardTitle className="text-lg text-white flex items-center gap-2">
                            <Activity className="w-5 h-5 text-emerald-400" />
                            Live Monitoring
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="relative">
                        <p className="text-sm text-zinc-400 mb-4">
                            Monitor active conversations and take over when needed.
                        </p>
                        <Link href="/admin/sessions">
                            <Button className="w-full bg-emerald-600 hover:bg-emerald-700 text-white">
                                Open Live Chats
                            </Button>
                        </Link>
                    </CardContent>
                </Card>

                <Card className="relative overflow-hidden bg-gradient-to-br from-green-900/20 to-zinc-900 border-green-800/30 backdrop-blur">
                    <div className="absolute inset-0 bg-gradient-to-br from-green-600/5 to-transparent"></div>
                    <CardHeader className="relative">
                        <CardTitle className="text-lg text-white flex items-center gap-2">
                            <Database className="w-5 h-5 text-green-400" />
                            Knowledge Base
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="relative">
                        <p className="text-sm text-zinc-400 mb-4">
                            Manage bot knowledge. Add products, services, FAQs, and more.
                        </p>
                        <Link href="/admin/knowledge">
                            <Button variant="outline" className="w-full border-green-600/30 text-green-400 hover:bg-green-600/10 hover:text-green-300">
                                Manage Knowledge
                            </Button>
                        </Link>
                    </CardContent>
                </Card>

                <Card className="relative overflow-hidden bg-gradient-to-br from-amber-900/20 to-zinc-900 border-amber-800/30 backdrop-blur">
                    <div className="absolute inset-0 bg-gradient-to-br from-amber-600/5 to-transparent"></div>
                    <CardHeader className="relative">
                        <CardTitle className="text-lg text-white flex items-center gap-2">
                            <TrendingUp className="w-5 h-5 text-amber-400" />
                            Analytics
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="relative">
                        <p className="text-sm text-zinc-400 mb-4">
                            View conversation statistics and bot performance metrics.
                        </p>
                        <Button variant="outline" className="w-full border-amber-600/30 text-amber-400 hover:bg-amber-600/10 hover:text-amber-300" disabled>
                            Coming Soon
                        </Button>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
