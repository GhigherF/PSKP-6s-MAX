import React, { useEffect, useState, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { useToast, useTheme } from '../App';
import {
  RadarChart, Radar, PolarGrid, PolarAngleAxis,
  LineChart, Line, BarChart, Bar, XAxis, YAxis, Tooltip,
  ResponsiveContainer, Cell, Legend
} from 'recharts';
import EmailChangeModal from './EmailChangeModal';
import UserPostsTab from './UserPostsTab';
import ProfileSidebar from '../components/ProfileSidebar';
import NotificationPanel from '../components/NotificationPanel';
import './ProfilePage.css';

const API = '/api';

function buildDayMap(rows) {
  const map = {};
  rows.forEach(r => { map[r.day?.slice(0, 10)] = parseInt(r.cnt); });
  return map;
}





function buildTimeline(activity, period) {
  const days = period === 'month' ? 30 : 7;
  const now = new Date();
  const postsMap = buildDayMap(activity.posts || []);
  const commentsMap = buildDayMap(activity.comments || []);
  const likesMap = buildDayMap(activity.likes || []);
  const viewsMap = buildDayMap(activity.views || []);
  const result = [];
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(now); d.setDate(d.getDate() - i);
    const key = d.toISOString().slice(0, 10);
    const label = `${d.getDate()}.${String(d.getMonth() + 1).padStart(2, '0')}`;
    result.push({ date: label, Посты: postsMap[key] || 0, Комментарии: commentsMap[key] || 0, Лайки: likesMap[key] || 0, Просмотры: viewsMap[key] || 0 });
  }
  return result;
}

function buildActivityTimeline(activity, period) {
  const days = period === 'month' ? 30 : period === 'week' ? 7 : 14;
  const now = new Date();
  const postsMap = buildDayMap(activity.posts || []);
  const commentsMap = buildDayMap(activity.comments || []);
  const likesMap = buildDayMap(activity.likes || []);
  const viewsMap = buildDayMap(activity.views || []);
  const result = [];
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(now); d.setDate(d.getDate() - i);
    const key = d.toISOString().slice(0, 10);
    const label = `${d.getDate()}.${String(d.getMonth() + 1).padStart(2, '0')}`;
    result.push({ date: label, Активность: (postsMap[key] || 0) + (commentsMap[key] || 0) + (likesMap[key] || 0) + (viewsMap[key] || 0) });
  }
  return result;
}

const TT = { background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 8, color: 'var(--text)' };
const COLORS = { Посты: '#1d9bf0', Комментарии: '#00ba7c', Лайки: '#f91880', Просмотры: '#a29bfe' };

function Charts({ activity, profile, period, setPeriod, activityPeriod, setActivityPeriod }) {
  const radarData = [
    { subject: 'Посты',        value: parseInt(profile.posts_count) || 0 },
    { subject: 'Комментарии',  value: parseInt(profile.comments_count) || 0 },
    { subject: 'Лайки постов', value: parseInt(profile.received_post_likes) || 0 },
    { subject: 'Лайки комм.',  value: parseInt(profile.received_comment_likes) || 0 },
    { subject: 'Просмотры',    value: parseInt(profile.received_views) || 0 },
  ];

  return (
    <div className="profile-charts">
      <div className="chart-block">
        <h3 className="chart-title">Общая активность</h3>
        <div style={{ overflowX: 'auto' }}>
          <RadarChart width={500} height={260} data={radarData} style={{ margin: '0 auto', display: 'block' }}>
            <PolarGrid stroke="var(--border)" />
            <PolarAngleAxis dataKey="subject" tick={{ fontSize: 11, fill: 'var(--text-muted)' }} />
            <Radar dataKey="value" stroke="var(--accent)" fill="var(--accent)" fillOpacity={0.3} />
          </RadarChart>
        </div>
      </div>

      <div className="chart-block">
        <div className="chart-header">
          <h3 className="chart-title" style={{ margin: 0 }}>Активность по дням</h3>
          <div className="chart-period-btns">
            {[['week','7 дней'],['month','30 дней']].map(([p,l]) => (
              <button key={p} className={`chart-period-btn ${period===p?'active':''}`} onClick={() => setPeriod(p)}>{l}</button>
            ))}
          </div>
        </div>
        <ResponsiveContainer width="100%" height={240}>
          <LineChart data={buildTimeline(activity, period)} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
            <XAxis dataKey="date" tick={{ fontSize: 10, fill: 'var(--text-muted)' }} interval="preserveStartEnd" />
            <YAxis allowDecimals={false} tick={{ fontSize: 10, fill: 'var(--text-muted)' }} />
            <Tooltip contentStyle={TT} />
            <Legend wrapperStyle={{ fontSize: 12 }} />
            {Object.entries(COLORS).map(([k, c]) => <Line key={k} type="monotone" dataKey={k} stroke={c} dot={false} strokeWidth={2} />)}
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="chart-block">
        <div className="chart-header">
          <h3 className="chart-title" style={{ margin: 0 }}>Общая активность (суммарно)</h3>
          <div className="chart-period-btns">
            {[['day','14 дней'],['week','7 дней'],['month','30 дней']].map(([p,l]) => (
              <button key={p} className={`chart-period-btn ${activityPeriod===p?'active':''}`} onClick={() => setActivityPeriod(p)}>{l}</button>
            ))}
          </div>
        </div>
        <ResponsiveContainer width="100%" height={240}>
          <LineChart data={buildActivityTimeline(activity, activityPeriod)} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
            <XAxis dataKey="date" tick={{ fontSize: 10, fill: 'var(--text-muted)' }} interval="preserveStartEnd" />
            <YAxis allowDecimals={false} tick={{ fontSize: 10, fill: 'var(--text-muted)' }} />
            <Tooltip contentStyle={TT} />
            <Line type="monotone" dataKey="Активность" stroke="var(--accent)" strokeWidth={2} dot={{ fill: 'var(--accent)', r: 4 }} activeDot={{ r: 6 }} />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="chart-block">
        <h3 className="chart-title">Распределение активности</h3>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={[
            { name: 'Посты',    val: parseInt(profile.posts_count) || 0 },
            { name: 'Комм.',    val: parseInt(profile.comments_count) || 0 },
            { name: 'Лайки п.', val: parseInt(profile.received_post_likes) || 0 },
            { name: 'Лайки к.', val: parseInt(profile.received_comment_likes) || 0 },
            { name: 'Просм.',   val: parseInt(profile.received_views) || 0 },
          ]} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
            <XAxis dataKey="name" tick={{ fontSize: 11, fill: 'var(--text-muted)' }} />
            <YAxis allowDecimals={false} tick={{ fontSize: 10, fill: 'var(--text-muted)' }} />
            <Tooltip contentStyle={TT} />
            <Bar dataKey="val" radius={[4,4,0,0]}>
              {['#1d9bf0','#00ba7c','#f91880','#fdcb6e','#a29bfe'].map((c,i) => <Cell key={i} fill={c} />)}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

export default function ProfilePage() {
  const { id } = useParams();
  const { user } = useAuth();
  const toast = useToast();
  const { theme, toggleTheme } = useTheme();
  const [profile, setProfile] = useState(null);
  const [tab, setTab] = useState('stats');
  const [comments, setComments] = useState([]);
  const [views, setViews] = useState([]);
  const [followers, setFollowers] = useState([]);
  const [following, setFollowing] = useState([]);
  const [activity, setActivity] = useState(null);
  const [period, setPeriod] = useState('month');
  const [activityPeriod, setActivityPeriod] = useState('month');
  const [error, setError] = useState('');
  const [editNick, setEditNick] = useState('');
  const [editMsg, setEditMsg] = useState('');
  const [avatarPreview, setAvatarPreview] = useState(null);
  const [showEmailModal, setShowEmailModal] = useState(false);
  const avatarRef = useRef(null);
  const previousTheme = useRef(null);

  const isOwn = user && user.id === parseInt(id);

  // УБРАНО: автоматическое переключение на светлую тему
  // useEffect(() => {
  //   const currentTheme = localStorage.getItem('theme');
  //   if (currentTheme !== 'light') {
  //     previousTheme.current = currentTheme;
  //     if (theme !== 'light') {
  //       toggleTheme();
  //     }
  //   }
  //   return () => {
  //     const currentTheme = localStorage.getItem('theme');
  //     if (currentTheme === 'light' && previousTheme.current && previousTheme.current !== 'light') {
  //       toggleTheme();
  //     }
  //   };
  // }, []);

  useEffect(() => {
    setActivity(null);
    setProfile(null);
    setError('');
    axios.get(`${API}/users/${id}`)
      .then(r => { setProfile(r.data); setEditNick(r.data.nick); window.dispatchEvent(new CustomEvent('viewed-profile-changed', { detail: r.data })); })
      .catch(() => setError('Пользователь не найден'));
    axios.get(`${API}/users/${id}/activity`)
      .then(r => setActivity(r.data))
      .catch(() => setActivity({}));
  }, [id]);

  useEffect(() => {
    setComments([]); setViews([]); setFollowers([]); setFollowing([]);
    const saved = localStorage.getItem('activeTab');
    if (saved) { setTab(saved); localStorage.removeItem('activeTab'); }
    if (tab === 'comments') axios.get(`${API}/users/${id}/comments`).then(r => setComments(r.data)).catch(() => {});
    if (tab === 'views' && isOwn) axios.get(`${API}/users/${id}/views`).then(r => setViews(r.data)).catch(() => {});
    if (tab === 'followers') axios.get(`${API}/users/${id}/followers`).then(r => setFollowers(r.data)).catch(() => {});
    if (tab === 'following') axios.get(`${API}/users/${id}/following`).then(r => setFollowing(r.data)).catch(() => {});
  }, [tab, id, isOwn]);

  const handleSubscribe = async () => {
    const { data } = await axios.post(`${API}/users/${id}/subscribe`);
    setProfile(prev => ({ ...prev, is_following: data.subscribed, followers_count: parseInt(prev.followers_count) + (data.subscribed ? 1 : -1) }));
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault(); setEditMsg('');
    try {
      const fd = new FormData();
      if (editNick !== profile.nick) fd.append('nick', editNick);
      if (avatarRef.current?.files[0]) fd.append('avatar', avatarRef.current.files[0]);
      if (![...fd.entries()].length) return;
      const { data } = await axios.patch(`${API}/users/me`, fd);
      setProfile(data); setEditNick(data.nick);
      setAvatarPreview(null); avatarRef.current.value = '';
      setEditMsg('Сохранено'); toast('Профиль обновлён ✓');
      
      // Перезагружаем страницу для обновления аватарки в навбаре
      setTimeout(() => {
        window.location.href = `/profile/${user.id}`;
      }, 500);
    } catch (err) {
      setEditMsg(err.response?.status === 413 ? 'Файл слишком большой (макс. 300 МБ)' : err.response?.data?.error || 'Ошибка');
    }
  };

  // Handle email change button click
  const handleEmailChangeClick = (isHeaderButton = false) => {
    if (isHeaderButton) {
      // Header button: navigate to edit tab first
      setTab('edit');
      // Wait for tab change, then scroll to email field and show modal
      setTimeout(() => {
        const emailRow = document.querySelector('.edit-email-row');
        if (emailRow) {
          emailRow.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
        // Show email change modal after navigation
        setShowEmailModal(true);
      }, 100);
    } else {
      // Edit form button: show modal directly (already on edit tab)
      setShowEmailModal(true);
    }
  };

  if (error) return <p className="profile-error">{error}</p>;
  if (!profile) return <p className="profile-loading">Загрузка...</p>;

  return (
    <div className="profile-layout">
      {user && <NotificationPanel />}
      <ProfileSidebar activeTab={tab} onTabChange={setTab} isOwn={isOwn} />
      <div className="profile-wrap">
      <div className="profile-header">
        <div className="profile-avatar-wrap">
          {profile.avatar_url
            ? <img src={profile.avatar_url} alt="avatar" className="profile-avatar" />
            : <div className="profile-avatar-placeholder">{profile.nick[0].toUpperCase()}</div>}
        </div>
        <div className="profile-info">
          <h1 className="profile-nick">{profile.nick}</h1>
          {isOwn && profile.role === 'admin' && <span className="profile-role-badge">Администратор</span>}
          <div className="profile-email-row">
            <p className="profile-email">{profile.email}</p>
            {isOwn && <button className="btn-email-change" onClick={() => handleEmailChangeClick(true)} title="Изменить email">Изменить email</button>}
          </div>
          <p className="profile-date">С нами с {new Date(profile.created_at).toLocaleDateString()}</p>
          <div className="profile-sub-counts">
            <span><strong>{profile.followers_count}</strong> подписчиков</span>
            <span><strong>{profile.following_count}</strong> подписок</span>
          </div>
          {user && !isOwn && (
            <button className={`btn-subscribe ${profile.is_following ? 'subscribed' : ''}`} onClick={handleSubscribe}>
              {profile.is_following ? 'Отписаться' : 'Подписаться'}
            </button>
          )}
        </div>
      </div>

      <div className="profile-tabs" style={{ display: 'none' }}>
        {['stats', 'posts', 'followers', 'following', 'comments', ...(isOwn ? ['views', 'edit'] : [])].map(t => (
          <button key={t} className={`tab-btn ${tab === t ? 'active' : ''}`} onClick={() => setTab(t)}>
            {{ 
              stats: 'Статистика', 
              posts: 'Посты',
              followers: 'Подписчики', 
              following: 'Подписки', 
              comments: 'Комментарии', 
              views: 'Просмотренные', 
              edit: 'Редактировать' 
            }[t]}
          </button>
        ))}
      </div>

      {tab === 'stats' && (
        <div>
          <div className="profile-stats-grid">
            <div className="stat-card"><span className="stat-val">{profile.posts_count}</span><span className="stat-label">Постов</span></div>
            <div className="stat-card"><span className="stat-val">{profile.comments_count}</span><span className="stat-label">Комментариев</span></div>
            <div className="stat-card"><span className="stat-val">{profile.received_post_likes}</span><span className="stat-label">Лайков на постах</span></div>
            <div className="stat-card"><span className="stat-val">{profile.received_comment_likes}</span><span className="stat-label">Лайков на комментариях</span></div>
            <div className="stat-card" style={{ gridColumn: '1 / -1' }}><span className="stat-val">{profile.received_views}</span><span className="stat-label">Просмотров постов</span></div>
          </div>
          {activity !== null
            ? <Charts activity={activity} profile={profile} period={period} setPeriod={setPeriod} activityPeriod={activityPeriod} setActivityPeriod={setActivityPeriod} />
            : <p style={{ padding: 16, color: 'var(--text-muted)' }}>Загрузка графиков...</p>}
        </div>
      )}

      {tab === 'posts' && (
        <UserPostsTab userId={id} user={user} />
      )}

      {tab === 'comments' && (
        <div className="profile-comments">
          {comments.length === 0 && <p style={{ padding: 16, color: 'var(--text-muted)' }}>Нет комментариев</p>}
          {comments.map(c => (
            <div key={c.id} className="profile-comment-item">
              <p className="profile-comment-body">{c.body}</p>
              <small className="profile-comment-meta">
                {new Date(c.created_at).toLocaleString()} — «{c.post_body?.slice(0, 60)}»
                <Link to={`/posts/${c.post_id}`} className="profile-comment-link">Перейти к посту</Link>
              </small>
            </div>
          ))}
        </div>
      )}

      {tab === 'views' && isOwn && (
        <div className="profile-views">
          {views.length === 0 && <p style={{ padding: 16, color: 'var(--text-muted)' }}>Нет просмотренных постов</p>}
          {views.map(p => (
            <div key={p.id} className="profile-view-item">
              <div className="profile-view-header">
                <Link to={`/profile/${p.user_id}`} className="profile-view-author">{p.username}</Link>
                <Link to={`/posts/${p.id}`} className="profile-comment-link">Открыть пост</Link>
              </div>
              <p className="profile-view-body">{p.body?.slice(0, 120)}{p.body?.length > 120 ? '...' : ''}</p>
              <small className="profile-view-date">Просмотрено: {new Date(p.viewed_at).toLocaleString()}</small>
            </div>
          ))}
        </div>
      )}

      {tab === 'followers' && (
        <div className="profile-followers">
          {followers.length === 0 && <p style={{ padding: 16, color: 'var(--text-muted)' }}>Нет подписчиков</p>}
          {followers.map(f => (
            <div key={f.id} className="profile-follower-item">
              <Link to={`/profile/${f.id}`} className="profile-follower-link">
                {f.avatar_url
                  ? <img src={f.avatar_url} alt="" className="profile-follower-avatar" />
                  : <div className="profile-follower-avatar-placeholder">{f.nick[0].toUpperCase()}</div>}
                <div className="profile-follower-info">
                  <span className="profile-follower-nick">{f.nick}</span>
                  <small className="profile-follower-date">С нами с {new Date(f.created_at).toLocaleDateString()}</small>
                </div>
              </Link>
              {user && user.id !== f.id && (
                <button 
                  className={`btn-subscribe-small ${f.is_following ? 'subscribed' : ''}`}
                  onClick={async () => {
                    const { data } = await axios.post(`${API}/users/${f.id}/subscribe`);
                    setFollowers(prev => prev.map(follower => 
                      follower.id === f.id ? { ...follower, is_following: data.subscribed } : follower
                    ));
                  }}
                >
                  {f.is_following ? 'Отписаться' : 'Подписаться'}
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {tab === 'following' && (
        <div className="profile-following">
          {following.length === 0 && <p style={{ padding: 16, color: 'var(--text-muted)' }}>Нет подписок</p>}
          {following.map(f => (
            <div key={f.id} className="profile-follower-item">
              <Link to={`/profile/${f.id}`} className="profile-follower-link">
                {f.avatar_url
                  ? <img src={f.avatar_url} alt="" className="profile-follower-avatar" />
                  : <div className="profile-follower-avatar-placeholder">{f.nick[0].toUpperCase()}</div>}
                <div className="profile-follower-info">
                  <span className="profile-follower-nick">{f.nick}</span>
                  <small className="profile-follower-date">С нами с {new Date(f.created_at).toLocaleDateString()}</small>
                </div>
              </Link>
              {user && user.id !== f.id && (
                <button 
                  className={`btn-subscribe-small ${f.is_following ? 'subscribed' : ''}`}
                  onClick={async () => {
                    const { data } = await axios.post(`${API}/users/${f.id}/subscribe`);
                    setFollowing(prev => prev.map(following => 
                      following.id === f.id ? { ...following, is_following: data.subscribed } : following
                    ));
                  }}
                >
                  {f.is_following ? 'Отписаться' : 'Подписаться'}
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {tab === 'edit' && isOwn && (
        <form onSubmit={handleSaveProfile} className="profile-edit-form">
          <div>
            <label style={{ display: 'block', marginBottom: 6, fontSize: 14, fontWeight: 600, color: 'var(--text-muted)' }}>Аватарка</label>
            <div className="avatar-preview-wrap">
              {avatarPreview
                ? <img src={avatarPreview} alt="preview" className="avatar-preview" />
                : profile.avatar_url
                  ? <img src={profile.avatar_url} alt="current" className="avatar-preview" />
                  : <div className="avatar-preview-placeholder">{profile.nick[0].toUpperCase()}</div>}
            </div>
            <label className="file-chooser">
              <input type="file" accept="image/*" ref={avatarRef} onChange={e => { if (e.target.files[0]) setAvatarPreview(URL.createObjectURL(e.target.files[0])); }} />
              <span className="file-chooser-btn">Добавить фото</span>
            </label>
          </div>
          <label>
            Никнейм
            <input value={editNick} onChange={e => setEditNick(e.target.value)} className="auth-input" />
          </label>
          <div className="edit-email-row">
            <label style={{ flex: 1 }}>
              Email
              <input value={profile.email} disabled className="auth-input edit-email-disabled" />
            </label>
            <button type="button" className="btn-email-change" onClick={() => handleEmailChangeClick(false)} title="Изменить email">
              Изменить email
            </button>
          </div>
          {editMsg && <p className={editMsg === 'Сохранено' ? 'edit-ok' : 'edit-err'}>{editMsg}</p>}
          <button type="submit" className="auth-btn">Сохранить</button>
        </form>
      )}

      {/* Email Change Modal */}
      <EmailChangeModal
        isOpen={showEmailModal}
        onClose={() => setShowEmailModal(false)}
        currentEmail={profile.email}
        onSuccess={(newEmail) => {
          // Update profile state with new email
          setProfile(prev => ({ ...prev, email: newEmail }));
          // Show success toast
          toast('Email успешно обновлён ✓');
        }}
      />
      </div>
    </div>
  );
}
