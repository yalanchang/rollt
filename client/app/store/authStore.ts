import { create } from 'zustand';

export interface User {
    id?: number;
    username: string;
    email: string;
    avatar?: string;
}

interface AuthStore {
    user: User | null;
    isLoggedIn: boolean;
    setUser: (user: User) => void;
    logout: () => void;
    login: (user: User) => void;
}

export const useAuthStore = create<AuthStore>((set) => {
    const savedUser = typeof window !== 'undefined'
        ? JSON.parse(localStorage.getItem('user') || 'null')
        : null;

    return {
        user: savedUser,
        isLoggedIn: !!savedUser,

        setUser: (user: User | null) => {
            set({
                user,
                isLoggedIn: user !== null
            });
        },

        logout: () => set({ user: null, isLoggedIn: false }),

        login: (user) => set({ user, isLoggedIn: true }),
    }
});