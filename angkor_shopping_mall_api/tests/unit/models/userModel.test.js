const { DataTypes } = require('sequelize');
const User = require('../../../src/models/userModel');

/**
 * Unit Test following the Lesson:
 * "Software Testing: Unit Test with Jest in NodeJS"
 *
 * Testing User Model Schema, Constraints, and Defaults
 */

describe('User Model (src/models/userModel.js)', () => {
  describe('Model Configuration', () => {
    test('should have the correct table name', () => {
      expect(User.tableName).toBe('users');
    });

    test('should have timestamps configured with snake_case column names', () => {
      const options = User.options;
      expect(options.timestamps).toBe(true);
      expect(options.createdAt).toBe('created_at');
      expect(options.updatedAt).toBe('updated_at');
    });
  });

  describe('Attributes / Columns Definition', () => {
    const attributes = User.rawAttributes;

    test('should define the primary key id as UUID with default UUIDV4', () => {
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

    test('should define email as required, unique STRING(255)', () => {
      expect(attributes.email).toBeDefined();
      expect(attributes.email.type.key).toBe(DataTypes.STRING.key);
      expect(attributes.email.allowNull).toBe(false);
      expect(attributes.email.unique).toBe(true);
    });

    test('should define password as required STRING', () => {
      expect(attributes.password).toBeDefined();
      expect(attributes.password.type.key).toBe(DataTypes.STRING.key);
      expect(attributes.password.allowNull).toBe(false);
    });

    test('should define phone as required and unique STRING', () => {
      expect(attributes.phone).toBeDefined();
      expect(attributes.phone.type.key).toBe(DataTypes.STRING.key);
      expect(attributes.phone.allowNull).toBe(false);
      expect(attributes.phone.unique).toBe(true);
    });

    test('should define is_active as BOOLEAN with default true', () => {
      expect(attributes.is_active).toBeDefined();
      expect(attributes.is_active.type.key).toBe(DataTypes.BOOLEAN.key);
      expect(attributes.is_active.allowNull).toBe(false);
      expect(attributes.is_active.defaultValue).toBe(true);
    });

    test('should define 2FA fields (two_fa_pin and two_fa_enabled)', () => {
      expect(attributes.two_fa_pin).toBeDefined();
      expect(attributes.two_fa_pin.type.key).toBe(DataTypes.STRING.key);
      expect(attributes.two_fa_pin.allowNull).toBe(true);

      expect(attributes.two_fa_enabled).toBeDefined();
      expect(attributes.two_fa_enabled.type.key).toBe(DataTypes.BOOLEAN.key);
      expect(attributes.two_fa_enabled.allowNull).toBe(false);
      expect(attributes.two_fa_enabled.defaultValue).toBe(false);
    });

    test('should define telegram_chat_id as optional unique STRING', () => {
      expect(attributes.telegram_chat_id).toBeDefined();
      expect(attributes.telegram_chat_id.type.key).toBe(DataTypes.STRING.key);
      expect(attributes.telegram_chat_id.allowNull).toBe(true);
      expect(attributes.telegram_chat_id.unique).toBe(true);
    });
  });
});
