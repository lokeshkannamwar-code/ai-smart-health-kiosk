import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./PatientDashboard.css";

function PatientDashboard() {
  const navigate = useNavigate();

  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const handleLogout = async () => {
  try {
    const token = localStorage.getItem("sessionToken");

    if (token) {
      const response = await fetch(
        "http://localhost:5000/api/auth/logout",
        {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${token}`,
            "Content-Type": "application/json"
          }
        }
      );

      const data = await response.json();

      console.log("Logout Response:", data);

      if (!response.ok) {
        console.error(
          "Backend logout failed:",
          data.message || data.error
        );
      }
    }

  } catch (error) {
    console.error(
      "Logout request failed:",
      error
    );

  } finally {
    // Always remove the token from the browser
    localStorage.removeItem("sessionToken");

    // Return to login page
    navigate("/");
  }
};

  useEffect(() => {
    const fetchAuthenticatedUser = async () => {
      try {
        const token = localStorage.getItem("sessionToken");

        // No token means the user is not logged in
        if (!token) {
          navigate("/");
          return;
        }

        const response = await fetch(
          "http://localhost:5000/api/auth/me",
          {
            method: "GET",
            headers: {
              "Authorization": `Bearer ${token}`,
              "Content-Type": "application/json"
            }
          }
        );

        const data = await response.json();

        console.log("Authenticated User Response:", data);

        if (!response.ok) {
          localStorage.removeItem("sessionToken");

          setError(
            data.message ||
            data.error ||
            "Your session is invalid or expired."
          );

          setTimeout(() => {
            navigate("/");
          }, 1500);

          return;
        }

        // Save authenticated user information
        setUser(data.user);

      } catch (error) {
        console.error(
          "Authenticated user request failed:",
          error
        );

        setError(
          "Unable to connect to the backend server."
        );

      } finally {
        setLoading(false);
      }
    };

    fetchAuthenticatedUser();
  }, [navigate]);

  // Loading screen
  if (loading) {
    return (
      <div className="patient-dashboard">
        <div className="dashboard-content">
          <div className="welcome-section">
            <h2>Loading Patient Dashboard...</h2>
            <p>
              Verifying your secure session with the server.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Error screen
  if (error) {
    return (
      <div className="patient-dashboard">
        <div className="dashboard-content">
          <div className="welcome-section">
            <h2>Authentication Error</h2>
            <p>{error}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="patient-dashboard">

      <header className="dashboard-header">

        <div>
          <h1>AI Smart Health Kiosk</h1>
          <p>Patient Dashboard</p>
        </div>

        <button
  type="button"
  onClick={handleLogout}
>
  Logout
</button>


      </header>

      <main className="dashboard-content">

        {/* Welcome Section */}
        <section className="welcome-section">

          <h2>
            Welcome,{" "}
            {user?.full_name ||
              user?.fullName ||
              "Patient"}{" "}
            👋
          </h2>

          <p>
            You are successfully authenticated.
          </p>

          {/* User Information */}
          <div className="user-details">

            <p>
              <strong>Role:</strong>{" "}
              {user?.role || "PATIENT"}
            </p>

            <p>
              <strong>Mobile:</strong>{" "}
              {user?.mobile || "Not available"}
            </p>

            <p>
              <strong>Email:</strong>{" "}
              {user?.email || "Not available"}
            </p>

          </div>

        </section>

        {/* Dashboard Cards */}
        <section className="dashboard-grid">

          <div className="dashboard-card">
            <h3>👤 My Profile</h3>

            <p>
              View and manage your personal information.
            </p>

           <button
  type="button"
  onClick={() => navigate("/patient-profile")}
>
  Open Profile
</button>
          </div>


          <div className="dashboard-card">
  <h3>🩺 Health Information</h3>

  <p>
    View and manage your health and medical information.
  </p>

  <button
    type="button"
    onClick={() => navigate("/patient-health")}
  >
    View Health
  </button>
</div>


          <div className="dashboard-card">
  <h3>🤖 AI Case Taking</h3>

  <p>
    Provide your symptoms and health information
    through the AI-assisted case-taking system.
  </p>

  <button
    type="button"
    onClick={() => navigate("/patient-case")}
  >
    Start Case
  </button>
</div>


          <div className="dashboard-card">
            <h3>📋 Previous Cases</h3>

            <p>
              View your previous healthcare cases.
            </p>

            <button type="button">
              View Cases
            </button>
          </div>


          <div className="dashboard-card">
            <h3>📅 Appointments</h3>

            <p>
              View and manage your appointments.
            </p>

            <button type="button">
              Appointments
            </button>
          </div>

        </section>

      </main>

    </div>
  );
}

export default PatientDashboard;