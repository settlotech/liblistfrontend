import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useLocation, useParams, useSearchParams } from 'react-router-dom';
import { AtSign, Bot, FileText, LoaderCircle, MessageSquare, Send, Sparkles, UserRound } from 'lucide-react';
import { taskApi } from '../../services/api/taskApi';
import { policyChatApi } from '../../services/api/policyChatApi';
import { privateChatApi } from '../../services/api/privateChatApi';
import { documentManagementApi } from '../../services/api/documentManagementApi';
import { useAuth } from '../../context/AuthContext';
import MarkdownMessage from '../../components/common/MarkdownMessage';
import styles from './Home.module.css';

const WIDTH_STORAGE_KEY = 'tamil-chats-panel-width';
const DEFAULT_PANEL_WIDTH = 540;
const isShidneyMention = (value) => /@\s*(?:\*\*)?Shidney\b(?:\*\*)?/i.test(value);

const getInitialPanelWidth = () => {
  try {
    const saved = Number(window.localStorage.getItem(WIDTH_STORAGE_KEY));
    return Number.isFinite(saved) && saved >= 320 ? saved : DEFAULT_PANEL_WIDTH;
  } catch {
    return DEFAULT_PANEL_WIDTH;
  }
};

const ChatsShidneyPanel = ({ isOpen }) => {
  const { user } = useAuth();
  const { id: routeDocumentId } = useParams();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const documentId = routeDocumentId || searchParams.get('docId');

  const [panelWidth, setPanelWidth] = useState(getInitialPanelWidth);
  const [isResizing, setIsResizing] = useState(false);
  const [policy, setPolicy] = useState(null);
  const [policyTasks, setPolicyTasks] = useState([]);
  const [assignableUsers, setAssignableUsers] = useState([]);
  const [policyMessages, setPolicyMessages] = useState([]);
  const [privateAiMessages, setPrivateAiMessages] = useState([]);
  const [commentText, setCommentText] = useState('');
  const [mentionQuery, setMentionQuery] = useState(null);
  const [mentionStart, setMentionStart] = useState(-1);
  const [selectedAssignee, setSelectedAssignee] = useState(null);
  const [isPolicyLoading, setIsPolicyLoading] = useState(false);
  const [isMessagesLoading, setIsMessagesLoading] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState('');
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const requestIdRef = useRef(0);

  const loadMessages = useCallback(async () => {
    const requestId = ++requestIdRef.current;
    setIsMessagesLoading(true);
    setError('');
    const sharedPromise = policy?.id
      ? policyChatApi.getMessages(policy.id)
      : Promise.resolve({ messages: [], tasks: [] });
    const [sharedResult, privateResult] = await Promise.allSettled([
      sharedPromise,
      privateChatApi.getAiMessages(),
    ]);
    if (requestId !== requestIdRef.current) return;

    if (sharedResult.status === 'fulfilled') {
      setPolicyMessages(Array.isArray(sharedResult.value?.messages) ? sharedResult.value.messages : []);
      setPolicyTasks(Array.isArray(sharedResult.value?.tasks) ? sharedResult.value.tasks : []);
    } else {
      setPolicyMessages([]);
      setPolicyTasks([]);
      setError(sharedResult.reason?.message || 'Could not load policy chat.');
    }
    if (privateResult.status === 'fulfilled') {
      setPrivateAiMessages(Array.isArray(privateResult.value?.messages) ? privateResult.value.messages : []);
    } else {
      setPrivateAiMessages([]);
      if (sharedResult.status === 'fulfilled') setError(privateResult.reason?.message || 'Could not load your private Shidney messages.');
    }
    setIsMessagesLoading(false);
  }, [policy?.id]);

  useEffect(() => {
    let cancelled = false;
    requestIdRef.current += 1;
    setPolicy(null);
    setPolicyTasks([]);
    setPolicyMessages([]);
    setPrivateAiMessages([]);
    setError('');
    if (!documentId || location.pathname.includes('/documents/create')) {
      setIsPolicyLoading(false);
      return undefined;
    }

    setIsPolicyLoading(true);
    documentManagementApi.getDocumentMetadata(documentId)
      .then((response) => { if (!cancelled) setPolicy(response?.data || null); })
      .catch((err) => { if (!cancelled) setError(err.message || 'Could not load the selected policy.'); })
      .finally(() => { if (!cancelled) setIsPolicyLoading(false); });
    return () => { cancelled = true; };
  }, [documentId, location.pathname]);

  useEffect(() => {
    let cancelled = false;
    taskApi.getAssignableUsers()
      .then((rows) => {
        if (!cancelled && Array.isArray(rows)) {
          setAssignableUsers(rows.map((item) => ({
            ...item,
            displayName: item.name || `${item.first_name || ''} ${item.last_name || ''}`.trim() || item.email || 'Team member',
          })).filter((item) => item.id && item.displayName));
        }
      })
      .catch(() => { if (!cancelled) setAssignableUsers([]); });
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    if (!isOpen) return undefined;
    loadMessages();
    const interval = window.setInterval(loadMessages, 5000);
    return () => window.clearInterval(interval);
  }, [isOpen, loadMessages]);

  const messages = useMemo(() => [
    ...policyMessages.map((message) => ({ ...message, privateOnly: false })),
    ...privateAiMessages.map((message) => ({ ...message, privateOnly: true })),
  ].sort((left, right) => new Date(left.created_at || 0) - new Date(right.created_at || 0)), [policyMessages, privateAiMessages]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, [messages.length]);

  useEffect(() => {
    if (!isResizing) return undefined;
    const handlePointerMove = (event) => {
      const maxWidth = window.innerWidth <= 768
        ? Math.max(320, window.innerWidth - 24)
        : Math.min(900, Math.max(420, window.innerWidth - 280));
      setPanelWidth(Math.max(Math.min(360, maxWidth), Math.min(maxWidth, window.innerWidth - event.clientX)));
    };
    const handlePointerUp = () => {
      setIsResizing(false);
      try { window.localStorage.setItem(WIDTH_STORAGE_KEY, String(panelWidth)); } catch { /* Storage is optional. */ }
    };
    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', handlePointerUp, { once: true });
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';
    return () => {
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };
  }, [isResizing, panelWidth]);

  const mentionMatches = useMemo(() => {
    if (mentionQuery === null) return [];
    const query = mentionQuery.trim().toLowerCase();
    const matchingUsers = assignableUsers.filter((item) => (
      !query || item.displayName.toLowerCase().includes(query) || item.email?.toLowerCase().includes(query)
    )).slice(0, 6);
    const shidneyMatches = !query || 'shidney'.includes(query) || query.includes('shidney');
    return [
      ...(shidneyMatches ? [{ id: 'private-shidney', displayName: 'Shidney', isAi: true }] : []),
      ...matchingUsers,
    ];
  }, [assignableUsers, mentionQuery]);

  const handleInputChange = (event) => {
    const value = event.target.value;
    const cursor = event.target.selectionStart ?? value.length;
    setCommentText(value);
    setError('');
    const beforeCursor = value.slice(0, cursor);
    const atIndex = beforeCursor.lastIndexOf('@');
    const query = atIndex >= 0 ? beforeCursor.slice(atIndex + 1) : '';
    if (atIndex >= 0 && !/[\s@]/.test(query) && query.length < 40) {
      setMentionQuery(query);
      setMentionStart(atIndex);
    } else {
      setMentionQuery(null);
      setMentionStart(-1);
    }
    if (selectedAssignee && !value.includes(`@${selectedAssignee.displayName}`)) setSelectedAssignee(null);
  };

  const chooseMention = (mention) => {
    const input = inputRef.current;
    const cursor = input?.selectionStart ?? commentText.length;
    const start = mentionStart >= 0 ? mentionStart : commentText.lastIndexOf('@', cursor);
    const before = commentText.slice(0, Math.max(0, start));
    const after = commentText.slice(cursor);
    const displayName = mention.isAi ? 'Shidney' : mention.displayName;
    const insertion = `@${displayName} `;
    const nextText = `${before}${insertion}${after}`;
    setCommentText(nextText);
    setSelectedAssignee(mention.isAi ? null : mention);
    setMentionQuery(null);
    setMentionStart(-1);
    requestAnimationFrame(() => {
      inputRef.current?.focus();
      const nextCursor = before.length + insertion.length;
      inputRef.current?.setSelectionRange(nextCursor, nextCursor);
    });
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    const content = commentText.trim();
    if (!content || isSending) return;
    setIsSending(true);
    setError('');
    let createdTask = null;
    try {
      if (isShidneyMention(content)) {
        const result = await privateChatApi.sendAiMessage(content, policy?.id || null);
        setPrivateAiMessages((current) => [...current, result.userMessage, result.assistantMessage]);
      } else if (selectedAssignee && content.includes(`@${selectedAssignee.displayName}`)) {
        if (!policy?.id) throw new Error('Open a policy before assigning a task from chat.');
        const taskDescription = content;
        const plainTitle = content.replace(`@${selectedAssignee.displayName}`, '').trim() || 'Task from policy chat';
        const taskTitle = plainTitle.length > 240 ? `${plainTitle.slice(0, 237)}...` : plainTitle;
        const response = await taskApi.createTask({
          title: taskTitle,
          description: taskDescription,
          category: 'general',
          assigned_to: selectedAssignee.id,
          library_id: policy.id,
        });
        const task = response?.data || response;
        if (!task?.id) throw new Error('The task was created, but its ID was not returned.');
        createdTask = task;
        window.dispatchEvent(new CustomEvent('liblist:task_created', { detail: task }));
        const saved = await policyChatApi.saveMessage(policy.id, { content: taskDescription, task_id: task.id });
        setPolicyMessages((current) => [...current, {
          ...saved,
          sender_name: user?.name || 'You',
          task_title: task.title || taskTitle,
          task_seq: task.task_seq,
          assigned_name: selectedAssignee.displayName,
        }]);
        setPolicyTasks((current) => [{
          ...task,
          title: task.title || taskTitle,
          task_seq: task.task_seq,
          assigned_name: selectedAssignee.displayName,
        }, ...current.filter((item) => String(item.id) !== String(task.id))]);
      } else {
        if (!policy?.id) throw new Error('Open a policy to start its shared chat.');
        const saved = await policyChatApi.saveMessage(policy.id, { content });
        setPolicyMessages((current) => [...current, { ...saved, sender_name: user?.name || 'You' }]);
      }
      setCommentText('');
      setSelectedAssignee(null);
      setMentionQuery(null);
    } catch (err) {
      if (createdTask) {
        setError(`Task ${createdTask.task_seq || `#${createdTask.id}`} was created, but its chat message could not be saved.`);
        loadMessages();
      } else {
        setError(err.message || 'Message could not be sent.');
      }
    } finally {
      setIsSending(false);
    }
  };

  const resizeByKeyboard = (event) => {
    if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return;
    event.preventDefault();
    const next = Math.max(360, Math.min(900, panelWidth + (event.key === 'ArrowRight' ? 24 : -24)));
    setPanelWidth(next);
    try { window.localStorage.setItem(WIDTH_STORAGE_KEY, String(next)); } catch { /* Storage is optional. */ }
  };

  if (!isOpen) return null;

  return (
    <aside className={styles.chatPanel} style={{ '--chat-panel-width': `${panelWidth}px` }}>
      <div
        className={styles.chatResizeHandle}
        role="separator"
        aria-label="Resize chats panel"
        aria-orientation="vertical"
        aria-valuenow={Math.round(panelWidth)}
        aria-valuemin={360}
        aria-valuemax={900}
        tabIndex={0}
        title="Drag to resize chats"
        onPointerDown={(event) => { event.preventDefault(); setIsResizing(true); }}
        onKeyDown={resizeByKeyboard}
      />

      <div className={styles.chatHeader}>
        <div className={styles.chatHeaderTitle}><MessageSquare size={17} color="#0f172a" /><span>Chats &amp; Shidney</span></div>
      </div>

      {/* <div className={styles.chatContextGrid}>
        <div className={styles.chatContextCard}>
          <span className={styles.chatContextLabel}><FileText size={13} /> Selected policy</span>
          <strong title={policy?.document_name || ''}>{isPolicyLoading ? 'Loading…' : policy?.document_name || 'No policy selected'}</strong>
        </div>
        <details className={`${styles.chatContextCard} ${styles.policyTaskList}`}>
          <summary><span className={styles.chatContextLabel}>Policy tasks</span><span className={styles.policyTaskCount}>{policyTasks.length}</span></summary>
          {policyTasks.length === 0 ? <p className={styles.policyTaskEmpty}>No linked tasks yet.</p> : (
            <div className={styles.policyTaskItems}>
              {policyTasks.map((task) => <div key={task.id} className={styles.policyTaskItem}><strong>{task.title}</strong><span>{task.task_seq ? `${task.task_seq} · ` : ''}{task.status || 'Responded'} · @{task.assigned_name || 'self'}</span></div>)}
            </div>
          )}
        </details>
      </div> */}

      <div className={styles.chatMessages}>
          {isMessagesLoading && messages.length === 0 && <div className={styles.chatLoading}><LoaderCircle size={18} /> Loading chat…</div>}
          {!isMessagesLoading && messages.length === 0 && <div className={styles.chatWelcome}><span className={styles.chatWelcomeIcon}><Sparkles size={25} /></span><strong>{policy?.id ? 'Chat about this policy' : 'Ask Shidney privately'}</strong><span>{policy?.id ? <>Use <b>@Shidney</b> for a private AI reply, select <b>@person</b> to assign a task, or send a normal shared message.</> : <>Mention <b>@Shidney</b> for a private AI reply. Open a policy to use shared chat and assign tasks.</>}</span></div>}
          {messages.map((message) => {
            const isAssistant = message.message_type === 'assistant';
            const isMine = !isAssistant && String(message.sender_id) === String(user?.id);
            const isTask = message.message_type === 'task';
            return (
              <article key={`${message.privateOnly ? 'private' : 'shared'}-${message.id}`} className={`${styles.chatMessage} ${isMine ? styles.chatMessageUser : styles.chatMessageAssistant}`}>
                <div className={styles.chatMessageSender}>
                  {isAssistant ? <Bot size={13} /> : <UserRound size={13} />}
                  <span>{isAssistant ? 'Shidney' : (message.sender_name || (isMine ? user?.name : 'Team member'))}</span>
                  {message.privateOnly && <span className={styles.privateMessageBadge}>Private</span>}
                  {message.created_at && <time>{new Date(message.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</time>}
                </div>
                <MarkdownMessage content={message.content} />
                {isTask && <div className={styles.chatTaskCard}><strong>{message.task_title || 'Assigned task'}</strong><span>{message.task_seq ? `${message.task_seq} · ` : ''}Assigned to @{message.assigned_name || 'team member'}</span></div>}
              </article>
            );
          })}
          {isSending && isShidneyMention(commentText.trim()) && <div className={styles.chatThinking}><LoaderCircle size={15} /> Shidney is replying privately…</div>}
          <div ref={messagesEndRef} />
      </div>

      {error && <div className={styles.chatError} role="alert">{error}</div>}
      <form onSubmit={handleSubmit} className={styles.chatFooter}>
        <div className={styles.chatComposerWrap}>
          {mentionQuery !== null && mentionMatches.length > 0 && (
            <div className={styles.mentionMenu} role="listbox" aria-label="Mention Shidney or assign a teammate">
              <div className={styles.mentionMenuTitle}>Private AI or assign a task</div>
              {mentionMatches.map((mention) => (
                <button key={mention.id} type="button" className={styles.mentionOption} onMouseDown={(event) => event.preventDefault()} onClick={() => chooseMention(mention)}>
                  <span className={styles.mentionAvatar}>{mention.isAi ? <Sparkles size={13} /> : mention.displayName.slice(0, 1).toUpperCase()}</span>
                  <span><strong>{mention.isAi ? '@Shidney · Private AI' : mention.displayName}</strong><small>{mention.isAi ? 'Only visible in your private chat' : mention.email || 'Creates a policy task'}</small></span>
                </button>
              ))}
            </div>
          )}
          {selectedAssignee && <div className={styles.selectedAssignee}><AtSign size={12} /> Task assigned to {selectedAssignee.displayName}</div>}
          <div className={styles.commentInputBox}>
            <button type="button" className={styles.commentActionIcon} title="Mention Shidney or assign a team member" onClick={() => {
              const pos = inputRef.current?.selectionStart ?? commentText.length;
              setCommentText(`${commentText.slice(0, pos)}@${commentText.slice(pos)}`);
              setMentionQuery('');
              setMentionStart(pos);
              requestAnimationFrame(() => inputRef.current?.focus());
            }}><AtSign size={16} /></button>
            <input ref={inputRef} type="text" className={styles.commentInput} placeholder={selectedAssignee ? 'Describe the task…' : 'Message, or mention @Shidney…'} value={commentText} onChange={handleInputChange} onKeyDown={(event) => { if (event.key === 'Escape') setMentionQuery(null); }} disabled={isSending} aria-label="Write a chat message" />
            <button type="submit" className={styles.sendBtn} disabled={!commentText.trim() || isSending} title="Send"><Send size={14} /></button>
          </div>
        </div>
      </form>
    </aside>
  );
};

export default ChatsShidneyPanel;
