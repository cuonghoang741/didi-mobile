-- Add image_url column to customer_addresses table for storing address photos
ALTER TABLE customer_addresses 
ADD COLUMN IF NOT EXISTS image_url TEXT;

-- Add comment for documentation
COMMENT ON COLUMN customer_addresses.image_url IS 'URL of the address photo/image';
