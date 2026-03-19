CREATE TABLE categories
(
    id         BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    name       VARCHAR(120) UNIQUE NOT NULL,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE items
(
    id           BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    owner_id     BIGINT                    NOT NULL REFERENCES users (id) ON DELETE RESTRICT,
    category_id  BIGINT REFERENCES categories (id) ON DELETE SET NULL,
    title        VARCHAR(200)              NOT NULL,
    description  TEXT,
    price        NUMERIC(12, 2),
    currency     VARCHAR(10) DEFAULT 'KZT',
    is_published BOOLEAN     DEFAULT false NOT NULL,
    created_at   TIMESTAMP   DEFAULT NOW(),
    updated_at   TIMESTAMP   DEFAULT NOW()
);

CREATE INDEX idx_items_owner_id ON items (owner_id);
CREATE INDEX idx_items_category_id ON items (category_id);
CREATE INDEX idx_items_is_published ON items (is_published);

CREATE TABLE item_images
(
    id                    BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    item_id                BIGINT       NOT NULL REFERENCES items (id) ON DELETE CASCADE,
    cloudinary_public_id  VARCHAR(255) NOT NULL,
    url                   TEXT         NOT NULL,
    created_at            TIMESTAMP DEFAULT NOW(),
    UNIQUE (item_id, cloudinary_public_id)
);

CREATE INDEX idx_item_images_item_id ON item_images (item_id);

CREATE TABLE item_availability_blocks
(
    id         BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    item_id    BIGINT     NOT NULL REFERENCES items (id) ON DELETE CASCADE,
    start_date DATE       NOT NULL,
    end_date   DATE       NOT NULL,
    created_at TIMESTAMP DEFAULT NOW(),
    CONSTRAINT chk_item_availability_dates CHECK (start_date <= end_date)
);

CREATE INDEX idx_item_availability_item_id ON item_availability_blocks (item_id);
