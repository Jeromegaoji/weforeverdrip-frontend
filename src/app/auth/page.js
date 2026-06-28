"use client";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Navbar from "../components/Navbar";

const BASE_URL = "https://weforeverdrip.fly.dev";

export default function AuthPage() {
  const router = useRouter();
  const cursorRef = useRef(null);

  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  // Login form state
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");

  // Register form state
  const [registerFirstName, setRegisterFirstName] = useState("");
  const [registerLastName, setRegisterLastName] = useState("");
  const [registerEmail, setRegisterEmail] = useState("");
  const [registerPassword, setRegisterPassword] = useState("");

  useEffect(() => {
    const move = (e) => {
      if (cursorRef.current) {
        cursorRef.current.style.left = e.clientX + "px";
        cursorRef.current.style.top = e.clientY + "px";
      }
    };
    window.addEventListener("mousemove", move);
    return () => window.removeEventListener("mousemove", move);
  }, []);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!loginEmail || !loginPassword) {
      setError("Please fill in all fields");
      return;
    }

    try {
      setLoading(true);
      const response = await fetch(
        `${BASE_URL}/api/v1/auth/login/`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email: loginEmail,
            password: loginPassword,
          }),
        },
      );

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.detail || "Invalid email or password");
      }

      const data = await response.json();
      localStorage.setItem("wfd_access", data.access);
      localStorage.setItem("wfd_refresh", data.refresh);
      setSuccess("Login successful! Redirecting...");
      setTimeout(() => {
        router.push("/products");
      }, 1000);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (
      !registerFirstName ||
      !registerLastName ||
      !registerEmail ||
      !registerPassword
    ) {
      setError("Please fill in all fields");
      return;
    }

    try {
      setLoading(true);
      const response = await fetch(
        `${BASE_URL}/api/v1/auth/register/`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            first_name: registerFirstName,
            last_name: registerLastName,
            email: registerEmail,
            password: registerPassword,
          }),
        },
      );

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.detail || "Registration failed");
      }

      const data = await response.json();
      localStorage.setItem("wfd_access", data.access);
      localStorage.setItem("wfd_refresh", data.refresh);
      setSuccess("Account created! Redirecting...");
      setTimeout(() => {
        router.push("/products");
      }, 1000);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        background: "var(--black)",
        minHeight: "100vh",
        color: "var(--cream)",
      }}
    >
      <div ref={cursorRef} className="cursor" />
      <Navbar cartCount={0} />

      <div
        style={{
          paddingTop: "7.5rem",
          paddingLeft: "3rem",
          paddingRight: "3rem",
          paddingBottom: "6rem",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          minHeight: "calc(100vh - 120px)",
        }}
      >
        <div
          style={{
            maxWidth: "500px",
            width: "100%",
          }}
        >
          {/* TABS */}
          <div
            style={{
              display: "flex",
              gap: "2rem",
              marginBottom: "3rem",
              borderBottom: "1px solid #222",
              paddingBottom: "1.5rem",
            }}
          >
            <button
              onClick={() => {
                setIsLogin(true);
                setError(null);
                setSuccess(null);
              }}
              style={{
                fontFamily: "var(--font-barlow-condensed)",
                fontSize: "0.85rem",
                letterSpacing: "0.2em",
                textTransform: "uppercase",
                border: "none",
                background: "transparent",
                color: isLogin ? "var(--cream)" : "rgba(240,235,224,0.5)",
                cursor: "pointer",
                paddingBottom: "1rem",
                borderBottom: isLogin ? "2px solid var(--red)" : "none",
                transition: "all 0.3s",
              }}
            >
              Login
            </button>
            <button
              onClick={() => {
                setIsLogin(false);
                setError(null);
                setSuccess(null);
              }}
              style={{
                fontFamily: "var(--font-barlow-condensed)",
                fontSize: "0.85rem",
                letterSpacing: "0.2em",
                textTransform: "uppercase",
                border: "none",
                background: "transparent",
                color: !isLogin ? "var(--cream)" : "rgba(240,235,224,0.5)",
                cursor: "pointer",
                paddingBottom: "1rem",
                borderBottom: !isLogin ? "2px solid var(--red)" : "none",
                transition: "all 0.3s",
              }}
            >
              Register
            </button>
          </div>

          {/* ERROR MESSAGE */}
          {error && (
            <div
              style={{
                background: "#1a0000",
                border: "1px solid var(--red)",
                padding: "1rem",
                marginBottom: "2rem",
                fontFamily: "var(--font-barlow-condensed)",
                fontSize: "0.9rem",
                color: "var(--red)",
              }}
            >
              {error}
            </div>
          )}

          {/* SUCCESS MESSAGE */}
          {success && (
            <div
              style={{
                background: "#001a00",
                border: "1px solid #00cc00",
                padding: "1rem",
                marginBottom: "2rem",
                fontFamily: "var(--font-barlow-condensed)",
                fontSize: "0.9rem",
                color: "#00cc00",
              }}
            >
              {success}
            </div>
          )}

          {/* LOGIN FORM */}
          {isLogin && (
            <form onSubmit={handleLogin}>
              <div style={{ marginBottom: "1.5rem" }}>
                <label
                  style={{
                    display: "block",
                    fontFamily: "var(--font-barlow-condensed)",
                    fontSize: "0.85rem",
                    letterSpacing: "0.1em",
                    textTransform: "uppercase",
                    marginBottom: "0.5rem",
                    opacity: 0.8,
                  }}
                >
                  Email
                </label>
                <input
                  type="email"
                  value={loginEmail}
                  onChange={(e) => setLoginEmail(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "0.75rem 1rem",
                    background: "#111",
                    border: "1px solid #222",
                    color: "var(--cream)",
                    fontSize: "1rem",
                    fontFamily: "var(--font-barlow)",
                    boxSizing: "border-box",
                    transition: "border 0.3s",
                  }}
                  onFocus={(e) => {
                    e.target.style.borderColor = "var(--red)";
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = "#222";
                  }}
                />
              </div>

              <div style={{ marginBottom: "2rem" }}>
                <label
                  style={{
                    display: "block",
                    fontFamily: "var(--font-barlow-condensed)",
                    fontSize: "0.85rem",
                    letterSpacing: "0.1em",
                    textTransform: "uppercase",
                    marginBottom: "0.5rem",
                    opacity: 0.8,
                  }}
                >
                  Password
                </label>
                <input
                  type="password"
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "0.75rem 1rem",
                    background: "#111",
                    border: "1px solid #222",
                    color: "var(--cream)",
                    fontSize: "1rem",
                    fontFamily: "var(--font-barlow)",
                    boxSizing: "border-box",
                    transition: "border 0.3s",
                  }}
                  onFocus={(e) => {
                    e.target.style.borderColor = "var(--red)";
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = "#222";
                  }}
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                style={{
                  width: "100%",
                  background: "var(--red)",
                  color: "var(--cream)",
                  fontFamily: "var(--font-barlow-condensed)",
                  fontSize: "0.85rem",
                  letterSpacing: "0.2em",
                  textTransform: "uppercase",
                  border: "none",
                  padding: "1rem",
                  cursor: loading ? "not-allowed" : "pointer",
                  transition: "background 0.3s",
                  opacity: loading ? 0.6 : 1,
                }}
                onMouseEnter={(e) => {
                  if (!loading) e.currentTarget.style.background = "#c71609";
                }}
                onMouseLeave={(e) => {
                  if (!loading) e.currentTarget.style.background = "var(--red)";
                }}
              >
                {loading ? "LOGGING IN..." : "LOGIN"}
              </button>
            </form>
          )}

          {/* REGISTER FORM */}
          {!isLogin && (
            <form onSubmit={handleRegister}>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: "1rem",
                  marginBottom: "1.5rem",
                }}
              >
                <div>
                  <label
                    style={{
                      display: "block",
                      fontFamily: "var(--font-barlow-condensed)",
                      fontSize: "0.85rem",
                      letterSpacing: "0.1em",
                      textTransform: "uppercase",
                      marginBottom: "0.5rem",
                      opacity: 0.8,
                    }}
                  >
                    First Name
                  </label>
                  <input
                    type="text"
                    value={registerFirstName}
                    onChange={(e) => setRegisterFirstName(e.target.value)}
                    style={{
                      width: "100%",
                      padding: "0.75rem 1rem",
                      background: "#111",
                      border: "1px solid #222",
                      color: "var(--cream)",
                      fontSize: "1rem",
                      fontFamily: "var(--font-barlow)",
                      boxSizing: "border-box",
                      transition: "border 0.3s",
                    }}
                    onFocus={(e) => {
                      e.target.style.borderColor = "var(--red)";
                    }}
                    onBlur={(e) => {
                      e.target.style.borderColor = "#222";
                    }}
                  />
                </div>
                <div>
                  <label
                    style={{
                      display: "block",
                      fontFamily: "var(--font-barlow-condensed)",
                      fontSize: "0.85rem",
                      letterSpacing: "0.1em",
                      textTransform: "uppercase",
                      marginBottom: "0.5rem",
                      opacity: 0.8,
                    }}
                  >
                    Last Name
                  </label>
                  <input
                    type="text"
                    value={registerLastName}
                    onChange={(e) => setRegisterLastName(e.target.value)}
                    style={{
                      width: "100%",
                      padding: "0.75rem 1rem",
                      background: "#111",
                      border: "1px solid #222",
                      color: "var(--cream)",
                      fontSize: "1rem",
                      fontFamily: "var(--font-barlow)",
                      boxSizing: "border-box",
                      transition: "border 0.3s",
                    }}
                    onFocus={(e) => {
                      e.target.style.borderColor = "var(--red)";
                    }}
                    onBlur={(e) => {
                      e.target.style.borderColor = "#222";
                    }}
                  />
                </div>
              </div>

              <div style={{ marginBottom: "1.5rem" }}>
                <label
                  style={{
                    display: "block",
                    fontFamily: "var(--font-barlow-condensed)",
                    fontSize: "0.85rem",
                    letterSpacing: "0.1em",
                    textTransform: "uppercase",
                    marginBottom: "0.5rem",
                    opacity: 0.8,
                  }}
                >
                  Email
                </label>
                <input
                  type="email"
                  value={registerEmail}
                  onChange={(e) => setRegisterEmail(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "0.75rem 1rem",
                    background: "#111",
                    border: "1px solid #222",
                    color: "var(--cream)",
                    fontSize: "1rem",
                    fontFamily: "var(--font-barlow)",
                    boxSizing: "border-box",
                    transition: "border 0.3s",
                  }}
                  onFocus={(e) => {
                    e.target.style.borderColor = "var(--red)";
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = "#222";
                  }}
                />
              </div>

              <div style={{ marginBottom: "2rem" }}>
                <label
                  style={{
                    display: "block",
                    fontFamily: "var(--font-barlow-condensed)",
                    fontSize: "0.85rem",
                    letterSpacing: "0.1em",
                    textTransform: "uppercase",
                    marginBottom: "0.5rem",
                    opacity: 0.8,
                  }}
                >
                  Password
                </label>
                <input
                  type="password"
                  value={registerPassword}
                  onChange={(e) => setRegisterPassword(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "0.75rem 1rem",
                    background: "#111",
                    border: "1px solid #222",
                    color: "var(--cream)",
                    fontSize: "1rem",
                    fontFamily: "var(--font-barlow)",
                    boxSizing: "border-box",
                    transition: "border 0.3s",
                  }}
                  onFocus={(e) => {
                    e.target.style.borderColor = "var(--red)";
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = "#222";
                  }}
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                style={{
                  width: "100%",
                  background: "var(--red)",
                  color: "var(--cream)",
                  fontFamily: "var(--font-barlow-condensed)",
                  fontSize: "0.85rem",
                  letterSpacing: "0.2em",
                  textTransform: "uppercase",
                  border: "none",
                  padding: "1rem",
                  cursor: loading ? "not-allowed" : "pointer",
                  transition: "background 0.3s",
                  opacity: loading ? 0.6 : 1,
                }}
                onMouseEnter={(e) => {
                  if (!loading) e.currentTarget.style.background = "#c71609";
                }}
                onMouseLeave={(e) => {
                  if (!loading) e.currentTarget.style.background = "var(--red)";
                }}
              >
                {loading ? "CREATING ACCOUNT..." : "REGISTER"}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}