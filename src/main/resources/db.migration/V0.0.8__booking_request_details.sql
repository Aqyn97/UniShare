ALTER TABLE bookings
    ADD COLUMN IF NOT EXISTS renter_note TEXT;
