
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import { useAuthStore } from '@/app/store/authStore';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

export default function RegisterPage() {
  const router = useRouter();
  const setUser = useAuthStore((state) => state.setUser);
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [serverError, setServerError] = useState('');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setServerError('');
    setLoading(true);


    // 本地驗證
    if (formData.password !== formData.confirmPassword) {
      console.log('❌ 密碼不一致');
      setError('兩次輸入的密碼不一致');
      setLoading(false);
      return;
    }

    if (formData.password.length < 6) {
      console.log('❌ 密碼太短');
      setError('密碼至少需要 6 個字符');
      setLoading(false);
      return;
    }

    try {

      const response = await axios.post(`${API_URL}/auth/register`, {
        username: formData.username,
        email: formData.email,
        password: formData.password,
      });


      const token = response.data.token;
      localStorage.setItem('token', token);
      console.log('📝 Token 已保存');

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
      console.error('❌ 註冊錯誤:', err);

      if (err.response?.data?.message) {
        setError(err.response.data.message);
      } else if (err.message === 'Network Error') {
        setServerError(
          '無法連接到服務器。請確保後端服務運行在 http://localhost:5000'
        );
      } else {
        setError('註冊失敗，請稍後重試');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary to-primary flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-2xl p-8 max-w-md w-full">
        {/* Logo */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-primary">Rollt</h1>
        </div>

        {/* 伺服器錯誤 */}
        {serverError && (
          <div className="mb-4 p-3 bg-yellow-100 text-yellow-800 rounded-lg text-sm border border-yellow-300">
            <p className="font-semibold"> {serverError}</p>
          </div>
        )}

        {/* 註冊錯誤 */}
        {error && (
          <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-lg text-sm">
            {error}
          </div>
        )}

        {/* 註冊表單 */}
        <form onSubmit={handleRegister} className="space-y-4">
          {/* 用戶名 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              用戶名
            </label>
            <input
              type="text"
              name="username"
              value={formData.username}
              onChange={handleChange}
              placeholder="輸入用戶名"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent outline-none transition text-gray-900"
              required
            />
          </div>

          {/* 信箱 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              信箱
            </label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="輸入信箱"
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
              name="password"
              value={formData.password}
              onChange={handleChange}
              placeholder="輸入至少 6 位密碼"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent outline-none transition text-gray-900"
              required
            />
          </div>

          {/* 確認密碼 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              確認密碼
            </label>
            <input
              type="password"
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleChange}
              placeholder="再次輸入密碼"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent outline-none transition text-gray-900"
              required
            />
          </div>

          {/* 註冊按鈕 */}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-primary to-primary hover:from-sec hover:to-sec text-white font-semibold py-2 rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? '註冊中...' : '建立帳號'}
          </button>
        </form>

        {/* 分隔線 */}
        <div className="mt-6 flex items-center">
          <div className="flex-1 border-t border-gray-300"></div>
          <span className="px-2 text-gray-500 text-sm">或</span>
          <div className="flex-1 border-t border-gray-300"></div>
        </div>

        {/* 登入連結 */}
        <div className="mt-6 text-center">
          <p className="text-gray-600 text-sm">
            已有帳號？
            <a
              href="/login"
              className="text-primary font-semibold hover:underline ml-1"
            >
              立即登入
            </a>
          </p>
        </div>

      
      </div>
    </div>
  );
}