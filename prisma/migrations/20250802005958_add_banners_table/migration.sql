-- CreateTable
CREATE TABLE `ImagenBanner` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `url` VARCHAR(191) NOT NULL,
    `orden` INTEGER NOT NULL DEFAULT 0,
    `titulo` VARCHAR(191) NULL,
    `subtitulo` VARCHAR(191) NULL,
    `enlace` VARCHAR(191) NULL,
    `configWebId` INTEGER NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `ImagenBanner` ADD CONSTRAINT `ImagenBanner_configWebId_fkey` FOREIGN KEY (`configWebId`) REFERENCES `ConfigWeb`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
