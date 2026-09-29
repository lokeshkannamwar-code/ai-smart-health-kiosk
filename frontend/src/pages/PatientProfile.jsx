import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./PatientProfile.css";

function PatientProfile() {
  const navigate = useNavigate();

  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        const token = localStorage.getItem("sessionToken");

        // Check authentication
        if (!token) {
          navigate("/");
          return;
        }

        const response = await fetch(
          "http://localhost:5000/api/auth/me",
          {
            method: "GET",
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json"
            }
          }
        );

        const data = await response.json();

        console.log("Patient Profile Response:", data);

        if (!response.ok) {
          localStorage.removeItem("sessionToken");
          navigate("/");
          return;
        }

        setUser(data.user);

      } catch (error) {
        console.error(
          "Patient profile request failed:",
          error
        );

        setError(
          "Unable to connect to the backend server."
        );

      } finally {
        setLoading(false);
      }
    };

    fetchUserProfile();
  }, [navigate]);

  // Loading screen
  if (loading) {
    return (
      <div className="profile-page">
        <div className="profile-card">
          <h2>Loading Profile...</h2>
          <p>
            Retrieving your information securely.
          </p>
        </div>
      </div>
    );
  }

  // Error screen
  if (error) {
    return (
      <div className="profile-page">
        <div className="profile-card">
          <h2>Unable to Load Profile</h2>
          <p>{error}</p>

          <button
            type="button"
            onClick={() => navigate("/patient-dashboard")}
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="profile-page">

      <div className="profile-container">

        {/* Header */}
        <div className="profile-header">

          <div>
            <h1>My Profile</h1>
            <p>AI Smart Health Kiosk</p>
          </div>

          <button
            type="button"
            onClick={() => navigate("/patient-dashboard")}
          >
            ← Dashboard
          </button>

        </div>


        {/* Profile Card */}
        <div className="profile-card">

          <div className="profile-avatar">
            👤
          </div>

          <h2>
            {user?.full_name ||
              user?.fullName ||
              "Patient"}
          </h2>

          <p className="profile-role">
            {user?.role || "PATIENT"}
          </p>


          {/* Information */}
          <div className="profile-information">

            <div className="profile-row">
              <span>Full Name</span>

              <strong>
                {user?.full_name ||
                  user?.fullName ||
                  "Not available"}
              </strong>
            </div>


            <div className="profile-row">
              <span>Mobile Number</span>

              <strong>
                {user?.mobile ||
                  "Not available"}
              </strong>
            </div>


            <div className="profile-row">
              <span>Email Address</span>

              <strong>
                {user?.email ||
                  "Not available"}
              </strong>
            </div>


            <div className="profile-row">
              <span>Role</span>

              <strong>
                {user?.role ||
                  "PATIENT"}
              </strong>
            </div>


            <div className="profile-row">
              <span>Account Status</span>

              <strong className="active-status">
                {user?.is_active === false
                  ? "Inactive"
                  : "Active"}
              </strong>
            </div>


            <div className="profile-row">
              <span>User ID</span>

              <strong>
                {user?.id ||
                  "Not available"}
              </strong>
            </div>

          </div>

        </div>

      </div>

    </div>
  );
}

export default PatientProfile;