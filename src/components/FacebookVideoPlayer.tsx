import React, { useState, useEffect } from 'react';
import VideoPlayerFallback from './VideoPlayerFallback';


interface FacebookVideoPlayerProps {
  url: string;
  originalUrl?: string; // ✅ เพิ่มบรรทัดนี้เข้าไปครับ (มีเครื่องหมาย ? ด้วยนะ)
  className?: string;
}

const FacebookVideoPlayer = ({ url, originalUrl, className = "" }: FacebookVideoPlayerProps) => {
  const [hasError, setHasError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // URL ที่ส่งมาคือ embed URL อยู่แล้ว ไม่ต้องแปลงซ้ำ
  const embedUrl = url;

  useEffect(() => {
    // ตั้งเวลาหากโหลดนานเกินไปให้แสดง fallback
    const timeout = setTimeout(() => {
      if (isLoading) {
        console.log('Facebook video loading timeout, showing fallback');
        setHasError(true);
        setIsLoading(false);
      }
    }, 10000); // 10 วินาที

    return () => clearTimeout(timeout);
  }, [isLoading]);

  if (hasError) {
    return (
      <VideoPlayerFallback 
        url={originalUrl || url} // ✅ ถ้ามีลิงก์แชร์ให้ใช้ลิงก์แชร์ ถ้าไม่มีค่อยใช้ embed url
        platform="facebook" 
        className={className}
      />
    );
  }

  return (
    <div className={`aspect-video bg-black rounded-lg overflow-hidden relative ${className}`}>
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-900 z-10">
          <div className="text-center text-white">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto mb-4"></div>
            <div className="text-sm">กำลังโหลดวิดีโอ...</div>
          </div>
        </div>
      )}
      
      <iframe
        src={embedUrl}
        className="w-full h-full"
        style={{
          border: 'none',
          overflow: 'hidden',
          position: 'absolute',
          top: 0,
          left: 0
        }}
        scrolling="no"
        frameBorder="0"
        allowFullScreen={true}
        allow="autoplay; clipboard-write; encrypted-media; picture-in-picture; web-share"
        title="Facebook video player"
        onLoad={() => {
          console.log('Facebook video loaded successfully:', url);
          setIsLoading(false);
        }}
        onError={(e) => {
          console.error('Facebook video embed error:', e);
          setHasError(true);
          setIsLoading(false);
        }}
        sandbox="allow-same-origin allow-scripts allow-popups allow-popups-to-escape-sandbox allow-forms"
        referrerPolicy="no-referrer-when-downgrade"
      />
    </div>
  );
};

export default FacebookVideoPlayer;
