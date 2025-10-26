import React from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import LandingPage from "./LandingPage";
import Tracker from "./Tracker";

// Protected Route wrapper component
const ProtectedRoute = ({ children }) => {
  const userId = localStorage.getItem("userId");
  const user = localStorage.getItem("user");

  if (!userId || !user) {
    // Redirect to landing page with a message
    return (
      <Navigate
        to="/"
        replace
        state={{ message: "Please register or log in first" }}
      />
    );
  }

  return children;
};

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route
          path="/tracker"
          element={
            <ProtectedRoute>
              <Tracker />
            </ProtectedRoute>
          }
        />
      </Routes>
    </Router>
  );
}

export default App;
