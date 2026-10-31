import './login.css';
import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';

export default function Login({ onLoginSuccess }) {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [errors, setErrors] = useState({});
    const [isSubmitting, setIsSubmitting] = useState(false);
    const { login } = useAuth();

    const handleSubmit = async (e) => {
        e.preventDefault();
        let newErrors = {};

        if (!email.trim()) {
            newErrors.email = 'Email is required';
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            newErrors.email = 'Enter a valid email';
        }

        if (!password.trim()) {
            newErrors.password = 'Password is required';
        } else if (password.length < 6) {
            newErrors.password = 'Password must be at least 6 characters';
        }

        setErrors(newErrors);

        if (Object.keys(newErrors).length === 0) {
            setIsSubmitting(true);
            try {
                const res = await login({ email, password });
                if (res?.success) {
                    if (onLoginSuccess) {
                        onLoginSuccess(res?.data?.user || res?.user, res?.data?.accessToken || res?.accessToken);
                    }
                }
            } catch (err) {
                setErrors({ general: err.message || 'Login failed. Please try again.' });
            } finally {
                setIsSubmitting(false);
            }
        }
    };

    return (
        <div className="login-container">
            <form onSubmit={handleSubmit}>
                <h2>Login</h2>
                {errors.general && <p className="error general-error">{errors.general}</p>}
                <div>
                    <label>Email</label>
                    <input
                        type="email"
                        placeholder="Enter your email"
                        value={email}
                        onChange={(e) => {
                            setEmail(e.target.value);
                            if (errors.email || errors.general) {
                                setErrors((prev) => ({ ...prev, email: '', general: '' }));
                            }
                        }}
                    />
                    {errors.email && <p className="error">{errors.email}</p>}
                </div>

                <div>
                    <label>Password</label>
                    <input
                        type="password"
                        placeholder="Enter your password"
                        value={password}
                        onChange={(e) => {
                            setPassword(e.target.value);
                            if (errors.password || errors.general) {
                                setErrors((prev) => ({ ...prev, password: '', general: '' }));
                            }
                        }}
                    />
                    {errors.password && <p className="error">{errors.password}</p>}
                </div>
                <button type="submit" disabled={isSubmitting}>
                    {isSubmitting ? 'Logging in...' : 'Login'}
                </button>
            </form>
        </div>
    );
}
