import Image from '@tiptap/extension-image';
import { ReactNodeViewRenderer } from '@tiptap/react';
import ImageNodeView from '../ImageNodeView';

export const CustomImage = Image.extend({
  name: 'image',
  draggable: true,

  addOptions() {
    return {
      ...this.parent?.(),
      inline: false,
      allowBase64: true,
    };
  },

  addAttributes() {
    return {
      ...this.parent?.(),
      src: {
        default: null,
      },
      alt: {
        default: null,
      },
      title: {
        default: null,
      },
      width: {
        default: '75%',
        parseHTML: (element) =>
          element.getAttribute('data-width') ||
          element.style?.width ||
          element.getAttribute('width') ||
          '75%',
        renderHTML: (attributes) => {
          return {
            'data-width': attributes.width || '75%',
          };
        },
      },
      alignment: {
        default: 'center',
        parseHTML: (element) => {
          const explicit = element.getAttribute('data-alignment');
          if (explicit) return explicit;
          const ml = element.style?.marginLeft;
          const mr = element.style?.marginRight;
          if (ml === 'auto' && (mr === '0px' || mr === '0')) return 'right';
          if ((ml === '0px' || ml === '0') && mr === 'auto') return 'left';
          return 'center';
        },
        renderHTML: (attributes) => {
          return {
            'data-alignment': attributes.alignment || 'center',
          };
        },
      },
      rotation: {
        default: 0,
        parseHTML: (element) => {
          const attr = element.getAttribute('data-rotation');
          if (attr !== null && attr !== '') return Number(attr) || 0;
          const m = (element.style?.transform || '').match(/rotate\(\s*([-+]?\d*\.?\d+)deg\s*\)/i);
          return m ? Number(m[1]) || 0 : 0;
        },
        renderHTML: (attributes) => {
          return {
            'data-rotation': String(Number(attributes.rotation) || 0),
          };
        },
      },
      offsetX: {
        default: 0,
        parseHTML: (element) => {
          const attr = element.getAttribute('data-offset-x');
          if (attr !== null && attr !== '') return Number(attr) || 0;
          const m = (element.style?.transform || '').match(/translate\(\s*([-+]?\d*\.?\d+)px\s*,\s*([-+]?\d*\.?\d+)px\s*\)/i);
          return m ? Number(m[1]) || 0 : 0;
        },
        renderHTML: (attributes) => {
          return {
            'data-offset-x': String(Number(attributes.offsetX) || 0),
          };
        },
      },
      offsetY: {
        default: 0,
        parseHTML: (element) => {
          const attr = element.getAttribute('data-offset-y');
          if (attr !== null && attr !== '') return Number(attr) || 0;
          const m = (element.style?.transform || '').match(/translate\(\s*([-+]?\d*\.?\d+)px\s*,\s*([-+]?\d*\.?\d+)px\s*\)/i);
          return m ? Number(m[2]) || 0 : 0;
        },
        renderHTML: (attributes) => {
          return {
            'data-offset-y': String(Number(attributes.offsetY) || 0),
          };
        },
      },
    };
  },

  addNodeView() {
    return ReactNodeViewRenderer(ImageNodeView);
  },

  renderHTML({ HTMLAttributes }) {
    const alignment = HTMLAttributes['data-alignment'] || 'center';
    const width = HTMLAttributes['data-width'] || '75%';
    const rotation = Number(HTMLAttributes['data-rotation']) || 0;
    const offsetX = Number(HTMLAttributes['data-offset-x']) || 0;
    const offsetY = Number(HTMLAttributes['data-offset-y']) || 0;

    let marginStyle = 'margin: 16px auto; display: block;';
    if (alignment === 'left') {
      marginStyle = 'margin: 16px auto 16px 0; display: block;';
    } else if (alignment === 'right') {
      marginStyle = 'margin: 16px 0 16px auto; display: block;';
    }

    const transforms = [];
    if (offsetX || offsetY) {
      transforms.push(`translate(${offsetX}px, ${offsetY}px)`);
    }
    if (rotation) {
      transforms.push(`rotate(${rotation}deg)`);
    }
    const transformStyle = transforms.length ? ` transform: ${transforms.join(' ')}; transform-origin: center center;` : '';

    const style = `${marginStyle} width: ${width}; max-width: 100%; height: auto; border-radius: 6px;${transformStyle}`;

    return [
      'img',
      {
        ...HTMLAttributes,
        style,
      },
    ];
  },
});

export default CustomImage;
