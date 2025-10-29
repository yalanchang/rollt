'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import { useAuthStore } from '@/app/store/authStore';

const API_URL = process.env.NEXT_PUBLIC_API_URL ;

console.log('📍 API_URL:', API_URL);

export default function LoginPage() {
  const router = useRouter();
  const setUser = useAuthStore((state) => state.setUser);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [serverError, setServerError] = useState('');
  const [showAnimation, setShowAnimation] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setShowAnimation(false);
    }, 2500); 
    return () => clearTimeout(timer);
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setServerError('');
    setLoading(true);


    try {
      const response = await axios.post(`${API_URL}/auth/login`, {
        email,
        password,
      });

      const token = response.data.token;
      localStorage.setItem('token', token);
      const userData = {
        id: response.data.user.id,
        username: response.data.user.username,
        email: response.data.user.email,
    
      };
      localStorage.setItem('user', JSON.stringify(userData));

      setUser(userData);

      setTimeout(() => {
        router.push('/');
      }, 500);

    } catch (err: any) {
      console.error('❌ 登入錯誤:', err);

      if (err.response?.data?.message) {
        setError(err.response.data.message);
      } else if (err.message === 'Network Error') {
        setServerError(
          '無法連接到服務器。請確保後端服務運行在 http://localhost:5000'
        );
      } else {
        setError('登入失敗，請稍後重試');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary to-primary flex items-center justify-center p-4 relative">
      {/* 啟動動畫 */}
      {showAnimation && (
        <div 
          className="absolute inset-0 flex items-center justify-center z-50 bg-gradient-to-br from-primary to-primary"
          style={{
            animation: 'fadeOut 0.5s ease-out 2s forwards'
          }}
        >
          <div className="text-center">
            <h1 
              className="text-7xl font-bold text-white mb-4"
              style={{
                animation: 'slideInScale 1s ease-out, float 2s ease-in-out infinite'
              }}
            >
              Rollt
            </h1>
            <div className="flex gap-2 justify-center mt-6">
              <div 
                className="w-3 h-3 bg-white rounded-full"
                style={{
                  animation: 'bounce 0.6s ease-in-out infinite'
                }}
              ></div>
           
              <div 
                className="w-3 h-3 bg-white rounded-full"
                style={{
                  animation: 'bounce 0.6s ease-out 0.2s infinite'
                }}
              ></div>
            </div>
          </div>
        </div>
      )}

      {/* 登入表單 */}
      <div 
        className="bg-white rounded-lg shadow-2xl p-8 max-w-md w-full"
        style={{
          opacity: showAnimation ? 0 : 1,
          transition: 'opacity 0.2s ease-out'
        }}
      >
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-primary">Rollt</h1>
        </div>

        {/* 伺服器錯誤 */}
        {serverError && (
          <div className="mb-4 p-3 bg-yellow-100 text-yellow-800 rounded-lg text-sm border border-yellow-300">
            <p className="font-semibold">⚠️ {serverError}</p>
          </div>
        )}

        {/* 登入錯誤 */}
        {error && (
          <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-lg text-sm">
            {error}
          </div>
        )}

        {/* 登入表單 */}
        <form onSubmit={handleLogin} className="space-y-4">
          {/* 信箱 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              信箱
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="輸入您的信箱"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent outline-none transition text-gray-900"
              required
            />
          </div>

          {/* 密碼 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              密碼
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent outline-none transition text-gray-900"
              required
            />
          </div>

          {/* 登入按鈕 */}
          <button
            type="submit"
            className="w-full bg-gradient-to-br from-primary to-primary hover:from-sec  text-white font-semibold py-2 rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            登入
          </button>
        </form>

        {/* 分隔線 */}
        <div className="mt-6 flex items-center">
          <div className="flex-1 border-t border-gray-300"></div>
          <span className="px-2 text-gray-500 text-sm">或</span>
          <div className="flex-1 border-t border-gray-300"></div>
        </div>

        {/* 註冊連結 */}
        <div className="mt-6 text-center">
          <p className="text-gray-600 text-sm">
            還沒有帳號？
            <a
              href="/register"
              className="text-primary font-semibold hover:underline ml-1"
            >
              立即註冊
            </a>
          </p>
        </div>

        
      </div>
    </div>
  );
}