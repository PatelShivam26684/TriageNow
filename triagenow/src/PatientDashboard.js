import React from 'react';

function PatientDashboard() {
  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-4">Patient Dashboard</h2>
      <ul className="space-y-3">
        <li><button className="w-full bg-blue-500 text-white px-4 py-2 rounded">🔔 Alerts/Notifications</button></li>
        <li><button className="w-full bg-purple-500 text-white px-4 py-2 rounded">💬 Chat with SonarCare</button></li>
        <li><button className="w-full bg-green-500 text-white px-4 py-2 rounded">📊 See Vitals</button></li>
        <li><button className="w-full bg-yellow-500 text-white px-4 py-2 rounded">📞 Contact Care Team</button></li>
        <li><button className="w-full bg-red-600 text-white px-4 py-2 rounded">🚨 Emergency</button></li>
      </ul>
    </div>
  );
}

export default PatientDashboard;