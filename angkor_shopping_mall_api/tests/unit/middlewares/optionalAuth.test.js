const optionalAuth = require('../../../src/middlewares/optionalAuth');
const jwtUtil = require('../../../src/utils/jwt');

/**
 * Unit Test following the Lesson:
 * "Software Testing: Unit Test with Jest in NodeJS"
 *
 * Core Concepts:
 * 1. AAA Pattern (Arrange · Act · Assert)
 * 2. Matchers: toBe, toEqual, toBeUndefined
 * 3. Test Doubles:
 *    - Stub: mockReturnValue feeding decoded token
 *    - Spy: jest.spyOn
 *    - Dummy: req/res objects
 */

jest.mock('../../../src/utils/jwt', () => ({
  verifyAccessToken: jest.fn()
}));

describe('Optional Auth Middleware (src/middlewares/optionalAuth.js)', () => {
  let req;
  let res;
  let next;

  beforeEach(() => {
    jest.clearAllMocks();
    req = { headers: {} };
    res = {};
    next = jest.fn();
  });

  test('should call next() and leave req.user undefined when no authorization header is provided', () => {
    // Arrange
    req.headers = {};

    // Act
    optionalAuth(req, res, next);

    // Assert
    expect(req.user).toBeUndefined();
    expect(next).toHaveBeenCalledTimes(1);
  });

  test('should call next() and leave req.user undefined when authorization header does not start with Bearer', () => {
    // Arrange
    req.headers.authorization = 'Basic dXNlcjpwYXNz';

    // Act
    optionalAuth(req, res, next);

    // Assert
    expect(req.user).toBeUndefined();
    expect(next).toHaveBeenCalledTimes(1);
    expect(jwtUtil.verifyAccessToken).not.toHaveBeenCalled();
  });

  test('should populate req.user and call next() when valid Bearer token is provided', () => {
    // Arrange
    req.headers.authorization = 'Bearer valid-jwt-token';
    const mockUser = { id: 'user-uuid-123', email: 'user@example.com', role: 'customer' };
    jwtUtil.verifyAccessToken.mockReturnValue(mockUser);

    // Act
    optionalAuth(req, res, next);

    // Assert
    expect(jwtUtil.verifyAccessToken).toHaveBeenCalledWith('valid-jwt-token');
    expect(req.user).toEqual(mockUser);
    expect(next).toHaveBeenCalledTimes(1);
  });

  test('should silently catch token verification errors and call next() with req.user undefined', () => {
    // Arrange
    req.headers.authorization = 'Bearer expired-or-invalid-token';
    jwtUtil.verifyAccessToken.mockImplementation(() => {
      throw new Error('jwt expired');
    });

    // Act
    optionalAuth(req, res, next);

    // Assert
    expect(jwtUtil.verifyAccessToken).toHaveBeenCalledWith('expired-or-invalid-token');
    expect(req.user).toBeUndefined();
    expect(next).toHaveBeenCalledTimes(1);
  });
});
