'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import { useAuthStore } from '@/app/store/authStore';
import { BiImageAdd, BiX, BiCheck, BiVideo, BiUpload,BiMapPin, BiCurrentLocation } from 'react-icons/bi';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';
const MAX_FILE_SIZE = 50 * 1024 * 1024;

export default function CreatePage() {
  const router = useRouter();
  const { user } = useAuthStore();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState('');
  const [mediaType, setMediaType] = useState<'image' | 'video' | null>(null);
  const [caption, setCaption] = useState('');
  const [loading, setLoading] = useState(false);
  const [location, setLocation] = useState('');
  const [showLocationModal, setShowLocationModal] = useState(false);
  const [filteredLocations, setFilteredLocations] = useState<string[]>([]);
  const [geoLocation, setGeoLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [locationInput, setLocationInput] = useState('');
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [mounted, setMounted] = useState(false);
  const [searchLoading, setSearchLoading] = useState(false); 


  useEffect(() => {
    setMounted(true);
    if (!user) {
      router.push('/login');
    }

    // 清理預覽 URL
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [user, router, previewUrl]);

  if (!mounted || !user) {
    return null;
  }



  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    setUploading(true);

    try {
      const token = localStorage.getItem('token');

      if (!token) {
        router.push('/login');
        return;
      }



      if (!file) {
        setError('請選擇要上傳的文件');
        setLoading(false);
        setUploading(false);
        return;
      }

      // 將文件轉換為 base64
      const reader = new FileReader();
      reader.readAsDataURL(file);

      reader.onload = async () => {
        const base64Data = reader.result as string;

        try {
          const response = await axios.post(
            `${API_URL}/posts`,
            {
              imageUrl: base64Data,
              caption,
              mediaType,
            },
            {
              headers: {
                Authorization: `Bearer ${token}`,
              },
            }
          );


          // 清理預覽 URL
          if (previewUrl) {
            URL.revokeObjectURL(previewUrl);
          }

          router.push('/');
        } catch (err: any) {
          console.error('❌ 創建貼文錯誤:', err);

          if (err.response?.data?.message) {
            setError(err.response.data.message);
          } else if (err.response?.status === 401) {
            setError('請重新登入');
            setTimeout(() => router.push('/login'), 2000);
          } else {
            setError('創建失敗，請稍後重試');
          }
          setLoading(false);
          setUploading(false);
        }
      };

      reader.onerror = () => {
        setError('讀取文件失敗');
        setLoading(false);
        setUploading(false);
      };

    } catch (err) {
      console.error('❌ 上傳錯誤:', err);
      setError('上傳失敗，請稍後重試');
      setLoading(false);
      setUploading(false);
    }
  };
  

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];

    if (!selectedFile) return;

    // 檢查文件大小
    if (selectedFile.size > MAX_FILE_SIZE) {
      setError(`文件大小不能超過 ${MAX_FILE_SIZE / 1024 / 1024}MB`);
      return;
    }

    // 檢查文件類型
    if (!selectedFile.type.startsWith('image/') && !selectedFile.type.startsWith('video/')) {
      setError('請選擇圖片或影片文件');
      return;
    }

    setError('');
    setFile(selectedFile);

    // 設置媒體類型
    if (selectedFile.type.startsWith('image/')) {
      setMediaType('image');
    } else {
      setMediaType('video');
    }

    // 創建預覽 URL
    const url = URL.createObjectURL(selectedFile);
    setPreviewUrl(url);
  };

  const handleClearFile = () => {
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }
    setFile(null);
    setPreviewUrl('');
    setMediaType(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };


  const handleGetLocation = () => {
    if (!navigator.geolocation) {
      setError('你的瀏覽器不支持地理定位');
      return;
    }
  
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        setGeoLocation({ lat: latitude, lng: longitude });
  
        try {
          const response = await axios.get(
            `${API_URL}/places/geocode-reverse?latitude=${latitude}&longitude=${longitude}`
          );
  
          if (response.data.results.length > 0) {
            const address = response.data.results[0].formatted_address;
            setLocationInput(address);
            setLocation(address);
          }
        } catch (err) {
          console.error('❌ 地址查詢失敗:', err);
          setLocationInput(`${latitude.toFixed(4)}, ${longitude.toFixed(4)}`);
          setLocation(`${latitude.toFixed(4)}, ${longitude.toFixed(4)}`);
        }
      },
      (error) => {
        console.error('❌ 定位失敗:', error);
        setError('無法獲取位置，請檢查權限');
      }
    );
  };
  
    const handleLocationSearch = async (value: string) => {
      setLocationInput(value);
  
      if (value.trim().length < 2) {
        setFilteredLocations([]);
        return;
      }
  
      setSearchLoading(true);

    try {
    
      const response = await axios.get(
        `${API_URL}/places/autocomplete?input=${value}`
      );
  
      const predictions = response.data.predictions.map((p: any) => p.description);
      setFilteredLocations(predictions);
    } catch (err) {
      console.error('❌ 搜索失敗:', err);
    } finally {
      setSearchLoading(false);  
    }
  };
  

    
  const handleSelectLocation = (selectedLocation: string) => {
    setLocation(selectedLocation);
    setShowLocationModal(false);
    setLocationInput('');
    setFilteredLocations([]);
  };

  return (
    <div className="flex h-screen bg-gray-50">

      <main className="flex-1 overflow-y-auto">
        <div className="max-w-2xl mx-auto p-6">
          {/* 標題 */}
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-gray-900">建立新貼文</h2>
          </div>

          {/* 錯誤訊息 */}
          {error && (
            <div className="mb-4 p-4 bg-red-100 text-red-700 rounded-lg text-sm border border-red-300">
              <p className="font-semibold">⚠️ {error}</p>
            </div>
          )}

          {/* 表單 */}
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*,video/*"
                onChange={handleFileChange}
                className="hidden"
              />

              {previewUrl ? (
                <div className="relative">
                  <div className="relative rounded-lg overflow-hidden  w-fit">
                    {mediaType === 'image' ? (
                      <img
                        src={previewUrl}
                        alt="預覽"
                        className="w-full max-h-96 object-contain"
                      />
                    ) : (
                      <video
                        src={previewUrl}
                        controls
                        className="w-full max-h-96"
                      />
                    )}
                    <button
                      type="button"
                      onClick={handleClearFile}
                      className="absolute top-2 right-2 p-2 bg-red-500 hover:bg-red-600 text-white rounded-full transition shadow-lg"
                    >
                      <BiX size={24} />
                    </button>
                  </div>

                </div>
              ) : (
                <div
                  onClick={triggerFileInput}
                  className="relative cursor-pointer border-2 border-dashed border-gray-300 rounded-lg p-8 hover:border-primary hover:bg-primary/5 transition"
                >
                  <div className="flex flex-col items-center justify-center text-center">
                    <BiUpload size={40} className="text-gray-400 mb-4" />
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      選擇照片或影片
                      </label>
                  </div>
                </div>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                內容
              </label>
              <textarea
                value={caption}
                onChange={(e) => setCaption(e.target.value)}
                placeholder="分享你的想法..."
                rows={4}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition text-gray-900 resize-none"
              />

            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                <BiMapPin size={16} />
                地點（可選）
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={location}
                  readOnly
                  onClick={() => setShowLocationModal(true)}
                  placeholder="點擊選擇地點..."
                  className="flex-1 px-4 py-3 border border-gray-300 rounded-lg outline-none transition text-gray-900 cursor-pointer"
                />
                <button
                  type="button"
                  onClick={handleGetLocation}
                  className="px-4 py-2 text-blue-500  flex items-center gap-2 font-semibold"
                >
                  <BiCurrentLocation size={20} />
                  定位
                </button>
              </div>
            </div>

            {/* 按鈕 */}
            <div className="flex gap-3">
              <button
                type="submit"
                disabled={loading || !file}
                className="flex-1 bg-gradient-to-br from-primary to-primary hover:from-sec text-white font-semibold py-3 rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {loading || uploading ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    {uploading ? '上傳中...' : '發佈中...'}
                  </>
                ) : (
                  <>
                    發佈貼文
                  </>
                )}
              </button>
              <button
                type="button"
                onClick={() => router.push('/')}
                className="px-6 py-3 border border-gray-300 hover:bg-gray-50 rounded-lg transition text-gray-700 font-semibold"
              >
                取消
              </button>
            </div>
          </form>

        </div>
      </main>

      {showLocationModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end">
          <div className="bg-white w-full rounded-t-2xl p-6 max-h-96 overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-gray-900">選擇地點</h3>
              <button
                type="button"
                onClick={() => {
                  setShowLocationModal(false);
                  setLocationInput('');
                  setFilteredLocations([]);
                }}
                className="text-gray-500 hover:text-gray-700"
              >
                <BiX size={24} />
              </button>
            </div>

            {/* 搜索輸入 */}
            <input
              type="text"
              value={locationInput}
              onChange={(e) => handleLocationSearch(e.target.value)}
              placeholder="搜索地點..."
              className="w-full px-4 py-3 border border-gray-300 rounded-lg mb-4 focus:ring-2 focus:ring-primary outline-none text-gray-900"
            />

            {/* 地點列表 */}
            <div className="space-y-2">
              {searchLoading && (
                <div className="text-center py-4 text-gray-500">
                  <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
                </div>
              )}

              {!searchLoading && filteredLocations.length === 0 && locationInput && (
                <p className="text-center py-4 text-gray-500">沒有找到相匹配的地點</p>
              )}

              {filteredLocations.map((loc) => (
                <button
                  key={loc}
                  type="button"
                  onClick={() => handleSelectLocation(loc)}
                  className="w-full text-left px-4 py-3 hover:bg-gray-100 rounded-lg transition text-gray-900 flex items-center gap-2"
                >
                  <BiMapPin size={18} className="text-gray-500" />
                  {loc}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
  
    </div>
  );
}

