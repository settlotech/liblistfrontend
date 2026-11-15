import { TableCell, TableHeader } from '@tiptap/extension-table';

export const CustomTableCell = TableCell.extend({
  addAttributes() {
    return {
      ...this.parent?.(),
      backgroundColor: {
        default: null,
        parseHTML: (element) =>
          element.getAttribute('data-bg-color') ||
          element.style.backgroundColor ||
          null,
        renderHTML: (attributes) => {
          if (!attributes.backgroundColor) return {};
          return {
            'data-bg-color': attributes.backgroundColor,
          };
        },
      },
      borderColor: {
        default: null,
        parseHTML: (element) =>
          element.getAttribute('data-border-color') ||
          element.style.borderColor ||
          null,
        renderHTML: (attributes) => {
          if (!attributes.borderColor) return {};
          return {
            'data-border-color': attributes.borderColor,
          };
        },
      },
    };
  },

  renderHTML({ HTMLAttributes }) {
    const parentRender = this.parent?.({ HTMLAttributes }) || ['td', HTMLAttributes, 0];
    const tag = parentRender[0] || 'td';
    const attrs = { ...HTMLAttributes };

    const styles = [];
    if (attrs['data-bg-color']) {
      styles.push(`background-color: ${attrs['data-bg-color']}`);
    }
    if (attrs['data-border-color']) {
      styles.push(`border-color: ${attrs['data-border-color']} !important`);
    }
    if (attrs.style) {
      styles.push(attrs.style);
    }
    if (styles.length > 0) {
      attrs.style = styles.join('; ');
    }

    return [tag, attrs, 0];
  },
});

export const CustomTableHeader = TableHeader.extend({
  addAttributes() {
    return {
      ...this.parent?.(),
      backgroundColor: {
        default: null,
        parseHTML: (element) =>
          element.getAttribute('data-bg-color') ||
          element.style.backgroundColor ||
          null,
        renderHTML: (attributes) => {
          if (!attributes.backgroundColor) return {};
          return {
            'data-bg-color': attributes.backgroundColor,
          };
        },
      },
      borderColor: {
        default: null,
        parseHTML: (element) =>
          element.getAttribute('data-border-color') ||
          element.style.borderColor ||
          null,
        renderHTML: (attributes) => {
          if (!attributes.borderColor) return {};
          return {
            'data-border-color': attributes.borderColor,
          };
        },
      },
    };
  },

  renderHTML({ HTMLAttributes }) {
    const parentRender = this.parent?.({ HTMLAttributes }) || ['th', HTMLAttributes, 0];
    const tag = parentRender[0] || 'th';
    const attrs = { ...HTMLAttributes };

    const styles = [];
    if (attrs['data-bg-color']) {
      styles.push(`background-color: ${attrs['data-bg-color']}`);
    }
    if (attrs['data-border-color']) {
      styles.push(`border-color: ${attrs['data-border-color']} !important`);
    }
    if (attrs.style) {
      styles.push(attrs.style);
    }
    if (styles.length > 0) {
      attrs.style = styles.join('; ');
    }

    return [tag, attrs, 0];
  },
});

export default {
  CustomTableCell,
  CustomTableHeader,
};
