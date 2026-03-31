'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
    Copy, 
    Check, 
    RefreshCw, 
    Globe, 
    Facebook, 
    MessageCircle, 
    Instagram,
    Code,
    ExternalLink,
    Key,
    Shield,
    Webhook,
    Smartphone,
    Bot,
    AlertTriangle,
    ArrowRight,
    Layers
} from 'lucide-react';
import { toast } from 'sonner';

interface BusinessProfile {
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

export default function SettingsPage() {
    const router = useRouter();
    const [profile, setProfile] = useState<BusinessProfile | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [copiedField, setCopiedField] = useState<string | null>(null);
    const [regenerating, setRegenerating] = useState(false);

    const baseUrl = typeof window !== 'undefined' 
        ? `${window.location.protocol}//${window.location.host}` 
        : 'https://your-domain.com';

    const apiBaseUrl = `${baseUrl}/api`;

    useEffect(() => {
        fetchProfile();
    }, []);

    const fetchProfile = async () => {
        try {
            const response = await fetch('/api/admin/business/profile');
            if (response.ok) {
                const data = await response.json();
                setProfile(data.business);
            } else {
                setError('Failed to load business profile');
            }
        } catch (err) {
            setError('Failed to load business profile');
        } finally {
            setLoading(false);
        }
    };

    const copyToClipboard = (text: string, field: string) => {
        navigator.clipboard.writeText(text);
        setCopiedField(field);
        setTimeout(() => setCopiedField(null), 2000);
        toast.success('Copied to clipboard');
    };

    const regenerateApiKeys = async () => {
        if (!confirm('Are you sure? This will invalidate your existing API credentials.')) return;
        
        setRegenerating(true);
        try {
            const response = await fetch('/api/admin/business/regenerate-api-keys', {
                method: 'POST',
            });
            if (response.ok) {
                const data = await response.json();
                setProfile(prev => prev ? { ...prev, apiKey: data.apiKey, apiSecret: data.apiSecret } : null);
                toast.success('API keys regenerated');
            } else {
                setError('Failed to regenerate API keys');
            }
        } catch (err) {
            setError('Failed to regenerate API keys');
        } finally {
            setRegenerating(false);
        }
    };

    const iframeCode = `<iframe
  src="${baseUrl}/chat/embed?business=${profile?.slug || 'your-slug'}"
  width="400"
  height="600"
  style="border: none; position: fixed; bottom: 20px; right: 20px; z-index: 9999;"
  allow="microphone"
></iframe>`;

    const jsEmbedCode = `<!-- Add this before closing </body> tag -->
<script>
  (function() {
    var script = document.createElement('script');
    script.src = '${baseUrl}/chat-widget.js?business=${profile?.slug || 'your-slug'}';
    script.async = true;
    document.body.appendChild(script);
  })();
</script>`;

    const tsxEmbedCode = `import ChatWidget from '@your-package/chat-widget';

function App() {
  return (
    <div>
      {/* Your app content */}
      <ChatWidget
        apiKey="${profile?.apiKey || 'your-api-key'}"
        apiSecret="${profile?.apiSecret || 'your-api-secret'}"
        apiUrl="${apiBaseUrl}/chat"
        socketUrl="${baseUrl}"
        socketPath="/api/socket"
        title="${profile?.name || 'Customer Support'}"
        subtitle="AI Support Bot"
        greeting="Hello!, How can I help you today?"
      />
    </div>
  );
}`;

    const jsxEmbedCode = `import ChatWidget from '@your-package/chat-widget';

function App() {
  return (
    <div>
      {/* Your app content */}
      <ChatWidget
        apiKey="${profile?.apiKey || 'your-api-key'}"
        apiSecret="${profile?.apiSecret || 'your-api-secret'}"
        apiUrl="${apiBaseUrl}/chat"
        socketUrl="${baseUrl}"
        socketPath="/api/socket"
        title="${profile?.name || 'Customer Support'}"
        subtitle="AI Support Bot"
        greeting="Hello!, How can I help you today?"
      />
    </div>
  );
}`;

    const htmlEmbedCode = `<!-- Add this HTML to your page -->
<div id="chat-widget"></div>

<script>
  (function() {
    const chatConfig = {
      apiKey: '${profile?.apiKey || 'your-api-key'}',
      apiSecret: '${profile?.apiSecret || 'your-api-secret'}',
      apiUrl: '${apiBaseUrl}/chat',
      socketUrl: '${baseUrl}',
      socketPath: '/api/socket',
      title: '${profile?.name || 'Customer Support'}',
      subtitle: 'AI Support Bot',
      greeting: 'Hello!, How can I help you today?'
    };
    
    var script = document.createElement('script');
    script.src = '${baseUrl}/chat-widget.js?business=${profile?.slug || 'your-slug'}';
    script.async = true;
    script.setAttribute('data-config', JSON.stringify(chatConfig));
    document.body.appendChild(script);
  })();
</script>`;

    const apiExampleCode = `// Example: Send a message to the Sales
const response = await fetch('${apiBaseUrl}/chat', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'X-API-Key': '${profile?.apiKey || 'your-api-key'}',
    'X-API-Secret': '${profile?.apiSecret || 'your-api-secret'}'
  },
  body: JSON.stringify({
    message: 'Hello, I need help with my laptop',
    sessionId: 'unique-session-id'
  })
});

const data = await response.json();
console.log(data.reply); // AI response`;

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500"></div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-3xl font-bold text-white">Settings</h1>
                <p className="text-zinc-400 mt-1">
                    Manage your business settings and integration options
                </p>
            </div>

            {error && (
                <Alert className="bg-red-950/50 border-red-900">
                    <AlertTriangle className="h-4 w-4 text-red-400" />
                    <AlertDescription className="text-red-300">{error}</AlertDescription>
                </Alert>
            )}

            <Tabs defaultValue="api" className="space-y-6">
                <TabsList className="bg-zinc-900/50 hover:text-emerald-400 border border-zinc-800">
                    <TabsTrigger value="api" className="data-[state=active]:bg-emerald-600 hover:data-[state=active]:bg-emerald-700 data-[state=active]:text-white text-zinc-300 hover:text-white">
                        API & Credentials
                    </TabsTrigger>
                    <TabsTrigger value="website" className="data-[state=active]:bg-emerald-600 hover:data-[state=active]:bg-emerald-700 data-[state=active]:text-white text-zinc-300 hover:text-white">
                        Website
                    </TabsTrigger>
                    <TabsTrigger value="facebook" className="data-[state=active]:bg-emerald-600 hover:data-[state=active]:bg-emerald-700 data-[state=active]:text-white text-zinc-300 hover:text-white">
                        Facebook
                    </TabsTrigger>
                    <TabsTrigger value="whatsapp" className="data-[state=active]:bg-emerald-600 hover:data-[state=active]:bg-emerald-700 data-[state=active]:text-white text-zinc-300 hover:text-white">
                        WhatsApp
                    </TabsTrigger>
                </TabsList>

                {/* API Credentials Tab */}
                <TabsContent value="api" className="space-y-6">
                    <Card className="bg-zinc-900/50 border-zinc-800 backdrop-blur">
                        <CardHeader>
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-emerald-600/20 rounded-lg flex items-center justify-center">
                                    <Key className="w-5 h-5 text-emerald-400" />
                                </div>
                                <div>
                                    <CardTitle className="text-white">API Credentials</CardTitle>
                                    <CardDescription className="text-zinc-500">
                                        Use these credentials to authenticate API requests
                                    </CardDescription>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="space-y-2">
                                <Label className="text-zinc-400">API Base URL</Label>
                                <div className="flex gap-2">
                                    <Input 
                                        value={apiBaseUrl} 
                                        readOnly 
                                        className="font-mono bg-zinc-950 border-zinc-800 text-zinc-300"
                                    />
                                    <Button
                                        variant="outline"
                                        size="icon"
                                        onClick={() => copyToClipboard(apiBaseUrl, 'baseUrl')}
                                        className="border-zinc-700 text-white bg-zinc-600 hover:text-white hover:bg-zinc-800"
                                    >
                                        {copiedField === 'baseUrl' ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                                    </Button>
                                </div>
                            </div>

                            <Separator className="bg-zinc-800" />

                            <div className="space-y-2">
                                <Label className="text-zinc-400 flex items-center gap-2">
                                    API Key
                                    <Badge className="bg-zinc-700 text-zinc-300">Public</Badge>
                                </Label>
                                <div className="flex gap-2">
                                    <Input 
                                        value={profile?.apiKey || ''} 
                                        readOnly 
                                        type="password"
                                        className="font-mono bg-zinc-950 border-zinc-800 text-zinc-300"
                                    />
                                    <Button
                                        variant="outline"
                                        size="icon"
                                        onClick={() => copyToClipboard(profile?.apiKey || '', 'apiKey')}
                                        className="border-zinc-700 text-white bg-zinc-600 hover:text-white hover:bg-zinc-800"
                                    >
                                        {copiedField === 'apiKey' ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                                    </Button>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label className="text-zinc-400 flex items-center gap-2">
                                    API Secret
                                    <Badge className="bg-red-900/50 text-red-400 border-red-800">Private</Badge>
                                </Label>
                                <div className="flex gap-2">
                                    <Input 
                                        value={profile?.apiSecret || ''} 
                                        readOnly 
                                        type="password"
                                        className="font-mono bg-zinc-950 border-zinc-800 text-zinc-300"
                                    />
                                    <Button
                                        variant="outline"
                                        size="icon"
                                        onClick={() => copyToClipboard(profile?.apiSecret || '', 'apiSecret')}
                                        className="border-zinc-700 text-white bg-zinc-600 hover:text-white hover:bg-zinc-800"
                                    >
                                        {copiedField === 'apiSecret' ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                                    </Button>
                                </div>
                                <p className="text-sm text-zinc-500">
                                    Keep this secret! Used to authenticate API requests
                                </p>
                            </div>

                            <Separator className="bg-zinc-800" />

                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2 text-amber-400">
                                    <RefreshCw className="w-4 h-4" />
                                    <span className="text-sm font-medium">Regenerate API Keys</span>
                                </div>
                                <Button 
                                    variant="outline" 
                                    onClick={regenerateApiKeys}
                                    disabled={regenerating}
                                    className="border-zinc-700 text-white bg-zinc-600 hover:text-white hover:bg-emerald-800"
                                >
                                    {regenerating ? 'Regenerating...' : 'Regenerate'}
                                </Button>
                            </div>
                        </CardContent>
                    </Card>

                    {/* API Example */}
                    <Card className="bg-zinc-900/50 border-zinc-800 backdrop-blur">
                        <CardHeader>
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-blue-600/20 rounded-lg flex items-center justify-center">
                                    <Code className="w-5 h-5 text-blue-400" />
                                </div>
                                <div>
                                    <CardTitle className="text-white">API Usage Example</CardTitle>
                                    <CardDescription className="text-zinc-500">
                                        Example code for sending messages via API
                                    </CardDescription>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <pre className="bg-zinc-950 text-zinc-300 p-4 rounded-lg overflow-x-auto text-sm font-mono border border-zinc-800">
                                {apiExampleCode}
                            </pre>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* Website Integration Tab */}
                <TabsContent value="website" className="space-y-6">
                    <Card className="bg-zinc-900/50 border-zinc-800 backdrop-blur">
                        <CardHeader>
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-green-600/20 rounded-lg flex items-center justify-center">
                                    <Globe className="w-5 h-5 text-green-400" />
                                </div>
                                <div>
                                    <CardTitle className="text-white">Website Integration</CardTitle>
                                    <CardDescription className="text-zinc-500">
                                        Add the Sales to your website
                                    </CardDescription>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <Alert className="bg-emerald-950/30 border-emerald-800/50">
                                <Shield className="h-4 w-4 text-emerald-400" />
                                <AlertDescription className="text-emerald-300">
                                    Your chat widget is automatically secured with your API credentials. 
                                    No additional configuration needed.
                                </AlertDescription>
                            </Alert>

                            <div className="space-y-4">
                                <h3 className="font-semibold text-white">Option 1: JavaScript Embed (Recommended)</h3>
                                <p className="text-sm text-zinc-500">
                                    Add this script to your website&apos;s HTML, just before the closing &lt;/body&gt; tag.
                                </p>
                                <div className="relative">
                                    <pre className="bg-zinc-950 text-zinc-300 p-4 rounded-lg overflow-x-auto text-sm font-mono border border-zinc-800">
                                        {jsEmbedCode}
                                    </pre>
                                    <Button
                                        variant="secondary"
                                        size="sm"
                                        className="absolute top-2 right-2 bg-zinc-800 text-zinc-300 hover:bg-zinc-700"
                                        onClick={() => copyToClipboard(jsEmbedCode, 'jsEmbed')}
                                    >
                                        {copiedField === 'jsEmbed' ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                                    </Button>
                                </div>
                            </div>

                            <Separator className="bg-zinc-800" />

                            <div className="space-y-4">
                                <h3 className="font-semibold text-white">Option 2: iframe Embed</h3>
                                <p className="text-sm text-zinc-500">
                                    For more control, embed the chat directly in a specific location.
                                </p>
                                <div className="relative">
                                    <pre className="bg-zinc-950 text-zinc-300 p-4 rounded-lg overflow-x-auto text-sm font-mono border border-zinc-800">
                                        {iframeCode}
                                    </pre>
                                    <Button
                                        variant="secondary"
                                        size="sm"
                                        className="absolute top-2 right-2 bg-zinc-800 text-zinc-300 hover:bg-zinc-700"
                                        onClick={() => copyToClipboard(iframeCode, 'iframe')}
                                    >
                                        {copiedField === 'iframe' ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                                    </Button>
                                </div>
                            </div>

                            <Separator className="bg-zinc-800" />

                            <div className="space-y-4">
                                <h3 className="font-semibold text-white">Option 3: React ChatWidget Component</h3>
                                <p className="text-sm text-zinc-500">
                                    Use the ChatWidget React component directly in your React/Next.js application for full control and customization.
                                </p>
                                
                                {/* TSX */}
                                <div className="space-y-2">
                                    <div className="flex items-center justify-between">
                                        <h4 className="text-sm font-medium text-zinc-400 flex items-center gap-2">
                                            <Code className="w-4 h-4" />
                                            TypeScript (TSX)
                                        </h4>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            className="text-zinc-400 hover:text-white"
                                            onClick={() => copyToClipboard(tsxEmbedCode, 'tsx')}
                                        >
                                            {copiedField === 'tsx' ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                                            Copy
                                        </Button>
                                    </div>
                                    <div className="relative">
                                        <pre className="bg-zinc-950 text-zinc-300 p-4 rounded-lg overflow-x-auto text-sm font-mono border border-zinc-800">
                                            {tsxEmbedCode}
                                        </pre>
                                    </div>
                                </div>

                                {/* JSX */}
                                <div className="space-y-2">
                                    <div className="flex items-center justify-between">
                                        <h4 className="text-sm font-medium text-zinc-400 flex items-center gap-2">
                                            <Code className="w-4 h-4" />
                                            JavaScript (JSX)
                                        </h4>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            className="text-zinc-400 hover:text-white"
                                            onClick={() => copyToClipboard(jsxEmbedCode, 'jsx')}
                                        >
                                            {copiedField === 'jsx' ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                                            Copy
                                        </Button>
                                    </div>
                                    <div className="relative">
                                        <pre className="bg-zinc-950 text-zinc-300 p-4 rounded-lg overflow-x-auto text-sm font-mono border border-zinc-800">
                                            {jsxEmbedCode}
                                        </pre>
                                    </div>
                                </div>

                                {/* HTML */}
                                <div className="space-y-2">
                                    <div className="flex items-center justify-between">
                                        <h4 className="text-sm font-medium text-zinc-400 flex items-center gap-2">
                                            <Globe className="w-4 h-4" />
                                            Plain HTML
                                        </h4>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            className="text-zinc-400 hover:text-white"
                                            onClick={() => copyToClipboard(htmlEmbedCode, 'html')}
                                        >
                                            {copiedField === 'html' ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                                            Copy
                                        </Button>
                                    </div>
                                    <div className="relative">
                                        <pre className="bg-zinc-950 text-zinc-300 p-4 rounded-lg overflow-x-auto text-sm font-mono border border-zinc-800">
                                            {htmlEmbedCode}
                                        </pre>
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* Facebook Integration Tab */}
                <TabsContent value="facebook" className="space-y-6">
                    <Card className="bg-zinc-900/50 border-zinc-800 backdrop-blur">
                        <CardHeader>
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-blue-600/20 rounded-lg flex items-center justify-center">
                                    <Facebook className="w-5 h-5 text-blue-400" />
                                </div>
                                <div>
                                    <CardTitle className="text-white">Facebook Messenger Integration</CardTitle>
                                    <CardDescription className="text-zinc-500">
                                        Connect your Sales to Facebook Messenger
                                    </CardDescription>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <Alert className="bg-amber-950/30 border-amber-800/50">
                                <AlertTriangle className="h-4 w-4 text-amber-400" />
                                <AlertDescription className="text-amber-300">
                                    Facebook Messenger integration requires a Facebook Developer account.
                                </AlertDescription>
                            </Alert>

                            <div className="space-y-4">
                                <h3 className="font-semibold text-white">Setup Steps</h3>
                                <ol className="space-y-3 text-sm list-decimal list-inside text-zinc-400">
                                    <li>Go to <a href="https://developers.facebook.com" target="_blank" rel="noopener noreferrer" className="text-emerald-400 hover:underline inline-flex items-center gap-1">Facebook Developers <ExternalLink className="w-3 h-3" /></a></li>
                                    <li>Add &quot;Messenger&quot; product to your app</li>
                                    <li>Connect your Facebook Business Page</li>
                                    <li>Configure webhook URL: <code className="bg-zinc-800 px-2 py-1 rounded text-zinc-300 font-mono text-xs">{baseUrl}/api/webhooks/facebook</code></li>
                                    <li>Get your Page Access Token and add it below</li>
                                </ol>
                            </div>

                            <Separator className="bg-zinc-800" />

                            <div className="space-y-4">
                                <h3 className="font-semibold text-white">Configuration</h3>
                                <div className="space-y-2">
                                    <Label className="text-zinc-400">Facebook Page ID</Label>
                                    <Input placeholder="123456789012345" className="bg-zinc-950 border-zinc-800 text-white" />
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-zinc-400">Page Access Token</Label>
                                    <Input type="password" placeholder="EAAxxxxx..." className="bg-zinc-950 border-zinc-800 text-white" />
                                </div>
                                <Button className="bg-blue-600 hover:bg-blue-700 text-white">
                                    <Facebook className="w-4 h-4 mr-2" />
                                    Connect Facebook Messenger
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* WhatsApp Integration Tab */}
                <TabsContent value="whatsapp" className="space-y-6">
                    <Card className="bg-zinc-900/50 border-zinc-800 backdrop-blur">
                        <CardHeader>
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-green-600/20 rounded-lg flex items-center justify-center">
                                    <MessageCircle className="w-5 h-5 text-green-400" />
                                </div>
                                <div>
                                    <CardTitle className="text-white">WhatsApp Business Integration</CardTitle>
                                    <CardDescription className="text-zinc-500">
                                        Connect via WhatsApp Business API
                                    </CardDescription>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <Alert className="bg-amber-950/30 border-amber-800/50">
                                <AlertTriangle className="h-4 w-4 text-amber-400" />
                                <AlertDescription className="text-amber-300">
                                    WhatsApp Business API requires Meta Business verification.
                                </AlertDescription>
                            </Alert>

                            <div className="space-y-4">
                                <h3 className="font-semibold text-white">WhatsApp Cloud API Setup</h3>
                                <ol className="space-y-3 text-sm list-decimal list-inside text-zinc-400">
                                    <li>Go to <a href="https://business.facebook.com" target="_blank" rel="noopener noreferrer" className="text-emerald-400 hover:underline inline-flex items-center gap-1">Meta Business Suite <ExternalLink className="w-3 h-3" /></a></li>
                                    <li>Create a WhatsApp Business Account</li>
                                    <li>Get your Phone Number ID and WABA ID</li>
                                    <li>Generate a Permanent Access Token</li>
                                    <li>Configure webhook: <code className="bg-zinc-800 px-2 py-1 rounded text-zinc-300 font-mono text-xs">{baseUrl}/api/webhooks/whatsapp</code></li>
                                </ol>
                            </div>

                            <Separator className="bg-zinc-800" />

                            <div className="space-y-4">
                                <h3 className="font-semibold text-white">Configuration</h3>
                                <div className="space-y-2">
                                    <Label className="text-zinc-400">Phone Number ID</Label>
                                    <Input placeholder="123456789012345" className="bg-zinc-950 border-zinc-800 text-white" />
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-zinc-400">Access Token</Label>
                                    <Input type="password" placeholder="EAAxxxxx..." className="bg-zinc-950 border-zinc-800 text-white" />
                                </div>
                                <Button className="bg-green-600 hover:bg-green-700 text-white">
                                    <Smartphone className="w-4 h-4 mr-2" />
                                    Connect WhatsApp
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
}
