CREATE TABLE `identities` (
    `id`              VARCHAR(255) NOT NULL,
    `userId`          VARCHAR(255) DEFAULT NULL,
    `username`        VARCHAR(255) DEFAULT NULL,
    `fullName`        VARCHAR(255) DEFAULT NULL,
    `email`           VARCHAR(255) DEFAULT NULL,
    `avatar`          VARCHAR(255) DEFAULT NULL,
    `bio`             VARCHAR(255) DEFAULT NULL,
    `profile`         TEXT         DEFAULT NULL,
    `keys`            TEXT         DEFAULT NULL,
    `createdAt`       TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `updatedAt`       TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE INDEX userId    ON identities(userId);
CREATE INDEX username  ON identities(username);
CREATE INDEX fullName  ON identities(fullName);
CREATE INDEX email     ON identities(email);
CREATE INDEX avatar    ON identities(avatar);
CREATE INDEX bio       ON identities(bio);
CREATE INDEX createdAt ON identities(createdAt);
CREATE INDEX updatedAt ON identities(updatedAt);
