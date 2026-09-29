import { useLocation, useNavigate } from "react-router-dom";
import PatientDashboard from "../components/PatientDashboard.jsx";
function RoleSelection() {
  const navigate = useNavigate();
  const location = useLocation();

  const data = location.state || {};

  const {
    role = "",
    identifier = "",
    loginMethod = "",
    verified = false
  } = data;

  const handleContinue = () => {
  if (!verified) {
    navigate("/");
    return;
  }

  if (role.toLowerCase() === "patient") {
    navigate("/patient-dashboard", {
      state: {
        identifier,
        loginMethod,
        role
      }
    });
    return;
  }

  alert(
    `${role.charAt(0).toUpperCase() + role.slice(1)} dashboard will be created in the next phase.`
  );
};

  return (
    <div className="role-page">

      <div className="role-card">

        <div className="role-icon">
          ✅
        </div>

        <h1>Verification Successful</h1>

        <p>
          Your OTP has been verified successfully.
        </p>

        <div className="user-information">

          <p>
            <strong>Role:</strong>{" "}
            {role || "Not selected"}
          </p>

          <p>
            <strong>Login Method:</strong>{" "}
            {loginMethod || "Not selected"}
          </p>

          <p>
            <strong>Account:</strong>{" "}
            {identifier || "Not available"}
          </p>

        </div>

        <button
          type="button"
          className="continue-button"
          onClick={handleContinue}
        >
          Continue to Dashboard
        </button>

        <button
          type="button"
          className="back-button"
          onClick={() => navigate("/")}
        >
          ← Back to Login
        </button>

      </div>

    </div>
  );
}

export default RoleSelection;