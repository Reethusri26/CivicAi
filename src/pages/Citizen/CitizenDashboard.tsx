import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getMyComplaints } from "../../services/complaintService";

interface Complaint {
  _id: string;
  title: string;
  description: string;
  category: string;
  status: string;
  createdAt: string;
  assignedWorker?: {
    name: string;
    department: string;
  };
}

export default function CitizenDashboard() {
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    loadComplaints();
  }, []);

  const loadComplaints = async () => {
    try {
      const res = await getMyComplaints();
      setComplaints(res.data.complaints);
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 p-8">

      <div className="flex justify-between items-center mb-8">

        <h1 className="text-4xl font-bold">
          My Complaints
        </h1>

        <button
          onClick={() => navigate("/citizen/create")}
          className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-3 rounded-lg"
        >
          + New Complaint
        </button>

      </div>

      <div className="bg-white shadow rounded-lg p-6 overflow-x-auto">

        <table className="w-full border border-collapse">

          <thead>

            <tr className="bg-gray-200">

              <th className="border p-3">Title</th>

              <th className="border p-3">Category</th>

              <th className="border p-3">Status</th>

              <th className="border p-3">Assigned Worker</th>

              <th className="border p-3">Created</th>

            </tr>

          </thead>

          <tbody>

            {complaints.length > 0 ? (

              complaints.map((item) => (

                <tr
                  key={item._id}
                  className="hover:bg-gray-50"
                >

                  <td className="border p-3">
                    {item.title}
                  </td>

                  <td className="border p-3">
                    {item.category}
                  </td>

                  <td className="border p-3">

                    <span
                      className={`px-3 py-1 rounded text-white ${
                        item.status === "Completed"
                          ? "bg-green-600"
                          : item.status === "In Progress"
                          ? "bg-blue-600"
                          : item.status === "Assigned"
                          ? "bg-yellow-500"
                          : "bg-red-500"
                      }`}
                    >
                      {item.status}
                    </span>

                  </td>

                  <td className="border p-3">

                    {item.assignedWorker
                      ? `${item.assignedWorker.name} (${item.assignedWorker.department})`
                      : "Not Assigned"}

                  </td>

                  <td className="border p-3">
                    {new Date(item.createdAt).toLocaleDateString()}
                  </td>

                </tr>

              ))

            ) : (

              <tr>

                <td
                  colSpan={5}
                  className="text-center p-5"
                >
                  No complaints found
                </td>

              </tr>

            )}

          </tbody>

        </table>

      </div>

    </div>
  );
}