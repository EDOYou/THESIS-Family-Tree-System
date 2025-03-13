import React from "react";
import PropTypes from "prop-types";
import "./NodeForm.css";

const AddSpouseForm = ({
  newSpouse,
  handleSpouseInputChange,
  handleAddSpouse,
  cancelAddMember,
}) => {
  return (
    <div className="add-member-section">
      <h3>Add Spouse</h3>
      <div className="form-row">
        <label className="label">Spouse Name:</label>
        <input
          type="text"
          name="name"
          value={newSpouse.name}
          onChange={handleSpouseInputChange}
          className="input-field"
        />
      </div>
      <div className="form-row">
        <label className="label">Gender:</label>
        <select
          name="gender"
          value={newSpouse.gender}
          onChange={handleSpouseInputChange}
          className="input-field"
          disabled
        >
          <option value="MALE">Male</option>
          <option value="FEMALE">Female</option>
        </select>
      </div>
      <button onClick={handleAddSpouse} className="button">
        Add Spouse
      </button>
      <button onClick={cancelAddMember} className="button">
        Cancel
      </button>
    </div>
  );
};

AddSpouseForm.propTypes = {
  newSpouse: PropTypes.object.isRequired,
  handleSpouseInputChange: PropTypes.func.isRequired,
  handleAddSpouse: PropTypes.func.isRequired,
  cancelAddMember: PropTypes.func.isRequired,
};

export default AddSpouseForm;
