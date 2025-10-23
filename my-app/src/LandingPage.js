import React from "react";
import { useNavigate } from "react-router-dom";
import "./App.css";

function LandingPage() {
  const navigate = useNavigate();

  return (
    <div className="App">
      <nav className="navbar">
        <h1 className="logo">Sankalp - start your sankalp today!</h1>
      </nav>

      <section className="hero">
        <h2>Build Better Habits</h2>
        <p>Stay consistent, stay motivated — track your progress every day.</p>
        <button className="cta-btn" onClick={() => navigate("/tracker")}>
          Start Tracking
        </button>
      </section>

      <section className="features">
        <div className="feature">
          <h3>Simple Interface</h3>
          <p>Track your habits effortlessly with a clean and minimal layout.</p>
        </div>
        <div className="feature">
          <h3>Daily Reminders</h3>
          <p>Never miss a habit — gentle reminders keep you on track.</p>
        </div>
        <div className="feature">
          <h3>Progress Insights</h3>
          <p>Visualize your consistency and celebrate your progress.</p>
        </div>
      </section>

      <footer className="footer">
        <p>© {new Date().getFullYear()} Sankalp. All rights reserved.</p>
      </footer>
    </div>
  );
}

export default LandingPage;
