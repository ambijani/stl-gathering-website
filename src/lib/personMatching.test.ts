import { test } from "node:test";
import assert from "node:assert/strict";
import { normalizePhone, buildExactNameRegex } from "./personMatching";

test("normalizePhone strips non-digit characters", () => {
  assert.equal(normalizePhone("(314) 555-0123"), "3145550123");
});

test("normalizePhone drops a leading US country code (11 digits starting with 1)", () => {
  assert.equal(normalizePhone("13145550123"), "3145550123");
});

test("normalizePhone leaves a bare 10-digit number unchanged", () => {
  assert.equal(normalizePhone("3145550123"), "3145550123");
});

test("normalizePhone returns empty string for empty input", () => {
  assert.equal(normalizePhone(""), "");
});

test("buildExactNameRegex matches the exact name case-insensitively", () => {
  const re = buildExactNameRegex("Ahmed Khan");
  assert.ok(re.test("ahmed khan"));
  assert.ok(re.test("AHMED KHAN"));
});

test("buildExactNameRegex does not match a substring of a longer name", () => {
  const re = buildExactNameRegex("Ahmed");
  assert.equal(re.test("Ahmed Khan"), false);
});

test("buildExactNameRegex escapes regex special characters in the name", () => {
  const re = buildExactNameRegex("O'Brien (Jr.)");
  assert.ok(re.test("o'brien (jr.)"));
  assert.equal(re.test("OXBrien XJrX"), false);
});
