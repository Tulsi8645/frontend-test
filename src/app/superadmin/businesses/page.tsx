'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
    Building2,
    Search,
    MoreVertical,
    CheckCircle,
    XCircle,
    RefreshCw,
    Eye,
    Trash2,
    Users,
    Clock,
    AlertCircle,
    Key,
    Check,
    X,
    Bot,
    MapPin,
    Globe,
    Phone,
    Mail,
    Calendar,
    User,
    Shield,
    Copy,
} from 'lucide-react';
import { toast } from 'sonner';

interface Business {
    _id: string;
    name: string;
    slug: string;
    email: string;
    description?: string;
    website?: string;
    phone?: string;
    address?: {
        street?: string;
        city?: string;
        state?: string;
        zip?: string;
        country?: string;
    };
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
        _id: string;
        username: string;
        isActive: boolean;
        createdAt?: string;
    };
    verifiedBy?: {
        username: string;
    };
    verifiedAt?: string;
    createdAt: string;
    updatedAt: string;
}

interface Stats {
    total: number;
    pending: number;
    verified: number;
    suspended: number;
}

export default function BusinessesPage() {
    const router = useRouter();
    const [businesses, setBusinesses] = useState<Business[]>([]);
    const [stats, setStats] = useState<Stats>({ total: 0, pending: 0, verified: 0, suspended: 0 });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState<string>('all');
    const [selectedBusiness, setSelectedBusiness] = useState<Business | null>(null);
    const [newApiSecret, setNewApiSecret] = useState<string | null>(null);
    const [actionLoading, setActionLoading] = useState(false);
    const [copiedField, setCopiedField] = useState<string | null>(null);

    useEffect(() => {
        fetchBusinesses();
    }, [statusFilter, searchQuery]);

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
                    toast.success('API keys regenerated successfully');
                } else {
                    toast.success(`Business ${action.replace('-', ' ')} successfully`);
                }
                fetchBusinesses();
                if (selectedBusiness?._id === businessId) {
                    setSelectedBusiness(null);
                }
            } else {
                setError(data.error || 'Action failed');
                toast.error(data.error || 'Action failed');
            }
        } catch (err) {
            setError('Network error');
            toast.error('Network error');
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
                toast.success('Business deleted successfully');
                fetchBusinesses();
                setSelectedBusiness(null);
            } else {
                const data = await response.json();
                setError(data.error || 'Failed to delete business');
                toast.error(data.error || 'Failed to delete business');
            }
        } catch (err) {
            setError('Network error');
            toast.error('Network error');
        } finally {
            setActionLoading(false);
        }
    };

    const copyToClipboard = (text: string, field: string) => {
        navigator.clipboard.writeText(text);
        setCopiedField(field);
        toast.success(`${field} copied to clipboard`);
        setTimeout(() => setCopiedField(null), 2000);
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

    const getInitials = (name: string) => {
        return name
            .split(' ')
            .map(n => n[0])
            .join('')
            .toUpperCase()
            .slice(0, 2);
    };

    return (
        <div className="space-y-6">
            {error && (
                <Alert variant="destructive" className="mb-6 bg-red-950/50 border-red-900">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>{error}</AlertDescription>
                </Alert>
            )}

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
                        <div className="text-3xl font-bold text-amber-400">{stats.pending}</div>
                    </CardContent>
                </Card>
                <Card className="bg-zinc-900/50 border-zinc-800">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-white">Active</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold text-emerald-400">{stats.verified}</div>
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
                    <Button
                        variant={statusFilter === 'all' ? 'default' : 'outline'}
                        size="sm"
                        className={statusFilter === 'all' ? 'bg-emerald-600 hover:bg-emerald-700' : 'border-zinc-700 text-black hover:bg-zinc-600'}
                        onClick={() => setStatusFilter('all')}
                    >
                        All
                    </Button>
                    <Button
                        variant={statusFilter === 'pending' ? 'default' : 'outline'}
                        size="sm"
                        className={statusFilter === 'pending' ? 'bg-amber-600 hover:bg-amber-700' : 'border-zinc-700 text-black hover:bg-zinc-600'}
                        onClick={() => setStatusFilter('pending')}
                    >
                        Pending
                    </Button>
                    <Button
                        variant={statusFilter === 'verified' ? 'default' : 'outline'}
                        size="sm"
                        className={statusFilter === 'verified' ? 'bg-emerald-600 hover:bg-emerald-700' : 'border-zinc-700 text-black hover:bg-zinc-600'}
                        onClick={() => setStatusFilter('verified')}
                    >
                        Active
                    </Button>
                    <Button
                        variant={statusFilter === 'suspended' ? 'default' : 'outline'}
                        size="sm"
                        className={statusFilter === 'suspended' ? 'bg-red-600 hover:bg-red-700' : 'border-zinc-700 text-black hover:bg-zinc-600'}
                        onClick={() => setStatusFilter('suspended')}
                    >
                        Suspended
                    </Button>
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

            {/* Business Details Dialog - Enhanced */}
            <Dialog open={!!selectedBusiness} onOpenChange={() => { setSelectedBusiness(null); setNewApiSecret(null); }}>
                <DialogContent className="!max-w-6xl !w-[90vw] max-h-[90vh] overflow-hidden bg-zinc-900 border-zinc-800 text-white p-0">
                    {selectedBusiness && (
                        <>
                            {/* Header */}
                            <div className="p-6 border-b border-zinc-800 bg-gradient-to-r from-zinc-900 to-zinc-800/50">
                                <div className="flex items-start gap-4">
                                    <Avatar className="h-16 w-16 ring-2 ring-emerald-500/30">
                                        <AvatarFallback className="bg-gradient-to-br from-emerald-500 to-green-600 text-white text-xl font-bold">
                                            {getInitials(selectedBusiness.name)}
                                        </AvatarFallback>
                                    </Avatar>
                                    <div className="flex-1 min-w-0">
                                        <DialogTitle className="text-2xl font-bold text-white mb-1">{selectedBusiness.name}</DialogTitle>
                                        <DialogDescription className="text-zinc-400">{selectedBusiness.slug}</DialogDescription>
                                        <div className="flex items-center gap-2 mt-3">
                                            {getStatusBadge(selectedBusiness.status)}
                                            {selectedBusiness.settings?.enableAI && (
                                                <Badge className="bg-blue-600/20 text-blue-400 border-blue-600/30">
                                                    <Bot className="w-3 h-3 mr-1" /> AI Enabled
                                                </Badge>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <ScrollArea className="max-h-[calc(90vh-200px)]">
                                <div className="p-6 space-y-6">
                                    {/* Description */}
                                    {selectedBusiness.description && (
                                        <div className="bg-zinc-800/30 rounded-lg p-4">
                                            <p className="text-sm text-zinc-300 italic">{selectedBusiness.description}</p>
                                        </div>
                                    )}

                                    {/* Contact Information */}
                                    <div>
                                        <h3 className="text-sm font-semibold text-zinc-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                                            <Mail className="w-4 h-4" /> Contact Information
                                        </h3>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div className="space-y-1">
                                                <Label>Email Address</Label>
                                                <div className="flex items-center gap-2">
                                                    <p className="font-medium text-white">{selectedBusiness.email}</p>
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="h-6 w-6"
                                                        onClick={() => copyToClipboard(selectedBusiness.email, 'Email')}
                                                    >
                                                        {copiedField === 'Email' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3 text-zinc-500" />}
                                                    </Button>
                                                </div>
                                            </div>
                                            {selectedBusiness.phone && (
                                                <div className="space-y-1">
                                                    <Label>Phone Number</Label>
                                                    <div className="flex items-center gap-2">
                                                        <div className="flex items-center gap-2">
                                                            <Phone className="w-4 h-4 text-zinc-500" />
                                                            <p className="font-medium text-white">{selectedBusiness.phone}</p>
                                                        </div>
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            className="h-6 w-6"
                                                            onClick={() => copyToClipboard(selectedBusiness.phone!, 'Phone')}
                                                        >
                                                            {copiedField === 'Phone' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3 text-zinc-500" />}
                                                        </Button>
                                                    </div>
                                                </div>
                                            )}
                                            {selectedBusiness.website && (
                                                <div className="space-y-1 md:col-span-2">
                                                    <Label>Website</Label>
                                                    <div className="flex items-center gap-2">
                                                        <Globe className="w-4 h-4 text-zinc-500" />
                                                        <a
                                                            href={selectedBusiness.website}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className="font-medium text-emerald-400 hover:text-emerald-300 hover:underline"
                                                        >
                                                            {selectedBusiness.website}
                                                        </a>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    <Separator className="bg-zinc-800" />

                                    {/* Address */}
                                    {selectedBusiness.address && (selectedBusiness.address.street || selectedBusiness.address.city) && (
                                        <>
                                            <div>
                                                <h3 className="text-sm font-semibold text-zinc-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                                                    <MapPin className="w-4 h-4" /> Address
                                                </h3>
                                                <div className="bg-zinc-800/30 rounded-lg p-4">
                                                    <p className="text-white">
                                                        {selectedBusiness.address.street && <span className="block">{selectedBusiness.address.street}</span>}
                                                        {(selectedBusiness.address.city || selectedBusiness.address.state || selectedBusiness.address.zip) && (
                                                            <span className="block">
                                                                {[selectedBusiness.address.city, selectedBusiness.address.state, selectedBusiness.address.zip].filter(Boolean).join(', ')}
                                                            </span>
                                                        )}
                                                        {selectedBusiness.address.country && <span className="block">{selectedBusiness.address.country}</span>}
                                                    </p>
                                                </div>
                                            </div>
                                            <Separator className="bg-zinc-800" />
                                        </>
                                    )}

                                    {/* Admin User Details */}
                                    {selectedBusiness.adminUserId && (
                                        <>
                                            <div>
                                                <h3 className="text-sm font-semibold text-zinc-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                                                    <User className="w-4 h-4" /> Administrator
                                                </h3>
                                                <div className="bg-zinc-800/30 rounded-lg p-4">
                                                    <div className="flex items-center gap-3">
                                                        <Avatar className="h-10 w-10">
                                                            <AvatarFallback className="bg-zinc-700 text-zinc-300 text-sm font-bold">
                                                                {getInitials(selectedBusiness.adminUserId.username)}
                                                            </AvatarFallback>
                                                        </Avatar>
                                                        <div>
                                                            <p className="font-medium text-white">{selectedBusiness.adminUserId.username}</p>
                                                            <p className="text-xs text-zinc-500">
                                                                {selectedBusiness.adminUserId.isActive ? (
                                                                    <span className="text-emerald-400">● Active</span>
                                                                ) : (
                                                                    <span className="text-zinc-500">● Inactive</span>
                                                                )}
                                                                {selectedBusiness.adminUserId.createdAt && (
                                                                    <span className="ml-2">• Joined {new Date(selectedBusiness.adminUserId.createdAt).toLocaleDateString()}</span>
                                                                )}
                                                            </p>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                            <Separator className="bg-zinc-800" />
                                        </>
                                    )}

                                    {/* API Credentials */}
                                    <div>
                                        <h3 className="text-sm font-semibold text-zinc-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                                            <Key className="w-4 h-4" /> API Credentials
                                        </h3>
                                        <div className="space-y-3">
                                            <div className="space-y-1">
                                                <Label>API Key</Label>
                                                <div className="flex items-center gap-2">
                                                    <code className="flex-1 bg-zinc-950 px-3 py-2 rounded-lg text-sm text-zinc-400 font-mono overflow-hidden text-ellipsis">
                                                        {selectedBusiness.apiKey}
                                                    </code>
                                                    <Button
                                                        size="sm"
                                                        variant="outline"
                                                        onClick={() => copyToClipboard(selectedBusiness.apiKey, 'API Key')}
                                                        className="border-zinc-700 text-zinc-300 hover:text-white hover:bg-zinc-800 shrink-0"
                                                    >
                                                        {copiedField === 'API Key' ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                                                    </Button>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <Button
                                                    size="sm"
                                                    variant="outline"
                                                    onClick={() => handleAction(selectedBusiness._id, 'regenerate-api-keys')}
                                                    disabled={actionLoading}
                                                    className="border-zinc-700 text-zinc-300 hover:text-white hover:bg-zinc-800"
                                                >
                                                    <RefreshCw className="w-4 h-4 mr-2" />
                                                    Regenerate API Keys
                                                </Button>
                                            </div>
                                            {newApiSecret && (
                                                <Alert className="bg-amber-950/50 border-amber-800">
                                                    <Key className="w-4 h-4 text-amber-400" />
                                                    <AlertDescription>
                                                        <p className="font-medium text-amber-300 mb-2">New API Secret (copy now - shown once!)</p>
                                                        <div className="flex items-center gap-2">
                                                            <code className="flex-1 bg-zinc-900 px-3 py-2 rounded text-sm break-all text-zinc-300 font-mono">
                                                                {newApiSecret}
                                                            </code>
                                                            <Button
                                                                size="sm"
                                                                variant="outline"
                                                                onClick={() => copyToClipboard(newApiSecret, 'API Secret')}
                                                                className="border-amber-700 text-amber-300 hover:text-white hover:bg-amber-900 shrink-0"
                                                            >
                                                                {copiedField === 'API Secret' ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                                                            </Button>
                                                        </div>
                                                    </AlertDescription>
                                                </Alert>
                                            )}
                                        </div>
                                    </div>

                                    <Separator className="bg-zinc-800" />

                                    {/* Settings */}
                                    {selectedBusiness.settings && (
                                        <>
                                            <div>
                                                <h3 className="text-sm font-semibold text-zinc-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                                                    <Shield className="w-4 h-4" /> Business Settings
                                                </h3>
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                    <div className="flex items-center gap-3 p-4 rounded-lg bg-zinc-800/30">
                                                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${selectedBusiness.settings.enableAI ? 'bg-emerald-600/20' : 'bg-zinc-700/30'}`}>
                                                            <Bot className={`w-5 h-5 ${selectedBusiness.settings.enableAI ? 'text-emerald-400' : 'text-zinc-500'}`} />
                                                        </div>
                                                        <div>
                                                            <p className="text-sm text-zinc-400">AI Sales</p>
                                                            <p className={`text-sm font-medium ${selectedBusiness.settings.enableAI ? 'text-emerald-400' : 'text-zinc-500'}`}>
                                                                {selectedBusiness.settings.enableAI ? 'Enabled' : 'Disabled'}
                                                            </p>
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center gap-3 p-4 rounded-lg bg-zinc-800/30">
                                                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${selectedBusiness.settings.allowHumanHandover ? 'bg-emerald-600/20' : 'bg-zinc-700/30'}`}>
                                                            <Users className={`w-5 h-5 ${selectedBusiness.settings.allowHumanHandover ? 'text-emerald-400' : 'text-zinc-500'}`} />
                                                        </div>
                                                        <div>
                                                            <p className="text-sm text-zinc-400">Human Handover</p>
                                                            <p className={`text-sm font-medium ${selectedBusiness.settings.allowHumanHandover ? 'text-emerald-400' : 'text-zinc-500'}`}>
                                                                {selectedBusiness.settings.allowHumanHandover ? 'Enabled' : 'Disabled'}
                                                            </p>
                                                        </div>
                                                    </div>
                                                </div>
                                                {selectedBusiness.settings.customWelcomeMessage && (
                                                    <div className="mt-4 p-4 rounded-lg bg-zinc-800/30">
                                                        <p className="text-sm text-zinc-400 mb-1">Custom Welcome Message</p>
                                                        <p className="text-sm text-white italic">&ldquo;{selectedBusiness.settings.customWelcomeMessage}&rdquo;</p>
                                                    </div>
                                                )}
                                                {selectedBusiness.settings.themeColor && (
                                                    <div className="mt-4 flex items-center gap-3 p-4 rounded-lg bg-zinc-800/30">
                                                        <p className="text-sm text-zinc-400">Theme Color</p>
                                                        <div className="flex items-center gap-2">
                                                            <div
                                                                className="w-6 h-6 rounded border border-zinc-600"
                                                                style={{ backgroundColor: selectedBusiness.settings.themeColor }}
                                                            />
                                                            <span className="text-sm text-white font-mono">{selectedBusiness.settings.themeColor}</span>
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                            <Separator className="bg-zinc-800" />
                                        </>
                                    )}

                                    {/* Timestamps */}
                                    <div>
                                        <h3 className="text-sm font-semibold text-zinc-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                                            <Calendar className="w-4 h-4" /> Timeline
                                        </h3>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div className="space-y-1">
                                                <Label>Created</Label>
                                                <p className="text-white">{new Date(selectedBusiness.createdAt).toLocaleString()}</p>
                                            </div>
                                            <div className="space-y-1">
                                                <Label>Last Updated</Label>
                                                <p className="text-white">{new Date(selectedBusiness.updatedAt).toLocaleString()}</p>
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
                                    </div>
                                </div>
                            </ScrollArea>

                            {/* Footer Actions */}
                            <div className="p-6 border-t border-zinc-800 bg-zinc-900/50">
                                <DialogFooter className="gap-2">
                                    {selectedBusiness.status === 'pending' && (
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
                                    {selectedBusiness.status === 'verified' && (
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
                                    {selectedBusiness.status === 'suspended' && (
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
                            </div>
                        </>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    );
}

// Label component
function Label({ className, children }: { className?: string; children: React.ReactNode }) {
    return <p className={`text-sm font-medium text-zinc-500 ${className}`}>{children}</p>;
}
