import React, { useState, useEffect } from 'react';
import { LineConnectButton } from '@/components/LineConnectButton';

export default function LineCallback() {
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [error, setError] = useState<string>('');

  useEffect(() => {
    const handleLineCallback = async () => {
      try {
        const urlParams = new URLSearchParams(window.location.search);
        const code = urlParams.get('code');
        const state = urlParams.get('state');
        const errorParam = urlParams.get('error');

        if (errorParam) {
          setError(errorParam);
          setStatus('error');
          return;
        }

        if (!code) {
          setError('ไม่พบ authorization code');
          setStatus('error');
          return;
        }

        // ส่งข้อมูลไปยัง parent window
        if (window.opener) {
          // แลกเปลี่ยน code กับ access token
          const response = await fetch('/api/line-token-exchange', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ code }),
          });

          const data = await response.json();

          if (response.ok) {
            window.opener.postMessage({
              type: 'LINE_LOGIN_SUCCESS',
              lineUserId: data.lineUserId
            }, window.location.origin);
          } else {
            window.opener.postMessage({
              type: 'LINE_LOGIN_ERROR',
              error: data.error || 'ไม่สามารถเชื่อมต่อ LINE ได้'
            }, window.location.origin);
          }
        }

        // ปิดหน้าต่าง
        window.close();

      } catch (err) {
        console.error('LINE Callback Error:', err);
        setError('เกิดข้อผิดพลาดในการเชื่อมต่อ LINE');
        setStatus('error');
        
        if (window.opener) {
          window.opener.postMessage({
            type: 'LINE_LOGIN_ERROR',
            error: 'เกิดข้อผิดพลาดในการเชื่อมต่อ LINE'
          }, window.location.origin);
        }
        
        setTimeout(() => window.close(), 2000);
      }
    };

    handleLineCallback();
  }, []);

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-500 mx-auto mb-4"></div>
          <p className="text-gray-600">กำลังเชื่อมต่อ LINE...</p>
        </div>
      </div>
    );
  }

  if (status === 'error') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="text-center">
          <div className="text-red-500 mb-4">
            <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">เชื่อมต่อ LINE ไม่สำเร็จ</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <button 
            onClick={() => window.close()}
            className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors"
          >
            ปิดหน้าต่าง
          </button>
        </div>
      </div>
    );
  }

  return null;
}
