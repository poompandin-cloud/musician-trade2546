-- สร้างฟังก์ชันสำหรับดึงข้อมูลนักดนตรีพร้อมจำนวน Like รายสัปดาห์ (Performance Query)
CREATE OR REPLACE FUNCTION get_musicians_with_weekly_likes(days_ago INTEGER DEFAULT 7)
RETURNS TABLE (
    id UUID,
    full_name TEXT,
    avatar_url TEXT,
    prestige_points INTEGER,
    credits INTEGER,
    province TEXT,
    instruments TEXT,
    weekly_likes BIGINT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        p.id,
        p.full_name,
        p.avatar_url,
        p.prestige_points,
        p.credits,
        p.province,
        p.instruments,
        COALESCE(like_counts.like_count, 0) AS weekly_likes
    FROM 
        profiles p
    LEFT JOIN (
        SELECT 
            pl.profile_id,
            COUNT(*) AS like_count
        FROM 
            profile_likes pl
        WHERE 
            pl.created_at >= (CURRENT_TIMESTAMP - (days_ago || ' days')::INTERVAL)
        GROUP BY 
            pl.profile_id
    ) like_counts ON p.id = like_counts.profile_id
    WHERE 
        p.full_name IS NOT NULL
    ORDER BY 
        weekly_likes DESC NULLS LAST,
        p.prestige_points DESC NULLS LAST,
        p.credits DESC NULLS LAST;
END;
$$ LANGUAGE plpgsql;

-- สร้าง Index เพื่อเพิ่มประสิทธิภาพ
CREATE INDEX IF NOT EXISTS idx_profile_likes_created_at ON profile_likes(created_at);
CREATE INDEX IF NOT EXISTS idx_profile_likes_profile_id_created_at ON profile_likes(profile_id, created_at);

-- สร้างฟังก์ชันแบบง่ายสำหรับใช้ในกรณีที่ RPC ไม่ทำงาน
CREATE OR REPLACE FUNCTION get_musicians_with_weekly_likes_simple(days_ago INTEGER DEFAULT 7)
RETURNS TABLE (
    id UUID,
    full_name TEXT,
    avatar_url TEXT,
    prestige_points INTEGER,
    credits INTEGER,
    province TEXT,
    instruments TEXT,
    weekly_likes BIGINT
) AS $$
    SELECT 
        p.id,
        p.full_name,
        p.avatar_url,
        p.prestige_points,
        p.credits,
        p.province,
        p.instruments,
        COALESCE(pl.like_count, 0) AS weekly_likes
    FROM 
        profiles p
    LEFT JOIN LATERAL (
            SELECT COUNT(*) as like_count
            FROM profile_likes pl_sub
            WHERE pl_sub.profile_id = p.id
            AND pl_sub.created_at >= (CURRENT_TIMESTAMP - (days_ago || ' days')::INTERVAL)
        ) pl ON true
    WHERE 
        p.full_name IS NOT NULL
    ORDER BY 
        weekly_likes DESC NULLS LAST,
        p.prestige_points DESC NULLS LAST,
        p.credits DESC NULLS LAST;
$$ LANGUAGE sql;
