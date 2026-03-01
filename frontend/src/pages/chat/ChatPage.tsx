import { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { chatApi } from '@/api/endpoints';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { EmptyState } from '@/components/ui/EmptyState';
import { PageHeader } from '@/components/ui/PageHeader';
import { useToastStore } from '@/stores/toastStore';
import { timeAgo } from '@/lib/utils';
import {
  MessageCircle,
  Send,
  Search,
  MessageSquare,
  Globe,
  Smartphone,
} from 'lucide-react';
import type { ChatMessage, ChatConversation, ChatChannel } from '@/types';

const CHANNEL_OPTIONS: { value: ChatChannel; label: string; icon: typeof Globe }[] = [
  { value: 'web', label: 'Web', icon: Globe },
  { value: 'whatsapp', label: 'WhatsApp', icon: Smartphone },
  { value: 'messenger', label: 'Messenger', icon: MessageSquare },
];

function channelBadge(channel: ChatChannel) {
  const map: Record<ChatChannel, { variant: 'info' | 'success' | 'default'; label: string }> = {
    web: { variant: 'info', label: 'Web' },
    whatsapp: { variant: 'success', label: 'WhatsApp' },
    messenger: { variant: 'default', label: 'Messenger' },
  };
  const cfg = map[channel] ?? { variant: 'default' as const, label: channel };
  return <Badge variant={cfg.variant}>{cfg.label}</Badge>;
}

function getInitials(name: string): string {
  return name
    .split(' ')
    .map((w) => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

function formatMessageTime(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

export function ChatPage() {
  const queryClient = useQueryClient();
  const toast = useToastStore();

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCustomerId, setSelectedCustomerId] = useState<number | null>(null);
  const [messageText, setMessageText] = useState('');
  const [channel, setChannel] = useState<ChatChannel>('web');

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);

  // Fetch conversations
  const { data: conversationsData, isLoading: conversationsLoading } = useQuery({
    queryKey: ['chat-conversations'],
    queryFn: () => chatApi.conversations(),
  });

  const conversations: ChatConversation[] = (conversationsData?.data?.data ?? [])
    .slice()
    .sort((a, b) => {
      const aTime = a.chat_messages_max_created_at ?? '';
      const bTime = b.chat_messages_max_created_at ?? '';
      return bTime.localeCompare(aTime);
    });

  const filteredConversations = conversations.filter((c) =>
    c.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const selectedConversation = conversations.find((c) => c.id === selectedCustomerId) ?? null;

  // Fetch messages for selected conversation
  const { data: messagesData, isLoading: messagesLoading } = useQuery({
    queryKey: ['chat-messages', selectedCustomerId],
    queryFn: () => chatApi.messages(selectedCustomerId!),
    enabled: !!selectedCustomerId,
  });

  const messages: ChatMessage[] = (messagesData?.data?.data ?? [])
    .slice()
    .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages.length, selectedCustomerId]);

  // Send message mutation
  const sendMutation = useMutation({
    mutationFn: (data: { customerId: number; message: string; channel: string }) =>
      chatApi.send(data.customerId, { message: data.message, channel: data.channel }),
    onSuccess: () => {
      setMessageText('');
      queryClient.invalidateQueries({ queryKey: ['chat-messages', selectedCustomerId] });
      queryClient.invalidateQueries({ queryKey: ['chat-conversations'] });
    },
    onError: () => {
      toast.error('Failed to send message');
    },
  });

  const handleSend = () => {
    if (!messageText.trim() || !selectedCustomerId) return;
    sendMutation.mutate({
      customerId: selectedCustomerId,
      message: messageText.trim(),
      channel,
    });
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div>
      <PageHeader
        title="Live Chat"
        subtitle="Manage customer conversations"
        breadcrumbs={[{ label: 'Chat' }]}
      />

      <div className="h-[calc(100vh-12rem)] flex gap-4">
        {/* Left Panel – Conversation List */}
        <Card className="w-1/3 flex flex-col overflow-hidden">
          {/* Search */}
          <div className="p-3 border-b border-gray-200 dark:border-gray-700">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search conversations…"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Conversation List */}
          <div className="flex-1 overflow-y-auto">
            {conversationsLoading ? (
              <div className="flex items-center justify-center py-12">
                <div className="h-6 w-6 animate-spin rounded-full border-2 border-blue-500 border-t-transparent" />
              </div>
            ) : filteredConversations.length === 0 ? (
              <EmptyState
                icon={MessageCircle}
                title="No conversations"
                description={searchTerm ? 'No conversations match your search' : 'No conversations yet'}
              />
            ) : (
              filteredConversations.map((conv) => {
                const lastMessage = conv.chat_messages?.[0];
                const isSelected = selectedCustomerId === conv.id;

                return (
                  <button
                    key={conv.id}
                    onClick={() => setSelectedCustomerId(conv.id)}
                    className={`w-full text-left px-4 py-3 border-b border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors ${
                      isSelected ? 'bg-blue-50 dark:bg-blue-900/20 border-l-2 border-l-blue-500' : ''
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      {/* Avatar */}
                      <div className="flex-shrink-0 h-10 w-10 rounded-full bg-blue-100 dark:bg-blue-900/50 flex items-center justify-center">
                        <span className="text-sm font-semibold text-blue-600 dark:text-blue-400">
                          {getInitials(conv.name)}
                        </span>
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <h4 className="text-sm font-medium text-gray-900 dark:text-white truncate">
                            {conv.name}
                          </h4>
                          {conv.chat_messages_max_created_at && (
                            <span className="text-xs text-gray-400 flex-shrink-0 ml-2">
                              {timeAgo(conv.chat_messages_max_created_at)}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center justify-between mt-0.5">
                          <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                            {lastMessage?.message ?? 'No messages yet'}
                          </p>
                          {conv.unread_count > 0 && (
                            <Badge variant="info" className="ml-2 flex-shrink-0">
                              {conv.unread_count}
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </Card>

        {/* Right Panel – Message Area */}
        <Card className="flex-1 flex flex-col overflow-hidden">
          {selectedConversation ? (
            <>
              {/* Header */}
              <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-gray-700">
                <div className="flex items-center gap-3">
                  <div className="h-9 w-9 rounded-full bg-blue-100 dark:bg-blue-900/50 flex items-center justify-center">
                    <span className="text-sm font-semibold text-blue-600 dark:text-blue-400">
                      {getInitials(selectedConversation.name)}
                    </span>
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
                      {selectedConversation.name}
                    </h3>
                    {selectedConversation.email && (
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {selectedConversation.email}
                      </p>
                    )}
                  </div>
                </div>
                {messages.length > 0 && channelBadge(messages[messages.length - 1]!.channel)}
              </div>

              {/* Messages */}
              <div
                ref={messagesContainerRef}
                className="flex-1 overflow-y-auto p-4 space-y-3"
              >
                {messagesLoading ? (
                  <div className="flex items-center justify-center h-full">
                    <div className="h-6 w-6 animate-spin rounded-full border-2 border-blue-500 border-t-transparent" />
                  </div>
                ) : messages.length === 0 ? (
                  <div className="flex items-center justify-center h-full text-sm text-gray-400">
                    No messages yet. Start the conversation!
                  </div>
                ) : (
                  messages.map((msg) => {
                    const isOutbound = msg.direction === 'outbound';
                    return (
                      <div
                        key={msg.id}
                        className={`flex ${isOutbound ? 'justify-end' : 'justify-start'}`}
                      >
                        <div
                          className={`max-w-[70%] rounded-2xl px-4 py-2.5 ${
                            isOutbound
                              ? 'bg-blue-500 text-white rounded-br-md'
                              : 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white rounded-bl-md'
                          }`}
                        >
                          {isOutbound && msg.user && (
                            <p
                              className={`text-xs font-medium mb-1 ${
                                isOutbound ? 'text-blue-100' : 'text-gray-500 dark:text-gray-400'
                              }`}
                            >
                              {msg.user.name}
                            </p>
                          )}
                          <p className="text-sm whitespace-pre-wrap break-words">{msg.message}</p>
                          <p
                            className={`text-xs mt-1 ${
                              isOutbound ? 'text-blue-200' : 'text-gray-400 dark:text-gray-500'
                            }`}
                          >
                            {formatMessageTime(msg.created_at)}
                          </p>
                        </div>
                      </div>
                    );
                  })
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Input Area */}
              <div className="border-t border-gray-200 dark:border-gray-700 px-4 py-3">
                <div className="flex items-center gap-2">
                  {/* Channel Selector */}
                  <select
                    value={channel}
                    onChange={(e) => setChannel(e.target.value as ChatChannel)}
                    className="text-sm rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 px-2 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {CHANNEL_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>

                  {/* Text Input */}
                  <input
                    type="text"
                    placeholder="Type a message…"
                    value={messageText}
                    onChange={(e) => setMessageText(e.target.value)}
                    onKeyDown={handleKeyDown}
                    className="flex-1 text-sm rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />

                  {/* Send Button */}
                  <Button
                    onClick={handleSend}
                    disabled={!messageText.trim() || sendMutation.isPending}
                    size="sm"
                  >
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <EmptyState
                icon={MessageCircle}
                title="Select a conversation"
                description="Choose a conversation from the list to start chatting"
              />
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
