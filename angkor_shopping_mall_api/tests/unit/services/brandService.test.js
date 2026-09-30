const Brand = require('../../../src/models/brandModel');
const brandService = require('../../../src/services/brandService');

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
 *    - MOCK: Brand.create / Brand.findByPk / update / destroy record behavior
 */

// MOCK the Sequelize model dependency
jest.mock('../../../src/models/brandModel');

describe('Brand Service (src/services/brandService.js)', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  // ---------------------------------------------------------------------------
  // 1. createBrand()
  // ---------------------------------------------------------------------------
  describe('createBrand()', () => {
    test('creates a new brand record and returns it', async () => {
      // Arrange
      const input = { name: 'Nike', created_by: 1 };
      const expectedRecord = { id: 1, ...input };

      // STUB: provide canned data in
      Brand.create.mockResolvedValue(expectedRecord);

      // Act
      const result = await brandService.createBrand(input);

      // Assert
      // MOCK usage verification
      expect(Brand.create).toHaveBeenCalledTimes(1);
      expect(Brand.create).toHaveBeenCalledWith(input);
      // toEqual for object deep comparison
      expect(result).toEqual(expectedRecord);
    });
  });

  // ---------------------------------------------------------------------------
  // 2. getAllBrands()
  // ---------------------------------------------------------------------------
  describe('getAllBrands()', () => {
    test('retrieves all brands ordered by created_at DESC', async () => {
      // Arrange
      const mockBrands = [
        { id: 2, name: 'Adidas', created_at: '2026-02-01' },
        { id: 1, name: 'Nike', created_at: '2026-01-01' }
      ];

      // STUB
      Brand.findAll.mockResolvedValue(mockBrands);

      // Act
      const result = await brandService.getAllBrands();

      // Assert
      expect(Brand.findAll).toHaveBeenCalledTimes(1);
      expect(Brand.findAll).toHaveBeenCalledWith({
        order: [['created_at', 'DESC']]
      });
      expect(result).toEqual(mockBrands);
      expect(result.length).toBe(2);
    });
  });

  // ---------------------------------------------------------------------------
  // 3. getBrandById()
  // ---------------------------------------------------------------------------
  describe('getBrandById()', () => {
    test('retrieves a single brand by ID when found', async () => {
      // Arrange
      const mockBrand = { id: 5, name: 'Puma' };

      // STUB
      Brand.findByPk.mockResolvedValue(mockBrand);

      // Act
      const result = await brandService.getBrandById(5);

      // Assert
      expect(Brand.findByPk).toHaveBeenCalledTimes(1);
      expect(Brand.findByPk).toHaveBeenCalledWith(5);
      expect(result).toEqual(mockBrand);
    });

    test('returns null when brand ID does not exist', async () => {
      // Arrange
      Brand.findByPk.mockResolvedValue(null);

      // Act
      const result = await brandService.getBrandById(999);

      // Assert
      expect(Brand.findByPk).toHaveBeenCalledWith(999);
      expect(result).toBeNull();
    });
  });

  // ---------------------------------------------------------------------------
  // 4. updateBrand()
  // ---------------------------------------------------------------------------
  describe('updateBrand()', () => {
    test('throws an error if brand does not exist', async () => {
      // Arrange: brand not found
      Brand.findByPk.mockResolvedValue(null);

      // Act & Assert (rejects.toThrow catches promise rejection)
      await expect(brandService.updateBrand(99, { name: 'Puma' }))
        .rejects
        .toThrow('Brand not found');
    });

    test('updates brand when it exists and returns the updated brand', async () => {
      // Arrange: create a mock model instance with an update method
      const mockInstance = {
        id: 1,
        name: 'Old Brand',
        update: jest.fn().mockResolvedValue(true)
      };

      const updatedBrand = { id: 1, name: 'Updated Brand' };

      // STUB sequence: 1st findByPk finds the existing record, 2nd returns refreshed record
      Brand.findByPk
        .mockResolvedValueOnce(mockInstance)
        .mockResolvedValueOnce(updatedBrand);

      // Act
      const result = await brandService.updateBrand(1, { name: 'Updated Brand' });

      // Assert: verify update called with new data
      expect(mockInstance.update).toHaveBeenCalledTimes(1);
      expect(mockInstance.update).toHaveBeenCalledWith({ name: 'Updated Brand' });
      expect(result).toEqual(updatedBrand);
    });
  });

  // ---------------------------------------------------------------------------
  // 5. deleteBrand()
  // ---------------------------------------------------------------------------
  describe('deleteBrand()', () => {
    test('throws an error when deleting a non-existent brand', async () => {
      // Arrange
      Brand.findByPk.mockResolvedValue(null);

      // Act & Assert
      await expect(brandService.deleteBrand(999))
        .rejects
        .toThrow('Brand not found');
    });

    test('deletes brand when found and returns true', async () => {
      // Arrange: mock model instance with destroy method
      const mockInstance = {
        id: 2,
        name: 'To Be Deleted',
        destroy: jest.fn().mockResolvedValue(true)
      };

      Brand.findByPk.mockResolvedValue(mockInstance);

      // Act
      const result = await brandService.deleteBrand(2);

      // Assert: verify destroy was called once
      expect(mockInstance.destroy).toHaveBeenCalledTimes(1);
      // toBe compares primitive boolean
      expect(result).toBe(true);
    });
  });
});
