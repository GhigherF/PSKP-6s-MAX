import React from 'react';

function ProfileSidebar({ activeTab, onTabChange, isOwn }) {
  const tabs = [
    { id: 'stats', label: 'Статистика', icon: '📊' },
    { id: 'posts', label: 'Посты', icon: '📝' },
    { id: 'followers', label: 'Подписчики', icon: '❤️' },
    { id: 'following', label: 'Подписки', icon: '👁️' },
    { id: 'comments', label: 'Комментарии', icon: '💬' },
    ...(isOwn ? [
      { id: 'views', label: 'Просмотренные', icon: '👀' },
      { id: 'edit', label: 'Настройки', icon: '⚙️' }
    ] : [])
  ];

  return (
    <div className="profile-sidebar">
      <div className="profile-sidebar-header">
        <span className="profile-sidebar-title">МЕНЮ</span>
      </div>
      <nav className="profile-sidebar-nav">
        {tabs.map(tab => (
          <button
            key={tab.id}
            className={`profile-sidebar-btn ${activeTab === tab.id ? 'active' : ''}`}
            onClick={() => onTabChange(tab.id)}
          >
            <span className="profile-sidebar-icon">{tab.icon}</span>
            <span className="profile-sidebar-label">{tab.label}</span>
          </button>
        ))}
      </nav>
    </div>
  );
}

export default ProfileSidebar;
