'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { 
  Sparkles, 
  Zap, 
  Shield, 
  ArrowRight, 
  Bot, 
  MessageSquare,
  Globe,
  Code,
  CheckCircle2,
  Play,
  ChevronRight,
  Star
} from 'lucide-react';

export default function Home() {
  const features = [
    {
      icon: Bot,
      title: 'AI-Powered Conversations',
      description: 'Natural language understanding with context-aware responses trained on your business data.'
    },
    {
      icon: Globe,
      title: 'Multi-Channel Support',
      description: 'Deploy across Website, Facebook Messenger, WhatsApp, and Instagram from one dashboard.'
    },
    {
      icon: Zap,
      title: 'Instant Setup',
      description: 'Get your AI assistant running in under 5 minutes. No coding knowledge required.'
    },
    {
      icon: MessageSquare,
      title: 'Human Handover',
      description: 'Seamlessly transfer complex conversations to your team with full context.'
    },
    {
      icon: Code,
      title: 'Developer API',
      description: 'RESTful API with comprehensive documentation for custom integrations.'
    },
    {
      icon: Shield,
      title: 'Enterprise Security',
      description: 'SOC 2 compliant with end-to-end encryption and data privacy controls.'
    }
  ];

  const pricingFeatures = [
    'Unlimited conversations',
    'Multi-channel deployment',
    'Custom knowledge base',
    'Human handover',
    'API access',
    'Analytics dashboard',
    'Webhook support',
    '24/7 support'
  ];

  return (
    <main className="min-h-screen bg-zinc-950 text-zinc-100">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-zinc-950/80 backdrop-blur-xl border-b border-zinc-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link href="/" className="flex items-center gap-2">
              <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center">
                <Bot className="w-5 h-5 text-white" />
              </div>
              <span className="font-bold text-xl">ChatBot AI</span>
            </Link>
            <div className="hidden md:flex items-center gap-8">
              <Link href="#features" className="text-sm text-zinc-400 hover:text-white transition-colors">Features</Link>
              <Link href="#pricing" className="text-sm text-zinc-400 hover:text-white transition-colors">Pricing</Link>
              <Link href="/docs" className="text-sm text-zinc-400 hover:text-white transition-colors">Docs</Link>
              <Link href="/contact" className="text-sm text-zinc-400 hover:text-white transition-colors">Contact</Link>
            </div>
            <div className="flex items-center gap-3">
              <Link href="/business/login">
                <Button variant="ghost" className="text-white hover:bg-zinc-800 hover:text-white">
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

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 overflow-hidden">
        {/* Background Effects */}
        <div className="absolute inset-0 bg-zinc-950">
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-indigo-600/20 rounded-full blur-3xl"></div>
          <div className="absolute top-1/2 right-1/4 w-96 h-96 bg-purple-600/20 rounded-full blur-3xl"></div>
          <div className="absolute bottom-0 left-1/2 w-96 h-96 bg-pink-600/10 rounded-full blur-3xl"></div>
        </div>
        
        {/* Grid Pattern */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:4rem_4rem]"></div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-4xl mx-auto">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-zinc-900 border border-zinc-800 rounded-full mb-8">
              <Sparkles className="w-4 h-4 text-indigo-400" />
              <span className="text-sm text-zinc-300">Powered by Advanced AI</span>
            </div>

            {/* Headline */}
            <h1 className="text-5xl md:text-7xl font-bold mb-6 leading-tight">
              Build AI Chatbots{' '}
              <span className="bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
                That Convert
              </span>
            </h1>

            {/* Subheadline */}
            <p className="text-xl text-zinc-400 mb-10 max-w-2xl mx-auto leading-relaxed">
              Create intelligent AI assistants for your business in minutes. 
              Handle customer support, generate leads, and automate conversations 24/7.
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link href="/business/signup">
                <Button 
                  size="lg" 
                  className="bg-indigo-600 hover:bg-indigo-700 text-white px-8 py-6 text-lg font-semibold shadow-lg shadow-indigo-600/25"
                >
                  Create your Account for Free
                  <ArrowRight className="ml-2 w-5 h-5" />
                </Button>
              </Link>
              <Button 
                size="lg" 
                variant="outline" 
                className="border-zinc-700 text-black hover:bg-zinc-500 px-8 py-6 text-lg"
              >
                <Play className="mr-2 w-5 h-5" />
                Watch Demo
              </Button>
            </div>

            {/* Trust Indicators */}
            <div className="mt-12 flex items-center justify-center gap-6 text-sm text-zinc-500">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                <span>No credit card required</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                <span>Free forever plan</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                <span>Setup in 5 minutes</span>
              </div>
            </div>
          </div>

          {/* Hero Visual */}
          <div className="mt-16 relative">
            <div className="absolute -inset-1 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-2xl blur opacity-20"></div>
            <div className="relative bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden">
              <div className="flex items-center gap-2 px-4 py-3 border-b border-zinc-800 bg-zinc-900/50">
                <div className="flex gap-1.5">
                  <div className="w-3 h-3 rounded-full bg-red-500/20"></div>
                  <div className="w-3 h-3 rounded-full bg-yellow-500/20"></div>
                  <div className="w-3 h-3 rounded-full bg-green-500/20"></div>
                </div>
                <div className="flex-1 text-center">
                  <span className="text-xs text-zinc-500">AI Chat Interface</span>
                </div>
              </div>
              <div className="p-6 grid md:grid-cols-2 gap-6">
                {/* Chat Preview */}
                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center">
                      <Bot className="w-4 h-4 text-white" />
                    </div>
                    <div className="bg-zinc-800 rounded-lg rounded-tl-none p-3 max-w-[80%]">
                      <p className="text-sm text-zinc-300">Hello! I&apos;m your AI assistant. How can I help you today?</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 justify-end">
                    <div className="bg-indigo-600 rounded-lg rounded-tr-none p-3 max-w-[80%]">
                      <p className="text-sm text-white">I need help with my laptop repair business. Can you assist?</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center">
                      <Bot className="w-4 h-4 text-white" />
                    </div>
                    <div className="bg-zinc-800 rounded-lg rounded-tl-none p-3 max-w-[80%]">
                      <p className="text-sm text-zinc-300">Absolutely! I can help you set up an AI chatbot for your repair business. Would you like to:</p>
                      <ul className="mt-2 space-y-1 text-sm text-zinc-400">
                        <li>• Answer common repair questions</li>
                        <li>• Provide instant quotes</li>
                        <li>• Schedule appointments</li>
                      </ul>
                    </div>
                  </div>
                </div>
                {/* Dashboard Preview */}
                <div className="bg-zinc-950 rounded-lg p-4 space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-zinc-400">Analytics</span>
                    <span className="text-xs text-zinc-500">Last 7 days</span>
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                    <div className="bg-zinc-900 rounded-lg p-3">
                      <p className="text-2xl font-bold text-white">2.4k</p>
                      <p className="text-xs text-zinc-500">Conversations</p>
                    </div>
                    <div className="bg-zinc-900 rounded-lg p-3">
                      <p className="text-2xl font-bold text-emerald-400">94%</p>
                      <p className="text-xs text-zinc-500">Resolved</p>
                    </div>
                    <div className="bg-zinc-900 rounded-lg p-3">
                      <p className="text-2xl font-bold text-indigo-400">4.9s</p>
                      <p className="text-xs text-zinc-500">Avg Response</p>
                    </div>
                  </div>
                  <div className="h-24 bg-gradient-to-r from-indigo-600/20 to-purple-600/20 rounded-lg flex items-end p-2 gap-1">
                    {[40, 65, 45, 80, 55, 90, 70].map((h, i) => (
                      <div key={i} className="flex-1 bg-indigo-500/50 rounded-t" style={{ height: `${h}%` }}></div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-24 border-t border-zinc-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Everything You Need to{' '}
              <span className="text-indigo-400">Scale Customer Support</span>
            </h2>
            <p className="text-zinc-400 max-w-2xl mx-auto">
              Powerful features designed to help businesses of all sizes deliver exceptional customer experiences.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, index) => (
              <div 
                key={index}
                className="group p-6 bg-zinc-900/50 border border-zinc-800 rounded-xl hover:border-zinc-700 transition-all"
              >
                <div className="w-12 h-12 bg-zinc-800 rounded-lg flex items-center justify-center mb-4 group-hover:bg-indigo-600/20 transition-colors">
                  <feature.icon className="w-6 h-6 text-indigo-400" />
                </div>
                <h3 className="text-lg font-semibold mb-2">{feature.title}</h3>
                <p className="text-sm text-zinc-400">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-24 border-t border-zinc-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Simple, Transparent{' '}
              <span className="text-indigo-400">Pricing</span>
            </h2>
            <p className="text-zinc-400 max-w-2xl mx-auto">
              Start for free and scale as you grow. No hidden fees, no surprises.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6 max-w-6xl mx-auto">
            {/* Free Plan */}
            <div className="relative">
              <div className="relative bg-zinc-900 border border-zinc-800 rounded-2xl p-8 h-full">
                <div className="mb-6">
                  <h3 className="text-xl font-bold mb-2">Free</h3>
                  <p className="text-sm text-zinc-500">Perfect for trying out</p>
                </div>
                <div className="mb-6">
                  <span className="text-4xl font-bold">$0</span>
                  <span className="text-zinc-500">/month</span>
                </div>
                <ul className="space-y-3 mb-8">
                  <li className="flex items-center gap-3 text-sm">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                    <span className="text-zinc-300">100 conversations/month</span>
                  </li>
                  <li className="flex items-center gap-3 text-sm">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                    <span className="text-zinc-300">1 chatbot</span>
                  </li>
                  <li className="flex items-center gap-3 text-sm">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                    <span className="text-zinc-300">Website widget</span>
                  </li>
                  <li className="flex items-center gap-3 text-sm">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                    <span className="text-zinc-300">Basic analytics</span>
                  </li>
                  <li className="flex items-center gap-3 text-sm">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                    <span className="text-zinc-300">Email support</span>
                  </li>
                </ul>
                <Link href="/business/signup" className="block">
                  <Button variant="outline" className="w-full border-zinc-700 bg-zinc-900 text-zinc-300 hover:bg-zinc-800">
                    Get Started Free
                  </Button>
                </Link>
              </div>
            </div>

            {/* Starter Plan */}
            <div className="relative">
              <div className="absolute -inset-1 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-2xl blur opacity-25"></div>
              <div className="relative bg-zinc-900 border border-indigo-600/50 rounded-2xl p-8 h-full">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h3 className="text-xl font-bold mb-2">Starter</h3>
                    <p className="text-sm text-zinc-500">For growing businesses</p>
                  </div>
                  <span className="px-3 py-1 bg-indigo-600/20 text-indigo-400 text-xs rounded-full">Popular</span>
                </div>
                <div className="mb-6">
                  <span className="text-4xl font-bold">$40</span>
                  <span className="text-zinc-500">/month</span>
                </div>
                <ul className="space-y-3 mb-8">
                  <li className="flex items-center gap-3 text-sm">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                    <span className="text-zinc-300">2,000 conversations/month</span>
                  </li>
                  <li className="flex items-center gap-3 text-sm">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                    <span className="text-zinc-300">3 chatbots</span>
                  </li>
                  <li className="flex items-center gap-3 text-sm">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                    <span className="text-zinc-300">All integrations</span>
                  </li>
                  <li className="flex items-center gap-3 text-sm">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                    <span className="text-zinc-300">Custom knowledge base</span>
                  </li>
                  <li className="flex items-center gap-3 text-sm">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                    <span className="text-zinc-300">Advanced analytics</span>
                  </li>
                  <li className="flex items-center gap-3 text-sm">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                    <span className="text-zinc-300">Priority support</span>
                  </li>
                </ul>
                <Link href="/business/signup" className="block">
                  <Button className="w-full bg-indigo-600 hover:bg-indigo-700 text-white">
                    Get Started
                  </Button>
                </Link>
              </div>
            </div>

            {/* Business Plan */}
            <div className="relative">
              <div className="relative bg-zinc-900 border border-zinc-800 rounded-2xl p-8 h-full">
                <div className="mb-6">
                  <h3 className="text-xl font-bold mb-2">Business</h3>
                  <p className="text-sm text-zinc-500">For scaling teams</p>
                </div>
                <div className="mb-6">
                  <span className="text-4xl font-bold">$100</span>
                  <span className="text-zinc-500">/month</span>
                </div>
                <ul className="space-y-3 mb-8">
                  <li className="flex items-center gap-3 text-sm">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                    <span className="text-zinc-300">Unlimited conversations</span>
                  </li>
                  <li className="flex items-center gap-3 text-sm">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                    <span className="text-zinc-300">10 chatbots</span>
                  </li>
                  <li className="flex items-center gap-3 text-sm">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                    <span className="text-zinc-300">All integrations + API</span>
                  </li>
                  <li className="flex items-center gap-3 text-sm">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                    <span className="text-zinc-300">Custom AI training</span>
                  </li>
                  <li className="flex items-center gap-3 text-sm">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                    <span className="text-zinc-300">Team collaboration</span>
                  </li>
                  <li className="flex items-center gap-3 text-sm">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                    <span className="text-zinc-300">Dedicated support</span>
                  </li>
                  <li className="flex items-center gap-3 text-sm">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                    <span className="text-zinc-300">SLA guarantee</span>
                  </li>
                </ul>
                <Link href="/business/signup" className="block">
                  <Button variant="outline" className="w-full border-zinc-700 bg-zinc-900 text-zinc-300 hover:bg-zinc-800">
                    Contact Sales
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* API Section */}
      <section id="api" className="py-24 border-t border-zinc-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl md:text-4xl font-bold mb-4">
                Built for{' '}
                <span className="text-indigo-400">Developers</span>
              </h2>
              <p className="text-zinc-400 mb-6">
                Integrate AI chat capabilities into your applications with our comprehensive REST API. 
                Build custom interfaces, automate workflows, and extend functionality.
              </p>
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-indigo-600/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <CheckCircle2 className="w-4 h-4 text-indigo-400" />
                  </div>
                  <div>
                    <h4 className="font-medium mb-1">RESTful API</h4>
                    <p className="text-sm text-zinc-500">Simple HTTP endpoints with JSON responses</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-indigo-600/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <CheckCircle2 className="w-4 h-4 text-indigo-400" />
                  </div>
                  <div>
                    <h4 className="font-medium mb-1">Webhook Support</h4>
                    <p className="text-sm text-zinc-500">Real-time notifications for chat events</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-indigo-600/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <CheckCircle2 className="w-4 h-4 text-indigo-400" />
                  </div>
                  <div>
                    <h4 className="font-medium mb-1">SDKs Coming Soon</h4>
                    <p className="text-sm text-zinc-500">JavaScript, Python, and Node.js libraries</p>
                  </div>
                </div>
              </div>
              <div className="mt-8 flex gap-3">
                <Button variant="outline" className="border-zinc-700 text-black hover:bg-zinc-500 hover:text-white">
                  View Documentation
                  <ChevronRight className="ml-2 w-4 h-4" />
                </Button>
              </div>
            </div>
            <div className="relative">
              <div className="absolute -inset-1 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-2xl blur opacity-20"></div>
              <div className="relative bg-zinc-900 border border-zinc-800 rounded-2xl p-6 font-mono text-sm overflow-x-auto">
                <div className="flex items-center gap-2 mb-4 text-zinc-500">
                  <div className="w-3 h-3 rounded-full bg-red-500/20"></div>
                  <div className="w-3 h-3 rounded-full bg-yellow-500/20"></div>
                  <div className="w-3 h-3 rounded-full bg-green-500/20"></div>
                </div>
                <pre className="text-zinc-300">
                  <span className="text-purple-400">curl</span> -X POST \\n                  https://api.chatbot.ai/v1/chat \\n                  -H <span className="text-green-400">&quot;X-API-Key: your-api-key&quot;</span> \\n                  -H <span className="text-green-400">&quot;Content-Type: application/json&quot;</span> \\n                  -d <span className="text-green-400">&apos;{'{'}</span>
                  <span className="text-blue-400">  &quot;message&quot;</span>: <span className="text-green-400">&quot;Hello!&quot;</span>,
                  <span className="text-blue-400">  &quot;sessionId&quot;</span>: <span className="text-green-400">&quot;unique-id&quot;</span>
                  <span className="text-green-400">{'}'}</span>&apos;
                </pre>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 border-t border-zinc-900">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-5xl font-bold mb-6">
            Ready to Transform Your{' '}
            <span className="bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">
              Customer Experience?
            </span>
          </h2>
          <p className="text-xl text-zinc-400 mb-10">
            Join thousands of businesses using AI chatbots to engage customers and scale support.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href="/business/signup">
              <Button 
                size="lg" 
                className="bg-indigo-600 hover:bg-indigo-700 text-white px-10 py-7 text-lg font-semibold shadow-lg shadow-indigo-600/25"
              >
                Create your Account for Free
                <ArrowRight className="ml-2 w-5 h-5" />
              </Button>
            </Link>
            <Link href="/admin/login">
              <Button 
                size="lg" 
                variant="outline" 
                className="border-zinc-700 text-black hover:bg-zinc-500 hover:text-white px-10 py-7 text-lg"
              >
                Sign In
              </Button>
            </Link>
          </div>
          <div className="mt-8 flex items-center justify-center gap-6 text-sm text-zinc-500">
            <div className="flex items-center gap-1">
              <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
              <span>4.9/5 rating</span>
            </div>
            <div className="w-1 h-1 bg-zinc-700 rounded-full"></div>
            <span>1,000+ businesses</span>
            <div className="w-1 h-1 bg-zinc-700 rounded-full"></div>
            <span>Free forever plan</span>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-zinc-900 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div>
              <Link href="/" className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center">
                  <Bot className="w-5 h-5 text-white" />
                </div>
                <span className="font-bold text-xl">ChatBot AI</span>
              </Link>
              <p className="text-sm text-zinc-500">
                AI-powered chatbots for modern businesses.
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Product</h4>
              <ul className="space-y-2 text-sm text-zinc-500">
                <li><Link href="#features" className="hover:text-white transition-colors">Features</Link></li>
                <li><Link href="#pricing" className="hover:text-white transition-colors">Pricing</Link></li>
                <li><Link href="#api" className="hover:text-white transition-colors">API</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Resources</h4>
              <ul className="space-y-2 text-sm text-zinc-500">
                <li><Link href="/docs" className="hover:text-white transition-colors">Documentation</Link></li>
                <li><Link href="/blog" className="hover:text-white transition-colors">Blog</Link></li>
                <li><Link href="/support" className="hover:text-white transition-colors">Support</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Company</h4>
              <ul className="space-y-2 text-sm text-zinc-500">
                <li><Link href="/about" className="hover:text-white transition-colors">About</Link></li>
                <li><Link href="/contact" className="hover:text-white transition-colors">Contact</Link></li>
                <li><Link href="/privacy" className="hover:text-white transition-colors">Privacy</Link></li>
              </ul>
            </div>
          </div>
          <div className="pt-8 border-t border-zinc-900 flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-sm text-zinc-500">
              © 2026 ChatBot AI. All rights reserved.
            </p>
            <div className="flex items-center gap-6">
              <Link href="/admin/login" className="text-sm text-zinc-500 hover:text-white transition-colors">
                Admin Login
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </main>
  );
}
