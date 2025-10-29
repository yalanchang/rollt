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
        <aside className="w-64 bg-white border-r border-gray-200 p-6 sticky top-0 h-full min-h-screen flex flex-col overflow-y-auto">
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-primary">Rollt</h1>
            </div>

            <nav className="space-y-4 mb-8">
                <NavLink href="/" icon={<BiHomeAlt />} label="首頁" />
                <NavLink href="/explore" icon={<FiSearch />} label="探索" />
                <NavLink href="/create" icon={<BiPlus />} label="發佈" />
            </nav>

            {user && (
                <div className="mt-auto pt-4 space-y-4 flex flex-col items-center ">
                    <button
                        onClick={() => router.push('/profile')}
                        className="w-full flex items-center gap-3 justify-center cursor-pointer m-2"
                    >
                        <div className="flex items-center justify-center  gap-3 w-full">
                            <div className="w-10 h-10 rounded-full bg-gray-400 flex items-center text-white justify-center font-bold">
                                {user.username[0].toUpperCase()}
                            </div>
                            <div className="flex ">
                                <p className="font-semibold text-sm text-center">{user.username}</p>
                            </div>

                        </div>
                    </button>
                    <button
                        onClick={handleLogout}
                        className="w-full flex items-center justify-center  p-2 text-red-600 hover:text-red-700 rounded-lg transition font-semibold"
                    >
                        登出
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