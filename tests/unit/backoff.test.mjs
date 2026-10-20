import test from "node:test";
import assert from "node:assert/strict";
import { nextRunDelaySeconds } from "../../src/lib/jobs/backoff.ts";

test("retry delays grow and then give up", () => {
  assert.equal(nextRunDelaySeconds(0), 60);
  assert.equal(nextRunDelaySeconds(1), 300);
  assert.equal(nextRunDelaySeconds(2), 900);
  assert.equal(nextRunDelaySeconds(3), 3600);
  assert.equal(nextRunDelaySeconds(4), 21600);
  assert.equal(nextRunDelaySeconds(5), null);
  assert.equal(nextRunDelaySeconds(40), null);
});

test("nonsense attempt counts are treated as exhausted", () => {
  assert.equal(nextRunDelaySeconds(-1), null);
  assert.equal(nextRunDelaySeconds(Number.NaN), null);
});
