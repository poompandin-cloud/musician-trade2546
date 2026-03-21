import React, { useState } from 'react';
import VideoPlayerFallback from './VideoPlayerFallback';

interface FacebookVideoEmbedProps {
  url: string;
  className?: string;
}

const FacebookVideoEmbed = ({ url, className = "" }: FacebookVideoEmbedProps) => {
  const [hasError, setHasError] = useState(false);

  // แปลง Facebook URL ให้เป็น embed URL ที่ถูกต้อง
  const getEmbedUrl = (facebookUrl: string) => {
    try {
      // สำหรับ Facebook video URL ทุกรูปแบบ (รวม web.facebook.com/share/v/)
      const facebookRegex = /^(?:https?:\/\/)?(?:www\.)?(?:facebook\.com|web\.facebook\.com|fb\.watch)\/(?:share\/v\/|watch\/\?v=|videos\/|reel\/|[^\/]+\/videos\/|[^\/]+\/posts\/|[^\/]+\/permalink\/|share\/)([^&\?]*)/;
      const match = facebookUrl.match(facebookRegex);
      
      if (match) {
        // ใช้วิธี embed แบบใหม่ที่เชื่อถือได้กว่า
        return `https://www.facebook.com/plugins/video.php?href=${encodeURIComponent(facebookUrl)}&show_text=false&width=640&height=360&autoplay=false&allowfullscreen=true`;
      }
      
      // ถ้าไม่ match ให้ใช้ URL เดิม
      return `https://www.facebook.com/plugins/video.php?href=${encodeURIComponent(facebookUrl)}&show_text=false&width=640&height=360&autoplay=false&allowfullscreen=true`;
    } catch (error) {
      console.error('Error processing Facebook URL:', error);
      return facebookUrl;
    }
  };

  const embedUrl = getEmbedUrl(url);

  if (hasError) {
    return (
      <VideoPlayerFallback 
        url={url} 
        platform="facebook" 
        className={className}
      />
    );
  }

  return (
    <div className={`aspect-video bg-black rounded-lg overflow-hidden ${className}`}>
      <iframe
        src={embedUrl}
        className="w-full h-full"
        style={{
          border: 'none',
          overflow: 'hidden'
        }}
        scrolling="no"
        frameBorder="0"
        allowFullScreen={true}
        allow="autoplay; clipboard-write; encrypted-media; picture-in-picture; web-share"
        title="Facebook video player"
        onLoad={() => {
          console.log('Facebook video loaded successfully:', url);
        }}
        onError={(e) => {
          console.error('Facebook video embed error:', e);
          setHasError(true);
        }}
        sandbox="allow-same-origin allow-scripts allow-popups allow-popups-to-escape-sandbox"
      />
    </div>
  );
};

export default FacebookVideoEmbed;
