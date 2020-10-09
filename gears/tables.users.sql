CREATE TABLE `users` (
    `id`              VARCHAR(255) NOT NULL,
    `email`           VARCHAR(255) NOT NULL,
    `password`        VARCHAR(255) NOT NULL,
    `salt`            VARCHAR(255) NOT NULL,
    `name`            VARCHAR(255) DEFAULT NULL,
    `avatar`          VARCHAR(255) DEFAULT NULL,
    `bio`             VARCHAR(255) DEFAULT NULL,
    `emailVerifiedAt` TIMESTAMP DEFAULT NULL,
    `createdAt`       TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `updatedAt`       TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE UNIQUE INDEX name            ON users(name);
CREATE UNIQUE INDEX email           ON users(email);
CREATE INDEX        password        ON users(password);
CREATE INDEX        salt            ON users(salt);
CREATE INDEX        avatar          ON users(avatar);
CREATE INDEX        bio             ON users(bio);
CREATE INDEX        emailVerifiedAt ON users(emailVerifiedAt);
CREATE INDEX        createdAt       ON users(createdAt);
CREATE INDEX        updatedAt       ON users(updatedAt);
