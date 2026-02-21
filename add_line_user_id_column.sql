-- เพิ่มคอลัมน์ line_user_id ในตาราง profiles สำหรับเชื่อมต่อกับ LINE LIFF
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS line_user_id TEXT;

-- สร้าง Index สำหรับการค้นหาที่เร็วขึ้น
CREATE INDEX IF NOT EXISTS idx_profiles_line_user_id ON profiles(line_user_id);

-- สร้าง unique constraint เพื่อป้องกันข้อมูลซ้ำ
ALTER TABLE profiles 
ADD CONSTRAINT unique_line_user_id UNIQUE (line_user_id);

-- อัปเดต RLS Policy ให้รองรับ line_user_id
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
CREATE POLICY "Users can view own profile" ON profiles
    FOR SELECT USING (
        auth.uid() = id OR 
        (auth.jwt() ->> 'line_user_id')::text = line_user_id
    );

DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
CREATE POLICY "Users can update own profile" ON profiles
    FOR UPDATE USING (
        auth.uid() = id OR 
        (auth.jwt() ->> 'line_user_id')::text = line_user_id
    );

-- สร้าง trigger function สำหรับการ sync ข้อมูล LINE
CREATE OR REPLACE FUNCTION sync_line_user_data()
RETURNS TRIGGER AS $$
BEGIN
    -- อัปเดต updated_at เมื่อมีการเปลี่ยนแปลงข้อมูลจาก LINE
    IF TG_OP = 'UPDATE' THEN
        NEW.updated_at = CURRENT_TIMESTAMP;
        RETURN NEW;
    END IF;
    
    -- สำหรับ INSERT ใหม่
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- สร้าง trigger สำหรับการ sync ข้อมูล
DROP TRIGGER IF EXISTS sync_line_user_data_trigger ON profiles;
CREATE TRIGGER sync_line_user_data_trigger
    BEFORE INSERT OR UPDATE ON profiles
    FOR EACH ROW
    EXECUTE FUNCTION sync_line_user_data();

-- สร้าง function สำหรับค้นหา user จาก LINE user ID
CREATE OR REPLACE FUNCTION get_user_by_line_id(line_user_id_param TEXT)
RETURNS TABLE (
    id UUID,
    full_name TEXT,
    avatar_url TEXT,
    credits INTEGER,
    line_user_id TEXT,
    created_at TIMESTAMP WITH TIME ZONE,
    updated_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        p.id,
        p.full_name,
        p.avatar_url,
        p.credits,
        p.line_user_id,
        p.created_at,
        p.updated_at
    FROM 
        profiles p
    WHERE 
        p.line_user_id = line_user_id_param;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- สร้าง function สำหรับสร้าง user ใหม่จาก LINE data
CREATE OR REPLACE FUNCTION create_user_from_line(
    line_user_id_param TEXT,
    display_name_param TEXT,
    picture_url_param TEXT,
    initial_credits INTEGER DEFAULT 25
)
RETURNS UUID AS $$
DECLARE
    new_user_id UUID;
BEGIN
    -- สร้าง user ใหม่
    INSERT INTO profiles (
        line_user_id,
        full_name,
        avatar_url,
        credits,
        created_at,
        updated_at
    ) VALUES (
        line_user_id_param,
        display_name_param,
        picture_url_param,
        initial_credits,
        CURRENT_TIMESTAMP,
        CURRENT_TIMESTAMP
    ) RETURNING id INTO new_user_id;
    
    RETURN new_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- สร้าง function สำหรับอัปเดตข้อมูล user จาก LINE
CREATE OR REPLACE FUNCTION update_user_from_line(
    line_user_id_param TEXT,
    display_name_param TEXT,
    picture_url_param TEXT
)
RETURNS BOOLEAN AS $$
BEGIN
    -- อัปเดตข้อมูล user
    UPDATE profiles 
    SET 
        full_name = display_name_param,
        avatar_url = picture_url_param,
        updated_at = CURRENT_TIMESTAMP
    WHERE 
        line_user_id = line_user_id_param;
    
    -- ตรวจสอบว่ามีการอัปเดตหรือไม่
    RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
