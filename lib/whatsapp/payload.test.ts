import { test } from "node:test";
import assert from "node:assert/strict";
import { describeError, templatePayload, textPayload } from "./payload.ts";

test("text message goes to digits only, never with a plus", () => {
  const p = textPayload("+919876543210", "Hello");
  assert.equal(p.to, "919876543210");
  assert.equal(p.type, "text");
  assert.equal(p.text.body, "Hello");
});

test("template message carries the template name, language and ordered values", () => {
  const p = templatePayload("+919876543210", "order_shipped", "en", ["Asha", "ORD-1001", "Delhivery"]);
  assert.equal(p.template.name, "order_shipped");
  assert.equal(p.template.language.code, "en");
  const comp = (p.template as { components?: { type: string; parameters: { text: string }[] }[] }).components!;
  assert.deepEqual(comp[0].parameters.map((x) => x.text), ["Asha", "ORD-1001", "Delhivery"]);
});

test("a template with no values has no components", () => {
  const p = templatePayload("919876543210", "hello", "en", []);
  assert.equal("components" in p.template, false);
});

test("error descriptions are short and keep Meta's reason", () => {
  const d = describeError(400, { error: { message: "(#131030) Recipient phone number not in allowed list", code: 131030 } });
  assert.match(d, /HTTP 400/);
  assert.match(d, /131030/);
  assert.ok(d.length <= 400);
  assert.equal(describeError(500, null), "HTTP 500");
});
