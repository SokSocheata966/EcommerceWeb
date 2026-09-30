const { DataTypes } = require('sequelize');
const Brand = require('../../../src/models/brandModel');

/**
 * Unit Test following the Lesson:
 * "Software Testing: Unit Test with Jest in NodeJS"
 *
 * Testing Sequelize Model Definition (Schema & Constraints)
 */

describe('Brand Model (src/models/brandModel.js)', () => {
  describe('Model Configuration', () => {
    test('should have the correct table name', () => {
      expect(Brand.tableName).toBe('brands');
    });

    test('should have timestamps configured with snake_case column names', () => {
      const options = Brand.options;
      expect(options.timestamps).toBe(true);
      expect(options.createdAt).toBe('created_at');
      expect(options.updatedAt).toBe('updated_at');
    });
  });

  describe('Attributes / Columns Definition', () => {
    const attributes = Brand.rawAttributes;

    test('should define the primary key id as UUID with default UUIDV4', () => {
      expect(attributes.id).toBeDefined();
      expect(attributes.id.primaryKey).toBe(true);
      expect(attributes.id.type.key).toBe(DataTypes.UUID.key);
      expect(attributes.id.defaultValue).toBeDefined();
    });

    test('should define name as required (not null) and unique STRING', () => {
      expect(attributes.name).toBeDefined();
      expect(attributes.name.type.key).toBe(DataTypes.STRING.key);
      expect(attributes.name.allowNull).toBe(false);
      expect(attributes.name.unique).toBe(true);
    });

    test('should define description as optional STRING', () => {
      expect(attributes.description).toBeDefined();
      expect(attributes.description.type.key).toBe(DataTypes.STRING.key);
      expect(attributes.description.allowNull).toBe(true);
    });

    test('should define is_active as BOOLEAN with default true', () => {
      expect(attributes.is_active).toBeDefined();
      expect(attributes.is_active.type.key).toBe(DataTypes.BOOLEAN.key);
      expect(attributes.is_active.defaultValue).toBe(true);
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
