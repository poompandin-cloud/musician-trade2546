-- สร้าง Trigger สำหรับตรวจสอบ Cooldown 7 วันสำหรับการกด Like ซ้ำ

-- ฟังก์ชันสำหรับตรวจสอบ Cooldown
CREATE OR REPLACE FUNCTION check_like_cooldown()
RETURNS TRIGGER AS $$
DECLARE
    last_like_time TIMESTAMP;
    cooldown_period INTERVAL := INTERVAL '7 days';
BEGIN
    -- ตรวจสอบว่าผู้ใช้เคยกด Like โปรไฟล์นี้ภายใน 7 วันที่ผ่านมาหรือไม่
    SELECT created_at INTO last_like_time
    FROM profile_likes
    WHERE profile_id = NEW.profile_id 
      AND user_id = NEW.user_id
      AND created_at > (NOW() - cooldown_period)
    LIMIT 1;
    
    -- ถ้าพบว่ามีการกด Like ภายใน 7 วัน ให้ทำการลบรายการเก่าและใส่รายการใหม่
    IF last_like_time IS NOT NULL THEN
        -- ลบรายการ Like เก่า
        DELETE FROM profile_likes
        WHERE profile_id = NEW.profile_id 
          AND user_id = NEW.user_id
          AND created_at = last_like_time;
          
        -- แจ้งเตือนว่าสามารถกด Like ซ้ำได้ (เปลี่ยนจากการบล็อคเป็นอนุญาต)
        RAISE NOTICE 'Like cooldown period passed, allowing new like';
    END IF;
    
    -- อนุญาตให้ทำการ Insert รายการใหม่
    RETURN NEW;
EXCEPTION
    WHEN OTHERS THEN
        -- ถ้ามี Error อื่นๆ ให้แสดงข้อความ Error ที่ชัดเจน
        RAISE EXCEPTION 'Cannot like profile: %', SQLERRM;
END;
$$ LANGUAGE plpgsql;

-- สร้าง Trigger สำหรับตรวจสอบก่อน Insert
DROP TRIGGER IF EXISTS profile_likes_cooldown_trigger ON profile_likes;
CREATE TRIGGER profile_likes_cooldown_trigger
    BEFORE INSERT ON profile_likes
    FOR EACH ROW
    EXECUTE FUNCTION check_like_cooldown();

-- สร้างฟังก์ชันสำหรับตรวจสอบว่าผู้ใช้สามารถกด Like ได้หรือไม่ (สำหรับใช้ใน Application)
CREATE OR REPLACE FUNCTION can_like_profile(p_profile_id UUID, p_user_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
    last_like_time TIMESTAMP;
    cooldown_period INTERVAL := INTERVAL '7 days';
BEGIN
    -- ตรวจสอบว่าผู้ใช้เคยกด Like โปรไฟล์นี้ภายใน 7 วันที่ผ่านมาหรือไม่
    SELECT created_at INTO last_like_time
    FROM profile_likes
    WHERE profile_id = p_profile_id 
      AND user_id = p_user_id
      AND created_at > (NOW() - cooldown_period)
    LIMIT 1;
    
    -- ถ้าไม่พบรายการ Like ภายใน 7 วัน หมายความว่าสามารถกด Like ได้
    RETURN last_like_time IS NULL;
EXCEPTION
    WHEN OTHERS THEN
        RETURN FALSE;
END;
$$ LANGUAGE plpgsql;

-- สร้างฟังก์ชันสำหรับดึงจำนวน Like ที่ยังไม่หมดอายุ (7 วัน)
CREATE OR REPLACE FUNCTION get_active_like_count(p_profile_id UUID)
RETURNS INTEGER AS $$
DECLARE
    like_count INTEGER;
    seven_days_ago TIMESTAMP := NOW() - INTERVAL '7 days';
BEGIN
    -- นับจำนวน Like ที่ยังไม่หมดอายุ 7 วัน
    SELECT COUNT(*) INTO like_count
    FROM profile_likes
    WHERE profile_id = p_profile_id 
      AND created_at > seven_days_ago;
    
    RETURN COALESCE(like_count, 0);
EXCEPTION
    WHEN OTHERS THEN
        RETURN 0;
END;
$$ LANGUAGE plpgsql;
