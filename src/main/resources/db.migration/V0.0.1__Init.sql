CREATE TABLE users
(
    id         BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    username   VARCHAR(100) UNIQUE NOT NULL,
    password   VARCHAR(255)        NOT NULL,
    email      VARCHAR(100) UNIQUE,
    enabled    BOOLEAN   DEFAULT true,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE roles
(
    id          BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    name        VARCHAR(50) UNIQUE NOT NULL,
    description TEXT,
    created_at  TIMESTAMP DEFAULT NOW()
);

CREATE TABLE permissions
(
    id          BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    name        VARCHAR(100) UNIQUE NOT NULL,
    description TEXT,
    created_at  TIMESTAMP DEFAULT NOW()
);

CREATE TABLE user_roles
(
    user_id    BIGINT NOT NULL REFERENCES users (id) ON DELETE CASCADE,
    role_id    BIGINT NOT NULL REFERENCES roles (id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT NOW(),
    PRIMARY KEY (user_id, role_id)
);

CREATE TABLE role_permissions
(
    role_id       BIGINT NOT NULL REFERENCES roles (id) ON DELETE CASCADE,
    permission_id BIGINT NOT NULL REFERENCES permissions (id) ON DELETE CASCADE,
    created_at    TIMESTAMP DEFAULT NOW(),
    PRIMARY KEY (role_id, permission_id)
);

INSERT INTO roles (name, description)
VALUES ('ADMIN', 'Полный доступ ко всем функциям'),
       ('USER', 'Обычный пользователь');

INSERT INTO permissions (name, description)
VALUES ('READ_USER', 'Чтение пользователей'),
       ('WRITE_USER', 'Создание/редактирование пользователей'),
       ('DELETE_USER', 'Удаление пользователей'),
       ('READ_ORDER', 'Просмотр заказов'),
       ('WRITE_ORDER', 'Создание/редактирование заказов'),
       ('DELETE_ORDER', 'Удаление заказов'),
       ('MANAGE_CONTENT', 'Управление контентом'),
       ('MANAGE_SYSTEM', 'Системные настройки'),
       ('READ_REPORTS', 'Просмотр отчетов');

INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r,
     permissions p
WHERE r.name = 'ADMIN';

-- USER = базовые права
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r,
     permissions p
WHERE r.name = 'USER'
  AND p.name IN ('READ_USER', 'READ_ORDER');

INSERT INTO users (username, password, email, enabled)
VALUES ('admin',
        'password',
        'admin@pm.kz',
        true) ON CONFLICT (username) DO NOTHING;

INSERT INTO user_roles (user_id, role_id)
SELECT u.id, r.id
FROM users u,
     roles r
WHERE u.username = 'admin'
  AND r.name = 'ADMIN' ON CONFLICT (user_id, role_id) DO NOTHING;

CREATE TABLE opaque_tokens
(
    id         BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    token      VARCHAR(512) UNIQUE NOT NULL,
    user_id    BIGINT REFERENCES users (id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT NOW(),
    expires_at TIMESTAMP           NOT NULL,
    revoked    BOOLEAN   DEFAULT false
);