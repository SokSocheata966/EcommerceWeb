const {
  trackInteraction,
  trackInteractionBulk,
  cleanupOldInteractions
} = require('../../../src/utils/trackInteraction');
const UserProductInteraction = require('../../../src/models/userProductInteractionModel');

/**
 * Unit Test following the Lesson:
 * "Software Testing: Unit Test with Jest in NodeJS"
 *
 * Core Concepts Applied:
 * 1. AAA Pattern (Arrange · Act · Assert)
 * 2. Matchers: toBe, toHaveBeenCalledWith, toHaveBeenCalledTimes
 * 3. Test Doubles:
 *    - Stub: mockResolvedValue / mockRejectedValue
 *    - Mock: checking UserProductInteraction calls
 */

jest.mock('../../../src/models/userProductInteractionModel', () => ({
  create: jest.fn(),
  bulkCreate: jest.fn(),
  destroy: jest.fn()
}));

describe('Track Interaction Utility (src/utils/trackInteraction.js)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // ===========================================================================
  // 1. trackInteraction()
  // ===========================================================================
  describe('trackInteraction()', () => {
    test('should record interaction with correct weight for view type', async () => {
      // Arrange
      UserProductInteraction.create.mockResolvedValue({});

      // Act
      await trackInteraction('user-1', 'prod-1', 'view');

      // Assert
      expect(UserProductInteraction.create).toHaveBeenCalledTimes(1);
      expect(UserProductInteraction.create).toHaveBeenCalledWith(
        expect.objectContaining({
          user_id: 'user-1',
          product_id: 'prod-1',
          interaction_type: 'view',
          weight: 1
        }),
        { logging: false }
      );
    });

    test('should record interaction with weight 5 for order type', async () => {
      // Arrange
      UserProductInteraction.create.mockResolvedValue({});

      // Act
      await trackInteraction('user-1', 'prod-2', 'order');

      // Assert
      expect(UserProductInteraction.create).toHaveBeenCalledWith(
        expect.objectContaining({
          weight: 5
        }),
        { logging: false }
      );
    });

    test('should return early without creating if userId or productId is missing', async () => {
      // Act
      await trackInteraction(null, 'prod-1', 'view');
      await trackInteraction('user-1', null, 'view');

      // Assert
      expect(UserProductInteraction.create).not.toHaveBeenCalled();
    });

    test('should return early if interaction type is unsupported', async () => {
      // Act
      await trackInteraction('user-1', 'prod-1', 'unsupported_action');

      // Assert
      expect(UserProductInteraction.create).not.toHaveBeenCalled();
    });

    test('should silently catch errors without throwing', async () => {
      // Arrange
      UserProductInteraction.create.mockRejectedValue(new Error('DB failure'));

      // Act & Assert (should not throw)
      await expect(trackInteraction('user-1', 'prod-1', 'view')).resolves.toBeUndefined();
    });
  });

  // ===========================================================================
  // 2. trackInteractionBulk()
  // ===========================================================================
  describe('trackInteractionBulk()', () => {
    test('should bulk create records for multiple productIds with search weight (2)', async () => {
      // Arrange
      UserProductInteraction.bulkCreate.mockResolvedValue([]);

      // Act
      await trackInteractionBulk('user-1', ['p-1', 'p-2'], 'search');

      // Assert
      expect(UserProductInteraction.bulkCreate).toHaveBeenCalledTimes(1);
      expect(UserProductInteraction.bulkCreate).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({ user_id: 'user-1', product_id: 'p-1', weight: 2 }),
          expect.objectContaining({ user_id: 'user-1', product_id: 'p-2', weight: 2 })
        ]),
        { ignoreDuplicates: true, logging: false }
      );
    });

    test('should return early when productIds array is empty or missing', async () => {
      // Act
      await trackInteractionBulk('user-1', [], 'search');
      await trackInteractionBulk('user-1', null, 'search');

      // Assert
      expect(UserProductInteraction.bulkCreate).not.toHaveBeenCalled();
    });

    test('should silently suppress errors in bulk tracking', async () => {
      // Arrange
      UserProductInteraction.bulkCreate.mockRejectedValue(new Error('Connection error'));

      // Act & Assert
      await expect(trackInteractionBulk('user-1', ['p-1'], 'cart')).resolves.toBeUndefined();
    });
  });

  // ===========================================================================
  // 3. cleanupOldInteractions()
  // ===========================================================================
  describe('cleanupOldInteractions()', () => {
    test('should destroy interactions older than cutoff date and return deleted count', async () => {
      // Arrange
      UserProductInteraction.destroy.mockResolvedValue(15);

      // Act
      const result = await cleanupOldInteractions(3);

      // Assert
      expect(UserProductInteraction.destroy).toHaveBeenCalledTimes(1);
      expect(result).toBe(15);
    });

    test('should return 0 if cleanup throws an error', async () => {
      // Arrange
      UserProductInteraction.destroy.mockRejectedValue(new Error('Timeout'));

      // Act
      const result = await cleanupOldInteractions();

      // Assert
      expect(result).toBe(0);
    });
  });
});
