-- สร้างตาราง visitor_logs สำหรับจดบันทึกผู้เข้าชมโปรไฟล์
CREATE TABLE IF NOT EXISTS visitor_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    visitor_ip TEXT,
    user_agent TEXT,
    visitor_id UUID REFERENCES profiles(id) ON DELETE SET NULL, -- ถ้าเป็นผู้ใช้ที่ล็อกอิน
    session_id TEXT, -- สำหรับ tracking ผู้เข้าชมที่ไม่ได้ล็อกอิน
    referrer TEXT,
    landing_page TEXT,
    visit_duration_seconds INTEGER DEFAULT 0, -- จะอัปเดตเมื่อมีการ track page unload
    is_bounce BOOLEAN DEFAULT FALSE, -- จะอัปเดตเมื่อมีการ track page unload
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- เพิ่ม indexes สำหรับ performance
CREATE INDEX IF NOT EXISTS idx_visitor_logs_profile_id ON visitor_logs(profile_id);
CREATE INDEX IF NOT EXISTS idx_visitor_logs_visitor_ip ON visitor_logs(visitor_ip);
CREATE INDEX IF NOT EXISTS idx_visitor_logs_visitor_id ON visitor_logs(visitor_id);
CREATE INDEX IF NOT EXISTS idx_visitor_logs_created_at ON visitor_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_visitor_logs_session_id ON visitor_logs(session_id);

-- เพิ่ม comment สำหรับอธิบายตาราง
COMMENT ON TABLE visitor_logs IS 'ตารางบันทึกการเข้าชมโปรไฟล์ (Visitor Analytics)';
COMMENT ON COLUMN visitor_logs.id IS 'Primary key ของ log';
COMMENT ON COLUMN visitor_logs.profile_id IS 'ID ของโปรไฟล์ที่ถูกเข้าชม';
COMMENT ON COLUMN visitor_logs.visitor_ip IS 'IP Address ของผู้เข้าชม';
COMMENT ON COLUMN visitor_logs.user_agent IS 'User Agent string ของ browser';
COMMENT ON COLUMN visitor_logs.visitor_id IS 'ID ของผู้เข้าชม (ถ้าล็อกอิน)';
COMMENT ON COLUMN visitor_logs.session_id IS 'Session ID สำหรับ tracking ผู้เข้าชมที่ไม่ได้ล็อกอิน';
COMMENT ON COLUMN visitor_logs.referrer IS 'Referrer URL ที่มา';
COMMENT ON COLUMN visitor_logs.landing_page IS 'หน้าแรกที่เข้าชม';
COMMENT ON COLUMN visitor_logs.visit_duration_seconds IS 'ระยะเวลาที่อยู่ในหน้า (วินาที)';
COMMENT ON COLUMN visitor_logs.is_bounce IS 'เป็นการเข้าชมแล้วออกทันที (bounce)';
COMMENT ON COLUMN visitor_logs.created_at IS 'วันที่เข้าชม';
COMMENT ON COLUMN visitor_logs.updated_at IS 'วันที่อัปเดตข้อมูลครั้งล่าสุด';

-- สร้าง RLS (Row Level Security) policies
ALTER TABLE visitor_logs ENABLE ROW LEVEL SECURITY;

-- Policy 1: ทุกคนสามารถ insert logs ได้ (สำหรับ background tracking)
CREATE POLICY "Anyone can insert visitor logs" ON visitor_logs
    FOR INSERT WITH CHECK (true);

-- Policy 2: เจ้าของโปรไฟล์สามารถดู logs ของตัวเองได้ (แต่ไม่รวม IP)
CREATE POLICY "Profile owners can view their own logs (without IP)" ON visitor_logs
    FOR SELECT USING (
        auth.uid() = profile_id
    );

-- Policy 3: Admin สามารถดู logs ทั้งหมดได้
CREATE POLICY "Admin can view all visitor logs" ON visitor_logs
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- สร้าง view สำหรับ frontend (ไม่รวม IP และข้อมูล sensitive)
CREATE OR REPLACE VIEW public_visitor_logs AS
SELECT 
    id,
    profile_id,
    user_agent,
    visitor_id,
    referrer,
    landing_page,
    visit_duration_seconds,
    is_bounce,
    created_at,
    updated_at
FROM visitor_logs;

-- สร้าง RLS สำหรับ view นี้
ALTER TABLE public_visitor_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Profile owners can view public logs" ON public_visitor_logs
    FOR SELECT USING (
        auth.uid() = profile_id
    );

-- สร้างฟังก์ชันสำหรับ Admin ในการดู logs พร้อม IP
CREATE OR REPLACE FUNCTION admin_get_visitor_logs_with_ip(profile_uuid UUID, limit_count INTEGER DEFAULT 50, offset_count INTEGER DEFAULT 0)
RETURNS TABLE (
    id UUID,
    profile_id UUID,
    visitor_ip TEXT,
    user_agent TEXT,
    visitor_id UUID,
    session_id TEXT,
    referrer TEXT,
    landing_page TEXT,
    visit_duration_seconds INTEGER,
    is_bounce BOOLEAN,
    created_at TIMESTAMP WITH TIME ZONE,
    updated_at TIMESTAMP WITH TIME ZONE,
    visitor_name TEXT,
    visitor_avatar_url TEXT
)
SECURITY DEFINER
AS $$
BEGIN
    -- ตรวจสอบว่าผู้ใช้เป็น Admin หรือไม่
    IF NOT EXISTS (
        SELECT 1 FROM profiles 
        WHERE id = auth.uid() AND role = 'admin'
    ) THEN
        RAISE EXCEPTION 'Access denied: Admin access required';
    END IF;
    
    RETURN QUERY
    SELECT 
        vl.id,
        vl.profile_id,
        vl.visitor_ip,
        vl.user_agent,
        vl.visitor_id,
        vl.session_id,
        vl.referrer,
        vl.landing_page,
        vl.visit_duration_seconds,
        vl.is_bounce,
        vl.created_at,
        vl.updated_at,
        vp.full_name as visitor_name,
        vp.avatar_url as visitor_avatar_url
    FROM visitor_logs vl
    LEFT JOIN profiles vp ON vl.visitor_id = vp.id
    WHERE vl.profile_id = profile_uuid
    ORDER BY vl.created_at DESC
    LIMIT limit_count
    OFFSET offset_count;
END;
$$ LANGUAGE plpgsql;

-- สร้างฟังก์ชันสำหรับสรุปสถิติการเข้าชม
CREATE OR REPLACE FUNCTION get_profile_analytics(profile_uuid UUID)
RETURNS TABLE (
    total_visits BIGINT,
    unique_visitors BIGINT,
    avg_duration_seconds NUMERIC,
    bounce_rate NUMERIC,
    visits_today BIGINT,
    visits_this_week BIGINT,
    visits_this_month BIGINT
)
SECURITY DEFINER
AS $$
BEGIN
    -- ตรวจสอบว่าเป็นเจ้าของโปรไฟล์หรือ Admin
    IF NOT (
        auth.uid() = profile_uuid OR
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() AND role = 'admin'
        )
    ) THEN
        RAISE EXCEPTION 'Access denied: Owner or admin access required';
    END IF;
    
    RETURN QUERY
    WITH analytics AS (
        SELECT 
            COUNT(*) as total_visits,
            COUNT(DISTINCT COALESCE(visitor_id, session_id)) as unique_visitors,
            AVG(visit_duration_seconds) as avg_duration,
            COUNT(CASE WHEN is_bounce = true THEN 1 END)::NUMERIC / COUNT(*) as bounce_rate,
            COUNT(CASE WHEN created_at >= CURRENT_DATE THEN 1 END) as visits_today,
            COUNT(CASE WHEN created_at >= CURRENT_DATE - INTERVAL '7 days' THEN 1 END) as visits_this_week,
            COUNT(CASE WHEN created_at >= CURRENT_DATE - INTERVAL '30 days' THEN 1 END) as visits_this_month
        FROM visitor_logs
        WHERE profile_id = profile_uuid
    )
    SELECT 
        total_visits,
        unique_visitors,
        COALESCE(avg_duration, 0),
        COALESCE(bounce_rate, 0),
        visits_today,
        visits_this_week,
        visits_this_month
    FROM analytics;
END;
$$ LANGUAGE plpgsql;
