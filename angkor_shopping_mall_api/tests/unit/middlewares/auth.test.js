const auth = require('../../../src/middlewares/auth');
const jwt = require('jsonwebtoken');
const jwtUtil = require('../../../src/utils/jwt');

/**
 * Unit Test following the Lesson:
 * "Software Testing: Unit Test with Jest in NodeJS"
 *
 * Core Concepts from the Lesson:
 * 1. AAA Pattern (Arrange · Act · Assert)
 * 2. Matchers (toBe, toEqual, toHaveBeenCalledTimes, toHaveBeenCalledWith)
 * 3. Test Doubles:
 *    - Stub: Provides canned/fixed data in (mockReturnValue)
 *    - Mock: Checks usage/behavior (toHaveBeenCalledTimes, toHaveBeenCalledWith)
 *    - Spy: Observes real execution in place (jest.spyOn + mockRestore)
 *    - Dummy: Fills an unused parameter slot ({})
 */

describe('Auth Middleware (src/middlewares/auth.js)', () => {
  let req;
  let res;
  let next;

  beforeEach(() => {
    // Arrange: fresh request, response mocks, and next function before each test
    req = {
      headers: {}
    };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis()
    };
    next = jest.fn();
  });

  afterEach(() => {
    jest.clearAllMocks();
    jest.restoreAllMocks();
  });

  // ---------------------------------------------------------------------------
  // 1. Missing Authorization Header
  // ---------------------------------------------------------------------------
  test('should return 401 if authorization header is missing', () => {
    // Arrange
    req.headers = {};

    // Act
    auth(req, res, next);

    // Assert
    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      message: 'Authorization token required'
    });
    expect(next).not.toHaveBeenCalled();
  });

  // ---------------------------------------------------------------------------
  // 2. Non-Bearer Authorization Header
  // ---------------------------------------------------------------------------
  test('should return 401 if authorization header does not use Bearer format', () => {
    // Arrange
    req.headers.authorization = 'Basic dXNlcjpwYXNz';

    // Act
    auth(req, res, next);

    // Assert
    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      message: 'Authorization token required'
    });
    expect(next).not.toHaveBeenCalled();
  });

  // ---------------------------------------------------------------------------
  // 3. Invalid or Expired Token
  // ---------------------------------------------------------------------------
  test('should return 401 if token is invalid or expired', () => {
    // Arrange
    req.headers.authorization = 'Bearer invalid.tampered.token';

    // Act
    auth(req, res, next);

    // Assert
    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      message: 'Invalid or expired authorization token'
    });
    expect(next).not.toHaveBeenCalled();
  });

  // ---------------------------------------------------------------------------
  // 4. STUB: Feed fixed data in, no real crypto runs
  // ---------------------------------------------------------------------------
  test('STUB — returns stubbed user payload without running real crypto', () => {
    // Arrange: STUB jsonwebtoken.verify to return fixed data
    const stubbedUser = { id: 10, email: 'student@example.com', roles: ['User'] };
    const stub = jest.spyOn(jwt, 'verify').mockReturnValue(stubbedUser);

    req.headers.authorization = 'Bearer fake-token-abc123';

    // Act
    auth(req, res, next);

    // Assert
    expect(req.user).toEqual(stubbedUser);
    expect(next).toHaveBeenCalledTimes(1);

    // Cleanup
    stub.mockRestore();
  });

  // ---------------------------------------------------------------------------
  // 5. MOCK: Verify HOW a dependency was called (behavior / usage verification)
  // ---------------------------------------------------------------------------
  test('MOCK — verify is called once with only the extracted token', () => {
    // Arrange: MOCK jwt.verify to track how auth middleware calls it
    const token = 'sample.jwt.token';
    const mockUser = { id: 1, email: 'admin@example.com' };
    const mockVerify = jest.spyOn(jwt, 'verify').mockReturnValue(mockUser);

    req.headers.authorization = `Bearer ${token}`;

    // Act
    auth(req, res, next);

    // Assert: check usage (called times, called with)
    expect(mockVerify).toHaveBeenCalledTimes(1);
    expect(mockVerify).toHaveBeenCalledWith(token, expect.any(String));
    expect(next).toHaveBeenCalledTimes(1);

    // Cleanup
    mockVerify.mockRestore();
  });

  // ---------------------------------------------------------------------------
  // 6. SPY: Wrap real function, observe calls, let real crypto run
  // ---------------------------------------------------------------------------
  test('SPY — the real jsonwebtoken.verify runs, and we observe it was called', () => {
    // Arrange: generate a real JWT token
    const realUser = { id: 1, email: 'student@example.com', roles: ['Student'] };
    const realToken = jwtUtil.generateAccessToken(realUser);

    // SPY on real jsonwebtoken.verify (behaviour is NOT replaced, it still runs)
    const spy = jest.spyOn(jwt, 'verify');

    req.headers.authorization = `Bearer ${realToken}`;

    // Act
    auth(req, res, next);

    // Assert: observe real execution
    expect(spy).toHaveBeenCalledTimes(1);
    expect(req.user.id).toBe(realUser.id);
    expect(req.user.email).toBe(realUser.email);
    expect(next).toHaveBeenCalledTimes(1);

    // Cleanup: restore original
    spy.mockRestore();
  });

  // ---------------------------------------------------------------------------
  // 7. DUMMY: Passed only to fill parameter slot, never used
  // ---------------------------------------------------------------------------
  test('DUMMY — runs next() when valid, using {} as dummy res', () => {
    // Arrange
    const realUser = { id: 99, email: 'dummy@example.com' };
    const validToken = jwtUtil.generateAccessToken(realUser);

    const dummyReq = { headers: { authorization: `Bearer ${validToken}` } };
    const dummyRes = {}; // DUMMY: res is never used because next() is called
    const nextFn = jest.fn();

    // Act
    auth(dummyReq, dummyRes, nextFn);

    // Assert
    expect(nextFn).toHaveBeenCalledTimes(1);
    expect(dummyReq.user.id).toBe(99);
  });
});
