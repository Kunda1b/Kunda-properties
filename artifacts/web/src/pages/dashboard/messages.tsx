import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { messagesApi } from "@/lib/api";
import { useAuthStore } from "@/lib/store/auth.store";
import { formatRelativeTime } from "@/lib/utils";
import { MessageSquare, Send, Loader2, ArrowLeft, Mail, MailOpen } from "lucide-react";
import { Link } from "wouter";
import toast from "react-hot-toast";

export default function MessagesPage() {
  const [selectedConv, setSelectedConv] = useState<string | null>(null);
  const [replyText, setReplyText] = useState("");
  const user = useAuthStore((s) => s.user);
  const qc = useQueryClient();

  const { data: conversations, isLoading, isError } = useQuery({
    queryKey: ["conversations"],
    queryFn: () => messagesApi.getConversations().then((r) => r.data.data),
    refetchInterval: 15000,
    retry: 1,
  });

  const { data: conversationDetail } = useQuery({
    queryKey: ["conversation", selectedConv],
    enabled: !!selectedConv,
    queryFn: () => messagesApi.getConversation(selectedConv!).then((r) => r.data.data),
    refetchInterval: 10000,
  });

  const replyMutation = useMutation({
    mutationFn: () => messagesApi.reply(selectedConv!, replyText),
    onSuccess: () => {
      setReplyText("");
      qc.invalidateQueries({ queryKey: ["conversation", selectedConv] });
      qc.invalidateQueries({ queryKey: ["conversations"] });
    },
    onError: () => toast.error("Failed to send message"),
  });

  const convs = conversations || [];
  const msgs = conversationDetail?.messages || [];
  const currentConv = conversationDetail?.conversation;

  if (isError && convs.length === 0) return (
    <div className="max-w-3xl mx-auto">
      <h1 className="font-display text-2xl font-bold text-gray-900 mb-6">Messages</h1>
      <div className="text-center py-20">
        <MessageSquare className="w-12 h-12 text-gray-300 mx-auto mb-4" />
        <p className="text-gray-500">Failed to load conversations</p>
        <p className="text-xs text-gray-400 mt-2">Please try again later</p>
      </div>
    </div>
  );

  if (!selectedConv) {
    return (
      <div className="max-w-3xl mx-auto">
        <h1 className="font-display text-2xl font-bold text-gray-900 mb-6">Messages</h1>
        {isLoading && (
          <div className="space-y-3">
            {[1,2,3].map((i) => <div key={i} className="h-20 bg-gray-100 animate-pulse rounded-xl" />)}
          </div>
        )}
        {!isLoading && convs.length === 0 && (
          <div className="text-center py-20">
            <MessageSquare className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">No conversations yet</p>
            <p className="text-xs text-gray-400 mt-2">Send an enquiry from a listing to start chatting</p>
          </div>
        )}
        <div className="space-y-2">
          {convs.map((conv: any) => {
            const isUnread = conv.unread;
            return (
              <button
                key={conv.id}
                onClick={() => setSelectedConv(conv.id)}
                className={`w-full text-left p-4 rounded-xl border transition-colors ${
                  isUnread ? "bg-kunda-50 border-kunda-200" : "bg-white border-gray-100 hover:border-gray-200"
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-kunda-700 flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
                    {conv.otherUser?.profile?.firstName?.[0] || "?"}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className={`text-sm truncate ${isUnread ? "font-bold text-gray-900" : "font-medium text-gray-900"}`}>
                        {conv.otherUser?.profile?.firstName} {conv.otherUser?.profile?.lastName}
                      </p>
                      {isUnread && <span className="w-2 h-2 rounded-full bg-kunda-600 flex-shrink-0" />}
                    </div>
                    <p className="text-xs text-gray-500 truncate">
                      Re: {conv.listing?.title}
                    </p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {conv.messages?.[0]?.body?.slice(0, 60)}...
                    </p>
                  </div>
                  <div className="text-xs text-gray-400 flex-shrink-0">
                    {formatRelativeTime(conv.lastMessageAt)}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto">
      <button onClick={() => setSelectedConv(null)}
        className="flex items-center gap-2 text-sm text-gray-500 hover:text-kunda-700 mb-4">
        <ArrowLeft className="w-4 h-4" /> All conversations
      </button>

      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
        {currentConv && (
          <div className="p-4 border-b border-gray-100 bg-gray-50">
            <p className="font-medium text-gray-900">{currentConv.listing?.title}</p>
            <p className="text-xs text-gray-500">
              with {currentConv.buyerId === user?.id
                ? currentConv.seller?.profile?.firstName
                : currentConv.buyer?.profile?.firstName} {currentConv.buyerId === user?.id
                  ? currentConv.seller?.profile?.lastName
                  : currentConv.buyer?.profile?.lastName}
            </p>
          </div>
        )}

        <div className="h-96 overflow-y-auto p-4 space-y-3">
          {msgs.map((msg: any) => {
            const isMe = msg.senderId === user?.id;
            return (
              <div key={msg.id} className={`flex ${isMe ? "justify-end" : "justify-start"}`}>
                <div className={`max-w-[80%] rounded-2xl px-4 py-2 text-sm ${
                  isMe ? "bg-kunda-700 text-white rounded-br-md" : "bg-gray-100 text-gray-900 rounded-bl-md"
                }`}>
                  <p>{msg.body}</p>
                  <p className={`text-xs mt-1 ${isMe ? "text-kunda-200" : "text-gray-400"}`}>
                    {formatRelativeTime(msg.createdAt)}
                    {isMe && (msg.readAt ? " · Read" : " · Sent")}
                  </p>
                </div>
              </div>
            );
          })}
        </div>

        <div className="p-4 border-t border-gray-100">
          <div className="flex gap-2">
            <input
              value={replyText}
              onChange={(e) => setReplyText(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); replyMutation.mutate(); } }}
              placeholder="Type your message…"
              className="input-field flex-1"
            />
            <button
              onClick={() => replyMutation.mutate()}
              disabled={!replyText.trim() || replyMutation.isPending}
              className="btn-primary px-4"
            >
              {replyMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
