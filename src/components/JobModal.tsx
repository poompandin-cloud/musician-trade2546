'use client';

import React from 'react';

interface Job {
  id: string;
  title: string;
  time: string; // ✅ ใช้คอลัมน์ time แทน starttime/endtime
  location: string;
  date: string; // format: "DD/MM/YYYY"
}

interface JobModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (jobs: Job[]) => void; // เปลี่ยนเป็น array
  selectedDate: string;
  editingJobs?: Job[]; // เปลี่ยนเป็น array
  onDeleteJob?: (jobId: string) => void; // เพิ่มฟังก์ชันลบ
  isOwner?: boolean; // เพิ่ม prop สำหรับตรวจสอบสิทธิ์
}

export const JobModal: React.FC<JobModalProps> = ({ 
  isOpen, 
  onClose, 
  onSave, 
  selectedDate,
  editingJobs,
  onDeleteJob,
  isOwner = true // default เป็น true
}) => {
  const [jobs, setJobs] = React.useState<Job[]>([]);

  React.useEffect(() => {
    if (isOpen) {
      if (editingJobs && editingJobs.length > 0) {
        // ถ้าเป็นโหมดแก้ไข ให้เติมข้อมูลเก่า
        setJobs(editingJobs);
      } else {
        // ถ้าเป็นโหมดเพิ่มใหม่ ให้เริ่มด้วยงานเปล่า
        setJobs([]);
      }
    }
  }, [isOpen, editingJobs]);

  const handleAddJob = () => {
    const newJob: Job = {
      id: Date.now().toString(),
      title: '',
      time: '09:00', // ✅ ใช้คอลัมน์ time แทน starttime/endtime
      location: '',
      date: selectedDate,
    };
    setJobs([...jobs, newJob]);
  };

  const handleRemoveJob = (jobId: string) => {
    // ถ้ามี onDeleteJob ให้เรียกใช้เพื่อลบจาก Supabase และ State
    if (onDeleteJob) {
      onDeleteJob(jobId);
    }
    // ลบจาก State ใน Modal
    setJobs(jobs.filter(job => job.id !== jobId));
  };

  const handleJobChange = (jobId: string, field: keyof Job, value: string) => {
    setJobs(jobs.map(job => 
      job.id === jobId ? { ...job, [field]: value } : job
    ));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // ถ้าไม่ใช่เจ้าของ ไม่ให้บันทึก
    if (!isOwner) {
      return;
    }
    
    // กรองเอาเฉพาะงานที่มีข้อมูลครบ
    const validJobs = jobs.filter(job => job.title.trim());
    onSave(validJobs);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-md mx-auto shadow-2xl">
        <div className="p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold text-gray-800">
              📅 {isOwner ? (editingJobs && editingJobs.length > 0 ? 'แก้ไขงาน' : 'เพิ่มงาน') : 'ข้อมูลงาน'}วันที่ {selectedDate}
            </h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 text-2xl leading-none"
            >
              ×
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="max-h-96 overflow-y-auto space-y-4">
              {jobs.map((job, index) => (
                <div key={job.id} className="border border-gray-200 rounded-lg p-4 space-y-3">
                  <div className="flex justify-between items-center">
                    <h3 className="font-semibold text-gray-700">งานที่ {index + 1}</h3>
                    {isOwner && (
                      <button
                        type="button"
                        onClick={() => handleRemoveJob(job.id)}
                        className="text-red-500 hover:text-red-700 text-sm"
                      >
                        ลบ
                      </button>
                    )}
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      ชื่อร้านที่เล่น
                    </label>
                    <input
                      type="text"
                      value={job.title}
                      onChange={(e) => handleJobChange(job.id, 'title', e.target.value)}
                      className={`w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${!isOwner ? 'bg-gray-100 cursor-not-allowed' : ''}`}
                      placeholder="เช่น ร้านอาหาร ABC"
                      required
                      disabled={!isOwner}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        เวลา
                      </label>
                      <input
                        type="time"
                        value={job.time}
                        onChange={(e) => handleJobChange(job.id, 'time', e.target.value)}
                        className={`w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${!isOwner ? 'bg-gray-100 cursor-not-allowed' : ''}`}
                        disabled={!isOwner}
                      />
                    </div>
                    <div>
                      {/* ลบช่องเวลาจบออกเนื่องจากใช้คอลัมน์ time เดียว */}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {isOwner && (
              <button
                type="button"
                onClick={handleAddJob}
                className="w-full px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
              >
                + เพิ่มงาน
              </button>
            )}

            <div className="flex gap-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                ยกเลิก
              </button>
              {isOwner && (
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                >
                  บันทึกงาน
                </button>
              )}
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
