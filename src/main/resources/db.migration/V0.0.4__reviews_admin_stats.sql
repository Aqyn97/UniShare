CREATE TABLE reviews
(
    id             BIGSERIAL PRIMARY KEY,
    booking_id     BIGINT      NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
    item_id        BIGINT      NOT NULL REFERENCES items(id) ON DELETE CASCADE,
    author_id      BIGINT      NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    target_user_id BIGINT      NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    rating         INT         NOT NULL CHECK (rating BETWEEN 1 AND 5),
    comment        TEXT,
    created_at     TIMESTAMP   NOT NULL DEFAULT NOW(),
    CONSTRAINT uk_reviews_booking_author UNIQUE (booking_id, author_id)
);

ALTER TABLE users
    ADD COLUMN IF NOT EXISTS rating_avg NUMERIC(3,2),
    ADD COLUMN IF NOT EXISTS rating_count INT NOT NULL DEFAULT 0;