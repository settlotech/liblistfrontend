import { Node, mergeAttributes } from '@tiptap/core';

export const PageBreak = Node.create({
  name: 'pageBreak',

  group: 'block',

  atom: true,

  selectable: true,

  parseHTML() {
    return [
      {
        tag: 'div[data-type="page-break"]',
      },
      {
        tag: 'div.document-page-break',
      },
      {
        tag: 'hr.page-break',
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    return [
      'div',
      mergeAttributes(HTMLAttributes, {
        'data-type': 'page-break',
        class: 'document-page-break',
      }),
    ];
  },
});

export default PageBreak;
