'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Bot, Copy, Check, Code, Server, Webhook, MessageSquare, Key } from 'lucide-react';

export default function ApiDocsPage() {
    const [copiedSnippet, setCopiedSnippet] = useState<string | null>(null);
    const baseUrl = 'https://app.tecobit.cloud/api';

    const copyToClipboard = (text: string, id: string) => {
        navigator.clipboard.writeText(text);
        setCopiedSnippet(id);
        setTimeout(() => setCopiedSnippet(null), 2000);
    };

    const endpoints = [
        {
            method: 'POST',
            path: '/chat',
            description: 'Send a message to the AI Sales and get a response',
            headers: ['X-API-Key: your-api-key', 'X-API-Secret: your-api-secret', 'Content-Type: application/json'],
            body: `{
  "message": "Hello, I need help with my order",
  "sessionId": "user-session-123",
  "context": {
    "userName": "John Doe",
    "orderId": "ORD-456"
  }
}`,
            response: `{
  "success": true,
  "reply": "Hello! I'd be happy to help you with your order. Could you please provide your order number?",
  "sessionId": "user-session-123",
  "timestamp": "2026-03-28T10:30:00Z"
}`
        },
        {
            method: 'GET',
            path: '/chat/sessions/{sessionId}',
            description: 'Retrieve chat session history and messages',
            headers: ['X-API-Key: your-api-key', 'X-API-Secret: your-api-secret'],
            response: `{
  "success": true,
  "session": {
    "id": "user-session-123",
    "status": "active",
    "messages": [
      {
        "role": "user",
        "text": "Hello, I need help",
        "timestamp": "2026-03-28T10:30:00Z"
      },
      {
        "role": "assistant",
        "text": "Hello! How can I assist you today?",
        "timestamp": "2026-03-28T10:30:05Z"
      }
    ],
    "createdAt": "2026-03-28T10:30:00Z"
  }
}`
        },
        {
            method: 'POST',
            path: '/chat/sessions/{sessionId}/handover',
            description: 'Request human handover for a chat session',
            headers: ['X-API-Key: your-api-key', 'X-API-Secret: your-api-secret', 'Content-Type: application/json'],
            body: `{
  "reason": "Customer needs specialized support"
}`,
            response: `{
  "success": true,
  "message": "Human agent will join shortly",
  "queuePosition": 2
}`
        }
    ];

    const codeExamples = [
        {
            language: 'JavaScript',
            code: `// Using fetch API
const response = await fetch('${baseUrl}/chat', {
  method: 'POST',
  headers: {
    'X-API-Key': 'your-api-key',
    'X-API-Secret': 'your-api-secret',
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    message: 'Hello, I need help',
    sessionId: 'unique-session-id'
  })
});

const data = await response.json();
console.log(data.reply);`
        },
        {
            language: 'Python',
            code: `import requests

response = requests.post(
    '${baseUrl}/chat',
    headers={
        'X-API-Key': 'your-api-key',
        'X-API-Secret': 'your-api-secret',
        'Content-Type': 'application/json'
    },
    json={
        'message': 'Hello, I need help',
        'sessionId': 'unique-session-id'
    }
)

data = response.json()
print(data['reply'])`
        },
        {
            language: 'cURL',
            code: `curl -X POST ${baseUrl}/chat \\
  -H "X-API-Key: your-api-key" \\
  -H "X-API-Secret: your-api-secret" \\
  -H "Content-Type: application/json" \\
  -d '{
    "message": "Hello, I need help",
    "sessionId": "unique-session-id"
  }'`
        }
    ];

    return (
        <main className="min-h-screen bg-zinc-950 text-zinc-100 relative overflow-hidden">
            {/* Background Effects */}
            <div className="absolute inset-0">
                <div className="absolute top-0 left-1/4 w-96 h-96 bg-indigo-600/10 rounded-full blur-3xl"></div>
                <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-purple-600/10 rounded-full blur-3xl"></div>
            </div>
            <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:4rem_4rem]"></div>

            {/* Navigation */}
            <nav className="fixed top-0 left-0 right-0 z-50 bg-zinc-950/80 backdrop-blur-xl border-b border-zinc-800">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center justify-between h-16">
                        <Link href="/" className="flex items-center gap-2">
                            <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center">
                                <Bot className="w-5 h-5 text-white" />
                            </div>
                            <span className="font-bold text-xl">Sales AI</span>
                        </Link>
                        <div className="hidden md:flex items-center gap-8">
                            <Link href="/#features" className="text-sm text-zinc-400 hover:text-white transition-colors">Features</Link>
                            <Link href="/#pricing" className="text-sm text-zinc-400 hover:text-white transition-colors">Pricing</Link>
                            <Link href="/docs" className="text-sm text-zinc-400 hover:text-white transition-colors">Docs</Link>
                            <Link href="/contact" className="text-sm text-zinc-400 hover:text-white transition-colors">Contact</Link>
                        </div>
                        <div className="flex items-center gap-3">
                            <Link href="/business/login">
                                <Button variant="ghost" className="text-zinc-400 hover:text-white hover:bg-zinc-800">
                                    Sign In
                                </Button>
                            </Link>
                            <Link href="/business/signup">
                                <Button className="bg-indigo-600 hover:bg-indigo-700 text-white">
                                    Get Started
                                </Button>
                            </Link>
                        </div>
                    </div>
                </div>
            </nav>

            {/* Content */}
            <div className="relative pt-32 pb-20 px-4">
                <div className="max-w-5xl mx-auto">
                    <div className="text-center mb-16">
                        <h1 className="text-4xl md:text-5xl font-bold mb-4">
                            API{' '}
                            <span className="bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">
                                Documentation
                            </span>
                        </h1>
                        <p className="text-xl text-zinc-400 max-w-2xl mx-auto">
                            Integrate Sales AI into your applications with our RESTful API. 
                            Build custom chat interfaces and automate workflows.
                        </p>
                    </div>

                    {/* Quick Start */}
                    <div className="relative mb-16">
                        <div className="absolute -inset-1 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-2xl blur opacity-20"></div>
                        <div className="relative bg-zinc-900/80 backdrop-blur border border-zinc-800 rounded-2xl p-8">
                            <div className="flex items-center gap-3 mb-6">
                                <div className="w-10 h-10 bg-indigo-600/20 rounded-lg flex items-center justify-center">
                                    <Key className="w-5 h-5 text-indigo-400" />
                                </div>
                                <h2 className="text-2xl font-bold">Quick Start</h2>
                            </div>
                            
                            <div className="space-y-4">
                                <p className="text-zinc-400">
                                    Get your API credentials from your <Link href="/admin/settings" className="text-indigo-400 hover:text-indigo-300">settings page</Link>.
                                    All API requests require authentication via headers.
                                </p>
                                
                                <div className="bg-zinc-950 rounded-lg p-4 font-mono text-sm">
                                    <div className="flex items-center justify-between mb-2">
                                        <span className="text-zinc-500">Base URL</span>
                                        <Button 
                                            variant="ghost" 
                                            size="sm"
                                            onClick={() => copyToClipboard(baseUrl, 'baseurl')}
                                            className="h-8 text-zinc-500 hover:text-white"
                                        >
                                            {copiedSnippet === 'baseurl' ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                                        </Button>
                                    </div>
                                    <code className="text-indigo-400">{baseUrl}</code>
                                </div>

                                <div className="grid md:grid-cols-2 gap-4">
                                    <div className="bg-zinc-950 rounded-lg p-4">
                                        <p className="text-sm text-zinc-500 mb-1">API Key (Header)</p>
                                        <code className="text-sm text-emerald-400">X-API-Key: your-api-key</code>
                                    </div>
                                    <div className="bg-zinc-950 rounded-lg p-4">
                                        <p className="text-sm text-zinc-500 mb-1">API Secret (Header)</p>
                                        <code className="text-sm text-emerald-400">X-API-Secret: your-api-secret</code>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Code Examples */}
                    <div className="mb-16">
                        <h2 className="text-2xl font-bold mb-6 flex items-center gap-3">
                            <Code className="w-6 h-6 text-indigo-400" />
                            Code Examples
                        </h2>
                        <div className="grid gap-6">
                            {codeExamples.map((example, index) => (
                                <div key={index} className="relative">
                                    <div className="absolute -inset-1 bg-gradient-to-r from-zinc-700 to-zinc-600 rounded-xl blur opacity-10"></div>
                                    <div className="relative bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
                                        <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-800 bg-zinc-950/50">
                                            <span className="text-sm font-medium text-zinc-400">{example.language}</span>
                                            <Button 
                                                variant="ghost" 
                                                size="sm"
                                                onClick={() => copyToClipboard(example.code, `code-${index}`)}
                                                className="h-8 text-zinc-500 hover:text-white"
                                            >
                                                {copiedSnippet === `code-${index}` ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                                            </Button>
                                        </div>
                                        <pre className="p-4 overflow-x-auto text-sm font-mono text-zinc-300">
                                            {example.code}
                                        </pre>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Endpoints */}
                    <div className="mb-16">
                        <h2 className="text-2xl font-bold mb-6 flex items-center gap-3">
                            <Server className="w-6 h-6 text-indigo-400" />
                            API Endpoints
                        </h2>
                        <div className="space-y-8">
                            {endpoints.map((endpoint, index) => (
                                <div key={index} className="relative">
                                    <div className="absolute -inset-1 bg-gradient-to-r from-indigo-600/20 to-purple-600/20 rounded-2xl blur opacity-20"></div>
                                    <div className="relative bg-zinc-900/80 backdrop-blur border border-zinc-800 rounded-2xl p-6">
                                        <div className="flex items-start justify-between mb-4">
                                            <div>
                                                <div className="flex items-center gap-3 mb-2">
                                                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                                                        endpoint.method === 'GET' ? 'bg-blue-500/20 text-blue-400' :
                                                        endpoint.method === 'POST' ? 'bg-green-500/20 text-green-400' :
                                                        'bg-yellow-500/20 text-yellow-400'
                                                    }`}>
                                                        {endpoint.method}
                                                    </span>
                                                    <code className="text-sm font-mono text-zinc-300">{endpoint.path}</code>
                                                </div>
                                                <p className="text-zinc-400">{endpoint.description}</p>
                                            </div>
                                        </div>

                                        <div className="space-y-4">
                                            <div>
                                                <h4 className="text-sm font-semibold text-zinc-300 mb-2">Headers</h4>
                                                <div className="bg-zinc-950 rounded-lg p-3 font-mono text-xs">
                                                    {endpoint.headers.map((header, i) => (
                                                        <div key={i} className="text-zinc-400">{header}</div>
                                                    ))}
                                                </div>
                                            </div>

                                            {endpoint.body && (
                                                <div>
                                                    <h4 className="text-sm font-semibold text-zinc-300 mb-2">Request Body</h4>
                                                    <pre className="bg-zinc-950 rounded-lg p-3 overflow-x-auto text-xs font-mono text-zinc-400">
                                                        {endpoint.body}
                                                    </pre>
                                                </div>
                                            )}

                                            <div>
                                                <h4 className="text-sm font-semibold text-zinc-300 mb-2">Response</h4>
                                                <pre className="bg-zinc-950 rounded-lg p-3 overflow-x-auto text-xs font-mono text-zinc-400">
                                                    {endpoint.response}
                                                </pre>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Webhooks */}
                    <div className="relative">
                        <div className="absolute -inset-1 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-2xl blur opacity-20"></div>
                        <div className="relative bg-zinc-900/80 backdrop-blur border border-zinc-800 rounded-2xl p-8">
                            <div className="flex items-center gap-3 mb-6">
                                <div className="w-10 h-10 bg-indigo-600/20 rounded-lg flex items-center justify-center">
                                    <Webhook className="w-5 h-5 text-indigo-400" />
                                </div>
                                <h2 className="text-2xl font-bold">Webhooks</h2>
                            </div>
                            
                            <p className="text-zinc-400 mb-6">
                                Configure webhooks to receive real-time notifications when events occur in your Sales.
                                Set up your webhook URL in the <Link href="/admin/settings" className="text-indigo-400 hover:text-indigo-300">settings page</Link>.
                            </p>

                            <div className="space-y-4">
                                <h3 className="font-semibold text-zinc-300">Events</h3>
                                <div className="grid md:grid-cols-2 gap-4">
                                    <div className="bg-zinc-950 rounded-lg p-4">
                                        <div className="flex items-center gap-2 mb-2">
                                            <MessageSquare className="w-4 h-4 text-indigo-400" />
                                            <code className="text-sm text-zinc-300">message.received</code>
                                        </div>
                                        <p className="text-xs text-zinc-500">Triggered when a new message is received</p>
                                    </div>
                                    <div className="bg-zinc-950 rounded-lg p-4">
                                        <div className="flex items-center gap-2 mb-2">
                                            <MessageSquare className="w-4 h-4 text-indigo-400" />
                                            <code className="text-sm text-zinc-300">message.sent</code>
                                        </div>
                                        <p className="text-xs text-zinc-500">Triggered when a response is sent</p>
                                    </div>
                                    <div className="bg-zinc-950 rounded-lg p-4">
                                        <div className="flex items-center gap-2 mb-2">
                                            <Server className="w-4 h-4 text-indigo-400" />
                                            <code className="text-sm text-zinc-300">session.created</code>
                                        </div>
                                        <p className="text-xs text-zinc-500">Triggered when a new chat session starts</p>
                                    </div>
                                    <div className="bg-zinc-950 rounded-lg p-4">
                                        <div className="flex items-center gap-2 mb-2">
                                            <Server className="w-4 h-4 text-indigo-400" />
                                            <code className="text-sm text-zinc-300">handover.requested</code>
                                        </div>
                                        <p className="text-xs text-zinc-500">Triggered when human handover is requested</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </main>
    );
}
