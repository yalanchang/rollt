'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuthStore, type User } from '@/app/store/authStore';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faMessage,faHeart} from '@fortawesome/free-regular-svg-icons';








const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

interface Post {
  id: number;
  userId: number;
  imageUrl: string;
  caption: string;
  likes: number;
  comments: number;
}


export default function ProfilePage() {
  const router = useRouter();
  const { user, setUser } = useAuthStore();
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
  const [formData, setFormData] = useState({
    username: user?.username || '',
    email: user?.email || '',
    bio: '我的精彩時刻 📸',
    avatar: '',
  });

  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [userStats, setUserStats] = useState({
    postCount: 0,
    followerCount: 0,
    followingCount: 0
  });

 
useEffect(() => {
  const fetchUserProfile = async () => {
    try {
      const token = localStorage.getItem('token');
      
      const response = await fetch(`${API_URL}/users/${user?.id}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        
        if (data.stats) {
          setUserStats(data.stats);
        }
      }
    } catch (error) {
      console.error('獲取用戶資料失敗:', error);
    }
  };

  if (user?.id) {
    fetchUserProfile();
  }
}, [user?.id]);


  useEffect(() => {
    const fetchPosts = async () => {
      try {
        const response = await fetch(`${API_URL}/posts/my-posts`,
          {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
            }
          })


        if (!response.ok) {
          console.error('status', response.status);
          return;
        }

        const data = await response.json();
        setPosts(data)

      setUserStats(prev => ({
        ...prev,
        postCount: data.length
      }));

      } catch (error) {
        console.log(error)
      }
    }
    fetchPosts();

  }, [])
  


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


      {/* 主要內容 */}
      <div className="max-w-4xl mx-auto">
        <div className="border-b border-gray-200 px-4 py-12">
          <div className="flex gap-8 items-start">
            {/* 頭像 */}
            <div className="flex-shrink-0">
              <div className="w-32 h-32 rounded-full bg-primary flex items-center justify-center text-white text-5xl font-bold">
                {user.username[0].toUpperCase()}
              </div>
            </div>

            {/* 用戶信息 */}
            <div className="flex-1">
              <div className="flex items-center gap-4 mb-4">
                <h2 className="text-2xl font-bold text-gray-900">{user.username}</h2>
                <button
                  onClick={() => setIsEditing(!isEditing)}
                  className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg font-semibold text-gray-900 transition"
                >
                  {isEditing ? '取消' : '編輯個人資料'}
                </button>
              </div>

              <div className="flex gap-8 mb-4 text-gray-600">
                <div>
                  <span className="font-bold text-gray-900">{userStats.postCount}</span> 個貼文
                </div>
                <div>
                  <span className="font-bold text-gray-900">{userStats.followerCount}</span> 粉絲
                </div>
                <div>
                  <span className="font-bold text-gray-900">{userStats.followingCount}</span> 追蹤
                </div>
              </div>

              {!isEditing && (
                <div>
                  <p className="text-gray-600 mt-2">{formData.bio}</p>
                  <p className="text-gray-500 text-sm mt-2">{user.email}</p>
                </div>
              )}

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

        <div className="grid grid-cols-3 gap-1">
          {posts.map((post) => (
            <div
              key={post.id}
              className="relative aspect-square group overflow-hidden cursor-pointer"
              onClick={()=>router.push(`./posts/${post.id}`)}
            >
              <img
                src={post.imageUrl}
                alt={post.caption}
                className="w-full h-full object-cover group-hover:brightness-50 transition"
              />

              <div className="absolute inset-0 flex items-center justify-center gap-6 opacity-0 group-hover:opacity-100 transition">
                <div className="text-white font-bold text-center">
                  <p className="text-3xl">
                  <FontAwesomeIcon icon={faHeart} style={{color: "#ffffff",}} />
                  </p>
                  <p className="text-sm">{post.likes}</p>
                </div>
                <div className="text-white font-bold text-center">
                  <p className="text-3xl"><FontAwesomeIcon icon={faMessage} style={{color: "#ffffff",}} /></p>
                  <p className="text-sm">{post.comments}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
        

        <div className="border-t border-gray-200 px-4 py-8">
        <Link href="/setup">帳號設置</Link>
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