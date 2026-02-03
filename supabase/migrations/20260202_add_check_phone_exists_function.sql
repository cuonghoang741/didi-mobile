-- Create RPC function to check if a phone number exists and has a password
CREATE OR REPLACE FUNCTION check_phone_exists(phone_number text)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  user_record record;
  result json;
BEGIN
  -- Look up user by phone in auth.users table
  SELECT 
    id,
    phone,
    encrypted_password
  INTO user_record
  FROM auth.users
  WHERE phone = phone_number
  LIMIT 1;

  -- If user found, check if they have a password
  IF FOUND THEN
    result := json_build_object(
      'exists', true,
      'has_password', (user_record.encrypted_password IS NOT NULL AND user_record.encrypted_password != '')
    );
  ELSE
    result := json_build_object(
      'exists', false,
      'has_password', false
    );
  END IF;

  RETURN result;
END;
$$;
