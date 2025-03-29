import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "./axiosInstance";
import { useAuth } from "./AuthContext";

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

  return (
    <div style={{ padding: "20px", textAlign: "center" }}>
      <h1>Ancestral Achievements & Notable Events</h1>
      {error && (
        <div style={{ color: "red", marginBottom: "10px" }}>{error}</div>
      )}

      {/* Person Selection */}
      <div style={{ marginBottom: "20px" }}>
        <label>Select Person: </label>
        <select
          value={selectedPersonId}
          onChange={(e) => setSelectedPersonId(e.target.value)}
          style={{ padding: "5px", marginLeft: "10px" }}
        >
          <option value="">-- Select a Person --</option>
          {persons.map((person) => (
            <option key={person.id} value={person.id}>
              {person.name}
            </option>
          ))}
        </select>
      </div>

      {/* Notable Records List */}
      {selectedPersonId ? (
        <>
          <h2>
            Notable Records for{" "}
            {persons.find((p) => p.id === selectedPersonId)?.name}
          </h2>
          {notableRecords.length === 0 ? (
            <p>No notable records found for this person.</p>
          ) : (
            <ul style={{ listStyleType: "none", padding: 0 }}>
              {notableRecords.map((record) => (
                <li
                  key={record.id}
                  style={{
                    padding: "10px",
                    border: "1px solid #ccc",
                    marginBottom: "5px",
                    backgroundColor: "#f9f9f9",
                  }}
                >
                  <strong>{record.title}</strong> ({record.type})<br />
                  {record.description}
                  {record.date && (
                    <span> - {new Date(record.date).toLocaleDateString()}</span>
                  )}
                  <br />
                  <em>
                    Added by {record.createdByUsername} on{" "}
                    {new Date(record.createdAt).toLocaleString()}
                  </em>
                  {record.createdByUsername === user.username && (
                    <button
                      onClick={() => handleDeleteRecord(record.id)}
                      style={{
                        marginLeft: "10px",
                        color: "red",
                        background: "none",
                        border: "none",
                        cursor: "pointer",
                      }}
                    >
                      Delete
                    </button>
                  )}
                </li>
              ))}
            </ul>
          )}

          {/* Add New Notable Record Form */}
          <h3>Add New Notable Record</h3>
          <form onSubmit={handleAddRecord} style={{ marginTop: "20px" }}>
            <div style={{ marginBottom: "10px" }}>
              <label>Title: </label>
              <input
                type="text"
                name="title"
                value={newRecord.title}
                onChange={(e) =>
                  setNewRecord({
                    ...newRecord,
                    [e.target.name]: e.target.value,
                  })
                }
                required
                style={{ padding: "5px", width: "300px" }}
              />
            </div>
            <div style={{ marginBottom: "10px" }}>
              <label>Type: </label>
              <select
                name="type"
                value={newRecord.type}
                onChange={(e) =>
                  setNewRecord({
                    ...newRecord,
                    [e.target.name]: e.target.value,
                  })
                }
                required
                style={{ padding: "5px", width: "310px" }}
              >
                <option value="">Select Type</option>
                <option value="ACHIEVEMENT">Achievement</option>
                <option value="EVENT">Event</option>
              </select>
            </div>
            <div style={{ marginBottom: "10px" }}>
              <label>Description: </label>
              <textarea
                name="description"
                value={newRecord.description}
                onChange={(e) =>
                  setNewRecord({
                    ...newRecord,
                    [e.target.name]: e.target.value,
                  })
                }
                required
                style={{ padding: "5px", width: "300px", height: "60px" }}
              />
            </div>
            <div style={{ marginBottom: "10px" }}>
              <label>Date (Optional): </label>
              <input
                type="date"
                name="date"
                value={newRecord.date}
                onChange={(e) =>
                  setNewRecord({
                    ...newRecord,
                    [e.target.name]: e.target.value,
                  })
                }
                style={{ padding: "5px", width: "300px" }}
              />
            </div>
            <button type="submit" style={{ padding: "5px 10px" }}>
              Add Record
            </button>
          </form>
        </>
      ) : (
        <p>Please select a person to view or add notable records.</p>
      )}
    </div>
  );
};

export default NotableRecordsPage;
