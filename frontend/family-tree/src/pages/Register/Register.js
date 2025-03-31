import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "../../services/axiosInstance";
import "./Register.css";

const Register = () => {
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    password: "",
    role: "USER",
    dateOfBirth: "",
  });
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post("/api/auth/register", formData);
      setError(null);
      navigate("/");
    } catch (err) {
      setError(err.response?.data?.message || "Registration failed");
    }
  };

  return (
    <div className="rp-register-page">
      <div className="rp-register-container">
        <h2 className="rp-register-title">Register</h2>
        {error && <div className="rp-register-error">{error}</div>}
        <form onSubmit={handleSubmit} className="rp-register-form">
          <div className="rp-form-group">
            <label htmlFor="username">Username</label>
            <input
              type="text"
              id="username"
              name="username"
              value={formData.username}
              onChange={handleChange}
              required
              className="rp-register-input"
              placeholder="Enter username"
            />
          </div>
          <div className="rp-form-group">
            <label htmlFor="email">Email</label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              required
              className="rp-register-input"
              placeholder="Enter email"
            />
          </div>
          <div className="rp-form-group">
            <label htmlFor="password">Password</label>
            <input
              type="password"
              id="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              required
              className="rp-register-input"
              placeholder="Enter password"
            />
          </div>
          <div className="rp-form-group">
            <label htmlFor="dateOfBirth">Date of Birth</label>
            <input
              type="date"
              id="dateOfBirth"
              name="dateOfBirth"
              value={formData.dateOfBirth}
              onChange={handleChange}
              required
              className="rp-register-input"
            />
          </div>
          <div className="rp-form-group">
            <label htmlFor="role">Role</label>
            <select
              id="role"
              name="role"
              value={formData.role}
              onChange={handleChange}
              className="rp-register-input"
            >
              <option value="USER">User</option>
              <option value="ADMIN">Admin</option>
            </select>
          </div>
          <button type="submit" className="rp-submit-button">
            Register
          </button>
        </form>
        <p className="rp-login-link">
          Already have an account? <a href="/login">Login here</a>
        </p>
      </div>
    </div>
  );
};

export default Register;
