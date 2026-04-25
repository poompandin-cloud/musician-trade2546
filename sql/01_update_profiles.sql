-- Update profiles table to add wallet balance and account type
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS wallet_balance DECIMAL(10,2) DEFAULT 0.00 NOT NULL,
ADD COLUMN IF NOT EXISTS account_type VARCHAR(20) DEFAULT 'musician' CHECK (account_type IN ('musician', 'venue', 'customer'));

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_profiles_account_type ON profiles(account_type);
CREATE INDEX IF NOT EXISTS idx_profiles_wallet_balance ON profiles(wallet_balance);
