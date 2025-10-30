'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Heart, MessageCircle, Share2, Bookmark, Send, ArrowLeft, MoreHorizontal } from 'lucide-react';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

interface Post {
  id: number;
  userId: number;
  imageUrl: string;
  caption: string;
  likes: number;
  comments: number;
  createdAt: string;
  username: string;
}


interface Comment {
    id: number;
    postId: number;
    userId: number;
    username: string;
    content: string;
    createdAt: string;
    userAvatar?: string;
  }

interface CurrentUser {
  id: number;
  username: string;
  avatar: string;
  email?: string;
}

export default function PostDetail() {
  const params = useParams();
  const router = useRouter();
  const postId = params.id;
  const [post, setPost] = useState<Post | null>(null);
  const [loading, setLoading] = useState(true);
  const [liked, setLiked] = useState(false);
  const [saved, setSaved] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);

  const getTimeAgo = (dateString: string): string => {
    const now = new Date();
    const date = new Date(dateString);
    const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);
  
    if (seconds < 60) return '剛剛';
    if (seconds < 3600) return `${Math.floor(seconds / 60)} 分鐘前`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)} 小時前`;
    if (seconds < 604800) return `${Math.floor(seconds / 86400)} 天前`;
    
    return date.toLocaleDateString('zh-TW');
  };

  useEffect(() => {
    const fetchCurrentUser = async () => {
      try {
        const token = localStorage.getItem('token');
        
        if (!token) {
          console.log('用戶未登入');
          return;
        }

        const response = await fetch(`${API_URL}/auth/me`, { 
            method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
        
        if (response.ok) {
          const userData = await response.json();
          setCurrentUser({
            id: userData.id,
            username: userData.username,
            avatar: userData.avatar, 
            email: userData.email
          });
        } else if (response.status === 401) {
          localStorage.removeItem('token');
          router.push('/login'); 
        }
      } catch (error) {
        console.error('獲取用戶資料失敗:', error);
      }
    };

    fetchCurrentUser();
  }, [router]);

  useEffect(() => {
    const fetchPost = async () => {
      try {
        const token = localStorage.getItem('token');
        
        const response = await fetch(`${API_URL}/posts/${postId}`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
        
        if (!response.ok) {
          throw new Error('貼文不存在');
        }

        const data = await response.json();
        setPost(data);
        
        await fetchComments();
    } catch (error) {
        console.error('拿數據失敗:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchPost();
  }, [postId]);

  const fetchComments = async () => {
    try {
      const token = localStorage.getItem('token');
      
      const response = await fetch(`${API_URL}/posts/${postId}/comments`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        const commentsData = await response.json();
        setComments(commentsData);
      }
    } catch (error) {
      console.error('獲取留言失敗:', error);
    }
  };

  const handleLike = async () => {
    if (!currentUser) {
      router.push('/login');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      
      const response = await fetch(`${API_URL}/posts/${postId}/like`, {
        method: liked ? 'DELETE' : 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        setLiked(!liked);
        if (post) {
          setPost({
            ...post,
            likes: liked ? post.likes - 1 : post.likes + 1
          });
        }
      }
    } catch (error) {
      console.error('點讚失敗:', error);
    }
  };

  const handleComment = async () => {
    if (!currentUser) {
      router.push('/login');
      return;
    }

    if (commentText.trim()) {
      try {
        const token = localStorage.getItem('token');
        
        const response = await fetch(`${API_URL}/posts/${postId}/comments`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            text: commentText
          })
        });

        if (response.ok) {
          const newComment = await response.json();
          setComments([newComment, ...comments]);
          setCommentText('');
          if (post) {
            setPost({
              ...post,
              comments: post.comments + 1
            });
          }
        }
      } catch (error) {
        console.error('發表留言失敗:', error);
      }
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-gray-600 animate-pulse">載入中...</p>
        </div>
      </div>
    );
  }
  

  if (!post) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
        <div className="text-center">
          <p className="text-2xl text-gray-400 mb-4">找不到此貼文</p>
          <button
            onClick={() => router.back()}
            className="px-6 py-3 bg-indigo-500 text-white rounded-full hover:bg-indigo-600 transition-colors"
          >
            返回首頁
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* 頂部導航 */}
      <div className="sticky top-0 z-10 bg-white/80 backdrop-blur-lg border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 px-4 py-2 rounded-full hover:bg-gray-100 transition-all group"
          >
            <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
            <span className="font-medium">返回</span>
          </button>
          
          <div className="flex items-center gap-2">
            <button className="p-2 rounded-full hover:bg-gray-100 transition-colors">
              <Share2 className="w-5 h-5" />
            </button>
            <button className="p-2 rounded-full hover:bg-gray-100 transition-colors">
              <MoreHorizontal className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      {/* 主要內容 */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="bg-white rounded-3xl shadow-xl overflow-hidden">
          <div className="grid lg:grid-cols-2 min-h-[600px]">
            <div className="relative bg-black flex items-center justify-center">
              <img
                src={post.imageUrl}
                alt={post.caption}
                className="w-full h-full object-contain"
              />
              
              {/* 圖片上的互動按鈕 */}
              <div className="absolute bottom-4 right-4 flex gap-2">
                <button
                  onClick={handleLike}
                  className={`p-3 rounded-full backdrop-blur-md transition-all transform ${
                    liked 
                      ? 'bg-red-500/90 text-white scale-110' 
                      : 'bg-white/20 text-white hover:bg-white/30 hover:scale-105'
                  }`}
                >
                  <Heart className={`w-6 h-6 ${liked ? 'fill-current' : ''}`} />
                </button>
                <button
                  onClick={() => setSaved(!saved)}
                  className={`p-3 rounded-full backdrop-blur-md transition-all transform ${
                    saved 
                      ? 'bg-yellow-500/90 text-white scale-110' 
                      : 'bg-white/20 text-white hover:bg-white/30 hover:scale-105'
                  }`}
                >
                  <Bookmark className={`w-6 h-6 ${saved ? 'fill-current' : ''}`} />
                </button>
              </div>
            </div>
            {/* 右側資訊區 */}
            <div className="flex flex-col h-full">
            <div className="flex items-center justify-between p-6 border-b border-gray-100">
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <div className="w-12 h-12 rounded-full bg-primary to-indigo-500 p-[2px]">
                      <div className="w-full h-full rounded-full bg-white flex items-center justify-center">
                        <span className="text-lg font-bold bg-primary bg-clip-text text-transparent">
                          {post.username[0].toUpperCase()}
                        </span>
                      </div>
                    </div>
                    <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-white"></div>
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900">{post.username}</p>
                    <p className="text-xs text-gray-500">發佈於 {getTimeAgo(post.createdAt)}
                    </p>
                  </div>
                </div>
                <button className="px-4 py-2 bg-primary text-white rounded-full text-sm font-semibold hover:shadow-lg transform hover:scale-105 transition-all">
                  追蹤
                </button>
              </div>
              {/* 標題區 */}
              <div className="px-6 py-4 border-b border-gray-100">
                <p className="text-gray-800 leading-relaxed">{post.caption}</p>
                <div className="flex flex-wrap gap-2 mt-3">
                  <span className=" py-1  rounded-full text-xs font-medium">
                    #攝影
                  </span>
                  <span className=" py-1 rounded-full text-xs font-medium">
                    #風景
                  </span>
                  <span className=" py-1  rounded-full text-xs font-medium">
                    #日常
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-around py-4 border-b border-gray-100">
                <button className="flex items-center gap-2 hover:scale-105 transition-transform">
                  <Heart className={`w-5 h-5 ${liked ? 'fill-red-500 text-red-500' : 'text-gray-600'}`} />
                  <span className="font-semibold text-gray-700">{post.likes.toLocaleString()}</span>
                  <span className="text-sm text-gray-500">喜歡</span>
                </button>
                <button className="flex items-center gap-2 hover:scale-105 transition-transform">
                  <MessageCircle className="w-5 h-5 text-gray-600" />
                  <span className="font-semibold text-gray-700">{post.comments}</span>
                  <span className="text-sm text-gray-500">留言</span>
                </button>
                <button className="flex items-center gap-2 hover:scale-105 transition-transform">
                  <Share2 className="w-5 h-5 text-gray-600" />
                  <span className="text-sm text-gray-500">分享</span>
                </button>
              </div>
              <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4 max-h-[300px]">
                {comments.map((comment) => (
                  <div key={comment.id} className="flex gap-3 group">
                    <div className="w-8 h-8 rounded-full overflow-hidden flex-shrink-0 ring-1 ring-gray-200">
                      {comment.userAvatar ? (
                        <img 
                          src={comment.userAvatar}
                          alt={comment.username}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            const target = e.currentTarget as HTMLImageElement;
                            target.src = `https://ui-avatars.com/api/?name=${comment.username}&background=818CF8&color=fff&size=32`;
                          }}
                        />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-r from-cyan-400 to-blue-400 flex items-center justify-center text-white text-sm font-bold">
                          {comment.username[0].toUpperCase()}
                        </div>
                      )}
                    </div>
                    <div className="flex-1">
                      <div className="bg-gray-50 rounded-2xl px-4 py-2 group-hover:bg-gray-100 transition-colors">
                        <p className="font-semibold text-sm text-gray-900">{comment.username}</p>
                        <p className="text-gray-700 text-sm mt-1">{comment.content}</p>
                      </div>
                      <div className="flex items-center gap-4 mt-2 px-2">
                        <span className="text-xs text-gray-500">{new Date(comment.createdAt).toLocaleString('zh-TW')}
</span>
                        <button className="text-xs text-gray-500 hover:text-red-500 transition-colors">
                          ❤️ 
                        </button>
                        <button className="text-xs text-gray-500 hover:text-gray-700 transition-colors">
                          回覆
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="p-4">
                {currentUser ? (
                  <div className="flex gap-2">
                    {/* 當前用戶大頭貼 */}
                    <div className="relative flex-shrink-0">
                      <div className="w-8 h-8 rounded-full bg-primary p-[1.5px]">
                        <div className="w-full h-full rounded-full overflow-hidden bg-white">
                          <img 
                            src={currentUser.avatar || `https://ui-avatars.com/api/?name=${currentUser.username}&background=818CF8&color=fff&size=32`}
                            alt={currentUser.username}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              const target = e.currentTarget as HTMLImageElement;
                              target.src = `https://ui-avatars.com/api/?name=${currentUser.username}&background=818CF8&color=fff&size=32`;
                            }}
                          />
                        </div>
                      </div>
                    </div>
                    <div className="flex-1 flex gap-2">
                      <input
                        type="text"
                        value={commentText}
                        onChange={(e) => setCommentText(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleComment()}
                        placeholder="發表你的想法..."
                        className="flex-1 bg-white border border-gray-200 rounded-full px-4 py-2 text-sm focus:outline-none focus:border-primary transition-colors"
                      />
                      <button
                        onClick={handleComment}
                        onKeyDown={(e) => e.key === "Enter" && handleComment()}
                        disabled={!commentText.trim()}
                        className={`p-2 rounded-full transition-all ${
                          commentText.trim()
                            ? 'bg-primary text-white hover:shadow-lg transform hover:scale-105'
                            : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                        }`}
                      >
                        <Send className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-2">
                    <p className="text-gray-500 mb-2">請先登入以發表留言</p>
                    <button
                      onClick={() => router.push('/login')}
                      className="px-4 py-2 bg-indigo-500 text-white rounded-full hover:bg-indigo-600 transition-colors"
                    >
                      登入
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}