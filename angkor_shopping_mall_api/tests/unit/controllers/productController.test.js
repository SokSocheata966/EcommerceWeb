const productController = require('../../../src/controllers/productController');
const productService = require('../../../src/services/productService');
const { Product, ProductImage } = require('../../../src/models/relationships');
const { uploadFile } = require('../../../src/utils/uploadToSupabase');
const { successResponse, errorResponse } = require('../../../src/utils/response');
const { trackInteraction, trackInteractionBulk } = require('../../../src/utils/trackInteraction');
const { getSimilarProducts } = require('../../../src/services/recommendationService');

/**
 * Unit Test following the Lesson:
 * "Software Testing: Unit Test with Jest in NodeJS"
 *
 * Core Concepts Applied:
 * 1. AAA Pattern (Arrange · Act · Assert)
 * 2. Matchers: toBe, toEqual, toHaveBeenCalledWith, toHaveBeenCalledTimes
 * 3. Test Doubles:
 *    - Stub: mockResolvedValue / mockRejectedValue
 *    - Mock: successResponse, errorResponse, trackInteraction
 *    - Dummy: req/res objects
 */

jest.mock('../../../src/services/productService');
jest.mock('../../../src/models/relationships', () => ({
  Product: {
    findByPk: jest.fn(),
    count: jest.fn()
  },
  ProductImage: {
    findOne: jest.fn(),
    findAll: jest.fn(),
    create: jest.fn()
  },
  Category: {
    findOrCreate: jest.fn()
  },
  Brand: {
    findOrCreate: jest.fn()
  }
}));
jest.mock('../../../src/utils/uploadToSupabase', () => ({
  uploadFile: jest.fn(),
  deleteFile: jest.fn()
}));
jest.mock('../../../src/utils/response', () => ({
  successResponse: jest.fn(),
  errorResponse: jest.fn()
}));
jest.mock('../../../src/utils/trackInteraction', () => ({
  trackInteraction: jest.fn(),
  trackInteractionBulk: jest.fn()
}));
jest.mock('../../../src/services/recommendationService', () => ({
  getSimilarProducts: jest.fn()
}));

describe('Product Controller (src/controllers/productController.js)', () => {
  let req;
  let res;

  beforeEach(() => {
    jest.clearAllMocks();
    req = {
      body: {},
      query: {},
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
    test('should create product with uploaded file and stringified JSON detail', async () => {
      // Arrange
      req.file = { originalname: 'phone.png', buffer: Buffer.from('') };
      req.body = {
        name: 'iPhone 15',
        price: '999.00',
        stock_quantity: '10',
        detail: JSON.stringify({ processor: 'A16' }),
        variants: JSON.stringify([{ color: 'Black' }]),
        images: JSON.stringify(['img1.png'])
      };
      req.user = { id: 'admin-1' };

      uploadFile.mockResolvedValue({ url: 'https://img.png', path: 'products/img.png' });
      const createdProduct = { id: 'p-1', name: 'iPhone 15', price: '999.00' };
      productService.create.mockResolvedValue(createdProduct);

      // Act
      await productController.create(req, res);

      // Assert
      expect(uploadFile).toHaveBeenCalledWith(req.file, 'products');
      expect(productService.create).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'iPhone 15',
          price: '999.00',
          image_url: 'https://img.png',
          created_by: 'admin-1',
          detail: { processor: 'A16' },
          variants: [{ color: 'Black' }],
          images: ['img1.png']
        })
      );
      expect(successResponse).toHaveBeenCalledWith(
        res,
        'Product created successfully',
        createdProduct,
        201
      );
    });

    test('should call errorResponse when productService.create throws an error', async () => {
      // Arrange
      req.body = { name: 'Faulty Product' };
      productService.create.mockRejectedValue(new Error('Validation error: Price is required'));

      // Act
      await productController.create(req, res);

      // Assert
      expect(errorResponse).toHaveBeenCalledWith(res, 'Validation error: Price is required');
    });
  });

  // ===========================================================================
  // 2. findAll(req, res)
  // ===========================================================================
  describe('findAll()', () => {
    test('should fetch all products and track search interaction for authenticated user', async () => {
      // Arrange
      req.query = { search: 'iPhone', category_id: 'cat-1' };
      req.user = { id: 'user-1' };

      const mockProducts = [
        { id: 'p-1', name: 'iPhone 14' },
        { id: 'p-2', name: 'iPhone 15' }
      ];
      productService.findAll.mockResolvedValue(mockProducts);

      // Act
      await productController.findAll(req, res);

      // Assert
      expect(productService.findAll).toHaveBeenCalledWith({
        category_id: 'cat-1',
        brand_id: undefined,
        search: 'iPhone'
      });
      expect(trackInteractionBulk).toHaveBeenCalledWith('user-1', ['p-1', 'p-2'], 'search');
      expect(successResponse).toHaveBeenCalledWith(
        res,
        'Products fetched successfully',
        {
          totalItems: 2,
          products: mockProducts
        }
      );
    });

    test('should return errorResponse when productService.findAll fails', async () => {
      // Arrange
      productService.findAll.mockRejectedValue(new Error('Database query failed'));

      // Act
      await productController.findAll(req, res);

      // Assert
      expect(errorResponse).toHaveBeenCalledWith(res, 'Database query failed');
    });
  });

  // ===========================================================================
  // 3. findAllTrue(req, res) - Paged list
  // ===========================================================================
  describe('findAllTrue()', () => {
    test('should fetch paged products with pagination metadata', async () => {
      // Arrange
      req.query = { page: '2', limit: '5' };
      const pagedResult = {
        totalItems: 12,
        totalPages: 3,
        currentPage: 2,
        products: [{ id: 'p-1', name: 'Product 1' }]
      };
      productService.findAllPaged.mockResolvedValue(pagedResult);

      // Act
      await productController.findAllTrue(req, res);

      // Assert
      expect(productService.findAllPaged).toHaveBeenCalledWith({
        category_id: undefined,
        brand_id: undefined,
        search: undefined,
        page: '2',
        limit: '5'
      });
      expect(successResponse).toHaveBeenCalledWith(
        res,
        'Products fetched successfully',
        pagedResult
      );
    });
  });

  // ===========================================================================
  // 4. findOne(req, res)
  // ===========================================================================
  describe('findOne()', () => {
    test('should fetch product, track view for auth user, and attach AI recommendations', async () => {
      // Arrange
      req.params.id = 'p-1';
      req.user = { id: 'user-1' };

      const mockProduct = { id: 'p-1', name: 'MacBook Pro' };
      const mockSimilar = [{ id: 'p-2', name: 'MacBook Air' }];

      productService.findOne.mockResolvedValue(mockProduct);
      getSimilarProducts.mockResolvedValue(mockSimilar);

      // Act
      await productController.findOne(req, res);

      // Assert
      expect(productService.findOne).toHaveBeenCalledWith('p-1');
      expect(trackInteraction).toHaveBeenCalledWith('user-1', 'p-1', 'view');
      expect(getSimilarProducts).toHaveBeenCalledWith('p-1', 6);
      expect(mockProduct.ai_similar_products).toEqual(mockSimilar);
      expect(successResponse).toHaveBeenCalledWith(
        res,
        'Product fetched successfully',
        mockProduct
      );
    });

    test('should return 404 when product is not found', async () => {
      // Arrange
      req.params.id = 'non-existent';
      productService.findOne.mockRejectedValue(new Error('Product not found'));

      // Act
      await productController.findOne(req, res);

      // Assert
      expect(errorResponse).toHaveBeenCalledWith(res, 'Product not found', 404);
    });
  });

  // ===========================================================================
  // 5. update(req, res)
  // ===========================================================================
  describe('update()', () => {
    test('should return 404 if product does not exist', async () => {
      // Arrange
      req.params.id = 'missing-id';
      Product.findByPk.mockResolvedValue(null);

      // Act
      await productController.update(req, res);

      // Assert
      expect(errorResponse).toHaveBeenCalledWith(res, 'Product not found', 404);
    });

    test('should update product fields and return updated product', async () => {
      // Arrange
      req.params.id = 'p-1';
      req.body = { name: 'Updated Title' };
      req.user = { id: 'admin-1' };

      const existingProduct = { id: 'p-1', name: 'Old Title', price: '100.00' };
      Product.findByPk.mockResolvedValue(existingProduct);
      productService.update.mockResolvedValue({ id: 'p-1', name: 'Updated Title' });
      productService.findOne.mockResolvedValue({ id: 'p-1', name: 'Updated Title' });

      // Act
      await productController.update(req, res);

      // Assert
      expect(productService.update).toHaveBeenCalledWith(
        'p-1',
        expect.objectContaining({
          name: 'Updated Title',
          updated_by: 'admin-1'
        })
      );
      expect(successResponse).toHaveBeenCalledWith(
        res,
        'Product updated successfully',
        expect.objectContaining({ name: 'Updated Title' })
      );
    });
  });

  // ===========================================================================
  // 6. delete(req, res)
  // ===========================================================================
  describe('delete()', () => {
    test('should return 404 when product to delete is not found', async () => {
      // Arrange
      req.params.id = 'missing-id';
      Product.findByPk.mockResolvedValue(null);

      // Act
      await productController.delete(req, res);

      // Assert
      expect(errorResponse).toHaveBeenCalledWith(res, 'Product not found', 404);
    });

    test('should destroy product and return success message', async () => {
      // Arrange
      req.params.id = 'p-1';
      Product.findByPk.mockResolvedValue({ id: 'p-1' });
      ProductImage.findAll.mockResolvedValue([]);
      productService.destroy.mockResolvedValue({ message: 'Product deleted successfully' });

      // Act
      await productController.delete(req, res);

      // Assert
      expect(productService.destroy).toHaveBeenCalledWith('p-1');
      expect(successResponse).toHaveBeenCalledWith(res, 'Product deleted successfully');
    });
  });
});
