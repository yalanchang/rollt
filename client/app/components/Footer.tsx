'use client';

import { usePathname } from "next/navigation";

export default function Footer() {
  const pathname = usePathname();

  if (pathname === '/login' || pathname === '/register') {
    return null;
  }

  return (
    <footer className="bg-gray-50 border-t border-gray-200 ">
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="grid grid-cols-4 gap-8 mb-8">
          {/* 列 1 */}
          <div>
            <h3 className="font-bold text-gray-900 mb-4">Rollt</h3>
            <p className="text-sm text-gray-600">分享你的精彩時刻</p>
          </div>

          {/* 列 2 */}
          <div>
            <h4 className="font-semibold text-gray-900 mb-4">產品</h4>
            <ul className="space-y-2 text-sm">
              <li><a href="#" className="text-gray-600 hover:text-gray-900">下載應用</a></li>
              <li><a href="#" className="text-gray-600 hover:text-gray-900">功能</a></li>
              <li><a href="#" className="text-gray-600 hover:text-gray-900">安全</a></li>
            </ul>
          </div>

          {/* 列 3 */}
          <div>
            <h4 className="font-semibold text-gray-900 mb-4">公司</h4>
            <ul className="space-y-2 text-sm">
              <li><a href="#" className="text-gray-600 hover:text-gray-900">關於我們</a></li>
              <li><a href="#" className="text-gray-600 hover:text-gray-900">職缺</a></li>
            </ul>
          </div>

          {/* 列 4 */}
          <div>
            <h4 className="font-semibold text-gray-900 mb-4">法律</h4>
            <ul className="space-y-2 text-sm">
              <li><a href="#" className="text-gray-600 hover:text-gray-900">隱私政策</a></li>
              <li><a href="#" className="text-gray-600 hover:text-gray-900">服務條款</a></li>
            </ul>
          </div>
        </div>

        <div className="border-t border-gray-200 pt-8">
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-600">© 2025 Rollt. 保留所有權利</p>
            <div className="flex gap-4 text-sm">
              <a href="#" className="text-gray-600 hover:text-gray-900">Threads</a>
              <a href="#" className="text-gray-600 hover:text-gray-900">Instagram</a>
              <a href="#" className="text-gray-600 hover:text-gray-900">Facebook</a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}