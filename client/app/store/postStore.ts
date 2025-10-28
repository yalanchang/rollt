import { create } from 'zustand';

export interface Post {
  id: number;
  userId: number;
  username: string;
  userAvatar: string;
  imageUrl: string;
  mediaType?: string;
  caption: string;
  likes: number;
  comments: number;
  createdAt: string;
  liked: boolean;
}

interface PostStore {
  posts: Post[];
  setPosts: (posts: Post[]) => void;
  addPost: (post: Post) => void;
  likePost: (postId: number) => void;
  unlikePost: (postId: number) => void;
  deletePost: (postId: number) => void;
}

export const usePostStore = create<PostStore>((set) => ({
  posts: [],
  
  setPosts: (posts) => set({ posts }),
  
  addPost: (post) =>
    set((state) => ({
      posts: [post, ...state.posts],
    })),
  
  likePost: (postId) =>
    set((state) => ({
      posts: state.posts.map((p) =>
        p.id === postId
          ? { ...p, likes: p.likes + 1, liked: true }
          : p
      ),
    })),
  
  unlikePost: (postId) =>
    set((state) => ({
      posts: state.posts.map((p) =>
        p.id === postId
          ? { ...p, likes: p.likes - 1, liked: false }
          : p
      ),
    })),
  
  deletePost: (postId) =>
    set((state) => ({
      posts: state.posts.filter((p) => p.id !== postId),
    })),
}));