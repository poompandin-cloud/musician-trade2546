import React from 'react';

interface VideoPlayerFallbackProps {
  url: string;
  platform: 'facebook' | 'youtube';
  className?: string;
}

const VideoPlayerFallback = ({ url, platform, className = "" }: VideoPlayerFallbackProps) => {
  const getPlatformIcon = () => {
    switch (platform) {
      case 'facebook':
        return '📘';
      case 'youtube':
        return '📺';
      default:
        return '🎬';
    }
  };

  const getPlatformName = () => {
    switch (platform) {
      case 'facebook':
        return 'Facebook';
      case 'youtube':
        return 'YouTube';
      default:
        return 'Video';
    }
  };

  const getPlatformColor = () => {
    switch (platform) {
      case 'facebook':
        return 'bg-blue-600 hover:bg-blue-700';
      case 'youtube':
        return 'bg-red-600 hover:bg-red-700';
      default:
        return 'bg-gray-600 hover:bg-gray-700';
    }
  };

  return (
    <div className={`aspect-video bg-gray-900 rounded-lg overflow-hidden flex items-center justify-center ${className}`}>
      <div className="text-center text-white p-6">
        <div className="text-6xl mb-4">{getPlatformIcon()}</div>
        <div className="text-xl font-semibold mb-2">{getPlatformName()} Video</div>
        <div className="text-sm opacity-75 mb-4">ไม่สามารถโหลดวิดีโอได้ในขณะนี้</div>
        <a 
          href={url} 
          target="_blank" 
          rel="noopener noreferrer"
          className={`inline-block px-6 py-3 ${getPlatformColor()} text-white rounded-lg transition-colors`}
        >
          เปิดใน {getPlatformName()}
        </a>
        <div className="text-xs opacity-50 mt-4">
          {url}
        </div>
      </div>
    </div>
  );
};

export default VideoPlayerFallback;
