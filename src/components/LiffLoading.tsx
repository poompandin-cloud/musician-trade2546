import { useLiff } from '@/hooks/useLiff';

interface LiffLoadingProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export const LiffLoading = ({ children, fallback }: LiffLoadingProps) => {
  const { loading, error, isInClient, isLoggedIn, clearCacheAndReinit } = useLiff();

  // ถ้ากำลังโหลด
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
          <p className="text-gray-600">กำลังเชื่อมต่อกับ LINE...</p>
        </div>
      </div>
    );
  }

  // ถ้ามีข้อผิดพลาด
  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 to-pink-100">
        <div className="text-center max-w-md mx-4 p-6">
          <div className="text-red-600 mb-4">
            <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-gray-800 mb-2">เชื่อมต่อ LINE ไม่สำเร็จ</h2>
          <p className="text-gray-600 mb-4 text-sm">{error}</p>
          
          {/* แสดง Error Details สำหรับ Debugging */}
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4 text-left">
            <h3 className="font-semibold text-red-800 mb-2">รายละเอียดข้อผิดพลาด:</h3>
            <ul className="text-sm text-red-700 space-y-1">
              <li>• ตรวจสอบว่า LIFF ID: <code className="bg-red-100 px-1 rounded">2009193181-d1LDkPcT</code> ถูกต้องหรือไม่</li>
              <li>• ตรวจสอบว่า Callback URL: <code className="bg-red-100 px-1 rounded">https://www.musiciantradethai.com/</code> ถูกต้องหรือไม่</li>
              <li>• ตรวจสอบว่าอยู่ใน LINE Browser หรือไม่</li>
              <li>• ตรวจสอบว่าเครือขอมูล Internet ทำงานปกติ</li>
              <li>• ตรวจสอบ Console ใน LINE Developers Console</li>
            </ul>
          </div>
          
          <div className="flex gap-2 justify-center">
            <button 
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              ลองใหม่
            </button>
            <button 
              onClick={clearCacheAndReinit}
              className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors"
            >
              ล้างแคช
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ถ้าอยู่ใน LINE แต่ยังไม่ login แสดง fallback
  if (isInClient && !isLoggedIn && fallback) {
    return <>{fallback}</>;
  }

  // ถ้าทุกอย่างปกติ แสดง children
  return <>{children}</>;
};

export default LiffLoading;
