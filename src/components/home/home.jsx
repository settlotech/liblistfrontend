import './home.css';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import Header from '../common/header/header';

export default function Home() {
    const { user, logout } = useAuth();
    const [isLoggingOut, setIsLoggingOut] = useState(false);
    const navigate = useNavigate();

    const onLogout = async () => {
        setIsLoggingOut(true);
        try {
            await logout();
            navigate('/login', { replace: true });
        } catch (error) {
            console.error('Logout failed:', error);
        } finally {
            setIsLoggingOut(false);
        }
    };

    return (
        <div>
             <Header></Header>
        </div>
    );
}
