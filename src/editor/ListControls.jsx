import React from 'react';
import {
  List,
  ListOrdered,
  Indent,
  Outdent,
  Quote,
  Minus,
} from 'lucide-react';

export const ListControls = ({ editor }) => {
  if (!editor) return null;

  const isBulletList = editor.isActive('bulletList');
  const isOrderedList = editor.isActive('orderedList');
  const isBlockquote = editor.isActive('blockquote');

  const canSink = editor.can().sinkListItem('listItem');
  const canLift = editor.can().liftListItem('listItem');

  const handleIndent = () => {
    if (canSink) {
      editor.chain().focus().sinkListItem('listItem').run();
    }
  };

  const handleOutdent = () => {
    if (canLift) {
      editor.chain().focus().liftListItem('listItem').run();
    }
  };

  return (
    <div className="list-controls-wrapper">
      <button
        type="button"
        className={`toolbar-btn icon-only ${isBulletList ? 'active' : ''}`}
        onClick={() => editor.chain().focus().toggleBulletList().run()}
        title="Bulleted List (Ctrl+Shift+8)"
      >
        <List size={16} />
      </button>

      <button
        type="button"
        className={`toolbar-btn icon-only ${isOrderedList ? 'active' : ''}`}
        onClick={() => editor.chain().focus().toggleOrderedList().run()}
        title="Numbered List (Ctrl+Shift+7)"
      >
        <ListOrdered size={16} />
      </button>

      <button
        type="button"
        className="toolbar-btn icon-only"
        onClick={handleOutdent}
        disabled={!canLift}
        title="Decrease Indent (Shift+Tab)"
      >
        <Outdent size={16} />
      </button>

      <button
        type="button"
        className="toolbar-btn icon-only"
        onClick={handleIndent}
        disabled={!canSink}
        title="Increase Indent (Tab)"
      >
        <Indent size={16} />
      </button>

      <button
        type="button"
        className={`toolbar-btn icon-only ${isBlockquote ? 'active' : ''}`}
        onClick={() => editor.chain().focus().toggleBlockquote().run()}
        title="Blockquote (Ctrl+Shift+B)"
      >
        <Quote size={15} />
      </button>

      <button
        type="button"
        className="toolbar-btn icon-only"
        onClick={() => editor.chain().focus().setHorizontalRule().run()}
        title="Insert Horizontal Divider"
      >
        <Minus size={16} />
      </button>
    </div>
  );
};

export default ListControls;
