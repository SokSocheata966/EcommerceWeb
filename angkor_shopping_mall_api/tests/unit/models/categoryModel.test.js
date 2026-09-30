const { DataTypes } = require('sequelize');
const Category = require('../../../src/models/categoryModel');

/**
 * Unit Test following the Lesson:
 * "Software Testing: Unit Test with Jest in NodeJS"
 *
 * Testing Sequelize Model Definition (Schema & Constraints)
 *
 * Core Concepts Applied:
 * 1. AAA Pattern (Arrange · Act · Assert)
 * 2. Matchers:
 *    - toBe / toEqual
 *    - toBeDefined
 */

describe('Category Model (src/models/categoryModel.js)', () => {
  // ---------------------------------------------------------------------------
  // 1. Table and Timestamp Configuration
  // ---------------------------------------------------------------------------
  describe('Model Configuration', () => {
    test('should have the correct table name', () => {
      expect(Category.tableName).toBe('categories');
    });

    test('should have timestamps configured with snake_case column names', () => {
      const options = Category.options;
      expect(options.timestamps).toBe(true);
      expect(options.createdAt).toBe('created_at');
      expect(options.updatedAt).toBe('updated_at');
    });
  });

  // ---------------------------------------------------------------------------
  // 2. Attribute / Field Definitions
  // ---------------------------------------------------------------------------
  describe('Attributes / Columns Definition', () => {
    const attributes = Category.rawAttributes;

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

    test('should define note as optional STRING', () => {
      expect(attributes.note).toBeDefined();
      expect(attributes.note.type.key).toBe(DataTypes.STRING.key);
      expect(attributes.note.allowNull).toBe(true);
    });

    test('should define icon as STRING with default emoji 📱', () => {
      expect(attributes.icon).toBeDefined();
      expect(attributes.icon.type.key).toBe(DataTypes.STRING.key);
      expect(attributes.icon.allowNull).toBe(true);
      expect(attributes.icon.defaultValue).toBe('📱');
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
