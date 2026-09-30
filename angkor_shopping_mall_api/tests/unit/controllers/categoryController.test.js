const categoryController = require('../../../src/controllers/categoryController');
const CategoryService = require('../../../src/services/categoryService');
const Category = require('../../../src/models/categoryModel');
const Product = require('../../../src/models/productModel');
const {
  successResponse,
  errorResponse
} = require('../../../src/utils/response');

/**
 * Unit Test following the Lesson:
 * "Software Testing: Unit Test with Jest in NodeJS"
 *
 * Core Concepts Applied:
 * 1. AAA Pattern (Arrange · Act · Assert)
 * 2. Matchers:
 *    - toBe / toEqual
 *    - toHaveBeenCalledWith / toHaveBeenCalledTimes
 * 3. Test Doubles:
 *    - STUB: mockResolvedValue / mockRejectedValue for Service and Model calls
 *    - MOCK: verifying res and response helpers (successResponse, errorResponse)
 *    - DUMMY: mock req with minimal required payload
 */

// Mock external dependencies
jest.mock('../../../src/services/categoryService');
jest.mock('../../../src/models/categoryModel');
jest.mock('../../../src/models/productModel');
jest.mock('../../../src/utils/response', () => ({
  successResponse: jest.fn(),
  errorResponse: jest.fn()
}));

describe('Category Controller (src/controllers/categoryController.js)', () => {
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
    test('should create a category with created_by when req.user exists', async () => {
      // Arrange
      req.body = { name: 'Smartphones', icon: '📱' };
      req.user = { id: 'user-uuid-123' };

      const createdCategory = {
        id: 'cat-uuid-1',
        name: 'Smartphones',
        icon: '📱',
        created_by: 'user-uuid-123'
      };
      CategoryService.createCategory.mockResolvedValue(createdCategory);

      // Act
      await categoryController.create(req, res);

      // Assert
      expect(CategoryService.createCategory).toHaveBeenCalledTimes(1);
      expect(CategoryService.createCategory).toHaveBeenCalledWith({
        name: 'Smartphones',
        icon: '📱',
        created_by: 'user-uuid-123'
      });
      expect(successResponse).toHaveBeenCalledWith(
        res,
        'Category created successfully',
        createdCategory
      );
    });

    test('should create a category without created_by when req.user is absent', async () => {
      // Arrange
      req.body = { name: 'Accessories' };
      req.user = null;

      const createdCategory = { id: 'cat-uuid-2', name: 'Accessories' };
      CategoryService.createCategory.mockResolvedValue(createdCategory);

      // Act
      await categoryController.create(req, res);

      // Assert
      expect(CategoryService.createCategory).toHaveBeenCalledWith({
        name: 'Accessories'
      });
      expect(successResponse).toHaveBeenCalledWith(
        res,
        'Category created successfully',
        createdCategory
      );
    });

    test('should call errorResponse if CategoryService.createCategory throws an error', async () => {
      // Arrange
      req.body = { name: 'Duplicate' };
      CategoryService.createCategory.mockRejectedValue(new Error('Category already exists'));

      // Act
      await categoryController.create(req, res);

      // Assert
      expect(errorResponse).toHaveBeenCalledWith(res, 'Category already exists');
    });
  });

  // ===========================================================================
  // 2. findAll(req, res)
  // ===========================================================================
  describe('findAll()', () => {
    it('should retrieve all categories and map product counts', async () => {
      // Arrange
      const mockCategories = [
        { id: 'cat-1', name: 'Phones' },
        { id: 'cat-2', name: 'Laptops' }
      ];
      const mockProductCounts = [
        { category_id: 'cat-1', product_count: '15' },
        { category_id: 'cat-2', product_count: '8' }
      ];

      Category.findAll.mockResolvedValue(mockCategories);
      Product.findAll.mockResolvedValue(mockProductCounts);

      // Act
      await categoryController.findAll(req, res);

      // Assert
      expect(Category.findAll).toHaveBeenCalledWith({
        order: [['created_at', 'DESC']],
        raw: true
      });
      expect(Product.findAll).toHaveBeenCalledTimes(1);
      expect(successResponse).toHaveBeenCalledWith(
        res,
        'Categories retrieved successfully',
        [
          { id: 'cat-1', name: 'Phones', product_count: 15 },
          { id: 'cat-2', name: 'Laptops', product_count: 8 }
        ]
      );
    });

    test('should default product_count to 0 if a category has no products', async () => {
      // Arrange
      const mockCategories = [{ id: 'cat-1', name: 'Empty Category' }];
      const mockProductCounts = [];

      Category.findAll.mockResolvedValue(mockCategories);
      Product.findAll.mockResolvedValue(mockProductCounts);

      // Act
      await categoryController.findAll(req, res);

      // Assert
      expect(successResponse).toHaveBeenCalledWith(
        res,
        'Categories retrieved successfully',
        [{ id: 'cat-1', name: 'Empty Category', product_count: 0 }]
      );
    });

    test('should call errorResponse when Category.findAll throws an error', async () => {
      // Arrange
      Category.findAll.mockRejectedValue(new Error('Database query failed'));

      // Act
      await categoryController.findAll(req, res);

      // Assert
      expect(errorResponse).toHaveBeenCalledWith(res, 'Database query failed');
    });
  });

  // ===========================================================================
  // 3. findOne(req, res)
  // ===========================================================================
  describe('findOne()', () => {
    test('should retrieve category by id and return successResponse', async () => {
      // Arrange
      req.params.id = 'cat-uuid-1';
      const mockCategory = { id: 'cat-uuid-1', name: 'Smartphones' };
      CategoryService.getCategoryById.mockResolvedValue(mockCategory);

      // Act
      await categoryController.findOne(req, res);

      // Assert
      expect(CategoryService.getCategoryById).toHaveBeenCalledWith('cat-uuid-1');
      expect(successResponse).toHaveBeenCalledWith(
        res,
        'Category retrieved successfully',
        mockCategory
      );
    });

    test('should return errorResponse if category is not found', async () => {
      // Arrange
      req.params.id = 'non-existent-id';
      CategoryService.getCategoryById.mockResolvedValue(null);

      // Act
      await categoryController.findOne(req, res);

      // Assert
      expect(errorResponse).toHaveBeenCalledWith(res, 'Category not found');
    });

    test('should handle service exception in findOne', async () => {
      // Arrange
      req.params.id = 'cat-uuid-1';
      CategoryService.getCategoryById.mockRejectedValue(new Error('Connection timeout'));

      // Act
      await categoryController.findOne(req, res);

      // Assert
      expect(errorResponse).toHaveBeenCalledWith(res, 'Connection timeout');
    });
  });

  // ===========================================================================
  // 4. update(req, res)
  // ===========================================================================
  describe('update()', () => {
    test('should update category and append updated_by when user is authenticated', async () => {
      // Arrange
      req.params.id = 'cat-uuid-1';
      req.body = { name: 'Updated Name' };
      req.user = { id: 'editor-uuid-999' };

      const updatedCategory = {
        id: 'cat-uuid-1',
        name: 'Updated Name',
        updated_by: 'editor-uuid-999'
      };
      CategoryService.updateCategory.mockResolvedValue(updatedCategory);

      // Act
      await categoryController.update(req, res);

      // Assert
      expect(CategoryService.updateCategory).toHaveBeenCalledWith(
        'cat-uuid-1',
        {
          name: 'Updated Name',
          updated_by: 'editor-uuid-999'
        }
      );
      expect(successResponse).toHaveBeenCalledWith(
        res,
        'Category updated successfully',
        updatedCategory
      );
    });

    test('should handle error when updateCategory throws', async () => {
      // Arrange
      req.params.id = 'cat-uuid-1';
      req.body = { name: 'Updated Name' };
      CategoryService.updateCategory.mockRejectedValue(new Error('Update failed'));

      // Act
      await categoryController.update(req, res);

      // Assert
      expect(errorResponse).toHaveBeenCalledWith(res, 'Update failed');
    });
  });

  // ===========================================================================
  // 5. delete(req, res)
  // ===========================================================================
  describe('delete()', () => {
    test('should delete category and return successResponse', async () => {
      // Arrange
      req.params.id = 'cat-uuid-1';
      CategoryService.deleteCategory.mockResolvedValue(true);

      // Act
      await categoryController.delete(req, res);

      // Assert
      expect(CategoryService.deleteCategory).toHaveBeenCalledWith('cat-uuid-1');
      expect(successResponse).toHaveBeenCalledWith(
        res,
        'Category deleted successfully'
      );
    });

    test('should return errorResponse when deleteCategory throws an error', async () => {
      // Arrange
      req.params.id = 'cat-uuid-1';
      CategoryService.deleteCategory.mockRejectedValue(new Error('Cannot delete category with products'));

      // Act
      await categoryController.delete(req, res);

      // Assert
      expect(errorResponse).toHaveBeenCalledWith(
        res,
        'Cannot delete category with products'
      );
    });
  });
});
