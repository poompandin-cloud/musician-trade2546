-- =====================================================
-- SQL สำหรับสร้างตาราง message_reports
-- ใช้สำหรับระบบรายงานข้อความที่ไม่เหมาะสมในแชท
-- =====================================================

-- 1. สร้างตาราง message_reports
CREATE TABLE IF NOT EXISTS message_reports (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    message_id UUID NOT NULL REFERENCES public_chats(id) ON DELETE CASCADE,
    reporter_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    reported_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- ข้อมูลการรายงาน
    report_reason TEXT NOT NULL CHECK (report_reason IN (
        'inappropriate_content',      -- เนื้อหาไม่เหมาะสม
        'harassment',                -- การคุกคาม
        'spam',                      -- สแปม
        'fake_profile',              -- โปรไฟล์ปลอม
        'inappropriate_image',        -- รูปภาพไม่เหมาะสม
        'threat',                    -- ข่มขู่
        'hate_speech',              -- คำพูดเกลียดชัง
        'other'                     -- อื่นๆ
    )),
    
    -- รายละเอียดเพิ่มเติม (ถ้าเลือก other)
    report_details TEXT,
    
    -- สถานะการรายงาน
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN (
        'pending',      -- รอดำเนินการ
        'reviewing',    -- กำลังตรวจสอบ
        'resolved',     -- ดำเนินการแล้ว
        'dismissed'     -- ยกเลิกการรายงาน
    )),
    
    -- ผลการดำเนินการ
    action_taken TEXT CHECK (action_taken IN (
        'none',             -- ไม่มีการดำเนินการ
        'warning_sent',     -- ส่งคำเตือน
        'message_deleted',  -- ลบข้อความ
        'user_suspended',   -- ระงับบัญชีชั่วคราว
        'user_banned',      -- ระงับบัญชีถาวร
        'content_removed'   -- ลบเนื้อหา
    )),
    
    -- ข้อมูลผู้ดำเนินการ (Admin)
    reviewed_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    review_notes TEXT,
    
    -- ข้อมูลเวลา
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    reviewed_at TIMESTAMPTZ,
    
    -- ข้อมูลสำหรับการค้นหาและกรอง
    search_vector tsvector GENERATED ALWAYS AS (
        setweight(to_tsvector('thai', COALESCE(report_reason, '')), 'A') ||
        setweight(to_tsvector('thai', COALESCE(report_details, '')), 'B')
    ) STORED,
    
    -- Constraints และ Indexes
    CONSTRAINT unique_report_per_user UNIQUE (message_id, reporter_id),
    CONSTRAINT valid_reporter CHECK (reporter_id != reported_user_id)
);

-- 2. สร้าง Indexes สำหรับการค้นหาที่รวดเร็ว
CREATE INDEX IF NOT EXISTS idx_message_reports_message_id ON message_reports(message_id);
CREATE INDEX IF NOT EXISTS idx_message_reports_reporter_id ON message_reports(reporter_id);
CREATE INDEX IF NOT EXISTS idx_message_reports_reported_user_id ON message_reports(reported_user_id);
CREATE INDEX IF NOT EXISTS idx_message_reports_status ON message_reports(status);
CREATE INDEX IF NOT EXISTS idx_message_reports_created_at ON message_reports(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_message_reports_search_vector ON message_reports USING GIN(search_vector);

-- 3. สร้าง Index สำหรับการค้นหาแบบ Full-text Search
CREATE INDEX IF NOT EXISTS idx_message_reports_fulltext ON message_reports USING GIN(
    to_tsvector('thai', report_reason || ' ' || COALESCE(report_details, ''))
);

-- 4. สร้าง Function สำหรับอัปเดต updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 5. สร้าง Trigger สำหรับอัปเดต updated_at
CREATE TRIGGER update_message_reports_updated_at
    BEFORE UPDATE ON message_reports
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- 6. สร้าง Function สำหรับการตรวจสอบว่าผู้ใช้สามารถรายงานได้หรือไม่
CREATE OR REPLACE FUNCTION can_report_message(
    p_message_id UUID,
    p_reporter_id UUID
) RETURNS BOOLEAN AS $$
DECLARE
    report_count INTEGER;
    message_user_id UUID;
BEGIN
    -- ตรวจสอบว่าข้อความมีอยู่จริง
    SELECT user_id INTO message_user_id 
    FROM public_chats 
    WHERE id = p_message_id;
    
    IF message_user_id IS NULL THEN
        RETURN FALSE;
    END IF;
    
    -- ตรวจสอบว่าไม่ใช่ข้อความของตัวเอง
    IF message_user_id = p_reporter_id THEN
        RETURN FALSE;
    END IF;
    
    -- ตรวจสอบว่าไม่เคยรายงานข้อความนี้มาก่อน
    SELECT COUNT(*) INTO report_count
    FROM message_reports 
    WHERE message_id = p_message_id AND reporter_id = p_reporter_id;
    
    IF report_count > 0 THEN
        RETURN FALSE;
    END IF;
    
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

-- 7. สร้าง Function สำหรับการนับจำนวนการรายงานของผู้ใช้
CREATE OR REPLACE FUNCTION get_user_report_stats(
    p_user_id UUID
) RETURNS TABLE(
    total_reports BIGINT,
    pending_reports BIGINT,
    resolved_reports BIGINT,
    last_report_date TIMESTAMPTZ
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COUNT(*) as total_reports,
        COUNT(*) FILTER (WHERE status = 'pending') as pending_reports,
        COUNT(*) FILTER (WHERE status = 'resolved') as resolved_reports,
        MAX(created_at) as last_report_date
    FROM message_reports 
    WHERE reported_user_id = p_user_id;
END;
$$ LANGUAGE plpgsql;

-- 8. สร้าง Function สำหรับการดึงข้อมูลการรายงานพร้อมข้อความ
CREATE OR REPLACE FUNCTION get_message_reports_with_details(
    p_limit INTEGER DEFAULT 50,
    p_offset INTEGER DEFAULT 0,
    p_status TEXT DEFAULT NULL
) RETURNS TABLE(
    id UUID,
    message_id UUID,
    reporter_id UUID,
    reported_user_id UUID,
    report_reason TEXT,
    report_details TEXT,
    status TEXT,
    action_taken TEXT,
    created_at TIMESTAMPTZ,
    message_content TEXT,
    message_created_at TIMESTAMPTZ,
    reporter_name TEXT,
    reported_user_name TEXT,
    reporter_avatar TEXT,
    reported_user_avatar TEXT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        mr.id,
        mr.message_id,
        mr.reporter_id,
        mr.reported_user_id,
        mr.report_reason,
        mr.report_details,
        mr.status,
        mr.action_taken,
        mr.created_at,
        pc.content as message_content,
        pc.created_at as message_created_at,
        rp.full_name as reporter_name,
        rpu.full_name as reported_user_name,
        rp.avatar_url as reporter_avatar,
        rpu.avatar_url as reported_user_avatar
    FROM message_reports mr
    LEFT JOIN public_chats pc ON mr.message_id = pc.id
    LEFT JOIN profiles rp ON mr.reporter_id = rp.id
    LEFT JOIN profiles rpu ON mr.reported_user_id = rpu.id
    WHERE (p_status IS NULL OR mr.status = p_status)
    ORDER BY mr.created_at DESC
    LIMIT p_limit OFFSET p_offset;
END;
$$ LANGUAGE plpgsql;

-- 9. สร้าง Row Level Security (RLS)
ALTER TABLE message_reports ENABLE ROW LEVEL SECURITY;

-- Policy สำหรับผู้ใช้ทั่วไป
CREATE POLICY "Users can view their own reports" ON message_reports
    FOR SELECT USING (auth.uid() = reporter_id);

-- Policy สำหรับการสร้างรายงาน
CREATE POLICY "Users can create reports" ON message_reports
    FOR INSERT WITH CHECK (
        auth.uid() = reporter_id AND 
        auth.uid() != reported_user_id
    );

-- Policy สำหรับ Admin
CREATE POLICY "Admins can view all reports" ON message_reports
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- 10. สร้าง View สำหรับ Admin Dashboard
CREATE OR REPLACE VIEW admin_message_reports AS
SELECT 
    mr.*,
    pc.content as message_content,
    pc.created_at as message_created_at,
    pc.image_url as message_image_url,
    reporter.full_name as reporter_name,
    reporter.avatar_url as reporter_avatar,
    reported_user.full_name as reported_user_name,
    reported_user.avatar_url as reported_user_avatar,
    reporter.email as reporter_email,
    reported_user.email as reported_user_email
FROM message_reports mr
LEFT JOIN public_chats pc ON mr.message_id = pc.id
LEFT JOIN profiles reporter ON mr.reporter_id = reporter.id
LEFT JOIN profiles reported_user ON mr.reported_user_id = reported_user.id
ORDER BY mr.created_at DESC;

-- 11. สร้าง Trigger สำหรับการแจ้งเตือน Admin เมื่อมีการรายงานใหม่
CREATE OR REPLACE FUNCTION notify_admin_on_new_report()
RETURNS TRIGGER AS $$
BEGIN
    -- ส่ง notification ไปยัง Admin channel
    PERFORM pg_notify(
        'admin_reports',
        json_build_object(
            'type', 'new_report',
            'report_id', NEW.id,
            'message_id', NEW.message_id,
            'reporter_id', NEW.reporter_id,
            'reported_user_id', NEW.reported_user_id,
            'reason', NEW.report_reason,
            'created_at', NEW.created_at
        )::text
    );
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_notify_admin_on_new_report
    AFTER INSERT ON message_reports
    FOR EACH ROW
    EXECUTE FUNCTION notify_admin_on_new_report();

-- 12. สร้าง Function สำหรับการอัปเดตสถานะการรายงาน
CREATE OR REPLACE FUNCTION update_report_status(
    p_report_id UUID,
    p_status TEXT,
    p_action_taken TEXT DEFAULT NULL,
    p_review_notes TEXT DEFAULT NULL,
    p_admin_id UUID DEFAULT NULL
) RETURNS BOOLEAN AS $$
DECLARE
    existing_report RECORD;
BEGIN
    -- ตรวจสอบว่ารายงานมีอยู่จริง
    SELECT * INTO existing_report 
    FROM message_reports 
    WHERE id = p_report_id;
    
    IF existing_report IS NULL THEN
        RETURN FALSE;
    END IF;
    
    -- อัปเดตสถานะ
    UPDATE message_reports SET
        status = p_status,
        action_taken = p_action_taken,
        review_notes = p_review_notes,
        reviewed_by = p_admin_id,
        reviewed_at = NOW()
    WHERE id = p_report_id;
    
    -- ส่ง notification สำหรับการอัปเดต
    PERFORM pg_notify(
        'admin_reports',
        json_build_object(
            'type', 'report_updated',
            'report_id', p_report_id,
            'old_status', existing_report.status,
            'new_status', p_status,
            'action_taken', p_action_taken,
            'updated_at', NOW()
        )::text
    );
    
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- ตัวอย่างการใช้งาน (Example Queries)
-- =====================================================

-- ตัวอย่างการสร้างรายงาน
/*
INSERT INTO message_reports (
    message_id,
    reporter_id,
    reported_user_id,
    report_reason,
    report_details
) VALUES (
    'message-uuid-here',
    'reporter-uuid-here',
    'reported-user-uuid-here',
    'inappropriate_content',
    'ข้อความนี้ไม่เหมาะสมกับสถานที่สาธารณะ'
);
*/

-- ตัวอย่างการดึงข้อมูลการรายงาน
/*
SELECT * FROM get_message_reports_with_details(50, 0, 'pending');
*/

-- ตัวอย่างการอัปเดตสถานะ
/*
SELECT update_report_status(
    'report-uuid-here',
    'resolved',
    'message_deleted',
    'ลบข้อความที่ไม่เหมาะสม',
    'admin-uuid-here'
);
*/

-- ตัวอย่างการตรวจสอบว่าสามารถรายงานได้หรือไม่
/*
SELECT can_report_message('message-uuid-here', 'reporter-uuid-here');
*/

-- ตัวอย่างการดึงสถิติการรายงานของผู้ใช้
/*
SELECT * FROM get_user_report_stats('user-uuid-here');
*/
