import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "../../services/axiosInstance";
import { useAuth } from "../../context/AuthContext";
import "./Login.css";

const Login = () => {
  const [formData, setFormData] = useState({ username: "", password: "" });
  const [error, setError] = useState(null);
  const navigate = useNavigate();
  const { login } = useAuth();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const authHeader = `Basic ${btoa(
        `${formData.username}:${formData.password}`
      )}`;

      await axios.get("/api/persons/all", {
        headers: { Authorization: authHeader },
      });

      const userResponse = await axios.get("/api/auth/me", {
        headers: { Authorization: authHeader },
      });

      console.log("User response from /api/auth/me:", userResponse.data);

      const userData = {
        username: userResponse.data.username,
        role: userResponse.data.role,
        dateOfBirth: userResponse.data.dateOfBirth,
      };

      login(userData);
      localStorage.setItem("authHeader", authHeader);
      console.log("User data set in login:", userData);
      setError(null);
      navigate("/");
    } catch (err) {
      setError("Invalid username or password");
      console.error(err);
    }
  };

  return (
    <div className="lp-login-page">
      <div className="lp-login-container">
        <h2 className="lp-login-title">Login</h2>
        {error && <div className="lp-login-error">{error}</div>}
        <form onSubmit={handleSubmit} className="lp-login-form">
          <div className="lp-form-group">
            <label htmlFor="username">Username</label>
            <input
              type="text"
              id="username"
              name="username"
              value={formData.username}
              onChange={handleChange}
              required
              className="lp-login-input"
              placeholder="Enter username"
            />
          </div>
          <div className="lp-form-group">
            <label htmlFor="password">Password</label>
            <input
              type="password"
              id="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              required
              className="lp-login-input"
              placeholder="Enter password"
            />
          </div>
          <button type="submit" className="lp-submit-button">
            Login
          </button>
        </form>
        <p className="lp-register-link">
          Don’t have an account? <a href="/register">Register here</a>
        </p>
      </div>
    </div>
  );
};

export default Login;
