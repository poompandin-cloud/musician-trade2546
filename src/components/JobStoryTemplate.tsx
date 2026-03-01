import React, { useRef, useEffect, useState } from 'react';
import QRCode from 'qrcode';
import { MapPin, Calendar, Clock, DollarSign, Music } from 'lucide-react';

interface Job {
  id: string;
  title: string;
  instrument: string;
  venue: string;
  province: string;
  event_date: string;
  event_time: string;
  duration: string;
  payment: number;
  description: string;
  profiles?: {
    full_name: string;
    avatar_url: string;
  };
}

interface JobStoryTemplateProps {
  job: Job;
  onCapture?: (dataUrl: string) => void;
}

export const JobStoryTemplate: React.FC<JobStoryTemplateProps> = ({ 
  job, 
  onCapture 
}) => {
  const templateRef = useRef<HTMLDivElement>(null);
  const [qrCodeUrl, setQrCodeUrl] = useState<string>('');

  useEffect(() => {
    // สร้าง QR Code สำหรับหน้านี้
    const generateQRCode = async () => {
      try {
        const url = `${window.location.origin}/job/${job.id}`;
        const qrDataUrl = await QRCode.toDataURL(url, {
          width: 120,
          margin: 1,
          color: {
            dark: '#000000',
            light: '#FFFFFF',
          },
        });
        setQrCodeUrl(qrDataUrl);
      } catch (error) {
        console.error('Error generating QR code:', error);
      }
    };

    generateQRCode();
  }, [job.id]);

  const formatEventDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('th-TH', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  };

  const formatPayment = (amount: number) => {
    return `฿${amount.toLocaleString()}`;
  };

  return (
    <div className="relative">
      {/* Hidden Template for Capture */}
      <div
        ref={templateRef}
        className="fixed top-0 left-0 w-full h-full bg-white pointer-events-none z-50"
        style={{ 
          width: '360px', 
          height: '640px',
          background: 'white !important',
          position: 'absolute',
          left: '0',
          top: '0'
        }}
      >
        <div 
          className="w-full h-full p-6 flex flex-col"
          style={{
            width: '360px',
            height: '640px',
            background: 'linear-gradient(135deg, #fb923c 0%, #f97316 50%, #ec4899 100%)',
            padding: '24px',
            display: 'flex',
            flexDirection: 'column'
          }}
        >
          {/* Header */}
          <div 
            className="flex items-center justify-between mb-6"
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '24px'
            }}
          >
            <div 
              className="flex items-center gap-2"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}
            >
              <div 
                className="w-10 h-10 bg-white rounded-full flex items-center justify-center"
                style={{
                  width: '40px',
                  height: '40px',
                  backgroundColor: 'white',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                {/* Comment out Music icon for testing */}
              {/* <Music 
                className="w-6 h-6 text-orange-500"
                style={{
                  width: '24px',
                  height: '24px',
                  color: '#f97316'
                }}
              /> */}
              
              {/* Simple text fallback for Music icon */}
              <span 
                style={{
                  width: '24px',
                  height: '24px',
                  color: '#f97316',
                  fontSize: '18px',
                  fontWeight: 'bold',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                ♪
              </span>
              </div>
              <div>
                <h1 
                  className="text-white font-bold text-lg"
                  style={{
                    color: 'white !important',
                    fontWeight: 'bold',
                    fontSize: '18px',
                    margin: '0',
                    padding: '0'
                  }}
                >
                  Gig Glide
                </h1>
                <p 
                  className="text-white/80 text-xs"
                  style={{
                    color: 'rgba(255, 255, 255, 0.8) !important',
                    fontSize: '12px',
                    margin: '0',
                    padding: '0'
                  }}
                >
                  หางานดนตรี ง่ายๆ
                </p>
              </div>
            </div>
            <div 
              className="text-white/60 text-xs"
              style={{
                color: 'rgba(255, 255, 255, 0.6) !important',
                fontSize: '12px'
              }}
            >
              {new Date().toLocaleDateString('th-TH')}
            </div>
          </div>

          {/* Job Title */}
          <div 
            className="bg-white/20 rounded-2xl p-4 mb-4"
            style={{
              backgroundColor: 'rgba(255, 255, 255, 0.2)',
              borderRadius: '16px',
              padding: '16px',
              marginBottom: '16px'
            }}
          >
            <h2 
              className="text-white font-bold text-xl mb-2 line-clamp-2"
              style={{
                color: 'white !important',
                fontWeight: 'bold',
                fontSize: '20px',
                marginBottom: '8px',
                margin: '0 0 8px 0',
                padding: '0'
              }}
            >
              {job.title}
            </h2>
            <div 
              className="flex items-center gap-2 text-white/90 text-sm"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                color: 'rgba(255, 255, 255, 0.9) !important',
                fontSize: '14px'
              }}
            >
              {/* Comment out Music icon for testing */}
              {/* <Music 
                className="w-4 h-4"
                style={{
                  width: '16px',
                  height: '16px'
                }}
              /> */}
              
              {/* Simple text fallback for Music icon */}
              <span 
                style={{
                  width: '16px',
                  height: '16px',
                  color: 'rgba(255, 255, 255, 0.9)',
                  fontSize: '12px',
                  fontWeight: 'bold',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                ♪
              </span>
              <span>{job.instrument}</span>
            </div>
          </div>

          {/* Job Details */}
          <div 
            className="bg-white/20 rounded-2xl p-4 mb-4 flex-1"
            style={{
              backgroundColor: 'rgba(255, 255, 255, 0.2)',
              borderRadius: '16px',
              padding: '16px',
              marginBottom: '16px',
              flex: '1',
              display: 'flex',
              flexDirection: 'column'
            }}
          >
            <div 
              className="space-y-3"
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '12px'
              }}
            >
              {/* Location */}
              <div 
                className="flex items-start gap-3"
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '12px'
                }}
              >
                {/* Comment out MapPin icon for testing */}
                {/* <MapPin 
                  className="w-5 h-5 text-white/80 mt-0.5 flex-shrink-0"
                  style={{
                    width: '20px',
                    height: '20px',
                    color: 'rgba(255, 255, 255, 0.8) !important',
                    marginTop: '2px',
                    flexShrink: '0'
                  }}
                /> */}
                
                {/* Simple text fallback for MapPin icon */}
                <span 
                  style={{
                    width: '20px',
                    height: '20px',
                    color: 'rgba(255, 255, 255, 0.8) !important',
                    fontSize: '14px',
                    fontWeight: 'bold',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginTop: '2px',
                    flexShrink: '0'
                  }}
                >
                  📍
                </span>
                <div>
                  <p 
                    className="text-white font-medium"
                    style={{
                      color: 'white !important',
                      fontWeight: '500',
                      margin: '0',
                      padding: '0'
                    }}
                  >
                    {job.venue}
                  </p>
                  <p 
                    className="text-white/80 text-sm"
                    style={{
                      color: 'rgba(255, 255, 255, 0.8) !important',
                      fontSize: '14px',
                      margin: '0',
                      padding: '0'
                    }}
                  >
                    {job.province}
                  </p>
                </div>
              </div>

              {/* Date & Time */}
              <div 
                className="flex items-center gap-3"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px'
                }}
              >
                {/* Comment out Calendar icon for testing */}
                {/* <Calendar 
                  className="w-5 h-5 text-white/80 flex-shrink-0"
                  style={{
                    width: '20px',
                    height: '20px',
                    color: 'rgba(255, 255, 255, 0.8) !important',
                    flexShrink: '0'
                  }}
                /> */}
                
                {/* Simple text fallback for Calendar icon */}
                <span 
                  style={{
                    width: '20px',
                    height: '20px',
                    color: 'rgba(255, 255, 255, 0.8) !important',
                    fontSize: '14px',
                    fontWeight: 'bold',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: '0'
                  }}
                >
                  📅
                </span>
                <div>
                  <p 
                    className="text-white font-medium"
                    style={{
                      color: 'white !important',
                      fontWeight: '500',
                      margin: '0',
                      padding: '0'
                    }}
                  >
                    {formatEventDate(job.event_date)}
                  </p>
                  <p 
                    className="text-white/80 text-sm"
                    style={{
                      color: 'rgba(255, 255, 255, 0.8) !important',
                      fontSize: '14px',
                      margin: '0',
                      padding: '0'
                    }}
                  >
                    {job.event_time}
                  </p>
                </div>
              </div>

              {/* Duration */}
              <div 
                className="flex items-center gap-3"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px'
                }}
              >
                {/* Comment out Clock icon for testing */}
                {/* <Clock 
                  className="w-5 h-5 text-white/80 flex-shrink-0"
                  style={{
                    width: '20px',
                    height: '20px',
                    color: 'rgba(255, 255, 255, 0.8) !important',
                    flexShrink: '0'
                  }}
                /> */}
                
                {/* Simple text fallback for Clock icon */}
                <span 
                  style={{
                    width: '20px',
                    height: '20px',
                    color: 'rgba(255, 255, 255, 0.8) !important',
                    fontSize: '14px',
                    fontWeight: 'bold',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: '0'
                  }}
                >
                  🕐
                </span>
                <p 
                  className="text-white font-medium"
                  style={{
                    color: 'white !important',
                    fontWeight: '500',
                    margin: '0',
                    padding: '0'
                  }}
                >
                  {job.duration}
                </p>
              </div>

              {/* Payment */}
              <div 
                className="flex items-center gap-3"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px'
                }}
              >
                {/* Comment out DollarSign icon for testing */}
                {/* <DollarSign 
                  className="w-5 h-5 text-white/80 flex-shrink-0"
                  style={{
                    width: '20px',
                    height: '20px',
                    color: 'rgba(255, 255, 255, 0.8) !important',
                    flexShrink: '0'
                  }}
                /> */}
                
                {/* Simple text fallback for DollarSign icon */}
                <span 
                  style={{
                    width: '20px',
                    height: '20px',
                    color: 'rgba(255, 255, 255, 0.8) !important',
                    fontSize: '14px',
                    fontWeight: 'bold',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: '0'
                  }}
                >
                  💰
                </span>
                <p 
                  className="text-white font-bold text-lg"
                  style={{
                    color: 'white !important',
                    fontWeight: 'bold',
                    fontSize: '18px',
                    margin: '0',
                    padding: '0'
                  }}
                >
                  {formatPayment(job.payment)}
                </p>
              </div>

              {/* Description */}
              {job.description && (
                <div 
                  className="mt-4 pt-3 border-t border-white/30"
                  style={{
                    marginTop: '16px',
                    paddingTop: '12px',
                    borderTop: '1px solid rgba(255, 255, 255, 0.3)'
                  }}
                >
                  <p 
                    className="text-white/90 text-sm line-clamp-3"
                    style={{
                      color: 'rgba(255, 255, 255, 0.9) !important',
                      fontSize: '14px',
                      margin: '0',
                      padding: '0',
                      overflow: 'hidden',
                      display: '-webkit-box',
                      WebkitLineClamp: 3,
                      WebkitBoxOrient: 'vertical'
                    }}
                  >
                    {job.description}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Footer */}
          <div 
            className="flex items-center justify-between"
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}
          >
            <div 
              className="flex items-center gap-2"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}
            >
              {/* Comment out profile image for testing */}
              {/* {job.profiles?.avatar_url ? (
                <img 
                  src={job.profiles.avatar_url} 
                  alt={job.profiles.full_name || ''}
                  className="w-8 h-8 rounded-full object-cover"
                  style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '50%',
                    objectFit: 'cover'
                  }}
                />
              ) : (
                <div 
                  className="w-8 h-8 bg-white/30 rounded-full flex items-center justify-center"
                  style={{
                    width: '32px',
                    height: '32px',
                    backgroundColor: 'rgba(255, 255, 255, 0.3)',
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                >
                  <span 
                    className="text-white text-xs font-bold"
                    style={{
                      color: 'white !important',
                      fontSize: '12px',
                      fontWeight: 'bold'
                    }}
                  >
                    {job.profiles?.full_name?.charAt(0) || '?'}
                  </span>
                </div>
              )} */}
              
              {/* Simple text fallback for testing */}
              <div 
                className="w-8 h-8 bg-white/30 rounded-full flex items-center justify-center"
                style={{
                  width: '32px',
                  height: '32px',
                  backgroundColor: 'rgba(255, 255, 255, 0.3)',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                <span 
                  className="text-white text-xs font-bold"
                  style={{
                    color: 'white !important',
                    fontSize: '12px',
                    fontWeight: 'bold'
                  }}
                >
                  {job.profiles?.full_name?.charAt(0) || '?'}
                </span>
              </div>
              <div>
                <p 
                  className="text-white font-medium text-sm"
                  style={{
                    color: 'white !important',
                    fontWeight: '500',
                    fontSize: '14px',
                    margin: '0',
                    padding: '0'
                  }}
                >
                  {job.profiles?.full_name || 'ไม่ระบุชื่อ'}
                </p>
                <p 
                  className="text-white/70 text-xs"
                  style={{
                    color: 'rgba(255, 255, 255, 0.7) !important',
                    fontSize: '12px',
                    margin: '0',
                    padding: '0'
                  }}
                >
                  ผู้ประกาศงาน
                </p>
              </div>
            </div>

            {/* Comment out QR Code for testing */}
            {/* {qrCodeUrl && (
              <div 
                className="bg-white rounded-xl p-2"
                style={{
                  backgroundColor: 'white !important',
                  borderRadius: '12px',
                  padding: '8px'
                }}
              >
                <img 
                  src={qrCodeUrl} 
                  alt="QR Code" 
                  className="w-16 h-16"
                  style={{
                    width: '64px',
                    height: '64px'
                  }}
                />
              </div>
            )} */}
            
            {/* Simple text placeholder for QR Code */}
            <div 
              className="bg-white rounded-xl p-2 flex items-center justify-center"
              style={{
                backgroundColor: 'white !important',
                borderRadius: '12px',
                padding: '8px',
                width: '80px',
                height: '80px'
              }}
            >
              <span 
                className="text-gray-800 text-xs font-bold text-center"
                style={{
                  color: '#1f2937 !important',
                  fontSize: '10px',
                  fontWeight: 'bold',
                  textAlign: 'center'
                }}
              >
                QR Code
              </span>
            </div>
          </div>

          {/* Call to Action */}
          <div 
            className="mt-4 text-center"
            style={{
              marginTop: '16px',
              textAlign: 'center'
            }}
          >
            <p 
              className="text-white text-sm font-medium"
              style={{
                color: 'white !important',
                fontSize: '14px',
                fontWeight: '500',
                margin: '0',
                padding: '0'
              }}
            >
              สแกน QR Code เพื่อดูรายละเอียด
            </p>
            <p 
              className="text-white/70 text-xs"
              style={{
                color: 'rgba(255, 255, 255, 0.7) !important',
                fontSize: '12px',
                margin: '0',
                padding: '0'
              }}
            >
              หรือค้นหา "Gig Glide" ใน App Store
            </p>
          </div>
        </div>
      </div>

      {/* Preview (for development) */}
      <div className="w-80 h-[568px] bg-gradient-to-br from-orange-400 via-orange-500 to-pink-500 p-4 rounded-2xl overflow-hidden">
        <div className="w-full h-full bg-white/10 backdrop-blur-sm rounded-xl p-4 flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center">
                <Music className="w-5 h-5 text-orange-500" />
              </div>
              <div>
                <h1 className="text-white font-bold text-sm">Gig Glide</h1>
                <p className="text-white/80 text-xs">หางานดนตรี ง่ายๆ</p>
              </div>
            </div>
          </div>

          {/* Job Title */}
          <div className="bg-white/20 backdrop-blur-sm rounded-xl p-3 mb-3">
            <h2 className="text-white font-bold text-lg line-clamp-2">
              {job.title}
            </h2>
            <div className="flex items-center gap-2 text-white/90 text-xs">
              <Music className="w-3 h-3" />
              <span>{job.instrument}</span>
            </div>
          </div>

          {/* Job Details */}
          <div className="bg-white/20 backdrop-blur-sm rounded-xl p-3 flex-1 mb-3">
            <div className="space-y-2">
              {/* Location */}
              <div className="flex items-start gap-2">
                <MapPin className="w-4 h-4 text-white/80 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-white font-medium text-sm">{job.venue}</p>
                  <p className="text-white/80 text-xs">{job.province}</p>
                </div>
              </div>

              {/* Date & Time */}
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-white/80 flex-shrink-0" />
                <p className="text-white font-medium text-sm">{formatEventDate(job.event_date)} {job.event_time}</p>
              </div>

              {/* Duration */}
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-white/80 flex-shrink-0" />
                <p className="text-white font-medium text-sm">{job.duration}</p>
              </div>

              {/* Payment */}
              <div className="flex items-center gap-2">
                <DollarSign className="w-4 h-4 text-white/80 flex-shrink-0" />
                <p className="text-white font-bold text-lg">{formatPayment(job.payment)}</p>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {job.profiles?.avatar_url ? (
                <img 
                  src={job.profiles.avatar_url} 
                  alt={job.profiles.full_name || ''}
                  className="w-6 h-6 rounded-full object-cover"
                />
              ) : (
                <div className="w-6 h-6 bg-white/30 rounded-full flex items-center justify-center">
                  <span className="text-white text-xs font-bold">
                    {job.profiles?.full_name?.charAt(0) || '?'}
                  </span>
                </div>
              )}
              <div>
                <p className="text-white font-medium text-xs">
                  {job.profiles?.full_name || 'ไม่ระบุชื่อ'}
                </p>
              </div>
            </div>

            {/* QR Code */}
            {qrCodeUrl && (
              <div className="bg-white rounded-lg p-1">
                <img 
                  src={qrCodeUrl} 
                  alt="QR Code" 
                  className="w-12 h-12"
                />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
