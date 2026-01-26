-- SQL Function for incrementing received_tokens
CREATE OR REPLACE FUNCTION increment_tokens(user_id UUID, increment INTEGER)
RETURNS VOID AS $$
BEGIN
    UPDATE profiles 
    SET received_tokens = received_tokens + increment
    WHERE id = user_id;
END;
$$ LANGUAGE plpgsql;

-- Create the function if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_proc 
        WHERE proname = 'increment_tokens'
    ) THEN
        CREATE OR REPLACE FUNCTION increment_tokens(user_id UUID, increment INTEGER)
        RETURNS VOID AS $$
        BEGIN
            UPDATE profiles 
            SET received_tokens = received_tokens + increment
            WHERE id = user_id;
        END;
        $$ LANGUAGE plpgsql;
    END IF;
END $$;
