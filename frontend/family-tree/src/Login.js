import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "./axiosInstance";
import { useAuth } from "./AuthContext";

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
    <div style={{ textAlign: "center", padding: "20px" }}>
      <h2>Login</h2>
      {error && (
        <div style={{ color: "red", marginBottom: "10px" }}>{error}</div>
      )}
      <form onSubmit={handleSubmit}>
        <div>
          <label>Username: </label>
          <input
            type="text"
            name="username"
            value={formData.username}
            onChange={handleChange}
            required
          />
        </div>
        <div>
          <label>Password: </label>
          <input
            type="password"
            name="password"
            value={formData.password}
            onChange={handleChange}
            required
          />
        </div>
        <button type="submit" style={{ marginTop: "10px" }}>
          Login
        </button>
      </form>
      <p>
        Don’t have an account? <a href="/register">Register here</a>
      </p>
    </div>
  );
};

export default Login;
