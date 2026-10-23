import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { PASSWORD, PNG, api, auth, createAdmin, createWorker, registerCitizen, startDb, stopDb } from "./helpers.js";

let adminToken;
let citizen;
let otherCitizen;
let roadsWorker;
let otherWorker;
let complaintId;
let reference;

beforeAll(async () => {
  await startDb();
  adminToken = await createAdmin();
  citizen = await registerCitizen("citizen@test.local");
  otherCitizen = await registerCitizen("other@test.local", "Other Person");
  roadsWorker = await createWorker("roads@test.local", "Roads");
  otherWorker = await createWorker("water@test.local", "Water");
});

afterAll(stopDb);

describe("complete complaint lifecycle", () => {
  it("citizen submits a complaint with multiple images and gets a reference", async () => {
    const res = await api()
      .post("/api/complaints")
      .set(auth(citizen.token))
      .set("Idempotency-Key", "submit-1")
      .field("title", "Deep pothole near bus stop")
      .field("description", "There is a deep pothole on Main Road near the bus stop. Dangerous for bikes at night.")
      .field("address", "Main Road, Ward 12, near City Bus Stop")
      .field("latitude", "17.385")
      .field("longitude", "78.4867")
      .attach("images", PNG, { filename: "one.png", contentType: "image/png" })
      .attach("images", PNG, { filename: "two.png", contentType: "image/png" });

    expect(res.status).toBe(201);
    const c = res.body.complaint;
    expect(c.reference).toMatch(/^CIV-\d{6}-[A-Z0-9]{6}$/);
    expect(c.images).toHaveLength(2);
    expect(c.category).toBe("Pothole");
    expect(c.priority).toBe("High");
    expect(c.department).toBe("Roads");
    // Gemini is not configured in tests, so the fallback must be labelled.
    expect(c.ai.source).toBe("rules");
    expect(c.ai.confidence).toBeNull();
    expect(c.ai.fallbackReason).toMatch(/not configured/);
    expect(c.timeline.map((t) => t.event)).toEqual(["submitted"]);
    complaintId = c.id;
    reference = c.reference;
  });

  it("a retried submission with the same idempotency key does not duplicate", async () => {
    const res = await api()
      .post("/api/complaints")
      .set(auth(citizen.token))
      .set("Idempotency-Key", "submit-1")
      .field("title", "Deep pothole near bus stop")
      .field("description", "There is a deep pothole on Main Road near the bus stop. Dangerous for bikes at night.")
      .field("address", "Main Road, Ward 12, near City Bus Stop");
    expect(res.status).toBe(200);
    expect(res.body.duplicate).toBe(true);
    expect(res.body.complaint.id).toBe(complaintId);

    const list = await api().get("/api/complaints").set(auth(citizen.token));
    expect(list.body.pagination.total).toBe(1);
  });

  it("evidence images are served only through signed URLs", async () => {
    const detail = await api().get(`/api/complaints/${complaintId}`).set(auth(citizen.token));
    const url = detail.body.complaint.images[0].url;
    const ok = await api().get(url);
    expect(ok.status).toBe(200);
    expect(ok.headers["content-type"]).toBe("image/png");

    const tampered = await api().get(url.replace(/sig=[^&]+/, "sig=forged"));
    expect(tampered.status).toBe(403);
    const unsigned = await api().get(url.split("?")[0]);
    expect(unsigned.status).toBe(403);
  });

  it("admin sees it in the filtered list and reviews it", async () => {
    const list = await api()
      .get("/api/admin/complaints?status=Pending&category=Pothole&q=bus")
      .set(auth(adminToken));
    expect(list.status).toBe(200);
    expect(list.body.complaints[0].id).toBe(complaintId);
    expect(list.body.complaints[0].citizen.email).toBe("citizen@test.local");

    const res = await api().post(`/api/admin/complaints/${complaintId}/review`).set(auth(adminToken));
    expect(res.status).toBe(200);
    expect(res.body.complaint.status).toBe("Reviewed");
  });

  it("admin assigns a worker", async () => {
    const res = await api()
      .post(`/api/admin/complaints/${complaintId}/assign`)
      .set(auth(adminToken))
      .send({ workerId: roadsWorker.id });
    expect(res.status).toBe(200);
    expect(res.body.complaint.status).toBe("Assigned");
    expect(res.body.complaint.worker.id).toBe(roadsWorker.id);
  });

  it("reassignment requires a reason", async () => {
    const res = await api()
      .post(`/api/admin/complaints/${complaintId}/assign`)
      .set(auth(adminToken))
      .send({ workerId: otherWorker.id });
    expect(res.status).toBe(400);
  });

  it("the worker sees the task and is notified", async () => {
    const tasks = await api().get("/api/worker/tasks").set(auth(roadsWorker.token));
    expect(tasks.status).toBe(200);
    expect(tasks.body.tasks.map((t) => t.id)).toContain(complaintId);
    expect(tasks.body.tasks[0].citizen).toEqual({ name: "Test Citizen" });

    const notes = await api().get("/api/notifications").set(auth(roadsWorker.token));
    expect(notes.body.notifications.some((n) => n.type === "task_assigned")).toBe(true);
  });

  it("another worker cannot see or update the task", async () => {
    const view = await api().get(`/api/worker/tasks/${complaintId}`).set(auth(otherWorker.token));
    expect(view.status).toBe(404);
    const start = await api().post(`/api/worker/tasks/${complaintId}/start`).set(auth(otherWorker.token));
    expect(start.status).toBe(404);
  });

  it("the worker cannot complete before starting", async () => {
    const res = await api()
      .post(`/api/worker/tasks/${complaintId}/complete`)
      .set(auth(roadsWorker.token))
      .attach("images", PNG, { filename: "done.png", contentType: "image/png" });
    expect(res.status).toBe(409);
  });

  it("the worker starts work, adds a note and evidence, then completes", async () => {
    const start = await api().post(`/api/worker/tasks/${complaintId}/start`).set(auth(roadsWorker.token));
    expect(start.status).toBe(200);
    expect(start.body.complaint.status).toBe("In Progress");

    const note = await api()
      .post(`/api/worker/tasks/${complaintId}/notes`)
      .set(auth(roadsWorker.token))
      .send({ text: "Barricaded the area; patching material ordered.", visibleToCitizen: true });
    expect(note.status).toBe(200);

    const internal = await api()
      .post(`/api/worker/tasks/${complaintId}/notes`)
      .set(auth(roadsWorker.token))
      .send({ text: "Internal: supervisor approval needed", visibleToCitizen: false });
    expect(internal.status).toBe(200);

    const noEvidence = await api().post(`/api/worker/tasks/${complaintId}/complete`).set(auth(roadsWorker.token));
    expect(noEvidence.status).toBe(400);

    const done = await api()
      .post(`/api/worker/tasks/${complaintId}/complete`)
      .set(auth(roadsWorker.token))
      .field("note", "Pothole filled and compacted.")
      .attach("images", PNG, { filename: "after.png", contentType: "image/png" });
    expect(done.status).toBe(200);
    expect(done.body.complaint.status).toBe("Completed");
    expect(done.body.complaint.completionImages).toHaveLength(1);
  });

  it("the citizen sees status, timeline, worker and only public notes", async () => {
    const res = await api().get(`/api/complaints/${complaintId}`).set(auth(citizen.token));
    const c = res.body.complaint;
    expect(c.status).toBe("Completed");
    expect(c.timeline.map((t) => t.event)).toEqual([
      "submitted",
      "reviewed",
      "assigned",
      "started",
      "note",
      "note",
      "completed",
    ]);
    expect(c.worker.name).toBe("Worker roads@test.local");
    expect(c.worker.email).toBeUndefined();
    expect(c.notes.map((n) => n.text)).not.toContain("Internal: supervisor approval needed");
    expect(c.notes).toHaveLength(2);
    expect(c.completedAt).toBeTruthy();

    const notifications = await api().get("/api/notifications").set(auth(citizen.token));
    const types = notifications.body.notifications.map((n) => n.type);
    expect(types).toEqual(expect.arrayContaining(["complaint_reviewed", "complaint_assigned", "work_started", "feedback_requested"]));
  });

  it("the citizen submits feedback exactly once", async () => {
    const first = await api()
      .post(`/api/complaints/${complaintId}/feedback`)
      .set(auth(citizen.token))
      .send({ rating: 5, comment: "Fixed within two days, thank you." });
    expect(first.status).toBe(200);
    expect(first.body.complaint.feedback.rating).toBe(5);

    const second = await api()
      .post(`/api/complaints/${complaintId}/feedback`)
      .set(auth(citizen.token))
      .send({ rating: 1 });
    expect(second.status).toBe(409);
  });

  it("public tracking exposes status only", async () => {
    const res = await api().get(`/api/public/track/${reference}`);
    expect(res.status).toBe(200);
    expect(res.body.complaint.status).toBe("Completed");
    expect(res.body.complaint.description).toBeUndefined();
    expect(res.body.complaint.address).toBeUndefined();
    expect(JSON.stringify(res.body)).not.toContain("citizen@test.local");
  });

  it("admin analytics reflect real data", async () => {
    const overview = await api().get("/api/admin/overview").set(auth(adminToken));
    expect(overview.body.overview).toMatchObject({ total: 1, completed: 1, resolutionRate: 1 });
    expect(overview.body.overview.avgResolutionHours).toBeGreaterThanOrEqual(0);

    const analytics = await api().get("/api/admin/analytics").set(auth(adminToken));
    expect(analytics.status).toBe(200);
    expect(analytics.body.analytics.byCategory).toEqual([{ key: "Pothole", count: 1 }]);
    expect(analytics.body.analytics.workerPerformance[0]).toMatchObject({ completed: 1 });
    // The current month must be the last bucket and contain this complaint.
    const trend = analytics.body.analytics.trend;
    expect(trend).toHaveLength(6);
    expect(trend.at(-1)).toMatchObject({ month: new Date().toISOString().slice(0, 7), created: 1, completed: 1 });

    const csv = await api().get("/api/admin/reports/complaints.csv").set(auth(adminToken));
    expect(csv.status).toBe(200);
    expect(csv.text).toContain(reference);
    expect(csv.text).not.toContain("citizen@test.local");
  });
});

describe("authorization boundaries", () => {
  it("rejects unauthenticated access to admin and worker APIs", async () => {
    expect((await api().get("/api/admin/complaints")).status).toBe(401);
    expect((await api().get("/api/admin/workers")).status).toBe(401);
    expect((await api().get("/api/worker/tasks")).status).toBe(401);
    expect((await api().get("/api/complaints")).status).toBe(401);
  });

  it("rejects the wrong role with 403", async () => {
    expect((await api().get("/api/admin/complaints").set(auth(citizen.token))).status).toBe(403);
    expect((await api().get("/api/admin/complaints").set(auth(roadsWorker.token))).status).toBe(403);
    expect((await api().get("/api/worker/tasks").set(auth(citizen.token))).status).toBe(403);
    expect((await api().get("/api/complaints").set(auth(adminToken))).status).toBe(403);
  });

  it("a citizen cannot read another citizen's complaint", async () => {
    const res = await api().get(`/api/complaints/${complaintId}`).set(auth(otherCitizen.token));
    expect(res.status).toBe(404);
    const list = await api().get("/api/complaints").set(auth(otherCitizen.token));
    expect(list.body.complaints).toHaveLength(0);
  });

  it("rejects forged tokens", async () => {
    const res = await api().get("/api/auth/me").set(auth("not.a.token"));
    expect(res.status).toBe(401);
  });

  it("never returns password hashes", async () => {
    const reg = await api()
      .post("/api/auth/register")
      .send({ fullName: "Hash Check", email: "HASH@Test.Local ", password: PASSWORD });
    expect(reg.status).toBe(201);
    expect(JSON.stringify(reg.body)).not.toMatch(/\$2[aby]\$/);
    expect(reg.body.user.email).toBe("hash@test.local");

    const workers = await api().get("/api/admin/workers").set(auth(adminToken));
    expect(JSON.stringify(workers.body)).not.toMatch(/\$2[aby]\$|password/);
  });

  it("logout invalidates the token", async () => {
    const session = await registerCitizen("logout@test.local");
    expect((await api().get("/api/auth/me").set(auth(session.token))).status).toBe(200);
    expect((await api().post("/api/auth/logout").set(auth(session.token))).status).toBe(200);
    expect((await api().get("/api/auth/me").set(auth(session.token))).status).toBe(401);
  });

  it("deactivated workers lose access immediately", async () => {
    const temp = await createWorker("temp@test.local", "Water");
    await api().patch(`/api/admin/workers/${temp.id}`).set(auth(adminToken)).send({ isActive: false });
    expect((await api().get("/api/worker/tasks").set(auth(temp.token))).status).toBe(401);
    const login = await api().post("/api/auth/login").send({ email: "temp@test.local", password: PASSWORD, role: "worker" });
    expect(login.status).toBe(403);
  });
});

describe("validation", () => {
  it("rejects weak passwords and duplicate emails", async () => {
    const weak = await api().post("/api/auth/register").send({ fullName: "Weak", email: "weak@test.local", password: "short" });
    expect(weak.status).toBe(400);
    const dup = await api().post("/api/auth/register").send({ fullName: "Dup", email: "citizen@test.local", password: PASSWORD });
    expect(dup.status).toBe(409);
  });

  it("uses the same message for unknown email and wrong password", async () => {
    const unknown = await api().post("/api/auth/login").send({ email: "nobody@test.local", password: PASSWORD });
    const wrong = await api().post("/api/auth/login").send({ email: "citizen@test.local", password: "Wrong-pass-1" });
    expect(unknown.status).toBe(401);
    expect(wrong.status).toBe(401);
    expect(unknown.body.message).toBe(wrong.body.message);
  });

  it("requires a location or address", async () => {
    const res = await api()
      .post("/api/complaints")
      .set(auth(citizen.token))
      .field("title", "Overflowing garbage bin")
      .field("description", "The garbage bin has been overflowing for days.");
    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/address or share your location/);
  });

  it("rejects files that are not really images", async () => {
    const res = await api()
      .post("/api/complaints")
      .set(auth(citizen.token))
      .field("title", "Overflowing garbage bin")
      .field("description", "The garbage bin has been overflowing for days.")
      .field("address", "Park Street, Ward 3")
      .attach("images", Buffer.from("<script>alert(1)</script>"), { filename: "x.png", contentType: "image/png" });
    expect(res.status).toBe(400);
  });

  it("rejects disallowed MIME types", async () => {
    const res = await api()
      .post("/api/complaints")
      .set(auth(citizen.token))
      .field("title", "Overflowing garbage bin")
      .field("description", "The garbage bin has been overflowing for days.")
      .field("address", "Park Street, Ward 3")
      .attach("images", Buffer.from("GIF89a"), { filename: "x.gif", contentType: "image/gif" });
    expect(res.status).toBe(400);
  });

  it("treats regex characters in search as plain text", async () => {
    const res = await api().get("/api/admin/complaints?q=(a%2B)%2B%24").set(auth(adminToken));
    expect(res.status).toBe(200);
  });

  it("citizens can only edit or withdraw Pending complaints", async () => {
    const res = await api()
      .put(`/api/complaints/${complaintId}`)
      .set(auth(citizen.token))
      .send({ title: "Changed title here" });
    expect(res.status).toBe(409);
    expect((await api().delete(`/api/complaints/${complaintId}`).set(auth(citizen.token))).status).toBe(409);
  });
});
