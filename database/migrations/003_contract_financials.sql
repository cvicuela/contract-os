-- Add financial columns to contracts
ALTER TABLE contracts ADD COLUMN IF NOT EXISTS total_value NUMERIC(14, 2);
ALTER TABLE contracts ADD COLUMN IF NOT EXISTS price_per_unit NUMERIC(10, 2);
ALTER TABLE contracts ADD COLUMN IF NOT EXISTS unit_type TEXT DEFAULT 'sqft' CHECK (unit_type IN ('sqft', 'm2'));

COMMENT ON COLUMN contracts.total_value IS 'Total contract value in USD.';
COMMENT ON COLUMN contracts.price_per_unit IS 'Price per square foot or square meter.';
COMMENT ON COLUMN contracts.unit_type IS 'Unit for price_per_unit: sqft or m2.';

CREATE INDEX IF NOT EXISTS idx_contracts_total_value ON contracts (total_value);
