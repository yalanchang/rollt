'use client';

import { useState, useEffect } from 'react';
import axios from 'axios';
import { Heart, MessageCircle, Trash2 } from 'lucide-react';
import { useAuthStore } from '@/app/store/authStore';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

interface Post {
  id: number;
  userId: number;
  username: string;
  userAvatar?: string;
  imageUrl: string;
  mediaType?: string;
  caption: string;
  likes: number;
  comments: number;
  createdAt: string;
}

export default function ExplorePage() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [likedPosts, setLikedPosts] = useState<Set<number>>(new Set());
  const { user } = useAuthStore();
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;

  // 獲取所有貼文
  useEffect(() => {
    const fetchPosts = async () => {
      try {
        const response = await axios.get(`${API_URL}/posts/feed`);
        setPosts(response.data);
      } catch (error) {
      } finally {
        setLoading(false);
      }
    };

    fetchPosts();
  }, []);

  // 點讚
  const handleLike = async (postId: number) => {
    if (!token) {
      alert('請先登入');
      return;
    }

    try {
      if (likedPosts.has(postId)) {
        // 取消點讚
        await axios.post(
          `${API_URL}/posts/${postId}/unlike`,
          {},
          { headers: { Authorization: `Bearer ${token}` } }
        );
        setLikedPosts((prev) => {
          const newSet = new Set(prev);
          newSet.delete(postId);
          return newSet;
        });
        setPosts((prev) =>
          prev.map((post) =>
            post.id === postId ? { ...post, likes: post.likes - 1 } : post
          )
        );
      } else {
        // 點讚
        await axios.post(
          `${API_URL}/posts/${postId}/like`,
          {},
          { headers: { Authorization: `Bearer ${token}` } }
        );
        setLikedPosts((prev) => new Set(prev).add(postId));
        setPosts((prev) =>
          prev.map((post) =>
            post.id === postId ? { ...post, likes: post.likes + 1 } : post
          )
        );
      }
    } catch (error: any) {
      console.error('❌ 點讚失敗:', error);
      if (error.response?.status === 409) {
        alert('已經喜歡過此貼文');
      }
    }
  };

  // 刪除貼文
  const handleDelete = async (postId: number, userId: number) => {
    if (user?.id !== userId) {
      alert('只能刪除自己的貼文');
      return;
    }

    if (!confirm('確定要刪除此貼文嗎？')) {
      return;
    }

    try {
      await axios.delete(`${API_URL}/posts/${postId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setPosts((prev) => prev.filter((post) => post.id !== postId));
      console.log('✅ 貼文已刪除');
    } catch (error) {
      console.error('❌ 刪除失敗:', error);
      alert('刪除失敗');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-500">加載中...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 標題 */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <h1 className="text-2xl font-bold text-gray-900">發現</h1>
          <p className="text-gray-500 text-sm mt-1">瀏覽社區的精彩時刻</p>
        </div>
      </div>

      {/* 貼文網格 */}
      <div className="max-w-6xl mx-auto px-4 py-8">
        {posts.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500 text-lg">還沒有貼文</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {posts.map((post) => (
              <div
                key={post.id}
                className="bg-white rounded-lg shadow hover:shadow-lg transition overflow-hidden"
              >
                {/* 貼文媒體 */}
                <div className="relative w-full h-64 bg-gray-200 overflow-hidden">
                  {post.mediaType === 'video' ? (
                    <video
                      src={post.imageUrl}
                      className="w-full h-full object-cover"
                      controls
                    />
                  ) : (
                    <img
                      src={post.imageUrl}
                      alt={post.caption}
                      className="w-full h-full object-cover hover:scale-105 transition duration-300"
                    />
                  )}
                </div>

                {/* 用戶信息 */}
                <div className="p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      {post.userAvatar ? (
                        <img
                          src={post.userAvatar}
                          alt={post.username}
                          className="w-10 h-10 rounded-full bg-gradient-to-br from-pink-400 to-purple-500"
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-pink-400 to-purple-500" />
                      )}
                      <div>
                        <p className="font-semibold text-gray-900">
                          {post.username}
                        </p>
                        <p className="text-xs text-gray-500">
                          {new Date(post.createdAt).toLocaleDateString('zh-TW')}
                        </p>
                      </div>
                    </div>

                    {/* 刪除按鈕 */}
                    {user?.id === post.userId && (
                      <button
                        onClick={() => handleDelete(post.id, post.userId)}
                        className="text-red-500 hover:text-red-700 transition"
                      >
                        <Trash2 size={18} />
                      </button>
                    )}
                  </div>

                  {/* 描述 */}
                  {post.caption && (
                    <p className="text-gray-700 text-sm mb-3 line-clamp-2">
                      {post.caption}
                    </p>
                  )}

                  {/* 互動按鈕 */}
                  <div className="flex items-center gap-4 pt-3 border-t border-gray-200">
                    <button
                      onClick={() => handleLike(post.id)}
                      className={`flex items-center gap-1 transition ${
                        likedPosts.has(post.id)
                          ? 'text-red-500'
                          : 'text-gray-500 hover:text-red-500'
                      }`}
                    >
                      <Heart
                        size={18}
                        fill={likedPosts.has(post.id) ? 'currentColor' : 'none'}
                      />
                      <span className="text-sm">{post.likes}</span>
                    </button>

                    <button className="flex items-center gap-1 text-gray-500 hover:text-blue-500 transition">
                      <MessageCircle size={18} />
                      <span className="text-sm">{post.comments}</span>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}