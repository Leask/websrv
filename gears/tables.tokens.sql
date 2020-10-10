CREATE TABLE `tokens` (
    `id`        VARCHAR(255) NOT NULL,
    `userId`    VARCHAR(255) NOT NULL,
    `type`      VARCHAR(255) NOT NULL,
    `createdAt` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `updatedAt` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `expiredAt` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE INDEX userId       ON tokens(userId);
CREATE INDEX type         ON tokens(type);
CREATE INDEX createdAt    ON tokens(createdAt);
CREATE INDEX updatedAt    ON tokens(updatedAt);
CREATE INDEX expiredAt    ON tokens(expiredAt);
