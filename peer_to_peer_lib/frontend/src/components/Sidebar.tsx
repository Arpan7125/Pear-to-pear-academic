'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/lib/auth';
import { motion } from 'framer-motion';

import { 
  LayoutDashboard, 
  Library, 
  Search, 
  Upload, 
  FolderOpen, 
  Users, 
  BarChart2, 
  Settings, 
  LogOut, 
  Trophy,
  Zap,
} from 'lucide-react';

/* ── Lucide icons ── */
const icons: Record<string, React.ReactNode> = {
  dashboard: <LayoutDashboard size={20} strokeWidth={1.8} />,
  library: <Library size={20} strokeWidth={1.8} />,
  search: <Search size={20} strokeWidth={1.8} />,
  upload: <Upload size={20} strokeWidth={1.8} />,
  myfiles: <FolderOpen size={20} strokeWidth={1.8} />,
  peers: <Users size={20} strokeWidth={1.8} />,
  analytics: <BarChart2 size={20} strokeWidth={1.8} />,
  leaderboard: <Trophy size={20} strokeWidth={1.8} />,
  users: <Users size={20} strokeWidth={1.8} />,
  resources: <Library size={20} strokeWidth={1.8} />,
  settings: <Settings size={20} strokeWidth={1.8} />,
  logout: <LogOut size={20} strokeWidth={1.8} />,
};

const userNav = [
  { name: 'Dashboard', href: '/', icon: 'dashboard' },
  { name: 'Browse Library', href: '/library', icon: 'library' },
  { name: 'Search', href: '/search', icon: 'search' },
  { name: 'My Files', href: '/my-files', icon: 'myfiles' },
  { name: 'Upload', href: '/upload', icon: 'upload' },
  { name: 'Peers', href: '/peers', icon: 'peers' },
  { name: 'Leaderboard', href: '/leaderboard', icon: 'leaderboard' },
];

const adminNav = [
  { name: 'Admin Dashboard', href: '/admin', icon: 'analytics' },
  { name: 'Manage Users', href: '/admin/users', icon: 'users' },
  { name: 'Manage Resources', href: '/admin/resources', icon: 'resources' },
  { name: 'Network Stats', href: '/admin/stats', icon: 'settings' },
];

export default function Sidebar() {
  const pathname = usePathname();
  const { user, isAdmin, logout } = useAuth();

  return (
    <aside className="sidebar">
      {/* ── Logo ── */}
      <div className="p-6 pb-5" style={{ borderBottom: '1px solid var(--border-subtle)' }}>
        <div className="flex items-center gap-3">
          <div className="relative">
            <div
              className="absolute inset-0 rounded-xl"
              style={{
                background: 'linear-gradient(135deg, var(--accent), var(--violet))',
                filter: 'blur(8px)',
                opacity: 0.3,
              }}
            />
            <div
              className="relative w-10 h-10 rounded-xl flex items-center justify-center"
              style={{
                background: 'linear-gradient(135deg, var(--accent), #04b490)',
                boxShadow: '0 0 20px rgba(6, 214, 160, 0.2)',
              }}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--text-inverse)" strokeWidth={2.2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
            </div>
          </div>
          <div>
            <h1 className="font-bold text-[.95rem] leading-tight" style={{ color: 'var(--text-primary)' }}>Knowledge Exchange</h1>
            <p className="text-[.68rem] tracking-widest" style={{ color: 'var(--text-tertiary)' }}>P2P ACADEMIC LIBRARY</p>
          </div>
        </div>
      </div>

      {/* ── Navigation ── */}
      <nav className="flex-1 p-4 space-y-0.5 overflow-y-auto">
        <p className="section-title mb-3 px-3">MENU</p>
        {userNav.map((item, i) => {
          const active = pathname === item.href;
          return (
            <Link key={item.name} href={item.href} className={`sidebar-link ${active ? 'active' : ''}`}>
              <span className="nav-icon">{icons[item.icon]}</span>
              <span>{item.name}</span>
              {active && (
                <motion.span
                  layoutId="sidebar-active-dot"
                  className="ml-auto w-1.5 h-1.5 rounded-full"
                  style={{ background: 'var(--accent)', boxShadow: '0 0 6px rgba(6, 214, 160, 0.5)' }}
                  transition={{ type: 'spring', stiffness: 350, damping: 30 }}
                />
              )}
            </Link>
          );
        })}

        {isAdmin && (
          <>
            <div className="my-3" style={{ borderTop: '1px solid var(--border-subtle)' }} />
            <p className="section-title mb-3 px-3 flex items-center gap-1.5">
              <Zap size={11} className="text-[var(--danger)]" />
              ADMIN
            </p>
            {adminNav.map(item => {
              const active = pathname === item.href;
              return (
                <Link key={item.name} href={item.href} className={`sidebar-link ${active ? 'active' : ''}`}>
                  <span className="nav-icon">{icons[item.icon]}</span>
                  <span>{item.name}</span>
                  {active && (
                    <motion.span
                      layoutId="sidebar-admin-dot"
                      className="ml-auto w-1.5 h-1.5 rounded-full"
                      style={{ background: 'var(--danger)', boxShadow: '0 0 6px rgba(244, 63, 94, 0.5)' }}
                      transition={{ type: 'spring', stiffness: 350, damping: 30 }}
                    />
                  )}
                </Link>
              );
            })}
          </>
        )}
      </nav>

      {/* ── Online Status Indicator ── */}
      <div className="px-5 pb-2">
        <div className="flex items-center gap-2 px-3 py-2 rounded-xl" style={{ background: 'rgba(6, 214, 160, 0.05)', border: '1px solid rgba(6, 214, 160, 0.08)' }}>
          <span className="status-dot online" />
          <span className="text-[.72rem] font-medium" style={{ color: 'var(--accent)' }}>System Online</span>
        </div>
      </div>

      {/* ── User / Logout ── */}
      <div className="p-4 pt-3" style={{ borderTop: '1px solid var(--border-subtle)' }}>
        <div className="flex items-center gap-3">
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center text-sm font-bold"
            style={{
              background: 'linear-gradient(135deg, var(--accent), #04b490)',
              color: 'var(--text-inverse)',
              boxShadow: '0 0 12px rgba(6, 214, 160, 0.15)',
            }}
          >
            {user?.username?.charAt(0).toUpperCase() || '?'}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold truncate" style={{ color: 'var(--text-primary)' }}>{user?.username}</p>
            <p className="text-[.68rem] font-medium" style={{ color: isAdmin ? 'var(--danger)' : 'var(--accent)' }}>
              {isAdmin ? '⚡ Admin' : user?.classification || 'User'}
            </p>
          </div>
          <button
            onClick={logout}
            className="p-2 rounded-xl transition-all duration-200"
            style={{ color: 'var(--text-tertiary)' }}
            onMouseEnter={e => {
              e.currentTarget.style.color = 'var(--danger)';
              e.currentTarget.style.background = 'var(--danger-dim)';
            }}
            onMouseLeave={e => {
              e.currentTarget.style.color = 'var(--text-tertiary)';
              e.currentTarget.style.background = 'transparent';
            }}
            title="Logout"
          >
            {icons.logout}
          </button>
        </div>
      </div>
    </aside>
  );
}
