'use client';

import { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import { useNotifications, useNotificationBadge } from '@/lib/notifications';
import { io, Socket } from 'socket.io-client';
import {
    LayoutDashboard,
    Database,
    MessageSquare,
    LogOut,
    Bot,
    Bell,
    Settings,
    User,
    ChevronDown,
} from 'lucide-react';

interface AdminLayoutProps {
    children: React.ReactNode;
}

// Flat sidebar structure - all items at top level
const sidebarItems = [
    { href: '/admin/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/admin/sessions', label: 'Chat Sessions', icon: MessageSquare },
    { href: '/admin/knowledge', label: 'Knowledge Base', icon: Database },
    { href: '/admin/settings', label: 'Settings', icon: Settings },
    { href: '/admin/profile', label: 'Profile', icon: User },
];

// Mobile tab items (subset for bottom nav)
const mobileTabItems = [
    { href: '/admin/dashboard', label: 'Home', icon: LayoutDashboard },
    { href: '/admin/sessions', label: 'Sessions', icon: MessageSquare },
    { href: '/admin/profile', label: 'Profile', icon: User },
];

export default function AdminLayout({ children }: AdminLayoutProps) {
    const router = useRouter();
    const pathname = usePathname();
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const { permission, isSupported, requestPermission, showNotification } = useNotifications();
    const { unreadCount, increment, clear } = useNotificationBadge();
    const [showNotifyPrompt, setShowNotifyPrompt] = useState(false);

    useEffect(() => {
        const token = document.cookie.includes('admin_token=');
        if (!token && pathname !== '/admin/login') {
            router.push('/admin/login');
            return;
        }
        setIsAuthenticated(true);
        setIsLoading(false);
        
        // Show notification prompt after 2 seconds if not decided
        if (isSupported && permission === 'default') {
            const timer = setTimeout(() => setShowNotifyPrompt(true), 2000);
            return () => clearTimeout(timer);
        }
    }, [router, pathname, isSupported, permission]);

    // Socket connection for real-time notifications
    useEffect(() => {
        if (!isAuthenticated) return;

        const socket = io({
            path: '/api/socket',
            addTrailingSlash: false,
        });

        socket.on('connect', () => {
            console.log('Admin layout socket connected');
            socket.emit('join-admin');
        });

        // Listen for new sessions
        socket.on('session-updated', (data: { sessionId: string; message: { role: string; text: string }; channel?: string }) => {
            // Only notify for new user messages on active pages
            if (data.message?.role === 'user') {
                increment();
                
                // Show browser notification
                if (permission === 'granted') {
                    showNotification({
                        sessionId: data.sessionId,
                        channel: data.channel || 'website',
                        message: data.message.text,
                    });
                }
            }
        });

        // Listen for new session created
        socket.on('session-created', (data: { sessionId: string; channel: string; userName?: string }) => {
            increment();
            
            if (permission === 'granted') {
                showNotification({
                    sessionId: data.sessionId,
                    channel: data.channel,
                    userName: data.userName,
                    message: 'New conversation started',
                });
            }
        });

        return () => {
            socket.disconnect();
        };
    }, [isAuthenticated, permission, increment, showNotification]);

    // Clear badge when navigating to sessions
    useEffect(() => {
        if (pathname?.startsWith('/admin/sessions')) {
            clear();
        }
    }, [pathname, clear]);

    const handleLogout = () => {
        document.cookie = 'admin_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
        router.push('/admin/login');
    };

    const handleEnableNotifications = async () => {
        const granted = await requestPermission();
        if (granted) {
            setShowNotifyPrompt(false);
        }
    };

    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-zinc-50 dark:bg-zinc-950">
                <img src="/loading.gif" alt="Loading..." className="w-16 h-16" />
            </div>
        );
    }

    if (!isAuthenticated && pathname !== '/admin/login') {
        return null;
    }

    return (
        <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
            {/* Desktop Sidebar */}
            <aside className="hidden lg:flex flex-col fixed left-0 top-0 bottom-0 w-64 bg-zinc-950 border-r border-zinc-800 z-50">
                <div className="p-6">
                    <Link href="/admin/dashboard" className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-gradient-to-br from-emerald-500 to-green-600 rounded-lg flex items-center justify-center">
                            <Bot className="w-5 h-5 text-white" />
                        </div>
                        <div className="flex flex-col">
                            <span className="font-bold text-lg leading-tight text-white">Sales AI Bot</span>
                            <span className="text-[10px] text-zinc-500 leading-tight">Admin Panel</span>
                        </div>
                    </Link>
                </div>

                <Separator className="bg-zinc-800" />

                <ScrollArea className="flex-1 py-4">
                    <nav className="px-4 space-y-1">
                        {sidebarItems.map((item) => {
                            const Icon = item.icon;
                            const isActive = pathname === item.href;

                            return (
                                <Link
                                    key={item.href}
                                    href={item.href}
                                    className={cn(
                                        'flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                                        isActive
                                            ? 'bg-emerald-600/20 text-emerald-400 border border-emerald-600/30'
                                            : 'text-zinc-400 hover:bg-zinc-800/50 hover:text-white'
                                    )}
                                >
                                    <Icon className="w-4 h-4" />
                                    <span>{item.label}</span>
                                </Link>
                            );
                        })}
                    </nav>
                </ScrollArea>

                <Separator className="bg-zinc-800" />

                <div className="p-4">
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <div className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-zinc-800/50 cursor-pointer transition-colors">
                                <Avatar className="w-8 h-8">
                                    <AvatarFallback className="bg-emerald-600/20 text-emerald-400 text-xs">
                                        AD
                                    </AvatarFallback>
                                </Avatar>
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium text-white truncate">Admin</p>
                                    <p className="text-xs text-zinc-500 truncate">Administrator</p>
                                </div>
                                <ChevronDown className="w-4 h-4 text-zinc-500" />
                            </div>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-56 bg-zinc-900 border-zinc-800">
                            <DropdownMenuLabel className="text-zinc-400">
                                <div className="flex flex-col">
                                    <span className="text-white font-medium">Admin</span>
                                    <span className="text-xs text-zinc-500">Business Administrator</span>
                                </div>
                            </DropdownMenuLabel>
                            <DropdownMenuSeparator className="bg-zinc-800" />
                            <DropdownMenuItem className="text-zinc-300 hover:text-white hover:bg-zinc-800 cursor-pointer">
                                <User className="w-4 h-4 mr-2" />
                                Profile
                            </DropdownMenuItem>
                            <DropdownMenuItem className="text-zinc-300 hover:text-white hover:bg-zinc-800 cursor-pointer">
                                <Settings className="w-4 h-4 mr-2" />
                                Settings
                            </DropdownMenuItem>
                            <DropdownMenuSeparator className="bg-zinc-800" />
                            <DropdownMenuItem 
                                onClick={handleLogout}
                                className="text-red-400 hover:text-red-300 hover:bg-zinc-800 cursor-pointer"
                            >
                                <LogOut className="w-4 h-4 mr-2" />
                                Logout
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </aside>

            {/* Mobile Header */}
            <header className="lg:hidden fixed top-0 left-0 right-0 h-14 bg-zinc-950 border-b border-zinc-800 z-40 px-4 flex items-center justify-between">
                <Link href="/admin/dashboard" className="flex items-center gap-2">
                    <div className="w-7 h-7 bg-gradient-to-br from-emerald-500 to-green-600 rounded-lg flex items-center justify-center">
                        <Bot className="w-4 h-4 text-white" />
                    </div>
                    <span className="font-bold text-sm text-white">Sales AI Bot</span>
                </Link>
                <div className="flex items-center gap-2">
                    <Link href="/admin/sessions" className="relative p-2">
                        <Bell className={cn(
                            "w-5 h-5",
                            unreadCount > 0 ? "text-emerald-400" : "text-zinc-500"
                        )} />
                        {unreadCount > 0 && (
                            <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                                {unreadCount > 9 ? '9+' : unreadCount}
                            </span>
                        )}
                    </Link>
                </div>
            </header>

            {/* Notification Permission Prompt */}
            {showNotifyPrompt && (
                <div className="lg:hidden fixed top-14 left-0 right-0 bg-emerald-600 text-white px-4 py-3 z-[35] flex items-center justify-between">
                    <span className="text-sm font-medium">Enable notifications for new chats?</span>
                    <div className="flex items-center gap-2">
                        <Button 
                            size="sm" 
                            variant="secondary" 
                            onClick={handleEnableNotifications}
                            className="h-7 text-xs bg-white text-emerald-600 hover:bg-zinc-100"
                        >
                            Enable
                        </Button>
                        <Button 
                            size="sm" 
                            variant="ghost" 
                            onClick={() => setShowNotifyPrompt(false)}
                            className="h-7 text-xs text-white hover:bg-emerald-700"
                        >
                            Later
                        </Button>
                    </div>
                </div>
            )}

            {/* Main Content */}
            <main className={cn(
                "lg:pl-64 min-h-screen bg-zinc-950 transition-all",
                "pt-14 pb-16 lg:pt-0 lg:pb-0"
            )}>
                <div className="p-4 lg:p-8 max-w-7xl mx-auto">
                    {children}
                </div>
            </main>

            {/* Mobile Bottom Tab Bar (PWA-style) */}
            <nav className="lg:hidden fixed bottom-0 left-0 right-0 h-16 bg-zinc-950 border-t border-zinc-800 z-50">
                <div className="flex items-center justify-around h-full px-2">
                    {mobileTabItems.map((item) => {
                        const Icon = item.icon;
                        const isActive = pathname === item.href || (item.href !== '/admin/dashboard' && pathname?.startsWith(item.href));

                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                className={cn(
                                    'flex flex-col items-center justify-center gap-1 flex-1 h-full rounded-lg transition-colors',
                                    isActive
                                        ? 'text-emerald-400'
                                        : 'text-zinc-500 hover:text-zinc-300'
                                )}
                            >
                                <Icon className={cn('w-5 h-5', isActive && 'stroke-[2.5px]')} />
                                <span className="text-[10px] font-medium">{item.label}</span>
                            </Link>
                        );
                    })}
                </div>
            </nav>
        </div>
    );
}
