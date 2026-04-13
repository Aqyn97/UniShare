-- Categories
INSERT INTO categories (name) VALUES 
  ('Textbooks'),
  ('Electronics'),
  ('Clothing'),
  ('Sports Equipment'),
  ('Bicycles'),
  ('Furniture'),
  ('Dorm Supplies'),
  ('Other')
ON CONFLICT (name) DO NOTHING;

-- Demo user
INSERT INTO users (username, password, email, enabled)
VALUES ('demo_user', '$2a$10$demohashedpasswordhere', 'demo@unishare.kz', true)
ON CONFLICT (username) DO NOTHING;

-- Assign USER role to demo user
INSERT INTO user_roles (user_id, role_id)
SELECT u.id, r.id
FROM users u, roles r
WHERE u.username = 'demo_user'
  AND r.name = 'USER'
ON CONFLICT (user_id, role_id) DO NOTHING;

-- Demo items
INSERT INTO items (owner_id, category_id, title, description, price, currency, is_published)
SELECT u.id, 1, 'Calculus Textbook', 'Stewart Calculus 8th edition, good condition', 2500, 'KZT', true FROM users u WHERE u.username = 'demo_user'
UNION ALL
SELECT u.id, 2, 'MacBook Charger 61W', 'USB-C charger, works perfectly', 1500, 'KZT', true FROM users u WHERE u.username = 'demo_user'
UNION ALL
SELECT u.id, 3, 'Winter Jacket L', 'Warm jacket, size L, worn once', 3000, 'KZT', true FROM users u WHERE u.username = 'demo_user'
UNION ALL
SELECT u.id, 5, 'Mountain Bike', 'Trek bike, perfect for campus', 5000, 'KZT', true FROM users u WHERE u.username = 'demo_user'
UNION ALL
SELECT u.id, 6, 'IKEA Desk Lamp', 'White, adjustable arm', 800, 'KZT', true FROM users u WHERE u.username = 'demo_user';

-- Demo item images
INSERT INTO item_images (item_id, cloudinary_public_id, url)
SELECT i.id, 'calculus_ovrbht', 'https://res.cloudinary.com/dmbgzqwcv/image/upload/v1776078282/calculus_ovrbht.jpg'
FROM items i WHERE i.title = 'Calculus Textbook'
UNION ALL
SELECT i.id, '51lHA-N6WeL_muorgj', 'https://res.cloudinary.com/dmbgzqwcv/image/upload/v1776078300/51lHA-N6WeL_muorgj.jpg'
FROM items i WHERE i.title = 'MacBook Charger 61W'
UNION ALL
SELECT i.id, 'winter_jacket_luboxl', 'https://res.cloudinary.com/dmbgzqwcv/image/upload/v1776078334/Gubotare-Men-Coat-Casual-Wool-Jackets-Men-s-Winter-Jacket-Mountain-Sheepskin-Lamb-Men-s-Coats-Jackets-Gray-L_455bedb1-5492-4114-85aa-410589c7f52f.4979c773afcec7e432774543cc2be257_luboxl.jpg'
FROM items i WHERE i.title = 'Winter Jacket L'
UNION ALL
SELECT i.id, '71lk7_eGeOL_h754el', 'https://res.cloudinary.com/dmbgzqwcv/image/upload/v1776078352/71lk7_eGeOL_h754el.jpg'
FROM items i WHERE i.title = 'Mountain Bike'
UNION ALL
SELECT i.id, 'ikea_desk_lamp_ekcbdn', 'https://res.cloudinary.com/dmbgzqwcv/image/upload/v1776078365/tertial-work-lamp-dark-gray__0609306_pe684440_s5_ekcbdn.jpg'
FROM items i WHERE i.title = 'IKEA Desk Lamp';