-- Run this against an existing BizPilot database after creating at least one
-- user account. It preserves existing products and is safe to rerun.

USE bizpilot_db;

DROP PROCEDURE IF EXISTS migrate_existing_products;

DELIMITER $$

CREATE PROCEDURE migrate_existing_products()
BEGIN
    DECLARE product_user_column_count INT DEFAULT 0;
    DECLARE product_user_index_count INT DEFAULT 0;
    DECLARE product_user_fk_count INT DEFAULT 0;
    DECLARE global_sku_index_count INT DEFAULT 0;
    DECLARE first_user_id INT UNSIGNED DEFAULT NULL;

    SELECT id
    INTO first_user_id
    FROM users
    ORDER BY id
    LIMIT 1;

    IF first_user_id IS NULL THEN
        SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT = 'Create at least one user before migrating products';
    END IF;

    SELECT COUNT(*)
    INTO product_user_column_count
    FROM information_schema.columns
    WHERE table_schema = DATABASE()
      AND table_name = 'products'
      AND column_name = 'user_id';

    IF product_user_column_count = 0 THEN
        ALTER TABLE products
            ADD COLUMN user_id INT UNSIGNED NULL AFTER id;
    END IF;

    UPDATE products
    SET user_id = first_user_id
    WHERE user_id IS NULL;

    ALTER TABLE products
        MODIFY COLUMN user_id INT UNSIGNED NOT NULL;

    SELECT COUNT(*)
    INTO global_sku_index_count
    FROM (
        SELECT index_name
        FROM information_schema.statistics
        WHERE table_schema = DATABASE()
          AND table_name = 'products'
          AND index_name <> 'PRIMARY'
          AND non_unique = 0
          AND column_name = 'sku'
        GROUP BY index_name
        HAVING COUNT(*) = 1
    ) AS global_sku_indexes;

    IF global_sku_index_count > 0 THEN
        SELECT index_name
        INTO @global_sku_index_name
        FROM information_schema.statistics
        WHERE table_schema = DATABASE()
          AND table_name = 'products'
          AND index_name <> 'PRIMARY'
          AND non_unique = 0
          AND column_name = 'sku'
        GROUP BY index_name
        HAVING COUNT(*) = 1
        LIMIT 1;

        SET @drop_global_sku_index =
            CONCAT('ALTER TABLE products DROP INDEX `',
                   REPLACE(@global_sku_index_name, '`', '``'), '`');
        PREPARE drop_global_sku_index FROM @drop_global_sku_index;
        EXECUTE drop_global_sku_index;
        DEALLOCATE PREPARE drop_global_sku_index;
    END IF;

    SELECT COUNT(*)
    INTO product_user_index_count
    FROM information_schema.statistics
    WHERE table_schema = DATABASE()
      AND table_name = 'products'
      AND index_name = 'idx_products_user';

    IF product_user_index_count = 0 THEN
        ALTER TABLE products
            ADD INDEX idx_products_user (user_id);
    END IF;

    SELECT COUNT(*)
    INTO product_user_fk_count
    FROM information_schema.table_constraints
    WHERE constraint_schema = DATABASE()
      AND table_name = 'products'
      AND constraint_name = 'fk_products_user'
      AND constraint_type = 'FOREIGN KEY';

    IF product_user_fk_count = 0 THEN
        ALTER TABLE products
            ADD CONSTRAINT fk_products_user
            FOREIGN KEY (user_id)
            REFERENCES users(id)
            ON DELETE CASCADE
            ON UPDATE CASCADE;
    END IF;
END$$

DELIMITER ;

CALL migrate_existing_products();
DROP PROCEDURE migrate_existing_products;
