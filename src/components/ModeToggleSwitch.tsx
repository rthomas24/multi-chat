"use client";

import styles from './ModeToggleSwitch.module.css';

interface ModeToggleSwitchProps {
  currentMode: 'chat' | 'pictures';
  onToggle: () => void;
}

const ModeToggleSwitch: React.FC<ModeToggleSwitchProps> = ({ currentMode, onToggle }) => {
  return (
    <button
      className={`${styles.toggleSwitch} ${currentMode === 'pictures' ? styles.picturesActive : styles.chatActive}`}
      onClick={onToggle}
      aria-label={`Switch to ${currentMode === 'chat' ? 'Pictures' : 'Chat'} mode`}
    >
      <span className={`${styles.iconContainer} ${styles.chatIconContainer}`}>
        <svg fill="currentColor" width="20" height="20" viewBox="0 0 24 24"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>
      </span>
      <span className={`${styles.iconContainer} ${styles.picturesIconContainer}`}>
        <svg fill="currentColor" width="20" height="20" viewBox="0 0 24 24"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><circle cx="8.5" cy="8.5" r="1.5"></circle><polyline points="21 15 16 10 5 21" stroke="currentColor" strokeWidth="2" fill="none"></polyline></svg>
      </span>
      <div className={styles.slider}></div>
    </button>
  );
};

export default ModeToggleSwitch; 