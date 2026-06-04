'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { ThemeToggle } from '@/components/shared/ThemeToggle';
import { Globe, Sparkles, Settings, Search, Bell, LogOut, User, Menu, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuthStore } from '@/stores/auth-store';

const navLinks = [
  { href: '/', label: 'Home' },
  { href: '/translate', label: 'Translate' },
  { href: '/voice', label: 'Voice' },
  { href: '/camera', label: 'Camera' },
  { href: '/conversation', label: 'Conversation' },
  { href: '/assistant', label: 'AI Tutor' },
  { href: '/learn', label: 'Learn' },
  { href: '/library', label: 'Library' },
];

export function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const { currentUser, logout, notifications, markNotificationRead } = useAuthStore();
  
  const [profileOpen, setProfileOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const profileRef = useRef<HTMLDivElement>(null);
  const notifRef = useRef<HTMLDivElement>(null);

  // Close menus on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
        setProfileOpen(false);
      }
      if (notifRef.current && !notifRef.current.contains(event.target as Node)) {
        setNotifOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
      setSearchQuery('');
    }
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  const initials = currentUser
    ? currentUser.name
        .split(' ')
        .map(n => n[0])
        .join('')
        .slice(0, 2)
        .toUpperCase()
    : '';

  return (
    <motion.header
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.4 }}
      className="fixed top-0 left-0 right-0 z-50 h-[var(--nav-height)] glass border-b border-border"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-full flex items-center justify-between gap-4">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 group flex-shrink-0">
          <div className="relative w-9 h-9 rounded-xl gradient-primary flex items-center justify-center shadow-lg group-hover:shadow-glow transition-shadow duration-300">
            <Globe className="w-5 h-5 text-white" />
            <Sparkles className="absolute -top-1 -right-1 w-3.5 h-3.5 text-accent" />
          </div>
          <span className="text-lg font-bold gradient-text hidden lg:block">
            TranslateGPT
          </span>
        </Link>

        {/* Global Search Bar (Centered/Interactive) */}
        {currentUser && (
          <form onSubmit={handleSearchSubmit} className="hidden md:flex items-center relative max-w-xs flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-tertiary" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search history, library, lessons..."
              className="w-full pl-9 pr-4 py-1.5 rounded-full bg-bg-secondary text-text-primary text-xs border border-border focus:border-primary/50 focus:outline-none placeholder:text-text-tertiary/50"
            />
          </form>
        )}

        {/* Desktop Navigation */}
        <nav className="hidden xl:flex items-center gap-1" id="desktop-nav">
          {navLinks.map((link) => {
            const isActive = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`relative px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200 ${
                  isActive
                    ? 'text-primary bg-primary/5'
                    : 'text-text-secondary hover:text-text-primary hover:bg-bg-glass'
                }`}
              >
                {link.label}
                {isActive && (
                  <motion.div
                    layoutId="nav-indicator"
                    className="absolute bottom-0 left-1/2 -translate-x-1/2 w-5 h-0.5 rounded-full bg-primary"
                    transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                  />
                )}
              </Link>
            );
          })}
        </nav>

        {/* Right Actions */}
        <div className="flex items-center gap-2 ml-auto flex-shrink-0">
          <ThemeToggle />

          {currentUser ? (
            <>
              {/* Notification Dropdown */}
              <div className="relative" ref={notifRef}>
                <button
                  onClick={() => setNotifOpen(!notifOpen)}
                  className={`p-2 rounded-lg transition-colors hover:bg-bg-glass text-text-secondary hover:text-text-primary relative ${notifOpen ? 'bg-primary/10 text-primary' : ''}`}
                >
                  <Bell className="w-4.5 h-4.5" />
                  {unreadCount > 0 && (
                    <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-red-500 ring-2 ring-bg-primary" />
                  )}
                </button>

                <AnimatePresence>
                  {notifOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 10 }}
                      className="absolute right-0 mt-2 z-50 w-72 glass-card p-3 shadow-xl max-h-96 overflow-y-auto"
                    >
                      <h4 className="text-xs font-bold text-text-primary mb-3 pb-2 border-b border-border flex justify-between items-center">
                        <span>Notifications</span>
                        {unreadCount > 0 && <span className="px-2 py-0.5 rounded bg-primary/20 text-primary text-[9px]">{unreadCount} Unread</span>}
                      </h4>
                      <div className="space-y-2">
                        {notifications.length === 0 ? (
                          <p className="text-[10px] text-text-tertiary text-center py-6">No notifications yet.</p>
                        ) : (
                          notifications.map((notif) => (
                            <div
                              key={notif.id}
                              onClick={() => markNotificationRead(notif.id)}
                              className={`p-2.5 rounded-xl border text-left transition-colors cursor-pointer ${
                                notif.read
                                  ? 'bg-transparent border-transparent text-text-tertiary'
                                  : 'bg-primary/5 border-primary/10 text-text-primary'
                              }`}
                            >
                              <p className="text-xs font-bold flex items-center gap-1.5">
                                {notif.type === 'streak' && '🔥'}
                                {notif.type === 'milestone' && '🏆'}
                                {notif.type === 'review' && '📚'}
                                {notif.title}
                              </p>
                              <p className="text-[10px] text-text-secondary mt-1">{notif.desc}</p>
                            </div>
                          ))
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Profile Menu Dropdown */}
              <div className="relative" ref={profileRef}>
                <button
                  onClick={() => setProfileOpen(!profileOpen)}
                  className="flex items-center gap-2 p-1 rounded-xl glass border border-border hover:border-primary/40 transition-colors"
                >
                  <div className="w-7 h-7 rounded-lg bg-primary text-white flex items-center justify-center font-bold text-xs">
                    {initials || <User className="w-4 h-4" />}
                  </div>
                </button>

                <AnimatePresence>
                  {profileOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 10 }}
                      className="absolute right-0 mt-2 z-50 w-56 glass-card p-3 shadow-xl"
                    >
                      <div className="pb-3 mb-2 border-b border-border">
                        <p className="text-xs font-bold text-text-primary truncate">{currentUser.name}</p>
                        <p className="text-[10px] text-text-tertiary truncate mt-0.5">{currentUser.email}</p>
                      </div>

                      <div className="space-y-1">
                        <Link
                          href="/settings"
                          onClick={() => setProfileOpen(false)}
                          className="flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg text-xs font-medium text-text-secondary hover:text-text-primary hover:bg-bg-glass transition-colors"
                        >
                          <Settings className="w-4 h-4" />
                          Settings
                        </Link>
                        <button
                          onClick={() => {
                            setProfileOpen(false);
                            logout();
                            router.push('/');
                          }}
                          className="w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg text-xs font-medium text-red-400 hover:text-red-500 hover:bg-red-500/10 transition-colors"
                        >
                          <LogOut className="w-4 h-4" />
                          Logout
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </>
          ) : (
            <Link
              href="/auth/login"
              className="btn-primary py-2 px-4 rounded-xl text-xs font-bold shadow-md"
            >
              Sign In
            </Link>
          )}
        </div>
      </div>
    </motion.header>
  );
}
