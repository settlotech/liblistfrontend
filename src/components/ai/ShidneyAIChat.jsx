import React, { useState, useRef, useEffect } from 'react';
import { 
  Sparkles, 
  RotateCcw, 
  Volume2, 
  VolumeX, 
  Copy, 
  Check, 
  Send, 
  Loader2, 
  ArrowUpRight, 
  ExternalLink, 
  Layers, 
  Sliders,
  CheckCircle2,
  Clock,
  User,
  ListTodo,
  AlertCircle,
  AtSign,
  Tag,
  CheckSquare
} from 'lucide-react';
import { askShidneyAI } from '../../services/shidneyAiService';
import { apiService } from '../../services/apiService';
import { taskApi } from '../../services/api/taskApi';

const DEFAULT_BANK_MEMBERS = [
  { id: 'u_cba_marcus', name: 'Marcus Vance', role: 'Bank Administrator', department: 'Executive Governance', avatar: 'MV', color: 'bg-indigo-600' },
  { id: 'u_cba_sarah', name: 'Sarah Jenkins', role: 'Senior Credit Risk Officer', department: 'Retail Lending', avatar: 'SJ', color: 'bg-emerald-600' },
  { id: 'u_cba_david', name: 'David Miller', role: 'Credit Underwriter', department: 'Credit Cards', avatar: 'DM', color: 'bg-blue-600' },
  { id: 'u_cba_settlo_lead', name: 'Settlo Admin', role: 'APRA Compliance Lead', department: 'Risk & Compliance', avatar: 'SA', color: 'bg-purple-600' },
  { id: 'u_cba_alex', name: 'Alex Morgan', role: 'Operations Squad Lead', department: 'Commercial Banking', avatar: 'AM', color: 'bg-amber-600' }
];

export default function ShidneyAIChat({
  currentUser,
  selectedBank,
  activePolicy,
  selectedProduct,
  policies = {},
  onSelectPolicy,
  onSelectProduct,
  onSwitchToRequestMode,
  onQuickToggleUserRole,
  onOpenEditModal,
  onOpenExportModal,
}) {
  const userName = currentUser?.name?.split(' ')[0] || 'David';

  const [messages, setMessages] = useState([]);
  const [inputPrompt, setInputPrompt] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [copiedId, setCopiedId] = useState(null);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [speakingMsgId, setSpeakingMsgId] = useState(null);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  // Bank Users for @ Mention Autocomplete
  const [bankUsers, setBankUsers] = useState(DEFAULT_BANK_MEMBERS);
  const [mentionQuery, setMentionQuery] = useState(null);
  const [showMentionMenu, setShowMentionMenu] = useState(false);
  const [isTaskMode, setIsTaskMode] = useState(false);

  useEffect(() => {
    // Load real registered bank users from task API
    taskApi.getAssignableUsers()
      .then(users => {
        if (Array.isArray(users) && users.length > 0) {
          const formatted = users.map(u => ({
            id: u.id,
            name: u.name || `${u.first_name || ''} ${u.last_name || ''}`.trim() || u.email,
            role: u.role || u.role_type || 'Staff User',
            department: u.department || 'Retail Banking',
            avatar: (u.name || u.first_name || 'U').slice(0, 2).toUpperCase(),
            color: 'bg-blue-600'
          }));
          setBankUsers(prev => {
            const map = new Map();
            formatted.forEach(u => map.set(u.id, u));
            prev.forEach(u => { if (!map.has(u.id)) map.set(u.id, u); });
            return Array.from(map.values());
          });
        }
      })
      .catch(() => {
        apiService.getUsers()
          .then(users => {
            if (Array.isArray(users) && users.length > 0) {
              const formatted = users.map(u => ({
                id: u.id,
                name: u.name || `${u.first_name || ''} ${u.last_name || ''}`.trim() || u.email,
                role: u.role || u.roleType || 'Staff User',
                department: u.department || 'Retail Banking',
                avatar: (u.name || u.first_name || 'U').slice(0, 2).toUpperCase(),
                color: 'bg-blue-600'
              }));
              setBankUsers(prev => {
                const map = new Map();
                formatted.forEach(u => map.set(u.id, u));
                prev.forEach(u => { if (!map.has(u.id)) map.set(u.id, u); });
                return Array.from(map.values());
              });
            }
          })
          .catch(err => console.warn('Could not load bank users for mentions:', err));
      });
  }, []);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  // Handle typing to detect @mention
  const handleInputChange = (e) => {
    const val = e.target.value;
    setInputPrompt(val);

    const cursorPos = e.target.selectionStart;
    const textBeforeCursor = val.slice(0, cursorPos);
    const lastAtIndex = textBeforeCursor.lastIndexOf('@');

    if (lastAtIndex !== -1) {
      const query = textBeforeCursor.slice(lastAtIndex + 1);
      // Only match if query doesn't have spaces or is short
      if (!query.includes('\n') && query.length < 25) {
        setMentionQuery(query.toLowerCase());
        setShowMentionMenu(true);
        return;
      }
    }
    setShowMentionMenu(false);
    setMentionQuery(null);
  };

  // Insert selected user from @mention dropdown
  const handleSelectMention = (user) => {
    if (!inputRef.current) return;
    const cursorPos = inputRef.current.selectionStart;
    const textBeforeCursor = inputPrompt.slice(0, cursorPos);
    const textAfterCursor = inputPrompt.slice(cursorPos);
    const lastAtIndex = textBeforeCursor.lastIndexOf('@');

    const prefix = textBeforeCursor.slice(0, lastAtIndex);
    const newText = `${prefix}@${user.name} ${textAfterCursor}`;
    setInputPrompt(newText);
    setShowMentionMenu(false);
    setMentionQuery(null);
    setIsTaskMode(true); // Automatically enable task mode when a user is mentioned

    setTimeout(() => {
      if (inputRef.current) {
        inputRef.current.focus();
        const newPos = prefix.length + user.name.length + 2;
        inputRef.current.setSelectionRange(newPos, newPos);
      }
    }, 50);
  };

  // Filter mention options
  const filteredMentionUsers = bankUsers.filter(u => {
    if (!mentionQuery) return true;
    return (
      u.name.toLowerCase().includes(mentionQuery) ||
      u.role.toLowerCase().includes(mentionQuery) ||
      u.department.toLowerCase().includes(mentionQuery)
    );
  });

  // Check if text contains any @mentions (support full name or first name)
  const getMentionedUser = (inputText) => {
    if (!inputText) return null;
    const sorted = [...bankUsers].sort((a, b) => (b.name?.length || 0) - (a.name?.length || 0));
    for (const u of sorted) {
      if (!u.name) continue;
      const escaped = u.name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const regex = new RegExp(`@${escaped}(?:\\b|\\s|$|[.,!?])`, 'i');
      if (regex.test(inputText)) return u;
    }
    const genericMatch = inputText.match(/@([a-zA-Z0-9_.-]+)/);
    if (genericMatch) {
      const q = genericMatch[1].toLowerCase();
      return bankUsers.find(u => 
        u.name.toLowerCase().startsWith(q) ||
        u.name.toLowerCase().split(' ')[0].toLowerCase() === q ||
        u.email?.toLowerCase().startsWith(q) ||
        u.id?.toLowerCase() === q
      ) || null;
    }
    return null;
  };

  const detectedMention = getMentionedUser(inputPrompt);

  // Handle Action Click
  const handleActionClick = (actionUrl) => {
    if (!actionUrl) return;

    if (actionUrl.startsWith('action:policy:')) {
      let policyId = actionUrl.replace('action:policy:', '').trim();
      if (policyId === 'aps-220-credit-risk') policyId = 'personal-loans-assessment-sop';
      if (policyId === 'oauth-sso') policyId = 'remote-access-security-policy';
      if (policyId === 'cdr-data-privacy') policyId = 'cdr-privacy-policy';
      if (policyId === 'aml-sanctions-screening') policyId = 'aml-ctf-screening-policy';
      if (policyId === 'credit-cards' || policyId === 'credit-card') policyId = 'credit-card-limits-policy';

      if (onSelectPolicy) onSelectPolicy(policyId);
      
      const targetPolicy = Array.isArray(policies) 
        ? policies.find(p => p.id === policyId) 
        : policies?.[policyId];
      if (targetPolicy?.applicableProducts?.[0] && onSelectProduct) {
        onSelectProduct(targetPolicy.applicableProducts[0]);
      }
    } else if (actionUrl.startsWith('action:product:')) {
      const productId = actionUrl.replace('action:product:', '').trim();
      if (onSelectProduct) onSelectProduct(productId);
      if (productId.includes('card')) {
        if (onSelectPolicy) onSelectPolicy('credit-card-limits-policy');
      } else if (productId.includes('loan')) {
        if (onSelectPolicy) onSelectPolicy('personal-loans-assessment-sop');
      }
    } else if (actionUrl === 'action:modal:edit-spec') {
      if (onOpenEditModal) onOpenEditModal();
    } else if (actionUrl === 'action:modal:export-cert') {
      if (onOpenExportModal) onOpenExportModal();
    } else if (actionUrl === 'action:feed:request-change') {
      if (onSwitchToRequestMode) onSwitchToRequestMode();
    } else if (actionUrl === 'action:role:toggle') {
      if (onQuickToggleUserRole) onQuickToggleUserRole();
    } else if (actionUrl.startsWith('http://') || actionUrl.startsWith('https://')) {
      window.open(actionUrl, '_blank', 'noopener,noreferrer');
    }
  };

  // Speech read-aloud
  const handleToggleSpeech = (msgId, text) => {
    if (!('speechSynthesis' in window)) return;

    if (isSpeaking && speakingMsgId === msgId) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      setSpeakingMsgId(null);
      return;
    }

    window.speechSynthesis.cancel();
    const cleanText = text
      .replace(/###|\*\*|\*|`|\[.*?\]\(.*?\)/g, '')
      .replace(/#+/g, '')
      .trim();

    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.rate = 1.05;
    utterance.pitch = 1.0;
    utterance.onend = () => {
      setIsSpeaking(false);
      setSpeakingMsgId(null);
    };
    utterance.onerror = () => {
      setIsSpeaking(false);
      setSpeakingMsgId(null);
    };

    window.speechSynthesis.speak(utterance);
    setIsSpeaking(true);
    setSpeakingMsgId(msgId);
  };

  const handleCopyText = (msgId, text) => {
    navigator.clipboard.writeText(text);
    setCopiedId(msgId);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleStartNewConvo = () => {
    if (window.speechSynthesis) window.speechSynthesis.cancel();
    setIsSpeaking(false);
    setMessages([]);
  };

  // Quick Action on Task in Chat (Acknowledge / Complete)
  const handleUpdateChatTaskStatus = async (msgId, newStatus) => {
    setMessages(prev => prev.map(m => {
      if (m.id === msgId && m.task) {
        return {
          ...m,
          task: {
            ...m.task,
            status: newStatus
          }
        };
      }
      return m;
    }));

    // Find the message
    const targetMsg = messages.find(m => m.id === msgId);
    if (targetMsg?.task?.id) {
      try {
        await apiService.updateTask(targetMsg.task.id, { status: newStatus });
        window.dispatchEvent(new CustomEvent('liblist:task_updated', { detail: { id: targetMsg.task.id, status: newStatus } }));
      } catch (err) {
        console.warn('Task status update warning:', err);
      }
    }
  };

  // Submit User Message / Dispatch Group Chat Task
  const handleSendMessage = async (textToSend) => {
    const text = (textToSend || inputPrompt).trim();
    if (!text || isLoading) return;

    // Check if task mode is active or @user is mentioned
    const activeMention = getMentionedUser(text);
    const isTaskAssignment = isTaskMode || Boolean(activeMention);
    const targetUser = activeMention || (isTaskMode ? bankUsers.find(u => u.name !== currentUser?.name) : null);
    const assignedUser = targetUser ? targetUser.name : 'Sarah Jenkins';
    const targetUserId = targetUser?.id || null;

    if (isTaskAssignment) {
      const cleanTitleText = text.replace(/@([a-zA-Z0-9_\s.-]+?)(?=\s|$|[.,!?])/g, '').trim() || 'Review Policy & Modular Clause Specifications';
      const cleanTaskTitle = `[Task] ${cleanTitleText.length > 60 ? cleanTitleText.slice(0, 60) + '...' : cleanTitleText}`;
      const originPolicyId = activePolicy?.id || 'credit-card-limits-policy';
      const originPolicyTitle = activePolicy?.title || 'Operational Policy';
      const originSection = activePolicy?.version ? `Policy v${activePolicy.version}` : 'Active Policy';

      let createdTaskObj = null;

      try {
        const primaryRes = await taskApi.createTask({
          title: cleanTaskTitle,
          description: text,
          category: 'general',
          assigned_to: targetUserId || assignedUser,
          library_id: originPolicyId,
          section_id: originSection,
          linked_policy_id: originPolicyId,
          policy_title: originPolicyTitle
        });
        if (primaryRes?.data?.id || primaryRes?.id) {
          createdTaskObj = primaryRes.data || primaryRes;
        }
      } catch (primaryErr) {
        console.warn('taskApi.createTask note:', primaryErr);
      }

      // Broadcast task creation across application workspaces
      window.dispatchEvent(new CustomEvent('liblist:task_created', {
        detail: {
          ...(createdTaskObj || {}),
          id: createdTaskObj?.id || `TASK-${Date.now().toString().slice(-5)}`,
          title: cleanTaskTitle,
          description: text,
          assigned_to: assignedUser,
          assigned_to_name: assignedUser,
          assigned_by: currentUser?.name || 'Marcus Vance',
          created_by_name: currentUser?.name || 'Marcus Vance',
          linked_policy_id: originPolicyId,
          library_id: originPolicyId,
          policy_id: originPolicyId,
          section_id: originSection,
          policy_title: originPolicyTitle,
          status: 'pending',
          created_at: new Date().toISOString()
        }
      }));

      const taskMessage = {
        id: `task-msg-${Date.now()}`,
        sender: 'user',
        senderName: currentUser?.name || 'Staff User',
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        text: text,
        isTask: true,
        task: createdTaskObj || {
          id: `TASK-${Date.now().toString().slice(-5)}`,
          title: cleanTaskTitle,
          assigned_to: assignedUser,
          assigned_to_name: assignedUser,
          assigned_by: currentUser?.name || 'Marcus Vance',
          status: 'pending',
          priority: 'high'
        }
      };

      const aiConfirmMessage = {
        id: `ai-${Date.now()}`,
        sender: 'assistant',
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        text: `**Task Created & Dispatched to @${assignedUser}!**\n\n- **Title**: ${cleanTaskTitle}\n- **Assignee**: @${assignedUser}\n- **Linked Document**: ${originPolicyTitle}\n- **Status**: \`PENDING\` • **Priority**: \`HIGH\`\n\nThis task is now live in the **Requests** tab and synced with the team's Task Workspace.`
      };

      setMessages(prev => [...prev, taskMessage, aiConfirmMessage]);
      setInputPrompt('');
      setIsTaskMode(false);
      setShowMentionMenu(false);
      return;
    }

    // Regular AI Chat Message
    const lower = text.toLowerCase();
    let detectedPolicyId = null;
    let detectedProduct = null;

    if (lower.includes('credit card') || lower.includes('credit-card') || lower.includes('card product') || (lower.includes('card') && !lower.includes('standard'))) {
      detectedPolicyId = 'credit-card-limits-policy';
      detectedProduct = 'credit-cards';
    } else if (lower.includes('personal loan') || (lower.includes('loan') && !lower.includes('credit card')) || lower.includes('overdraft')) {
      detectedPolicyId = 'personal-loans-assessment-sop';
      detectedProduct = 'personal-loans';
    } else if (lower.includes('onboard') || lower.includes('identity verification') || lower.includes('dvs')) {
      detectedPolicyId = 'customer-onboarding-sop';
    } else if (lower.includes('commercial') || lower.includes('kyc') || lower.includes('ubo') || lower.includes('business account')) {
      detectedPolicyId = 'commercial-kyc-sop';
    } else if (lower.includes('remote access') || lower.includes('security') || lower.includes('infosec') || lower.includes('cps 234') || lower.includes('mfa')) {
      detectedPolicyId = 'remote-access-security-policy';
    }

    if (detectedPolicyId && onSelectPolicy) onSelectPolicy(detectedPolicyId);
    if (detectedProduct && onSelectProduct) onSelectProduct(detectedProduct);

    const userMsg = {
      id: `u-${Date.now()}`,
      sender: 'user',
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      text: text,
    };

    setMessages(prev => [...prev, userMsg]);
    setInputPrompt('');
    setIsLoading(true);

    try {
      const response = await askShidneyAI({
        prompt: text,
        conversationHistory: messages,
        context: {
          currentUser,
          selectedBank,
          activePolicy,
          selectedProduct,
          policies,
        },
      });

      const aiMsg = {
        id: `ai-${Date.now()}`,
        sender: 'assistant',
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        text: response.text,
      };

      setMessages(prev => [...prev, aiMsg]);
    } catch (err) {
      console.error('Error fetching Shidney response:', err);
      setMessages(prev => [
        ...prev,
        {
          id: `ai-err-${Date.now()}`,
          sender: 'assistant',
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          text: 'I encountered an issue connecting to the banking knowledge engine. You can verify policies or assign tasks directly to team members using @username.',
        }
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  // Render markdown text formatting
  const renderFormattedText = (rawText) => {
    if (!rawText) return null;
    const lines = rawText.split('\n');

    return lines.map((line, idx) => {
      if (line.startsWith('### ')) {
        return (
          <h4 key={idx} className="font-bold text-slate-900 text-xs mt-2 mb-1 flex items-center gap-1.5 border-b border-slate-100 pb-0.5">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-600"></span>
            <span>{parseInlineMarkdown(line.replace('### ', ''))}</span>
          </h4>
        );
      }

      if (line.startsWith('## ')) {
        return (
          <h3 key={idx} className="font-bold text-slate-900 text-xs mt-2.5 mb-1 text-[#0057B8]">
            {parseInlineMarkdown(line.replace('## ', ''))}
          </h3>
        );
      }

      if (line.trim().startsWith('- ') || line.trim().startsWith('* ')) {
        const bulletText = line.trim().substring(2);
        return (
          <div key={idx} className="flex items-start gap-1.5 pl-1 my-0.5 text-slate-700 text-[11.5px] leading-relaxed">
            <span className="text-blue-600 font-bold">•</span>
            <span>{parseInlineMarkdown(bulletText)}</span>
          </div>
        );
      }

      if (/^\d+\.\s/.test(line.trim())) {
        const num = line.trim().match(/^\d+\./)[0];
        const rest = line.trim().replace(/^\d+\.\s*/, '');
        return (
          <div key={idx} className="flex items-start gap-1.5 pl-1 my-0.5 text-slate-700 text-[11.5px] leading-relaxed">
            <span className="font-bold text-blue-800 text-[11px] min-w-[16px]">{num}</span>
            <span>{parseInlineMarkdown(rest)}</span>
          </div>
        );
      }

      if (!line.trim()) return <div key={idx} className="h-1" />;

      return (
        <p key={idx} className="text-slate-700 text-[11.5px] leading-relaxed my-0.5">
          {parseInlineMarkdown(line)}
        </p>
      );
    });
  };

  // Parse inline markdown
  const parseInlineMarkdown = (str) => {
    const parts = [];
    const regex = /(\[.*?\]\(.*?\)|\*\*.*?\*\*|`.*?`|@\w+(\s+\w+)?)/g;
    let lastIdx = 0;
    let match;

    while ((match = regex.exec(str)) !== null) {
      if (match.index > lastIdx) {
        parts.push(str.substring(lastIdx, match.index));
      }
      const token = match[0];
      
      if (token.startsWith('[') && token.includes('](')) {
        const closeBracketIdx = token.indexOf('](');
        const linkText = token.substring(1, closeBracketIdx);
        const linkUrl = token.substring(closeBracketIdx + 2, token.length - 1);

        parts.push(
          <button
            key={match.index}
            type="button"
            onClick={() => handleActionClick(linkUrl)}
            className="inline-flex items-center gap-1 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 px-2 py-0.5 rounded-md font-bold text-[11px] transition cursor-pointer mx-0.5 shadow-2xs group"
          >
            <Sparkles className="w-3 h-3 text-blue-600 group-hover:scale-110 transition" />
            <span>{linkText}</span>
            <ArrowUpRight className="w-3 h-3 text-blue-500 group-hover:translate-x-0.5 transition" />
          </button>
        );
      } else if (token.startsWith('**') && token.endsWith('**')) {
        parts.push(
          <strong key={match.index} className="font-bold text-slate-900">
            {token.substring(2, token.length - 2)}
          </strong>
        );
      } else if (token.startsWith('`') && token.endsWith('`')) {
        parts.push(
          <code key={match.index} className="bg-slate-100 text-blue-900 px-1 py-0.2 rounded font-mono text-[10.5px] border border-slate-200">
            {token.substring(1, token.length - 1)}
          </code>
        );
      } else if (token.startsWith('@')) {
        parts.push(
          <span key={match.index} className="inline-flex items-center gap-0.5 bg-blue-100 text-blue-900 font-bold px-1.5 py-0.2 rounded text-[11px] border border-blue-200">
            {token}
          </span>
        );
      }
      lastIdx = regex.lastIndex;
    }

    if (lastIdx < str.length) {
      parts.push(str.substring(lastIdx));
    }

    return parts.length > 0 ? parts : str;
  };

  return (
    <div className="flex flex-col h-full bg-slate-50/40 relative">
      
      {/* Messages Scroll Area */}
      <div className="flex-1 overflow-y-auto custom-scrollbar p-3 space-y-3">
        {messages.length === 0 && (
          <div className="h-full flex flex-col items-center justify-center p-6 text-center text-slate-400 select-none">
            <div className="w-10 h-10 rounded-full bg-blue-50 border border-blue-200 flex items-center justify-center mb-2.5 shadow-2xs">
              <Sparkles className="w-5 h-5 text-blue-600" />
            </div>
            <p className="font-bold text-slate-700 text-xs">Group Chat & Copilot</p>
            <p className="text-[11px] text-slate-400 mt-1 max-w-[220px] leading-relaxed">
              Ask policy questions or type <span className="font-bold text-blue-600">@username</span> to assign tasks to bank squad members.
            </p>
          </div>
        )}

        {messages.map((msg) => {
          const isUser = msg.sender === 'user';

          // Group Chat Task Card Message
          if (msg.isTask && msg.task) {
            const task = msg.task;
            const isCompleted = task.status === 'completed';
            const isInProgress = task.status === 'in_progress';

            return (
              <div key={msg.id} className="p-3 rounded-xl bg-gradient-to-r from-blue-50/90 to-indigo-50/90 border border-blue-200/90 shadow-2xs space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <ListTodo className="w-4 h-4 text-blue-600" />
                    <span className="font-bold text-blue-950 text-xs">Group Task Assignment</span>
                  </div>
                  <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full border ${
                    isCompleted 
                      ? 'bg-emerald-100 text-emerald-800 border-emerald-300' 
                      : isInProgress 
                        ? 'bg-amber-100 text-amber-800 border-amber-300'
                        : 'bg-blue-100 text-blue-800 border-blue-300'
                  }`}>
                    {task.status?.toUpperCase() || 'PENDING'}
                  </span>
                </div>

                <div className="bg-white p-2.5 rounded-lg border border-blue-100 shadow-2xs space-y-1">
                  <p className="font-bold text-slate-900 text-xs">{task.title}</p>
                  <p className="text-[11.5px] text-slate-600 whitespace-pre-wrap">{msg.text}</p>
                </div>

                <div className="flex items-center justify-between text-[10.5px] text-slate-500 pt-1 border-t border-blue-200/50">
                  <div className="flex items-center gap-1 font-semibold text-blue-900">
                    <User className="w-3 h-3 text-blue-600" />
                    <span>Assigned to @{task.assigned_to}</span>
                  </div>
                  
                  {/* Interactive Status Buttons */}
                  <div className="flex items-center gap-1.5">
                    {!isCompleted && (
                      <>
                        {!isInProgress && (
                          <button
                            type="button"
                            onClick={() => handleUpdateChatTaskStatus(msg.id, 'in_progress')}
                            className="px-2 py-0.5 bg-white hover:bg-amber-50 text-amber-800 border border-amber-300 rounded text-[10.5px] font-bold transition cursor-pointer shadow-2xs"
                          >
                            Acknowledge
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => handleUpdateChatTaskStatus(msg.id, 'completed')}
                          className="px-2 py-0.5 bg-[#0057B8] hover:bg-[#004EA6] text-white rounded text-[10.5px] font-bold transition cursor-pointer shadow-2xs flex items-center gap-1"
                        >
                          <Check className="w-3 h-3" />
                          <span>Complete</span>
                        </button>
                      </>
                    )}
                    {isCompleted && (
                      <span className="text-emerald-700 font-bold flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" />
                        <span>Resolved</span>
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          }

          if (isUser) {
            return (
              <div key={msg.id} className="flex items-start justify-end gap-2 pl-6">
                <div className="bg-slate-900 text-white rounded-2xl rounded-tr-xs px-3 py-2 text-xs shadow-2xs max-w-[90%] space-y-1">
                  <div className="text-[11.5px] leading-relaxed">{msg.text}</div>
                  <div className="text-[9.5px] text-slate-400 text-right">{msg.time}</div>
                </div>
                <div className="w-6 h-6 rounded-full bg-blue-600 text-white font-bold text-[10px] flex items-center justify-center flex-shrink-0 shadow-2xs">
                  {currentUser?.avatar || 'DM'}
                </div>
              </div>
            );
          }

          // Shidney Assistant Message
          return (
            <div key={msg.id} className="flex items-start gap-2 pr-2">
              <div className="w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center flex-shrink-0 shadow-2xs mt-0.5">
                <Sparkles className="w-3.5 h-3.5 text-white" />
              </div>

              <div className="flex-1 bg-white border border-slate-200/90 rounded-2xl rounded-tl-xs p-3 shadow-2xs space-y-1.5 text-xs">
                <div className="flex items-center justify-between border-b border-slate-100 pb-1 text-[10.5px]">
                  <span className="font-bold text-slate-900 flex items-center gap-1">
                    <span>Shidney</span>
                    <span className="text-[9px] font-normal text-slate-400">• {msg.time}</span>
                  </span>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleToggleSpeech(msg.id, msg.text)}
                      title={isSpeaking && speakingMsgId === msg.id ? "Stop voice" : "Read aloud"}
                      className="p-0.5 rounded text-slate-400 hover:text-blue-700 hover:bg-slate-100 transition cursor-pointer"
                    >
                      {isSpeaking && speakingMsgId === msg.id ? (
                        <VolumeX className="w-3.5 h-3.5 text-rose-600" />
                      ) : (
                        <Volume2 className="w-3.5 h-3.5" />
                      )}
                    </button>
                    <button
                      onClick={() => handleCopyText(msg.id, msg.text)}
                      title="Copy response"
                      className="p-0.5 rounded text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition cursor-pointer"
                    >
                      {copiedId === msg.id ? (
                        <Check className="w-3.5 h-3.5 text-emerald-600" />
                      ) : (
                        <Copy className="w-3.5 h-3.5" />
                      )}
                    </button>
                  </div>
                </div>

                <div className="space-y-1">
                  {renderFormattedText(msg.text)}
                </div>
              </div>
            </div>
          );
        })}

        {isLoading && (
          <div className="flex items-center gap-2 pl-1 animate-in fade-in duration-200">
            <div className="w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center flex-shrink-0 shadow-2xs">
              <Sparkles className="w-3.5 h-3.5 animate-spin" />
            </div>
            <div className="bg-white border border-blue-200 rounded-2xl rounded-tl-xs px-3 py-2 shadow-2xs flex items-center gap-2 text-[11px] text-blue-900 font-medium">
              <Loader2 className="w-3.5 h-3.5 text-blue-600 animate-spin" />
              <span>Processing query...</span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Mention Autocomplete Popup Dropdown */}
      {showMentionMenu && (
        <div className="absolute bottom-14 left-3 right-3 bg-white border border-slate-200 rounded-xl shadow-xl z-50 overflow-hidden max-h-48 overflow-y-auto custom-scrollbar animate-in slide-in-from-bottom-2 duration-150">
          <div className="p-2 bg-slate-50 border-b border-slate-100 flex items-center justify-between text-[11px] text-slate-500 font-semibold">
            <span>Assign task to team member</span>
            <span>{filteredMentionUsers.length} found</span>
          </div>
          {filteredMentionUsers.length === 0 ? (
            <div className="p-3 text-center text-slate-400 text-xs">
              No matching bank members
            </div>
          ) : (
            filteredMentionUsers.map(u => (
              <button
                key={u.id}
                type="button"
                onClick={() => handleSelectMention(u)}
                className="w-full px-3 py-2 text-left hover:bg-blue-50 transition flex items-center justify-between border-b border-slate-50 last:border-0 cursor-pointer"
              >
                <div className="flex items-center gap-2">
                  <div className={`w-6 h-6 rounded-full ${u.color || 'bg-blue-600'} text-white font-bold text-[10px] flex items-center justify-center shadow-2xs`}>
                    {u.avatar}
                  </div>
                  <div>
                    <p className="font-bold text-slate-900 text-xs">@{u.name}</p>
                    <p className="text-[10.5px] text-slate-500">{u.role} • {u.department}</p>
                  </div>
                </div>
                <span className="text-[10px] font-bold text-blue-600 bg-blue-100/60 px-1.5 py-0.5 rounded">
                  Assign Task
                </span>
              </button>
            ))
          )}
        </div>
      )}

      {/* Task Mode Indicator Pill */}
      {isTaskMode && (
        <div className="px-3 py-1 bg-amber-50 border-t border-amber-200 flex items-center justify-between text-xs text-amber-900">
          <div className="flex items-center gap-1.5 font-semibold text-[11.5px]">
            <ListTodo className="w-3.5 h-3.5 text-amber-600" />
            <span>Task Mode: Will dispatch task to {detectedMention ? `@${detectedMention.name}` : 'assigned user'}</span>
          </div>
          <button
            type="button"
            onClick={() => setIsTaskMode(false)}
            className="text-amber-700 hover:text-amber-900 font-bold text-[11px] cursor-pointer"
          >
            Cancel Task
          </button>
        </div>
      )}

      {/* Bottom Input Area */}
      <div className="p-2.5 bg-white border-t border-slate-200">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSendMessage();
          }}
          className="flex items-center gap-1.5"
        >
          <button
            type="button"
            onClick={handleStartNewConvo}
            title="Start new conversation"
            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 border border-slate-200 transition cursor-pointer flex items-center justify-center flex-shrink-0"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>

          {/* Quick @ Task Toggle Button */}
          <button
            type="button"
            onClick={() => {
              if (!inputPrompt.includes('@')) {
                setInputPrompt(prev => prev ? `${prev} @` : '@');
                setShowMentionMenu(true);
                setMentionQuery('');
              }
              setIsTaskMode(!isTaskMode);
              if (inputRef.current) inputRef.current.focus();
            }}
            title="Mention & Assign Task"
            className={`p-2 rounded-xl border transition cursor-pointer flex items-center justify-center flex-shrink-0 text-xs font-bold ${
              isTaskMode 
                ? 'bg-amber-500 text-white border-amber-600 shadow-xs' 
                : 'text-slate-400 hover:text-blue-700 hover:bg-slate-100 border-slate-200'
            }`}
          >
            <AtSign className="w-3.5 h-3.5" />
          </button>

          <div className="relative flex-1">
            <input
              ref={inputRef}
              type="text"
              value={inputPrompt}
              onChange={handleInputChange}
              placeholder={isTaskMode ? "Describe task instructions for @user..." : "Ask Shidney or type @user to assign task..."}
              disabled={isLoading}
              className={`w-full border rounded-xl pl-3 pr-8 py-2 text-xs text-slate-900 placeholder-slate-400 outline-none transition ${
                isTaskMode ? 'bg-amber-50/40 border-amber-300 focus:bg-white focus:border-amber-500' : 'bg-slate-50 border-slate-200 focus:bg-white focus:border-blue-500'
              }`}
            />
            {inputPrompt && (
              <button
                type="button"
                onClick={() => {
                  setInputPrompt('');
                  setShowMentionMenu(false);
                  setIsTaskMode(false);
                }}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs cursor-pointer"
              >
                ✕
              </button>
            )}
          </div>

          <button
            type="submit"
            disabled={!inputPrompt.trim() || isLoading}
            className={`text-white p-2 rounded-xl text-xs font-bold transition cursor-pointer flex items-center justify-center flex-shrink-0 shadow-primary-sm disabled:opacity-40 ${
              isTaskMode ? 'bg-amber-600 hover:bg-amber-700' : 'bg-[#0057B8] hover:bg-[#004EA6]'
            }`}
            title={isTaskMode ? "Dispatch Task to @user" : "Send message"}
          >
            <Send className="w-3.5 h-3.5" />
          </button>
        </form>
      </div>
    </div>
  );
}
