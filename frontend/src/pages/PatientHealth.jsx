import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./PatientHealth.css";

function PatientHealth() {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    blood_group: "",
    date_of_birth: "",
    gender: "",
    height_cm: "",
    weight_kg: "",
    allergies: "",
    chronic_conditions: "",
    current_medications: "",
    emergency_contact_name: "",
    emergency_contact_mobile: ""
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchHealthProfile = async () => {
      try {
        const token = localStorage.getItem("sessionToken");

        if (!token) {
          navigate("/");
          return;
        }

        const response = await fetch(
          "http://localhost:5000/api/patient/health",
          {
            method: "GET",
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json"
            }
          }
        );

        const data = await response.json();

        console.log("Patient Health Response:", data);

        if (!response.ok) {
          if (response.status === 401) {
            localStorage.removeItem("sessionToken");
            navigate("/");
            return;
          }

          setError(
            data.message ||
            data.error ||
            "Failed to load health information."
          );

          return;
        }

        if (data.exists && data.healthProfile) {
          const profile = data.healthProfile;

          setFormData({
            blood_group: profile.blood_group || "",
            date_of_birth: profile.date_of_birth
              ? profile.date_of_birth.substring(0, 10)
              : "",
            gender: profile.gender || "",
            height_cm: profile.height_cm || "",
            weight_kg: profile.weight_kg || "",
            allergies: profile.allergies || "",
            chronic_conditions:
              profile.chronic_conditions || "",
            current_medications:
              profile.current_medications || "",
            emergency_contact_name:
              profile.emergency_contact_name || "",
            emergency_contact_mobile:
              profile.emergency_contact_mobile || ""
          });
        }

      } catch (error) {
        console.error(
          "Patient health request failed:",
          error
        );

        setError(
          "Unable to connect to the backend server."
        );

      } finally {
        setLoading(false);
      }
    };

    fetchHealthProfile();
  }, [navigate]);

  const handleChange = (event) => {
    const { name, value } = event.target;

    setFormData((previousData) => ({
      ...previousData,
      [name]: value
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    setSaving(true);
    setMessage("");
    setError("");

    try {
      const token = localStorage.getItem("sessionToken");

      if (!token) {
        navigate("/");
        return;
      }

      const response = await fetch(
        "http://localhost:5000/api/patient/health",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json"
          },
          body: JSON.stringify(formData)
        }
      );

      const data = await response.json();

      console.log("Save Health Response:", data);

      if (!response.ok) {
        if (response.status === 401) {
          localStorage.removeItem("sessionToken");
          navigate("/");
          return;
        }

        setError(
          data.message ||
          data.error ||
          "Failed to save health information."
        );

        return;
      }

      setMessage(
        "Health information saved successfully."
      );

    } catch (error) {
      console.error(
        "Save health information error:",
        error
      );

      setError(
        "Unable to connect to the backend server."
      );

    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="health-page">
        <div className="health-card">
          <h2>Loading Health Information...</h2>
          <p>
            Retrieving your health information securely.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="health-page">

      <div className="health-container">

        <div className="health-header">

          <div>
            <h1>Health Information</h1>
            <p>AI Smart Health Kiosk</p>
          </div>

          <button
            type="button"
            onClick={() =>
              navigate("/patient-dashboard")
            }
          >
            ← Dashboard
          </button>

        </div>

        <div className="health-card">

          <div className="health-title">

            <div className="health-icon">
              🩺
            </div>

            <div>
              <h2>My Health Information</h2>
              <p>
                Keep your basic health information updated.
              </p>
            </div>

          </div>

          {message && (
            <div className="success-message">
              {message}
            </div>
          )}

          {error && (
            <div className="error-message">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit}>

            <div className="form-section">

              <h3>Basic Information</h3>

              <div className="form-grid">

                <div className="form-group">

                  <label htmlFor="blood_group">
                    Blood Group
                  </label>

                  <select
                    id="blood_group"
                    name="blood_group"
                    value={formData.blood_group}
                    onChange={handleChange}
                  >
                    <option value="">
                      Select Blood Group
                    </option>

                    <option value="A+">A+</option>
                    <option value="A-">A-</option>
                    <option value="B+">B+</option>
                    <option value="B-">B-</option>
                    <option value="AB+">AB+</option>
                    <option value="AB-">AB-</option>
                    <option value="O+">O+</option>
                    <option value="O-">O-</option>

                  </select>

                </div>

                <div className="form-group">

                  <label htmlFor="date_of_birth">
                    Date of Birth
                  </label>

                  <input
                    type="date"
                    id="date_of_birth"
                    name="date_of_birth"
                    value={formData.date_of_birth}
                    onChange={handleChange}
                  />

                </div>

                <div className="form-group">

                  <label htmlFor="gender">
                    Gender
                  </label>

                  <select
                    id="gender"
                    name="gender"
                    value={formData.gender}
                    onChange={handleChange}
                  >

                    <option value="">
                      Select Gender
                    </option>

                    <option value="Male">
                      Male
                    </option>

                    <option value="Female">
                      Female
                    </option>

                    <option value="Other">
                      Other
                    </option>

                  </select>

                </div>

              </div>

            </div>

            <div className="form-section">

              <h3>Physical Information</h3>

              <div className="form-grid">

                <div className="form-group">

                  <label htmlFor="height_cm">
                    Height (cm)
                  </label>

                  <input
                    type="number"
                    id="height_cm"
                    name="height_cm"
                    placeholder="Example: 170"
                    min="30"
                    max="250"
                    step="0.01"
                    value={formData.height_cm}
                    onChange={handleChange}
                  />

                </div>

                <div className="form-group">

                  <label htmlFor="weight_kg">
                    Weight (kg)
                  </label>

                  <input
                    type="number"
                    id="weight_kg"
                    name="weight_kg"
                    placeholder="Example: 65"
                    min="1"
                    max="500"
                    step="0.01"
                    value={formData.weight_kg}
                    onChange={handleChange}
                  />

                </div>

              </div>

            </div>

            <div className="form-section">

              <h3>Medical Information</h3>

              <div className="form-group">

                <label htmlFor="allergies">
                  Allergies
                </label>

                <textarea
                  id="allergies"
                  name="allergies"
                  placeholder="Enter any known allergies"
                  rows="3"
                  value={formData.allergies}
                  onChange={handleChange}
                />

              </div>

              <div className="form-group">

                <label htmlFor="chronic_conditions">
                  Chronic Conditions
                </label>

                <textarea
                  id="chronic_conditions"
                  name="chronic_conditions"
                  placeholder="Example: Diabetes, asthma, hypertension"
                  rows="3"
                  value={formData.chronic_conditions}
                  onChange={handleChange}
                />

              </div>

              <div className="form-group">

                <label htmlFor="current_medications">
                  Current Medications
                </label>

                <textarea
                  id="current_medications"
                  name="current_medications"
                  placeholder="Enter medicines you currently take"
                  rows="3"
                  value={formData.current_medications}
                  onChange={handleChange}
                />

              </div>

            </div>

            <div className="form-section">

              <h3>Emergency Contact</h3>

              <div className="form-grid">

                <div className="form-group">

                  <label htmlFor="emergency_contact_name">
                    Contact Name
                  </label>

                  <input
                    type="text"
                    id="emergency_contact_name"
                    name="emergency_contact_name"
                    placeholder="Emergency contact name"
                    value={
                      formData.emergency_contact_name
                    }
                    onChange={handleChange}
                  />

                </div>

                <div className="form-group">

                  <label htmlFor="emergency_contact_mobile">
                    Contact Mobile
                  </label>

                  <input
                    type="tel"
                    id="emergency_contact_mobile"
                    name="emergency_contact_mobile"
                    placeholder="Emergency contact mobile"
                    value={
                      formData.emergency_contact_mobile
                    }
                    onChange={handleChange}
                  />

                </div>

              </div>

            </div>

            <div className="form-actions">

              <button
                type="button"
                className="secondary-button"
                onClick={() =>
                  navigate("/patient-dashboard")
                }
              >
                Cancel
              </button>

              <button
                type="submit"
                className="primary-button"
                disabled={saving}
              >
                {saving
                  ? "Saving..."
                  : "Save Health Information"}
              </button>

            </div>

          </form>

        </div>

      </div>

    </div>
  );
}

export default PatientHealth;