import React from "react";
import axios from "axios";
import { useForm } from "react-hook-form";
import { Link, useNavigate } from "react-router-dom";

const Register = () => {
  const navigate = useNavigate(); // 🔥 added

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
  } = useForm();

  const onSubmit = async (data) => {
    try {
      const response = await axios.post(
        import.meta.env.VITE_API_URL + "/register/",
        data
      );

      alert(response.data.message);
      reset();

      // 🔥 redirect to login page after success
      navigate("/login");

    } catch (error) {
      if (error.response && error.response.data) {
        console.log(error.response.data);
        alert("Registration failed. Check inputs.");
      } else {
        alert("Server error. Try again later.");
      }
    }
  };

  return (
    <div style={styles.page}>
      <div style={styles.card}>
        <h2 style={styles.title}>Create Account</h2>
        <p style={styles.subtitle}>Sign up to get started</p>

        <form onSubmit={handleSubmit(onSubmit)} style={styles.form}>

          <div style={styles.field}>
            <input
              style={styles.input}
              type="text"
              placeholder="Username"
              {...register("username", { required: "Username is required" })}
            />
            {errors.username && (
              <p style={styles.error}>{errors.username.message}</p>
            )}
          </div>

          <div style={styles.field}>
            <input
              style={styles.input}
              type="email"
              placeholder="Email"
              {...register("email", { required: "Email is required" })}
            />
            {errors.email && (
              <p style={styles.error}>{errors.email.message}</p>
            )}
          </div>

          <div style={styles.field}>
            <input
              style={styles.input}
              type="password"
              placeholder="Password"
              {...register("password", { required: "Password is required" })}
            />
            {errors.password && (
              <p style={styles.error}>{errors.password.message}</p>
            )}
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            style={{
              ...styles.button,
              ...(isSubmitting ? styles.buttonDisabled : {}),
            }}
          >
            {isSubmitting ? "Registering..." : "Register"}
          </button>

          <p style={styles.registerText}>
            Already have an account?{" "}
            <Link to="/login" style={styles.registerLink}>
              Login here
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
};

const styles = {
  page: {
    height: "100vh",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    background: "linear-gradient(135deg, #43cea2, #185a9d)",
    fontFamily: "Segoe UI, sans-serif",
  },

  card: {
    width: "340px",
    padding: "35px",
    borderRadius: "14px",
    background: "#ffffff",
    boxShadow: "0 15px 35px rgba(0,0,0,0.15)",
    textAlign: "center",
  },

  title: {
    margin: 0,
    fontSize: "24px",
    fontWeight: "600",
    color: "#222",
  },

  subtitle: {
    margin: "8px 0 20px",
    fontSize: "14px",
    color: "#777",
  },

  form: {
    display: "flex",
    flexDirection: "column",
    gap: "15px",
  },

  field: {
    display: "flex",
    flexDirection: "column",
    alignItems: "flex-start",
  },

  input: {
    width: "100%",
    padding: "12px",
    borderRadius: "8px",
    border: "1px solid #ddd",
    fontSize: "14px",
    outline: "none",
    boxSizing: "border-box",
  },

  button: {
    marginTop: "10px",
    padding: "12px",
    borderRadius: "8px",
    border: "none",
    background: "linear-gradient(135deg, #667eea, #764ba2)",
    color: "#fff",
    fontWeight: "600",
    fontSize: "15px",
    cursor: "pointer",
    boxSizing: "border-box",
  },

  buttonDisabled: {
    background: "#bbb",
    cursor: "not-allowed",
  },

  error: {
    marginTop: "5px",
    fontSize: "12px",
    color: "red",
  },
};

export default Register;