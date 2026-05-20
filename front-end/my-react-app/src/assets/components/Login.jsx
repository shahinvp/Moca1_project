import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

const Login = () => {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    username: "",
    password: "",
  });

  const [loading, setLoading] =
    useState(false);

  const [error, setError] =
    useState("");

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]:
        e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    setLoading(true);
    setError("");

    try {
      const response =
        await fetch(
          import.meta.env.VITE_API_URL +
          "/login/",
          {
            method: "POST",

            headers: {
              "Content-Type":
                "application/json",
            },

            body: JSON.stringify(
              formData
            ),
          }
        );

      const data =
        await response.json();

      if (response.ok) {
        localStorage.removeItem(
          "logged_out"
        );

        localStorage.setItem(
          "token",
          data.token
        );

        localStorage.setItem(
          "user_id",
          data.user_id
        );

        localStorage.setItem(
          "username",
          data.username
        );

        localStorage.setItem(
          "role",
          data.role
        );

        if (
          data.role ===
          "manager"
        ) {
          navigate(
            "/manager-dashboard"
          );
        } else if (
          data.role ===
          "employee"
        ) {
          navigate(
            "/employee-dashboard"
          );
        } else {
          setError(
            "Invalid role"
          );
        }
      } else {
        setError(
          data.error ||
          "Login failed"
        );
      }
    } catch (err) {
      setError(
        "Server error. Please try again later."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.page}>
      <div style={styles.card}>
        <h2 style={styles.title}>
          Welcome Back
        </h2>

        <p style={styles.subtitle}>
          Login to your account
        </p>

        <form
          onSubmit={
            handleSubmit
          }
          style={styles.form}
        >
          <input
            style={
              styles.input
            }
            type="text"
            name="username"
            placeholder="Username"
            value={
              formData.username
            }
            onChange={
              handleChange
            }
            required
            autoComplete="username"
          />

          <input
            style={
              styles.input
            }
            type="password"
            name="password"
            placeholder="Password"
            value={
              formData.password
            }
            onChange={
              handleChange
            }
            required
            autoComplete="current-password"
          />

          <div style={styles.forgotPasswordContainer}>
            <Link to="/forgot-password" style={styles.forgotPasswordLink}>
              Forgot Password?
            </Link>
          </div>

          <button
            type="submit"
            disabled={
              loading
            }
            style={
              loading
                ? {
                  ...styles.button,
                  opacity: 0.7,
                  cursor:
                    "not-allowed",
                }
                : styles.button
            }
          >
            {loading
              ? "Logging in..."
              : "Login"}
          </button>
        </form>

        {error && (
          <p style={styles.error}>
            {error}
          </p>
        )}

        <p
          style={
            styles.registerText
          }
        >
          Don’t have an account?{" "}
          <Link
            to="/register"
            style={
              styles.registerLink
            }
          >
            Register here
          </Link>
        </p>
      </div>
    </div>
  );
};

const styles = {
  page: {
    height: "100vh",
    display: "flex",
    justifyContent:
      "center",
    alignItems:
      "center",
    background:
      "linear-gradient(135deg, #43cea2, #185a9d)",
    fontFamily:
      "Arial, sans-serif",
  },

  card: {
    width: "360px",
    padding: "35px",
    borderRadius: "16px",
    background: "#ffffff",
    textAlign: "center",
    boxShadow:
      "0 10px 25px rgba(0,0,0,0.2)",
  },

  title: {
    fontSize: "28px",
    marginBottom: "8px",
    color: "#333",
    fontWeight: "bold",
  },

  subtitle: {
    marginBottom: "25px",
    color: "#666",
    fontSize: "14px",
  },

  form: {
    display: "flex",
    flexDirection:
      "column",
    gap: "16px",
  },

  input: {
    padding: "12px",
    borderRadius: "8px",
    width: "100%",
    boxSizing:
      "border-box",
    border:
      "1px solid #ccc",
    fontSize: "15px",
    outline: "none",
    transition:
      "0.3s ease",
  },

  button: {
    padding: "12px",
    borderRadius: "8px",
    border: "none",
    color: "white",
    cursor: "pointer",
    width: "100%",
    boxSizing:
      "border-box",
    background:
      "linear-gradient(135deg, #667eea, #764ba2)",
    fontSize: "16px",
    fontWeight: "bold",
    transition:
      "0.3s ease",
  },

  error: {
    color: "red",
    marginTop: "12px",
    fontSize: "14px",
  },

  registerText: {
    marginTop: "18px",
    fontSize: "14px",
    color: "#555",
  },

  registerLink: {
    color: "#667eea",
    textDecoration:
      "none",
    fontWeight: "bold",
  },
  forgotPasswordContainer: {
    textAlign: "right",
    marginTop: "-8px",
  },
  forgotPasswordLink: {
    fontSize: "13px",
    color: "#667eea",
    textDecoration: "none",
    fontWeight: "500",
  },
};

export default Login;