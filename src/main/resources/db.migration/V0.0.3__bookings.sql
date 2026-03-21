CREATE TABLE bookings
(
    id          BIGSERIAL PRIMARY KEY,
    item_id     BIGINT         NOT NULL REFERENCES items (id),
    renter_id   BIGINT         NOT NULL REFERENCES users (id),
    owner_id    BIGINT         NOT NULL REFERENCES users (id),
    date_from   DATE           NOT NULL,
    date_to     DATE           NOT NULL,
    status      VARCHAR(20)    NOT NULL DEFAULT 'PENDING',
    total_price NUMERIC(12, 2) NOT NULL,
    created_at  TIMESTAMP      NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMP      NOT NULL DEFAULT NOW()
);