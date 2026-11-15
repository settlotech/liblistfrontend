import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Navbar from './Navbar';
import Sidebar from './Sidebar';
import ChatsShidneyPanel from './ChatsShidneyPanel';
import styles from './Home.module.css';

const HomePage = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [chatPanelOpen, setChatPanelOpen] = useState(true);

  const toggleSidebar = () => {
    setSidebarOpen((prev) => !prev);
  };

  const toggleChatPanel = () => {
    setChatPanelOpen((prev) => !prev);
  };

  return (
    <div className={styles.layout}>
      {/* ── Top Navbar ── */}
      <Navbar
        onToggleSidebar={toggleSidebar}
        onToggleChatPanel={toggleChatPanel}
        chatPanelOpen={chatPanelOpen}
      />

      {/* ── Main Layout Body (Sidebar + Content Area + Chats & Shidney Panel) ── */}
      <div className={styles.mainContainer}> 
        <Sidebar isOpen={sidebarOpen} onToggle={toggleSidebar} />

        <main className={styles.contentArea}>
          {children || <Outlet />}
        </main>

        <ChatsShidneyPanel isOpen={chatPanelOpen} />
      </div>
    </div>
  );
};

export default HomePage;
