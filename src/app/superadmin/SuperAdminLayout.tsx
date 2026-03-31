'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
    Building2,
    BarChart3,
    TrendingUp,
    Shield,
    LogOut,
    ChevronDown,
    Bell,
    Settings,
    Menu,
    X,
} from 'lucide-react';
import { toast } from 'sonner';

const navigation = [
    { name: 'Overview', href: '/superadmin/dashboard', icon: BarChart3 },
    { name: 'Businesses', href: '/superadmin/businesses', icon: Building2 },
    { name: 'Analytics', href: '/superadmin/analytics', icon: TrendingUp },
];

export default function SuperAdminLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const pathname = usePathname();
    const router = useRouter();
    const [sidebarOpen, setSidebarOpen] = useState(false);

    const handleLogout = () => {
        document.cookie = 'admin_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
        router.push('/admin/login');
        toast.success('Logged out successfully');
    };

    return (
        <div className="min-h-screen bg-zinc-950 text-zinc-100">
            {/* Background Effects */}
            <div className="fixed inset-0 pointer-events-none">
                <div className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-emerald-600/10 rounded-full blur-3xl"></div>
                <div className="absolute top-1/2 right-1/4 w-[600px] h-[600px] bg-green-600/10 rounded-full blur-3xl"></div>
                <div className="absolute bottom-0 left-1/2 w-[600px] h-[600px] bg-teal-600/10 rounded-full blur-3xl"></div>
            </div>
            <div className="fixed inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:4rem_4rem] pointer-events-none"></div>

            {/* Mobile Sidebar Overlay */}
            {sidebarOpen && (
                <div
                    className="fixed inset-0 bg-black/50 z-40 lg:hidden"
                    onClick={() => setSidebarOpen(false)}
                />
            )}

            {/* Sidebar */}
            <aside
                className={cn(
                    'fixed top-0 left-0 z-50 h-full w-64 bg-zinc-900/95 border-r border-zinc-800 backdrop-blur-xl transition-transform duration-300 ease-in-out lg:translate-x-0',
                    sidebarOpen ? 'translate-x-0' : '-translate-x-full'
                )}
            >
                {/* Logo */}
                <div className="h-16 flex items-center gap-3 px-6 border-b border-zinc-800">
                    <div className="w-8 h-8 bg-gradient-to-br from-emerald-500 to-green-600 rounded-lg flex items-center justify-center">
                        <Shield className="w-5 h-5 text-white" />
                    </div>
                    <div className="flex flex-col">
                        <span className="font-bold text-lg leading-tight">Sales AI Bot</span>
                        <span className="text-[10px] text-zinc-500 leading-tight">Superadmin</span>
                    </div>
                </div>

                {/* Navigation */}
                <nav className="p-4 space-y-1">
                    {navigation.map((item) => {
                        const isActive = pathname === item.href;
                        return (
                            <Link
                                key={item.name}
                                href={item.href}
                                onClick={() => setSidebarOpen(false)}
                                className={cn(
                                    'flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all',
                                    isActive
                                        ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-500/20'
                                        : 'text-zinc-400 hover:text-white hover:bg-zinc-800/50'
                                )}
                            >
                                <item.icon className={cn('w-5 h-5', isActive ? 'text-white' : 'text-zinc-500')} />
                                {item.name}
                            </Link>
                        );
                    })}
                </nav>

                {/* Footer */}
                <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-zinc-800">
                    <button
                        onClick={handleLogout}
                        className="flex items-center gap-3 px-4 py-3 w-full rounded-lg text-sm font-medium text-zinc-400 hover:text-red-400 hover:bg-red-950/20 transition-all"
                    >
                        <LogOut className="w-5 h-5" />
                        Log Out
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <div className="lg:ml-64 min-h-screen flex flex-col">
                {/* Top Navigation */}
                <header className="h-16 flex items-center justify-between px-4 sm:px-6 lg:px-8 border-b border-zinc-800 bg-zinc-950/80 backdrop-blur-xl sticky top-0 z-30">
                    <div className="flex items-center gap-4">
                        <Button
                            variant="ghost"
                            size="icon"
                            className="lg:hidden text-zinc-400 hover:text-white"
                            onClick={() => setSidebarOpen(true)}
                        >
                            <Menu className="w-5 h-5" />
                        </Button>
                        <h1 className="text-lg font-semibold text-white">
                            {navigation.find((n) => n.href === pathname)?.name || 'Superadmin'}
                        </h1>
                    </div>

                    <div className="flex items-center gap-4">
                        <Button variant="ghost" size="icon" className="text-zinc-400 relative hover:text-white">
                            <Bell className="w-5 h-5" />
                            <span className="absolute top-1 right-1 w-2 h-2 bg-emerald-500 rounded-full"></span>
                        </Button>

                        {/* Profile Dropdown */}
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="ghost" className="flex items-center h-9 gap-2 hover:bg-zinc-800">
                                    <Avatar className="w-8 h-8">
                                        <AvatarFallback className="bg-emerald-600 text-black text-xs font-bold">
                                            SA
                                        </AvatarFallback>
                                    </Avatar>
                                    <span className="hidden md:inline text-sm text-emerald-400 hover:text-white">Super Admin</span>
                                    <ChevronDown className="w-4 h-4 text-zinc-400 hover:text-white" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-56 !bg-zinc-900 !border-zinc-800">
                                <DropdownMenuLabel className="!bg-zinc-900 text-zinc-400">
                                    <div className="flex flex-col">
                                        <span className="text-white font-medium">Super Admin</span>
                                        <span className="text-xs text-zinc-500">admin@tecobit.cloud</span>
                                    </div>
                                </DropdownMenuLabel>
                                <DropdownMenuSeparator className="!bg-zinc-800" />
                                <DropdownMenuItem className="!bg-zinc-900 text-zinc-300 hover:!bg-green-300 hover:text-white focus:!bg-green-400 focus:text-white cursor-pointer">
                                    <Settings className="w-4 h-4 mr-2" />
                                    Settings
                                </DropdownMenuItem>
                                <DropdownMenuSeparator className="!bg-zinc-800" />
                                <DropdownMenuItem
                                    onClick={handleLogout}
                                    className="!bg-zinc-900 text-red-400 hover:!bg-red-400 hover:text-white focus:!bg-red-400 focus:text-white cursor-pointer"
                                >
                                    <LogOut className="w-4 h-4 mr-2" />
                                    Logout
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                </header>

                {/* Page Content */}
                <main className="flex-1 p-4 sm:p-6 lg:p-8 relative">
                    {children}
                </main>
            </div>
        </div>
    );
}
