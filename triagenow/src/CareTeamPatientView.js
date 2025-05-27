// src/components/CareTeamPatientView.js
import React, { useEffect, useState } from 'react';
import ChatWithCareTeam from './ChatWithCareTeam';
import NurseAIChat      from './NurseAIChat';

function CareTeamPatientView({ patient }) {
  const [vitals, setVitals]               = useState(null);
  const [messages, setMessages]           = useState([]);
  const [summary, setSummary]             = useState('');
  const [parsedProfile, setParsedProfile] = useState(null);
  const [missingFields, setMissingFields] = useState([]);
  const [loading, setLoading]             = useState(false);

  // ── 1) Load saved structured profile + missing_fields ─────────
  const refreshProfile = async () => {
    if (!patient) return;
    try {
      const res  = await fetch(`http://127.0.0.1:5000/profile/${patient.username}`);
      const json = await res.json();
      if (json.profile) {
        setParsedProfile(json.profile);
        setMissingFields(json.profile.missing_fields || []);
      }
    } catch (err) {
      console.error('Error loading profile:', err);
    }
  };

  // ── 2) Load vitals (optional display) ───────────────────────────
  const loadVitals = async () => {
    try {
      const res  = await fetch(`http://127.0.0.1:5000/vitals/${patient.username}`);
      const json = await res.json();
      setVitals(json);
    } catch (err) {
      console.error('Error loading vitals:', err);
    }
  };

  // ── 3) Load persistent patient↔care chat ────────────────────────
  const loadChat = async () => {
    try {
      const res  = await fetch(`http://127.0.0.1:5000/patient-chat/${patient.username}`);
      const json = await res.json();
      setMessages(
        (json.messages || []).map(m => ({
          role:      m.sender,    // 'user' or 'nurse'
          content:   m.content,
          timestamp: m.timestamp
        }))
      );
    } catch (err) {
      console.error('Error loading chat:', err);
    }
  };

  useEffect(() => {
    if (!patient) return;
    loadVitals();
    loadChat();
    refreshProfile();
  }, [patient]);

  // ── 4) Parse free-text summary, fire off AI follow-ups, save profile ──
  const handleParseAndSave = async () => {
    setLoading(true);
    try {
      // a) Parse
      const res1 = await fetch('http://127.0.0.1:5000/parse-profile', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ input: summary, username: patient.username })
      });
      const data = await res1.json();
      if (!data.parsed) {
        alert('⚠️ AI returned no structured data.');
        return;
      }

      // b) Update local profile & missing fields
      setParsedProfile(data.parsed);
      setMissingFields(data.parsed.missing_fields || []);

      // c) Send system-generated follow-up questions via care-chat
      for (let field of data.parsed.missing_fields || []) {
        await fetch('http://127.0.0.1:5000/care-chat', {
          method:  'POST',
          headers: { 'Content-Type': 'application/json' },
          body:    JSON.stringify({
            username: patient.username,
            sender:   'nurse',
            content:  field.question,
            meta:     { system_generated: true }
          })
        });
      }

      // d) Save the structured profile back to server
      const res2 = await fetch('http://127.0.0.1:5000/save-profile', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({
          username: patient.username,
          profile:  data.parsed,
          input:    summary
        })
      });
      if (res2.ok) {
        alert('✅ Patient profile updated successfully!');
        refreshProfile();
      } else {
        alert('❌ Failed to save profile.');
      }
    } catch (err) {
      console.error('Parse error:', err);
      alert('❌ Error parsing profile. See console.');
    } finally {
      setLoading(false);
    }
  };

  // ── 5) Send a new care-team → patient message ────────────────────
  const handleSend = async ({ role, content }) => {
    try {
      await fetch('http://127.0.0.1:5000/patient-chat', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({
          username: patient.username,
          sender:   role,     // e.g. 'nurse'
          content
        })
      });
      await loadChat();
    } catch (err) {
      console.error('Error sending message:', err);
    }
  };

  // ── 6) Clear entire patient-care chat history ───────────────────
  const handleClearHistory = async () => {
    if (!window.confirm('Delete all patient chat history?')) return;
    try {
      await fetch(`http://127.0.0.1:5000/patient-chat/${patient.username}`, { method: 'DELETE' });
      setMessages([]);
    } catch (err) {
      console.error('Error clearing history:', err);
    }
  };

  // ── JSON pretty-printer ──────────────────────────────────────────
  const renderJsonView = obj => (
    <pre className="bg-gray-100 text-xs p-3 rounded overflow-auto max-h-96">
      {JSON.stringify(obj, null, 2)}
    </pre>
  );

  return (
    <div className="p-6 max-w-4xl mx-auto">
      {/* Profile + summary input */}
      <h3 className="text-xl font-semibold mb-3">🧾 Profile: {patient.name}</h3>

      <textarea
        value={summary}
        onChange={e => setSummary(e.target.value)}
        placeholder="Paste or type clinical summary here…"
        className="w-full p-2 border rounded mb-3 h-32"
      />

      <button
        onClick={handleParseAndSave}
        disabled={loading}
        className={`px-4 py-2 rounded mb-4 ${
          loading ? 'bg-gray-400 cursor-not-allowed' : 'bg-indigo-600 text-white'
        }`}
      >
        {loading ? 'Parsing patient summary…' : 'Parse & Save Profile via AI'}
      </button>

      {/* Structured Profile JSON */}
      {parsedProfile && (
        <div className="mb-6">
          <h5 className="text-md font-semibold mb-2">Structured Profile (JSON)</h5>
          {renderJsonView(parsedProfile)}
        </div>
      )}

      {/* Missing-fields follow-up UI */}
      {missingFields.length > 0 && (
        <div className="mb-6">
          <div className="text-sm text-yellow-800 bg-yellow-100 p-2 rounded mb-2">
            <strong>Missing Fields Needing Follow-up:</strong>
            <ul className="list-disc pl-6">
              {missingFields.map((f, i) => (
                <li key={i}>
                  <strong>{f.parameter}:</strong> {f.question}{' '}
                  <em>({f.guideline_ref})</em>
                </li>
              ))}
            </ul>
          </div>
          <NurseAIChat
            username={patient.username}
            questions={missingFields}
            onUpdate={refreshProfile}
          />
        </div>
      )}

      {/* Chat header + clear button */}
      <div className="flex justify-between items-center mb-2">
        <h5 className="text-lg font-semibold">Patient ↔ Care-Team Chat</h5>
        <button
          onClick={handleClearHistory}
          className="bg-red-600 text-white px-3 py-1 rounded text-sm"
        >
          🗑️ Clear History
        </button>
      </div>

      {/* Persistent chat */}
      <ChatWithCareTeam
        messages={messages}
        onSubmit={handleSend}
        useBot={false}
      />
    </div>
  );
}

export default CareTeamPatientView;












