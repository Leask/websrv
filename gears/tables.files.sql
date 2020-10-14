CREATE TABLE `files` (
    `id`           VARCHAR(255) NOT NULL,
    `userId`       VARCHAR(255) NOT NULL,
    `filename`     VARCHAR(255) NOT NULL,
    `originalname` VARCHAR(255) NOT NULL,
    `mimetype`     VARCHAR(255) NOT NULL,
    `size`         BIGINT(20)   NOT NULL,
    `createdAt`    TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `updatedAt`    TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE INDEX userId       ON files(userId);
CREATE INDEX filename     ON files(filename);
CREATE INDEX originalname ON files(originalname);
CREATE INDEX mimetype     ON files(mimetype);
CREATE INDEX size         ON files(size);
CREATE INDEX createdAt    ON files(createdAt);
CREATE INDEX updatedAt    ON files(updatedAt);
