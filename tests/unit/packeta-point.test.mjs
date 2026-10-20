import test from "node:test";
import assert from "node:assert/strict";
import {
  buildValidationRequest,
  PACKETA_VENDORS,
  parseValidationResponse,
  pointFromWidget,
} from "../../src/lib/checkout/packeta-point.ts";

const RAW = { id: "12345", name: "Albert Letná", street: "Čechova 11", city: "Praha 7", zip: "170 00", country: "cz", pickupPointType: "internal", group: "" };

test("pointFromWidget maps the widget point", () => {
  assert.deepEqual(pointFromWidget(RAW), {
    id: "12345", name: "Albert Letná", street: "Čechova 11", city: "Praha 7", zip: "17000", country: "CZ", kind: "pickup",
  });
  assert.equal(pointFromWidget({ ...RAW, id: 777, country: "sk", zip: "811 01" })?.country, "SK");
});

test("pointFromWidget detects Z-BOX", () => {
  assert.equal(pointFromWidget({ ...RAW, group: "zbox" })?.kind, "zbox");
  assert.equal(pointFromWidget({ ...RAW, group: "", name: "Z-BOX Praha 7" })?.kind, "zbox");
});

test("pointFromWidget rejects unusable points", () => {
  assert.equal(pointFromWidget({ ...RAW, id: undefined }), null);
  assert.equal(pointFromWidget({ ...RAW, id: "12a" }), null);
  assert.equal(pointFromWidget({ ...RAW, country: "pl" }), null);
  assert.equal(pointFromWidget({ ...RAW, pickupPointType: "external", carrierId: "5", carrierPickupPointId: "x" }), null);
  assert.equal(pointFromWidget({ ...RAW, error: "full" }), null);
  assert.equal(pointFromWidget(null), null);
  assert.equal(pointFromWidget("point"), null);
});

test("validation request sends only the id and the allowed vendors", () => {
  const body = buildValidationRequest("12345", "key16charsabcdef");
  assert.deepEqual(body.point, { id: "12345" });
  assert.equal(body.apiKey, "key16charsabcdef");
  assert.deepEqual(body.options.vendors, PACKETA_VENDORS);
  assert.equal(body.options.carriers, "packeta");
  assert.equal(body.options.country, "cz,sk");
});

test("validation response: valid point is rebuilt from the Packeta answer", () => {
  const result = parseValidationResponse("777", {
    isValid: true,
    point: { name: "Z-BOX", address: { street: "Českomoravská 2408", city: "Praha ", zip: "190 00", country: "cz" }, group: "zbox" },
    errors: [],
  });
  assert.deepEqual(result, {
    status: "valid",
    point: { id: "777", name: "Z-BOX", street: "Českomoravská 2408", city: "Praha", zip: "19000", country: "CZ", kind: "zbox" },
  });
});

test("validation response: invalid and unusable answers", () => {
  assert.deepEqual(parseValidationResponse("1", { isValid: false, errors: [{ code: "NotFound" }] }), { status: "invalid" });
  assert.deepEqual(parseValidationResponse("1", { isValid: false, errors: [{ code: "PickupPointIsFull" }] }), { status: "invalid" });
  assert.deepEqual(parseValidationResponse("1", { isValid: true, point: { name: "x", address: { country: "pl" } } }), { status: "unknown" });
  assert.deepEqual(parseValidationResponse("1", "garbage"), { status: "unknown" });
  assert.deepEqual(parseValidationResponse("1", {}), { status: "unknown" });
});
