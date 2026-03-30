CREATE TYPE type_of_user AS ENUM ('admin', 'user');
CREATE TYPE type_of_device AS ENUM ('light');

CREATE TABLE users (
    id UUID PRIMARY KEY NOT NULL DEFAULT gen_random_uuid(),
    username VARCHAR(50) NOT NULL UNIQUE,
    password CHAR(60) NOT NULL,
    type  type_of_user DEFAULT 'user'
);

CREATE TABLE rooms (
    id UUID PRIMARY KEY NOT NULL DEFAULT gen_random_uuid(),
    name VARCHAR(50) NOT NULL
);

CREATE TABLE devices (
    id VARCHAR(17) PRIMARY KEY NOT NULL,
    id_room UUID REFERENCES rooms(id),
	type type_of_device NOT NULL,
	online boolean NOT NULL,
    ip VARCHAR(15) NOT NULL,
    name VARCHAR(50),
    description VARCHAR(500)
);

CREATE TABLE scales (
    id UUID PRIMARY KEY NOT NULL DEFAULT gen_random_uuid(),
    id_device VARCHAR(17) NOT NULL REFERENCES devices(id),
    value NUMERIC,
    max_value NUMERIC,
    min_value NUMERIC,
    name VARCHAR(20)
);

CREATE TABLE user_devices (
    id_user UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    id_device VARCHAR(17) NOT NULL REFERENCES devices(id) ON DELETE CASCADE,
    PRIMARY KEY (id_user, id_device)
);

CREATE TABLE refresh_token (
    token NOT NULL VARCHAR(50) UNIQUE,
    user_id NOT NULL NUMERIC,
    expires NOT NULL DATE,
    revoked BOOLEAN DEFAULT false,
    ip VARCHAR(15) NOT NULL,
)
