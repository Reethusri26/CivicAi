import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { createComplaint } from "../../services/complaintService";

export default function CreateComplaint() {
  const navigate = useNavigate();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("Garbage");

  const [image, setImage] = useState<File | null>(null);

  const [location, setLocation] = useState({
    latitude: "",
    longitude: "",
  });

  const [loading, setLoading] = useState(false);

  const detectCategory = (text: string) => {
    const value = text.toLowerCase();

    if (value.includes("garbage") || value.includes("dust"))
      return "Garbage";

    if (value.includes("pothole") || value.includes("road"))
      return "Pothole";

    if (value.includes("water") || value.includes("pipe"))
      return "Water Leakage";

    if (value.includes("light"))
      return "Street Light";

    if (value.includes("animal"))
      return "Dead Animal";

    return "Other";
  };

  const detectPriority = (text: string) => {
    const value = text.toLowerCase();

    if (
      value.includes("urgent") ||
      value.includes("accident") ||
      value.includes("danger")
    )
      return "High";

    if (
      value.includes("broken") ||
      value.includes("damaged")
    )
      return "Medium";

    return "Low";
  };

  const getLocation = () => {
    if (!navigator.geolocation) {
      alert("Geolocation not supported");
      return;
    }

    navigator.geolocation.getCurrentPosition((position) => {
      setLocation({
        latitude: position.coords.latitude.toString(),
        longitude: position.coords.longitude.toString(),
      });

      alert("Location Captured");
    });
  };

  const handleSubmit = async (
    e: React.FormEvent
  ) => {
    e.preventDefault();

    setLoading(true);

    try {
      const formData = new FormData();

      formData.append("title", title);
      formData.append("description", description);

      formData.append(
        "category",
        detectCategory(description)
      );

      formData.append(
        "priority",
        detectPriority(description)
      );

      formData.append(
        "latitude",
        location.latitude
      );

      formData.append(
        "longitude",
        location.longitude
      );

      if (image) {
        formData.append("image", image);
      }

      await createComplaint(formData);

      alert("Complaint Submitted Successfully");

      navigate("/citizen/dashboard");
    } catch (error) {
      console.log(error);
      alert("Submission Failed");
    }

    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gray-100 flex justify-center items-center p-10">

      <div className="bg-white shadow-xl rounded-xl w-full max-w-3xl p-8">

        <h1 className="text-3xl font-bold mb-6">
          Create Complaint
        </h1>

        <form
          onSubmit={handleSubmit}
          className="space-y-5"
        >

          <input
            className="w-full border rounded p-3"
            placeholder="Complaint Title"
            value={title}
            onChange={(e) =>
              setTitle(e.target.value)
            }
            required
          />

          <textarea
            className="w-full border rounded p-3"
            rows={5}
            placeholder="Describe the issue..."
            value={description}
            onChange={(e) => {
              setDescription(e.target.value);
              setCategory(
                detectCategory(e.target.value)
              );
            }}
            required
          />

          <input
            className="w-full"
            type="file"
            accept="image/*"
            onChange={(e) =>
              setImage(
                e.target.files
                  ? e.target.files[0]
                  : null
              )
            }
          />

          {image && (
            <img
              src={URL.createObjectURL(image)}
              alt="Preview"
              className="w-52 rounded shadow"
            />
          )}

          <div className="grid grid-cols-2 gap-4">

            <input
              className="border rounded p-3"
              value={category}
              readOnly
            />

            <input
              className="border rounded p-3"
              value={detectPriority(description)}
              readOnly
            />

          </div>

          <button
            type="button"
            onClick={getLocation}
            className="bg-green-600 text-white px-6 py-3 rounded"
          >
            Use Current Location
          </button>

          {location.latitude && (
            <p className="text-green-600">
              ✓ GPS Location Captured
            </p>
          )}

          <button
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded"
          >
            {loading
              ? "Submitting..."
              : "Submit Complaint"}
          </button>

        </form>

      </div>

    </div>
  );
}