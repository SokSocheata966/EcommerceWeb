const brandController = require('../../../src/controllers/brandController');
const BrandService = require('../../../src/services/brandService');
const {
  successResponse,
  errorResponse
} = require('../../../src/utils/response');

/**
 * Unit Test following the Lesson:
 * "Software Testing: Unit Test with Jest in NodeJS"
 *
 * Core Concepts:
 * 1. AAA Pattern (Arrange · Act · Assert)
 * 2. Matchers: toBe, toEqual, toHaveBeenCalledWith, toHaveBeenCalledTimes
 * 3. Test Doubles:
 *    - Stub: mockResolvedValue / mockRejectedValue
 *    - Mock: successResponse, errorResponse
 *    - Dummy: req/res objects
 */

jest.mock('../../../src/services/brandService');
jest.mock('../../../src/utils/response', () => ({
  successResponse: jest.fn(),
  errorResponse: jest.fn()
}));

describe('Brand Controller (src/controllers/brandController.js)', () => {
  let req;
  let res;

  beforeEach(() => {
    jest.clearAllMocks();
    req = {
      body: {},
      params: {},
      user: null
    };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis()
    };
  });

  // ===========================================================================
  // 1. create(req, res)
  // ===========================================================================
  describe('create()', () => {
    test('should create brand with created_by when user is authenticated', async () => {
      // Arrange
      req.body = { name: 'Apple', description: 'Premium Tech' };
      req.user = { id: 'admin-uuid-1' };

      const createdBrand = { id: 'b-1', name: 'Apple', created_by: 'admin-uuid-1' };
      BrandService.createBrand.mockResolvedValue(createdBrand);

      // Act
      await brandController.create(req, res);

      // Assert
      expect(BrandService.createBrand).toHaveBeenCalledWith({
        name: 'Apple',
        description: 'Premium Tech',
        created_by: 'admin-uuid-1'
      });
      expect(successResponse).toHaveBeenCalledWith(
        res,
        'Brand created successfully',
        createdBrand
      );
    });

    test('should create brand without created_by when user is not present', async () => {
      // Arrange
      req.body = { name: 'Samsung' };
      req.user = null;

      const createdBrand = { id: 'b-2', name: 'Samsung' };
      BrandService.createBrand.mockResolvedValue(createdBrand);

      // Act
      await brandController.create(req, res);

      // Assert
      expect(BrandService.createBrand).toHaveBeenCalledWith({ name: 'Samsung' });
      expect(successResponse).toHaveBeenCalledWith(
        res,
        'Brand created successfully',
        createdBrand
      );
    });

    test('should return errorResponse when BrandService.createBrand throws', async () => {
      // Arrange
      req.body = { name: 'Duplicate' };
      BrandService.createBrand.mockRejectedValue(new Error('Brand name already exists'));

      // Act
      await brandController.create(req, res);

      // Assert
      expect(errorResponse).toHaveBeenCalledWith(res, 'Brand name already exists');
    });
  });

  // ===========================================================================
  // 2. findAll(req, res)
  // ===========================================================================
  describe('findAll()', () => {
    test('should retrieve all brands and return successResponse', async () => {
      // Arrange
      const mockBrands = [
        { id: 'b-1', name: 'Apple' },
        { id: 'b-2', name: 'Samsung' }
      ];
      BrandService.getAllBrands.mockResolvedValue(mockBrands);

      // Act
      await brandController.findAll(req, res);

      // Assert
      expect(BrandService.getAllBrands).toHaveBeenCalledTimes(1);
      expect(successResponse).toHaveBeenCalledWith(
        res,
        'Brands retrieved successfully',
        mockBrands
      );
    });

    test('should return errorResponse if BrandService.getAllBrands fails', async () => {
      // Arrange
      BrandService.getAllBrands.mockRejectedValue(new Error('Database error'));

      // Act
      await brandController.findAll(req, res);

      // Assert
      expect(errorResponse).toHaveBeenCalledWith(res, 'Database error');
    });
  });

  // ===========================================================================
  // 3. findOne(req, res)
  // ===========================================================================
  describe('findOne()', () => {
    test('should retrieve single brand by id successfully', async () => {
      // Arrange
      req.params.id = 'b-1';
      const mockBrand = { id: 'b-1', name: 'Apple' };
      BrandService.getBrandById.mockResolvedValue(mockBrand);

      // Act
      await brandController.findOne(req, res);

      // Assert
      expect(BrandService.getBrandById).toHaveBeenCalledWith('b-1');
      expect(successResponse).toHaveBeenCalledWith(
        res,
        'Brand retrieved successfully',
        mockBrand
      );
    });

    test('should return errorResponse when brand is not found', async () => {
      // Arrange
      req.params.id = 'non-existent';
      BrandService.getBrandById.mockResolvedValue(null);

      // Act
      await brandController.findOne(req, res);

      // Assert
      expect(errorResponse).toHaveBeenCalledWith(res, 'Brand not found');
    });

    test('should handle exception thrown by getBrandById', async () => {
      // Arrange
      req.params.id = 'b-1';
      BrandService.getBrandById.mockRejectedValue(new Error('Query timeout'));

      // Act
      await brandController.findOne(req, res);

      // Assert
      expect(errorResponse).toHaveBeenCalledWith(res, 'Query timeout');
    });
  });

  // ===========================================================================
  // 4. update(req, res)
  // ===========================================================================
  describe('update()', () => {
    test('should update brand and set updated_by when authenticated', async () => {
      // Arrange
      req.params.id = 'b-1';
      req.body = { name: 'Apple Inc.' };
      req.user = { id: 'editor-uuid-1' };

      const updatedBrand = { id: 'b-1', name: 'Apple Inc.', updated_by: 'editor-uuid-1' };
      BrandService.updateBrand.mockResolvedValue(updatedBrand);

      // Act
      await brandController.update(req, res);

      // Assert
      expect(BrandService.updateBrand).toHaveBeenCalledWith('b-1', {
        name: 'Apple Inc.',
        updated_by: 'editor-uuid-1'
      });
      expect(successResponse).toHaveBeenCalledWith(
        res,
        'Brand updated successfully',
        updatedBrand
      );
    });

    test('should return errorResponse if BrandService.updateBrand throws an error', async () => {
      // Arrange
      req.params.id = 'b-1';
      req.body = { name: 'New Name' };
      BrandService.updateBrand.mockRejectedValue(new Error('Brand not found'));

      // Act
      await brandController.update(req, res);

      // Assert
      expect(errorResponse).toHaveBeenCalledWith(res, 'Brand not found');
    });
  });

  // ===========================================================================
  // 5. delete(req, res)
  // ===========================================================================
  describe('delete()', () => {
    test('should delete brand and return successResponse', async () => {
      // Arrange
      req.params.id = 'b-1';
      BrandService.deleteBrand.mockResolvedValue(true);

      // Act
      await brandController.delete(req, res);

      // Assert
      expect(BrandService.deleteBrand).toHaveBeenCalledWith('b-1');
      expect(successResponse).toHaveBeenCalledWith(
        res,
        'Brand deleted successfully'
      );
    });

    test('should return errorResponse when deleteBrand throws an error', async () => {
      // Arrange
      req.params.id = 'b-1';
      BrandService.deleteBrand.mockRejectedValue(new Error('Cannot delete brand'));

      // Act
      await brandController.delete(req, res);

      // Assert
      expect(errorResponse).toHaveBeenCalledWith(res, 'Cannot delete brand');
    });
  });
});
