import React, { useState, useEffect, useRef } from 'react';
import { 
  Heart, 
  MessageSquare, 
  Send, 
  User, 
  Clock, 
  Check, 
  CheckCircle2, 
  ListTodo, 
  AtSign, 
  X, 
  CornerDownRight, 
  ShieldCheck, 
  Sparkles,
  Layers,
  FileEdit
} from 'lucide-react';
import { apiService } from '../../services/apiService';
import { taskApi } from '../../services/api/taskApi';

const BANK_SQUAD = [
  { id: 'u_cba_marcus', name: 'Marcus Vance', role: 'Bank Administrator', avatar: 'MV', color: 'bg-indigo-600' },
  { id: 'u_cba_sarah', name: 'Sarah Jenkins', role: 'Senior Credit Risk Officer', avatar: 'SJ', color: 'bg-emerald-600' },
  { id: 'u_cba_david', name: 'David Miller', role: 'Credit Underwriter', avatar: 'DM', color: 'bg-blue-600' },
  { id: 'u_cba_settlo_lead', name: 'Settlo Admin', role: 'APRA Compliance Lead', avatar: 'SA', color: 'bg-purple-600' },
  { id: 'u_cba_alex', name: 'Alex Morgan', role: 'Operations Squad Lead', avatar: 'AM', color: 'bg-amber-600' }
];

export default function DraftCommentsFeed({
  openedDocument = null,
  currentUser,
  onOpenDraft
}) {
  const currentUserName = currentUser?.name || 'Marcus Vance';
  const docKey = openedDocument?.id || null;

  const [comments, setComments] = useState([]);
  const [inputText, setInputText] = useState('');
  const [replyingTo, setReplyingTo] = useState(null);
  const [isTaskCommand, setIsTaskCommand] = useState(false);
  const [showMentionMenu, setShowMentionMenu] = useState(false);
  const [mentionQuery, setMentionQuery] = useState('');
  const [squadUsers, setSquadUsers] = useState(BANK_SQUAD);
  const commentsEndRef = useRef(null);
  const inputRef = useRef(null);

  // Load real registered bank users
  useEffect(() => {
    apiService.getUsers()
      .then(users => {
        if (Array.isArray(users) && users.length > 0) {
          const formatted = users.map(u => ({
            id: u.id,
            name: u.name || `${u.first_name || ''} ${u.last_name || ''}`.trim() || u.email,
            role: u.role || u.roleType || 'Staff Officer',
            avatar: (u.name || u.first_name || 'U').slice(0, 2).toUpperCase(),
            color: 'bg-blue-600'
          }));
          setSquadUsers(prev => {
            const combined = [...formatted];
            prev.forEach(p => {
              if (!combined.some(c => c.name.toLowerCase() === p.name.toLowerCase())) {
                combined.push(p);
              }
            });
            return combined;
          });
        }
      })
      .catch(err => console.warn('Squad users notice:', err));
  }, []);

  // Load comments for currently opened document from PostgreSQL DB
  useEffect(() => {
    if (!docKey) {
      setComments([]);
      return;
    }

    let isMounted = true;
    const storageKey = `liblist_doc_comments_${docKey}`;

    // 1. Fetch persistent comments from PostgreSQL backend DB
    apiService.getPolicyComments(docKey)
      .then(remoteComments => {
        if (!isMounted) return;
        if (Array.isArray(remoteComments) && remoteComments.length > 0) {
          setComments(remoteComments);
          try { localStorage.setItem(storageKey, JSON.stringify(remoteComments)); } catch (_) {}
          return;
        }

        // Check local cache if DB had no comments yet
        const stored = localStorage.getItem(storageKey);
        if (stored) {
          try {
            const parsed = JSON.parse(stored);
            if (Array.isArray(parsed) && parsed.length > 0) {
              setComments(parsed);
              return;
            }
          } catch (_) {}
        }

        // Initialize default seed comments
        const defaultComments = [
          {
            id: `c-seed-1`,
            author: openedDocument?.created_by || 'Marcus Vance',
            authorRole: 'Bank Administrator',
            avatar: (openedDocument?.created_by || 'Marcus').slice(0, 2).toUpperCase(),
            avatarColor: 'bg-indigo-600',
            text: `${openedDocument?.status === 'draft' ? 'Draft revision' : 'Master policy'} ${openedDocument?.version || 'v1.0'} opened for review. Please check the statutory thresholds, SLA turnaround, and delegated officer caps.`,
            time: '1h ago',
            likes: 3,
            likedByMe: false,
            isTask: false,
            replies: []
          },
          {
            id: `c-seed-2`,
            author: 'Sarah Jenkins',
            authorRole: 'Senior Credit Risk Officer',
            avatar: 'SJ',
            avatarColor: 'bg-emerald-600',
            text: '@David Miller verify Clause 2 underwriting limits and ensure 4-hour SLA aligns with APRA CPS 234.',
            time: '25m ago',
            likes: 2,
            likedByMe: true,
            isTask: true,
            taskAssignee: 'David Miller',
            taskStatus: 'in_progress',
            replies: [
              {
                id: `rep-seed-1`,
                author: 'David Miller',
                authorRole: 'Credit Underwriter',
                avatar: 'DM',
                avatarColor: 'bg-blue-600',
                text: '@Sarah Jenkins Underwriting limits and 4-hour buffer verified.',
                time: '15m ago',
                likes: 1
              }
            ]
          }
        ];
        setComments(defaultComments);
        try { localStorage.setItem(storageKey, JSON.stringify(defaultComments)); } catch (_) {}
      })
      .catch(err => {
        if (!isMounted) return;
        console.warn('Could not load comments from DB:', err);
        const stored = localStorage.getItem(storageKey);
        if (stored) {
          try { setComments(JSON.parse(stored)); } catch (_) {}
        }
      });

    return () => { isMounted = false; };
  }, [docKey, openedDocument]);

  // Persist comments when updated
  const updateCommentsState = (newComments) => {
    setComments(newComments);
    if (docKey) {
      try {
        localStorage.setItem(`liblist_doc_comments_${docKey}`, JSON.stringify(newComments));
      } catch (_) {}
    }
  };

  const scrollToBottom = () => {
    commentsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [comments]);

  // Handle typing and @mention
  const handleInputChange = (e) => {
    const val = e.target.value;
    setInputText(val);

    const lastAt = val.lastIndexOf('@');
    if (lastAt !== -1 && lastAt >= val.length - 15) {
      const query = val.slice(lastAt + 1).toLowerCase();
      if (!query.includes(' ')) {
        setMentionQuery(query);
        setShowMentionMenu(true);
        return;
      }
    }
    setShowMentionMenu(false);
  };

  const handleSelectMention = (user) => {
    const lastAt = inputText.lastIndexOf('@');
    if (lastAt !== -1) {
      const prefix = inputText.slice(0, lastAt);
      setInputText(`${prefix}@${user.name} `);
    } else {
      setInputText(prev => `${prev}@${user.name} `);
    }
    setShowMentionMenu(false);
    inputRef.current?.focus();
  };

  // Toggle Like (Instagram Heart) with DB persistence
  const handleToggleLike = (commentId) => {
    const updated = comments.map(c => {
      if (c.id === commentId) {
        const liked = !c.likedByMe;
        return {
          ...c,
          likedByMe: liked,
          likes: liked ? (c.likes || 0) + 1 : Math.max(0, (c.likes || 0) - 1)
        };
      }
      return c;
    });
    updateCommentsState(updated);
    if (docKey) {
      apiService.toggleCommentLike(docKey, commentId).catch(() => {});
    }
  };

  // Update Task Status with backend sync, DB persistence, and cross-module broadcast
  const handleUpdateTaskStatus = async (commentId, nextStatus) => {
    const comment = comments.find(c => c.id === commentId);
    const updated = comments.map(c => {
      if (c.id === commentId) {
        return { ...c, taskStatus: nextStatus };
      }
      return c;
    });
    updateCommentsState(updated);

    if (docKey) {
      apiService.updateCommentTaskStatus(docKey, commentId, nextStatus).catch(() => {});
    }

    if (comment?.taskId) {
      const statusForBackend = (nextStatus === 'completed' || nextStatus === 'resolved') ? 'completed' : nextStatus;
      try {
        await taskApi.updateTaskStatus(comment.taskId, { status: statusForBackend });
      } catch (_) {
        try {
          await apiService.updateTask(comment.taskId, { status: statusForBackend });
        } catch (err) {
          console.warn('Task status update warning:', err);
        }
      }
      window.dispatchEvent(new CustomEvent('liblist:task_updated', {
        detail: { id: comment.taskId, status: statusForBackend }
      }));
    }
  };

  // Post a new comment or reply with real Task Creation in Task Management and DB persistence
  const handlePostComment = async () => {
    const text = inputText.trim();
    if (!text) return;

    // Support @First Last or @First
    const mentionMatch = text.match(/@([a-zA-Z0-9_\s]+?)(?=\s|$|[.,!?])/);
    const mentionedName = mentionMatch ? mentionMatch[1].trim() : null;
    const mentionedUser = squadUsers.find(u =>
      u.name.toLowerCase() === mentionedName?.toLowerCase() ||
      (mentionedName && u.name.toLowerCase().startsWith(mentionedName.toLowerCase()))
    );

    const isTask = isTaskCommand || Boolean(mentionedUser);
    const originPolicyId = openedDocument?.id || 'credit-card-limits-policy';
    const originPolicyTitle = openedDocument?.title || 'Operational Policy';

    let backendTaskId = null;
    let targetAssigneeName = mentionedUser ? mentionedUser.name : (mentionedName || null);
    let targetAssigneeId = mentionedUser?.id || (mentionedName ? `u_cba_${mentionedName.toLowerCase().replace(/\s+/g, '_')}` : null);

    if (isTask) {
      const cleanTaskTitle = text.replace(/@([a-zA-Z0-9_\s]+?)(?=\s|$|[.,!?])/g, '').trim() || 'Review Policy & Operational Specifications';
      const taskTitle = `[Task] ${cleanTaskTitle.length > 55 ? cleanTaskTitle.slice(0, 55) + '...' : cleanTaskTitle}`;

      try {
        const res = await taskApi.createTask({
          title: taskTitle,
          description: text,
          category: 'general',
          assigned_to: targetAssigneeId || targetAssigneeName,
          library_id: originPolicyId,
          section_id: openedDocument?.version ? `Draft v${openedDocument.version}` : null
        });
        if (res?.success && res.data?.id) {
          backendTaskId = res.data.id;
        }
      } catch (err) {
        console.warn('taskApi.createTask note:', err);
      }

      try {
        const legacyRes = await apiService.createTask({
          id: backendTaskId,
          title: taskTitle,
          description: text,
          assigned_to: targetAssigneeName || 'David Miller',
          assigned_by: `${currentUserName} (${currentUser?.roleType === 'manager' ? 'Bank Administrator' : 'Staff Officer'})`,
          priority: 'high',
          status: 'pending',
          due_date: 'Today, EOD',
          category: 'Draft Review Task',
          linked_policy_id: originPolicyId,
          policy_title: originPolicyTitle
        });
        if (!backendTaskId && legacyRes?.id) {
          backendTaskId = legacyRes.id;
        }
      } catch (legacyErr) {
        console.warn('apiService.createTask note:', legacyErr);
      }

      window.dispatchEvent(new CustomEvent('liblist:task_created', {
        detail: {
          id: backendTaskId,
          title: taskTitle,
          description: text,
          assigned_to: targetAssigneeName,
          assigned_by: currentUserName,
          linked_policy_id: originPolicyId,
          policy_id: originPolicyId,
          library_id: originPolicyId,
          status: 'pending'
        }
      }));
    }

    if (replyingTo) {
      const replyObj = {
        id: `rep-${Date.now()}`,
        author: currentUserName,
        authorRole: currentUser?.roleType === 'manager' ? 'Bank Administrator' : 'Staff Officer',
        avatar: (currentUserName.slice(0, 2) || 'ME').toUpperCase(),
        avatarColor: 'bg-blue-600',
        text: text,
        time: 'Just now',
        likes: 0
      };

      const updated = comments.map(c => {
        if (c.id === replyingTo.id) {
          return {
            ...c,
            replies: [...(c.replies || []), replyObj]
          };
        }
        return c;
      });

      updateCommentsState(updated);
      setReplyingTo(null);

      if (docKey) {
        apiService.postCommentReply(docKey, replyingTo.id, replyObj).catch(() => {});
      }
    } else {
      const newComment = {
        id: `c-${Date.now()}`,
        author: currentUserName,
        authorRole: currentUser?.roleType === 'manager' ? 'Bank Administrator' : 'Staff Officer',
        avatar: (currentUserName.slice(0, 2) || 'ME').toUpperCase(),
        avatarColor: 'bg-blue-600',
        text: text,
        time: 'Just now',
        likes: 0,
        likedByMe: false,
        isTask: isTask,
        taskId: backendTaskId || `TASK-${Date.now().toString().slice(-5)}`,
        taskAssignee: targetAssigneeName,
        taskAssigneeId: targetAssigneeId,
        taskStatus: isTask ? 'pending' : null,
        linkedPolicyId: originPolicyId,
        policyTitle: originPolicyTitle,
        replies: []
      };

      updateCommentsState([...comments, newComment]);

      if (docKey) {
        apiService.postPolicyComment(docKey, {
          text: newComment.text,
          author: newComment.author,
          authorRole: newComment.authorRole,
          avatar: newComment.avatar,
          avatarColor: newComment.avatarColor,
          isTask: newComment.isTask,
          targetAssigneeId: newComment.taskAssigneeId,
          targetAssigneeName: newComment.taskAssignee,
          section_id: openedDocument?.version ? `Draft v${openedDocument.version}` : null
        }).catch(() => {});
      }
    }

    setInputText('');
    setIsTaskCommand(false);
    setShowMentionMenu(false);
  };

  // Render text with clickable / highlighted @mentions
  const renderCommentContent = (str) => {
    const parts = [];
    const regex = /(@\w+(\s+\w+)?)/g;
    let lastIdx = 0;
    let match;

    while ((match = regex.exec(str)) !== null) {
      if (match.index > lastIdx) {
        parts.push(str.substring(lastIdx, match.index));
      }
      parts.push(
        <span key={match.index} className="inline-flex items-center gap-0.5 px-1.5 py-0.2 rounded font-bold text-[#0057B8] bg-blue-50 border border-blue-200 text-[11.5px]">
          {match[0]}
        </span>
      );
      lastIdx = regex.lastIndex;
    }

    if (lastIdx < str.length) {
      parts.push(str.substring(lastIdx));
    }

    return parts.length > 0 ? parts : str;
  };

  // IF NO POLICY OR DRAFT IS CURRENTLY OPENED: DO NOT SHOW COMMENTS
  if (!openedDocument) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-slate-400 space-y-3.5 select-none bg-[#f8fafc]">
        <div className="w-12 h-12 rounded-2xl bg-blue-50 text-[#0057B8] flex items-center justify-center shadow-2xs">
          <MessageSquare className="w-6 h-6" />
        </div>
        <div className="space-y-1 max-w-xs">
          <h4 className="font-bold text-slate-800 text-sm">No Document Opened</h4>
          <p className="text-xs text-slate-500 leading-relaxed">
            Click any draft in Change Management or open a master policy to view its comments & team collaboration.
          </p>
        </div>
      </div>
    );
  }

  const isDraft = openedDocument.status === 'draft' || String(openedDocument.id).includes('draft');

  return (
    <div className="flex flex-col h-full bg-[#f8fafc] relative select-none">
      
      {/* TOP CARD: The Opened Policy or Draft Card */}
      <div className="p-3 bg-white border-b border-slate-200 shadow-2xs space-y-2">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="w-2 h-2 rounded-full bg-blue-600 animate-pulse"></span>
              <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded border ${
                isDraft 
                  ? 'text-amber-800 bg-amber-50 border-amber-300' 
                  : 'text-blue-700 bg-blue-50 border-blue-200'
              }`}>
                {isDraft ? 'Draft Revision' : 'Master Policy'} • {openedDocument.version || 'v1.0'}
              </span>
              <span className="text-[10px] font-mono text-slate-400">
                {new Date().toLocaleDateString()}
              </span>
            </div>
            <h3 className="font-bold text-slate-900 text-xs mt-1 truncate">
              {openedDocument.title || 'Operational Document'}
            </h3>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Authored by <strong className="text-slate-700">{openedDocument.created_by || 'Marcus Vance'}</strong>
            </p>
          </div>

          {/* Direct Open in Full Editor Button if it's a draft */}
          {isDraft && onOpenDraft && (
            <button
              type="button"
              onClick={() => onOpenDraft(openedDocument)}
              className="px-2.5 py-1.5 bg-[#0057B8] hover:bg-[#004EA6] text-white rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1 flex-shrink-0 shadow-primary-sm active:scale-95"
              title="Open this draft in Full Editor with all modular options"
            >
              <FileEdit className="w-3.5 h-3.5" />
              <span>Open in Editor</span>
            </button>
          )}
        </div>

        {/* Shared with team members */}
        <div className="p-2 bg-slate-50 rounded-lg border border-slate-200/80 flex items-center justify-between text-[11px]">
          <div className="flex items-center gap-1.5">
            <span className="font-bold text-slate-700">Access:</span>
            <div className="flex -space-x-1 overflow-hidden">
              {squadUsers.slice(0, 3).map(u => (
                <span 
                  key={u.id} 
                  className={`w-4 h-4 rounded-full ${u.color || 'bg-blue-600'} text-white text-[8px] font-bold flex items-center justify-center border border-white`}
                  title={u.name}
                >
                  {u.avatar}
                </span>
              ))}
            </div>
            <span className="text-slate-500 text-[10.5px]">All squad members have access</span>
          </div>
          <span className="text-[10px] font-bold text-blue-700 bg-blue-100/70 px-1.5 py-0.2 rounded">
            Full Access
          </span>
        </div>
      </div>

      {/* COMMENTS STREAM */}
      <div className="flex-1 overflow-y-auto p-3 space-y-3 custom-scrollbar">
        {comments.map((comment) => {
          const isTask = comment.isTask;
          const isResolved = comment.taskStatus === 'completed';
          const isInProgress = comment.taskStatus === 'in_progress';

          return (
            <div key={comment.id} className="space-y-2">
              
              {/* Primary Comment Card */}
              <div className="p-3 bg-white rounded-xl border border-slate-200/80 hover:border-blue-200 transition shadow-2xs space-y-2">
                
                {/* Header: User avatar, name, role, time */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className={`w-6 h-6 rounded-full ${comment.avatarColor || 'bg-blue-600'} text-white font-bold text-[10px] flex items-center justify-center shadow-2xs`}>
                      {comment.avatar || 'U'}
                    </div>
                    <div>
                      <span className="font-bold text-slate-900 text-xs block leading-tight">
                        {comment.author}
                      </span>
                      <span className="text-[10px] text-slate-400">
                        {comment.authorRole || 'Squad Member'} • {comment.time}
                      </span>
                    </div>
                  </div>

                  {/* Heart / Like button (Instagram style) */}
                  <button
                    type="button"
                    onClick={() => handleToggleLike(comment.id)}
                    className={`p-1 rounded-lg flex items-center gap-1 text-[11px] font-bold transition cursor-pointer ${
                      comment.likedByMe 
                        ? 'text-rose-600 bg-rose-50' 
                        : 'text-slate-400 hover:text-rose-500 hover:bg-slate-50'
                    }`}
                    title="Like comment"
                  >
                    <Heart className={`w-3.5 h-3.5 ${comment.likedByMe ? 'fill-rose-600 text-rose-600' : ''}`} />
                    <span>{comment.likes || 0}</span>
                  </button>
                </div>

                {/* Comment Text */}
                <p className="text-slate-700 text-xs leading-relaxed whitespace-pre-wrap pl-8">
                  {renderCommentContent(comment.text)}
                </p>

                {/* If Comment is a Task Command */}
                {isTask && (
                  <div className="ml-8 p-2 rounded-lg bg-blue-50/70 border border-blue-200/80 text-[11px] space-y-1.5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5 font-bold text-blue-950">
                        <ListTodo className="w-3.5 h-3.5 text-blue-600" />
                        <span>Command Task: @{comment.taskAssignee || 'Squad Member'}</span>
                      </div>
                      <span className={`text-[9.5px] font-mono font-bold px-2 py-0.2 rounded-full border ${
                        isResolved 
                          ? 'bg-emerald-100 text-emerald-800 border-emerald-300' 
                          : isInProgress
                            ? 'bg-amber-100 text-amber-800 border-amber-300'
                            : 'bg-blue-100 text-blue-800 border-blue-300'
                      }`}>
                        {comment.taskStatus?.toUpperCase() || 'PENDING'}
                      </span>
                    </div>

                    {/* Task Actions */}
                    <div className="flex items-center justify-end gap-1.5 pt-1">
                      {!isResolved && (
                        <>
                          {!isInProgress && (
                            <button
                              type="button"
                              onClick={() => handleUpdateTaskStatus(comment.id, 'in_progress')}
                              className="px-2 py-0.5 bg-white hover:bg-amber-50 text-amber-800 border border-amber-300 rounded text-[10px] font-bold transition cursor-pointer"
                            >
                              Acknowledge
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => handleUpdateTaskStatus(comment.id, 'completed')}
                            className="px-2 py-0.5 bg-[#0057B8] hover:bg-[#004EA6] text-white rounded text-[10px] font-bold transition cursor-pointer flex items-center gap-0.5"
                          >
                            <Check className="w-3 h-3" />
                            <span>Mark Resolved</span>
                          </button>
                        </>
                      )}
                      {isResolved && (
                        <span className="text-emerald-700 font-bold text-[10px] flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3" />
                          <span>Task Completed</span>
                        </span>
                      )}
                    </div>
                  </div>
                )}

                {/* Bottom Comment Action Bar (Reply button) */}
                <div className="flex items-center justify-between text-[10.5px] text-slate-400 pt-1 pl-8">
                  <button
                    type="button"
                    onClick={() => {
                      setReplyingTo(comment);
                      setInputText(`@${comment.author} `);
                      if (inputRef.current) inputRef.current.focus();
                    }}
                    className="font-bold text-slate-500 hover:text-[#0057B8] flex items-center gap-1 cursor-pointer"
                  >
                    <CornerDownRight className="w-3 h-3" />
                    <span>Reply</span>
                  </button>
                  <span className="text-[10px] text-slate-400">
                    Visible to all squad members
                  </span>
                </div>
              </div>

              {/* Nested Replies (Threaded) */}
              {(comment.replies || []).length > 0 && (
                <div className="pl-6 space-y-1.5 border-l-2 border-slate-200 ml-4">
                  {comment.replies.map(rep => (
                    <div key={rep.id} className="p-2.5 bg-white/80 rounded-xl border border-slate-200 text-xs space-y-1 shadow-2xs">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5">
                          <div className={`w-5 h-5 rounded-full ${rep.avatarColor || 'bg-blue-600'} text-white font-bold text-[9px] flex items-center justify-center`}>
                            {rep.avatar}
                          </div>
                          <span className="font-bold text-slate-900 text-[11.5px]">{rep.author}</span>
                          <span className="text-[10px] text-slate-400">• {rep.time}</span>
                        </div>
                      </div>
                      <p className="text-slate-700 text-[11px] pl-6 leading-relaxed">
                        {renderCommentContent(rep.text)}
                      </p>
                    </div>
                  ))}
                </div>
              )}

            </div>
          );
        })}
        <div ref={commentsEndRef} />
      </div>

      {/* Mention Dropdown Floating Menu */}
      {showMentionMenu && (
        <div className="absolute bottom-16 left-3 right-3 bg-white border border-slate-200 rounded-xl shadow-xl z-50 overflow-hidden max-h-48 overflow-y-auto custom-scrollbar">
          <div className="p-2 bg-slate-50 border-b border-slate-100 flex items-center justify-between text-[11px] text-slate-500 font-semibold">
            <span>Mention bank member</span>
            <span>{squadUsers.length} members</span>
          </div>
          {squadUsers.filter(u => u.name.toLowerCase().includes(mentionQuery)).map(u => (
            <button
              key={u.id}
              type="button"
              onClick={() => handleSelectMention(u)}
              className="w-full px-3 py-2 text-left hover:bg-blue-50 transition flex items-center justify-between border-b border-slate-50 last:border-0 cursor-pointer"
            >
              <div className="flex items-center gap-2">
                <div className={`w-6 h-6 rounded-full ${u.color || 'bg-blue-600'} text-white font-bold text-[10px] flex items-center justify-center`}>
                  {u.avatar}
                </div>
                <div>
                  <p className="font-bold text-slate-900 text-xs">@{u.name}</p>
                  <p className="text-[10.5px] text-slate-500">{u.role}</p>
                </div>
              </div>
              <span className="text-[10px] font-bold text-blue-600 bg-blue-100/70 px-1.5 py-0.5 rounded">
                Mention
              </span>
            </button>
          ))}
        </div>
      )}

      {/* Replying Banner */}
      {replyingTo && (
        <div className="px-3 py-1 bg-blue-50 border-t border-blue-200 flex items-center justify-between text-xs text-blue-900">
          <span>Replying to <strong>@{replyingTo.author}</strong></span>
          <button
            type="button"
            onClick={() => {
              setReplyingTo(null);
              setInputText('');
            }}
            className="text-slate-400 hover:text-slate-700 font-bold"
          >
            ✕
          </button>
        </div>
      )}

      {/* Bottom Comment Input Bar */}
      <div className="p-2.5 bg-white border-t border-slate-200">
        <div className="flex items-center gap-1.5">
          
          {/* Quick Mention Button */}
          <button
            type="button"
            onClick={() => {
              setInputText(prev => prev ? `${prev} @` : '@');
              setShowMentionMenu(true);
              setMentionQuery('');
              if (inputRef.current) inputRef.current.focus();
            }}
            title="Mention squad member"
            className="p-2 rounded-xl text-slate-400 hover:text-[#0057B8] hover:bg-blue-50 border border-slate-200 transition cursor-pointer flex items-center justify-center flex-shrink-0"
          >
            <AtSign className="w-3.5 h-3.5" />
          </button>

          {/* Quick Task Command Toggle */}
          <button
            type="button"
            onClick={() => setIsTaskCommand(!isTaskCommand)}
            title="Toggle Task Command"
            className={`p-2 rounded-xl border transition cursor-pointer flex items-center justify-center flex-shrink-0 ${
              isTaskCommand 
                ? 'bg-amber-500 text-white border-amber-600 shadow-xs' 
                : 'text-slate-400 hover:text-amber-600 hover:bg-amber-50 border-slate-200'
            }`}
          >
            <ListTodo className="w-3.5 h-3.5" />
          </button>

          {/* Comment Input */}
          <div className="relative flex-1">
            <input
              ref={inputRef}
              type="text"
              value={inputText}
              onChange={handleInputChange}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handlePostComment();
                }
              }}
              placeholder={
                isTaskCommand 
                  ? "Command task: @user instruction..." 
                  : `Comment on ${openedDocument.title || 'document'}...`
              }
              className={`w-full border rounded-xl pl-3 pr-8 py-2 text-xs text-slate-900 placeholder-slate-400 outline-none transition ${
                isTaskCommand 
                  ? 'bg-amber-50/40 border-amber-300 focus:bg-white focus:border-amber-500' 
                  : 'bg-slate-50 border-slate-200 focus:bg-white focus:border-blue-500'
              }`}
            />
            {inputText && (
              <button
                type="button"
                onClick={() => {
                  setInputText('');
                  setShowMentionMenu(false);
                }}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs cursor-pointer"
              >
                ✕
              </button>
            )}
          </div>

          {/* Post Button */}
          <button
            type="button"
            onClick={handlePostComment}
            disabled={!inputText.trim()}
            className="px-3.5 py-2 bg-[#0057B8] hover:bg-[#004EA6] disabled:opacity-40 text-white rounded-xl text-xs font-bold transition cursor-pointer flex items-center justify-center flex-shrink-0 shadow-primary-sm"
          >
            <Send className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

    </div>
  );
}
