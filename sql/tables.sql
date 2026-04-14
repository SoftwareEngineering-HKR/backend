CREATE TYPE type_of_user AS ENUM ('admin', 'user');
CREATE TYPE type_of_device AS ENUM ('light', 'button', 'gas', 'steam', 'humidity', 'buzz', 'servo', 'fan', 'display', 'photo', 'motion', 'temperature', 'tilt', 'brightness', 'door', 'window');

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
	type type_of_device,
	online boolean,
    ip VARCHAR(15) NOT NULL,
    name VARCHAR(50),
    description VARCHAR(500),
	sensor boolean
);

CREATE TABLE scales (
    id UUID PRIMARY KEY NOT NULL DEFAULT gen_random_uuid(),
    id_device VARCHAR(17) NOT NULL REFERENCES devices(id) ON DELETE CASCADE,
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

CREATE TABLE refresh_tokens (
    token VARCHAR(512) NOT NULL UNIQUE,
    user_id UUID NOT NULL,
    expires DATE NOT NULL,
    revoked BOOLEAN DEFAULT false,
    ip VARCHAR(45) NOT NULL
);
