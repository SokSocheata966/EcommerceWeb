const userController = require('../../../src/controllers/userController');
const userService = require('../../../src/services/userService');
const {
  successResponse,
  errorResponse,
  handleControllerError
} = require('../../../src/utils/response');

/**
 * Unit Test following the Lesson:
 * "Software Testing: Unit Test with Jest in NodeJS"
 *
 * Core Concepts Applied:
 * 1. AAA Pattern (Arrange · Act · Assert)
 * 2. Matchers: toBe, toEqual, toHaveBeenCalledWith, toHaveBeenCalledTimes
 * 3. Test Doubles:
 *    - Stub: mockResolvedValue / mockRejectedValue
 *    - Mock: successResponse, errorResponse, handleControllerError
 *    - Dummy: req/res objects
 */

jest.mock('../../../src/services/userService');
jest.mock('../../../src/utils/response', () => ({
  successResponse: jest.fn(),
  errorResponse: jest.fn(),
  handleControllerError: jest.fn()
}));

describe('User Controller (src/controllers/userController.js)', () => {
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
  // 1. create()
  // ===========================================================================
  describe('create()', () => {
    test('should create user and return successResponse', async () => {
      // Arrange
      req.body = { name: 'John Doe', email: 'john@example.com', password: 'secretpassword' };
      const createdUser = { id: 'u-1', name: 'John Doe', email: 'john@example.com' };
      userService.createUser.mockResolvedValue(createdUser);

      // Act
      await userController.create(req, res);

      // Assert
      expect(userService.createUser).toHaveBeenCalledWith(req.body);
      expect(successResponse).toHaveBeenCalledWith(
        res,
        'User created successfully',
        createdUser
      );
    });

    test('should forward error to handleControllerError if create fails', async () => {
      // Arrange
      const error = new Error('Email already registered');
      userService.createUser.mockRejectedValue(error);

      // Act
      await userController.create(req, res);

      // Assert
      expect(handleControllerError).toHaveBeenCalledWith(res, error, 'Failed to create user');
    });
  });

  // ===========================================================================
  // 2. findAll()
  // ===========================================================================
  describe('findAll()', () => {
    test('should retrieve all users and return successResponse', async () => {
      // Arrange
      const mockUsers = [{ id: 'u-1', name: 'Alice' }, { id: 'u-2', name: 'Bob' }];
      userService.getAllUsers.mockResolvedValue(mockUsers);

      // Act
      await userController.findAll(req, res);

      // Assert
      expect(userService.getAllUsers).toHaveBeenCalledTimes(1);
      expect(successResponse).toHaveBeenCalledWith(
        res,
        'Users retrieved successfully',
        mockUsers
      );
    });
  });

  // ===========================================================================
  // 3. findOne()
  // ===========================================================================
  describe('findOne()', () => {
    test('should retrieve single user by id', async () => {
      // Arrange
      req.params.id = 'u-1';
      const mockUser = { id: 'u-1', name: 'Alice' };
      userService.getUserById.mockResolvedValue(mockUser);

      // Act
      await userController.findOne(req, res);

      // Assert
      expect(userService.getUserById).toHaveBeenCalledWith('u-1');
      expect(successResponse).toHaveBeenCalledWith(
        res,
        'User retrieved successfully',
        mockUser
      );
    });

    test('should return 404 errorResponse when user is not found', async () => {
      // Arrange
      req.params.id = 'missing-id';
      userService.getUserById.mockResolvedValue(null);

      // Act
      await userController.findOne(req, res);

      // Assert
      expect(errorResponse).toHaveBeenCalledWith(res, 'User not found', 404);
    });
  });

  // ===========================================================================
  // 4. login() & googleLogin()
  // ===========================================================================
  describe('login()', () => {
    test('should log in user and return token payload', async () => {
      // Arrange
      req.body = { email: 'john@example.com', password: 'password123' };
      const loginResult = { token: 'jwt-token-xyz', user: { id: 'u-1' } };
      userService.login.mockResolvedValue(loginResult);

      // Act
      await userController.login(req, res);

      // Assert
      expect(userService.login).toHaveBeenCalledWith(req.body);
      expect(successResponse).toHaveBeenCalledWith(
        res,
        'Login successful',
        loginResult
      );
    });
  });

  describe('googleLogin()', () => {
    test('should authenticate google token and return user data', async () => {
      // Arrange
      req.body = { id_token: 'google-id-token' };
      const googleResult = { token: 'app-jwt-token', user: { email: 'googleuser@gmail.com' } };
      userService.googleLogin.mockResolvedValue(googleResult);

      // Act
      await userController.googleLogin(req, res);

      // Assert
      expect(userService.googleLogin).toHaveBeenCalledWith(req.body);
      expect(successResponse).toHaveBeenCalledWith(
        res,
        'Google login successful',
        googleResult
      );
    });
  });

  // ===========================================================================
  // 5. 2FA Methods (verify2FA, setTwoFAPin, disable2FA)
  // ===========================================================================
  describe('2FA Operations', () => {
    test('verify2FA should verify pin and return success', async () => {
      // Arrange
      req.body = { temp_token: 'temp-jwt', pin: '123456' };
      const verifyResult = { token: 'final-jwt', user: { id: 'u-1' } };
      userService.verify2FA.mockResolvedValue(verifyResult);

      // Act
      await userController.verify2FA(req, res);

      // Assert
      expect(userService.verify2FA).toHaveBeenCalledWith('temp-jwt', '123456');
      expect(successResponse).toHaveBeenCalledWith(
        res,
        '2FA verification successful',
        verifyResult
      );
    });

    test('setTwoFAPin should set pin and return confirmation message', async () => {
      // Arrange
      req.params.id = 'u-1';
      req.body = { pin: '654321' };
      const setResult = { message: '2FA PIN set successfully' };
      userService.setTwoFAPin.mockResolvedValue(setResult);

      // Act
      await userController.setTwoFAPin(req, res);

      // Assert
      expect(userService.setTwoFAPin).toHaveBeenCalledWith('u-1', '654321');
      expect(successResponse).toHaveBeenCalledWith(res, setResult.message, setResult);
    });

    test('disable2FA should disable 2FA for user', async () => {
      // Arrange
      req.params.id = 'u-1';
      const disableResult = { message: '2FA disabled successfully' };
      userService.disable2FA.mockResolvedValue(disableResult);

      // Act
      await userController.disable2FA(req, res);

      // Assert
      expect(userService.disable2FA).toHaveBeenCalledWith('u-1');
      expect(successResponse).toHaveBeenCalledWith(res, disableResult.message, disableResult);
    });
  });

  // ===========================================================================
  // 6. refreshToken()
  // ===========================================================================
  describe('refreshToken()', () => {
    test('should return 400 errorResponse if refreshToken is missing in body', async () => {
      // Arrange
      req.body = {};

      // Act
      await userController.refreshToken(req, res);

      // Assert
      expect(errorResponse).toHaveBeenCalledWith(res, 'Refresh token is required');
      expect(userService.refreshToken).not.toHaveBeenCalled();
    });

    test('should exchange refreshToken for new access token', async () => {
      // Arrange
      req.body = { refreshToken: 'valid-refresh-token' };
      const refreshResult = { accessToken: 'new-access-token' };
      userService.refreshToken.mockResolvedValue(refreshResult);

      // Act
      await userController.refreshToken(req, res);

      // Assert
      expect(userService.refreshToken).toHaveBeenCalledWith('valid-refresh-token');
      expect(successResponse).toHaveBeenCalledWith(
        res,
        'Token refreshed successfully',
        refreshResult
      );
    });
  });

  // ===========================================================================
  // 7. getCustomers()
  // ===========================================================================
  describe('getCustomers()', () => {
    test('should retrieve list of customer accounts', async () => {
      // Arrange
      const mockCustomers = [{ id: 'u-1', role: 'customer' }];
      userService.getCustomers.mockResolvedValue(mockCustomers);

      // Act
      await userController.getCustomers(req, res);

      // Assert
      expect(userService.getCustomers).toHaveBeenCalledTimes(1);
      expect(successResponse).toHaveBeenCalledWith(
        res,
        'Customers retrieved successfully',
        mockCustomers
      );
    });
  });
});
