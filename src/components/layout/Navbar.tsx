'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ThemeToggle } from '@/components/shared/ThemeToggle';
import { Globe, Sparkles, Settings } from 'lucide-react';
import { motion } from 'framer-motion';

const navLinks = [
  { href: '/', label: 'Home' },
  { href: '/translate', label: 'Translate' },
  { href: '/voice', label: 'Voice' },
  { href: '/camera', label: 'Camera' },
  { href: '/conversation', label: 'Conversation' },
  { href: '/assistant', label: 'Assistant' },
  { href: '/learn', label: 'Learn' },
  { href: '/history', label: 'History' },
];

export function Navbar() {
  const pathname = usePathname();

  return (
    <motion.header
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.4 }}
      className="fixed top-0 left-0 right-0 z-50 h-[var(--nav-height)] glass border-b border-border"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-full flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 group">
          <div className="relative w-9 h-9 rounded-xl gradient-primary flex items-center justify-center shadow-lg group-hover:shadow-glow transition-shadow duration-300">
            <Globe className="w-5 h-5 text-white" />
            <Sparkles className="absolute -top-1 -right-1 w-3.5 h-3.5 text-accent" />
          </div>
          <span className="text-lg font-bold gradient-text hidden sm:block">
            TranslateGPT
          </span>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-1" id="desktop-nav">
          {navLinks.map((link) => {
            const isActive = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`relative px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                  isActive
                    ? 'text-primary'
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

        {/* Right side */}
        <div className="flex items-center gap-1.5">
          <Link
            href="/settings"
            className={`p-2 rounded-lg transition-all duration-200 hover:bg-bg-glass text-text-secondary hover:text-text-primary ${
              pathname === '/settings' ? 'text-primary bg-primary/10' : ''
            }`}
            title="Settings"
            id="settings-link"
          >
            <Settings className="w-5 h-5" />
          </Link>
          <ThemeToggle />
        </div>
      </div>
    </motion.header>
  );
}
