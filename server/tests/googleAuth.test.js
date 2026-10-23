import jwt from "jsonwebtoken";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import env from "../src/config/env.js";
import { setGoogleVerifier } from "../src/services/googleAuth.js";
import { PASSWORD, api, auth, registerCitizen, startDb, stopDb } from "./helpers.js";

// Fake Google: the "credential" string encodes the payload we want back.
const fakeCredential = (payload) => Buffer.from(JSON.stringify(payload)).toString("base64url");

beforeAll(async () => {
  await startDb();
  env.googleClientId = "test-client.apps.googleusercontent.com";
  setGoogleVerifier(async (token) => {
    if (token === "x".repeat(30)) throw new Error("bad signature");
    return JSON.parse(Buffer.from(token, "base64url").toString());
  });
});

afterAll(stopDb);

const google = (payload, extra = {}) => api().post("/api/auth/google").send({ credential: fakeCredential(payload), ...extra });

describe("Google sign-in", () => {
  it("reports whether Google is enabled", async () => {
    const res = await api().get("/api/auth/config");
    expect(res.body.googleEnabled).toBe(true);
  });

  it("creates a citizen account for a new verified Google user", async () => {
    const res = await google({ sub: "g-111", email: "Anita@Example.com", email_verified: true, name: "Anita Rao" });
    expect(res.status).toBe(201);
    expect(res.body.user).toMatchObject({ role: "citizen", name: "Anita Rao", email: "anita@example.com", hasPassword: false });
    expect(JSON.stringify(res.body)).not.toMatch(/\$2[aby]\$/);

    const me = await api().get("/api/auth/me").set(auth(res.body.token));
    expect(me.status).toBe(200);
  });

  it("signs the same Google user back in without duplicating", async () => {
    const res = await google({ sub: "g-111", email: "anita@example.com", email_verified: true, name: "Anita Rao" });
    expect(res.status).toBe(200);
    expect(res.body.message).toMatch(/Signed in/);
  });

  it("links Google to an existing password account with the same verified email", async () => {
    await registerCitizen("ravi@example.com", "Ravi");
    const res = await google({ sub: "g-222", email: "ravi@example.com", email_verified: true, name: "Ravi G" });
    expect(res.status).toBe(200);
    expect(res.body.user.signInMethods).toEqual(["password", "google"]);
    // Password login still works afterwards.
    const pw = await api().post("/api/auth/login").send({ email: "ravi@example.com", password: PASSWORD });
    expect(pw.status).toBe(200);
  });

  it("rejects unverified Google emails", async () => {
    const res = await google({ sub: "g-333", email: "unverified@example.com", email_verified: false });
    expect(res.status).toBe(401);
  });

  it("rejects tokens Google cannot verify", async () => {
    const res = await api().post("/api/auth/google").send({ credential: "x".repeat(30) });
    expect(res.status).toBe(401);
  });

  it("lets a Google-only account set its first password without a current password", async () => {
    const signIn = await google({ sub: "g-111", email: "anita@example.com", email_verified: true });
    const set = await api()
      .post("/api/auth/change-password")
      .set(auth(signIn.body.token))
      .send({ newPassword: "Brand-new-pass-1" });
    expect(set.status).toBe(200);
    expect(set.body.user.hasPassword).toBe(true);

    const login = await api().post("/api/auth/login").send({ email: "anita@example.com", password: "Brand-new-pass-1" });
    expect(login.status).toBe(200);

    // From now on the current password is required.
    const again = await api().post("/api/auth/change-password").set(auth(login.body.token)).send({ newPassword: "Another-pass-2" });
    expect(again.status).toBe(400);
  });

  it("is disabled when no client ID is configured", async () => {
    const saved = env.googleClientId;
    env.googleClientId = "";
    const res = await google({ sub: "g-9", email: "x@example.com", email_verified: true });
    env.googleClientId = saved;
    expect(res.status).toBe(503);
  });
});

describe("Keep me signed in", () => {
  const lifetimeDays = (token) => {
    const { iat, exp } = jwt.decode(token);
    return (exp - iat) / 86400;
  };

  it("issues a 1-day token by default and a 30-day token when remembered", async () => {
    await registerCitizen("remember@example.com");
    const short = await api().post("/api/auth/login").send({ email: "remember@example.com", password: PASSWORD });
    const long = await api().post("/api/auth/login").send({ email: "remember@example.com", password: PASSWORD, remember: true });
    expect(lifetimeDays(short.body.token)).toBe(1);
    expect(lifetimeDays(long.body.token)).toBe(30);
    expect(long.body.remember).toBe(true);
  });

  it("applies to Google sign-in too", async () => {
    const res = await google({ sub: "g-111", email: "anita@example.com", email_verified: true }, { remember: true });
    expect(lifetimeDays(res.body.token)).toBe(30);
  });
});
