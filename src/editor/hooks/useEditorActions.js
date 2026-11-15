import { useCallback } from 'react';

/**
 * Custom hook providing structured, reusable commands and actions for Tiptap.
 * @param {import('@tiptap/react').Editor | null} editor
 */
export function useEditorActions(editor) {
  // Text Marks
  const toggleBold = useCallback(() => {
    editor?.chain().focus().toggleBold().run();
  }, [editor]);

  const toggleItalic = useCallback(() => {
    editor?.chain().focus().toggleItalic().run();
  }, [editor]);

  const toggleUnderline = useCallback(() => {
    editor?.chain().focus().toggleUnderline().run();
  }, [editor]);

  const toggleStrike = useCallback(() => {
    editor?.chain().focus().toggleStrike().run();
  }, [editor]);

  const toggleCode = useCallback(() => {
    editor?.chain().focus().toggleCode().run();
  }, [editor]);

  const toggleSubscript = useCallback(() => {
    editor?.chain().focus().toggleSubscript().run();
  }, [editor]);

  const toggleSuperscript = useCallback(() => {
    editor?.chain().focus().toggleSuperscript().run();
  }, [editor]);

  const clearFormatting = useCallback(() => {
    if (!editor) return;
    editor.chain().focus().unsetAllMarks().clearNodes().run();
  }, [editor]);

  // Font family and size
  const setFontFamily = useCallback(
    (fontFamily) => {
      if (!editor) return;
      if (!fontFamily || fontFamily === 'default') {
        editor.chain().focus().unsetFontFamily().run();
      } else {
        editor.chain().focus().setFontFamily(fontFamily).run();
      }
    },
    [editor]
  );

  const setFontSize = useCallback(
    (size) => {
      if (!editor) return;
      if (!size || size === 'default') {
        editor.chain().focus().unsetFontSize().run();
      } else {
        const formattedSize = typeof size === 'number' ? `${size}px` : size;
        editor.chain().focus().setFontSize(formattedSize).run();
      }
    },
    [editor]
  );

  // Colors
  const setTextColor = useCallback(
    (color) => {
      if (!editor) return;
      if (!color) {
        editor.chain().focus().unsetColor().run();
      } else {
        editor.chain().focus().setColor(color).run();
      }
    },
    [editor]
  );

  const setHighlightColor = useCallback(
    (color) => {
      if (!editor) return;
      if (!color) {
        editor.chain().focus().unsetHighlight().run();
      } else {
        editor.chain().focus().setHighlight({ color }).run();
      }
    },
    [editor]
  );

  const unsetHighlight = useCallback(() => {
    editor?.chain().focus().unsetHighlight().run();
  }, [editor]);

  // Headings & Structure
  const setHeading = useCallback(
    (level) => {
      if (!editor) return;
      if (level === 0 || level === 'paragraph') {
        editor.chain().focus().setParagraph().run();
      } else {
        editor.chain().focus().toggleHeading({ level: Number(level) }).run();
      }
    },
    [editor]
  );

  const setParagraph = useCallback(() => {
    editor?.chain().focus().setParagraph().run();
  }, [editor]);

  // Alignment & Spacing
  const setTextAlign = useCallback(
    (alignment) => {
      editor?.chain().focus().setTextAlign(alignment).run();
    },
    [editor]
  );

  const setLineHeight = useCallback(
    (lineHeight) => {
      if (!editor) return;
      if (!lineHeight || lineHeight === 'default') {
        editor.chain().focus().unsetLineHeight().run();
      } else {
        editor.chain().focus().setLineHeight(lineHeight).run();
      }
    },
    [editor]
  );

  // Lists & Indentation
  const toggleBulletList = useCallback(() => {
    editor?.chain().focus().toggleBulletList().run();
  }, [editor]);

  const toggleOrderedList = useCallback(() => {
    editor?.chain().focus().toggleOrderedList().run();
  }, [editor]);

  const indent = useCallback(() => {
    if (!editor) return;
    if (editor.can().sinkListItem('listItem')) {
      editor.chain().focus().sinkListItem('listItem').run();
    }
  }, [editor]);

  const outdent = useCallback(() => {
    if (!editor) return;
    if (editor.can().liftListItem('listItem')) {
      editor.chain().focus().liftListItem('listItem').run();
    }
  }, [editor]);

  const toggleBlockquote = useCallback(() => {
    editor?.chain().focus().toggleBlockquote().run();
  }, [editor]);

  const insertHorizontalRule = useCallback(() => {
    editor?.chain().focus().setHorizontalRule().run();
  }, [editor]);

  const insertPageBreak = useCallback(() => {
    editor?.chain().focus().setPageBreak().run();
  }, [editor]);

  // Table Management
  const insertTable = useCallback(
    ({ rows = 3, cols = 3, withHeaderRow = true } = {}) => {
      editor
        ?.chain()
        .focus()
        .insertTable({ rows, cols, withHeaderRow })
        .run();
    },
    [editor]
  );

  const addRowBefore = useCallback(() => {
    editor?.chain().focus().addRowBefore().run();
  }, [editor]);

  const addRowAfter = useCallback(() => {
    editor?.chain().focus().addRowAfter().run();
  }, [editor]);

  const deleteRow = useCallback(() => {
    editor?.chain().focus().deleteRow().run();
  }, [editor]);

  const addColumnBefore = useCallback(() => {
    editor?.chain().focus().addColumnBefore().run();
  }, [editor]);

  const addColumnAfter = useCallback(() => {
    editor?.chain().focus().addColumnAfter().run();
  }, [editor]);

  const deleteColumn = useCallback(() => {
    editor?.chain().focus().deleteColumn().run();
  }, [editor]);

  const deleteTable = useCallback(() => {
    editor?.chain().focus().deleteTable().run();
  }, [editor]);

  const toggleHeaderRow = useCallback(() => {
    editor?.chain().focus().toggleHeaderRow().run();
  }, [editor]);

  const mergeCells = useCallback(() => {
    editor?.chain().focus().mergeCells().run();
  }, [editor]);

  const splitCell = useCallback(() => {
    editor?.chain().focus().splitCell().run();
  }, [editor]);

  // Image Management
  const insertImage = useCallback(
    ({ src, alt = '', width = '100%', alignment = 'center' } = {}) => {
      if (!src || !editor) return;
      editor
        .chain()
        .focus()
        .setImage({
          src,
          alt,
          'data-width': width,
          'data-alignment': alignment,
        })
        .run();
    },
    [editor]
  );

  // Hyperlinks
  const setLink = useCallback(
    ({ href, target = '_blank' } = {}) => {
      if (!editor) return;
      if (!href) {
        editor.chain().focus().unsetLink().run();
        return;
      }
      editor
        .chain()
        .focus()
        .extendMarkRange('link')
        .setLink({ href, target })
        .run();
    },
    [editor]
  );

  const unsetLink = useCallback(() => {
    editor?.chain().focus().unsetLink().run();
  }, [editor]);

  // History
  const undo = useCallback(() => {
    editor?.chain().focus().undo().run();
  }, [editor]);

  const redo = useCallback(() => {
    editor?.chain().focus().redo().run();
  }, [editor]);

  // Data helpers
  const getDocumentJson = useCallback(() => {
    return editor ? editor.getJSON() : null;
  }, [editor]);

  const getDocumentHtml = useCallback(() => {
    return editor ? editor.getHTML() : '';
  }, [editor]);

  const getDocumentText = useCallback(() => {
    return editor ? editor.getText() : '';
  }, [editor]);

  const setContent = useCallback(
    (content, emitUpdate = false) => {
      editor?.commands.setContent(content, emitUpdate);
    },
    [editor]
  );

  return {
    toggleBold,
    toggleItalic,
    toggleUnderline,
    toggleStrike,
    toggleCode,
    toggleSubscript,
    toggleSuperscript,
    clearFormatting,
    setFontFamily,
    setFontSize,
    setTextColor,
    setHighlightColor,
    unsetHighlight,
    setHeading,
    setParagraph,
    setTextAlign,
    setLineHeight,
    toggleBulletList,
    toggleOrderedList,
    indent,
    outdent,
    toggleBlockquote,
    insertHorizontalRule,
    insertPageBreak,
    insertTable,
    addRowBefore,
    addRowAfter,
    deleteRow,
    addColumnBefore,
    addColumnAfter,
    deleteColumn,
    deleteTable,
    toggleHeaderRow,
    mergeCells,
    splitCell,
    insertImage,
    setLink,
    unsetLink,
    undo,
    redo,
    getDocumentJson,
    getDocumentHtml,
    getDocumentText,
    setContent,
  };
}

export default useEditorActions;
