const db = require('../../../src/config/db');
const {
  Product,
  ProductVariant,
  ProductDetail,
  ProductImage,
  Category,
  Brand,
  ProductReview
} = require('../../../src/models/relationships');
const productService = require('../../../src/services/productService');

/**
 * Unit Test following the Lesson:
 * "Software Testing: Unit Test with Jest in NodeJS"
 *
 * Core Concepts Applied:
 * 1. AAA Pattern (Arrange · Act · Assert)
 * 2. Matchers:
 *    - toBe (primitive equality: numbers, booleans, strings)
 *    - toEqual (deep object / array equality)
 *    - rejects.toThrow (asynchronous exception handling)
 *    - toHaveBeenCalledWith / toHaveBeenCalledTimes (verify dependency interactions)
 * 3. Test Doubles:
 *    - STUB: mockResolvedValue / mockReturnValue feeding controlled data in
 *    - MOCK: verifying how Product & sequelize were called
 *    - DUMMY: passing mock transaction objects
 */

// Mock Sequelize database transaction
jest.mock('../../../src/config/db', () => ({
  transaction: jest.fn()
}));

// Mock Models from relationships
jest.mock('../../../src/models/relationships', () => ({
  Product: {
    findAll: jest.fn(),
    findAndCountAll: jest.fn(),
    findOne: jest.fn(),
    findByPk: jest.fn(),
    create: jest.fn()
  },
  ProductVariant: {
    findOne: jest.fn(),
    create: jest.fn()
  },
  ProductDetail: {
    create: jest.fn()
  },
  ProductImage: {
    findAll: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    findOrCreate: jest.fn()
  },
  Category: {
    findAll: jest.fn()
  },
  Brand: {},
  ProductReview: {
    findAll: jest.fn()
  },
  User: {},
  Order: {},
  OrderItem: {}
}));

describe('Product Service (src/services/productService.js)', () => {
  let mockTransaction;

  beforeEach(() => {
    // Arrange fresh mock transaction before each test
    mockTransaction = {
      commit: jest.fn().mockResolvedValue(),
      rollback: jest.fn().mockResolvedValue()
    };
    db.transaction.mockResolvedValue(mockTransaction);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  // ---------------------------------------------------------------------------
  // 1. findAll()
  // ---------------------------------------------------------------------------
  describe('findAll()', () => {
    test('retrieves all products without filters', async () => {
      // Arrange
      const mockProducts = [
        { id: 'prod-1', name: 'iPhone 15', price: 999 },
        { id: 'prod-2', name: 'MacBook Pro', price: 1999 }
      ];
      // STUB: feed canned products in
      Product.findAll.mockResolvedValue(mockProducts);

      // Act
      const result = await productService.findAll();

      // Assert: verify mock usage and result equality
      expect(Product.findAll).toHaveBeenCalledTimes(1);
      expect(result).toEqual(mockProducts);
      expect(result.length).toBe(2);
    });

    test('applies category_id and brand_id filter parameters', async () => {
      // Arrange
      const filters = { category_id: 3, brand_id: 5 };
      Product.findAll.mockResolvedValue([]);

      // Act
      const result = await productService.findAll(filters);

      // Assert: verify where clause includes category_id and brand_id
      expect(Product.findAll).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            category_id: 3,
            brand_id: 5
          })
        })
      );
      expect(result).toEqual([]);
    });

    test('applies search keyword filter with case-insensitive search', async () => {
      // Arrange
      const filters = { search: 'Galaxy' };
      Product.findAll.mockResolvedValue([{ id: 'prod-3', name: 'Samsung Galaxy' }]);

      // Act
      const result = await productService.findAll(filters);

      // Assert
      expect(Product.findAll).toHaveBeenCalledTimes(1);
      expect(result[0].name).toBe('Samsung Galaxy');
    });
  });

  // ---------------------------------------------------------------------------
  // 2. findAllPaged()
  // ---------------------------------------------------------------------------
  describe('findAllPaged()', () => {
    test('calculates pagination correctly and returns products with metadata', async () => {
      // Arrange
      const mockRows = [
        { id: 'p1', name: 'Product 1', price: 50 },
        { id: 'p2', name: 'Product 2', price: 75 }
      ];
      Product.findAndCountAll.mockResolvedValue({
        count: 25,
        rows: mockRows
      });

      // Act
      const result = await productService.findAllPaged({ page: 2, limit: 10 });

      // Assert: verify math calculations with toBe
      expect(result.totalItems).toBe(25);
      expect(result.totalPages).toBe(3); // Math.ceil(25 / 10) = 3
      expect(result.currentPage).toBe(2);
      expect(result.products).toEqual(mockRows);

      // Verify offset calculation in query: (page - 1) * limit = (2 - 1) * 10 = 10
      expect(Product.findAndCountAll).toHaveBeenCalledWith(
        expect.objectContaining({
          limit: 10,
          offset: 10
        })
      );
    });
  });

  // ---------------------------------------------------------------------------
  // 3. findOne()
  // ---------------------------------------------------------------------------
  describe('findOne()', () => {
    test('throws an error if product id is missing or not provided', async () => {
      // Arrange, Act & Assert
      await expect(productService.findOne(null))
        .rejects
        .toThrow('Product not found');
    });

    test('retrieves product by UUID, attaches reviews, and computes rating summary', async () => {
      // Arrange
      const uuid = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11';
      const mockProductInstance = {
        id: uuid,
        name: 'Wireless Headphones',
        price: 150,
        toJSON: jest.fn().mockReturnValue({
          id: uuid,
          name: 'Wireless Headphones',
          price: 150
        })
      };

      const mockReviews = [
        { rating: 5, comment: 'Excellent sound!', toJSON: () => ({ rating: 5, comment: 'Excellent sound!' }) },
        { rating: 4, comment: 'Very good battery life', toJSON: () => ({ rating: 4, comment: 'Very good battery life' }) }
      ];

      Product.findOne.mockResolvedValue(mockProductInstance);
      ProductReview.findAll.mockResolvedValue(mockReviews);

      // Act
      const result = await productService.findOne(uuid);

      // Assert
      expect(result.id).toBe(uuid);
      expect(result.reviews.length).toBe(2);
      // Average rating: (5 + 4) / 2 = 4.5
      expect(result.ratingSummary.averageRating).toBe(4.5);
      expect(result.ratingSummary.totalReviews).toBe(2);
    });

    test('throws an error if no product is found in the database', async () => {
      // Arrange
      Product.findOne.mockResolvedValue(null);

      // Act & Assert
      await expect(productService.findOne('non-existent-id'))
        .rejects
        .toThrow('Product not found');
    });
  });

  // ---------------------------------------------------------------------------
  // 4. create()
  // ---------------------------------------------------------------------------
  describe('create()', () => {
    test('creates base product, commits transaction, and returns created product', async () => {
      // Arrange
      const input = {
        name: 'New Gaming Laptop',
        description: 'RTX 4080',
        price: 1800,
        stock_quantity: 10,
        category_id: 1,
        brand_id: 2
      };

      const createdProduct = { id: 'prod-new-1', ...input };
      Product.create.mockResolvedValue(createdProduct);
      Product.findByPk.mockResolvedValue(createdProduct);

      // Act
      const result = await productService.create(input);

      // Assert
      expect(db.transaction).toHaveBeenCalledTimes(1);
      expect(Product.create).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'New Gaming Laptop',
          price: 1800
        }),
        { transaction: mockTransaction }
      );
      // Transaction committed
      expect(mockTransaction.commit).toHaveBeenCalledTimes(1);
      expect(mockTransaction.rollback).not.toHaveBeenCalled();
      expect(result).toEqual(createdProduct);
    });

    test('rolls back transaction when an error occurs during creation', async () => {
      // Arrange
      Product.create.mockRejectedValue(new Error('Database error on insert'));

      // Act & Assert
      await expect(productService.create({ name: 'Failing Product' }))
        .rejects
        .toThrow('Database error on insert');

      // Assert rollback
      expect(mockTransaction.rollback).toHaveBeenCalledTimes(1);
      expect(mockTransaction.commit).not.toHaveBeenCalled();
    });
  });

  // ---------------------------------------------------------------------------
  // 5. update()
  // ---------------------------------------------------------------------------
  describe('update()', () => {
    test('throws an error if product to update does not exist', async () => {
      // Arrange: product not found
      Product.findByPk.mockResolvedValue(null);

      // Act & Assert
      await expect(productService.update('p-999', { name: 'New Title' }))
        .rejects
        .toThrow('Product not found');
    });

    test('updates existing product, commits transaction, and returns refreshed product', async () => {
      // Arrange
      const uuid = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11';
      const mockInstance = {
        id: uuid,
        name: 'Old Title',
        update: jest.fn().mockResolvedValue(true)
      };

      const refreshedProduct = {
        id: uuid,
        name: 'Updated Title',
        price: 200,
        toJSON: () => ({ id: uuid, name: 'Updated Title', price: 200 })
      };

      Product.findByPk.mockResolvedValue(mockInstance);
      Product.findOne.mockResolvedValue(refreshedProduct);
      ProductReview.findAll.mockResolvedValue([]);

      // Act
      const result = await productService.update(uuid, { name: 'Updated Title' });

      // Assert
      expect(mockInstance.update).toHaveBeenCalledWith(
        { name: 'Updated Title' },
        { transaction: mockTransaction }
      );
      expect(mockTransaction.commit).toHaveBeenCalledTimes(1);
      expect(result.name).toBe('Updated Title');
    });
  });

  // ---------------------------------------------------------------------------
  // 6. destroy()
  // ---------------------------------------------------------------------------
  describe('destroy()', () => {
    test('throws an error if product to delete does not exist', async () => {
      // Arrange
      Product.findByPk.mockResolvedValue(null);

      // Act & Assert
      await expect(productService.destroy('non-existent'))
        .rejects
        .toThrow('Product not found');
    });

    test('deletes product when found and returns success message', async () => {
      // Arrange
      const mockInstance = {
        id: 'p-1',
        destroy: jest.fn().mockResolvedValue(true)
      };
      Product.findByPk.mockResolvedValue(mockInstance);

      // Act
      const result = await productService.destroy('p-1');

      // Assert
      expect(mockInstance.destroy).toHaveBeenCalledTimes(1);
      expect(result).toEqual({
        message: 'Product deleted successfully'
      });
    });
  });
});
