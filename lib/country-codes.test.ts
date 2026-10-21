import test from "node:test";
import assert from "node:assert/strict";
import { COUNTRIES, DEFAULT_DIAL, joinPhone } from "./country-codes.ts";

test("India is first and the default", () => {
  assert.equal(COUNTRIES[0].name, "India");
  assert.equal(COUNTRIES[0].dial, DEFAULT_DIAL);
});

test("every dial code is + and 1 to 7 digits", () => {
  for (const c of COUNTRIES) assert.match(c.dial, /^\+[1-9]\d{0,6}$/, c.name);
});

test("joins the picked code and the typed number", () => {
  assert.equal(joinPhone("+91", "98765 43210"), "+919876543210");
  assert.equal(joinPhone("+44", "(07911) 123-456"), "+447911123456");
});

test("a number typed with its own plus is kept", () => {
  assert.equal(joinPhone("+91", "+1 415 555 0100"), "+14155550100");
});
