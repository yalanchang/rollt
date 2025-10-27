'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore , type User } from '@/app/store/authStore';




const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

interface Post {
  id: number;
  imageUrl: string;
  caption: string;
  likes: number;
  comments: number;
}


export default function ProfilePage() {
  const router = useRouter();
  const { user, setUser } = useAuthStore() ;
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;

  const [formData, setFormData] = useState({
    username: user?.username || '',
    email: user?.email || '',
    bio: '分享我的精彩時刻 📸',
    avatar: '',
  });

  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    if (!user) {
      router.push('/login');
    }
  }, [user, router]);

  if (!mounted || !user) {
    return null;  
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSave = async () => {
    setError('');
    setSuccess('');
    setLoading(true);

    try {

      const updatedUser: User = {
        id: user?.id || 0,
        username: formData.username,
        email: formData.email,
        avatar: formData.avatar,
      };

      localStorage.setItem('user', JSON.stringify(updatedUser));
      setUser(updatedUser);
      

      console.log('個人資料已保存');
      setIsEditing(false);

      setTimeout(() => {
        setSuccess('');
      }, 2000);
    } catch (err) {
      console.error(' 保存失敗:', err);
      setError('保存失敗，請稍後重試');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    if (confirm('確定要登出嗎？')) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      setUser(null as any);
      router.push('/login');
    }
  };

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-white">
        
      {/* 頂部導航 */}
      <div className="border-b border-gray-200 sticky top-0 z-10 bg-white">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900">{user.username}</h1>
          <button
            onClick={() => setIsEditing(!isEditing)}
            className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg font-semibold text-gray-900 transition"
          >
            {isEditing ? '取消' : '編輯個人資料'}
          </button>
        </div>
      </div>

      {/* 主要內容 */}
      <div className="max-w-4xl mx-auto">
        {/* 個人資料部分（IG 風格） */}
        <div className="border-b border-gray-200 px-4 py-12">
          <div className="flex gap-8 items-start">
            {/* 頭像 */}
            <div className="flex-shrink-0">
              <div className="w-32 h-32 rounded-full bg-gradient-to-br from-pink-400 to-purple-500 flex items-center justify-center text-white text-5xl font-bold">
                {user.username[0].toUpperCase()}
              </div>
            </div>

            {/* 用戶信息 */}
            <div className="flex-1">
              <div className="flex items-center gap-4 mb-4">
                <h2 className="text-2xl font-bold text-gray-900">{user.username}</h2>
              </div>

              <div className="flex gap-8 mb-4 text-gray-600">
                <div>
                  <span className="font-bold text-gray-900">0</span> 個貼文
                </div>
                <div>
                  <span className="font-bold text-gray-900">0</span> 粉絲
                </div>
                <div>
                  <span className="font-bold text-gray-900">0</span> 追蹤
                </div>
              </div>

              {!isEditing && (
                <div>
                  <p className="font-semibold text-gray-900">{user.username}</p>
                  <p className="text-gray-600 mt-2">{formData.bio}</p>
                  <p className="text-gray-500 text-sm mt-2">{user.email}</p>
                </div>
              )}

              {/* 編輯表單 */}
              {isEditing && (
                <div className="space-y-4 mt-4">
                  <div>
                    <input
                      type="text"
                      name="username"
                      value={formData.username}
                      onChange={handleChange}
                      placeholder="用戶名"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 outline-none text-gray-900"
                    />
                  </div>

                  <div>
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      placeholder="信箱"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 outline-none text-gray-900"
                    />
                  </div>

                  <div>
                    <textarea
                      name="bio"
                      value={formData.bio}
                      onChange={handleChange}
                      placeholder="個人簡介"
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 outline-none text-gray-900"
                    />
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={handleSave}
                      disabled={loading}
                      className="flex-1 bg-blue-500 hover:bg-blue-600 text-white font-semibold py-2 rounded-lg transition disabled:opacity-50"
                    >
                      {loading ? '保存中...' : ' 保存'}
                    </button>
                    <button
                      onClick={() => setIsEditing(false)}
                      className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-900 font-semibold py-2 rounded-lg transition"
                    >
                       取消
                    </button>
                  </div>
                </div>
              )}

              {success && <p className="text-green-500 text-sm mt-2">{success}</p>}
              {error && <p className="text-red-500 text-sm mt-2">{error}</p>}
            </div>
          </div>
        </div>

        {/* 貼文網格 */}
        <div className="px-4 py-8">
          <h3 className="text-lg font-bold text-gray-900 mb-6">貼文</h3>

          {posts.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500">還沒有貼文</p>
            </div>
          ) : (
            <div className="grid grid-cols-3 gap-4">
              {posts.map((post) => (
                <div
                  key={post.id}
                  className="relative aspect-square bg-gray-200 rounded-lg overflow-hidden hover:opacity-80 transition cursor-pointer group"
                >
                  <img
                    src={post.imageUrl}
                    alt={post.caption}
                    className="w-full h-full object-cover"
                  />

                  {/* 懸停時顯示互動數 */}
                  <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-40 transition flex items-center justify-center gap-6 opacity-0 group-hover:opacity-100">
                    <div className="text-white text-center">
                      <p className="text-2xl font-bold">❤️ {post.likes}</p>
                      <p className="text-sm">喜歡</p>
                    </div>
                    <div className="text-white text-center">
                      <p className="text-2xl font-bold">💬 {post.comments}</p>
                      <p className="text-sm">留言</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* 帳號設置 */}
        <div className="border-t border-gray-200 px-4 py-8">
          <h3 className="text-lg font-bold text-gray-900 mb-4">帳號設置</h3>

          <button
            onClick={handleLogout}
            className="w-full p-4 text-left text-red-600 font-semibold hover:bg-red-50 rounded-lg transition"
          >
            登出帳號
          </button>
        </div>
      </div>
    </div>
  );
}