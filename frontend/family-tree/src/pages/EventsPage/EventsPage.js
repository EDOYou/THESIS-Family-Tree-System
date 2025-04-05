import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "../../services/axiosInstance";
import { useAuth } from "../../context/AuthContext";
import EventForm from "./EventForm";
import "./EventsPage.css";

const apiCall = async (
  method,
  url,
  data = null,
  authHeader,
  setError,
  logout,
  navigate
) => {
  if (!authHeader) {
    setError("Not authenticated. Please log in.");
    logout();
    navigate("/login");
    return null;
  }

  try {
    const config = { headers: { Authorization: authHeader } };
    const response = await axios[method](
      url,
      data ? data : config,
      data ? config : undefined
    );
    return response.data;
  } catch (error) {
    console.error(`Error in ${method.toUpperCase()} ${url}:`, error);
    if (error.response?.status === 401) {
      setError("Session expired. Please log in again.");
      logout();
      navigate("/login");
    } else {
      setError(
        `Failed to ${
          method === "get" ? "load" : method === "post" ? "create" : "delete"
        } data. Please try again.`
      );
    }
    return null;
  }
};

const EventList = ({ events, reminders, onDelete }) => (
  <>
    {reminders.length > 0 && (
      <section className="ep-reminders-section ep-card">
        <h2 className="ep-section-title">Upcoming Reminders</h2>
        <ul className="ep-events-list">
          {reminders.map((event) => (
            <li key={event.id} className="ep-event-item ep-reminder-item">
              <span className="ep-event-details">
                <strong>{event.title}</strong> ({event.eventType}) for{" "}
                {event.personName} on{" "}
                {new Date(event.eventDate).toLocaleDateString()}
                {event.isMemorial && " (Memorial)"}
                {" - Created by: " + event.createdByUsername}
              </span>
            </li>
          ))}
        </ul>
      </section>
    )}
    <section className="ep-events-section ep-card">
      <h2 className="ep-section-title">All Events</h2>
      {events.length === 0 ? (
        <p className="ep-no-events">No events found. Add a new event below.</p>
      ) : (
        <ul className="ep-events-list">
          {events.map((event) => (
            <li key={event.id} className="ep-event-item">
              <span className="ep-event-details">
                <strong>{event.title}</strong> ({event.eventType}) for{" "}
                {event.personName} on{" "}
                {new Date(event.eventDate).toLocaleDateString()}
                {event.reminderDate && (
                  <span className="ep-reminder-date">
                    {" "}
                    - Reminder on{" "}
                    {new Date(event.reminderDate).toLocaleDateString()}
                  </span>
                )}
                {event.isMemorial && " (Memorial)"}
                {" - Created by: " + event.createdByUsername}
              </span>
              <button
                onClick={() => onDelete(event.id)}
                className="ep-delete-button"
              >
                Delete
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  </>
);

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
  const authHeader = localStorage.getItem("authHeader");

  useEffect(() => {
    const fetchData = async () => {
      const personsData = await apiCall(
        "get",
        "/api/persons/all",
        null,
        authHeader,
        setError,
        logout,
        navigate
      );
      if (personsData) setPersons(personsData);

      const eventsData = await apiCall(
        "get",
        "/api/events",
        null,
        authHeader,
        setError,
        logout,
        navigate
      );
      if (eventsData) setEvents(eventsData);

      const remindersData = await apiCall(
        "get",
        "/api/events/reminders",
        null,
        authHeader,
        setError,
        logout,
        navigate
      );
      if (remindersData) setReminders(remindersData);

      if (personsData && eventsData && remindersData) setError(null);
    };

    fetchData();
  }, [logout, navigate, authHeader]);

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setNewEvent((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const eventData = {
      title: newEvent.title,
      eventType: newEvent.eventType,
      eventDate: newEvent.eventDate,
      reminderDate: newEvent.reminderDate || null,
      isMemorial: newEvent.isMemorial,
      person: { id: newEvent.personId },
    };

    const response = await apiCall(
      "post",
      "/api/events",
      eventData,
      authHeader,
      setError,
      logout,
      navigate
    );
    if (response) {
      setEvents((prev) => [...prev, response]);
      setNewEvent({
        title: "",
        eventType: "",
        eventDate: "",
        reminderDate: "",
        isMemorial: false,
        personId: "",
      });
    }
  };

  const handleDelete = async (id) => {
    const success = await apiCall(
      "delete",
      `/api/events/${id}`,
      null,
      authHeader,
      setError,
      logout,
      navigate
    );
    if (success !== null) {
      setEvents((prev) => prev.filter((event) => event.id !== id));
      setReminders((prev) => prev.filter((event) => event.id !== id));
    }
  };

  const handleBackToMain = () => navigate("/");

  return (
    <div className="ep-events-page">
      <div className="ep-events-container">
        <header className="ep-events-header">
          <button className="ep-back-button" onClick={handleBackToMain}>
            ← Back to Family Tree
          </button>
          <h1 className="ep-events-title">Family Events</h1>
        </header>
        {error && <div className="ep-events-error">{error}</div>}
        <EventList
          events={events}
          reminders={reminders}
          onDelete={handleDelete}
        />
        <EventForm
          onSubmit={handleSubmit}
          newEvent={newEvent}
          onInputChange={handleInputChange}
          persons={persons}
        />
      </div>
    </div>
  );
};

export default EventsPage;
