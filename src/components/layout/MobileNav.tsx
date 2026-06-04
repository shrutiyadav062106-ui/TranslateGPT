'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Languages, MessageSquare, BookOpen, Settings } from 'lucide-react';
import { motion } from 'framer-motion';

const tabs = [
  { href: '/', label: 'Home', icon: Home },
  { href: '/translate', label: 'Translate', icon: Languages },
  { href: '/conversation', label: 'Conversation', icon: MessageSquare },
  { href: '/learn', label: 'Learn', icon: BookOpen },
  { href: '/settings', label: 'Settings', icon: Settings },
];

export function MobileNav() {
  const pathname = usePathname();

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 glass border-t border-border md:hidden"
      id="mobile-nav"
    >
      <div className="flex items-center justify-around h-[var(--mobile-nav-height)] px-1">
        {tabs.map((tab) => {
          const isActive = pathname === tab.href;
          const Icon = tab.icon;
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={`relative flex flex-col items-center justify-center gap-0.5 px-2 py-1.5 rounded-xl transition-all duration-200 min-w-[52px] ${
                isActive
                  ? 'text-primary'
                  : 'text-text-tertiary hover:text-text-secondary'
              }`}
            >
              {isActive && (
                <motion.div
                  layoutId="mobile-nav-bg"
                  className="absolute inset-0 bg-primary/10 rounded-xl"
                  transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                />
              )}
              <Icon className="w-5 h-5 relative z-10" strokeWidth={isActive ? 2.5 : 2} />
              <span className="text-[10px] font-medium relative z-10">{tab.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
