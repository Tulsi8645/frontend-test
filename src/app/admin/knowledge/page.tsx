'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import { Plus, Search, MoreVertical, Edit, Trash2, Filter, Database, Check, X, Brain, Tag, Layers, FileText } from 'lucide-react';
import { toast } from 'sonner';

type KnowledgeType = 'sentence' | 'key_value' | 'repair_item' | 'shop_info' | 'list';

interface KnowledgeEntry {
    _id: string;
    type: KnowledgeType;
    key: string;
    value: any;
    category: string;
    tags: string[];
    priority: number;
    isActive: boolean;
    createdAt: string;
    updatedAt: string;
}

const knowledgeTypes: { value: KnowledgeType; label: string; description: string; color: string; icon: any }[] = [
    { value: 'sentence', label: 'Sentence', description: 'Simple text info', color: 'bg-purple-500/20 text-purple-400 border-purple-500/30', icon: FileText },
    { value: 'key_value', label: 'Key-Value', description: 'Structured data', color: 'bg-amber-500/20 text-amber-400 border-amber-500/30', icon: Database },
    { value: 'repair_item', label: 'Repair Item', description: 'Service details', color: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30', icon: Layers },
    { value: 'shop_info', label: 'Shop Info', description: 'Shop details', color: 'bg-blue-500/20 text-blue-400 border-blue-500/30', icon: Database },
    { value: 'list', label: 'List', description: 'Array items', color: 'bg-pink-500/20 text-pink-400 border-pink-500/30', icon: Tag },
];

export default function AdminKnowledge() {
    const router = useRouter();
    const [entries, setEntries] = useState<KnowledgeEntry[]>([]);
    const [filteredEntries, setFilteredEntries] = useState<KnowledgeEntry[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [typeFilter, setTypeFilter] = useState<string>('all');
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [editingEntry, setEditingEntry] = useState<KnowledgeEntry | null>(null);

    const [formType, setFormType] = useState<KnowledgeType>('sentence');
    const [formKey, setFormKey] = useState('');
    const [formValue, setFormValue] = useState('');
    const [formCategory, setFormCategory] = useState('general');
    const [formTags, setFormTags] = useState('');
    const [formPriority, setFormPriority] = useState('5');
    const [formIsActive, setFormIsActive] = useState(true);

    useEffect(() => {
        fetchEntries();
    }, []);

    useEffect(() => {
        filterEntries();
    }, [entries, searchQuery, typeFilter]);

    const fetchEntries = async () => {
        try {
            const response = await fetch('/api/admin/knowledge', { credentials: 'same-origin' });
            if (response.status === 401) {
                router.push('/admin/login');
                return;
            }
            const data = await response.json();
            if (data.entries) {
                setEntries(data.entries);
            }
        } catch (err) {
            toast.error('Failed to fetch knowledge entries');
        } finally {
            setLoading(false);
        }
    };

    const filterEntries = () => {
        let filtered = [...entries];
        if (searchQuery) {
            const query = searchQuery.toLowerCase();
            filtered = filtered.filter(
                (e) =>
                    e.key.toLowerCase().includes(query) ||
                    String(e.value).toLowerCase().includes(query) ||
                    e.category.toLowerCase().includes(query) ||
                    e.tags?.some((t) => t.toLowerCase().includes(query))
            );
        }
        if (typeFilter !== 'all') {
            filtered = filtered.filter((e) => e.type === typeFilter);
        }
        setFilteredEntries(filtered);
    };

    const openAddDialog = () => {
        setEditingEntry(null);
        setFormType('sentence');
        setFormKey('');
        setFormValue('');
        setFormCategory('general');
        setFormTags('');
        setFormPriority('5');
        setFormIsActive(true);
        setIsDialogOpen(true);
    };

    const openEditDialog = (entry: KnowledgeEntry) => {
        setEditingEntry(entry);
        setFormType(entry.type);
        setFormKey(entry.key);
        setFormValue(typeof entry.value === 'object' ? JSON.stringify(entry.value, null, 2) : String(entry.value));
        setFormCategory(entry.category);
        setFormTags(entry.tags?.join(', ') || '');
        setFormPriority(entry.priority.toString());
        setFormIsActive(entry.isActive);
        setIsDialogOpen(true);
    };

    const handleSubmit = async () => {
        let parsedValue: any = formValue;
        if (['key_value', 'repair_item', 'list'].includes(formType)) {
            try {
                parsedValue = JSON.parse(formValue);
            } catch {
                toast.error('Invalid JSON format for value');
                return;
            }
        }

        const payload = {
            type: formType,
            key: formKey,
            value: parsedValue,
            category: formCategory,
            tags: formTags.split(',').map((t) => t.trim()).filter(Boolean),
            priority: parseInt(formPriority),
            isActive: formIsActive,
        };

        try {
            const url = editingEntry ? `/api/admin/knowledge/${editingEntry._id}` : '/api/admin/knowledge';
            const method = editingEntry ? 'PUT' : 'POST';

            const response = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
                credentials: 'same-origin',
            });

            if (response.status === 401) {
                router.push('/admin/login');
                return;
            }

            if (response.ok) {
                toast.success(editingEntry ? 'Entry updated' : 'Entry created');
                setIsDialogOpen(false);
                fetchEntries();
            } else {
                const data = await response.json();
                toast.error(data.error || 'Failed to save');
            }
        } catch {
            toast.error('Failed to save entry');
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Delete this entry?')) return;
        try {
            const response = await fetch(`/api/admin/knowledge/${id}`, {
                method: 'DELETE',
                credentials: 'same-origin',
            });
            if (response.ok) {
                toast.success('Entry deleted');
                fetchEntries();
            }
        } catch {
            toast.error('Failed to delete');
        }
    };

    const getTypeBadge = (type: KnowledgeType) => {
        const t = knowledgeTypes.find((k) => k.value === type);
        const Icon = t?.icon || Brain;
        return (
            <Badge className={cn(t?.color || 'bg-zinc-700 text-zinc-300', 'font-medium flex items-center gap-1')}>
                <Icon className="w-3 h-3" />
                {t?.label || type}
            </Badge>
        );
    };

    const stats = {
        total: entries.length,
        active: entries.filter((e) => e.isActive).length,
        inactive: entries.filter((e) => !e.isActive).length,
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-3xl font-bold text-white">Knowledge Base</h1>
                <p className="text-zinc-400 mt-1">Manage bot knowledge and responses</p>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Card className="bg-zinc-900/50 border-zinc-800 backdrop-blur">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-zinc-400 flex items-center gap-2">
                            <Database className="w-4 h-4" />
                            Total
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-white">{stats.total}</div>
                    </CardContent>
                </Card>
                <Card className="bg-zinc-900/50 border-zinc-800 backdrop-blur">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-emerald-400 flex items-center gap-2">
                            <Check className="w-4 h-4" />
                            Active
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-emerald-400">{stats.active}</div>
                    </CardContent>
                </Card>
                <Card className="bg-zinc-900/50 border-zinc-800 backdrop-blur">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-zinc-400 flex items-center gap-2">
                            <X className="w-4 h-4" />
                            Inactive
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-zinc-400">{stats.inactive}</div>
                    </CardContent>
                </Card>
                <Card className="bg-zinc-900/50 border-zinc-800 backdrop-blur flex flex-col">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-zinc-500">Actions</CardTitle>
                    </CardHeader>
                    <CardContent className="flex-1 flex items-center justify-center">
                        <Button 
                            onClick={openAddDialog} 
                            className="bg-emerald-600 hover:bg-emerald-700 text-white"
                        >
                            <Plus className="w-4 h-4 mr-2" />
                            Add Entry
                        </Button>
                    </CardContent>
                </Card>
            </div>

            {/* Search & Filter */}
            <Card className="bg-zinc-900/50 border-zinc-800 backdrop-blur">
                <CardContent className="p-4">
                    <div className="flex flex-col sm:flex-row gap-4">
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                            <Input
                                placeholder="Search entries..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="pl-9 bg-zinc-950 border-zinc-800 text-white placeholder:text-zinc-500 focus:border-emerald-600"
                            />
                        </div>
                        <Select value={typeFilter} onValueChange={setTypeFilter}>
                            <SelectTrigger className="w-[180px] bg-zinc-950 border-zinc-800 text-white">
                                <Filter className="w-4 h-4 mr-2 text-zinc-500" />
                                <SelectValue placeholder="Filter by type" />
                            </SelectTrigger>
                            <SelectContent className="bg-zinc-900 border-zinc-800">
                                <SelectItem value="all" className="text-zinc-300">All Types</SelectItem>
                                {knowledgeTypes.map((t) => (
                                    <SelectItem key={t.value} value={t.value} className="text-zinc-300">
                                        {t.label}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                </CardContent>
            </Card>

            {/* Entries Table */}
            <Card className="bg-zinc-900/50 border-zinc-800 backdrop-blur">
                <CardContent className="p-0">
                    <ScrollArea className="h-[500px]">
                        <Table>
                            <TableHeader>
                                <TableRow className="border-zinc-800 hover:bg-zinc-800/50">
                                    <TableHead className="text-zinc-400">Type</TableHead>
                                    <TableHead className="text-zinc-400">Key</TableHead>
                                    <TableHead className="text-zinc-400">Value</TableHead>
                                    <TableHead className="text-zinc-400">Category</TableHead>
                                    <TableHead className="text-zinc-400">Status</TableHead>
                                    <TableHead className="w-[80px]"></TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {filteredEntries.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={6} className="text-center py-8 text-zinc-500">
                                            {loading ? 'Loading...' : 'No entries found'}
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    filteredEntries.map((entry) => (
                                        <TableRow key={entry._id} className="border-zinc-800 hover:bg-zinc-800/30">
                                            <TableCell>{getTypeBadge(entry.type)}</TableCell>
                                            <TableCell className="font-mono text-sm text-zinc-300">{entry.key}</TableCell>
                                            <TableCell>
                                                <div className="max-w-[200px] truncate text-sm text-zinc-400">
                                                    {typeof entry.value === 'object'
                                                        ? JSON.stringify(entry.value).slice(0, 50) + '...'
                                                        : String(entry.value).slice(0, 50)}
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <Badge variant="outline" className="border-zinc-700 text-zinc-400">{entry.category}</Badge>
                                            </TableCell>
                                            <TableCell>
                                                {entry.isActive ? (
                                                    <Badge className="bg-emerald-500">Active</Badge>
                                                ) : (
                                                    <Badge variant="secondary" className="bg-zinc-700 text-zinc-400">Inactive</Badge>
                                                )}
                                            </TableCell>
                                            <TableCell>
                                                <DropdownMenu>
                                                    <DropdownMenuTrigger asChild>
                                                        <Button variant="ghost" size="icon" className="text-zinc-400 hover:text-white hover:bg-zinc-800">
                                                            <MoreVertical className="w-4 h-4" />
                                                        </Button>
                                                    </DropdownMenuTrigger>
                                                    <DropdownMenuContent align="end" className="bg-zinc-900 border-zinc-800">
                                                        <DropdownMenuItem onClick={() => openEditDialog(entry)} className="text-zinc-300 hover:text-white hover:bg-zinc-800 cursor-pointer">
                                                            <Edit className="w-4 h-4 mr-2" />
                                                            Edit
                                                        </DropdownMenuItem>
                                                        <DropdownMenuItem
                                                            onClick={() => handleDelete(entry._id)}
                                                            className="text-red-400 hover:text-red-300 hover:bg-zinc-800 cursor-pointer"
                                                        >
                                                            <Trash2 className="w-4 h-4 mr-2" />
                                                            Delete
                                                        </DropdownMenuItem>
                                                    </DropdownMenuContent>
                                                </DropdownMenu>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </ScrollArea>
                </CardContent>
            </Card>

            {/* Add/Edit Dialog */}
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto bg-zinc-900 border-zinc-800 text-white">
                    <DialogHeader>
                        <DialogTitle className="text-xl">{editingEntry ? 'Edit Entry' : 'Add New Entry'}</DialogTitle>
                        <DialogDescription className="text-zinc-500">
                            {editingEntry ? 'Update knowledge entry' : 'Create a new knowledge entry'}
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4 py-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label className="text-zinc-300">Type</Label>
                                <Select value={formType} onValueChange={(v) => setFormType(v as KnowledgeType)}>
                                    <SelectTrigger className="bg-zinc-950 border-zinc-800 text-white">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent className="bg-zinc-900 border-zinc-800">
                                        {knowledgeTypes.map((t) => (
                                            <SelectItem key={t.value} value={t.value} className="text-zinc-300">
                                                {t.label}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                <p className="text-xs text-zinc-500">
                                    {knowledgeTypes.find((t) => t.value === formType)?.description}
                                </p>
                            </div>

                            <div className="space-y-2">
                                <Label className="text-zinc-300">Key (unique identifier)</Label>
                                <Input
                                    value={formKey}
                                    onChange={(e) => setFormKey(e.target.value)}
                                    placeholder="e.g., warranty_policy"
                                    disabled={!!editingEntry}
                                    className="bg-zinc-950 border-zinc-800 text-white placeholder:text-zinc-500"
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label className="text-zinc-300">Value</Label>
                            <Textarea
                                value={formValue}
                                onChange={(e) => setFormValue(e.target.value)}
                                placeholder={
                                    formType === 'repair_item'
                                        ? '{"device": "MacBook", "service": "Screen", "price": "Rs 25000"}'
                                        : formType === 'key_value'
                                        ? '{"key": "value"}'
                                        : formType === 'list'
                                        ? '["item1", "item2"]'
                                        : 'Enter value...'
                                }
                                rows={4}
                                className="font-mono text-sm bg-zinc-950 border-zinc-800 text-white placeholder:text-zinc-500"
                            />
                        </div>

                        <div className="grid grid-cols-3 gap-4">
                            <div className="space-y-2">
                                <Label className="text-zinc-300">Category</Label>
                                <Input
                                    value={formCategory}
                                    onChange={(e) => setFormCategory(e.target.value)}
                                    placeholder="general"
                                    className="bg-zinc-950 border-zinc-800 text-white placeholder:text-zinc-500"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label className="text-zinc-300">Tags (comma separated)</Label>
                                <Input
                                    value={formTags}
                                    onChange={(e) => setFormTags(e.target.value)}
                                    placeholder="tag1, tag2"
                                    className="bg-zinc-950 border-zinc-800 text-white placeholder:text-zinc-500"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label className="text-zinc-300">Priority (0-10)</Label>
                                <Input
                                    type="number"
                                    min="0"
                                    max="10"
                                    value={formPriority}
                                    onChange={(e) => setFormPriority(e.target.value)}
                                    className="bg-zinc-950 border-zinc-800 text-white"
                                />
                            </div>
                        </div>

                        {editingEntry && (
                            <div className="flex items-center gap-2">
                                <input
                                    type="checkbox"
                                    id="isActive"
                                    checked={formIsActive}
                                    onChange={(e) => setFormIsActive(e.target.checked)}
                                    className="rounded border-zinc-600 bg-zinc-800"
                                />
                                <Label htmlFor="isActive" className="text-zinc-300">Active</Label>
                            </div>
                        )}
                    </div>

                    <div className="flex justify-end gap-2">
                        <Button variant="outline" onClick={() => setIsDialogOpen(false)} className="border-zinc-700 text-zinc-300 hover:text-white hover:bg-zinc-800">
                            Cancel
                        </Button>
                        <Button onClick={handleSubmit} className="bg-emerald-600 hover:bg-emerald-700 text-white">
                            {editingEntry ? 'Update' : 'Create'}
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}
