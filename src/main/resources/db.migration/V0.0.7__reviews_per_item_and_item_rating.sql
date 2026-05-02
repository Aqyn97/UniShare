ALTER TABLE reviews
    DROP CONSTRAINT IF EXISTS uk_reviews_booking_author;

WITH ranked_reviews AS (
    SELECT id,
           target_user_id,
           ROW_NUMBER() OVER (
               PARTITION BY item_id, author_id
               ORDER BY created_at DESC, id DESC
           ) AS rn
    FROM reviews
),
deleted_reviews AS (
    DELETE FROM reviews
    WHERE id IN (
        SELECT id
        FROM ranked_reviews
        WHERE rn > 1
    )
    RETURNING target_user_id
)
UPDATE users u
SET rating_avg = stats.rating_avg,
    rating_count = stats.rating_count
FROM (
    SELECT dr.target_user_id AS user_id,
           ROUND(AVG(r.rating)::numeric, 2) AS rating_avg,
           COUNT(r.id)::int AS rating_count
    FROM deleted_reviews dr
    LEFT JOIN reviews r ON r.target_user_id = dr.target_user_id
    GROUP BY dr.target_user_id
) stats
WHERE u.id = stats.user_id;

ALTER TABLE reviews
    ALTER COLUMN booking_id DROP NOT NULL;

ALTER TABLE reviews
    ADD CONSTRAINT uk_reviews_item_author UNIQUE (item_id, author_id);
