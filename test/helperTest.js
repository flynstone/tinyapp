const { assert } = require('chai');

const bcryptjs = require('bcryptjs');

const { getUserByEmail, generateRandomString } = require('../helpers.js');

const testUsers = {
  "testUserId": {
    id: "testUserId",
    email: "user@test.com",
    password: bcryptjs.hashSync("purple-monkey-dinosaur", 10) // purple-monkey-dinosaur
  },
  "userTestId": {
    id: "userTestId",
    email: "test@user.com",
    password: bcryptjs.hashSync("dishwasher-funk", 10) // dishwasher-funk
  }
}+

describe('getUserByEmail', function() {
  it('should return undefined if an invalid email is entered', function () {
    const user = getUserByEmail("fake@error.com", testUsers);
    const expectedOutput = undefined;
    assert.deepEqual(expectedOutput, user);
  });
});

describe("generateRandomString", function () {
  it('should return a string', function () {
    const actual = typeof generateRandomString();
    const expected = "string";
    assert.strictEqual(actual, expected);
  });

  it('should return false between two random strings', function () {
    const actual = generateRandomString(5) === generateRandomString(5);
    const expected = false;
    assert.strictEqual(actual, expected);
  });
})
