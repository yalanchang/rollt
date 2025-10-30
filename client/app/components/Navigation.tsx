'use client';

import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faHome, faUser, faPlus, faCompass, faHeart } from '@fortawesome/free-solid-svg-icons';

export default function Navigation() {
  const router = useRouter();
  const pathname = usePathname();
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('token');
    setIsLoggedIn(!!token);
  }, [pathname]);

  if (pathname === '/login' || pathname === '/register') {
    return null;
  }

  if (!isLoggedIn) {
    return null;
  }

  const navItems = [
    { path: '/', icon: faHome, label: '首頁' },
    { path: '/explore', icon: faCompass, label: '探索' },
    { path: '/create', icon: faPlus, label: '發布' },
    { path: '/profile', icon: faUser, label: '個人' },
  ];

  return (
    <>
      {/* 頂部導航 (桌面版) */}
      <nav className="hidden md:block sticky top-0 z-50 bg-white border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            <h1
              onClick={() => router.push('/')}
              className="text-2xl font-bold bg-primary bg-clip-text text-transparent cursor-pointer"
            >
              Rollt
            </h1>

            <div className="flex items-center gap-8">
              {navItems.map((item) => (
                <button
                  key={item.path}
                  onClick={() => router.push(item.path)}
                  className={`text-2xl ${pathname === item.path
                      ? 'opacity-100'
                      : 'opacity-60 hover:opacity-100'
                    } transition`}
                  title={item.label}
                >
                  <FontAwesomeIcon icon={item.icon} />
                </button>
              ))}
            </div>
          </div>
        </div>
      </nav>

      {/* 底部導航 (手機版) */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-50">
        <div className="flex items-center justify-around h-16">
          {navItems.map((item) => (
            <button
              key={item.path}
              onClick={() => router.push(item.path)}
              className={`flex flex-col items-center gap-1 p-2 ${pathname === item.path
                  ? 'text-pink-500'
                  : 'text-gray-600'
                }`}
            >
              <span className="text-xl">
                <FontAwesomeIcon icon={item.icon} size="lg" />
              </span>
              <span className="text-xs">{item.label}</span>
            </button>
          ))}
        </div>
      </nav>
    </>
  );
}