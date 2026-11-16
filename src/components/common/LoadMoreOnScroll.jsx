import React, { useEffect, useRef } from 'react';

/** Loads the next list page when this control enters view; button remains as fallback. */
export default function LoadMoreOnScroll({ hasMore, loading, onLoadMore, label = 'Load more' }) {
    const ref = useRef(null);
    useEffect(() => {
        if (!hasMore || loading || !ref.current) return;
        let requested = false;
        const requestNext = () => {
            if (requested) return;
            requested = true;
            onLoadMore();
        };
        let observer;
        if ('IntersectionObserver' in window) {
            observer = new IntersectionObserver(([entry]) => {
                if (entry.isIntersecting) requestNext();
            }, { rootMargin: '240px' });
            observer.observe(ref.current);
        }
        // Also cover layouts where the table/card itself is the scrolling surface.
        const handleScroll = (event) => {
            const target = event.target === document ? document.documentElement : event.target;
            if (!target || typeof target.scrollHeight !== 'number') return;
            if (target.scrollTop + target.clientHeight >= target.scrollHeight - 240) requestNext();
        };
        window.addEventListener('scroll', handleScroll, true);
        return () => {
            observer?.disconnect();
            window.removeEventListener('scroll', handleScroll, true);
        };
    }, [hasMore, loading, onLoadMore]);

    if (!hasMore && !loading) return null;
    return <div ref={ref} style={{ display: 'flex', justifyContent: 'center', padding: '16px' }}>
        <button type="button" onClick={onLoadMore} disabled={loading} style={{ padding: '8px 18px', border: '1px solid #cbd5e1', borderRadius: 8, background: '#fff', color: '#334155', cursor: loading ? 'wait' : 'pointer' }}>
            {loading ? 'Loading…' : label}
        </button>
    </div>;
}
