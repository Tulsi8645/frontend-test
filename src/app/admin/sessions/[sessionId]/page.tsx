'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { io, Socket } from 'socket.io-client';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import {
    MessageSquare,
    Send,
    UserCheck,
    X,
    ArrowLeft,
    Facebook,
    Smartphone,
    Globe,
    Instagram,
    MoreVertical,
    Trash2,
} from 'lucide-react';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

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
        userAgent?: string;
        ip?: string;
        referrer?: string;
    };
}

export default function SessionDetailPage() {
    const router = useRouter();
    const params = useParams();
    const sessionId = params?.sessionId as string;

    const [session, setSession] = useState<ChatSession | null>(null);
    const [loading, setLoading] = useState(true);
    const [replyMessage, setReplyMessage] = useState('');
    const [isTakingOver, setIsTakingOver] = useState(false);
    const [isSending, setIsSending] = useState(false);
    const [socket, setSocket] = useState<Socket | null>(null);
    const [adminId, setAdminId] = useState<string>('');
    const messagesEndRef = useRef<HTMLDivElement>(null);

    // Get admin ID from token
    useEffect(() => {
        const getAdminId = () => {
            const token = document.cookie.match(/admin_token=([^;]+)/)?.[1];
            if (token) {
                try {
                    const decoded = JSON.parse(atob(token));
                    setAdminId(decoded.userId);
                } catch {
                    setAdminId('admin');
                }
            }
        };
        getAdminId();
    }, []);

    // Fetch session data
    const fetchSession = useCallback(async () => {
        if (!sessionId) return;

        try {
            const response = await fetch(`/api/admin/sessions/${sessionId}`, {
                credentials: 'same-origin',
            });
            if (response.status === 401) {
                router.push('/admin/login');
                return;
            }
            if (response.status === 404) {
                toast.error('Session not found');
                router.push('/admin/sessions');
                return;
            }
            const data = await response.json();
            if (data.session) {
                setSession(data.session);
            }
        } catch (error) {
            console.error('Failed to fetch session:', error);
            toast.error('Failed to load session');
        } finally {
            setLoading(false);
        }
    }, [sessionId, router]);

    // Initial fetch
    useEffect(() => {
        fetchSession();
    }, [fetchSession]);

    // Initialize socket connection
    useEffect(() => {
        const initSocket = () => {
            const newSocket = io({
                path: '/api/socket',
                addTrailingSlash: false,
            });

            newSocket.on('connect', () => {
                console.log('Session detail socket connected:', newSocket.id);
                newSocket.emit('join-admin');
                if (sessionId) {
                    newSocket.emit('join-session', sessionId);
                }
            });

            // Listen for new messages
            newSocket.on('new-message', (data: ChatMessage) => {
                setSession(prev => {
                    if (!prev) return prev;
                    const exists = prev.messages.some(m =>
                        m.text === data.text &&
                        m.role === data.role &&
                        Math.abs(new Date(m.timestamp).getTime() - new Date(data.timestamp).getTime()) < 2000
                    );
                    if (exists) return prev;

                    return {
                        ...prev,
                        messages: [...prev.messages, data],
                        lastActivityAt: new Date().toISOString(),
                    };
                });
            });

            // Listen for session takeover
            newSocket.on('session-taken-over', (data: { sessionId: string; adminId: string }) => {
                if (data.sessionId === sessionId) {
                    setSession(prev => {
                        if (!prev) return prev;
                        return { ...prev, status: 'taken_over', takenOverBy: data.adminId };
                    });
                    toast.info('Session taken over by another admin');
                }
            });

            // Listen for session closed
            newSocket.on('session-closed', (data: { sessionId: string }) => {
                if (data.sessionId === sessionId) {
                    setSession(prev => {
                        if (!prev) return prev;
                        return { ...prev, status: 'closed' };
                    });
                    toast.info('Session closed');
                }
            });

            setSocket(newSocket);

            return () => {
                newSocket.disconnect();
            };
        };

        initSocket();
    }, [sessionId]);

    // Auto-scroll to bottom when new messages arrive
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [session?.messages]);

    const handleTakeover = async () => {
        if (!socket || !adminId || !session) return;

        setIsTakingOver(true);
        try {
            const response = await fetch(`/api/admin/sessions/${session.sessionId}`, {
                method: 'POST',
                credentials: 'same-origin',
            });

            if (response.ok) {
                const data = await response.json();
                setSession(data.session);

                socket.emit('takeover-session', { sessionId: session.sessionId, adminId });
                toast.success('Session taken over successfully');
            }
        } catch (error) {
            console.error('Failed to take over:', error);
            toast.error('Failed to take over session');
        } finally {
            setIsTakingOver(false);
        }
    };

    const handleSendReply = async () => {
        if (!session || !replyMessage.trim() || !socket || !adminId) return;

        setIsSending(true);
        try {
            const response = await fetch(`/api/admin/sessions/${session.sessionId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'same-origin',
                body: JSON.stringify({ message: replyMessage }),
            });

            if (response.ok) {
                socket.emit('admin-message', {
                    sessionId: session.sessionId,
                    message: replyMessage,
                    adminId,
                });

                setReplyMessage('');
            }
        } catch (error) {
            console.error('Failed to send:', error);
            toast.error('Failed to send message');
        } finally {
            setIsSending(false);
        }
    };

    const handleCloseSession = async () => {
        if (!session) return;

        try {
            const response = await fetch(`/api/admin/sessions/${session.sessionId}`, {
                method: 'DELETE',
                credentials: 'same-origin',
            });

            if (response.ok) {
                socket?.emit('close-session', { sessionId: session.sessionId });
                toast.success('Session closed');
                router.push('/admin/sessions');
            }
        } catch (error) {
            console.error('Failed to close:', error);
            toast.error('Failed to close session');
        }
    };

    const handleDeleteSession = async () => {
        if (!session) return;
        if (!confirm('Are you sure you want to delete this session? This action cannot be undone.')) return;

        try {
            const response = await fetch(`/api/admin/sessions/${session.sessionId}`, {
                method: 'DELETE',
                credentials: 'same-origin',
            });

            if (response.ok) {
                toast.success('Session deleted');
                router.push('/admin/sessions');
            }
        } catch (error) {
            console.error('Failed to delete:', error);
            toast.error('Failed to delete session');
        }
    };

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'active':
                return <Badge className="bg-emerald-500">Active</Badge>;
            case 'taken_over':
                return <Badge className="bg-amber-500">Taken Over</Badge>;
            case 'closed':
                return <Badge className="bg-zinc-700 text-zinc-300">Closed</Badge>;
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
                return <Globe className="w-4 h-4 text-emerald-400" />;
        }
    };

    const formatDate = (date: string) => {
        return new Date(date).toLocaleString('en-US', {
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-[60vh]">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500"></div>
            </div>
        );
    }

    if (!session) {
        return (
            <div className="flex items-center justify-center h-[60vh]">
                <div className="text-center">
                    <MessageSquare className="w-12 h-12 mx-auto mb-4 text-zinc-500" />
                    <p className="text-zinc-400">Session not found</p>
                    <Button asChild className="mt-4 bg-emerald-600 hover:bg-emerald-700">
                        <Link href="/admin/sessions">Back to Sessions</Link>
                    </Button>
                </div>
            </div>
        );
    }

    const canReply = session.status === 'taken_over';

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center gap-3">
                <Button variant="ghost" size="icon" asChild className="shrink-0 text-zinc-400 hover:text-white hover:bg-zinc-800">
                    <Link href="/admin/sessions">
                        <ArrowLeft className="w-5 h-5" />
                    </Link>
                </Button>

                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                        {getStatusBadge(session.status)}
                    </div>
                    <p className="text-xs sm:text-sm text-zinc-500 truncate">
                        <span className="font-mono">{session.sessionId.slice(0, 16)}...</span>
                        <span className="mx-2">·</span>
                        <span>{session.messages.length} messages</span>
                        <span className="mx-2">·</span>
                        <span>{formatDate(session.createdAt)}</span>
                    </p>
                </div>

                <div className="flex items-center gap-1 sm:gap-2 shrink-0">
                    {session.status !== 'taken_over' && session.status !== 'closed' && (
                        <Button
                            onClick={handleTakeover}
                            disabled={isTakingOver}
                            size="sm"
                            className="bg-emerald-600 hover:bg-emerald-700 text-white"
                        >
                            <UserCheck className="w-4 h-4 sm:mr-2" />
                            <span className="hidden sm:inline">Take Over</span>
                        </Button>
                    )}
                    {session.status !== 'closed' && (
                        <Button
                            variant="outline"
                            onClick={handleCloseSession}
                            size="sm"
                            className="border-zinc-700 text-zinc-300 hover:text-white hover:bg-zinc-800 shrink-0 px-2 sm:px-3"
                        >
                            <X className="w-4 h-4 sm:mr-2" />
                            <span className="hidden sm:inline">Close</span>
                        </Button>
                    )}
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="shrink-0 text-zinc-400 hover:text-white hover:bg-zinc-800">
                                <MoreVertical className="w-4 h-4" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="bg-zinc-900 border-zinc-800">
                            <DropdownMenuItem
                                onClick={handleDeleteSession}
                                className="text-red-400 hover:text-red-300 hover:bg-zinc-800 cursor-pointer"
                            >
                                <Trash2 className="w-4 h-4" />
                                Delete
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </div>

            {/* Messages Card - Full Width */}
            <Card className="bg-zinc-900/50 border-zinc-800 backdrop-blur">
                <CardContent className="p-0">
                    <ScrollArea className="h-[500px] lg:h-[calc(100vh-280px)] border border-zinc-800 rounded-lg bg-zinc-950/50">
                        <div className="space-y-4 p-4">
                            {session.messages.length === 0 ? (
                                <div className="text-center text-zinc-500 py-8">
                                    <MessageSquare className="w-12 h-12 mx-auto mb-4 opacity-50" />
                                    <p>No messages yet</p>
                                </div>
                            ) : (
                                session.messages.map((msg, idx) => (
                                    <div
                                        key={idx}
                                        className={cn(
                                            'flex gap-3',
                                            msg.role === 'user' ? 'justify-start' : 'justify-end'
                                        )}
                                    >
                                        {msg.role === 'user' && (
                                            <Avatar className="w-8 h-8 shrink-0">
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
                                        )}
                                        <div
                                            className={cn(
                                                'max-w-[85%] rounded-lg p-3 text-sm prose prose-invert max-w-none',
                                                msg.role === 'user'
                                                    ? 'bg-zinc-800 text-zinc-100'
                                                    : msg.role === 'admin'
                                                        ? 'bg-emerald-600/20 text-emerald-100 border border-emerald-600/30'
                                                        : 'bg-emerald-600 text-white'
                                            )}
                                        >
                                            {msg.role === 'bot' ? (
                                                <ReactMarkdown
                                                    remarkPlugins={[remarkGfm]}
                                                    components={{
                                                        p: ({ node: _node, ...props }) => <p className="m-0" {...props} />,
                                                        ul: ({ node: _node, ...props }) => <ul className="list-disc ml-4 my-1" {...props} />,
                                                        ol: ({ node: _node, ...props }) => <ol className="list-decimal ml-4 my-1" {...props} />,
                                                        li: ({ node: _node, ...props }) => <li className="my-0.5" {...props} />,
                                                        strong: ({ node: _node, ...props }) => <strong className="font-bold" {...props} />,
                                                    }}
                                                >
                                                    {msg.text}
                                                </ReactMarkdown>
                                            ) : (
                                                <p className="m-0">{msg.text}</p>
                                            )}
                                            <p className="text-xs opacity-70 mt-2">
                                                {new Date(msg.timestamp).toLocaleTimeString()}
                                            </p>
                                        </div>
                                        {(msg.role === 'bot' || msg.role === 'admin') && (
                                            <Avatar className="w-8 h-8 shrink-0">
                                                <AvatarFallback className={cn(
                                                    "text-xs",
                                                    msg.role === 'bot'
                                                        ? "bg-emerald-600 text-white"
                                                        : "bg-emerald-600/20 text-emerald-400"
                                                )}>
                                                    {msg.role === 'bot' ? '🤖' : 'A'}
                                                </AvatarFallback>
                                            </Avatar>
                                        )}
                                    </div>
                                ))
                            )}
                            <div ref={messagesEndRef} />
                        </div>
                    </ScrollArea>

                    {/* Reply Input */}
                    {canReply && (
                        <div className="p-4 border-t border-zinc-800">
                            <div className="flex gap-2">
                                <Input
                                    placeholder="Type your reply..."
                                    value={replyMessage}
                                    onChange={(e) => setReplyMessage(e.target.value)}
                                    onKeyDown={(e) => e.key === 'Enter' && handleSendReply()}
                                    disabled={isSending}
                                    className="flex-1 bg-zinc-950 border-zinc-800 text-white placeholder:text-zinc-500 focus:border-emerald-600"
                                />
                                <Button
                                    onClick={handleSendReply}
                                    disabled={!replyMessage.trim() || isSending}
                                    className="bg-emerald-600 hover:bg-emerald-700 text-white"
                                >
                                    <Send className="w-4 h-4 mr-2" />
                                </Button>
                            </div>
                        </div>
                    )}

                    {session.status === 'closed' && (
                        <div className="p-4 text-center text-sm text-zinc-500 bg-zinc-800/50 border-t border-zinc-800">
                            This session has been closed. No new messages can be sent.
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
