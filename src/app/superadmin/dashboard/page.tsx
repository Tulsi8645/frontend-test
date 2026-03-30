'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Progress } from '@/components/ui/progress';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import Link from 'next/link';
import {
    Building2,
    Search,
    MoreVertical,
    CheckCircle,
    XCircle,
    RefreshCw,
    Eye,
    Trash2,
    Shield,
    LogOut,
    Users,
    Clock,
    AlertCircle,
    Key,
    Check,
    X,
    MessageSquare,
    Database,
    Activity,
    TrendingUp,
    BarChart3,
    Zap,
    Globe,
    Bot,
    ArrowRight,
    Bell,
    Settings,
    ChevronDown,
    Sparkles,
} from 'lucide-react';

interface Business {
    _id: string;
    name: string;
    slug: string;
    email: string;
    status: 'pending' | 'verified' | 'suspended';
    apiKey: string;
    apiSecret?: string;
    settings?: {
        enableAI: boolean;
        allowHumanHandover: boolean;
        customWelcomeMessage?: string;
        themeColor?: string;
    };
    adminUserId?: {
        username: string;
        isActive: boolean;
    };
    verifiedBy?: {
        username: string;
    };
    verifiedAt?: string;
    createdAt: string;
    updatedAt: string;
}

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
    recentBusinesses: Business[];
}

export default function SuperAdminDashboard() {
    const router = useRouter();
    const [businesses, setBusinesses] = useState<Business[]>([]);
    const [analytics, setAnalytics] = useState<Analytics | null>(null);
    const [stats, setStats] = useState({ total: 0, pending: 0, verified: 0, suspended: 0 });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState<string>('all');
    const [selectedBusiness, setSelectedBusiness] = useState<Business | null>(null);
    const [newApiSecret, setNewApiSecret] = useState<string | null>(null);
    const [actionLoading, setActionLoading] = useState(false);
    const [activeTab, setActiveTab] = useState('overview');

    useEffect(() => {
        fetchAnalytics();
        fetchBusinesses();
    }, [statusFilter, searchQuery]);

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
            }
        } catch (err) {
            console.error('Failed to fetch analytics:', err);
        }
    };

    const fetchBusinesses = async () => {
        try {
            setLoading(true);
            const params = new URLSearchParams();
            if (statusFilter !== 'all') params.append('status', statusFilter);
            if (searchQuery) params.append('search', searchQuery);

            const response = await fetch(`/api/superadmin/businesses?${params}`, {
                credentials: 'same-origin',
            });

            if (response.status === 401) {
                router.push('/admin/login');
                return;
            }

            const data = await response.json();
            if (response.ok) {
                setBusinesses(data.businesses);
                setStats(data.stats);
            } else {
                setError(data.error || 'Failed to fetch businesses');
            }
        } catch (err) {
            setError('Network error');
        } finally {
            setLoading(false);
        }
    };

    const handleAction = async (businessId: string, action: string) => {
        setActionLoading(true);
        setError('');

        try {
            const response = await fetch(`/api/superadmin/businesses/${businessId}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action }),
            });

            const data = await response.json();

            if (response.ok) {
                if (action === 'regenerate-api-keys' && data.apiSecret) {
                    setNewApiSecret(data.apiSecret);
                }
                fetchBusinesses();
                fetchAnalytics();
            } else {
                setError(data.error || 'Action failed');
            }
        } catch (err) {
            setError('Network error');
        } finally {
            setActionLoading(false);
        }
    };

    const handleDelete = async (businessId: string) => {
        if (!confirm('Are you sure you want to delete this business? This action cannot be undone.')) {
            return;
        }

        setActionLoading(true);
        try {
            const response = await fetch(`/api/superadmin/businesses/${businessId}`, {
                method: 'DELETE',
            });

            if (response.ok) {
                fetchBusinesses();
                fetchAnalytics();
                setSelectedBusiness(null);
            } else {
                const data = await response.json();
                setError(data.error || 'Failed to delete business');
            }
        } catch (err) {
            setError('Network error');
        } finally {
            setActionLoading(false);
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

    const handleLogout = () => {
        document.cookie = 'admin_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
        router.push('/admin/login');
    };

    const maxSessions = analytics?.dailySessions?.reduce((max, d) => Math.max(max, d.count), 0) || 1;

    return (
        <main className="min-h-screen bg-zinc-950 text-zinc-100">
            {/* Background Effects */}
            <div className="fixed inset-0 pointer-events-none">
                <div className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-emerald-600/10 rounded-full blur-3xl"></div>
                <div className="absolute top-1/2 right-1/4 w-[600px] h-[600px] bg-green-600/10 rounded-full blur-3xl"></div>
                <div className="absolute bottom-0 left-1/2 w-[600px] h-[600px] bg-teal-600/10 rounded-full blur-3xl"></div>
            </div>
            <div className="fixed inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:4rem_4rem] pointer-events-none"></div>

            {/* Navigation */}
            <nav className="fixed top-0 left-0 right-0 z-50 bg-zinc-950/80 backdrop-blur-xl border-b border-zinc-800">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center justify-between h-16">
                        <Link href="/" className="flex items-center gap-2">
                            <div className="w-8 h-8 bg-gradient-to-br from-emerald-500 to-green-600 rounded-lg flex items-center justify-center">
                                <Shield className="w-5 h-5 text-white" />
                            </div>
                            <div className="flex flex-col">
                                <span className="font-bold text-lg leading-tight">Sales AI Bot</span>
                                <span className="text-[10px] text-zinc-500 leading-tight">Superadmin</span>
                            </div>
                        </Link>
                        
                        <div className="flex items-center gap-4">
                            <Button variant="ghost" size="sm" className="text-zinc-400 relative">
                                <Bell className="w-4 h-4" />
                                <span className="absolute -top-1 -right-1 w-2 h-2 bg-emerald-500 rounded-full"></span>
                            </Button>
                            
                            {/* Profile Dropdown */}
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" className="flex items-center gap-2">
                                        <Avatar className="w-8 h-8">
                                            <AvatarFallback className="bg-emerald-600/20 text-emerald-400 text-xs font-bold">
                                                SA
                                            </AvatarFallback>
                                        </Avatar>
                                        <span className="hidden md:inline text-sm">Super Admin</span>
                                        <ChevronDown className="w-4 h-4 text-zinc-400" />
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="w-56 bg-zinc-900 border-zinc-800">
                                    <DropdownMenuLabel className="text-zinc-400">
                                        <div className="flex flex-col">
                                            <span className="text-white font-medium">Super Admin</span>
                                            <span className="text-xs text-zinc-500">admin@tecobit.cloud</span>
                                        </div>
                                    </DropdownMenuLabel>
                                    <DropdownMenuSeparator className="bg-zinc-800" />
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
                    </div>
                </div>
            </nav>

            {/* Main Content */}
            <div className="relative pt-24 pb-12 px-4 sm:px-6 lg:px-8">
                <div className="max-w-7xl mx-auto">
                    {error && (
                        <Alert variant="destructive" className="mb-6 bg-red-950/50 border-red-900">
                            <AlertCircle className="h-4 w-4" />
                            <AlertDescription>{error}</AlertDescription>
                        </Alert>
                    )}

                    {/* Tabs */}
                    <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
                        <TabsList className="bg-zinc-900/50 border border-zinc-800">
                            <TabsTrigger value="overview" className="data-[state=active]:bg-emerald-600 text-zinc-300 hover:bg-zinc-800 hover:text-white data-[state=active]:text-white flex items-center gap-2">
                                <BarChart3 className="w-4 h-4" />
                                Overview
                            </TabsTrigger>
                            <TabsTrigger value="businesses" className="data-[state=active]:bg-emerald-600 text-zinc-300 hover:bg-zinc-800 hover:text-white data-[state=active]:text-white flex items-center gap-2">
                                <Building2 className="w-4 h-4" />
                                Businesses
                            </TabsTrigger>
                            <TabsTrigger value="analytics" className="data-[state=active]:bg-emerald-600 text-zinc-300 hover:bg-zinc-800 hover:text-white data-[state=active]:text-white flex items-center gap-2">
                                <TrendingUp className="w-4 h-4" />
                                Analytics
                            </TabsTrigger>
                        </TabsList>

                        {/* Overview Tab */}
                        <TabsContent value="overview" className="space-y-6">
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
                                        <Button variant="ghost" size="sm" onClick={() => setActiveTab('businesses')} className="text-emerald-400 hover:text-emerald-300 hover:bg-zinc-800">
                                            View All <ArrowRight className="w-4 h-4 ml-2" />
                                        </Button>
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
                        </TabsContent>

                        {/* Businesses Tab */}
                        <TabsContent value="businesses" className="space-y-6">
                            {/* Stats Cards */}
                            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                                <Card className="bg-zinc-900/50 border-zinc-800">
                                    <CardHeader className="pb-2">
                                        <CardTitle className="text-sm font-medium text-zinc-500">Total Businesses</CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="text-3xl font-bold text-white">{stats.total}</div>
                                    </CardContent>
                                </Card>
                                <Card className="bg-zinc-900/50 border-zinc-800">
                                    <CardHeader className="pb-2">
                                        <CardTitle className="text-sm font-medium text-zinc-500">Pending Verification</CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="text-3xl font-bold text-white">{stats.pending}</div>
                                    </CardContent>
                                </Card>
                                <Card className="bg-zinc-900/50 border-zinc-800">
                                    <CardHeader className="pb-2">
                                        <CardTitle className="text-sm font-medium text-white">Active</CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="text-3xl font-bold text-white">{stats.verified}</div>
                                    </CardContent>
                                </Card>
                                <Card className="bg-zinc-900/50 border-zinc-800">
                                    <CardHeader className="pb-2">
                                        <CardTitle className="text-sm font-medium text-zinc-500">Suspended</CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="text-3xl font-bold text-red-400">{stats.suspended}</div>
                                    </CardContent>
                                </Card>
                            </div>

                            {/* Search and Filter */}
                            <div className="flex flex-col sm:flex-row gap-4">
                                <div className="relative flex-1">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                                    <Input
                                        placeholder="Search businesses..."
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        className="pl-10 bg-zinc-900/50 border-zinc-800 text-white placeholder:text-zinc-500 focus:border-emerald-600"
                                    />
                                </div>
                                <div className="flex gap-2 flex-wrap">
                                    <Button variant={statusFilter === 'all' ? 'default' : 'outline'} size="sm" 
                                        className={statusFilter === 'all' ? 'bg-emerald-600 hover:bg-emerald-700' : 'border-zinc-700 bg-zinc-400 text-white hover:text-zinc-300 hover:bg-zinc-800'}
                                        onClick={() => setStatusFilter('all')}>All</Button>
                                    <Button variant={statusFilter === 'pending' ? 'default' : 'outline'} size="sm"
                                        className={statusFilter === 'pending' ? 'bg-emerald-600 hover:bg-emerald-700' : 'border-zinc-700 bg-zinc-400 text-white hover:text-zinc-300 hover:bg-zinc-800'}
                                        onClick={() => setStatusFilter('pending')}>Pending</Button>
                                    <Button variant={statusFilter === 'verified' ? 'default' : 'outline'} size="sm"
                                        className={statusFilter === 'verified' ? 'bg-emerald-600 hover:bg-emerald-700' : 'border-zinc-700 bg-zinc-400 text-white hover:text-zinc-300 hover:bg-zinc-800'}
                                        onClick={() => setStatusFilter('verified')}>Active</Button>
                                    <Button variant={statusFilter === 'suspended' ? 'default' : 'outline'} size="sm"
                                        className={statusFilter === 'suspended' ? 'bg-emerald-600 hover:bg-emerald-700' : 'border-zinc-700 bg-zinc-400 text-white hover:text-zinc-300 hover:bg-zinc-800'}
                                        onClick={() => setStatusFilter('suspended')}>Suspended</Button>
                                </div>
                            </div>

                            {/* Businesses Table */}
                            <Card className="bg-zinc-900/50 border-zinc-800 backdrop-blur">
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2 text-white">
                                        <Building2 className="w-5 h-5 text-emerald-400" />
                                        Businesses
                                    </CardTitle>
                                    <CardDescription className="text-zinc-500">
                                        Manage all registered businesses and their verification status
                                    </CardDescription>
                                </CardHeader>
                                <CardContent>
                                    {loading ? (
                                        <div className="flex items-center justify-center py-12">
                                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600" />
                                        </div>
                                    ) : businesses.length === 0 ? (
                                        <div className="text-center py-12 text-zinc-500">
                                            <Building2 className="w-12 h-12 mx-auto mb-4 opacity-50" />
                                            <p>No businesses found</p>
                                        </div>
                                    ) : (
                                        <ScrollArea className="h-[500px]">
                                            <Table>
                                                <TableHeader>
                                                    <TableRow className="border-zinc-800 hover:bg-zinc-800/50">
                                                        <TableHead className="text-zinc-400">Business</TableHead>
                                                        <TableHead className="text-zinc-400">Admin</TableHead>
                                                        <TableHead className="text-zinc-400">Status</TableHead>
                                                        <TableHead className="text-zinc-400">Created</TableHead>
                                                        <TableHead className="text-right text-zinc-400">Actions</TableHead>
                                                    </TableRow>
                                                </TableHeader>
                                                <TableBody>
                                                    {businesses.map((business) => (
                                                        <TableRow key={business._id} className="border-zinc-800 hover:bg-zinc-800/30">
                                                            <TableCell>
                                                                <div>
                                                                    <p className="font-medium text-white">{business.name}</p>
                                                                    <p className="text-sm text-zinc-500">{business.slug}</p>
                                                                    <p className="text-xs text-zinc-600">{business.email}</p>
                                                                </div>
                                                            </TableCell>
                                                            <TableCell>
                                                                {business.adminUserId ? (
                                                                    <div className="flex items-center gap-2">
                                                                        <Users className="w-4 h-4 text-zinc-500" />
                                                                        <span className="text-sm text-zinc-300">{business.adminUserId.username}</span>
                                                                        {business.adminUserId.isActive ? (
                                                                            <Badge variant="outline" className="text-xs border-emerald-600/50 text-emerald-400">Active</Badge>
                                                                        ) : (
                                                                            <Badge variant="secondary" className="text-xs">Inactive</Badge>
                                                                        )}
                                                                    </div>
                                                                ) : (
                                                                    <span className="text-sm text-zinc-600">No admin</span>
                                                                )}
                                                            </TableCell>
                                                            <TableCell>{getStatusBadge(business.status)}</TableCell>
                                                            <TableCell>
                                                                <div className="text-sm text-zinc-500">
                                                                    {new Date(business.createdAt).toLocaleDateString()}
                                                                </div>
                                                            </TableCell>
                                                            <TableCell className="text-right">
                                                                <DropdownMenu>
                                                                    <DropdownMenuTrigger asChild>
                                                                        <Button variant="ghost" size="sm" className="text-zinc-400 hover:text-white hover:bg-zinc-800">
                                                                            <MoreVertical className="w-4 h-4" />
                                                                        </Button>
                                                                    </DropdownMenuTrigger>
                                                                    <DropdownMenuContent align="end" className="bg-zinc-900 border-zinc-800">
                                                                        <DropdownMenuLabel className="text-zinc-400">Actions</DropdownMenuLabel>
                                                                        <DropdownMenuSeparator className="bg-zinc-800" />
                                                                        <DropdownMenuItem onClick={() => setSelectedBusiness(business)} className="text-zinc-300 hover:text-white hover:bg-zinc-800 cursor-pointer">
                                                                            <Eye className="w-4 h-4 mr-2" />
                                                                            View Details
                                                                        </DropdownMenuItem>
                                                                        {business.status === 'pending' && (
                                                                            <DropdownMenuItem onClick={() => handleAction(business._id, 'verify')} disabled={actionLoading} className="text-emerald-400 hover:text-emerald-300 hover:bg-zinc-800 cursor-pointer">
                                                                                <CheckCircle className="w-4 h-4 mr-2" />
                                                                                Verify
                                                                            </DropdownMenuItem>
                                                                        )}
                                                                        {business.status === 'verified' && (
                                                                            <DropdownMenuItem onClick={() => handleAction(business._id, 'suspend')} disabled={actionLoading} className="text-red-400 hover:text-red-300 hover:bg-zinc-800 cursor-pointer">
                                                                                <XCircle className="w-4 h-4 mr-2" />
                                                                                Suspend
                                                                            </DropdownMenuItem>
                                                                        )}
                                                                        {business.status === 'suspended' && (
                                                                            <DropdownMenuItem onClick={() => handleAction(business._id, 'activate')} disabled={actionLoading} className="text-zinc-300 hover:text-white hover:bg-zinc-800 cursor-pointer">
                                                                                <RefreshCw className="w-4 h-4 mr-2" />
                                                                                Reactivate
                                                                            </DropdownMenuItem>
                                                                        )}
                                                                        <DropdownMenuSeparator className="bg-zinc-800" />
                                                                        <DropdownMenuItem onClick={() => handleDelete(business._id)} disabled={actionLoading} className="text-red-400 hover:text-red-300 hover:bg-zinc-800 cursor-pointer">
                                                                            <Trash2 className="w-4 h-4 mr-2" />
                                                                            Delete
                                                                        </DropdownMenuItem>
                                                                    </DropdownMenuContent>
                                                                </DropdownMenu>
                                                            </TableCell>
                                                        </TableRow>
                                                    ))}
                                                </TableBody>
                                            </Table>
                                        </ScrollArea>
                                    )}
                                </CardContent>
                            </Card>
                        </TabsContent>

                        {/* Analytics Tab */}
                        <TabsContent value="analytics" className="space-y-6">
                            {/* Platform Overview */}
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
                                            <span className="font-bold text-emerald-400">{analytics?.businesses.active || 0}</span>
                                        </div>
                                        <div className="flex justify-between items-center">
                                            <span className="text-zinc-500">Total Users</span>
                                            <span className="font-bold text-white">{analytics?.users.total || 0}</span>
                                        </div>
                                        <div className="flex justify-between items-center">
                                            <span className="text-zinc-500">Active Admins</span>
                                            <span className="font-bold text-white">{analytics?.users.activeAdmins || 0}</span>
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
                                            <span className="text-zinc-500">This Week</span>
                                            <span className="font-bold text-white">{analytics?.sessions.thisWeek || 0}</span>
                                        </div>
                                        <div className="flex justify-between items-center">
                                            <span className="text-zinc-500">This Month</span>
                                            <span className="font-bold text-white">{analytics?.sessions.thisMonth || 0}</span>
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
                                            <span className="font-bold text-emerald-400">{analytics?.knowledge.active || 0}</span>
                                        </div>
                                        <div className="flex justify-between items-center">
                                            <span className="text-zinc-500">Active Sessions</span>
                                            <span className="font-bold text-white">{analytics?.sessions.active || 0}</span>
                                        </div>
                                        <div className="flex justify-between items-center">
                                            <span className="text-zinc-500">AI Response Rate</span>
                                            <span className="font-bold text-emerald-400">
                                                {analytics?.sessions.total && analytics?.sessions.takenOver
                                                    ? `${Math.round(((analytics.sessions.total - analytics.sessions.takenOver) / analytics.sessions.total) * 100)}%`
                                                    : '100%'}
                                            </span>
                                        </div>
                                    </CardContent>
                                </Card>
                            </div>

                            {/* Services Used */}
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
                                        <div className="p-4 rounded-lg bg-zinc-800/30 border border-zinc-700/50">
                                            <div className="flex items-center gap-3 mb-2">
                                                <div className="w-10 h-10 bg-emerald-600/20 rounded-lg flex items-center justify-center">
                                                    <Bot className="w-5 h-5 text-emerald-400" />
                                                </div>
                                                <span className="font-medium text-white">AI Chatbot</span>
                                            </div>
                                            <p className="text-2xl font-bold text-white">{analytics?.businesses.active || 0}</p>
                                            <p className="text-xs text-zinc-500">businesses enabled</p>
                                        </div>
                                        <div className="p-4 rounded-lg bg-zinc-800/30 border border-zinc-700/50">
                                            <div className="flex items-center gap-3 mb-2">
                                                <div className="w-10 h-10 bg-green-600/20 rounded-lg flex items-center justify-center">
                                                    <Users className="w-5 h-5 text-green-400" />
                                                </div>
                                                <span className="font-medium text-white">Human Handover</span>
                                            </div>
                                            <p className="text-2xl font-bold text-white">{analytics?.sessions.takenOver || 0}</p>
                                            <p className="text-xs text-zinc-500">sessions transferred</p>
                                        </div>
                                        <div className="p-4 rounded-lg bg-zinc-800/30 border border-zinc-700/50">
                                            <div className="flex items-center gap-3 mb-2">
                                                <div className="w-10 h-10 bg-blue-600/20 rounded-lg flex items-center justify-center">
                                                    <Globe className="w-5 h-5 text-blue-400" />
                                                </div>
                                                <span className="font-medium text-white">Website Widget</span>
                                            </div>
                                            <p className="text-2xl font-bold text-white">{analytics?.businesses.active || 0}</p>
                                            <p className="text-xs text-zinc-500">active widgets</p>
                                        </div>
                                        <div className="p-4 rounded-lg bg-zinc-800/30 border border-zinc-700/50">
                                            <div className="flex items-center gap-3 mb-2">
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
                        </TabsContent>
                    </Tabs>
                </div>
            </div>

            {/* Business Details Dialog */}
            <Dialog open={!!selectedBusiness} onOpenChange={() => setSelectedBusiness(null)}>
                <DialogContent className="max-w-2xl bg-zinc-900 border-zinc-800 text-white">
                    <DialogHeader>
                        <DialogTitle className="text-xl font-bold">{selectedBusiness?.name}</DialogTitle>
                        <DialogDescription className="text-zinc-500">Business details and management</DialogDescription>
                    </DialogHeader>
                    {selectedBusiness && (
                        <div className="space-y-6 py-4">
                            {/* Basic Info */}
                            <div className="grid grid-cols-2 gap-6">
                                <div className="space-y-1">
                                    <Label>Business Slug</Label>
                                    <p className="font-medium text-white">{selectedBusiness.slug}</p>
                                </div>
                                <div className="space-y-1">
                                    <Label>Status</Label>
                                    <div className="mt-1">{getStatusBadge(selectedBusiness.status)}</div>
                                </div>
                            </div>
                            
                            <Separator className="bg-zinc-800" />
                            
                            <div className="space-y-1">
                                <Label>Email Address</Label>
                                <p className="font-medium text-white">{selectedBusiness.email}</p>
                            </div>
                            
                            <Separator className="bg-zinc-800" />
                            
                            {/* API Credentials */}
                            <div className="space-y-3">
                                <Label>API Credentials</Label>
                                <div className="flex items-center gap-3">
                                    <code className="flex-1 bg-zinc-800 px-3 py-2 rounded-lg text-sm text-zinc-300 font-mono overflow-hidden text-ellipsis">
                                        {selectedBusiness.apiKey}
                                    </code>
                                    <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={() => handleAction(selectedBusiness._id, 'regenerate-api-keys')}
                                        disabled={actionLoading}
                                        className="border-zinc-700 text-zinc-300 hover:text-white hover:bg-zinc-800"
                                    >
                                        <RefreshCw className="w-4 h-4 mr-2" />
                                        Regenerate
                                    </Button>
                                </div>
                                {newApiSecret && (
                                    <Alert className="bg-amber-950/50 border-amber-800">
                                        <Key className="w-4 h-4 text-amber-400" />
                                        <AlertDescription>
                                            <p className="font-medium text-amber-300 mb-2">New API Secret (copy now - shown once!)</p>
                                            <code className="block bg-zinc-900 px-3 py-2 rounded text-sm break-all text-zinc-300 font-mono">
                                                {newApiSecret}
                                            </code>
                                        </AlertDescription>
                                    </Alert>
                                )}
                            </div>
                            
                            <Separator className="bg-zinc-800" />
                            
                            {/* Timestamps */}
                            <div className="grid grid-cols-2 gap-6">
                                <div className="space-y-1">
                                    <Label>Created</Label>
                                    <p className="text-white">{new Date(selectedBusiness.createdAt).toLocaleString()}</p>
                                </div>
                                {selectedBusiness.verifiedAt && (
                                    <div className="space-y-1">
                                        <Label>Verified</Label>
                                        <p className="text-white">{new Date(selectedBusiness.verifiedAt).toLocaleString()}</p>
                                        {selectedBusiness.verifiedBy && (
                                            <p className="text-sm text-zinc-500">by {selectedBusiness.verifiedBy.username}</p>
                                        )}
                                    </div>
                                )}
                            </div>
                            
                            {/* Settings */}
                            {selectedBusiness.settings && (
                                <>
                                    <Separator className="bg-zinc-800" />
                                    <div className="space-y-3">
                                        <Label>Business Settings</Label>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="flex items-center gap-3 p-3 rounded-lg bg-zinc-800/50">
                                                <Bot className="w-5 h-5 text-zinc-400" />
                                                <div>
                                                    <p className="text-sm text-zinc-400">AI Chatbot</p>
                                                    <p className={`text-sm font-medium ${selectedBusiness.settings.enableAI ? 'text-emerald-400' : 'text-zinc-500'}`}>
                                                        {selectedBusiness.settings.enableAI ? 'Enabled' : 'Disabled'}
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-3 p-3 rounded-lg bg-zinc-800/50">
                                                <Users className="w-5 h-5 text-zinc-400" />
                                                <div>
                                                    <p className="text-sm text-zinc-400">Human Handover</p>
                                                    <p className={`text-sm font-medium ${selectedBusiness.settings.allowHumanHandover ? 'text-emerald-400' : 'text-zinc-500'}`}>
                                                        {selectedBusiness.settings.allowHumanHandover ? 'Enabled' : 'Disabled'}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </>
                            )}
                        </div>
                    )}
                    <DialogFooter className="gap-2">
                        {selectedBusiness?.status === 'pending' && (
                            <Button
                                onClick={() => {
                                    handleAction(selectedBusiness._id, 'verify');
                                    setSelectedBusiness(null);
                                }}
                                disabled={actionLoading}
                                className="bg-emerald-600 hover:bg-emerald-700 text-white"
                            >
                                <Check className="w-4 h-4 mr-2" />
                                Verify Business
                            </Button>
                        )}
                        {selectedBusiness?.status === 'verified' && (
                            <Button
                                onClick={() => {
                                    handleAction(selectedBusiness._id, 'suspend');
                                    setSelectedBusiness(null);
                                }}
                                disabled={actionLoading}
                                variant="destructive"
                            >
                                <X className="w-4 h-4 mr-2" />
                                Suspend
                            </Button>
                        )}
                        {selectedBusiness?.status === 'suspended' && (
                            <Button
                                onClick={() => {
                                    handleAction(selectedBusiness._id, 'activate');
                                    setSelectedBusiness(null);
                                }}
                                disabled={actionLoading}
                                variant="outline"
                                className="border-zinc-700 text-zinc-300 hover:text-white hover:bg-zinc-800"
                            >
                                <Check className="w-4 h-4 mr-2" />
                                Reactivate
                            </Button>
                        )}
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </main>
    );
}

// Label component
function Label({ className, children }: { className?: string; children: React.ReactNode }) {
    return <p className={`text-sm font-medium text-zinc-500 ${className}`}>{children}</p>;
}
