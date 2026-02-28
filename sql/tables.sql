CREATE TYPE type_of_user AS ENUM ('admin', 'user');

CREATE TABLE Users (
    id UUID PRIMARY KEY NOT NULL DEFAULT gen_random_uuid(),
    username VARCHAR(50) NOT NULL,
    password CHAR(60) NOT NULL,
    type  type_of_user DEFAULT 'user'
);

CREATE TABLE Room (
    id UUID PRIMARY KEY NOT NULL DEFAULT gen_random_uuid(),
    name VARCHAR(50) NOT NULL
);

CREATE TABLE Device (
    id VARCHAR(17) PRIMARY KEY NOT NULL,
    id_room UUID NOT NULL REFERENCES Room(id),
    ip VARCHAR(15) NOT NULL,
    name VARCHAR(50) NOT NULL,
    description VARCHAR(500) NOT NULL
);

CREATE TABLE Scale (
    id UUID PRIMARY KEY NOT NULL DEFAULT gen_random_uuid(),
    id_device VARCHAR(17) NOT NULL REFERENCES Device(id),
    value NUMERIC NOT NULL,
    max_value NUMERIC NOT NULL,
    min_value NUMERIC NOT NULL,
    name VARCHAR(20) NOT NULL
);
