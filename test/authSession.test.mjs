import test from "node:test";
import assert from "node:assert/strict";
import { createAuthSession } from "../src/lib/authSession.js";

test("OAuth code is removed from URL and exchanged once across concurrent initialization", async () => {
  let calls = 0;
  let time = 1000;
  const values = new Map();
  const location = { hash: "#code=one-use&role=admin", pathname: "/dashboard", search: "" };
  const session = createAuthSession({
    storage: { getItem: (k) => values.get(k), setItem: (k,v) => values.set(k,v), removeItem: (k) => values.delete(k) },
    location,
    history: { replaceState: (_, __, url) => { assert.equal(url, "/dashboard"); location.hash = ""; } },
    now: () => time,
    exchange: async (code) => { calls++; assert.equal(code, "one-use"); return { access_token: "test-token", expires_in: 10 }; },
  });
  await Promise.all([session.initialize(), session.initialize()]);
  assert.equal(calls, 1);
  assert.equal(session.token(), "test-token");
  time = 11000;
  assert.equal(session.token(), null);
  assert.equal(values.size, 0);
});

test("login works in memory when browser storage is blocked, and logout clears the token", async () => {
  const denied = () => { throw new Error("storage blocked"); };
  const session = createAuthSession({
    storage: { getItem: denied, setItem: denied, removeItem: denied },
    location: { hash: "#code=test", pathname: "/dashboard", search: "" },
    history: { replaceState() {} },
    exchange: async () => ({ access_token: "test-token", expires_in: 900 }),
  });
  await session.initialize();
  assert.equal(session.token(), "test-token");
  session.clear();
  assert.equal(session.token(), null);
});
