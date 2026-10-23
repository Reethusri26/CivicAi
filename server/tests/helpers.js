import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";
import request from "supertest";
import app from "../src/app.js";
import Admin from "../src/models/Admin.js";
import Worker from "../src/models/Worker.js";
import { hashPassword } from "../src/controllers/authController.js";
import { ensureDefaultDepartments } from "../src/services/departmentService.js";

let mongo;

export const api = () => request(app);

export const startDb = async () => {
  mongo = await MongoMemoryServer.create();
  await mongoose.connect(mongo.getUri("civicai-test"));
  await mongoose.connection.syncIndexes();
  await ensureDefaultDepartments();
};

export const stopDb = async () => {
  await mongoose.disconnect();
  await mongo?.stop();
};

// Smallest valid PNG (1x1 transparent pixel).
export const PNG = Buffer.from(
  "89504e470d0a1a0a0000000d4948445200000001000000010806000000" +
    "1f15c4890000000d49444154789c6360000002000154a24f5d0000000049454e44ae426082",
  "hex"
);

export const PASSWORD = "Str0ng-pass-word";

export const createAdmin = async (email = "ops@test.local") => {
  await Admin.create({ name: "Ops Admin", email, password: await hashPassword(PASSWORD) });
  const res = await api().post("/api/auth/login").send({ email, password: PASSWORD, role: "admin" });
  return res.body.token;
};

export const createWorker = async (email, department = "Roads") => {
  const worker = await Worker.create({ name: `Worker ${email}`, email, department, password: await hashPassword(PASSWORD) });
  const res = await api().post("/api/auth/login").send({ email, password: PASSWORD, role: "worker" });
  return { id: String(worker._id), token: res.body.token };
};

export const registerCitizen = async (email, fullName = "Test Citizen") => {
  const res = await api().post("/api/auth/register").send({ fullName, email, password: PASSWORD });
  return { id: res.body.user.id, token: res.body.token };
};

export const auth = (token) => ({ Authorization: `Bearer ${token}` });
