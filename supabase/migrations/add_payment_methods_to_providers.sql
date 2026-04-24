-- Add supported_payment_methods to crypto_providers
ALTER TABLE crypto_providers ADD COLUMN IF NOT EXISTS supported_payment_methods TEXT;

-- Update existing providers with sample payment methods
UPDATE crypto_providers SET supported_payment_methods = 'Visa, Mastercard, Apple Pay, Google Pay' WHERE provider_name = 'MoonPay';
UPDATE crypto_providers SET supported_payment_methods = 'Credit Card, SEPA, Bank Transfer' WHERE provider_name = 'Banxa';
UPDATE crypto_providers SET supported_payment_methods = 'Visa, Mastercard, Swift' WHERE provider_name = 'Simplex';
