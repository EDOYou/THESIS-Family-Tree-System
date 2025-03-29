import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "./axiosInstance";
import { useAuth } from "./AuthContext";

const ChatPage = () => {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [error, setError] = useState(null);
  const { logout } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchMessages = async () => {
      try {
        const authHeader = localStorage.getItem("authHeader");
        if (!authHeader) {
          setError("Not authenticated. Please log in.");
          logout();
          navigate("/login");
          return;
        }

        const response = await axios.get("/api/messages", {
          headers: {
            Authorization: authHeader,
          },
        });
        setMessages(response.data);
        setError(null);
      } catch (error) {
        console.error("Error fetching messages:", error);
        if (error.response && error.response.status === 401) {
          setError("Session expired. Please log in again.");
          logout();
          navigate("/login");
        } else {
          setError("Failed to load messages. Please try again.");
        }
      }
    };

    fetchMessages();
    const interval = setInterval(fetchMessages, 5000);

    return () => clearInterval(interval);
  }, [logout, navigate]);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    try {
      const authHeader = localStorage.getItem("authHeader");
      if (!authHeader) {
        setError("Not authenticated. Please log in.");
        logout();
        navigate("/login");
        return;
      }

      const response = await axios.post(
        "/api/messages",
        { content: newMessage },
        {
          headers: {
            Authorization: authHeader,
          },
        }
      );
      setMessages([...messages, response.data]);
      setNewMessage("");
      setError(null);
    } catch (error) {
      console.error("Error sending message:", error);
      if (error.response && error.response.status === 401) {
        setError("Session expired. Please log in again.");
        logout();
        navigate("/login");
      } else {
        setError("Failed to send message. Please try again.");
      }
    }
  };

  return (
    <div style={{ padding: "20px", textAlign: "center" }}>
      <h1>Family Chat</h1>
      {error && (
        <div style={{ color: "red", marginBottom: "10px" }}>{error}</div>
      )}
      <div
        style={{
          border: "1px solid #ccc",
          padding: "10px",
          height: "400px",
          overflowY: "scroll",
          marginBottom: "20px",
          backgroundColor: "#f9f9f9",
        }}
      >
        {messages.map((message) => (
          <div
            key={message.id}
            style={{ marginBottom: "10px", textAlign: "left" }}
          >
            <strong>{message.senderUsername || "Unknown"}:</strong>{" "}
            {message.content}{" "}
            <em>({new Date(message.timestamp).toLocaleString()})</em>
          </div>
        ))}
      </div>
      <form onSubmit={handleSendMessage}>
        <input
          type="text"
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          placeholder="Type your message..."
          style={{ width: "80%", padding: "5px" }}
        />
        <button
          type="submit"
          style={{ padding: "5px 10px", marginLeft: "10px" }}
        >
          Send
        </button>
      </form>
    </div>
  );
};

export default ChatPage;
