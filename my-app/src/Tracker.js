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
    updated[today].push(newActivity.trim());
    setActivities(updated);
    setNewActivity("");
    setShowModal(false);
  };

  const sortedDates = Object.keys(activities).sort(
    (a, b) => new Date(b) - new Date(a)
  );

  return (
    <div className="tracker-container">
      <header className="tracker-header">
        <h1>Sankalp – Daily Activities</h1>
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
            <input
              type="text"
              value={newActivity}
              onChange={(e) => setNewActivity(e.target.value)}
              placeholder="What do you want to do today?"
            />
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
        {sortedDates.length === 0 ? (
          <div className="empty-state">
            <p>No activities added yet.</p>
            <p>
              Click <strong>+ Add Activity</strong> to start tracking your day!
            </p>
          </div>
        ) : (
          sortedDates.map((date) => (
            <div key={date} className="day-card">
              <h3>{date}</h3>
              <ul>
                {activities[date].map((act, i) => (
                  <li key={i}>{act}</li>
                ))}
              </ul>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export default Tracker;
