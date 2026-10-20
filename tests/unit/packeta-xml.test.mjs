import test from "node:test";
import assert from "node:assert/strict";
import { buildCreatePacketXml, formatWeightKg, minorToCzk, parseCreatePacketResponse, splitRecipientName } from "../../src/lib/checkout/packeta-xml.ts";

const INPUT = {
  apiPassword: "secretpassword0123456789abcdef01",
  number: "VVS-261021-AB12CD34",
  name: "Jan",
  surname: "Novák",
  email: "jan@novak.cz",
  phone: "+420777123456",
  addressId: "12345",
  valueCzk: "1480.00",
  weightKg: "1.500",
  eshop: "VeVit Store",
};

test("create packet request has the documented shape", () => {
  const xml = buildCreatePacketXml(INPUT);
  assert.ok(xml.startsWith("<createPacket>"));
  for (const part of [
    "<apiPassword>secretpassword0123456789abcdef01</apiPassword>",
    "<number>VVS-261021-AB12CD34</number>",
    "<name>Jan</name>",
    "<surname>Novák</surname>",
    "<email>jan@novak.cz</email>",
    "<phone>+420777123456</phone>",
    "<addressId>12345</addressId>",
    "<value>1480.00</value>",
    "<currency>CZK</currency>",
    "<weight>1.500</weight>",
    "<eshop>VeVit Store</eshop>",
  ]) assert.ok(xml.includes(part), part);
  assert.ok(!xml.includes("<cod>"), "prepaid orders carry no cash on delivery");
});

test("text is escaped in the XML", () => {
  const xml = buildCreatePacketXml({ ...INPUT, name: "A&B <x>", eshop: "\"Shop\" 'one'" });
  assert.ok(xml.includes("<name>A&amp;B &lt;x&gt;</name>"));
  assert.ok(xml.includes("<eshop>&quot;Shop&quot; &apos;one&apos;</eshop>"));
  assert.ok(!xml.includes("<x>"));
});

test("successful response", () => {
  const xml = "<response><status>ok</status><result><id>4154090000</id><barcode>Z4154090000</barcode><barcodeText>Z 415 4090 000</barcodeText></result></response>";
  assert.deepEqual(parseCreatePacketResponse(xml), { ok: true, id: "4154090000", barcode: "Z4154090000" });
});

test("fault response keeps the reason and the field", () => {
  const xml = "<response><status>fault</status><fault>PacketAttributesFault</fault><string>Packet attributes are invalid.</string><detail><attributes><fault><name>addressId</name><fault>Pickup point does not exist.</fault></fault></attributes></detail></response>";
  const parsed = parseCreatePacketResponse(xml);
  assert.equal(parsed.ok, false);
  assert.match(parsed.fault, /PacketAttributesFault/);
  assert.match(parsed.fault, /addressId/);
  assert.match(parsed.fault, /Pickup point does not exist/);
});

test("password fault and garbage", () => {
  const wrongPassword = parseCreatePacketResponse("<response><status>fault</status><fault>IncorrectApiPasswordFault</fault><string>Incorrect API password.</string></response>");
  assert.equal(wrongPassword.ok, false);
  assert.match(wrongPassword.fault, /IncorrectApiPasswordFault/);
  assert.deepEqual(parseCreatePacketResponse("<html>502</html>"), { ok: false, fault: "invalid_response" });
  assert.deepEqual(parseCreatePacketResponse("<response><status>ok</status><result></result></response>"), { ok: false, fault: "invalid_response" });
});

test("recipient name is split and made acceptable for Packeta", () => {
  assert.deepEqual(splitRecipientName("Jan Novák"), { name: "Jan", surname: "Novák" });
  assert.deepEqual(splitRecipientName("Jana Marie Svobodová"), { name: "Jana Marie", surname: "Svobodová" });
  assert.deepEqual(splitRecipientName("Madonna"), { name: "Madonna", surname: "Madonna" });
  assert.deepEqual(splitRecipientName("  Jan   <Novák>  "), { name: "Jan", surname: "Novák" });
  assert.equal(splitRecipientName("A".repeat(40) + " " + "B".repeat(40)).name.length, 32);
  assert.equal(splitRecipientName("A".repeat(40) + " " + "B".repeat(40)).surname.length, 32);
});

test("weight and value formats", () => {
  assert.equal(formatWeightKg(1500), "1.500");
  assert.equal(formatWeightKg(500), "0.500");
  assert.equal(formatWeightKg(0), "0.100");
  assert.equal(minorToCzk(148000), "1480.00");
  assert.equal(minorToCzk(6905), "69.05");
});
