'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { io, Socket } from 'socket.io-client';
import { toast } from 'sonner';

interface ChatMessage {
    role: 'user' | 'bot' | 'admin';
    text: string;
    timestamp?: Date;
}

const SESSION_STORAGE_KEY = 'bot_session_id';

interface ChatWidgetProps {
    apiUrl?: string;
    apiKey?: string;
    apiSecret?: string;
    socketUrl?: string;
    socketPath?: string;
    title?: string;
    subtitle?: string;
    greeting?: string;
}

const ChatWidget: React.FC<ChatWidgetProps> = ({
    apiUrl = '/api/chat',
    apiKey,
    apiSecret,
    socketUrl,
    socketPath = '/api/socket',
    title = 'Customer Support',
    subtitle = 'AI Support Bot',
    greeting = 'Hello!, How can I help you today?',
}) => {
    const [isOpen, setIsOpen] = useState(false);
    const [message, setMessage] = useState('');
    const [chatHistory, setChatHistory] = useState<ChatMessage[]>([
        { role: 'bot', text: greeting }
    ]);
    const [isLoading, setIsLoading] = useState(false);
    const [sessionId, setSessionId] = useState<string | null>(null);
    const [isTakenOver, setIsTakenOver] = useState(false);
    const [socket, setSocket] = useState<Socket | null>(null);
    const chatEndRef = useRef<HTMLDivElement>(null);
    const processedMessages = useRef<Set<string>>(new Set());

    const scrollToBottom = useCallback(() => {
        chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, []);

    // Initialize socket connection
    useEffect(() => {
        const initSocket = () => {
            const newSocket = io(socketUrl || undefined, {
                path: socketPath,
                addTrailingSlash: false,
            });

            newSocket.on('connect', () => {
                console.log('Socket connected:', newSocket.id);
                // Re-join session if we have one
                const currentSessionId = localStorage.getItem(SESSION_STORAGE_KEY);
                if (currentSessionId) {
                    console.log('Re-joining session:', currentSessionId);
                    newSocket.emit('join-session', currentSessionId);
                }
            });

            newSocket.on('new-message', (msg: ChatMessage & { _id?: string; sessionId?: string }) => {
                console.log('Received new-message:', msg);
                // Use _id if available (from DB), otherwise create key from content + timestamp
                const msgKey = msg._id 
                    ? `db:${msg._id}` 
                    : `socket:${msg.role}:${msg.text}:${new Date(msg.timestamp || Date.now()).getTime()}`;
                
                if (processedMessages.current.has(msgKey)) {
                    console.log('Duplicate message ignored:', msg);
                    return;
                }
                processedMessages.current.add(msgKey);
                
                setChatHistory(prev => [...prev, msg]);
            });

            newSocket.on('session-taken-over', () => {
                setIsTakenOver(true);
                toast.info('An admin has joined the conversation');
            });

            newSocket.on('session-closed', () => {
                setIsTakenOver(false);
                toast.info('The conversation has been closed by the admin');
                setChatHistory(prev => [...prev, {
                    role: 'bot',
                    text: 'The admin has closed this conversation. The AI assistant is now available to help you again.'
                }]);
            });

            setSocket(newSocket);

            return () => {
                newSocket.disconnect();
            };
        };

        initSocket();
    }, [socketUrl, socketPath]);

    // Initialize or restore session
    useEffect(() => {
        const initSession = async () => {
            try {
                // Check localStorage for existing session
                const storedSessionId = localStorage.getItem(SESSION_STORAGE_KEY);

                const headers: Record<string, string> = {};
                if (apiKey) headers['X-API-Key'] = apiKey;
                if (apiSecret) headers['X-API-Secret'] = apiSecret;

                const queryParam = storedSessionId ? `?sessionId=${storedSessionId}` : '';
                const response = await fetch(`${apiUrl}${queryParam}`, {
                    headers: Object.keys(headers).length > 0 ? headers : undefined
                });
                const data = await response.json();

                if (data.sessionId) {
                    setSessionId(data.sessionId);
                    localStorage.setItem(SESSION_STORAGE_KEY, data.sessionId);
                    setIsTakenOver(data.takenOver);

                    // Join socket room for this session
                    if (socket) {
                        socket.emit('join-session', data.sessionId);
                    }

                    // Restore chat history if available
                    if (data.messages && data.messages.length > 0) {
                        setChatHistory(data.messages.map((m: ChatMessage & { timestamp: string | Date }) => ({
                            role: m.role,
                            text: m.text,
                            timestamp: new Date(m.timestamp),
                        })));
                    }
                }
            } catch (error) {
                console.error('Failed to initialize session:', error);
            }
        };

        if (socket) {
            initSession();
        }
    }, [socket, apiKey, apiSecret, apiUrl]);

    useEffect(() => {
        if (isOpen) {
            scrollToBottom();
        }
    }, [chatHistory, isOpen, scrollToBottom]);

    const handleSend = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!message.trim() || isLoading || !sessionId || !socket) return;

        const userMessage = message.trim();
        setMessage('');
        setIsLoading(true);

        // Add optimistically so it shows up immediately
        const optimisticMsg: ChatMessage = { role: 'user', text: userMessage, timestamp: new Date() };
        setChatHistory(prev => [...prev, optimisticMsg]);

        // Emit message via socket - server will broadcast to all clients
        if (socket) {
            socket.emit('user-message', { sessionId, message: userMessage });
        }

        if (isTakenOver) {
            // Session is taken over, don't get AI response
            setIsLoading(false);
            return;
        }

        try {
            const headers: Record<string, string> = { 'Content-Type': 'application/json' };
            if (apiKey) headers['X-API-Key'] = apiKey;
            if (apiSecret) headers['X-API-Secret'] = apiSecret;

            // Get AI response
            const response = await fetch(apiUrl, {
                method: 'POST',
                headers,
                body: JSON.stringify({
                    message: userMessage,
                    sessionId,
                    noSave: true // Let the socket handle DB persistence
                }),
            });

            if (!response.ok) throw new Error('Failed to fetch response');

            const data = await response.json();

            if (data.takenOver) {
                setIsTakenOver(true);
                toast.info('An admin has taken over this conversation');
            } else if (data.reply) {
                // Add bot message to local state immediately
                const botMsg: ChatMessage = { role: 'bot', text: data.reply, timestamp: new Date() };
                setChatHistory(prev => [...prev, botMsg]);

                // Emit bot response via socket for admin and other clients
                socket.emit('bot-message', { sessionId, message: data.reply });
            }
        } catch (error) {
            console.error('Chat error:', error);
            toast.error('Failed to get response. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="fixed bottom-6 right-6 z-50 font-sans">
            {/* Chat Window */}
            {isOpen && (
                <div className="absolute bottom-20 right-0 w-80 sm:w-96 h-[500px] bg-white dark:bg-zinc-900 rounded-2xl shadow-2xl flex flex-col overflow-hidden border border-zinc-200 dark:border-zinc-800 transition-all duration-300 transform scale-100 origin-bottom-right">
                    {/* Header */}
                    <div className="p-4 bg-emerald-600 text-white flex justify-between items-center shadow-md">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center text-xl font-bold border-2 border-emerald-400">
                                {isTakenOver ? '👤' : '🤖'}
                            </div>
                            <div>
                                <h3 className="font-semibold text-sm">
                                    {isTakenOver ? 'Support Agent' : title}
                                </h3>
                                <p className="text-[10px] opacity-90 uppercase tracking-wider">
                                    {isTakenOver ? 'Live Support' : subtitle}
                                </p>
                            </div>
                        </div>
                        <button
                            onClick={() => setIsOpen(false)}
                            className="p-1 hover:bg-emerald-500 rounded-full transition-colors"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>

                    {/* Admin indicator */}
                    {isTakenOver && (
                        <div className="px-4 py-2 bg-amber-50 dark:bg-amber-950/30 border-b border-amber-200 dark:border-amber-900">
                            <p className="text-xs text-amber-700 dark:text-amber-400 text-center">
                                An admin is handling your conversation
                            </p>
                        </div>
                    )}

                    {/* Messages */}
                    <div className="flex-1 overflow-y-auto p-4 space-y-4 scroll-smooth bg-zinc-50 dark:bg-black/20">
                        {chatHistory.map((chat, index) => (
                            <div key={index} className={`flex ${chat.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                                <div className={`max-w-[85%] p-3 rounded-2xl text-sm ${chat.role === 'user'
                                    ? 'bg-emerald-600 text-white rounded-tr-none shadow-sm'
                                    : chat.role === 'admin'
                                        ? 'bg-amber-100 dark:bg-amber-900/30 text-amber-900 dark:text-amber-100 rounded-tl-none border border-amber-200 dark:border-amber-800 shadow-sm'
                                        : 'bg-white dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200 rounded-tl-none border border-zinc-100 dark:border-zinc-700 shadow-sm'
                                    }`}
                                    style={{ overflowWrap: 'break-word', wordBreak: 'normal' }}
                                >
                                    {chat.role === 'admin' && (
                                        <p className="text-xs font-semibold text-amber-600 dark:text-amber-400 mb-1">Admin</p>
                                    )}
                                    <ReactMarkdown
                                        remarkPlugins={[remarkGfm]}
                                        components={{
                                            /* eslint-disable @typescript-eslint/no-unused-vars */
                                            p: ({ node, ...props }) => <p className="mb-2 last:mb-0" {...props} />,
                                            a: ({ node, ...props }) => <a className="text-emerald-400 hover:underline break-all" target="_blank" rel="noopener noreferrer" {...props} />,
                                            ul: ({ node, ...props }) => <ul className="list-disc ml-4 mb-2" {...props} />,
                                            ol: ({ node, ...props }) => <ol className="list-decimal ml-4 mb-2" {...props} />,
                                            li: ({ node, ...props }) => <li className="mb-1" {...props} />,
                                            strong: ({ node, ...props }) => <strong className="font-bold text-emerald-300" {...props} />,
                                            /* eslint-enable @typescript-eslint/no-unused-vars */
                                        }}
                                    >
                                        {chat.text}
                                    </ReactMarkdown>
                                </div>
                            </div>
                        ))}
                        {isLoading && (
                            <div className="flex justify-start">
                                <div className="bg-white dark:bg-zinc-800 p-3 rounded-2xl rounded-tl-none border border-zinc-100 dark:border-zinc-700 shadow-sm">
                                    <div className="flex gap-1">
                                        <div className="w-1.5 h-1.5 bg-zinc-400 rounded-full animate-bounce"></div>
                                        <div className="w-1.5 h-1.5 bg-zinc-400 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                                        <div className="w-1.5 h-1.5 bg-zinc-400 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                                    </div>
                                </div>
                            </div>
                        )}
                        <div ref={chatEndRef} />
                    </div>

                    {/* Input Area */}
                    <form onSubmit={handleSend} className="p-4 bg-white dark:bg-zinc-900 border-t border-zinc-200 dark:border-zinc-800">
                        <div className="relative">
                            <input
                                type="text"
                                value={message}
                                onChange={(e) => setMessage(e.target.value)}
                                placeholder={isTakenOver ? "Type your message..." : "Ask me anything..."}
                                className="w-full p-3 pr-10 rounded-xl bg-zinc-100 dark:bg-zinc-800 border-none outline-none focus:ring-2 focus:ring-emerald-500 text-md text-black dark:text-white"
                            />
                            <button
                                type="submit"
                                disabled={isLoading}
                                className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 text-emerald-600 hover:text-emerald-700 disabled:opacity-50 transition-colors"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 rotate-90" viewBox="0 0 20 20" fill="currentColor">
                                    <path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" />
                                </svg>
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {/* Floating Button */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className={`w-14 h-14 rounded-full flex items-center justify-center shadow-2xl transition-all duration-300 transform hover:scale-110 active:scale-95 ${isOpen
                    ? 'bg-zinc-200 dark:bg-zinc-700 text-zinc-900 dark:text-zinc-50'
                    : isTakenOver
                        ? 'bg-amber-500 text-white'
                        : 'bg-emerald-600 text-black animate-bounce-slow'
                    }`}
            >
                {isOpen ? (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                    </svg>
                )}
            </button>

        </div>
    );
};

export default ChatWidget;
