CREATE TABLE IF NOT EXISTS users
(
    id          UUID         NOT NULL DEFAULT gen_random_uuid(),
    user_id     VARCHAR(255) NOT NULL,
    email       VARCHAR(255),
    phone       VARCHAR(20),
    password    VARCHAR(255) NOT NULL,
    full_name   VARCHAR(255),
    country     VARCHAR(50),
    plan_type   VARCHAR(50),
    is_active   BOOLEAN               DEFAULT TRUE,
    role        VARCHAR(50),
    created_at  TIMESTAMP    NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMP    NOT NULL DEFAULT NOW(),
    CONSTRAINT pk_users          PRIMARY KEY (id),
    CONSTRAINT uq_users_user_id  UNIQUE (user_id),
    CONSTRAINT uq_users_email    UNIQUE (email),
    CONSTRAINT uq_users_phone    UNIQUE (phone)
);