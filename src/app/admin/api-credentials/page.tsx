'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import AdminLayout from '../AdminLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
    Key, 
    Copy, 
    RefreshCw, 
    Eye, 
    EyeOff, 
    CheckCircle,
    AlertCircle,
    ExternalLink,
    Code,
    Shield
} from 'lucide-react';

interface BusinessData {
    _id: string;
    name: string;
    slug: string;
    email: string;
    apiKey: string;
    apiSecret: string;
    status: string;
    settings: {
        enableAI: boolean;
        allowHumanHandover: boolean;
        customWelcomeMessage?: string;
        themeColor?: string;
    };
}

export default function ApiCredentialsPage() {
    const router = useRouter();
    const [business, setBusiness] = useState<BusinessData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [showSecret, setShowSecret] = useState(false);
    const [copied, setCopied] = useState<string | null>(null);
    const [regenerating, setRegenerating] = useState(false);
    const [newCredentials, setNewCredentials] = useState<{apiKey: string; apiSecret: string} | null>(null);

    useEffect(() => {
        fetchBusinessData();
    }, []);

    const fetchBusinessData = async () => {
        try {
            const response = await fetch('/api/admin/business/profile', {
                credentials: 'same-origin',
            });

            if (response.status === 401) {
                router.push('/admin/login');
                return;
            }

            const data = await response.json();
            if (response.ok) {
                setBusiness(data.business);
            } else {
                setError(data.error || 'Failed to fetch business data');
            }
        } catch (err) {
            setError('Network error');
        } finally {
            setLoading(false);
        }
    };

    const handleCopy = (text: string, type: string) => {
        navigator.clipboard.writeText(text);
        setCopied(type);
        setTimeout(() => setCopied(null), 2000);
    };

    const handleRegenerate = async () => {
        if (!confirm('Are you sure you want to regenerate your API credentials? This will invalidate your existing API keys and you will need to update your integration.')) {
            return;
        }

        setRegenerating(true);
        setError('');

        try {
            const response = await fetch('/api/admin/business/regenerate-api-keys', {
                method: 'POST',
                credentials: 'same-origin',
            });

            const data = await response.json();

            if (response.ok) {
                setNewCredentials({
                    apiKey: data.apiKey,
                    apiSecret: data.apiSecret,
                });
                setBusiness(prev => prev ? { ...prev, apiKey: data.apiKey, apiSecret: data.apiSecret } : null);
            } else {
                setError(data.error || 'Failed to regenerate credentials');
            }
        } catch (err) {
            setError('Network error');
        } finally {
            setRegenerating(false);
        }
    };

    const integrationCode = business ? `
<!-- Add this script to your website -->
<script src="${typeof window !== 'undefined' ? window.location.origin : ''}/chat-widget.js"></script>
<script>
  RepairBot.init({
    apiKey: '${business.apiKey}',
    apiSecret: '${showSecret ? business.apiSecret : 'YOUR_API_SECRET'}',
    welcomeMessage: '${business.settings?.customWelcomeMessage || 'Hello! How can I help you today?'}',
    themeColor: '${business.settings?.themeColor || '#4f46e5'}'
  });
</script>
    `.trim() : '';

    const apiExample = business ? `
// Example API call
curl -X POST \\
  ${typeof window !== 'undefined' ? window.location.origin : ''}/api/chat \\
  -H 'Content-Type: application/json' \\
  -H 'x-api-key: ${business.apiKey}' \\
  -H 'x-api-secret: ${showSecret ? business.apiSecret : 'YOUR_API_SECRET'}' \\
  -d '{
    "message": "Hello, I have a question"
  }'
    `.trim() : '';

    if (loading) {
        return (
            <AdminLayout>
                <div className="flex items-center justify-center h-[60vh]">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600" />
                </div>
            </AdminLayout>
        );
    }

    if (!business) {
        return (
            <AdminLayout>
                <div className="text-center py-12">
                    <AlertCircle className="w-12 h-12 mx-auto mb-4 text-red-500" />
                    <p className="text-zinc-500">Failed to load business data</p>
                </div>
            </AdminLayout>
        );
    }

    return (
        <AdminLayout>
            <div className="space-y-6">
                {/* Header */}
                <div>
                    <h1 className="text-2xl sm:text-3xl font-bold tracking-tight flex items-center gap-3">
                        <Shield className="w-8 h-8 text-indigo-600" />
                        API Credentials
                    </h1>
                    <p className="text-zinc-500 mt-1">
                        Manage your API keys and integration settings
                    </p>
                </div>

                {error && (
                    <Alert variant="destructive">
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription>{error}</AlertDescription>
                    </Alert>
                )}

                {newCredentials && (
                    <Alert className="bg-amber-50 dark:bg-amber-900/20 border-amber-200">
                        <Key className="w-4 h-4 text-amber-600" />
                        <AlertDescription>
                            <p className="font-medium text-amber-800 mb-2">
                                New API Credentials Generated (Copy now - the secret is only shown once!)
                            </p>
                            <div className="space-y-2">
                                <div>
                                    <Label className="text-xs">API Key</Label>
                                    <code className="block bg-white dark:bg-zinc-900 px-2 py-1 rounded text-sm break-all">
                                        {newCredentials.apiKey}
                                    </code>
                                </div>
                                <div>
                                    <Label className="text-xs">API Secret</Label>
                                    <code className="block bg-white dark:bg-zinc-900 px-2 py-1 rounded text-sm break-all">
                                        {newCredentials.apiSecret}
                                    </code>
                                </div>
                            </div>
                        </AlertDescription>
                    </Alert>
                )}

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* API Keys Card */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Key className="w-5 h-5" />
                                API Keys
                            </CardTitle>
                            <CardDescription>
                                Use these credentials to authenticate your API requests
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {/* API Key */}
                            <div className="space-y-2">
                                <Label className="flex items-center gap-2">
                                    API Key
                                    <Badge variant="outline" className="text-xs">Public</Badge>
                                </Label>
                                <div className="flex gap-2">
                                    <Input 
                                        value={business.apiKey} 
                                        readOnly 
                                        className="font-mono text-sm"
                                    />
                                    <Button
                                        variant="outline"
                                        size="icon"
                                        onClick={() => handleCopy(business.apiKey, 'key')}
                                    >
                                        {copied === 'key' ? <CheckCircle className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                                    </Button>
                                </div>
                            </div>

                            {/* API Secret */}
                            <div className="space-y-2">
                                <Label className="flex items-center gap-2">
                                    API Secret
                                    <Badge variant="destructive" className="text-xs">Secret</Badge>
                                </Label>
                                <div className="flex gap-2">
                                    <Input 
                                        value={showSecret ? business.apiSecret : '•'.repeat(40)} 
                                        readOnly 
                                        className="font-mono text-sm"
                                        type={showSecret ? 'text' : 'password'}
                                    />
                                    <Button
                                        variant="outline"
                                        size="icon"
                                        onClick={() => setShowSecret(!showSecret)}
                                    >
                                        {showSecret ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                    </Button>
                                    <Button
                                        variant="outline"
                                        size="icon"
                                        onClick={() => handleCopy(business.apiSecret, 'secret')}
                                    >
                                        {copied === 'secret' ? <CheckCircle className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                                    </Button>
                                </div>
                                <p className="text-xs text-zinc-500">
                                    Never share your API secret publicly. Use it only in server-side code or secure environments.
                                </p>
                            </div>

                            {/* Regenerate Button */}
                            <Button
                                variant="outline"
                                className="w-full"
                                onClick={handleRegenerate}
                                disabled={regenerating}
                            >
                                <RefreshCw className={`w-4 h-4 mr-2 ${regenerating ? 'animate-spin' : ''}`} />
                                {regenerating ? 'Regenerating...' : 'Regenerate API Keys'}
                            </Button>
                        </CardContent>
                    </Card>

                    {/* Integration Guide Card */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Code className="w-5 h-5" />
                                Integration Guide
                            </CardTitle>
                            <CardDescription>
                                How to integrate the chat widget into your website
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <Tabs defaultValue="widget">
                                <TabsList className="mb-4">
                                    <TabsTrigger value="widget">Widget</TabsTrigger>
                                    <TabsTrigger value="api">API</TabsTrigger>
                                </TabsList>
                                <TabsContent value="widget" className="space-y-4">
                                    <p className="text-sm text-zinc-600 dark:text-zinc-400">
                                        Add the following code to your website's HTML, just before the closing &lt;/body&gt; tag:
                                    </p>
                                    <div className="relative">
                                        <pre className="bg-zinc-100 dark:bg-zinc-900 p-4 rounded-lg text-xs overflow-x-auto">
                                            <code>{integrationCode}</code>
                                        </pre>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            className="absolute top-2 right-2"
                                            onClick={() => handleCopy(integrationCode, 'widget')}
                                        >
                                            {copied === 'widget' ? <CheckCircle className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                                        </Button>
                                    </div>
                                </TabsContent>
                                <TabsContent value="api" className="space-y-4">
                                    <p className="text-sm text-zinc-600 dark:text-zinc-400">
                                        Make API requests directly using your credentials:
                                    </p>
                                    <div className="relative">
                                        <pre className="bg-zinc-100 dark:bg-zinc-900 p-4 rounded-lg text-xs overflow-x-auto">
                                            <code>{apiExample}</code>
                                        </pre>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            className="absolute top-2 right-2"
                                            onClick={() => handleCopy(apiExample, 'api')}
                                        >
                                            {copied === 'api' ? <CheckCircle className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                                        </Button>
                                    </div>
                                </TabsContent>
                            </Tabs>
                        </CardContent>
                    </Card>
                </div>

                {/* Settings Card */}
                <Card>
                    <CardHeader>
                        <CardTitle>Chat Widget Settings</CardTitle>
                        <CardDescription>
                            Configure how your chat widget appears on your website
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div>
                                <Label className="text-zinc-500">AI Enabled</Label>
                                <div className="mt-1">
                                    <Badge variant={business.settings?.enableAI ? 'default' : 'secondary'}>
                                        {business.settings?.enableAI ? 'Yes' : 'No'}
                                    </Badge>
                                </div>
                            </div>
                            <div>
                                <Label className="text-zinc-500">Human Handover</Label>
                                <div className="mt-1">
                                    <Badge variant={business.settings?.allowHumanHandover ? 'default' : 'secondary'}>
                                        {business.settings?.allowHumanHandover ? 'Enabled' : 'Disabled'}
                                    </Badge>
                                </div>
                            </div>
                            <div>
                                <Label className="text-zinc-500">Theme Color</Label>
                                <div className="flex items-center gap-2 mt-1">
                                    <div 
                                        className="w-6 h-6 rounded border"
                                        style={{ backgroundColor: business.settings?.themeColor || '#4f46e5' }}
                                    />
                                    <span className="text-sm">{business.settings?.themeColor || '#4f46e5'}</span>
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </AdminLayout>
    );
}
