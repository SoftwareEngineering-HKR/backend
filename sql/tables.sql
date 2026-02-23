CREATE TABLE Users (
    id UUID PRIMARY KEY NOT NULL DEFAULT gen_random_uuid(),
    username VARCHAR(50) NOT NULL,
    password CHAR(60) NOT NULL
);

CREATE TABLE Room (
    id UUID PRIMARY KEY NOT NULL DEFAULT gen_random_uuid(),
    name VARCHAR(50) NOT NULL
);

CREATE TABLE Device (
    id UUID PRIMARY KEY NOT NULL DEFAULT gen_random_uuid(),
    id_room UUID NOT NULL REFERENCES Room(id),
    ip VARCHAR(15) NOT NULL,
    name VARCHAR(50) NOT NULL,
    description VARCHAR(500) NOT NULL
);

CREATE TABLE Scale (
    id UUID PRIMARY KEY NOT NULL DEFAULT gen_random_uuid(),
    id_device UUID NOT NULL REFERENCES Device(id),
    value NUMERIC NOT NULL,
    max_value NUMERIC NOT NULL,
    min_value NUMERIC NOT NULL,
    name VARCHAR(20) NOT NULL
);
