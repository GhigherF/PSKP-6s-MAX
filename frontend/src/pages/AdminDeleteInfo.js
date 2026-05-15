import React from 'react';

function AdminDeleteInfo({ deletedByAdmin, deletedByAdminName, deletedAt }) {
  if (!deletedByAdmin) return null;
  
  return (
    <div className="admin-delete-info">
      <div className="admin-delete-header">
        <span className="admin-delete-icon">🚫</span>
        <span className="admin-delete-title">Удалено администратором</span>
      </div>
      {deletedByAdminName && (
        <div className="admin-delete-details">
          <span className="admin-delete-label">Администратор:</span>
          <span className="admin-delete-value">{deletedByAdminName}</span>
        </div>
      )}
      {deletedAt && (
        <div className="admin-delete-details">
          <span className="admin-delete-label">Время удаления:</span>
          <span className="admin-delete-value">{new Date(deletedAt).toLocaleString()}</span>
        </div>
      )}
      <div className="admin-delete-note">
        <small>Этот комментарий был удален администратором за нарушение правил сообщества.</small>
      </div>
    </div>
  );
}

export default AdminDeleteInfo;