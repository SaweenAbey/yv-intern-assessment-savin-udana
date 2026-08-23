import test from 'node:test';
import assert from 'node:assert';
import { checkPermission } from '../middleware/auth.js';

test('checkPermission Middleware Unit Tests', async (t) => {
  
  await t.test('should return 401 when req.user is missing', () => {
    const middleware = checkPermission('application.view');
    const req = {};
    let statusSent = null;
    let jsonSent = null;
    
    const res = {
      status(code) {
        statusSent = code;
        return {
          json(data) {
            jsonSent = data;
          }
        };
      }
    };
    
    let nextCalled = false;
    const next = () => {
      nextCalled = true;
    };
    
    middleware(req, res, next);
    
    assert.strictEqual(statusSent, 401);
    assert.deepStrictEqual(jsonSent, { message: 'Not authorized' });
    assert.strictEqual(nextCalled, false);
  });

  await t.test('should call next() when req.user.userType is CHAIRMAN', () => {
    const middleware = checkPermission('any.permission');
    const req = {
      user: {
        userType: 'CHAIRMAN'
      }
    };
    const res = {};
    let nextCalled = false;
    const next = () => {
      nextCalled = true;
    };
    
    middleware(req, res, next);
    
    assert.strictEqual(nextCalled, true);
  });

  await t.test('should call next() when req.user.userType is OFFICER and has the permission', () => {
    const middleware = checkPermission('application.view');
    const req = {
      user: {
        userType: 'OFFICER',
        officerRoleId: {
          permissions: ['application.view', 'member.view']
        }
      }
    };
    const res = {};
    let nextCalled = false;
    const next = () => {
      nextCalled = true;
    };
    
    middleware(req, res, next);
    
    assert.strictEqual(nextCalled, true);
  });

  await t.test('should return 403 when req.user.userType is OFFICER and is missing the permission', () => {
    const middleware = checkPermission('application.approve');
    const req = {
      user: {
        userType: 'OFFICER',
        officerRoleId: {
          permissions: ['application.view', 'member.view']
        }
      }
    };
    let statusSent = null;
    let jsonSent = null;
    const res = {
      status(code) {
        statusSent = code;
        return {
          json(data) {
            jsonSent = data;
          }
        };
      }
    };
    let nextCalled = false;
    const next = () => {
      nextCalled = true;
    };
    
    middleware(req, res, next);
    
    assert.strictEqual(statusSent, 403);
    assert.match(jsonSent.message, /Access denied: missing required permission/);
    assert.strictEqual(nextCalled, false);
  });

  await t.test('should return 403 when req.user.userType is MEMBER', () => {
    const middleware = checkPermission('application.view');
    const req = {
      user: {
        userType: 'MEMBER'
      }
    };
    let statusSent = null;
    let jsonSent = null;
    const res = {
      status(code) {
        statusSent = code;
        return {
          json(data) {
            jsonSent = data;
          }
        };
      }
    };
    let nextCalled = false;
    const next = () => {
      nextCalled = true;
    };
    
    middleware(req, res, next);
    
    assert.strictEqual(statusSent, 403);
    assert.match(jsonSent.message, /Access denied: missing required permission/);
    assert.strictEqual(nextCalled, false);
  });

});
