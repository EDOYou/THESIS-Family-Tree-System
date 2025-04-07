import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "../../services/axiosInstance";
import { useAuth } from "../../context/AuthContext";
import SockJS from "sockjs-client";
import Stomp from "stompjs";
import "./ChatPage.css";

const ChatPage = () => {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [error, setError] = useState(null);
  const [stompClient, setStompClient] = useState(null);
  const { user, logout } = useAuth();
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

    const socket = new SockJS("http://localhost:8080/ws");
    const client = Stomp.over(socket);
    client.connect(
      {},
      (frame) => {
        console.log("Connected to WebSocket:", frame);
        setStompClient(client);

        client.subscribe("/topic/messages", (message) => {
          const receivedMessage = JSON.parse(message.body);
          setMessages((prevMessages) => {
            if (prevMessages.some((msg) => msg.id === receivedMessage.id)) {
              return prevMessages;
            }
            return [...prevMessages, receivedMessage];
          });
        });
      },
      (error) => {
        console.error("WebSocket connection error:", error);
        setError("Failed to connect to chat server.");
      }
    );

    return () => {
      if (client && client.connected) {
        client.disconnect(() => {
          console.log("Disconnected from WebSocket");
        });
      }
    };
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

      if (!user || !user.username) {
        setError("User information not available. Please log in again.");
        logout();
        navigate("/login");
        return;
      }

      const message = {
        content: newMessage,
        senderUsername: user.username,
      };

      if (stompClient && stompClient.connected) {
        stompClient.send("/app/chat.sendMessage", {}, JSON.stringify(message));
        setNewMessage("");
        setError(null);
      } else {
        setError("Chat server is not connected. Please try again later.");
      }
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
    <div className="cp-chat-page">
      <div className="cp-chat-container">
        <header className="cp-chat-header">
          <h1 className="cp-chat-title">Family Chat</h1>
        </header>
        {error && <div className="cp-chat-error">{error}</div>}
        <div className="cp-messages-container">
          {messages.map((message) => (
            <div key={message.id} className="cp-message-item">
              <span className="cp-message-sender">
                {message.senderUsername || "Unknown"}:
              </span>{" "}
              <span className="cp-message-content">{message.content}</span>{" "}
              <span className="cp-message-timestamp">
                ({new Date(message.timestamp).toLocaleString()})
              </span>
            </div>
          ))}
        </div>
        <form onSubmit={handleSendMessage} className="cp-message-form">
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Type your message..."
            className="cp-message-input"
          />
          <button type="submit" className="cp-send-button">
            Send
          </button>
        </form>
      </div>
    </div>
  );
};

export default ChatPage;
