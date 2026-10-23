import { afterAll, beforeAll, describe, expect, it } from "vitest";
import Worker from "../src/models/Worker.js";
import { PASSWORD, PNG, api, auth, createAdmin, createWorker, startDb, stopDb } from "./helpers.js";

let adminToken;
let citizenToken;
let worker;
let complaintId;

beforeAll(async () => {
  await startDb();
  adminToken = await createAdmin("contact-admin@test.local");
  const reg = await api()
    .post("/api/auth/register")
    .send({ fullName: "Priya Sharma", email: "priya@test.local", password: PASSWORD, phone: "+91 98765 43210" });
  citizenToken = reg.body.token;
  worker = await createWorker("crew@test.local", "Roads");
  await Worker.updateOne({ email: "crew@test.local" }, { phone: "+91 90000 11111" });

  const created = await api()
    .post("/api/complaints")
    .set(auth(citizenToken))
    .field("title", "Broken road near market")
    .field("description", "The road surface near the market is broken and cars are swerving.")
    .field("address", "Market Road, Ward 4");
  complaintId = created.body.complaint.id;
});

afterAll(stopDb);

const citizenView = () => api().get(`/api/complaints/${complaintId}`).set(auth(citizenToken));
const workerView = () => api().get(`/api/worker/tasks/${complaintId}`).set(auth(worker.token));

describe("contact sharing between resident and worker", () => {
  it("shares phones in both directions once a worker is assigned", async () => {
    await api().post(`/api/admin/complaints/${complaintId}/assign`).set(auth(adminToken)).send({ workerId: worker.id });

    const asCitizen = (await citizenView()).body.complaint;
    expect(asCitizen.worker).toMatchObject({ name: "Worker crew@test.local", department: "Roads", phone: "+91 90000 11111" });
    expect(asCitizen.worker.email).toBeUndefined();

    const asWorker = (await workerView()).body.complaint;
    expect(asWorker.citizen).toEqual({ name: "Priya Sharma", phone: "+91 98765 43210" });
  });

  it("keeps sharing while work is in progress", async () => {
    await api().post(`/api/worker/tasks/${complaintId}/start`).set(auth(worker.token));
    expect((await workerView()).body.complaint.citizen.phone).toBe("+91 98765 43210");
    expect((await citizenView()).body.complaint.worker.phone).toBe("+91 90000 11111");
  });

  it("hides phones again after completion", async () => {
    await api()
      .post(`/api/worker/tasks/${complaintId}/complete`)
      .set(auth(worker.token))
      .attach("images", PNG, { filename: "done.png", contentType: "image/png" });

    expect((await workerView()).body.complaint.citizen).toEqual({ name: "Priya Sharma" });
    const asCitizen = (await citizenView()).body.complaint;
    expect(asCitizen.worker.phone).toBeUndefined();
    expect(asCitizen.worker.name).toBe("Worker crew@test.local");
  });

  it("never exposes the resident's email to the worker", async () => {
    expect(JSON.stringify((await workerView()).body)).not.toContain("priya@test.local");
  });
});
