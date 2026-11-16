import { useState } from 'react';
import {
  MessageSquare,
  Sparkles,
  Send,
  AtSign,
  FileText,
} from 'lucide-react';
import styles from './Home.module.css';

const ChatsShidneyPanel = ({ isOpen }) => {
  const [activeTab, setActiveTab] = useState('Chats');
  const [commentText, setCommentText] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!commentText.trim()) return;
    setCommentText('');
  };

  return (
    <aside className={styles.chatPanel}>
      {/* ── Top Header ── */}
      <div className={styles.chatHeader}>
        <div className={styles.chatHeaderTitle}>
          <MessageSquare size={17} strokeWidth={2.2} color="#0f172a" />
          <span>Chats & Shidney</span>
        </div>

        
      </div>

      {/* ── Body: Empty discussion placeholder ── */}
      <div className={styles.chatBody}>
        <div className={styles.emptyChatPlaceholder}>
          <div className={styles.emptyIconCircle}>
            <MessageSquare size={28} strokeWidth={1.8} color="#0060df" />
          </div>
          <h4 className={styles.emptyTitle}>No comments yet</h4>
          <p className={styles.emptyDesc}>
            Start the discussion by typing a message below. Use{' '}
            <span className={styles.mentionHighlight}>@name</span> to assign an operational
            task to a squad member.
          </p>
        </div>
      </div>

      {/* ── Footer: Comment input ── */}
      <form onSubmit={handleSubmit} className={styles.chatFooter}>
        <div className={styles.commentInputBox}>
          <button
            type="button"
            className={styles.commentActionIcon}
            title="Mention squad member"
          >
            <AtSign size={16} strokeWidth={2.2} />
          </button>

          <button
            type="button"
            className={styles.commentActionIcon}
            title="Attach document / template"
          >
            <FileText size={16} strokeWidth={2.2} />
          </button>

          <input
            type="text"
            className={styles.commentInput}
            placeholder="Comment on Policy Manual..."
            value={commentText}
            onChange={(e) => setCommentText(e.target.value)}
          />

          <button
            type="submit"
            className={styles.sendBtn}
            disabled={!commentText.trim()}
            title="Send"
          >
            <Send size={14} strokeWidth={2.5} />
          </button>
        </div>
      </form>
    </aside>
  );
};

export default ChatsShidneyPanel;
