import React, { useState } from 'react';
import { AlertTriangle, X, Check, AlertCircle, Shield, Image, MessageSquare } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface ReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  message: {
    id: string;
    user_id: string;
    text: string;
    sender_name: string;
  };
  currentUser: any;
}

const ReportModal: React.FC<ReportModalProps> = ({ 
  isOpen, 
  onClose, 
  message, 
  currentUser 
}) => {
  const [reportReason, setReportReason] = useState('');
  const [reportDetails, setReportDetails] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle');

  const reportReasons = [
    { value: 'inappropriate_content', label: 'เนื้อหาไม่เหมาะสม', icon: AlertCircle },
    { value: 'harassment', label: 'การคุกคาม', icon: Shield },
    { value: 'spam', label: 'สแปม', icon: MessageSquare },
    { value: 'inappropriate_image', label: 'รูปภาพไม่เหมาะสม', icon: Image },
    { value: 'threat', label: 'ข่มขู่', icon: AlertTriangle },
    { value: 'hate_speech', label: 'คำพูดเกลียดชัง', icon: AlertTriangle },
    { value: 'other', label: 'อื่นๆ', icon: MessageSquare }
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!reportReason || !currentUser) return;

    setIsSubmitting(true);
    setSubmitStatus('idle');

    try {
      const { error } = await supabase
        .from('message_reports')
        .insert({
          message_id: message.id,
          reporter_id: currentUser.id,
          reported_user_id: message.user_id,
          report_reason: reportReason,
          report_details: reportDetails || null
        });

      if (error) {
        console.error('Error submitting report:', error);
        setSubmitStatus('error');
        return;
      }

      setSubmitStatus('success');
      
      // ปิด modal หลังจากสำเร็จ
      setTimeout(() => {
        onClose();
        // Reset form
        setReportReason('');
        setReportDetails('');
        setSubmitStatus('idle');
      }, 2000);

    } catch (error) {
      console.error('Error submitting report:', error);
      setSubmitStatus('error');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-red-500" />
              รายงานข้อความ
            </h3>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* แสดงข้อความที่จะรายงาน */}
          <div className="mb-4 p-3 bg-gray-50 rounded-lg border border-gray-200">
            <p className="text-sm font-medium text-gray-700 mb-1">
              จาก: {message.sender_name}
            </p>
            <p className="text-sm text-gray-600 line-clamp-3">
              {message.text}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* เลือกเหตุผลการรายงาน */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                เหตุผลการรายงาน *
              </label>
              <div className="space-y-2">
                {reportReasons.map((reason) => {
                  const Icon = reason.icon;
                  return (
                    <label
                      key={reason.value}
                      className="flex items-center p-3 border rounded-lg cursor-pointer hover:bg-gray-50 transition-colors"
                    >
                      <input
                        type="radio"
                        name="reportReason"
                        value={reason.value}
                        checked={reportReason === reason.value}
                        onChange={(e) => setReportReason(e.target.value)}
                        className="mr-3"
                      />
                      <Icon className="w-4 h-4 text-gray-500 mr-2" />
                      <span className="text-sm text-gray-700">{reason.label}</span>
                    </label>
                  );
                })}
              </div>
            </div>

            {/* รายละเอียดเพิ่มเติม */}
            {(reportReason === 'other' || reportReason) && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {reportReason === 'other' ? 'รายละเอียด *' : 'รายละเอียดเพิ่มเติม'}
                </label>
                <textarea
                  value={reportDetails}
                  onChange={(e) => setReportDetails(e.target.value)}
                  placeholder={reportReason === 'other' ? 'กรุณาระบุรายละเอียด...' : 'ระบุรายละเอียดเพิ่มเติม (ถ้ามี)...'}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                  rows={3}
                  required={reportReason === 'other'}
                />
              </div>
            )}

            {/* ปุ่มส่ง */}
            <div className="flex gap-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
              >
                ยกเลิก
              </button>
              <button
                type="submit"
                disabled={!reportReason || isSubmitting}
                className="flex-1 px-4 py-2 text-white bg-red-500 hover:bg-red-600 disabled:bg-gray-300 disabled:cursor-not-allowed rounded-lg transition-colors flex items-center justify-center gap-2"
              >
                {isSubmitting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    กำลังส่ง...
                  </>
                ) : submitStatus === 'success' ? (
                  <>
                    <Check className="w-4 h-4" />
                    สำเร็จ
                  </>
                ) : (
                  'ส่งรายงาน'
                )}
              </button>
            </div>

            {/* ข้อความแจ้งเตือน */}
            {submitStatus === 'error' && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm text-red-600">
                  เกิดข้อผิดพลาดในการส่งรายงาน กรุณาลองใหม่อีกครั้ง
                </p>
              </div>
            )}

            {submitStatus === 'success' && (
              <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                <p className="text-sm text-green-600">
                  รายงานของคุณถูกส่งเรียบร้อยแล้ว ขอบคุณที่ช่วยรักษาความสุภาพในชุมชน
                </p>
              </div>
            )}
          </form>
        </div>
      </div>
    </div>
  );
};

interface ImageUploadGuardProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  isUploading?: boolean;
}

const ImageUploadGuard: React.FC<ImageUploadGuardProps> = ({ 
  isOpen, 
  onClose, 
  onConfirm, 
  isUploading = false 
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
        <div className="flex items-center justify-center mb-4">
          <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center">
            <Image className="w-6 h-6 text-orange-600" />
          </div>
        </div>
        
        <h3 className="text-lg font-semibold text-gray-900 text-center mb-2">
          ยืนยันการอัปโหลดรูปภาพ
        </h3>
        
        <p className="text-gray-600 text-center mb-6">
          รูปภาพนี้ไม่ใช่รูปภาพอนาจารและไม่ละเมิดกฎของชุมชนใช่หรือไม่?
        </p>

        <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 mb-6">
          <p className="text-sm text-amber-800">
            <strong>คำเตือน:</strong> การส่งรูปภาพอนาจารหรือเนื้อหาที่ไม่เหมาะสมอาจส่งผลให้บัญชีของคุณถูกระงับทันที
          </p>
        </div>

        <div className="flex gap-3">
          <button
            onClick={onClose}
            disabled={isUploading}
            className="flex-1 px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 disabled:bg-gray-100 disabled:cursor-not-allowed rounded-lg transition-colors"
          >
            ยกเลิก
          </button>
          <button
            onClick={onConfirm}
            disabled={isUploading}
            className="flex-1 px-4 py-2 text-white bg-blue-500 hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed rounded-lg transition-colors flex items-center justify-center gap-2"
          >
            {isUploading ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                กำลังอัปโหลด...
              </>
            ) : (
              'ยืนยัน'
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

interface InputDisclaimerProps {
  show?: boolean;
}

const InputDisclaimer: React.FC<InputDisclaimerProps> = ({ show = true }) => {
  if (!show) return null;

  return (
    <div className="px-3 pb-1">
      <p className="text-xs text-gray-400 italic">
        โปรดรักษาความสุภาพ การส่งรูปภาพอนาจารหรือข้อความคุกคามจะถูกระงับบัญชีทันที
      </p>
    </div>
  );
};

export { ReportModal, ImageUploadGuard, InputDisclaimer };
