import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./Tracker.css";

function Tracker() {
  const navigate = useNavigate();

  const [activities, setActivities] = useState({});
  const [showModal, setShowModal] = useState(false);
  const [newActivity, setNewActivity] = useState("");

  const today = new Date().toLocaleDateString();

  const addActivity = () => {
    if (!newActivity.trim()) return;
    const updated = { ...activities };
    if (!updated[today]) updated[today] = [];
    updated[today].push({ text: newActivity.trim(), done: false });
    setActivities(updated);
    setNewActivity("");
    setShowModal(false);
  };

  const toggleDone = (index) => {
    const updated = { ...activities };
    updated[today][index].done = !updated[today][index].done;
    setActivities(updated);
  };

  return (
    <div className="tracker-container">
      <header className="tracker-header">
        <h1 style={{ color: "#0078ff" }}>Sankalp - Daily Activities</h1>
        <div className="header-actions">
          <button className="add-btn" onClick={() => setShowModal(true)}>
            + Add Activity
          </button>
          <button className="cta-btn" onClick={() => navigate("/")}>
            Back to Home
          </button>
        </div>
      </header>

      {/* Modal */}
      {showModal && (
        <div className="modal-overlay">
          <div className="modal">
            <h2>Add Activity for {today}</h2>
            <div className="input-wrapper">
              <input
                type="text"
                value={newActivity}
                onChange={(e) => setNewActivity(e.target.value)}
                placeholder="What do you want to do today?"
              />
            </div>
            <div className="modal-actions">
              <button onClick={addActivity}>Add</button>
              <button className="cancel" onClick={() => setShowModal(false)}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Cards */}
      <div className="cards-container">
        {activities[today] && activities[today].length > 0 ? (
          <div className="day-card">
            <h3>{today}</h3>
            <ul>
              {activities[today].map((act, i) => (
                <li
                  key={i}
                  className={`task-item ${act.done ? "done-task" : ""}`}
                  onClick={() => toggleDone(i)}
                >
                  <span>{act.text}</span>
                </li>
              ))}
            </ul>
          </div>
        ) : (
          <div className="empty-state">
            <p>No activities added yet.</p>
            <p>
              Click <strong>+ Add Activity</strong> to start tracking your day!
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

export default Tracker;