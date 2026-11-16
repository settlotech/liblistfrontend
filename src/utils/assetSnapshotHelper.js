/**
 * Utilities for detecting annotatable visual assets (SVG charts/graphs, canvases, images)
 * and capturing self-contained snapshots + semantic document anchors on right-click.
 */

const SVG_STYLE_PROPS = [
  'fill',
  'stroke',
  'strokeWidth',
  'strokeDasharray',
  'strokeLinecap',
  'strokeLinejoin',
  'fontSize',
  'fontFamily',
  'fontWeight',
  'textAnchor',
  'opacity',
  'color',
  'display',
  'visibility',
];

function inlineSvgComputedStyles(origEl, cloneEl) {
  if (!origEl || !cloneEl || origEl.nodeType !== 1) return;
  try {
    const computed = window.getComputedStyle(origEl);
    for (const prop of SVG_STYLE_PROPS) {
      const val = computed[prop];
      if (val && val !== 'none' && val !== 'normal') {
        cloneEl.style[prop] = val;
      } else if (prop === 'fill' && origEl.getAttribute('fill') === 'none') {
        cloneEl.style.fill = 'none';
      } else if (prop === 'stroke' && val) {
        cloneEl.style.stroke = val;
      }
    }
  } catch {
    // Ignore computed style failure on synthetic nodes
  }

  const origChildren = origEl.children || [];
  const cloneChildren = cloneEl.children || [];
  for (let i = 0; i < origChildren.length && i < cloneChildren.length; i++) {
    inlineSvgComputedStyles(origChildren[i], cloneChildren[i]);
  }
}

export function captureSvgElementSnapshot(svgElement) {
  if (!svgElement) return '';
  try {
    const rect = svgElement.getBoundingClientRect();
    const viewBox = svgElement.getAttribute('viewBox');
    const clone = svgElement.cloneNode(true);
    clone.setAttribute('xmlns', 'http://www.w3.org/2000/svg');

    if (!viewBox && rect.width > 0 && rect.height > 0) {
      clone.setAttribute('viewBox', `0 0 ${Math.round(rect.width)} ${Math.round(rect.height)}`);
    }

    const vbParts = (clone.getAttribute('viewBox') || '').trim().split(/[\s,]+/).map(Number);
    const width = Math.max(240, Math.round(rect.width || vbParts[2] || 600));
    const height = Math.max(100, Math.round(rect.height || vbParts[3] || 180));
    clone.setAttribute('width', String(width));
    clone.setAttribute('height', String(height));

    inlineSvgComputedStyles(svgElement, clone);

    // Ensure crisp white chart background in thumbnail preview
    const bgRect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
    bgRect.setAttribute('x', String(vbParts[0] || 0));
    bgRect.setAttribute('y', String(vbParts[1] || 0));
    bgRect.setAttribute('width', String(vbParts[2] || width));
    bgRect.setAttribute('height', String(vbParts[3] || height));
    bgRect.setAttribute('fill', '#ffffff');
    clone.insertBefore(bgRect, clone.firstChild);

    const xml = new XMLSerializer().serializeToString(clone);
    return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(xml)}`;
  } catch {
    return '';
  }
}

export function detectRightClickTarget(event, rootContainer) {
  const target = event?.target;
  if (!(target instanceof Element)) {
    return {
      isAsset: false,
      assetType: null,
      snapshotDataUrl: '',
      imageSrc: '',
      anchorId: '',
      sectionAnchorId: '',
      sectionTitle: '',
      supplementaryTab: '',
      lineText: '',
      selectedText: '',
      richBlockIndex: null,
      relX: null,
      relY: null,
    };
  }

  let selectedText = '';
  try {
    const sel = window.getSelection();
    if (sel && sel.toString().trim()) {
      selectedText = sel.toString().trim().slice(0, 600);
    }
  } catch {
    selectedText = '';
  }

  const anchorEl = target.closest('[data-note-anchor]');
  const anchorId = anchorEl?.getAttribute('data-note-anchor') || '';

  const sectionTitleEl = target.closest('[data-section-title]');
  const sectionTitle =
    sectionTitleEl?.getAttribute('data-section-title') ||
    anchorEl?.closest('[data-section-title]')?.getAttribute('data-section-title') ||
    '';
  const sectionAnchorId =
    sectionTitleEl?.getAttribute('data-note-anchor') ||
    anchorId;

  const tabEl = target.closest('[data-supplementary-tab]');
  const supplementaryTab = tabEl?.getAttribute('data-supplementary-tab') || '';

  // Detect visual asset (graph container, large non-icon SVG, canvas, or image)
  const assetContainer = target.closest('[data-annotatable-asset]');
  const directImg = target.closest('img');
  const directCanvas = target.closest('canvas');
  const directSvg = target.closest('svg');

  let assetType = null;
  let assetEl = null;
  let snapshotDataUrl = '';
  let imageSrc = '';

  if (directImg && (directImg.closest('.prose-policy-view') || directImg.closest('[data-annotatable-asset]') || directImg.getBoundingClientRect().width >= 48)) {
    assetType = 'image';
    assetEl = directImg;
    imageSrc = directImg.currentSrc || directImg.getAttribute('src') || '';
    snapshotDataUrl = imageSrc;
  } else if (directCanvas) {
    assetType = 'graph';
    assetEl = directCanvas;
    try {
      snapshotDataUrl = directCanvas.toDataURL('image/png');
    } catch {
      snapshotDataUrl = '';
    }
  } else if (
    directSvg &&
    !directSvg.classList.contains('lucide') &&
    (assetContainer || directSvg.getBoundingClientRect().width >= 120)
  ) {
    assetType = 'graph';
    assetEl = directSvg;
    snapshotDataUrl = captureSvgElementSnapshot(directSvg);
  } else if (assetContainer) {
    const kind = assetContainer.getAttribute('data-annotatable-asset') || 'graph';
    const nestedImg = assetContainer.querySelector('img');
    const nestedCanvas = assetContainer.querySelector('canvas');
    const nestedSvg = assetContainer.querySelector('svg:not(.lucide)');
    if (nestedImg) {
      assetType = 'image';
      assetEl = nestedImg;
      imageSrc = nestedImg.currentSrc || nestedImg.getAttribute('src') || '';
      snapshotDataUrl = imageSrc;
    } else if (nestedCanvas) {
      assetType = kind;
      assetEl = nestedCanvas;
      try {
        snapshotDataUrl = nestedCanvas.toDataURL('image/png');
      } catch {
        snapshotDataUrl = '';
      }
    } else if (nestedSvg) {
      assetType = kind;
      assetEl = nestedSvg;
      snapshotDataUrl = captureSvgElementSnapshot(nestedSvg);
    }
  }

  // Relative click coordinates inside asset or target anchor
  const boundsTarget = assetEl || anchorEl || rootContainer;
  let relX = null;
  let relY = null;
  if (boundsTarget && typeof boundsTarget.getBoundingClientRect === 'function') {
    const rect = boundsTarget.getBoundingClientRect();
    if (rect.width > 0 && rect.height > 0) {
      relX = Number(Math.max(0, Math.min(100, ((event.clientX - rect.left) / rect.width) * 100)).toFixed(1));
      relY = Number(Math.max(0, Math.min(100, ((event.clientY - rect.top) / rect.height) * 100)).toFixed(1));
    }
  }

  // Capture line / block text when clicking inside rich HTML or structured section
  let lineText = anchorEl?.getAttribute('data-line-text') || '';
  let richBlockIndex = null;

  const richRoot = target.closest('.prose-policy-view');
  if (richRoot) {
    const richBlock = target.closest('p, li, tr, h1, h2, h3, h4, h5, blockquote, pre');
    if (richBlock && richRoot.contains(richBlock)) {
      const blocks = Array.from(richRoot.querySelectorAll('p, li, tr, h1, h2, h3, h4, h5, blockquote, pre'));
      const idx = blocks.indexOf(richBlock);
      if (idx >= 0) richBlockIndex = idx;
      if (!lineText) {
        lineText = (richBlock.textContent || '').replace(/\s+/g, ' ').trim().slice(0, 320);
      }
    }
  } else if (!lineText) {
    const clickedLineEl = target.closest('p, li, h1, h2, h3, h4, h5, .group\\/item');
    if (clickedLineEl && (!anchorEl || anchorEl.contains(clickedLineEl))) {
      lineText = (clickedLineEl.textContent || '').replace(/\s+/g, ' ').trim().slice(0, 320);
    } else if (anchorEl) {
      lineText = (anchorEl.textContent || '').replace(/\s+/g, ' ').trim().slice(0, 320);
    }
  }

  return {
    isAsset: Boolean(assetType),
    assetType,
    snapshotDataUrl,
    imageSrc,
    anchorId,
    sectionAnchorId,
    sectionTitle,
    supplementaryTab,
    lineText: lineText.slice(0, 320),
    selectedText,
    richBlockIndex,
    relX,
    relY,
  };
}

/**
 * Resolve the closest matching DOM element inside PolicyWorkspacePane for a saved Note or Annotation anchor,
 * switch supplementary tab if required, scroll smoothly into view, and apply spotlight highlight.
 */
export function navigateToNoteAnchorInContainer({
  containerEl,
  noteNavTarget,
  setActiveSupplementaryTab,
  onMatched,
}) {
  if (!containerEl || !noteNavTarget) return () => {};

  const anchor = noteNavTarget.targetAnchor || noteNavTarget.target_anchor || {};
  let cancelled = false;
  let clearTimer = null;
  let cleanupEl = null;

  if (anchor.supplementaryTab && setActiveSupplementaryTab) {
    setActiveSupplementaryTab(anchor.supplementaryTab);
  }

  const findBestTargetElement = () => {
    const safeEscape = (val) => {
      if (typeof CSS !== 'undefined' && CSS.escape) return CSS.escape(val);
      return String(val).replace(/["\\]/g, '\\$&');
    };

    const normalizeStr = (s) => String(s || '').replace(/\s+/g, ' ').trim().toLowerCase();

    let baseEl = null;
    if (anchor.anchorId) {
      baseEl = containerEl.querySelector(`[data-note-anchor="${safeEscape(anchor.anchorId)}"]`);
    }

    if (baseEl) {
      if (anchor.assetType === 'image' && anchor.imageSrc) {
        const imgs = Array.from(baseEl.querySelectorAll('img'));
        const matchedImg = imgs.find((im) => im.src === anchor.imageSrc || im.getAttribute('src') === anchor.imageSrc) || imgs[0];
        if (matchedImg) return matchedImg;
      }

      if ((anchor.assetType === 'graph' || anchor.targetType === 'graph') && baseEl.querySelector('[data-annotatable-asset]')) {
        return baseEl.querySelector('[data-annotatable-asset]') || baseEl;
      }

      const richRoot = baseEl.querySelector('.prose-policy-view');
      if (richRoot) {
        const blocks = Array.from(richRoot.querySelectorAll('p, li, tr, h1, h2, h3, h4, h5, blockquote, pre'));
        if (anchor.richBlockIndex !== null && anchor.richBlockIndex !== undefined && blocks[anchor.richBlockIndex]) {
          return blocks[anchor.richBlockIndex];
        }
        const needle = normalizeStr(anchor.selectedText || anchor.lineText || anchor.excerpt).slice(0, 80);
        if (needle.length >= 4) {
          const textMatch = blocks.find((b) => normalizeStr(b.textContent).includes(needle));
          if (textMatch) return textMatch;
        }
      }

      return baseEl;
    }

    if (anchor.sectionTitle) {
      const targetTitle = normalizeStr(anchor.sectionTitle);
      const secEls = Array.from(containerEl.querySelectorAll('[data-section-title]'));
      const matchedSec = secEls.find((el) => normalizeStr(el.getAttribute('data-section-title')) === targetTitle)
        || secEls.find((el) => normalizeStr(el.getAttribute('data-section-title')).includes(targetTitle));
      if (matchedSec) {
        if (anchor.assetType === 'image' && anchor.imageSrc) {
          const imgs = Array.from(matchedSec.querySelectorAll('img'));
          const imgMatch = imgs.find((im) => im.src === anchor.imageSrc || im.getAttribute('src') === anchor.imageSrc) || imgs[0];
          if (imgMatch) return imgMatch;
        }
        const needle = normalizeStr(anchor.selectedText || anchor.lineText || anchor.excerpt).slice(0, 80);
        if (needle.length >= 4) {
          const candidateLine = Array.from(
            matchedSec.querySelectorAll('[data-note-anchor], p, li, tr, h4, h5')
          ).find((el) => normalizeStr(el.textContent).includes(needle));
          if (candidateLine) return candidateLine;
        }
        return matchedSec;
      }
    }

    if (anchor.imageSrc) {
      const img = Array.from(containerEl.querySelectorAll('img')).find(
        (im) => im.src === anchor.imageSrc || im.getAttribute('src') === anchor.imageSrc
      );
      if (img) return img;
    }

    const needle = normalizeStr(anchor.selectedText || anchor.lineText || anchor.excerpt).slice(0, 80);
    if (needle.length >= 6) {
      const candidates = Array.from(
        containerEl.querySelectorAll('[data-line-text], .prose-policy-view p, .prose-policy-view li, .prose-policy-view tr, h4, h5, p')
      );
      const found = candidates.find((el) => normalizeStr(el.textContent).includes(needle));
      if (found) return found;
    }

    if (anchor.assetType === 'graph' || noteNavTarget.targetType === 'graph') {
      const asset = containerEl.querySelector('[data-annotatable-asset]');
      if (asset) return asset;
    }

    return null;
  };

  const attemptScroll = (triesLeft = 6) => {
    if (cancelled) return;
    const el = findBestTargetElement();
    if (!el && triesLeft > 0) {
      clearTimer = setTimeout(() => attemptScroll(triesLeft - 1), 160);
      return;
    }
    if (!el) return;

    cleanupEl = el;
    el.classList.add('policy-note-nav-spotlight');
    try {
      el.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'nearest' });
    } catch {
      el.scrollIntoView(true);
    }

    if (onMatched) onMatched(el);

    clearTimer = setTimeout(() => {
      if (cleanupEl) {
        cleanupEl.classList.remove('policy-note-nav-spotlight');
      }
    }, 5000);
  };

  const initTimer = setTimeout(() => attemptScroll(6), 140);

  return () => {
    cancelled = true;
    clearTimeout(initTimer);
    if (clearTimer) clearTimeout(clearTimer);
    if (cleanupEl) cleanupEl.classList.remove('policy-note-nav-spotlight');
  };
}
