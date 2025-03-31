import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "../../services/axiosInstance";
import { useAuth } from "../../context/AuthContext";
import "./NotableRecordsPage.css";

const NotableRecordsPage = () => {
  const [persons, setPersons] = useState([]);
  const [selectedPersonId, setSelectedPersonId] = useState("");
  const [notableRecords, setNotableRecords] = useState([]);
  const [newRecord, setNewRecord] = useState({
    title: "",
    type: "",
    description: "",
    date: "",
  });
  const [error, setError] = useState(null);
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchPersons = async () => {
      try {
        const authHeader = localStorage.getItem("authHeader");
        if (!authHeader) {
          setError("Not authenticated. Please log in.");
          logout();
          navigate("/login");
          return;
        }

        const response = await axios.get("/api/persons/all", {
          headers: { Authorization: authHeader },
        });
        setPersons(response.data);
        setError(null);
      } catch (error) {
        console.error("Error fetching persons:", error);
        if (error.response && error.response.status === 401) {
          setError("Session expired. Please log in again.");
          logout();
          navigate("/login");
        } else {
          setError("Failed to load persons. Please try again.");
        }
      }
    };

    fetchPersons();
  }, [logout, navigate]);

  useEffect(() => {
    if (selectedPersonId) {
      const fetchNotableRecords = async () => {
        try {
          const authHeader = localStorage.getItem("authHeader");
          if (!authHeader) {
            setError("Not authenticated. Please log in.");
            logout();
            navigate("/login");
            return;
          }

          const response = await axios.get(
            `/api/persons/${selectedPersonId}/notable-records`,
            {
              headers: { Authorization: authHeader },
            }
          );
          setNotableRecords(response.data);
          setError(null);
        } catch (error) {
          console.error("Error fetching notable records:", error);
          if (error.response && error.response.status === 401) {
            setError("Session expired. Please log in again.");
            logout();
            navigate("/login");
          } else {
            setError("Failed to load notable records. Please try again.");
          }
        }
      };

      fetchNotableRecords();
    } else {
      setNotableRecords([]);
    }
  }, [selectedPersonId, logout, navigate]);

  const handleAddRecord = async (e) => {
    e.preventDefault();
    if (!selectedPersonId) {
      setError("Please select a person first.");
      return;
    }

    try {
      const authHeader = localStorage.getItem("authHeader");
      if (!authHeader) {
        setError("Not authenticated. Please log in.");
        logout();
        navigate("/login");
        return;
      }

      const recordData = {
        title: newRecord.title,
        type: newRecord.type,
        description: newRecord.description,
        date: newRecord.date || null,
        person: { id: selectedPersonId },
      };

      const response = await axios.post("/api/notable-records", recordData, {
        headers: { Authorization: authHeader },
      });

      setNotableRecords([...notableRecords, response.data]);
      setNewRecord({ title: "", type: "", description: "", date: "" });
      setError(null);
    } catch (error) {
      console.error("Error adding notable record:", error);
      if (error.response && error.response.status === 401) {
        setError("Session expired. Please log in again.");
        logout();
        navigate("/login");
      } else {
        setError("Failed to add notable record. Please try again.");
      }
    }
  };

  const handleDeleteRecord = async (id) => {
    try {
      const authHeader = localStorage.getItem("authHeader");
      if (!authHeader) {
        setError("Not authenticated. Please log in.");
        logout();
        navigate("/login");
        return;
      }

      await axios.delete(`/api/notable-records/${id}`, {
        headers: { Authorization: authHeader },
      });

      setNotableRecords(notableRecords.filter((record) => record.id !== id));
      setError(null);
    } catch (error) {
      console.error("Error deleting notable record:", error);
      if (error.response && error.response.status === 401) {
        setError("Session expired. Please log in again.");
        logout();
        navigate("/login");
      } else {
        setError("Failed to delete notable record. Please try again.");
      }
    }
  };

  const handleBackToMain = () => navigate("/");

  return (
    <div className="nrp-records-page">
      <div className="nrp-records-container">
        <header className="nrp-records-header">
          <button className="nrp-back-button" onClick={handleBackToMain}>
            ← Back to Family Tree
          </button>
          <h1 className="nrp-records-title">
            Ancestral Achievements & Notable Events
          </h1>
        </header>
        {error && <div className="nrp-records-error">{error}</div>}

        {/* Person Selection */}
        <section className="nrp-person-selection nrp-card">
          <label htmlFor="personSelect" className="nrp-section-label">
            Select Person
          </label>
          <select
            id="personSelect"
            value={selectedPersonId}
            onChange={(e) => setSelectedPersonId(e.target.value)}
            className="nrp-record-input"
          >
            <option value="">-- Select a Person --</option>
            {persons.map((person) => (
              <option key={person.id} value={person.id}>
                {person.name}
              </option>
            ))}
          </select>
        </section>

        {/* Notable Records List and Form */}
        {selectedPersonId ? (
          <>
            <section className="nrp-records-list nrp-card">
              <h2 className="nrp-section-title">
                Notable Records for{" "}
                {persons.find((p) => p.id === selectedPersonId)?.name}
              </h2>
              {notableRecords.length === 0 ? (
                <p className="nrp-no-records">
                  No notable records found for this person.
                </p>
              ) : (
                <ul className="nrp-records-ul">
                  {notableRecords.map((record) => (
                    <li key={record.id} className="nrp-record-item">
                      <div className="nrp-record-details">
                        <strong>{record.title}</strong> ({record.type})
                        <br />
                        {record.description}
                        {record.date && (
                          <span>
                            {" - "}
                            {new Date(record.date).toLocaleDateString()}
                          </span>
                        )}
                        <br />
                        <em className="nrp-record-meta">
                          Added by {record.createdByUsername} on{" "}
                          {new Date(record.createdAt).toLocaleString()}
                        </em>
                      </div>
                      {record.createdByUsername === user.username && (
                        <button
                          onClick={() => handleDeleteRecord(record.id)}
                          className="nrp-delete-button"
                        >
                          Delete
                        </button>
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </section>

            {/* Add New Notable Record Form */}
            <section className="nrp-form-section nrp-card">
              <h3 className="nrp-section-title">Add New Notable Record</h3>
              <form onSubmit={handleAddRecord} className="nrp-record-form">
                <div className="nrp-form-group">
                  <label htmlFor="title">Title</label>
                  <input
                    type="text"
                    id="title"
                    name="title"
                    value={newRecord.title}
                    onChange={(e) =>
                      setNewRecord({
                        ...newRecord,
                        [e.target.name]: e.target.value,
                      })
                    }
                    required
                    className="nrp-record-input"
                    placeholder="Enter record title"
                  />
                </div>
                <div className="nrp-form-group">
                  <label htmlFor="type">Type</label>
                  <select
                    id="type"
                    name="type"
                    value={newRecord.type}
                    onChange={(e) =>
                      setNewRecord({
                        ...newRecord,
                        [e.target.name]: e.target.value,
                      })
                    }
                    required
                    className="nrp-record-input"
                  >
                    <option value="">Select Type</option>
                    <option value="ACHIEVEMENT">Achievement</option>
                    <option value="EVENT">Event</option>
                  </select>
                </div>
                <div className="nrp-form-group">
                  <label htmlFor="description">Description</label>
                  <textarea
                    id="description"
                    name="description"
                    value={newRecord.description}
                    onChange={(e) =>
                      setNewRecord({
                        ...newRecord,
                        [e.target.name]: e.target.value,
                      })
                    }
                    required
                    className="nrp-record-input nrp-textarea"
                    placeholder="Describe the record"
                  />
                </div>
                <div className="nrp-form-group">
                  <label htmlFor="date">Date (Optional)</label>
                  <input
                    type="date"
                    id="date"
                    name="date"
                    value={newRecord.date}
                    onChange={(e) =>
                      setNewRecord({
                        ...newRecord,
                        [e.target.name]: e.target.value,
                      })
                    }
                    className="nrp-record-input"
                  />
                </div>
                <button type="submit" className="nrp-submit-button">
                  Add Record
                </button>
              </form>
            </section>
          </>
        ) : (
          <p className="nrp-placeholder">
            Please select a person to view or add notable records.
          </p>
        )}
      </div>
    </div>
  );
};

export default NotableRecordsPage;
