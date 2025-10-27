'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { BiHomeAlt, BiPlus, BiLogOut } from 'react-icons/bi';
import { FiSearch } from 'react-icons/fi';
import { useAuthStore } from '@/app/store/authStore';

export default function Sidebar() {
    const router = useRouter();
    const { user, logout } = useAuthStore();

    const handleLogout = () => {
        logout();
        router.push('/login');
    };

    return (
        <aside className="w-64 bg-white border-r border-gray-200 p-6 sticky top-0 h-screen overflow-y-auto">
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-pink-500">Rollt</h1>
            </div>

            <nav className="space-y-4 mb-8">
                <NavLink href="/" icon={<BiHomeAlt />} label="首頁" />
                <NavLink href="/explore" icon={<FiSearch />} label="探索" />
                <NavLink href="/create" icon={<BiPlus />} label="發佈" />
            </nav>

            {user && (
                <div className="mt-auto pt-4 border-t space-y-4">
                    <button
                        onClick={() => router.push('/profile')}
                        className="w-full flex items-center gap-3 p-3 bg-gray-50 hover:bg-gray-100 rounded-lg transition cursor-pointer"
                    >
                    <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-r from-pink-400 to-purple-400 flex items-center justify-center text-white font-bold">
                            {user.username[0].toUpperCase()}
                        </div>
                        <div className="flex-1">
                            <p className="font-semibold text-sm">{user.username}</p>
                            <p className="text-xs text-gray-500">{user.email}</p>
                        </div>
                        
                    </div>
                    </button>
                    <button
                        onClick={handleLogout}
                        className="w-full flex items-center justify-center gap-2 px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg transition"
                    >
                        <BiLogOut /> 登出
                    </button>
                </div>
            )}
        </aside>
    );
}

function NavLink({
    href,
    icon,
    label,
}: {
    href: string;
    icon: React.ReactNode;
    label: string;
}) {
    return (
        <Link
            href={href}
            className="flex items-center gap-4 px-4 py-3 text-gray-900 hover:bg-gray-100 rounded-lg transition font-semibold"
        >
            {icon}
            {label}
        </Link>
    );
}