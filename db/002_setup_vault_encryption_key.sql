-- Setup Encryption Key using Supabase Vault
-- This script creates a secret in Supabase Vault for password encryption

-- INSTRUCTIONS:
-- 1. Generate a secure 32-character key at: https://generate-secret.vercel.app/32
-- 2. Copy the generated key  
-- 3. Replace 'YOUR_GENERATED_KEY_HERE' below with your key
-- 4. Run this script

-- Create a secret in Supabase Vault for password encryption
SELECT vault.create_secret('YOUR_GENERATED_KEY_HERE', 'pwd_encryption_key', 'Password Encryption Key');

-- Verify the secret was created successfully
-- (This will show the secret name and description, but not the actual value)
SELECT name, description, created_at 
FROM vault.secrets 
WHERE name = 'pwd_encryption_key';