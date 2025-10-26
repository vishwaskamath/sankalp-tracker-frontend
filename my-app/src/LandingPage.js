import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./App.css";
import "./LandingPage.css";

function LandingPage() {
  const navigate = useNavigate();
  const [showRegister, setShowRegister] = useState(false);
  const [showSignin, setShowSignin] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [saving, setSaving] = useState(false);

  // signin state
  const [signinEmail, setSigninEmail] = useState("");
  const [signinPassword, setSigninPassword] = useState("");
  const [signingIn, setSigningIn] = useState(false);
  const [signinError, setSigninError] = useState("");

  // Check if user is logged in
  const user = localStorage.getItem("user");
  const parsedUser = user ? JSON.parse(user) : null;
  return (
    <div className="App">
      <nav className="navbar">
        <h1 className="logo" style={{ color: "#0078ff" }}>
          Sankalp - start your sankalp today!
        </h1>
        <div className="nav-actions">
          {!parsedUser ? (
            <>
              <button className="nav-btn" onClick={() => setShowRegister(true)}>
                Sign up
              </button>
              <button
                className="nav-btn outline"
                onClick={() => setShowSignin(true)}
              >
                Sign in
              </button>
            </>
          ) : (
            <>
              <span className="welcome-user">
                Welcome, {parsedUser.username || parsedUser.email || "User"}
              </span>
              <button
                className="nav-btn logout"
                style={{ marginLeft: "1rem", background: "#fff", color: "#0078ff", border: "1px solid #0078ff" }}
                onClick={() => {
                  localStorage.clear();
                  window.location.reload();
                }}
              >
                Log out
              </button>
            </>
          )}
        </div>
      </nav>

      <section className="hero">
        <div className="hero-left">
          <h2>Build Better Habits</h2>
          <p>
            Stay consistent, stay motivated — track your progress every day.
            Create small routines that compound into big results.
          </p>
          {/* Only show Start Tracking button if user is logged in */}
          {parsedUser && (
            <div className="hero-actions">
              <button className="cta-btn" onClick={() => navigate("/tracker")}>
                Start Tracking
              </button>
            </div>
          )}
        </div>
        <div className="hero-right">
          {/* hero illustration from public assets */}
          <img src="/goal4.jpg" alt="goals" className="hero-illustration" />
        </div>
      </section>

      <section className="features grid">
        <div className="feature card">
          <img src="/goal1.jpg" alt="hobby" className="feature-img" />
          <h3>Set clear goals</h3>
          <p>
            Break big dreams into daily actions. Create goals tied to what
            matters and watch progress stack up.
          </p>
        </div>
        <div className="feature card">
          <img src="/goal2.jpg" alt="activity" className="feature-img" />
          <h3>Track activities</h3>
          <p>
            Log habits and activities with one click. Understand what you
            actually do, not what you plan to do.
          </p>
        </div>
        <div className="feature card">
          <img src="/goal3.jpg" alt="motivation" className="feature-img" />
          <h3>Stay motivated</h3>
          <p>
            Celebrate streaks and small wins. Momentum is built through
            consistency, one day at a time.
          </p>
        </div>
      </section>

      <footer className="footer">
        <p>© {new Date().getFullYear()} Sankalp. All rights reserved.</p>
      </footer>

      {/* Signin Modal */}
      {showSignin && (
        <div
          className="modal-overlay"
          onClick={() => !signingIn && setShowSignin(false)}
        >
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h2>Sign in</h2>
            <p className="muted">Enter your email and password to sign in.</p>
            {signinError && <div className="form-error">{signinError}</div>}
            <div className="form-row">
              <label>Email</label>
              <input
                value={signinEmail}
                onChange={(e) => setSigninEmail(e.target.value)}
                placeholder="name@example.com"
              />
            </div>
            <div className="form-row">
              <label>Password</label>
              <input
                type="password"
                value={signinPassword}
                onChange={(e) => setSigninPassword(e.target.value)}
                placeholder="Your password"
              />
            </div>
            <div className="modal-actions">
              <button
                className="cta-btn"
                onClick={async () => {
                  if (!signinEmail.trim())
                    return setSigninError("Please enter your email");
                  if (!signinPassword)
                    return setSigninError("Please enter your password");
                  setSigningIn(true);
                  setSigninError("");
                  const LOGIN_MUTATION = `mutation LoginUser($email: String!, $password: String!) {
                  loginUser(email: $email, password: $password) { userId username email }
                }`;
                  try {
                    const res = await fetch(
                      process.env.REACT_APP_GRAPHQL_ENDPOINT || "/graphql",
                      {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({
                          query: LOGIN_MUTATION,
                          variables: {
                            email: signinEmail.trim(),
                            password: signinPassword,
                          },
                        }),
                      }
                    );
                    const json = await res.json();
                    if (json.errors) {
                      // backend will throw runtime exception for non-registered users
                      throw new Error(
                        json.errors.map((e) => e.message).join("; ")
                      );
                    }
                    const data = json.data || {};
                    const user = data.loginUser;
                    const userId = user && user.userId;
                    if (!userId) throw new Error("Invalid login response");
                    const storedUser = {
                      userId,
                      username: user.username || "",
                      email: user.email || signinEmail.trim(),
                    };
                    localStorage.setItem("user", JSON.stringify(storedUser));
                    localStorage.setItem("userId", userId);
                    setSigningIn(false);
                    setShowSignin(false);
                    navigate("/tracker");
                  } catch (err) {
                    console.error("Login failed", err);
                    setSigninError(
                      "Login failed: user not registered or wrong credentials"
                    );
                    setSigningIn(false);
                  }
                }}
                disabled={signingIn}
              >
                Sign in
              </button>
              <button
                className="cancel"
                onClick={() => !signingIn && setShowSignin(false)}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Register Modal */}
      {showRegister && (
        <div
          className="modal-overlay"
          onClick={() => !saving && setShowRegister(false)}
        >
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h2>Create an account</h2>
            <p className="muted">
              Quick sign up — Please enter below details.
            </p>
            <div className="form-row">
              <label>Username</label>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Your good name please?"
              />
            </div>
            <div className="form-row">
              <label>Email</label>
              <input
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@example.com"
              />
            </div>
            <div className="form-row">
              <label>Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Choose a password"
              />
            </div>
            <div className="modal-actions">
              <button
                className="cta-btn"
                onClick={async () => {
                  if (!name.trim()) return alert("Please enter a username");
                  if (!password) return alert("Please enter a password");
                  setSaving(true);
                  const REGISTER_MUTATION = `mutation RegisterUser($username: String!, $email: String!, $password: String!) {
                    registerUser(username: $username, email: $email, password: $password) { userId username email }
                  }`;
                  try {
                    const res = await fetch(
                      process.env.REACT_APP_GRAPHQL_ENDPOINT || "/graphql",
                      {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({
                          query: REGISTER_MUTATION,
                          variables: {
                            username: name.trim(),
                            email: email.trim(),
                            password,
                          },
                        }),
                      }
                    );
                    const json = await res.json();
                    if (json.errors)
                      throw new Error(
                        json.errors.map((e) => e.message).join("; ")
                      );
                    const data = json.data || {};
                    // parse registerUser response
                    const user = data.registerUser;
                    const userId = user && user.userId;
                    if (!userId)
                      throw new Error("No userId returned from server");
                    const storedUser = {
                      userId,
                      username: user.username || name.trim(),
                      email: user.email || email.trim(),
                    };
                    localStorage.setItem("user", JSON.stringify(storedUser));
                    localStorage.setItem("userId", userId);
                    setSaving(false);
                    setShowRegister(false);
                    navigate("/tracker");
                  } catch (err) {
                    console.error("Registration failed", err);
                    alert("Registration failed: " + (err.message || err));
                    setSaving(false);
                  }
                }}
                disabled={saving}
              >
                Create Account
              </button>
              <button
                className="cancel"
                onClick={() => !saving && setShowRegister(false)}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
export default LandingPage;
