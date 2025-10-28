'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import Sidebar from '@/app/components/Sidebar';
import PostCard from '@/app/components/PostCard';
import { useAuthStore } from '@/app/store/authStore';
import { usePostStore, Post } from '@/app/store/postStore';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

export default function Home() {
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const setUser = useAuthStore((state) => state.setUser);
  const posts = usePostStore((state) => state.posts);
  const setPosts = usePostStore((state) => state.setPosts);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);
  
  
  useEffect(() => {
    if (mounted) {
      checkAuthAndFetchPosts();
    }
  }, [mounted]);

  
  const checkAuthAndFetchPosts = async () => {
    try {
      // 檢查用戶是否登入
      const token = localStorage.getItem('token');
      const storedUser = localStorage.getItem('user');

      if (!token || !storedUser) {
        router.push('/login');
        return;
      }

      if (!user) {
        setUser(JSON.parse(storedUser));
      }

      // 獲取貼文
      await fetchPosts(token);
    } catch (err) {
      console.error('檢查認證失敗:', err);
      router.push('/login');
    }
  };

  const fetchPosts = async (token: string) => {
    try {
      setLoading(true);
      setError('');

      const response = await axios.get(`${API_URL}/posts/feed`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const formattedPosts: Post[] = response.data.map((post: any) => ({
        id: post.id,
        userId: post.userId,
        username: post.username,
        userAvatar: post.userAvatar || '👤',
        imageUrl: post.imageUrl,
        mediaType: post.mediaType || 'image',
        caption: post.caption,
        likes: post.likes || 0,
        comments: post.comments || 0,
        createdAt: post.createdAt,
        liked: false,
      }));

      setPosts(formattedPosts);
    } catch (err: any) {
      console.error('獲取貼文錯誤:', err);
      
      // 如果是認證錯誤，重定向到登入
      if (err.response?.status === 401 || err.response?.status === 403) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        router.push('/login');
      } else {
        setError('無法載入貼文，請檢查後端服務是否運行');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = () => {
    const token = localStorage.getItem('token');
    if (token) {
      fetchPosts(token);
    }
  };
  
  if (!mounted) {
    return null;
  }


  if (!user && !localStorage.getItem('token')) {
    return null;
  }

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar />

      <main className="flex-1 overflow-y-auto">
        <div className="max-w-2xl mx-auto p-6">
          {/* 頭部 */}
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold">你的動態</h2>
          
          </div>

          {/* 錯誤信息 */}
          {error && (
            <div className="mb-4 p-4 bg-red-100 text-red-700 rounded-lg">
              <p className="font-semibold">⚠️ 錯誤</p>
              <p className="text-sm">{error}</p>
              <p className="text-xs mt-2 text-red-600">
                請確保後端服務運行在 http://localhost:5000
              </p>
            </div>
          )}

          {/* 載入狀態 */}
          {loading ? (
            <div className="text-center py-12">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-pink-500"></div>
            </div>
          ) : posts.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <p className="mb-2">還沒有貼文</p>
              <p className="text-sm mb-4">開始分享你的精彩時刻吧！</p>
              <a
                href="/create"
                className="inline-block px-6 py-2 bg-pink-500 text-white rounded-lg hover:bg-pink-600 transition"
              >
                發佈貼文
              </a>
            </div>
          ) : (
            <div className="space-y-6">
              {posts.map((post) => (
                <PostCard key={post.id} post={post} />
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}