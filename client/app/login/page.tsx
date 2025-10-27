'use client';

import { useState } from 'react';
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

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setServerError('');
    setLoading(true);

    console.log('🔐 開始登入...');
    console.log('📧 信箱:', email);

    try {
      console.log('🌐 調用 API:', `${API_URL}/auth/login`);

      const response = await axios.post(`${API_URL}/auth/login`, {
        email,
        password,
      });

      console.log('✅ 登入成功:', response.data);

      // 1️⃣ 先保存 token
      const token = response.data.token;
      localStorage.setItem('token', token);
      console.log('📝 Token 已保存');

      // 2️⃣ 保存用戶信息
      const userData = {
        id: response.data.user.id,
        username: response.data.user.username,
        email: response.data.user.email,
      };
      localStorage.setItem('user', JSON.stringify(userData));
      console.log('👤 用戶信息已保存:', userData);

      // 3️⃣ 更新 Zustand 狀態
      setUser(userData);
      console.log('🔄 Zustand 狀態已更新');

      // 4️⃣ 延遲重定向
      console.log('⏳ 準備重定向...');
      setTimeout(() => {
        console.log('🚀 重定向到首頁');
        router.push('/');
      }, 500);

    } catch (err: any) {
      console.error('❌ 登入錯誤:', err);

      if (err.response?.data?.message) {
        console.log('📛 後端返回錯誤:', err.response.data.message);
        setError(err.response.data.message);
      } else if (err.message === 'Network Error') {
        console.log('🌐 網絡錯誤 - 後端無法連接');
        setServerError(
          '無法連接到服務器。請確保後端服務運行在 http://localhost:5000'
        );
      } else {
        console.log('⚠️ 未知錯誤:', err.message);
        setError('登入失敗，請稍後重試');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-400 to-purple-600 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-2xl p-8 max-w-md w-full">
        {/* Logo */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-pink-500">Rollt</h1>
          <p className="text-gray-600 mt-2">分享你的精彩時刻</p>
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
              placeholder="your@email.com"
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
            disabled={loading}
            className="w-full bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600 text-white font-semibold py-2 rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? '登入中...' : '登入'}
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
              className="text-pink-500 font-semibold hover:underline ml-1"
            >
              立即註冊
            </a>
          </p>
        </div>

        {/* 幫助信息 */}
        <div className="mt-6 p-3 bg-blue-50 text-blue-700 rounded-lg text-xs border border-blue-200">
          <p className="font-semibold mb-2">💡 提示：</p>
          <p className="mb-1">
            • 後端需要運行在 http://localhost:5000
          </p>
          <p className="mb-1">
            • MySQL 數據庫需要啟動
          </p>
          <p>
            • 打開瀏覽器 F12 → Console 看詳細日誌
          </p>
        </div>
      </div>
    </div>
  );
}