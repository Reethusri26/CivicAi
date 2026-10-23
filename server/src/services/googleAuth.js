import { OAuth2Client } from "google-auth-library";
import env from "../config/env.js";

let client;

let verifier = async (idToken) => {
  client ||= new OAuth2Client(env.googleClientId);
  // Checks Google's signature, that the token was issued for our client ID,
  // the issuer and the expiry.
  const ticket = await client.verifyIdToken({ idToken, audience: env.googleClientId });
  return ticket.getPayload();
};

export const verifyGoogleToken = (idToken) => verifier(idToken);

// Test hook: replace the verifier with a fake.
export const setGoogleVerifier = (fn) => {
  verifier = fn;
};
