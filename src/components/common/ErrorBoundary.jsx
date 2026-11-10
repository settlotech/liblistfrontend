import React from 'react';
import { AlertCircle, RotateCcw } from 'lucide-react';

export default class ErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false, error: null };
    }

    static getDerivedStateFromError(error) {
        return { hasError: true, error };
    }

    componentDidCatch(error, errorInfo) {
        console.error('ErrorBoundary caught an error:', error, errorInfo);
    }

    handleReset = () => {
        this.setState({ hasError: false, error: null });
        if (this.props.onReset) {
            this.props.onReset();
        }
    };

    render() {
        if (this.state.hasError) {
            if (this.props.fallback) {
                return this.props.fallback;
            }

            return (
                <div
                    style={{
                        padding: '32px 24px',
                        maxWidth: '520px',
                        margin: '40px auto',
                        background: '#ffffff',
                        border: '1px solid #fee2e2',
                        borderRadius: '12px',
                        boxShadow: '0 4px 12px rgba(239, 68, 68, 0.08)',
                        textAlign: 'center'
                    }}
                >
                    <div
                        style={{
                            width: '44px',
                            height: '44px',
                            borderRadius: '50%',
                            background: '#fef2f2',
                            color: '#dc2626',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            margin: '0 auto 12px'
                        }}
                    >
                        <AlertCircle size={24} />
                    </div>
                    <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#0f172a', margin: '0 0 6px' }}>
                        {this.props.title || 'Component Error'}
                    </h3>
                    <p style={{ fontSize: '12.5px', color: '#64748b', lineHeight: 1.5, margin: '0 0 16px' }}>
                        {this.state.error?.message || 'An unexpected error occurred while rendering this view.'}
                    </p>
                    <button
                        type="button"
                        onClick={this.handleReset}
                        style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '6px',
                            padding: '7px 16px',
                            fontSize: '12px',
                            fontWeight: 600,
                            borderRadius: '6px',
                            background: '#0284c7',
                            color: '#ffffff',
                            border: 'none',
                            cursor: 'pointer'
                        }}
                    >
                        <RotateCcw size={13} />
                        <span>Try Again</span>
                    </button>
                </div>
            );
        }

        return this.props.children;
    }
}
