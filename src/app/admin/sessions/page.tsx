'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { io, Socket } from 'socket.io-client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import {
    MessageSquare,
    Users,
    UserCheck,
    Search,
    ArrowRight,
    Facebook,
    Smartphone,
    Globe,
    Instagram,
    Clock,
    RefreshCw,
} from 'lucide-react';

interface ChatMessage {
    role: 'user' | 'bot' | 'admin';
    text: string;
    timestamp: string;
    adminId?: string;
}

interface ChatSession {
    _id: string;
    sessionId: string;
    channel?: 'website' | 'facebook' | 'whatsapp' | 'instagram';
    externalId?: string;
    status: 'active' | 'taken_over' | 'closed';
    messages: ChatMessage[];
    takenOverBy?: string;
    takenOverAt?: string;
    createdAt: string;
    updatedAt: string;
    lastActivityAt: string;
    userInfo?: {
        name?: string;
    };
}

export default function SessionsPage() {
    const router = useRouter();
    const [sessions, setSessions] = useState<ChatSession[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [socket, setSocket] = useState<Socket | null>(null);

    // Initialize socket connection
    useEffect(() => {
        const initSocket = () => {
            const newSocket = io({
                path: '/api/socket',
                addTrailingSlash: false,
            });

            newSocket.on('connect', () => {
                console.log('Sessions page socket connected:', newSocket.id);
                newSocket.emit('join-admin');
            });

            // Listen for session updates
            newSocket.on('session-updated', (data: { sessionId: string; message: ChatMessage }) => {
                const messageExists = (messages: ChatMessage[], newMsg: ChatMessage) => {
                    const newTime = new Date(newMsg.timestamp).getTime();
                    return messages.some(m => {
                        const mTime = new Date(m.timestamp).getTime();
                        return m.text === newMsg.text &&
                            m.role === newMsg.role &&
                            Math.abs(mTime - newTime) < 2000;
                    });
                };

                setSessions(prev => {
                    const updated = prev.map(s => {
                        if (s.sessionId === data.sessionId) {
                            if (messageExists(s.messages, data.message)) return s;
                            return {
                                ...s,
                                messages: [...s.messages, data.message],
                                lastActivityAt: new Date().toISOString(),
                            };
                        }
                        return s;
                    });
                    return updated;
                });
            });

            // Listen for new session created
            newSocket.on('session-created', (data: { sessionId: string; channel: string }) => {
                fetchSessions();
                toast.info(`New ${data.channel} session started`);
            });

            // Listen for session takeover
            newSocket.on('session-taken-over', (data: { sessionId: string; adminId: string }) => {
                setSessions(prev => prev.map(s => {
                    if (s.sessionId === data.sessionId) {
                        return { ...s, status: 'taken_over', takenOverBy: data.adminId };
                    }
                    return s;
                }));
            });

            // Listen for session closed
            newSocket.on('session-closed', (data: { sessionId: string }) => {
                setSessions(prev => prev.map(s => {
                    if (s.sessionId === data.sessionId) {
                        return { ...s, status: 'closed', takenOverBy: undefined };
                    }
                    return s;
                }));
            });

            setSocket(newSocket);

            return () => {
                newSocket.disconnect();
            };
        };

        initSocket();
    }, []);

    const fetchSessions = useCallback(async () => {
        try {
            const response = await fetch('/api/admin/sessions?status=all', {
                credentials: 'same-origin',
            });
            if (response.status === 401) {
                router.push('/admin/login');
                return;
            }
            const data = await response.json();
            if (data.sessions) {
                setSessions(data.sessions);
            }
        } catch (error) {
            console.error('Failed to fetch sessions:', error);
        } finally {
            setLoading(false);
        }
    }, [router]);

    // Initial fetch
    useEffect(() => {
        fetchSessions();
    }, [fetchSessions]);

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

    const getChannelIcon = (channel?: string) => {
        switch (channel) {
            case 'facebook':
                return <Facebook className="w-4 h-4 text-blue-400" />;
            case 'whatsapp':
                return <Smartphone className="w-4 h-4 text-green-400" />;
            case 'instagram':
                return <Instagram className="w-4 h-4 text-pink-400" />;
            case 'website':
            default:
                return <Globe className="w-4 h-4 text-zinc-500" />;
        }
    };

    const formatTimeAgo = (date: string) => {
        const now = new Date();
        const then = new Date(date);
        const diff = Math.floor((now.getTime() - then.getTime()) / 1000);

        if (diff < 60) return 'Just now';
        if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
        if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
        return `${Math.floor(diff / 86400)}d ago`;
    };

    const filteredSessions = sessions.filter(s => {
        if (!searchQuery) return true;
        const query = searchQuery.toLowerCase();
        return (
            s.sessionId.toLowerCase().includes(query) ||
            s.userInfo?.name?.toLowerCase().includes(query) ||
            s.messages.some(m => m.text.toLowerCase().includes(query))
        );
    });

    const activeSessions = filteredSessions
        .filter(s => s.status === 'active' || s.status === 'taken_over')
        .sort((a, b) => new Date(b.lastActivityAt).getTime() - new Date(a.lastActivityAt).getTime());

    const closedSessions = filteredSessions
        .filter(s => s.status === 'closed')
        .sort((a, b) => new Date(b.lastActivityAt).getTime() - new Date(a.lastActivityAt).getTime());

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-white">Chat Sessions</h1>
                    <p className="text-zinc-400 mt-1">View and manage all customer conversations</p>
                </div>
                <div className="flex items-center gap-2">
                    <Button variant="outline" onClick={fetchSessions} disabled={loading}
                        className="border-zinc-700 text-zinc-300 hover:text-white hover:bg-zinc-800">
                        <RefreshCw className={cn("w-4 h-4 mr-2", loading && "animate-spin")} />
                        {loading ? 'Loading...' : 'Refresh'}
                    </Button>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Card className="bg-zinc-900/50 border-zinc-800 backdrop-blur">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium text-zinc-400">Total Sessions</CardTitle>
                        <Users className="w-4 h-4 text-zinc-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-white">{sessions.length}</div>
                        <p className="text-xs text-zinc-500">All time</p>
                    </CardContent>
                </Card>
                <Card className="bg-zinc-900/50 border-zinc-800 backdrop-blur">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium text-zinc-400">Active</CardTitle>
                        <MessageSquare className="w-4 h-4 text-emerald-400" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-emerald-400">
                            {sessions.filter(s => s.status === 'active').length}
                        </div>
                        <p className="text-xs text-zinc-500">Need attention</p>
                    </CardContent>
                </Card>
                <Card className="bg-zinc-900/50 border-zinc-800 backdrop-blur">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium text-zinc-400">Taken Over</CardTitle>
                        <UserCheck className="w-4 h-4 text-amber-400" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-amber-400">
                            {sessions.filter(s => s.status === 'taken_over').length}
                        </div>
                        <p className="text-xs text-zinc-500">By admins</p>
                    </CardContent>
                </Card>
                <Card className="bg-zinc-900/50 border-zinc-800 backdrop-blur">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium text-zinc-400">Closed</CardTitle>
                        <Clock className="w-4 h-4 text-zinc-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-zinc-400">
                            {sessions.filter(s => s.status === 'closed').length}
                        </div>
                        <p className="text-xs text-zinc-500">Completed</p>
                    </CardContent>
                </Card>
            </div>

            {/* Search */}
            <Card className="bg-zinc-900/50 border-zinc-800 backdrop-blur">
                <CardContent className="p-4">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                        <Input
                            placeholder="Search by session ID, user name, or message content..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-9 bg-zinc-950 border-zinc-800 text-white placeholder:text-zinc-500 focus:border-emerald-600"
                        />
                    </div>
                </CardContent>
            </Card>

            {/* Sessions List */}
            <Card className="bg-zinc-900/50 border-zinc-800 backdrop-blur">
                <CardHeader>
                    <CardTitle className="text-white">All Sessions</CardTitle>
                    <CardDescription className="text-zinc-500">Click on a session to view full conversation</CardDescription>
                </CardHeader>
                <CardContent className="p-0">
                    <Tabs defaultValue="active" className="w-full">
                        <TabsList className="w-full grid grid-cols-2 bg-zinc-800">
                            <TabsTrigger value="active" className="text-zinc-300 data-[state=active]:bg-zinc-700 data-[state=active]:text-white">
                                Active ({activeSessions.length})
                            </TabsTrigger>
                            <TabsTrigger value="closed" className="text-zinc-300 data-[state=active]:bg-zinc-700 data-[state=active]:text-white">
                                Closed ({closedSessions.length})
                            </TabsTrigger>
                        </TabsList>

                        <TabsContent value="active" className="m-0">
                            <ScrollArea className="h-[500px]">
                                {activeSessions.length === 0 ? (
                                    <div className="p-8 text-center text-zinc-500">
                                        <MessageSquare className="w-12 h-12 mx-auto mb-4 opacity-50" />
                                        <p className="text-lg font-medium text-white">No active sessions</p>
                                        <p className="text-sm">New conversations will appear here</p>
                                    </div>
                                ) : (
                                    <div className="divide-y divide-zinc-800">
                                        {activeSessions.map((session) => (
                                            <Link
                                                key={session._id}
                                                href={`/admin/sessions/${session.sessionId}`}
                                                className="block p-4 hover:bg-zinc-800/50 transition-colors"
                                            >
                                                <div className="flex items-start justify-between">
                                                    <div className="flex items-center gap-3">
                                                        <Avatar className="w-10 h-10">
                                                            <AvatarFallback className={cn(
                                                                "text-sm",
                                                                session.channel === 'website' || !session.channel
                                                                    ? "bg-emerald-600/20 text-emerald-400"
                                                                    : "bg-zinc-800 text-zinc-400"
                                                            )}>
                                                                {session.channel === 'facebook' ? 'F' :
                                                                    session.channel === 'whatsapp' ? 'W' :
                                                                        session.channel === 'instagram' ? 'I' :
                                                                            <Globe className="w-5 h-5" />}
                                                            </AvatarFallback>
                                                        </Avatar>
                                                        <div>
                                                            <div className="flex items-center gap-2">
                                                                <p className="font-medium text-white">
                                                                    {session.userInfo?.name || (session.channel === 'website' || !session.channel ? 'Website User' : 'Anonymous User')}
                                                                </p>
                                                                {getChannelIcon(session.channel)}
                                                            </div>
                                                            <div className="flex items-center gap-2 mt-1">
                                                                <p className="text-xs text-zinc-500 font-mono">
                                                                    {session.sessionId.slice(0, 20)}...
                                                                </p>
                                                                <span className="text-zinc-600">·</span>
                                                                <p className="text-xs text-zinc-500">
                                                                    {session.messages.length} messages
                                                                </p>
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <div className="flex flex-col items-end gap-2">
                                                        {getStatusBadge(session.status)}
                                                        <span className="text-xs text-zinc-500">
                                                            {formatTimeAgo(session.lastActivityAt)}
                                                        </span>
                                                    </div>
                                                </div>
                                                {session.messages.length > 0 && (
                                                    <div className="mt-3 flex items-center justify-between">
                                                        <p className="text-sm text-zinc-400 truncate max-w-[70%]">
                                                            <span className="font-medium text-zinc-300">
                                                                {session.messages[session.messages.length - 1].role === 'user' ? 'User: ' :
                                                                    session.messages[session.messages.length - 1].role === 'admin' ? 'Admin: ' : 'Bot: '}
                                                            </span>
                                                            {session.messages[session.messages.length - 1].text.slice(0, 60)}
                                                            {session.messages[session.messages.length - 1].text.length > 60 && '...'}
                                                        </p>
                                                        <ArrowRight className="w-4 h-4 text-zinc-500" />
                                                    </div>
                                                )}
                                            </Link>
                                        ))}
                                    </div>
                                )}
                            </ScrollArea>
                        </TabsContent>

                        <TabsContent value="closed" className="m-0">
                            <ScrollArea className="h-[500px]">
                                {closedSessions.length === 0 ? (
                                    <div className="p-8 text-center text-zinc-500">
                                        <Clock className="w-12 h-12 mx-auto mb-4 opacity-50" />
                                        <p className="text-lg font-medium text-white">No closed sessions</p>
                                        <p className="text-sm">Closed conversations will appear here</p>
                                    </div>
                                ) : (
                                    <div className="divide-y divide-zinc-800">
                                        {closedSessions.map((session) => (
                                            <Link
                                                key={session._id}
                                                href={`/admin/sessions/${session.sessionId}`}
                                                className="block p-4 hover:bg-zinc-800/50 transition-colors opacity-70"
                                            >
                                                <div className="flex items-center justify-between">
                                                    <div className="flex items-center gap-3">
                                                        <Avatar className="w-8 h-8">
                                                            <AvatarFallback className={cn(
                                                                "text-xs",
                                                                session.channel === 'website' || !session.channel
                                                                    ? "bg-emerald-600/20 text-emerald-400"
                                                                    : "bg-zinc-800 text-zinc-400"
                                                            )}>
                                                                {session.channel === 'facebook' ? 'F' :
                                                                    session.channel === 'whatsapp' ? 'W' :
                                                                        session.channel === 'instagram' ? 'I' :
                                                                            <Globe className="w-4 h-4" />}
                                                            </AvatarFallback>
                                                        </Avatar>
                                                        <div>
                                                            <p className="text-sm font-medium text-white">
                                                                {session.userInfo?.name || (session.channel === 'website' || !session.channel ? 'Website User' : 'Anonymous User')}
                                                            </p>
                                                            <p className="text-xs text-zinc-500">
                                                                {session.sessionId.slice(0, 20)}... · {session.messages.length} messages
                                                            </p>
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        {getStatusBadge(session.status)}
                                                        <ArrowRight className="w-4 h-4 text-zinc-500" />
                                                    </div>
                                                </div>
                                            </Link>
                                        ))}
                                    </div>
                                )}
                            </ScrollArea>
                        </TabsContent>
                    </Tabs>
                </CardContent>
            </Card>
        </div>
    );
}
