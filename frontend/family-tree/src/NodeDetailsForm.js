import React from "react";
import PropTypes from "prop-types";
import "./NodeForm.css";

const NodeDetailsForm = ({
  formData,
  handleInputChange,
  handleSubmit,
  onAddMember,
}) => {
  return (
    <form className="node-form" onSubmit={handleSubmit}>
      <div className="form-row">
        <label className="label">Name:</label>
        <input
          type="text"
          name="name"
          value={formData.name}
          onChange={handleInputChange}
          required
          className="input-field"
        />
      </div>
      <div className="form-row">
        <label className="label">Gender:</label>
        <select
          name="gender"
          value={formData.gender}
          onChange={handleInputChange}
          className="input-field"
        >
          <option value="MALE">Male</option>
          <option value="FEMALE">Female</option>
        </select>
      </div>
      <div className="form-row">
        <label className="label">Occupation:</label>
        <input
          type="text"
          name="occupation"
          value={formData.occupation}
          onChange={handleInputChange}
          className="input-field"
        />
      </div>
      <div className="form-row">
        <label className="label">Age:</label>
        <input
          type="number"
          name="age"
          value={formData.age}
          onChange={handleInputChange}
          className="input-field"
        />
      </div>
      <div className="form-row">
        <label className="label">Birth Date:</label>
        <input
          type="date"
          name="birthDate"
          value={formData.birthDate}
          onChange={handleInputChange}
          className="input-field"
        />
      </div>
      <div className="form-row">
        <label className="label">Death Date:</label>
        <input
          type="date"
          name="deathDate"
          value={formData.deathDate}
          onChange={handleInputChange}
          className="input-field"
        />
      </div>
      <div className="form-row">
        <label className="label">Birth Place:</label>
        <input
          type="text"
          name="birthPlace"
          value={formData.birthPlace}
          onChange={handleInputChange}
          className="input-field"
        />
      </div>
      <div className="form-row">
        <label className="label">Death Place:</label>
        <input
          type="text"
          name="deathPlace"
          value={formData.deathPlace}
          onChange={handleInputChange}
          className="input-field"
        />
      </div>
      <div className="form-row">
        <label className="label">Has Sub Tree:</label>
        <input
          type="checkbox"
          name="hasSubTree"
          checked={formData.hasSubTree}
          onChange={handleInputChange}
        />
      </div>
      <button type="submit" className="button">
        Save
      </button>
      <button
        type="button"
        onClick={() => onAddMember("spouse")}
        className="button"
      >
        Add Spouse
      </button>
      <button
        type="button"
        onClick={() => onAddMember("child")}
        className="button"
      >
        Add Child
      </button>
    </form>
  );
};

NodeDetailsForm.propTypes = {
  formData: PropTypes.object.isRequired,
  handleInputChange: PropTypes.func.isRequired,
  handleSubmit: PropTypes.func.isRequired,
  onAddMember: PropTypes.func.isRequired,
};

export default NodeDetailsForm;
