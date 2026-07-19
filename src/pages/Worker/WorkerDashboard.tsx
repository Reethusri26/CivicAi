import { useEffect, useState } from "react";
import {
  getAssignedComplaints,
  updateComplaintStatus,
} from "../../services/workerService";

export default function WorkerDashboard() {
  const [complaints, setComplaints] = useState<any[]>([]);
  const [workerNotes, setWorkerNotes] = useState<{
    [key: string]: string;
  }>({});
  const [completionImages, setCompletionImages] = useState<{
    [key: string]: File | null;
  }>({});

  useEffect(() => {
    loadComplaints();
  }, []);

  const loadComplaints = async () => {
    try {
      const worker = JSON.parse(
        localStorage.getItem("worker") || "{}"
      );

      if (!worker.id) return;

      const res = await getAssignedComplaints(worker.id);

      setComplaints(res.data.complaints);
    } catch (error) {
      console.log(error);
    }
  };

  const handleStatusChange = async (
    complaintId: string,
    status: string
  ) => {
    try {
      const formData = new FormData();

      formData.append("status", status);

      formData.append(
        "workerNotes",
        workerNotes[complaintId] || ""
      );

      if (completionImages[complaintId]) {
        formData.append(
          "completionImage",
          completionImages[complaintId]!
        );
      }

      await updateComplaintStatus(
        complaintId,
        formData
      );

      alert("Status Updated Successfully");

      loadComplaints();
    } catch (error) {
      console.log(error);
      alert("Update Failed");
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 p-8">

      <h1 className="text-4xl font-bold mb-8">
        Worker Dashboard
      </h1>

      <div className="space-y-6">

        {complaints.length > 0 ? (
          complaints.map((item: any) => (
            <div
              key={item._id}
              className="bg-white rounded-xl shadow p-6"
            >
              <h2 className="text-2xl font-semibold">
                {item.title}
              </h2>

              <p className="mt-2">
                {item.description}
              </p>

              <p className="mt-3">
                <b>Status:</b> {item.status}
              </p>

              {item.image && (
                <img
                  src={`http://localhost:5000${item.image}`}
                  alt="Complaint"
                  className="w-64 mt-4 rounded-lg"
                />
              )}

              <textarea
                placeholder="Worker Notes"
                className="w-full border rounded p-3 mt-4"
                rows={3}
                value={workerNotes[item._id] || ""}
                onChange={(e) =>
                  setWorkerNotes({
                    ...workerNotes,
                    [item._id]: e.target.value,
                  })
                }
              />

              <input
                type="file"
                className="mt-3"
                accept="image/*"
                onChange={(e) =>
                  setCompletionImages({
                    ...completionImages,
                    [item._id]:
                      e.target.files?.[0] || null,
                  })
                }
              />

              <div className="flex gap-3 mt-4">

                <button
                  className="bg-yellow-500 text-white px-4 py-2 rounded"
                  onClick={() =>
                    handleStatusChange(
                      item._id,
                      "In Progress"
                    )
                  }
                >
                  In Progress
                </button>

                <button
                  className="bg-green-600 text-white px-4 py-2 rounded"
                  onClick={() =>
                    handleStatusChange(
                      item._id,
                      "Completed"
                    )
                  }
                >
                  Complete
                </button>

              </div>
            </div>
          ))
        ) : (
          <div className="bg-white rounded-lg shadow p-10 text-center">
            No Assigned Complaints
          </div>
        )}

      </div>

    </div>
  );
}