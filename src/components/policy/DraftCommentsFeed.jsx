import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import {
  Heart,
  MessageSquare,
  Send,
  Check,
  CheckCircle2,
  ListTodo,
  AtSign,
  CornerDownRight,
  Sparkles,
  Loader2,
  Bot
} from 'lucide-react';
import { apiService } from '../../services/apiService';
import { taskApi } from '../../services/api/taskApi';
import { policyChatApi } from '../../services/api/policyChatApi';
import { privateChatApi } from '../../services/api/privateChatApi';
import { extractPolicyAiContext } from '../../utils/policyAiContext';
import MarkdownMessage from '../common/MarkdownMessage';

const BANK_SQUAD = [
  { id: 'u_cba_marcus', name: 'Marcus Vance', role: 'Bank Administrator', avatar: 'MV', color: 'bg-indigo-600' },
  { id: 'u_cba_sarah', name: 'Sarah Jenkins', role: 'Senior Credit Risk Officer', avatar: 'SJ', color: 'bg-emerald-600' },
  { id: 'u_cba_david', name: 'David Miller', role: 'Credit Underwriter', avatar: 'DM', color: 'bg-blue-600' },
  { id: 'u_cba_settlo_lead', name: 'Settlo Admin', role: 'APRA Compliance Lead', avatar: 'SA', color: 'bg-purple-600' },
  { id: 'u_cba_alex', name: 'Alex Morgan', role: 'Operations Squad Lead', avatar: 'AM', color: 'bg-amber-600' }
];

const isShidneyMention = (value) => /@\s*(?:\*\*)?Shidney\b(?:\*\*)?/i.test(value || '');

const normalizeStatusLabel = (status) => {
  const s = String(status || 'pending').toLowerCase();
  if (s === 'completed' || s === 'resolved' || s === 'approved') return 'completed';
  if (s === 'in_progress' || s === 'responded' || s === 'acknowledged') return 'responded';
  return 'pending';
};

export default function DraftCommentsFeed({
  openedDocument = null,
  currentUser,
  onActionClick = null,
}) {
  const currentUserName = currentUser?.name || 'Marcus Vance';
  const docKey = openedDocument?.id || null;

  const [sharedMessages, setSharedMessages] = useState([]);
  const [privateAiMessages, setPrivateAiMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [replyingTo, setReplyingTo] = useState(null);
  const [isTaskCommand, setIsTaskCommand] = useState(false);
  const [showMentionMenu, setShowMentionMenu] = useState(false);
  const [mentionQuery, setMentionQuery] = useState('');
  const [squadUsers, setSquadUsers] = useState(BANK_SQUAD);
  const [isLoading, setIsLoading] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState('');

  const commentsEndRef = useRef(null);
  const inputRef = useRef(null);
  const reqCounterRef = useRef(0);

  // Load real registered bank users for @mention task commands
  useEffect(() => {
    let active = true;
    const normalizeUsers = (users) =>
      users
        .map((u) => ({
          id: u.id,
          name: u.name || `${u.first_name || ''} ${u.last_name || ''}`.trim() || u.email,
          email: u.email || '',
          role: u.role || u.role_type || 'Staff Officer',
          avatar: (u.name || u.first_name || 'U').slice(0, 2).toUpperCase(),
          color: 'bg-blue-600',
        }))
        .filter((u) => u.id && u.name);

    const mergeUsers = (formatted) => {
      if (!active) return;
      setSquadUsers((prev) => {
        const map = new Map();
        formatted.forEach((u) => map.set(u.id, u));
        prev.forEach((u) => { if (!map.has(u.id)) map.set(u.id, u); });
        return Array.from(map.values());
      });
    };

    taskApi.getAssignableUsers()
      .then((users) => {
        if (Array.isArray(users) && users.length > 0) mergeUsers(normalizeUsers(users));
      })
      .catch(() => {
        apiService.getUsers()
          .then((users) => {
            if (Array.isArray(users) && users.length > 0) mergeUsers(normalizeUsers(users));
          })
          .catch(() => {});
      });

    return () => { active = false; };
  }, []);

  // Load BOTH:
  // 1) Shared Policy Chat & Command Tasks (visible to all collaborators)
  // 2) Current user's Private @Shidney AI Q&A for this opened document (hidden from everyone else!)
  const loadChats = useCallback(async (silent = false) => {
    const reqId = ++reqCounterRef.current;
    if (!silent) setIsLoading(true);

    const sharedPromise = docKey
      ? policyChatApi.getMessages(docKey)
      : Promise.resolve({ messages: [], tasks: [] });
    const privatePromise = privateChatApi.getAiMessages(docKey || null);

    const [sharedRes, privateRes] = await Promise.allSettled([sharedPromise, privatePromise]);
    if (reqId !== reqCounterRef.current) return;

    if (sharedRes.status === 'fulfilled') {
      let rows = Array.isArray(sharedRes.value?.messages) ? sharedRes.value.messages : [];
      // Backward compatibility: include any legacy comments stored in parameters.comments if new table has none yet
      if (rows.length === 0 && docKey) {
        try {
          const legacy = await apiService.getPolicyComments(docKey);
          if (Array.isArray(legacy) && legacy.length > 0) {
            rows = legacy
              .filter((c) => !String(c.id).startsWith('c-seed'))
              .map((c) => ({
                id: c.id,
                sender_name: c.author || 'Team Member',
                sender_role: c.authorRole || 'Staff Officer',
                message_type: c.isTask ? 'task' : 'user',
                content: c.text || '',
                task_id: c.taskId || null,
                task_code: c.taskCode || null,
                task_title: c.text || 'Command Task',
                assigned_name: c.taskAssignee || null,
                task_status: c.taskStatus || 'pending',
                likes: c.likes || 0,
                likedByMe: Boolean(c.likedByMe),
                privateOnly: false,
                created_at: c.created_at || new Date().toISOString(),
                legacyReplies: Array.isArray(c.replies) ? c.replies : [],
              }));
          }
        } catch {
          // Ignore legacy fallback failure
        }
      }
      setSharedMessages(rows);
    } else if (!silent) {
      setSharedMessages([]);
    }

    if (privateRes.status === 'fulfilled') {
      const priv = Array.isArray(privateRes.value?.messages) ? privateRes.value.messages : [];
      setPrivateAiMessages(priv);
    } else if (!silent) {
      setPrivateAiMessages([]);
    }

    if (!silent) setIsLoading(false);
  }, [docKey]);

  useEffect(() => {
    setReplyingTo(null);
    setError('');
    loadChats(false);
    const interval = window.setInterval(() => loadChats(true), 5000);
    return () => window.clearInterval(interval);
  }, [loadChats]);

  // Organize threaded shared replies + chronological merge with private @Shidney AI messages
  const timelineMessages = useMemo(() => {
    const repliesByParent = new Map();
    const topLevelShared = [];

    sharedMessages.forEach((m) => {
      if (m.parent_id) {
        const key = String(m.parent_id);
        if (!repliesByParent.has(key)) repliesByParent.set(key, []);
        repliesByParent.get(key).push(m);
      } else {
        topLevelShared.push(m);
      }
    });

    const combined = [
      ...topLevelShared.map((m) => ({
        ...m,
        privateOnly: false,
        replies: [
          ...(Array.isArray(m.legacyReplies) ? m.legacyReplies : []),
          ...(repliesByParent.get(String(m.id)) || []),
        ],
      })),
      ...privateAiMessages.map((m) => ({
        ...m,
        privateOnly: true,
        replies: [],
      })),
    ];

    return combined.sort(
      (a, b) => new Date(a.created_at || 0).getTime() - new Date(b.created_at || 0).getTime()
    );
  }, [sharedMessages, privateAiMessages]);

  useEffect(() => {
    commentsEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, [timelineMessages.length, isSending]);

  const mentionMatches = useMemo(() => {
    const q = (mentionQuery || '').trim().toLowerCase();
    const users = squadUsers.filter(
      (u) => !q || u.name.toLowerCase().includes(q) || u.role.toLowerCase().includes(q) || u.email?.toLowerCase().includes(q)
    );
    const shidneyMatches = !q || 'shidney'.includes(q) || q.includes('shidney') || 'ai'.includes(q);
    return [
      ...(shidneyMatches
        ? [{ id: '__shidney_ai__', name: 'Shidney', role: 'Private AI · Only visible to you', isAi: true, avatar: 'AI', color: 'bg-violet-600' }]
        : []),
      ...users,
    ];
  }, [squadUsers, mentionQuery]);

  const handleInputChange = (e) => {
    const val = e.target.value;
    setInputText(val);
    setError('');

    const cursorPos = e.target.selectionStart ?? val.length;
    const beforeCursor = val.slice(0, cursorPos);
    const lastAt = beforeCursor.lastIndexOf('@');
    if (lastAt !== -1) {
      const q = beforeCursor.slice(lastAt + 1);
      if (!q.includes('\n') && !q.includes('@') && q.length < 30) {
        setMentionQuery(q.toLowerCase());
        setShowMentionMenu(true);
        return;
      }
    }
    setShowMentionMenu(false);
  };

  const handleSelectMention = (item) => {
    const cursorPos = inputRef.current?.selectionStart ?? inputText.length;
    const beforeCursor = inputText.slice(0, cursorPos);
    const afterCursor = inputText.slice(cursorPos);
    const lastAt = beforeCursor.lastIndexOf('@');
    const prefix = lastAt >= 0 ? beforeCursor.slice(0, lastAt) : beforeCursor;
    const insertion = `@${item.name} `;
    setInputText(`${prefix}${insertion}${afterCursor}`);
    setShowMentionMenu(false);

    if (item.isAi) {
      setIsTaskCommand(false);
    } else {
      setIsTaskCommand(true);
    }

    requestAnimationFrame(() => {
      if (inputRef.current) {
        inputRef.current.focus();
        const pos = prefix.length + insertion.length;
        inputRef.current.setSelectionRange(pos, pos);
      }
    });
  };

  const findMentionedSquadUser = (text) => {
    const sorted = [...squadUsers].sort((a, b) => (b.name?.length || 0) - (a.name?.length || 0));
    for (const u of sorted) {
      if (!u.name) continue;
      const escaped = u.name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const regex = new RegExp(`@${escaped}(?:\\b|\\s|$|[.,!?])`, 'i');
      if (regex.test(text)) return u;
    }
    const generic = text.match(/@([a-zA-Z0-9_.-]+)/);
    if (generic && generic[1].toLowerCase() !== 'shidney') {
      const q = generic[1].toLowerCase();
      return squadUsers.find(
        (u) =>
          u.name.toLowerCase().startsWith(q) ||
          u.name.toLowerCase().split(' ')[0].toLowerCase() === q ||
          u.email?.toLowerCase().startsWith(q) ||
          u.id?.toLowerCase() === q
      ) || null;
    }
    return null;
  };

  const handleToggleLike = async (msg) => {
    if (!docKey || msg.privateOnly) return;
    setSharedMessages((prev) =>
      prev.map((m) =>
        String(m.id) === String(msg.id)
          ? {
              ...m,
              likedByMe: !m.likedByMe,
              likes: !m.likedByMe ? (m.likes || 0) + 1 : Math.max(0, (m.likes || 0) - 1),
            }
          : m
      )
    );
    try {
      await policyChatApi.toggleLike(docKey, msg.id);
    } catch {
      apiService.toggleCommentLike(docKey, msg.id).catch(() => {});
    }
  };

  const handleUpdateTaskStatus = async (msg, nextStatus) => {
    const dbTaskStatus = nextStatus === 'in_progress' || nextStatus === 'responded' ? 'responded' : 'completed';

    setSharedMessages((prev) =>
      prev.map((m) => (String(m.id) === String(msg.id) ? { ...m, task_status: dbTaskStatus } : m))
    );

    if (docKey) {
      policyChatApi.updateTaskStatus(docKey, msg.id, dbTaskStatus).catch(() => {
        apiService.updateCommentTaskStatus(docKey, msg.id, dbTaskStatus).catch(() => {});
      });
    }

    if (msg.task_id) {
      try {
        await taskApi.updateStatus(msg.task_id, dbTaskStatus);
      } catch {
        apiService.updateTask(msg.task_id, { status: dbTaskStatus }).catch(() => {});
      }
      window.dispatchEvent(
        new CustomEvent('liblist:task_updated', {
          detail: { id: msg.task_id, status: dbTaskStatus },
        })
      );
    }
  };

  const handlePostMessage = async (e) => {
    if (e) e.preventDefault();
    const rawText = inputText.trim();
    if (!rawText || isSending) return;

    setError('');
    setIsSending(true);

    try {
      // 1. @Shidney Private AI query (STRICTLY private per user — hidden from other users!)
      if (isShidneyMention(rawText)) {
        const cleanQuestion = rawText.replace(/@\s*(?:\*\*)?Shidney\b(?:\*\*)?:?/gi, '').trim();
        if (!cleanQuestion) {
          setError('Type a question after @Shidney about the opened document.');
          setIsSending(false);
          return;
        }

        const result = await privateChatApi.sendAiMessage({
          content: rawText,
          policy_id: docKey,
          policy_title: openedDocument?.title || null,
          policy_context: extractPolicyAiContext(openedDocument),
        });

        setPrivateAiMessages((prev) => [
          ...prev,
          result.userMessage,
          result.assistantMessage,
        ]);
        setInputText('');
        setIsTaskCommand(false);
        setShowMentionMenu(false);
        return;
      }

      // Shared Policy Chat & Commands require an opened document
      if (!docKey) {
        setError('Open a policy or draft to post in shared team chat or assign a @Command Task. Use @Shidney for private AI anytime.');
        setIsSending(false);
        return;
      }

      // Support `/task <instruction>` shortcut as well as @mention and Task Command button
      const isSlashTask = /^\/task\b/i.test(rawText);
      const text = isSlashTask ? rawText.replace(/^\/task\b\s*/i, '').trim() : rawText;
      if (!text) {
        setIsSending(false);
        return;
      }

      const mentionedUser = findMentionedSquadUser(text);
      const isTask = isTaskCommand || isSlashTask || Boolean(mentionedUser);
      const originPolicyId = openedDocument?.id || openedDocument?.policy_id;
      const originPolicyTitle = openedDocument?.title || 'Operational Policy';
      const originSection =
        openedDocument?.section_id ||
        (openedDocument?.version ? `v${String(openedDocument.version).replace(/^v/i, '')}` : 'General Clause');

      // 2. Reply to an existing shared thread
      if (replyingTo && !replyingTo.privateOnly) {
        const savedReply = await policyChatApi.saveMessage(docKey, {
          content: text,
          parent_id: Number.isFinite(Number(replyingTo.id)) ? Number(replyingTo.id) : null,
          sender_name: currentUserName,
          sender_role: currentUser?.role || 'Staff Officer',
        });
        setSharedMessages((prev) => [...prev, savedReply]);
        setReplyingTo(null);
        setInputText('');
        setIsTaskCommand(false);
        setShowMentionMenu(false);
        return;
      }

      // 3. Command Task creation (@member or Task Command toggle)
      let createdTask = null;
      let assigneeName = mentionedUser?.name || squadUsers.find((u) => u.name !== currentUserName)?.name || 'Sarah Jenkins';
      let assigneeId = mentionedUser?.id || null;

      if (isTask) {
        const cleanTaskDesc = text.replace(/@([a-zA-Z0-9_\s.-]+?)(?=\s|$|[.,!?])/g, '').trim() || 'Review Policy Specification';
        const taskTitle = cleanTaskDesc.length > 90 ? `${cleanTaskDesc.slice(0, 87)}...` : cleanTaskDesc;

        try {
          const res = await taskApi.createTask({
            title: taskTitle,
            description: text,
            category: 'general',
            assigned_to: assigneeId || assigneeName,
            library_id: originPolicyId,
            section_id: originSection,
            linked_policy_id: originPolicyId,
            policy_title: originPolicyTitle,
          });
          createdTask = res?.data || res;
          if (createdTask?.assigned_to_name) assigneeName = createdTask.assigned_to_name;
          if (createdTask?.assigned_to) assigneeId = createdTask.assigned_to;
        } catch (taskErr) {
          console.warn('Task creation warning:', taskErr.message);
        }

        window.dispatchEvent(
          new CustomEvent('liblist:task_created', {
            detail: {
              ...(createdTask || {}),
              id: createdTask?.id || `TASK-${Date.now().toString().slice(-5)}`,
              title: createdTask?.title || taskTitle,
              description: text,
              assigned_to: assigneeId || assigneeName,
              assigned_to_name: assigneeName,
              assigned_by: currentUserName,
              created_by_name: currentUserName,
              linked_policy_id: originPolicyId,
              policy_id: originPolicyId,
              library_id: originPolicyId,
              section_id: originSection,
              policy_title: originPolicyTitle,
              status: 'pending',
              created_at: new Date().toISOString(),
            },
          })
        );

        const savedTaskMsg = await policyChatApi.saveMessage(docKey, {
          content: text,
          task_id: createdTask?.id || null,
          task_code: createdTask?.task_code || null,
          task_title: createdTask?.title || taskTitle,
          assigned_to: assigneeId || null,
          assigned_name: assigneeName,
          task_status: 'pending',
          sender_name: currentUserName,
          sender_role: currentUser?.role || 'Staff Officer',
        });
        setSharedMessages((prev) => [...prev, savedTaskMsg]);
      } else {
        // 4. Normal shared policy discussion message (visible to all users)
        const savedMsg = await policyChatApi.saveMessage(docKey, {
          content: text,
          sender_name: currentUserName,
          sender_role: currentUser?.role || 'Staff Officer',
        });
        setSharedMessages((prev) => [...prev, savedMsg]);
      }

      setInputText('');
      setIsTaskCommand(false);
      setShowMentionMenu(false);
    } catch (err) {
      setError(err.message || 'Could not send message.');
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-[#f8fafc] relative select-text">
      {/* Messages Timeline */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2.5 custom-scrollbar">
        {isLoading && timelineMessages.length === 0 ? (
          <div className="h-full flex items-center justify-center gap-2 text-xs text-slate-400">
            <Loader2 className="w-4 h-4 animate-spin text-[#0057B8]" />
            <span>Loading chats...</span>
          </div>
        ) : timelineMessages.length === 0 ? (
          <div className="text-center py-8 px-4 bg-white/80 rounded-2xl border border-dashed border-slate-200 space-y-1.5">
            <div className="w-9 h-9 rounded-full bg-blue-50 text-[#0057B8] flex items-center justify-center mx-auto">
              <MessageSquare className="w-4 h-4" />
            </div>
            <h4 className="font-bold text-slate-800 text-xs">No messages yet</h4>
            <p className="text-[11px] text-slate-500 max-w-xs mx-auto leading-relaxed">
              {docKey ? (
                <>Type a message, <b className="text-[#0057B8]">@name</b> to assign a task, or <b className="text-violet-700">@Shidney</b> for AI.</>
              ) : (
                <>Use <b className="text-violet-700">@Shidney</b> to ask AI, or open a policy to chat.</>
              )}
            </p>
          </div>
        ) : (
          timelineMessages.map((msg) => {
            const isPrivate = Boolean(msg.privateOnly);
            const isAssistant = msg.message_type === 'assistant';
            const isTask = msg.message_type === 'task';
            const normStatus = normalizeStatusLabel(msg.task_status);
            const isResolved = normStatus === 'completed';
            const isResponded = normStatus === 'responded';
            const senderLabel = isAssistant ? 'Shidney AI' : (msg.sender_name || 'Team Member');
            const initials = isAssistant ? 'AI' : senderLabel.slice(0, 2).toUpperCase();
            const timeStr = msg.created_at
              ? new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
              : (msg.time || '');

            return (
              <div key={`${isPrivate ? 'priv' : 'pub'}-${msg.id}`} className="space-y-1.5">
                <div
                  className={`p-3 rounded-xl border shadow-2xs space-y-2 transition ${
                    isPrivate
                      ? 'bg-gradient-to-br from-violet-50/80 to-white border-violet-200/90'
                      : 'bg-white border-slate-200/80 hover:border-blue-200'
                  }`}
                >
                  {/* Header */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <div
                        className={`w-6 h-6 rounded-full text-white font-bold text-[10px] flex items-center justify-center flex-shrink-0 ${
                          isPrivate ? 'bg-violet-600' : 'bg-[#0057B8]'
                        }`}
                      >
                        {isAssistant ? <Bot className="w-3.5 h-3.5" /> : initials}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="font-bold text-slate-900 text-xs truncate">{senderLabel}</span>
                          {isPrivate ? (
                            <span className="inline-flex items-center px-1.5 py-0.2 rounded-full bg-violet-100 text-violet-800 border border-violet-200 text-[9.5px] font-bold">
                              Private
                            </span>
                          ) : (
                            <span className="text-[10px] text-slate-400">
                              {msg.sender_role || 'Team'} {timeStr ? `• ${timeStr}` : ''}
                            </span>
                          )}
                        </div>
                        {isPrivate && timeStr && (
                          <span className="text-[10px] text-slate-400 block">{timeStr}</span>
                        )}
                      </div>
                    </div>

                    {!isPrivate && (
                      <button
                        type="button"
                        onClick={() => handleToggleLike(msg)}
                        className={`p-1 rounded-lg flex items-center gap-1 text-[11px] font-bold transition cursor-pointer flex-shrink-0 ${
                          msg.likedByMe
                            ? 'text-rose-600 bg-rose-50'
                            : 'text-slate-400 hover:text-rose-500 hover:bg-slate-50'
                        }`}
                        title="Like message"
                      >
                        <Heart className={`w-3.5 h-3.5 ${msg.likedByMe ? 'fill-rose-600 text-rose-600' : ''}`} />
                        <span>{msg.likes || 0}</span>
                      </button>
                    )}
                  </div>

                  {/* Body with Markdown + Table + @Mention formatting */}
                  <div className="pl-8 text-xs text-slate-700">
                    <MarkdownMessage content={msg.content} onActionClick={onActionClick} />
                  </div>

                  {/* Shared Command Task Card */}
                  {isTask && !isPrivate && (
                    <div className="ml-8 p-2.5 rounded-lg bg-blue-50/75 border border-blue-200/80 text-[11px] space-y-1.5">
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-1.5 font-bold text-blue-950 min-w-0">
                          <ListTodo className="w-3.5 h-3.5 text-[#0057B8] flex-shrink-0" />
                          <span className="truncate">
                            {msg.task_code ? `${msg.task_code} · ` : ''}
                            Command Task: @{msg.assigned_name || 'Squad Member'}
                          </span>
                        </div>
                        <span
                          className={`text-[9.5px] font-mono font-bold px-2 py-0.2 rounded-full border flex-shrink-0 ${
                            isResolved
                              ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                              : isResponded
                                ? 'bg-amber-100 text-amber-800 border-amber-300'
                                : 'bg-blue-100 text-blue-800 border-blue-300'
                          }`}
                        >
                          {String(msg.task_status || 'PENDING').toUpperCase()}
                        </span>
                      </div>

                      {msg.task_title && msg.task_title !== msg.content && (
                        <div className="text-[11px] text-slate-700 font-medium">{msg.task_title}</div>
                      )}

                      <div className="flex items-center justify-end gap-1.5 pt-1">
                        {!isResolved ? (
                          <>
                            {!isResponded && (
                              <button
                                type="button"
                                onClick={() => handleUpdateTaskStatus(msg, 'responded')}
                                className="px-2 py-0.5 bg-white hover:bg-amber-50 text-amber-800 border border-amber-300 rounded text-[10px] font-bold transition cursor-pointer"
                              >
                                Acknowledge
                              </button>
                            )}
                            <button
                              type="button"
                              onClick={() => handleUpdateTaskStatus(msg, 'completed')}
                              className="px-2 py-0.5 bg-[#0057B8] hover:bg-[#004EA6] text-white rounded text-[10px] font-bold transition cursor-pointer flex items-center gap-0.5"
                            >
                              <Check className="w-3 h-3" />
                              <span>Mark Resolved</span>
                            </button>
                          </>
                        ) : (
                          <span className="text-emerald-700 font-bold text-[10px] flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3" />
                            <span>Task Completed</span>
                          </span>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Footer Actions */}
                  {!isPrivate && (
                    <div className="flex items-center text-[10.5px] text-slate-400 pt-1 pl-8">
                      <button
                        type="button"
                        onClick={() => {
                          setReplyingTo(msg);
                          setInputText(`@${senderLabel} `);
                          requestAnimationFrame(() => inputRef.current?.focus());
                        }}
                        className="font-bold text-slate-500 hover:text-[#0057B8] flex items-center gap-1 cursor-pointer"
                      >
                        <CornerDownRight className="w-3 h-3" />
                        <span>Reply</span>
                      </button>
                    </div>
                  )}
                </div>

                {/* Threaded Replies */}
                {Array.isArray(msg.replies) && msg.replies.length > 0 && (
                  <div className="pl-5 space-y-1.5 border-l-2 border-slate-200 ml-4">
                    {msg.replies.map((rep) => {
                      const repName = rep.sender_name || rep.author || 'Team Member';
                      const repTime = rep.created_at
                        ? new Date(rep.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                        : (rep.time || '');
                      return (
                        <div key={rep.id} className="p-2.5 bg-white/90 rounded-xl border border-slate-200 text-xs space-y-1 shadow-2xs">
                          <div className="flex items-center gap-1.5">
                            <div className="w-5 h-5 rounded-full bg-blue-600 text-white font-bold text-[9px] flex items-center justify-center">
                              {repName.slice(0, 2).toUpperCase()}
                            </div>
                            <span className="font-bold text-slate-900 text-[11.5px]">{repName}</span>
                            {repTime && <span className="text-[10px] text-slate-400">• {repTime}</span>}
                          </div>
                          <div className="pl-6 text-[11px] text-slate-700">
                            <MarkdownMessage content={rep.content || rep.text || ''} onActionClick={onActionClick} />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })
        )}

        {isSending && isShidneyMention(inputText) && (
          <div className="flex items-center gap-2 p-2.5 rounded-xl bg-violet-50 border border-violet-200 text-xs text-violet-800 font-medium">
            <Loader2 className="w-3.5 h-3.5 animate-spin text-violet-600" />
            <span>Shidney is thinking...</span>
          </div>
        )}

        <div ref={commentsEndRef} />
      </div>

      {/* Unified @ Mention Menu (@Shidney Private AI + @Person Command Tasks) */}
      {showMentionMenu && (
        <div className="absolute bottom-16 left-3 right-3 bg-white border border-slate-200 rounded-xl shadow-xl z-50 overflow-hidden max-h-56 overflow-y-auto custom-scrollbar">
          <div className="p-2 bg-slate-50 border-b border-slate-100 flex items-center justify-between text-[11px] text-slate-600 font-semibold">
            <span>Mention</span>
            <span>{mentionMatches.length}</span>
          </div>
          {mentionMatches.map((item) => (
            <button
              key={item.id}
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => handleSelectMention(item)}
              className={`w-full px-3 py-2 text-left transition flex items-center justify-between border-b border-slate-50 last:border-0 cursor-pointer ${
                item.isAi ? 'bg-violet-50/40 hover:bg-violet-50' : 'hover:bg-blue-50'
              }`}
            >
              <div className="flex items-center gap-2 min-w-0">
                <div
                  className={`w-6 h-6 rounded-full ${item.color || 'bg-blue-600'} text-white font-bold text-[10px] flex items-center justify-center flex-shrink-0`}
                >
                  {item.isAi ? <Sparkles className="w-3.5 h-3.5" /> : item.avatar}
                </div>
                <div className="min-w-0">
                  <p className="font-bold text-slate-900 text-xs truncate">
                    {item.isAi ? '@Shidney · Private AI' : `@${item.name}`}
                  </p>
                  <p className="text-[10.5px] text-slate-500 truncate">{item.role}</p>
                </div>
              </div>
              <span
                className={`text-[10px] font-bold px-1.5 py-0.5 rounded flex-shrink-0 ${
                  item.isAi
                    ? 'text-violet-700 bg-violet-100'
                    : 'text-[#0057B8] bg-blue-100/70'
                }`}
              >
                {item.isAi ? 'Private AI' : 'Command Task'}
              </span>
            </button>
          ))}
        </div>
      )}

      {/* Replying / Mode / Error Banners */}
      {replyingTo && (
        <div className="px-3 py-1 bg-blue-50 border-t border-blue-200 flex items-center justify-between text-xs text-blue-900">
          <span>Replying to <strong>@{replyingTo.sender_name || replyingTo.author}</strong></span>
          <button
            type="button"
            onClick={() => { setReplyingTo(null); setInputText(''); }}
            className="text-slate-400 hover:text-slate-700 font-bold cursor-pointer"
          >
            ✕
          </button>
        </div>
      )}

      {error && (
        <div className="px-3 py-1.5 bg-rose-50 border-t border-rose-200 flex items-center justify-between text-[11px] text-rose-700 font-medium">
          <span>{error}</span>
          <button type="button" onClick={() => setError('')} className="font-bold cursor-pointer ml-2">✕</button>
        </div>
      )}

      {/* Bottom Input Bar */}
      <form onSubmit={handlePostMessage} className="p-2.5 bg-white border-t border-slate-200">
        <div className="flex items-center gap-1.5">
          {/* Quick @ Menu (Shidney Private AI + Teammate Command Tasks) */}
          <button
            type="button"
            onClick={() => {
              setInputText((prev) => (prev ? `${prev} @` : '@'));
              setShowMentionMenu(true);
              setMentionQuery('');
              requestAnimationFrame(() => inputRef.current?.focus());
            }}
            title="Mention @Shidney (private AI) or @person (Command Task)"
            className="p-2 rounded-xl text-slate-400 hover:text-[#0057B8] hover:bg-blue-50 border border-slate-200 transition cursor-pointer flex items-center justify-center flex-shrink-0"
          >
            <AtSign className="w-3.5 h-3.5" />
          </button>

          {/* Toggle Command Task Mode */}
          <button
            type="button"
            onClick={() => {
              setIsTaskCommand((prev) => !prev);
              requestAnimationFrame(() => inputRef.current?.focus());
            }}
            title="Toggle Command Task mode"
            className={`p-2 rounded-xl border transition cursor-pointer flex items-center justify-center flex-shrink-0 ${
              isTaskCommand
                ? 'bg-amber-500 text-white border-amber-600 shadow-xs'
                : 'text-slate-400 hover:text-amber-600 hover:bg-amber-50 border-slate-200'
            }`}
          >
            <ListTodo className="w-3.5 h-3.5" />
          </button>

          <div className="relative flex-1">
            <input
              ref={inputRef}
              type="text"
              value={inputText}
              onChange={handleInputChange}
              onKeyDown={(e) => {
                if (e.key === 'Escape') setShowMentionMenu(false);
              }}
              disabled={isSending}
              placeholder={
                isShidneyMention(inputText)
                  ? 'Ask @Shidney privately about this doc...'
                  : isTaskCommand
                    ? 'Command task: @person instruction...'
                    : docKey
                      ? `Message, @Shidney (private), or @name (task)...`
                      : 'Mention @Shidney or open a doc...'
              }
              className={`w-full border rounded-xl pl-3 pr-7 py-2 text-xs text-slate-900 placeholder-slate-400 outline-none transition ${
                isShidneyMention(inputText)
                  ? 'bg-violet-50/40 border-violet-300 focus:bg-white focus:border-violet-500'
                  : isTaskCommand
                    ? 'bg-amber-50/40 border-amber-300 focus:bg-white focus:border-amber-500'
                    : 'bg-slate-50 border-slate-200 focus:bg-white focus:border-[#0057B8]'
              }`}
            />
            {inputText && (
              <button
                type="button"
                onClick={() => {
                  setInputText('');
                  setShowMentionMenu(false);
                }}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs cursor-pointer"
              >
                ✕
              </button>
            )}
          </div>

          <button
            type="submit"
            disabled={!inputText.trim() || isSending}
            className={`px-3 py-2 text-white rounded-xl text-xs font-bold transition cursor-pointer flex items-center justify-center flex-shrink-0 shadow-primary-sm disabled:opacity-40 ${
              isShidneyMention(inputText)
                ? 'bg-violet-600 hover:bg-violet-700'
                : isTaskCommand
                  ? 'bg-amber-600 hover:bg-amber-700'
                  : 'bg-[#0057B8] hover:bg-[#004EA6]'
            }`}
            title="Send"
          >
            {isSending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
          </button>
        </div>
      </form>
    </div>
  );
}
