import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Construction, ArrowLeft } from 'lucide-react';

export default function ModulePlaceholder({ title = 'Module Workspace', description = 'This module is currently being finalized.' }) {
    const navigate = useNavigate();

    return (
        <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            height: '100%',
            padding: '40px',
            textAlign: 'center',
            background: 'var(--page-bg, #f8fafc)',
            color: 'var(--text-primary, #0f172a)'
        }}>
            <div style={{
                width: '64px',
                height: '64px',
                borderRadius: '16px',
                background: '#eff6ff',
                color: 'var(--btn-primary-bg, #0057B8)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: '16px'
            }}>
                <Construction size={32} />
            </div>
            <h2 style={{ fontSize: '20px', fontWeight: '700', margin: '0 0 8px 0' }}>{title}</h2>
            <p style={{ fontSize: '14px', color: '#64748b', maxWidth: '400px', margin: '0 0 24px 0' }}>
                {description}
            </p>
            <button
                type="button"
                onClick={() => navigate('/dashboard')}
                style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '8px 16px',
                    fontSize: '13px',
                    fontWeight: '600',
                    borderRadius: '6px',
                    background: 'var(--btn-primary-bg, #0057B8)',
                    color: '#ffffff',
                    border: 'none',
                    cursor: 'pointer'
                }}
            >
                <ArrowLeft size={14} />
                <span>Return to Dashboard</span>
            </button>
        </div>
    );
}
