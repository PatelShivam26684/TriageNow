import React, { useEffect, useState } from 'react';
import ChatWithSonar from './ChatWithSonar';
import ChatWithCareTeam from './ChatWithCareTeam';
import { useNavigate } from 'react-router-dom';
import { useAuth } from './AuthContext';

function PatientDashboard() {
  const { user } = useAuth();
  const [showChat, setShowChat]               = useState(false);
  const [showContactOptions, setShowContactOptions] = useState(false);
  const [contactMode, setContactMode]         = useState(null); // 'chat' or null
  const [careTeamMessages, setCareTeamMessages] = useState([]);
  const [alerts] = useState([
    "⚠️ Appointment tomorrow at 10:00 AM.",
    "💊 Time to refill your medication."
  ]);

  const navigate = useNavigate();
  const useBot   = careTeamMessages.length >= 3;

  // 1) Load persisted chat history
  const loadHistory = async () => {
    if (!user) return;
    try {
      const res  = await fetch(`http://127.0.0.1:5000/patient-chat/${user.username}`);
      const json = await res.json();
      setCareTeamMessages(
        (json.messages || []).map(m => ({
          role:      m.sender,   // server uses 'user' or 'nurse'
          content:   m.content,
          timestamp: m.timestamp
        }))
      );
    } catch (err) {
      console.error("❌ Failed to load chat:", err);
    }
  };

  useEffect(() => {
    loadHistory();
  }, [user]);

  // 2) Send new message
  const handleCareTeamSubmit = async ({ role, content }) => {
    try {
      await fetch('http://127.0.0.1:5000/patient-chat', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({
          username: user.username,
          sender:   role,    // 'user' or 'nurse'
          content
        })
      });
      await loadHistory();
    } catch (err) {
      console.error("❌ Failed to send message:", err);
    }
  };

  // 3) Clear entire history
  const handleClearHistory = async () => {
    if (!window.confirm("Are you sure you want to delete your entire chat history?")) return;
    try {
      await fetch(`http://127.0.0.1:5000/patient-chat/${user.username}`, {
        method: 'DELETE'
      });
      setCareTeamMessages([]);
    } catch (err) {
      console.error("❌ Failed to clear history:", err);
    }
  };

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-4">Patient Dashboard</h2>
      <ul className="space-y-3">
        {/* Alerts */}
        <li className="bg-white border p-3 rounded shadow">
          <h3 className="font-semibold text-gray-700 mb-2">🔔 Alerts & Notifications</h3>
          <ul className="space-y-1 text-sm text-gray-600">
            {alerts.map((a,i) => <li key={i}>{a}</li>)}
          </ul>
        </li>

        {/* SonarCare Chat */}
        <li className="bg-white border p-3 rounded shadow">
          <h3 className="font-semibold text-gray-700 mb-2">💬 Chat with SonarCare</h3>
          {!showChat ? (
            <button
              onClick={() => setShowChat(true)}
              className="bg-purple-500 text-white px-4 py-2 rounded"
            >
              Open Chat
            </button>
          ) : (
            <div>
              <button
                onClick={() => setShowChat(false)}
                className="mb-2 bg-gray-300 hover:bg-gray-400 text-black py-1 px-3 rounded"
              >
                ← Back
              </button>
              <ChatWithSonar />
            </div>
          )}
        </li>

        {/* Profile & Vitals */}
        <li className="bg-white border p-3 rounded shadow">
          <h3 className="font-semibold text-gray-700 mb-2">📊 Profile & Vitals</h3>
          <button
            onClick={() => navigate('/profile')}
            className="bg-green-600 text-white px-4 py-2 rounded"
          >
            View Your Data
          </button>
        </li>

        {/* Nursing Team Chat */}
        <li className="bg-white border p-3 rounded shadow">
          <h3 className="font-semibold text-gray-700 mb-2">📞 Contact Care Team</h3>
          <button
            onClick={() => setShowContactOptions(v => !v)}
            className="bg-yellow-500 text-white px-4 py-2 rounded mb-2"
          >
            {showContactOptions ? 'Hide Options' : 'Show Options'}
          </button>

          {showContactOptions && (
            <div className="mt-3 space-y-2">
              <a
                href="tel:1234567890"
                className="block w-full bg-gray-700 text-white py-2 rounded text-center"
              >
                📞 Call Nursing Station
              </a>
              <button
                onClick={() => {
                  setContactMode('chat');
                  setShowContactOptions(false);
                }}
                className="block w-full bg-blue-600 text-white py-2 rounded"
              >
                💬 Chat with Nursing Team
              </button>
              <button
                onClick={handleClearHistory}
                className="block w-full bg-red-600 text-white py-2 rounded"
              >
                🗑️ Clear History
              </button>
            </div>
          )}

          {contactMode === 'chat' && (
            <div className="mt-4">
              <ChatWithCareTeam
                messages={careTeamMessages}
                onSubmit={handleCareTeamSubmit}
                useBot={useBot}
              />
            </div>
          )}
        </li>

        {/* Boredom Chat */}
        <li className="bg-white border p-3 rounded shadow">
          <h3 className="font-semibold text-gray-700 mb-2">🧠 I’m Bored… Teach Me Something!</h3>
          <button
            onClick={() => navigate('/bored-chat')}
            className="bg-pink-500 text-white px-4 py-2 rounded"
          >
            Open Curiosity Chat
          </button>
        </li>

        {/* Emergency */}
        <li className="bg-white border p-3 rounded shadow">
          <h3 className="font-semibold text-red-600 mb-2">🚨 Emergency Contact</h3>
          <a
            href="tel:911"
            className="block bg-red-600 text-white px-4 py-2 rounded text-center"
          >
            Call 911 Now
          </a>
        </li>
      </ul>
    </div>
  );
}

export default PatientDashboard;














