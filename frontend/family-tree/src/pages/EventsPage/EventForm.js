import React from "react";
import "./EventsPage.css";

const EventForm = ({ onSubmit, newEvent, onInputChange, persons }) => (
  <section className="ep-form-section ep-card">
    <h2 className="ep-section-title">Add New Event</h2>
    <form onSubmit={onSubmit} className="ep-event-form">
      <div className="ep-form-group">
        <label htmlFor="title">Title</label>
        <input
          type="text"
          id="title"
          name="title"
          value={newEvent.title}
          onChange={onInputChange}
          required
          className="ep-event-input"
          placeholder="Enter event title"
        />
      </div>
      <div className="ep-form-group">
        <label htmlFor="eventType">Event Type</label>
        <select
          id="eventType"
          name="eventType"
          value={newEvent.eventType}
          onChange={onInputChange}
          required
          className="ep-event-input"
        >
          <option value="">Select Type</option>
          <option value="BIRTHDAY">Birthday</option>
          <option value="WEDDING">Wedding</option>
          <option value="MEMORIAL">Memorial</option>
          <option value="OTHER">Other</option>
        </select>
      </div>
      <div className="ep-form-group">
        <label htmlFor="eventDate">Event Date</label>
        <input
          type="date"
          id="eventDate"
          name="eventDate"
          value={newEvent.eventDate}
          onChange={onInputChange}
          required
          className="ep-event-input"
        />
      </div>
      <div className="ep-form-group">
        <label htmlFor="reminderDate">Reminder Date (Optional)</label>
        <input
          type="date"
          id="reminderDate"
          name="reminderDate"
          value={newEvent.reminderDate}
          onChange={onInputChange}
          className="ep-event-input"
        />
      </div>
      <div className="ep-form-group ep-checkbox-group">
        <label className="ep-checkbox-label">
          Is Memorial Event?
          <input
            type="checkbox"
            name="isMemorial"
            checked={newEvent.isMemorial}
            onChange={onInputChange}
            className="ep-checkbox-input"
          />
          <span className="ep-checkmark"></span>
        </label>
      </div>
      <div className="ep-form-group">
        <label htmlFor="personId">Person</label>
        <select
          id="personId"
          name="personId"
          value={newEvent.personId}
          onChange={onInputChange}
          required
          className="ep-event-input"
        >
          <option value="">Select Person</option>
          {persons.map((person) => (
            <option key={person.id} value={person.id}>
              {person.name}
            </option>
          ))}
        </select>
      </div>
      <button type="submit" className="ep-submit-button">
        Add Event
      </button>
    </form>
  </section>
);

export default EventForm;
