import { useLocation } from "react-router-dom";

export default function Profile() {
  const location = useLocation();
  const { name, notes } = location.state || {};

  return (
    <div style={{ padding: "40px" }}>
      <h1>👤 Person Details</h1>

      <h2>Name: {name || "Unknown"}</h2>
      <p>Memory: {notes || "No notes available"}</p>
    </div>
  );
}