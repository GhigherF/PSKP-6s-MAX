import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';

function NotificationPanel() {
  const [notifs, setNotifs] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const [unread, setUnread] = useState(0);
  const panelRef = useRef(null);
  const triggerRef = useRef(null);

  useEffect(() => {
    loadNotifications();
    const interval = setInterval(loadNotifications, 30000);
    return () => clearInterval(interval);
  }, []);

  const loadNotifications = async () => {
    try {
      const { data } = await axios.get('/api/notifications');
      setNotifs(data);
      setUnread(data.filter(n => !n.is_read).length);
    } catch (err) {
      console.error('Failed to load notifications', err);
    }
  };

  const handleOpen = () => {
    setIsOpen(true);
    if (unread > 0) {
      axios.post('/api/notifications/read').catch(() => {});
      setUnread(0);
    }
  };

  const handleClose = () => {
    setIsOpen(false);
  };

  const removeNotification = async (id) => {
    try {
      await axios.delete(`/api/notifications/${id}`);
      setNotifs(prev => prev.filter(n => n.id !== id));
    } catch (err) {
      console.error('Failed to remove notification', err);
    }
  };

  return (
    <>
      {/* Trigger area */}
      <div
        ref={triggerRef}
        className={`notif-panel-trigger ${unread > 0 ? 'has-unread' : ''}`}
        onMouseEnter={handleOpen}
      >
        {unread > 0 && <span className="notif-panel-badge">{unread}</span>}
      </div>

      {/* Panel */}
      <div
        ref={panelRef}
        className={`notif-panel ${isOpen ? 'open' : ''}`}
        onMouseLeave={handleClose}
      >
        <div className="notif-panel-header">
          <span className="notif-panel-title">УВЕДОМЛЕНИЯ</span>
          <button className="notif-panel-close" onClick={handleClose}>✕</button>
        </div>
        <div className="notif-panel-content">
          {notifs.length === 0 ? (
            <p className="notif-panel-empty">Нет уведомлений</p>
          ) : (
            notifs.map(n => (
              <div key={n.id} className={`notif-panel-item ${n.is_read ? '' : 'unread'}`}>
                <p className="notif-panel-msg">{n.message}</p>
                <span className="notif-panel-time">{new Date(n.created_at).toLocaleString()}</span>
                <button className="notif-panel-del" onClick={() => removeNotification(n.id)}>✕</button>
              </div>
            ))
          )}
        </div>
      </div>
    </>
  );
}

export default NotificationPanel;
