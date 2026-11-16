const IMAGE_EXTENSION_RE = /\.(png|jpe?g|gif|webp|svg|bmp|avif)(?:$|[?#])/i;

/**
 * Checks whether a DataTransfer likely contains dragged image files, asset payloads, or image markup/URLs.
 * Safe to call inside `dragover` handlers where `getData()` values are browser-restricted.
 */
export function hasDraggedImageData(dataTransfer) {
  if (!dataTransfer) return false;
  const types = Array.from(dataTransfer.types || []);
  if (types.includes('application/x-liblist-image')) return true;
  if (types.includes('Files')) {
    const items = Array.from(dataTransfer.items || []);
    if (items.length === 0) return true;
    return items.some((it) => it.kind === 'file' && (!it.type || it.type.startsWith('image/')));
  }
  if (types.includes('text/html') || types.includes('text/uri-list') || types.includes('text/plain')) {
    return true;
  }
  return false;
}

/**
 * Reads a File object into a base64 DataURL.
 */
export function readFileAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(typeof reader.result === 'string' ? reader.result : '');
    reader.onerror = () => reject(reader.error || new Error('Failed to read dropped image file'));
    reader.readAsDataURL(file);
  });
}

function isSupportedImageFile(file) {
  if (!file) return false;
  if (file.type && file.type.startsWith('image/')) return true;
  return IMAGE_EXTENSION_RE.test(file.name || '');
}

function isSupportedImageUrl(str) {
  if (!str || typeof str !== 'string') return false;
  const trimmed = str.trim();
  if (/^data:image\/[a-z0-9.+-]+;base64,/i.test(trimmed)) return true;
  if (/^blob:/i.test(trimmed)) return true;
  if (/^https?:\/\/\S+/i.test(trimmed)) {
    return IMAGE_EXTENSION_RE.test(trimmed) || trimmed.includes('cloudinary.com');
  }
  return false;
}

/**
 * Attaches standard drag metadata onto draggable image assets inside panels/modals
 * so dropping them onto or near any Word page or clause editor inserts them cleanly.
 */
export function attachImageDragData(dataTransfer, image) {
  if (!dataTransfer || !image) return;
  const src = image.src || image.dataUrl || image.url || '';
  const alt = image.alt || image.name || 'Policy Asset';
  if (!src) return;

  try {
    dataTransfer.effectAllowed = 'copy';
    dataTransfer.setData('application/x-liblist-image', JSON.stringify({ src, alt }));
    dataTransfer.setData('text/html', `<img src="${src.replace(/"/g, '&quot;')}" alt="${alt.replace(/"/g, '&quot;')}" />`);
    dataTransfer.setData('text/uri-list', src);
    dataTransfer.setData('text/plain', src);
  } catch {
    // Ignore restricted drag environments
  }
}

/**
 * Synchronously extracts non-File image payloads (`x-liblist-image`, `text/html`, `text/uri-list`, `text/plain`).
 * Use when you need to decide before returning in ProseMirror `handleDrop` whether to intercept an external drop.
 */
export function extractSyncImagePayloads(dataTransfer) {
  if (!dataTransfer) return [];

  const liblistRaw = dataTransfer.getData('application/x-liblist-image');
  if (liblistRaw) {
    try {
      const parsed = JSON.parse(liblistRaw);
      if (parsed?.src) {
        return [{ src: parsed.src, alt: parsed.alt || 'Policy Asset' }];
      }
    } catch {
      // ignore malformed JSON
    }
  }

  const html = dataTransfer.getData('text/html');
  if (html && /<img\b/i.test(html) && typeof DOMParser !== 'undefined') {
    try {
      const doc = new DOMParser().parseFromString(html, 'text/html');
      const imgs = Array.from(doc.querySelectorAll('img'))
        .map((el) => ({
          src: el.getAttribute('src') || '',
          alt: el.getAttribute('alt') || 'Dropped Image',
        }))
        .filter((item) => Boolean(item.src));
      if (imgs.length > 0) return imgs;
    } catch {
      // ignore HTML parse issues
    }
  }

  const uriList = (dataTransfer.getData('text/uri-list') || '')
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line && !line.startsWith('#'));
  for (const uri of uriList) {
    if (isSupportedImageUrl(uri)) {
      return [{ src: uri, alt: 'Dropped Image' }];
    }
  }

  const plain = (dataTransfer.getData('text/plain') || '').trim();
  if (isSupportedImageUrl(plain)) {
    return [{ src: plain, alt: 'Dropped Image' }];
  }

  return [];
}

/**
 * Resolves all dropped image payloads from `dataTransfer` (files via `onImageUpload` or DataURL, plus HTML/asset drags).
 */
export async function extractDroppedImagePayloads(dataTransfer, onImageUpload = null) {
  if (!dataTransfer) return [];

  const files = Array.from(dataTransfer.files || []).filter(isSupportedImageFile);
  if (files.length > 0) {
    const resolved = [];
    for (const file of files) {
      let src = '';
      if (typeof onImageUpload === 'function') {
        try {
          const uploadedUrl = await onImageUpload(file);
          if (uploadedUrl && typeof uploadedUrl === 'string') {
            src = uploadedUrl;
          }
        } catch {
          // Fall back cleanly to inline DataURL so draft saving works offline too
        }
      }
      if (!src) {
        src = await readFileAsDataUrl(file);
      }
      if (src) {
        resolved.push({ src, alt: file.name || 'Policy Image' });
      }
    }
    if (resolved.length > 0) return resolved;
  }

  return extractSyncImagePayloads(dataTransfer);
}

/**
 * Intercepts clipboard paste containing image files (e.g. screenshots / copied images)
 * and inserts them cleanly into the TipTap editor as persistent DataURL / uploaded nodes.
 */
export function handleEditorImagePaste(editor, event, onImageUpload = null, onAfterInsert = null) {
  const cd = event?.clipboardData;
  if (!cd || !editor || editor.isDestroyed) return false;

  const directFiles = Array.from(cd.files || []).filter(isSupportedImageFile);
  const itemFiles = directFiles.length > 0
    ? directFiles
    : Array.from(cd.items || [])
        .filter((it) => it.kind === 'file' && (!it.type || it.type.startsWith('image/')))
        .map((it) => it.getAsFile())
        .filter(isSupportedImageFile);

  if (itemFiles.length === 0) return false;

  event.preventDefault();
  event.stopPropagation();

  void (async () => {
    const resolved = [];
    for (const file of itemFiles) {
      let src = '';
      if (typeof onImageUpload === 'function') {
        try {
          const uploaded = await onImageUpload(file);
          if (uploaded && typeof uploaded === 'string') src = uploaded;
        } catch {
          // fallback to DataURL
        }
      }
      if (!src) src = await readFileAsDataUrl(file);
      if (src) resolved.push({ src, alt: file.name || 'Pasted Image' });
    }
    if (resolved.length > 0 && !editor.isDestroyed) {
      const nodes = resolved.map((img) => ({
        type: 'image',
        attrs: {
          src: img.src,
          alt: img.alt || 'Pasted Image',
          width: '75%',
          alignment: 'center',
        },
      }));
      editor.chain().focus().insertContent(nodes).run();
      if (typeof onAfterInsert === 'function') {
        onAfterInsert(editor.getHTML());
      }
    }
  })();

  return true;
}

/**
 * Inserts one or more images into a TipTap editor at exact pointer coordinates when dropped inside `.tiptap`,
 * or appends cleanly at the end of the page when dropped anywhere near/around the page.
 */
export function insertImagesIntoEditorAtCoords(editor, images, clientCoords = null) {
  if (!editor || editor.isDestroyed || !Array.isArray(images) || images.length === 0) return false;

  const nodes = images
    .filter((img) => Boolean(img?.src))
    .map((img) => ({
      type: 'image',
      attrs: {
        src: img.src,
        alt: img.alt || 'Policy Image',
        width: img.width || '75%',
        alignment: img.alignment || 'center',
      },
    }));

  if (nodes.length === 0) return false;

  try {
    const dom = editor.view?.dom;
    const cx = clientCoords?.x ?? clientCoords?.left;
    const cy = clientCoords?.y ?? clientCoords?.top;
    if (typeof cx === 'number' && typeof cy === 'number' && dom) {
      const rect = dom.getBoundingClientRect();
      const insideDom =
        cx >= rect.left &&
        cx <= rect.right &&
        cy >= rect.top &&
        cy <= rect.bottom;

      if (insideDom) {
        const coords = editor.view.posAtCoords({ left: cx, top: cy });
        if (coords && typeof coords.pos === 'number') {
          editor.chain().focus().insertContentAt(coords.pos, nodes).run();
          return true;
        }
      }
    }

    editor.chain().focus('end').insertContent(nodes).run();
    return true;
  } catch {
    try {
      editor.chain().focus().insertContent(nodes).run();
      return true;
    } catch {
      return false;
    }
  }
}
