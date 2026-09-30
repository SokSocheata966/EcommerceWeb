const { DataTypes } = require('sequelize');
const Product = require('../../../src/models/productModel');

/**
 * Unit Test following the Lesson:
 * "Software Testing: Unit Test with Jest in NodeJS"
 *
 * Testing Sequelize Model Definition (Schema & Constraints)
 */

describe('Product Model (src/models/productModel.js)', () => {
  describe('Model Configuration', () => {
    test('should have the correct table name', () => {
      expect(Product.tableName).toBe('products');
    });

    test('should have timestamps configured with snake_case column names', () => {
      const options = Product.options;
      expect(options.timestamps).toBe(true);
      expect(options.createdAt).toBe('created_at');
      expect(options.updatedAt).toBe('updated_at');
    });
  });

  describe('Attributes / Columns Definition', () => {
    const attributes = Product.rawAttributes;

    test('should define primary key id as UUID with default UUIDV4', () => {
      expect(attributes.id).toBeDefined();
      expect(attributes.id.primaryKey).toBe(true);
      expect(attributes.id.type.key).toBe(DataTypes.UUID.key);
      expect(attributes.id.defaultValue).toBeDefined();
    });

    test('should define name as required STRING', () => {
      expect(attributes.name).toBeDefined();
      expect(attributes.name.type.key).toBe(DataTypes.STRING.key);
      expect(attributes.name.allowNull).toBe(false);
    });

    test('should define price as required DECIMAL(10, 2)', () => {
      expect(attributes.price).toBeDefined();
      expect(attributes.price.type.key).toBe(DataTypes.DECIMAL.key);
      expect(attributes.price.allowNull).toBe(false);
    });

    test('should define stock_quantity as INTEGER with default 0', () => {
      expect(attributes.stock_quantity).toBeDefined();
      expect(attributes.stock_quantity.type.key).toBe(DataTypes.INTEGER.key);
      expect(attributes.stock_quantity.allowNull).toBe(false);
      expect(attributes.stock_quantity.defaultValue).toBe(0);
    });

    test('should define foreign key attributes category_id and brand_id as optional UUIDs', () => {
      expect(attributes.category_id).toBeDefined();
      expect(attributes.category_id.type.key).toBe(DataTypes.UUID.key);
      expect(attributes.category_id.allowNull).toBe(true);

      expect(attributes.brand_id).toBeDefined();
      expect(attributes.brand_id.type.key).toBe(DataTypes.UUID.key);
      expect(attributes.brand_id.allowNull).toBe(true);
    });

    test('should define promo fields (promo_code and promo_discount)', () => {
      expect(attributes.promo_code).toBeDefined();
      expect(attributes.promo_code.type.key).toBe(DataTypes.STRING.key);
      expect(attributes.promo_code.allowNull).toBe(true);

      expect(attributes.promo_discount).toBeDefined();
      expect(attributes.promo_discount.type.key).toBe(DataTypes.DECIMAL.key);
      expect(attributes.promo_discount.defaultValue).toBe(0);
    });

    test('should define audit fields (created_by and updated_by) as optional UUID', () => {
      expect(attributes.created_by).toBeDefined();
      expect(attributes.created_by.type.key).toBe(DataTypes.UUID.key);
      expect(attributes.created_by.allowNull).toBe(true);

      expect(attributes.updated_by).toBeDefined();
      expect(attributes.updated_by.type.key).toBe(DataTypes.UUID.key);
      expect(attributes.updated_by.allowNull).toBe(true);
    });
  });
});
