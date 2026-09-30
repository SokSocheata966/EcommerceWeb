const Category = require('../../../src/models/categoryModel');
const categoryService = require('../../../src/services/categoryService');

/**
 * Unit Test following the Lesson:
 * "Software Testing: Unit Test with Jest in NodeJS"
 *
 * Core Concepts Applied:
 * 1. AAA Pattern (Arrange · Act · Assert)
 * 2. Matchers:
 *    - toBe (compare primitives/booleans)
 *    - toEqual (compare objects/arrays)
 *    - rejects.toThrow (catch and assert on thrown errors)
 *    - toHaveBeenCalledWith / toHaveBeenCalledTimes (verify dependency usage)
 * 3. Test Doubles:
 *    - STUB: mockResolvedValue feeds canned data in (no real database runs)
 *    - MOCK: Category.create / Category.findByPk / update / destroy record behavior
 */

// MOCK the Sequelize Category model dependency
jest.mock('../../../src/models/categoryModel');

describe('Category Service (src/services/categoryService.js)', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  // ---------------------------------------------------------------------------
  // 1. createCategory()
  // ---------------------------------------------------------------------------
  describe('createCategory()', () => {
    test('creates a new category record and returns it', async () => {
      // Arrange
      const input = { name: 'Electronics', description: 'Gadgets & Devices', created_by: 1 };
      const expectedRecord = { id: 1, ...input };

      // STUB: provide canned data in
      Category.create.mockResolvedValue(expectedRecord);

      // Act
      const result = await categoryService.createCategory(input);

      // Assert
      // MOCK usage verification
      expect(Category.create).toHaveBeenCalledTimes(1);
      expect(Category.create).toHaveBeenCalledWith(input);
      // toEqual for object deep comparison
      expect(result).toEqual(expectedRecord);
    });
  });

  // ---------------------------------------------------------------------------
  // 2. getAllCategories()
  // ---------------------------------------------------------------------------
  describe('getAllCategories()', () => {
    test('retrieves all categories ordered by created_at DESC', async () => {
      // Arrange
      const mockCategories = [
        { id: 2, name: 'Fashion', created_at: '2026-03-01' },
        { id: 1, name: 'Electronics', created_at: '2026-01-01' }
      ];

      // STUB
      Category.findAll.mockResolvedValue(mockCategories);

      // Act
      const result = await categoryService.getAllCategories();

      // Assert
      expect(Category.findAll).toHaveBeenCalledTimes(1);
      expect(Category.findAll).toHaveBeenCalledWith({
        order: [['created_at', 'DESC']]
      });
      expect(result).toEqual(mockCategories);
      expect(result.length).toBe(2);
    });

    test('getAllCategorys() alias delegates to getAllCategories()', async () => {
      // Arrange
      const mockCategories = [{ id: 1, name: 'Books' }];
      Category.findAll.mockResolvedValue(mockCategories);

      // Act
      const result = await categoryService.getAllCategorys();

      // Assert
      expect(Category.findAll).toHaveBeenCalledTimes(1);
      expect(result).toEqual(mockCategories);
    });
  });

  // ---------------------------------------------------------------------------
  // 3. getCategoryById()
  // ---------------------------------------------------------------------------
  describe('getCategoryById()', () => {
    test('retrieves a category by ID when found', async () => {
      // Arrange
      const mockCategory = { id: 10, name: 'Home Appliances' };

      // STUB
      Category.findByPk.mockResolvedValue(mockCategory);

      // Act
      const result = await categoryService.getCategoryById(10);

      // Assert
      expect(Category.findByPk).toHaveBeenCalledTimes(1);
      expect(Category.findByPk).toHaveBeenCalledWith(10);
      expect(result).toEqual(mockCategory);
    });

    test('returns null when category ID is not found', async () => {
      // Arrange
      Category.findByPk.mockResolvedValue(null);

      // Act
      const result = await categoryService.getCategoryById(999);

      // Assert
      expect(Category.findByPk).toHaveBeenCalledWith(999);
      expect(result).toBeNull();
    });
  });

  // ---------------------------------------------------------------------------
  // 4. updateCategory()
  // ---------------------------------------------------------------------------
  describe('updateCategory()', () => {
    test('throws an error if category does not exist', async () => {
      // Arrange: category not found
      Category.findByPk.mockResolvedValue(null);

      // Act & Assert (rejects.toThrow catches promise rejection)
      await expect(categoryService.updateCategory(99, { name: 'New Name' }))
        .rejects
        .toThrow('Category not found');
    });

    test('updates category when it exists and returns the updated record', async () => {
      // Arrange: mock instance with update method
      const mockInstance = {
        id: 1,
        name: 'Old Category',
        update: jest.fn().mockResolvedValue(true)
      };

      const updatedCategory = { id: 1, name: 'Updated Category' };

      // STUB sequence: 1st findByPk gets instance to update, 2nd gets fresh record
      Category.findByPk
        .mockResolvedValueOnce(mockInstance)
        .mockResolvedValueOnce(updatedCategory);

      // Act
      const result = await categoryService.updateCategory(1, { name: 'Updated Category' });

      // Assert: verify update was called with new data
      expect(mockInstance.update).toHaveBeenCalledTimes(1);
      expect(mockInstance.update).toHaveBeenCalledWith({ name: 'Updated Category' });
      expect(result).toEqual(updatedCategory);
    });
  });

  // ---------------------------------------------------------------------------
  // 5. deleteCategory()
  // ---------------------------------------------------------------------------
  describe('deleteCategory()', () => {
    test('throws an error when deleting a non-existent category', async () => {
      // Arrange
      Category.findByPk.mockResolvedValue(null);

      // Act & Assert
      await expect(categoryService.deleteCategory(999))
        .rejects
        .toThrow('Category not found');
    });

    test('deletes category when found and returns true', async () => {
      // Arrange: mock instance with destroy method
      const mockInstance = {
        id: 3,
        name: 'Obsolete Category',
        destroy: jest.fn().mockResolvedValue(true)
      };

      Category.findByPk.mockResolvedValue(mockInstance);

      // Act
      const result = await categoryService.deleteCategory(3);

      // Assert
      expect(mockInstance.destroy).toHaveBeenCalledTimes(1);
      // toBe compares primitive boolean
      expect(result).toBe(true);
    });
  });
});
