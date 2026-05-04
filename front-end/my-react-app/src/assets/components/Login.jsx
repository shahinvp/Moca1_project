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
          "http://127.0.0.1:8000/login/",
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

        }
        else if (
          data.role ===
          "employee"
        ) {

          navigate(
            "/employee-dashboard"
          );

        }
        else {

          setError(
            "Invalid role"
          );

        }

      }
      else {

        setError(
          data.error
        );

      }

    }
    catch (err) {

      setError(
        "Server error. Please try again later."
      );

    }
    finally {

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
          />

          <button
            type="submit"
            disabled={
              loading
            }
            style={
              styles.button
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
  },

  card: {
    width: "340px",
    padding: "35px",
    borderRadius: "14px",
    background:
      "#ffffff",
    textAlign:
      "center",
  },

  title: {
    fontSize: "24px",
  },

  subtitle: {
    marginBottom:
      "20px",
  },

  form: {
    display: "flex",
    flexDirection:
      "column",
    gap: "15px",
  },

  input: {
    padding: "12px",
    borderRadius:
      "8px",
  },

  button: {
    padding: "12px",
    borderRadius:
      "8px",
    border: "none",
    color: "white",
    cursor: "pointer",
    background:
      "linear-gradient(135deg, #667eea, #764ba2)",
  },

  error: {
    color: "red",
    marginTop: "10px",
  },

  registerText: {
    marginTop: "15px",
  },

  registerLink: {
    color: "#667eea",
  },
};

export default Login;
