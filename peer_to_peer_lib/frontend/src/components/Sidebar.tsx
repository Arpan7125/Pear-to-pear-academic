'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/lib/auth';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import ThemeToggle from '@/components/ThemeToggle';

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
  UserCircle,
  ChevronRight,
  ChevronLeft,
} from 'lucide-react';

const icons: Record<string, React.ReactNode> = {
  dashboard: <LayoutDashboard size={20} strokeWidth={1.8} />,
  profile: <UserCircle size={20} strokeWidth={1.8} />,
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
  { name: 'Profile', href: '/profile', icon: 'profile' },
  { name: 'Library', href: '/library', icon: 'library' },
  { name: 'Search', href: '/search', icon: 'search' },
  { name: 'My Files', href: '/my-files', icon: 'myfiles' },
  { name: 'Upload', href: '/upload', icon: 'upload' },
  { name: 'Peers', href: '/peers', icon: 'peers' },
  { name: 'Leaderboard', href: '/leaderboard', icon: 'leaderboard' },
];

const adminNav = [
  { name: 'Dashboard', href: '/admin', icon: 'analytics' },
  { name: 'Users', href: '/admin/users', icon: 'users' },
  { name: 'Resources', href: '/admin/resources', icon: 'resources' },
  { name: 'Stats', href: '/admin/stats', icon: 'settings' },
];

export default function Sidebar() {
  const pathname = usePathname();
  const { user, isAdmin, logout } = useAuth();
  const [expanded, setExpanded] = useState(false);

  return (
    <motion.aside
      className="floating-sidebar"
      animate={{ width: expanded ? 220 : 68 }}
      transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] as const }}
      onMouseEnter={() => setExpanded(true)}
      onMouseLeave={() => setExpanded(false)}
    >
      {/* ── Logo ── */}
      <div className="floating-sidebar-logo">
        <div className="floating-sidebar-logo-icon">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth={2.2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
          </svg>
        </div>
        <AnimatePresence>
          {expanded && (
            <motion.div
              className="overflow-hidden whitespace-nowrap"
              initial={{ opacity: 0, width: 0 }}
              animate={{ opacity: 1, width: 'auto' }}
              exit={{ opacity: 0, width: 0 }}
              transition={{ duration: 0.2 }}
            >
              <span className="text-[.82rem] font-bold" style={{ color: 'var(--text-primary)' }}>
                Knowledge Exchange
              </span>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ── Expand toggle ── */}
      <button
        className="floating-sidebar-toggle"
        onClick={() => setExpanded(!expanded)}
        title={expanded ? 'Collapse' : 'Expand'}
      >
        {expanded ? <ChevronLeft size={14} /> : <ChevronRight size={14} />}
      </button>

      {/* ── Nav Links ── */}
      <nav className="floating-sidebar-nav hide-scrollbar">
        {userNav.map((item) => {
          const active = pathname === item.href;
          return (
            <Link key={item.name} href={item.href} className="floating-sidebar-tooltip-wrapper">
              <motion.div
                className={`floating-sidebar-link ${active ? 'active' : ''}`}
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
              >
                <span className="floating-sidebar-icon">{icons[item.icon]}</span>
                <AnimatePresence>
                  {expanded && (
                    <motion.span
                      className="floating-sidebar-label"
                      initial={{ opacity: 0, width: 0 }}
                      animate={{ opacity: 1, width: 'auto' }}
                      exit={{ opacity: 0, width: 0 }}
                      transition={{ duration: 0.2 }}
                    >
                      {item.name}
                    </motion.span>
                  )}
                </AnimatePresence>
                {active && (
                  <motion.div
                    className="floating-sidebar-active-indicator"
                    layoutId="floating-active"
                    transition={{ type: 'spring', stiffness: 350, damping: 30 }}
                  />
                )}
              </motion.div>

              {/* Tooltip (collapsed only) */}
              {!expanded && (
                <div className="floating-sidebar-tooltip">{item.name}</div>
              )}
            </Link>
          );
        })}

        {/* ── Admin section ── */}
        {isAdmin && (
          <>
            <div className="floating-sidebar-divider" />
            <AnimatePresence>
              {expanded && (
                <motion.p
                  className="floating-sidebar-section-label"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                >
                  <Zap size={10} style={{ color: 'var(--danger)' }} />
                  ADMIN
                </motion.p>
              )}
            </AnimatePresence>
            {!expanded && (
              <div className="flex justify-center py-0.5">
                <Zap size={10} style={{ color: 'var(--danger)' }} />
              </div>
            )}
            {adminNav.map((item) => {
              const active = pathname === item.href;
              return (
                <Link key={item.name} href={item.href} className="floating-sidebar-tooltip-wrapper">
                  <motion.div
                    className={`floating-sidebar-link ${active ? 'active' : ''}`}
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.97 }}
                  >
                    <span className="floating-sidebar-icon">{icons[item.icon]}</span>
                    <AnimatePresence>
                      {expanded && (
                        <motion.span
                          className="floating-sidebar-label"
                          initial={{ opacity: 0, width: 0 }}
                          animate={{ opacity: 1, width: 'auto' }}
                          exit={{ opacity: 0, width: 0 }}
                          transition={{ duration: 0.2 }}
                        >
                          {item.name}
                        </motion.span>
                      )}
                    </AnimatePresence>
                    {active && (
                      <motion.div
                        className="floating-sidebar-active-indicator admin"
                        layoutId="floating-admin-active"
                        transition={{ type: 'spring', stiffness: 350, damping: 30 }}
                      />
                    )}
                  </motion.div>
                  {!expanded && (
                    <div className="floating-sidebar-tooltip">{item.name}</div>
                  )}
                </Link>
              );
            })}
          </>
        )}
      </nav>

      {/* ── User & Theme / Logout ── */}
      <div className="floating-sidebar-footer flex flex-col gap-3">
        {/* Theme Toggle Area */}
        <div className={`flex ${!expanded ? 'justify-center' : 'items-center justify-between px-1'} transition-all`}>
          <AnimatePresence>
            {expanded && (
              <motion.span
                className="text-[.72rem] font-bold tracking-wide uppercase"
                style={{ color: 'var(--text-tertiary)' }}
                initial={{ opacity: 0, width: 0 }}
                animate={{ opacity: 1, width: 'auto' }}
                exit={{ opacity: 0, width: 0 }}
              >
                Theme
              </motion.span>
            )}
          </AnimatePresence>
          <div className={!expanded ? 'scale-[0.85]' : 'scale-100'} style={{ transition: 'transform 0.2s', transformOrigin: 'center' }}>
            <ThemeToggle />
          </div>
        </div>

        <div className="floating-sidebar-divider" style={{ margin: '4px 0' }} />

        {/* User Info */}
        <div className={`floating-sidebar-user ${expanded ? 'expanded' : ''}`}>
          <div className="floating-sidebar-avatar">
            {user?.username?.charAt(0).toUpperCase() || '?'}
          </div>
          <AnimatePresence>
            {expanded && (
              <motion.div
                className="overflow-hidden whitespace-nowrap min-w-0 flex-1"
                initial={{ opacity: 0, width: 0 }}
                animate={{ opacity: 1, width: 'auto' }}
                exit={{ opacity: 0, width: 0 }}
                transition={{ duration: 0.2 }}
              >
                <p className="text-xs font-semibold truncate" style={{ color: 'var(--text-primary)' }}>{user?.username}</p>
                <p className="text-[.6rem] font-medium" style={{ color: isAdmin ? 'var(--danger)' : 'var(--accent)' }}>
                  {isAdmin ? '\u26A1 Admin' : user?.classification || 'User'}
                </p>
              </motion.div>
            )}
          </AnimatePresence>
          <AnimatePresence>
            {expanded && (
              <motion.button
                onClick={logout}
                className="floating-sidebar-logout"
                title="Logout"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                whileHover={{ scale: 1.1 }}
              >
                <LogOut size={15} />
              </motion.button>
            )}
          </AnimatePresence>
        </div>
      </div>
    </motion.aside>
  );
}
