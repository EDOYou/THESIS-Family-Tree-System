import React from "react";
import PropTypes from "prop-types";
import "./NodeForm.css";

const AddChildForm = ({
  newChild,
  handleChildInputChange,
  handleAddChild,
  cancelAddMember,
}) => {
  return (
    <div className="add-member-section">
      <h3>Add Child</h3>
      <div className="form-row">
        <label className="label">Child Name:</label>
        <input
          type="text"
          name="name"
          value={newChild.name}
          onChange={handleChildInputChange}
          className="input-field"
        />
      </div>
      <div className="form-row">
        <label className="label">Gender:</label>
        <select
          name="gender"
          value={newChild.gender}
          onChange={handleChildInputChange}
          className="input-field"
        >
          <option value="MALE">Male</option>
          <option value="FEMALE">Female</option>
        </select>
      </div>
      <button onClick={handleAddChild} className="button">
        Add Child
      </button>
      <button onClick={cancelAddMember} className="button">
        Cancel
      </button>
    </div>
  );
};

AddChildForm.propTypes = {
  newChild: PropTypes.object.isRequired,
  handleChildInputChange: PropTypes.func.isRequired,
  handleAddChild: PropTypes.func.isRequired,
  cancelAddMember: PropTypes.func.isRequired,
};

export default AddChildForm;
