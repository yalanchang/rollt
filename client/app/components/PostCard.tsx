'use client';

import { FiHeart, FiMessageCircle, FiShare2, FiTrash2 } from 'react-icons/fi';
import { useAuthStore } from '@/app/store/authStore';
import { usePostStore } from '@/app/store/postStore';
import { Post } from '@/app/store/postStore';

interface PostCardProps {
  post: Post;
}

export default function PostCard({ post }: PostCardProps) {
  const user = useAuthStore((state) => state.user);
  const likePost = usePostStore((state) => state.likePost);
  const unlikePost = usePostStore((state) => state.unlikePost);
  const deletePost = usePostStore((state) => state.deletePost);

  const handleLike = () => {
    if (post.liked) {
      unlikePost(post.id);
    } else {
      likePost(post.id);
    }
  };

  const handleDelete = () => {
    if (confirm('確定要刪除此貼文嗎？')) {
      deletePost(post.id);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
      {/* 頭部 */}
      <div className="flex items-center justify-between p-4 border-b">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-r from-pink-400 to-purple-400 flex items-center justify-center text-white font-bold">
            {post.username[0].toUpperCase()}
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">{post.username}</h3>
            <p className="text-xs text-gray-500">
              {new Date(post.createdAt).toLocaleDateString('zh-TW')}
            </p>
          </div>
        </div>

        {user?.id === post.userId && (
          <button
            onClick={handleDelete}
            className="text-gray-500 hover:text-red-500"
          >
            <FiTrash2 size={18} />
          </button>
        )}
      </div>

      {/* 媒體內容 */}
      {post.mediaType === 'video' ? (
        <video
          src={post.imageUrl}
          controls
          className="w-full max-h-96 object-contain bg-black"
        />
      ) : (
        <img
          src={post.imageUrl}
          alt={post.caption}
          className="w-full max-h-96 object-cover"
        />
      )}

      {/* 互動按鈕 */}
      <div className="flex gap-4 p-4 border-b">
        <button
          onClick={handleLike}
          className={`flex items-center gap-2 transition ${
            post.liked ? 'text-red-500' : 'text-gray-600 hover:text-red-500'
          }`}
        >
          <FiHeart
            size={20}
            fill={post.liked ? 'currentColor' : 'none'}
          />
          <span className="text-sm">{post.likes}</span>
        </button>

        <button className="flex items-center gap-2 text-gray-600 hover:text-blue-500">
          <FiMessageCircle size={20} />
          <span className="text-sm">{post.comments}</span>
        </button>

        <button className="flex items-center gap-2 text-gray-600 hover:text-green-500">
          <FiShare2 size={20} />
        </button>
      </div>

      {/* 說明 */}
      <div className="p-4">
        <p className="text-gray-900">
          <span className="font-semibold">{post.username}</span> {post.caption}
        </p>
      </div>
    </div>
  );
}