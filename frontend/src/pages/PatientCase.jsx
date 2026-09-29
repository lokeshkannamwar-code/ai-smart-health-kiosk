import { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./PatientCase.css";

function PatientCase() {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    chief_complaint: "",
    symptoms: "",
    symptom_duration: "",
    symptom_severity: "",
    additional_information: ""
  });

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const handleChange = (event) => {
    const { name, value } = event.target;

    setFormData((previousData) => ({
      ...previousData,
      [name]: value
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    setError("");

    if (!formData.chief_complaint.trim()) {
      setError("Please enter your main health complaint.");
      return;
    }

    if (!formData.symptoms.trim()) {
      setError("Please describe your symptoms.");
      return;
    }

    if (!formData.symptom_duration) {
      setError("Please select how long you have had the symptoms.");
      return;
    }

    if (!formData.symptom_severity) {
      setError("Please select the severity of your symptoms.");
      return;
    }

    try {
      const token = localStorage.getItem("sessionToken");

      if (!token) {
        navigate("/");
        return;
      }

      setSaving(true);

      const response = await fetch(
        "http://localhost:5000/api/patient/cases",
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

      console.log("Create Patient Case Response:", data);

      if (!response.ok) {
        if (response.status === 401) {
          localStorage.removeItem("sessionToken");
          navigate("/");
          return;
        }

        setError(
          data.message ||
          data.error ||
          "Failed to create patient case."
        );

        return;
      }

      /*
       * Save the newly created case ID.
       * We will use this in the AI interview module.
       */
      const caseId = data?.case?.id;

      if (caseId) {
        sessionStorage.setItem(
          "currentCaseId",
          String(caseId)
        );
      }

      /*
       * For now, show the created case information.
       * The next step will replace this with the AI interview page.
       */
      navigate("/patient-case", {
        state: {
          caseCreated: true,
          case: data.case
        }
      });

    } catch (error) {
      console.error(
        "Create patient case error:",
        error
      );

      setError(
        "Unable to connect to the backend server. Make sure the backend is running."
      );

    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="case-page">

      <div className="case-container">

        {/* Header */}

        <div className="case-header">

          <div>
            <h1>AI Case Taking</h1>
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


        {/* Main Card */}

        <div className="case-card">

          <div className="case-title">

            <div className="case-icon">
              🤖
            </div>

            <div>
              <h2>Start a New Health Case</h2>

              <p>
                Tell us about your current health problem.
              </p>
            </div>

          </div>


          {/* Information */}

          <div className="case-info-box">

            <strong>
              Before you begin
            </strong>

            <p>
              Please provide accurate information about
              your symptoms. This information will be used
              to prepare your healthcare case.
            </p>

          </div>


          {/* Error */}

          {error && (
            <div className="case-error">
              {error}
            </div>
          )}


          {/* Form */}

          <form onSubmit={handleSubmit}>

            {/* Chief Complaint */}

            <div className="form-group">

              <label htmlFor="chief_complaint">
                What is your main health problem?
              </label>

              <input
                type="text"
                id="chief_complaint"
                name="chief_complaint"
                placeholder="Example: Fever, headache, stomach pain"
                value={formData.chief_complaint}
                onChange={handleChange}
              />

              <small>
                Briefly describe the main problem you are
                experiencing.
              </small>

            </div>


            {/* Symptoms */}

            <div className="form-group">

              <label htmlFor="symptoms">
                Describe your symptoms
              </label>

              <textarea
                id="symptoms"
                name="symptoms"
                placeholder="Example: I have fever, headache and body pain."
                rows="5"
                value={formData.symptoms}
                onChange={handleChange}
              />

              <small>
                Include all symptoms you are currently
                experiencing.
              </small>

            </div>


            {/* Duration */}

            <div className="form-group">

              <label htmlFor="symptom_duration">
                How long have you had these symptoms?
              </label>

              <select
                id="symptom_duration"
                name="symptom_duration"
                value={formData.symptom_duration}
                onChange={handleChange}
              >

                <option value="">
                  Select duration
                </option>

                <option value="Less than 1 day">
                  Less than 1 day
                </option>

                <option value="1-2 days">
                  1-2 days
                </option>

                <option value="3-7 days">
                  3-7 days
                </option>

                <option value="1-2 weeks">
                  1-2 weeks
                </option>

                <option value="More than 2 weeks">
                  More than 2 weeks
                </option>

                <option value="More than 1 month">
                  More than 1 month
                </option>

              </select>

            </div>


            {/* Severity */}

            <div className="form-group">

              <label htmlFor="symptom_severity">
                How severe are your symptoms?
              </label>

              <select
                id="symptom_severity"
                name="symptom_severity"
                value={formData.symptom_severity}
                onChange={handleChange}
              >

                <option value="">
                  Select severity
                </option>

                <option value="Mild">
                  Mild
                </option>

                <option value="Moderate">
                  Moderate
                </option>

                <option value="Severe">
                  Severe
                </option>

              </select>

            </div>


            {/* Additional Information */}

            <div className="form-group">

              <label htmlFor="additional_information">
                Additional information
              </label>

              <textarea
                id="additional_information"
                name="additional_information"
                placeholder="Anything else you think the healthcare team should know?"
                rows="4"
                value={formData.additional_information}
                onChange={handleChange}
              />

            </div>


            {/* Buttons */}

            <div className="case-actions">

              <button
                type="button"
                className="case-cancel-button"
                onClick={() =>
                  navigate("/patient-dashboard")
                }
              >
                Cancel
              </button>

              <button
                type="submit"
                className="case-submit-button"
                disabled={saving}
              >
                {saving
                  ? "Creating Case..."
                  : "Start AI Case Taking →"}
              </button>

            </div>

          </form>

        </div>

      </div>

    </div>
  );
}

export default PatientCase;