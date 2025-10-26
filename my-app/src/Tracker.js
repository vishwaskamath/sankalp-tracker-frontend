import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./Tracker.css";

// Habit scheduling helpers
function shouldShowHabitToday(habit, today) {
  const createdDate = new Date(habit.createdDate);
  const currentDate = new Date(today);

  // Don't show habits before their creation date
  if (createdDate > currentDate) return false;

  switch (habit.recurrence) {
    case "daily":
      return true;

    case "weekly":
      // Check if it's been a week since creation
      const weekDiff = Math.floor(
        (currentDate - createdDate) / (7 * 24 * 60 * 60 * 1000)
      );
      return weekDiff >= 0;

    case "monthly":
      // Show on the same date each month
      return createdDate.getDate() === currentDate.getDate();

    default:
      return false;
  }
}

function getHabitProgress(habit) {
  const completions = habit.completions || [];
  const totalCompletions = completions.length;
  const goalProgress = Math.round((totalCompletions / habit.goal) * 100);

  // Calculate streak
  let currentStreak = 0;
  const sortedDates = [...completions]
    .sort((a, b) => new Date(b.date) - new Date(a.date))
    .map((c) => c.date);

  if (sortedDates.length > 0) {
    currentStreak = 1;
    for (let i = 1; i < sortedDates.length; i++) {
      const prevDate = new Date(sortedDates[i - 1]);
      const currDate = new Date(sortedDates[i]);
      const dayDiff = (prevDate - currDate) / (24 * 60 * 60 * 1000);

      if (dayDiff === 1) {
        currentStreak++;
      } else {
        break;
      }
    }
  }

  return {
    progress: goalProgress,
    streak: currentStreak,
    total: totalCompletions,
  };
}

// Minimal GraphQL helper using fetch
const GRAPHQL_ENDPOINT = process.env.REACT_APP_GRAPHQL_ENDPOINT || "/graphql";

async function gql(query, variables = {}) {
  const res = await fetch(GRAPHQL_ENDPOINT, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ query, variables }),
  });
  const json = await res.json();
  if (json.errors)
    throw new Error(json.errors.map((e) => e.message).join("; "));
  return json.data;
}

function Tracker({ userId: propUserId }) {
  const navigate = useNavigate();

  // userId can come from prop (preferred) or localStorage (fallback)
  const userId = propUserId || localStorage.getItem("userId") || 1;

  // Get user info from localStorage
  const userInfo = (() => {
    try {
      return JSON.parse(localStorage.getItem("user")) || {};
    } catch (err) {
      console.error("Failed to parse user info:", err);
      return {};
    }
  })();

  // Get today's date in local timezone, formatted as YYYY-MM-DD
  const todayISO = new Date().toLocaleString("en-CA", {
    // en-CA gives YYYY-MM-DD format
    timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });

  // Storage key for today's completed items
  const STORAGE_KEY = `completed-${todayISO}`;

  const [activities, setActivities] = useState([]); // today's activities
  const [habits, setHabits] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [newActivity, setNewActivity] = useState("");
  const [showHabitModal, setShowHabitModal] = useState(false);
  const [newHabitText, setNewHabitText] = useState("");
  const [newHabitRecurrence, setNewHabitRecurrence] = useState("daily");
  const [newHabitGoal, setNewHabitGoal] = useState(1);
  const [completedToday, setCompletedToday] = useState(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      return new Set(stored ? JSON.parse(stored) : []);
    } catch (err) {
      console.error("Failed to load completed items:", err);
      return new Set();
    }
  });

  // Persist completed items to localStorage whenever they change
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify([...completedToday]));
    } catch (err) {
      console.error("Failed to save completed items:", err);
    }
  }, [completedToday, STORAGE_KEY]);

  // Queries & Mutations
  const GET_TODAYS = `query GetTodays($userId: ID!) {
    getTodaysActivities(userId: $userId) { activityId text done date }
    getTodaysHabits(userId: $userId) { habitId text recurrence goal createdDate completions { completionId date } }
  }`;

  const ADD_ACTIVITY = `mutation AddActivity($text: String!, $userId: ID!) {
    addActivity(text: $text, userId: $userId) { activityId text done date }
  }`;

  const ADD_HABIT = `mutation AddHabit($text: String!, $recurrence: String!, $goal: Int!, $userId: ID!) {
    addHabit(text: $text, recurrence: $recurrence, goal: $goal, userId: $userId) { habitId text recurrence goal createdDate }
  }`;

  const TOGGLE_ACTIVITY = `mutation ToggleActivity($activityId: ID!) {
    toggleActivityDone(activityId: $activityId) { activityId text done date }
  }`;

  const TOGGLE_HABIT = `mutation ToggleHabit($habitId: ID!) {
    toggleHabitDone(habitId: $habitId) { habitId text recurrence goal createdDate completions { completionId date } }
  }`;

  async function loadData() {
    if (!userId) return;
    try {
      const data = await gql(GET_TODAYS, { userId });
      setActivities(data.getTodaysActivities || []);
      setHabits(data.getTodaysHabits || []);
    } catch (err) {
      console.error("Failed to load data", err.message || err);
    }
  }

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  async function handleAddActivity() {
    if (!newActivity.trim() || !userId) return;
    try {
      const data = await gql(ADD_ACTIVITY, {
        text: newActivity.trim(),
        userId,
      });
      setActivities((prev) => [...prev, data.addActivity]);
      setNewActivity("");
      setShowModal(false);
    } catch (err) {
      console.error("Add activity failed", err.message || err);
    }
  }

  async function handleAddHabit() {
    if (!newHabitText.trim() || !userId) return;
    try {
      const data = await gql(ADD_HABIT, {
        text: newHabitText.trim(),
        recurrence: newHabitRecurrence,
        goal: Number(newHabitGoal),
        userId,
      });
      setHabits((prev) => [...prev, data.addHabit]);
      setNewHabitText("");
      setNewHabitRecurrence("daily");
      setNewHabitGoal(1);
      setShowHabitModal(false);
    } catch (err) {
      console.error("Add habit failed", err.message || err);
    }
  }

  async function handleToggleActivity(activityId) {
    const activity = activities.find((a) => a.activityId === activityId);

    // If already done today, show feedback and prevent toggle
    if (activity.done && completedToday.has(`activity-${activityId}`)) {
      // Optional: Add a subtle shake animation to the item
      const element = document.querySelector(
        `[data-id="activity-${activityId}"]`
      );
      if (element) {
        element.classList.add("shake");
        setTimeout(() => element.classList.remove("shake"), 500);
      }
      return;
    }

    try {
      const data = await gql(TOGGLE_ACTIVITY, { activityId });
      setActivities((prev) =>
        prev.map((a) =>
          a.activityId === activityId ? data.toggleActivityDone : a
        )
      );

      // If marked as done, add to completed set
      if (data.toggleActivityDone.done) {
        setCompletedToday(
          (prev) => new Set([...prev, `activity-${activityId}`])
        );
      }
    } catch (err) {
      console.error("Toggle activity failed", err.message || err);
    }
  }

  async function handleToggleHabit(habitId) {
    const habit = habits.find((h) => h.habitId === habitId);
    const isCompletedToday = (habit.completions || []).some(
      (c) => c.date === todayISO
    );

    // If already completed today, show feedback and prevent toggle
    if (isCompletedToday && completedToday.has(`habit-${habitId}`)) {
      // Optional: Add a subtle shake animation to the item
      const element = document.querySelector(`[data-id="habit-${habitId}"]`);
      if (element) {
        element.classList.add("shake");
        setTimeout(() => element.classList.remove("shake"), 500);
      }
      return;
    }

    try {
      const data = await gql(TOGGLE_HABIT, { habitId });
      setHabits((prev) =>
        prev.map((h) => (h.habitId === habitId ? data.toggleHabitDone : h))
      );

      // If completed today (check new completions array)
      const nowCompletedToday = (data.toggleHabitDone.completions || []).some(
        (c) => c.date === todayISO
      );

      if (nowCompletedToday) {
        setCompletedToday((prev) => new Set([...prev, `habit-${habitId}`]));
      }
    } catch (err) {
      console.error("Toggle habit failed", err.message || err);
    }
  }

  // Build combined list for display: activities (explicit) + habit instances for today
  const habitInstances = habits
    .filter((h) => shouldShowHabitToday(h, todayISO))
    .map((h) => {
      const doneToday = (h.completions || []).some((c) => c.date === todayISO);
      const progress = getHabitProgress(h);
      return {
        habitId: h.habitId,
        text: h.text,
        done: doneToday,
        isHabit: true,
        progress: progress.progress,
        streak: progress.streak,
        total: progress.total,
      };
    });

  return (
    <div className="tracker-container">
      <header className="tracker-header">
        <h1 style={{ color: "#0078ff" }}>Sankalp - Daily Activities</h1>
        <div className="header-actions">
          <button className="add-btn" onClick={() => setShowModal(true)}>
            + Add Activity
          </button>
          <button className="add-btn" onClick={() => setShowHabitModal(true)}>
            + Add Habit
          </button>
          <button className="cta-btn" onClick={() => navigate("/")}>
            Back to Home
          </button>
        </div>
      </header>

      {/* Welcome Section */}
      {userInfo.username && (
        <section className="welcome-section">
          <div className="welcome-content">
            <h2 className="greeting-text">
              {(() => {
                const hour = new Date().getHours();
                if (hour < 12) return "🌅 Good morning";
                if (hour < 17) return "☀️ Good afternoon";
                return "🌙 Good evening";
              })()}
              , {userInfo.username}!
            </h2>
            <p className="today-text">
              Ready to make progress on your goals today?
            </p>
          </div>
        </section>
      )}

      {/* Activity Modal */}
      {showModal && (
        <div className="modal-overlay">
          <div className="modal">
            <h2>Add Activity for {todayISO}</h2>
            <div className="input-wrapper">
              <input
                type="text"
                value={newActivity}
                onChange={(e) => setNewActivity(e.target.value)}
                placeholder="What do you want to do today?"
              />
            </div>
            <div className="modal-actions">
              <button onClick={handleAddActivity}>Add</button>
              <button className="cancel" onClick={() => setShowModal(false)}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Habit Modal */}
      {showHabitModal && (
        <div className="modal-overlay">
          <div className="modal">
            <h2>Create Habit</h2>
            <div className="input-wrapper">
              <input
                type="text"
                value={newHabitText}
                onChange={(e) => setNewHabitText(e.target.value)}
                placeholder="Habit description"
              />
              <div className="field-desc" style={{marginBottom: '0.5rem', fontSize: '0.95em', color: '#6b7280'}}>
                <strong>Recurrence:</strong> How often do you want to repeat this habit? (Daily, Weekly, or Monthly)
              </div>
              <select
                value={newHabitRecurrence}
                onChange={(e) => setNewHabitRecurrence(e.target.value)}
              >
                <option value="daily">Daily</option>
                <option value="weekly">Weekly</option>
                <option value="monthly">Monthly</option>
              </select>
              <div className="field-desc" style={{marginBottom: '0.5rem', fontSize: '0.95em', color: '#6b7280'}}>
                <strong>Goal:</strong> How many times do you want to complete this habit?
              </div>
              <input
                type="number"
                min={1}
                value={newHabitGoal}
                onChange={(e) => setNewHabitGoal(e.target.value)}
              />
            </div>
            <div className="modal-actions">
              <button onClick={handleAddHabit}>Create Habit</button>
              <button
                className="cancel"
                onClick={() => setShowHabitModal(false)}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Cards */}
      <div className="cards-container">
        <div className="day-card">
          <h3>{todayISO}</h3>
          <ul>
            {activities.map((act) => (
              <li
                key={act.activityId}
                data-id={`activity-${act.activityId}`}
                className={`task-item ${act.done ? "done-task" : ""}`}
              >
                <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer', width: '100%' }}>
                  <input
                    type="checkbox"
                    checked={!!act.done}
                    onChange={() => handleToggleActivity(act.activityId)}
                    style={{ marginRight: '0.7em', accentColor: '#0078ff' }}
                  />
                  <span>{act.text}</span>
                </label>
              </li>
            ))}
            {habitInstances.map((h) => (
              <li
                key={h.habitId}
                data-id={`habit-${h.habitId}`}
                className={`task-item ${h.done ? "done-task" : ""}`}
              >
                <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer', width: '100%' }}>
                  <input
                    type="checkbox"
                    checked={!!h.done}
                    onChange={() => handleToggleHabit(h.habitId)}
                    style={{ marginRight: '0.7em', accentColor: '#0078ff' }}
                  />
                  <span>
                    {h.text}
                    <em style={{ fontSize: "0.8em", marginLeft: 8 }}>
                      (Habit • {h.progress}% Complete • Streak: {h.streak} 🔥)
                    </em>
                  </span>
                </label>
              </li>
            ))}
            {activities.length === 0 && habitInstances.length === 0 && (
              <div className="empty-state">
                <p>No activities or habits for today.</p>
                <p>
                  Click <strong>+ Add Activity</strong> or{" "}
                  <strong>+ Add Habit</strong> to start tracking your day!
                </p>
              </div>
            )}
          </ul>
        </div>
      </div>
    </div>
  );
}

export default Tracker;
