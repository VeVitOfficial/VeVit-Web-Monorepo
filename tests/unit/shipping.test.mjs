import test from "node:test";
import assert from "node:assert/strict";
import {
  FREE_SHIPPING_THRESHOLD_MINOR,
  SHIPPING_PRICES_MINOR,
  missingForFreeShippingMinor,
  shippingMinor,
} from "../../src/lib/checkout/shipping.ts";

test("shipping rules", () => {
  assert.equal(shippingMinor({ method: null, hasPhysical: false, subtotalMinor: 50000, freePerk: false }), 0);
  assert.equal(shippingMinor({ method: "packeta_pickup", hasPhysical: true, subtotalMinor: 99900, freePerk: false }), 6900);
  assert.equal(shippingMinor({ method: "address", hasPhysical: true, subtotalMinor: 99900, freePerk: false }), 9900);
  assert.equal(shippingMinor({ method: "address", hasPhysical: true, subtotalMinor: 100000, freePerk: false }), 0);
  assert.equal(shippingMinor({ method: "packeta_pickup", hasPhysical: true, subtotalMinor: 100, freePerk: true }), 0);
  assert.equal(missingForFreeShippingMinor(69000), 31000);
  assert.equal(missingForFreeShippingMinor(150000), 0);
});

test("physical goods need a delivery method", () => {
  assert.throws(
    () => shippingMinor({ method: null, hasPhysical: true, subtotalMinor: 1000, freePerk: false }),
    { message: "delivery_method_required" },
  );
});

test("digital-only carts ship free whatever method is sent", () => {
  assert.equal(shippingMinor({ method: "address", hasPhysical: false, subtotalMinor: 1000, freePerk: false }), 0);
});

test("constants match the spec", () => {
  assert.deepEqual({ ...SHIPPING_PRICES_MINOR }, { packeta_pickup: 6900, address: 9900 });
  assert.equal(FREE_SHIPPING_THRESHOLD_MINOR, 100000);
});
