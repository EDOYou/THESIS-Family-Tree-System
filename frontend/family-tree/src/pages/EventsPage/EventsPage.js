import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "../../services/axiosInstance";
import { useAuth } from "../../context/AuthContext";

const EventsPage = () => {
  const [events, setEvents] = useState([]);
  const [reminders, setReminders] = useState([]);
  const [persons, setPersons] = useState([]);
  const [newEvent, setNewEvent] = useState({
    title: "",
    eventType: "",
    eventDate: "",
    reminderDate: "",
    isMemorial: false,
    personId: "",
  });
  const [error, setError] = useState(null);
  const { logout } = useAuth();
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
      } catch (error) {
        console.error("Error fetching persons:", error);
        setError("Failed to load persons. Please try again.");
      }
    };

    fetchPersons();
  }, [logout, navigate]);

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const authHeader = localStorage.getItem("authHeader");
        if (!authHeader) {
          setError("Not authenticated. Please log in.");
          logout();
          navigate("/login");
          return;
        }

        const eventsResponse = await axios.get("/api/events", {
          headers: { Authorization: authHeader },
        });
        setEvents(eventsResponse.data);

        const remindersResponse = await axios.get("/api/events/reminders", {
          headers: { Authorization: authHeader },
        });
        setReminders(remindersResponse.data);

        setError(null);
      } catch (error) {
        console.error("Error fetching events:", error);
        if (error.response && error.response.status === 401) {
          setError("Session expired. Please log in again.");
          logout();
          navigate("/login");
        } else {
          setError("Failed to load events. Please try again.");
        }
      }
    };

    fetchEvents();
  }, [logout, navigate]);

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setNewEvent({
      ...newEvent,
      [name]: type === "checkbox" ? checked : value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const authHeader = localStorage.getItem("authHeader");
      if (!authHeader) {
        setError("Not authenticated. Please log in.");
        logout();
        navigate("/login");
        return;
      }

      const eventData = {
        title: newEvent.title,
        eventType: newEvent.eventType,
        eventDate: newEvent.eventDate,
        reminderDate: newEvent.reminderDate || null,
        isMemorial: newEvent.isMemorial,
        person: { id: newEvent.personId },
      };

      const response = await axios.post("/api/events", eventData, {
        headers: { Authorization: authHeader },
      });

      setEvents([...events, response.data]);
      setNewEvent({
        title: "",
        eventType: "",
        eventDate: "",
        reminderDate: "",
        isMemorial: false,
        personId: "",
      });
      setError(null);
    } catch (error) {
      console.error("Error creating event:", error);
      if (error.response && error.response.status === 401) {
        setError("Session expired. Please log in again.");
        logout();
        navigate("/login");
      } else {
        setError("Failed to create event. Please try again.");
      }
    }
  };

  const handleDelete = async (id) => {
    try {
      const authHeader = localStorage.getItem("authHeader");
      if (!authHeader) {
        setError("Not authenticated. Please log in.");
        logout();
        navigate("/login");
        return;
      }

      await axios.delete(`/api/events/${id}`, {
        headers: { Authorization: authHeader },
      });

      setEvents(events.filter((event) => event.id !== id));
      setReminders(reminders.filter((event) => event.id !== id));
      setError(null);
    } catch (error) {
      console.error("Error deleting event:", error);
      if (error.response && error.response.status === 401) {
        setError("Session expired. Please log in again.");
        logout();
        navigate("/login");
      } else {
        setError("Failed to delete event. Please try again.");
      }
    }
  };

  return (
    <div style={{ padding: "20px", textAlign: "center" }}>
      <h1>Family Events</h1>
      {error && (
        <div style={{ color: "red", marginBottom: "10px" }}>{error}</div>
      )}

      {/* Reminders Section */}
      {reminders.length > 0 && (
        <div style={{ marginBottom: "20px" }}>
          <h2>Upcoming Reminders</h2>
          <ul style={{ listStyleType: "none", padding: 0 }}>
            {reminders.map((event) => (
              <li
                key={event.id}
                style={{
                  padding: "10px",
                  border: "1px solid #ccc",
                  marginBottom: "5px",
                  backgroundColor: "#ffeb3b",
                }}
              >
                <strong>{event.title}</strong> ({event.eventType}) for{" "}
                {event.personName} on{" "}
                {new Date(event.eventDate).toLocaleDateString()}
                {event.isMemorial && " (Memorial)"}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* All Events Section */}
      <h2>All Events</h2>
      {events.length === 0 ? (
        <p>No events found. Add a new event below.</p>
      ) : (
        <ul style={{ listStyleType: "none", padding: 0 }}>
          {events.map((event) => (
            <li
              key={event.id}
              style={{
                padding: "10px",
                border: "1px solid #ccc",
                marginBottom: "5px",
              }}
            >
              <strong>{event.title}</strong> ({event.eventType}) for{" "}
              {event.personName} on{" "}
              {new Date(event.eventDate).toLocaleDateString()}
              {event.reminderDate && (
                <span>
                  {" "}
                  - Reminder on{" "}
                  {new Date(event.reminderDate).toLocaleDateString()}
                </span>
              )}
              {event.isMemorial && " (Memorial)"}
              <button
                onClick={() => handleDelete(event.id)}
                style={{ marginLeft: "10px", color: "red" }}
              >
                Delete
              </button>
            </li>
          ))}
        </ul>
      )}

      {/* Add New Event Form */}
      <h2>Add New Event</h2>
      <form onSubmit={handleSubmit} style={{ marginTop: "20px" }}>
        <div style={{ marginBottom: "10px" }}>
          <label>Title: </label>
          <input
            type="text"
            name="title"
            value={newEvent.title}
            onChange={handleInputChange}
            required
          />
        </div>
        <div style={{ marginBottom: "10px" }}>
          <label>Event Type: </label>
          <select
            name="eventType"
            value={newEvent.eventType}
            onChange={handleInputChange}
            required
          >
            <option value="">Select Type</option>
            <option value="BIRTHDAY">Birthday</option>
            <option value="WEDDING">Wedding</option>
            <option value="MEMORIAL">Memorial</option>
            <option value="OTHER">Other</option>
          </select>
        </div>
        <div style={{ marginBottom: "10px" }}>
          <label>Event Date: </label>
          <input
            type="date"
            name="eventDate"
            value={newEvent.eventDate}
            onChange={handleInputChange}
            required
          />
        </div>
        <div style={{ marginBottom: "10px" }}>
          <label>Reminder Date (Optional): </label>
          <input
            type="date"
            name="reminderDate"
            value={newEvent.reminderDate}
            onChange={handleInputChange}
          />
        </div>
        <div style={{ marginBottom: "10px" }}>
          <label>
            Is Memorial Event?{" "}
            <input
              type="checkbox"
              name="isMemorial"
              checked={newEvent.isMemorial}
              onChange={handleInputChange}
            />
          </label>
        </div>
        <div style={{ marginBottom: "10px" }}>
          <label>Person: </label>
          <select
            name="personId"
            value={newEvent.personId}
            onChange={handleInputChange}
            required
          >
            <option value="">Select Person</option>
            {persons.map((person) => (
              <option key={person.id} value={person.id}>
                {person.name}
              </option>
            ))}
          </select>
        </div>
        <button type="submit" style={{ padding: "5px 10px" }}>
          Add Event
        </button>
      </form>
    </div>
  );
};

export default EventsPage;
