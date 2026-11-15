import Image from '@tiptap/extension-image';

export const CustomImage = Image.extend({
  name: 'image',

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
        default: '100%',
        parseHTML: (element) => element.getAttribute('data-width') || element.style.width || '100%',
        renderHTML: (attributes) => {
          return {
            'data-width': attributes.width || '100%',
          };
        },
      },
      alignment: {
        default: 'center',
        parseHTML: (element) => element.getAttribute('data-alignment') || 'center',
        renderHTML: (attributes) => {
          return {
            'data-alignment': attributes.alignment || 'center',
          };
        },
      },
    };
  },

  renderHTML({ HTMLAttributes }) {
    const alignment = HTMLAttributes['data-alignment'] || 'center';
    const width = HTMLAttributes['data-width'] || '100%';

    let marginStyle = 'margin: 16px auto; display: block;';
    if (alignment === 'left') {
      marginStyle = 'margin: 16px auto 16px 0; display: block;';
    } else if (alignment === 'right') {
      marginStyle = 'margin: 16px 0 16px auto; display: block;';
    }

    const style = `${marginStyle} width: ${width}; max-width: 100%; height: auto; border-radius: 6px;`;

    return [
      'img',
      {
        ...HTMLAttributes,
        style: `${HTMLAttributes.style ? HTMLAttributes.style + '; ' : ''}${style}`,
      },
    ];
  },
});

export default CustomImage;
