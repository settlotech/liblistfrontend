import './home.css';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { LayoutDashboard, TrendingUp, FileText, Users, Activity } from 'lucide-react';

export default function Home() {
    const { user } = useAuth(); 
    console.log("user ==> ", user);

   
    return (
        <div className="home-page">
             
        </div>
    );
}
