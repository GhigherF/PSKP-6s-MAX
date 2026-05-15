import React from 'react';
import './SearchSidebar.css';

function SearchSidebar({ searchQuery, setSearchQuery, resultsCount }) {
  return (
    <div className="search-sidebar">
      <div className="search-sidebar-header">
        <span className="search-sidebar-title">ПОИСК</span>
      </div>
      <div className="search-sidebar-content">
        <div style={{ position: 'relative' }}>
          <input
            type="text"
            placeholder="Поиск постов..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="search-sidebar-input"
          />
          <span className="search-sidebar-icon">🔍</span>
          {searchQuery && (
            <button 
              onClick={() => setSearchQuery('')}
              className="search-sidebar-clear"
              title="Очистить"
            >
              ✕
            </button>
          )}
        </div>
        {searchQuery && (
          <div className="search-sidebar-results">
            Найдено: {resultsCount} постов
          </div>
        )}
      </div>
    </div>
  );
}

export default SearchSidebar;
