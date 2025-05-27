import React, { useEffect, useState } from 'react';
import CareTeamPatientView from './CareTeamPatientView';

function CareTeamDashboard() {
  const [patients, setPatients] = useState([]);
  const [selectedPatient, setSelectedPatient] = useState(null);

  useEffect(() => {
    fetch('http://127.0.0.1:5000/patients')
      .then(res => res.json())
      .then(setPatients)
      .catch(err => console.error("Failed to fetch patients:", err));
  }, []);

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-4">👩‍⚕️ Care Team Dashboard</h2>
      <div className="flex space-x-6">
        <div className="w-1/3">
          <h3 className="font-semibold mb-2">📋 Patients</h3>
          <ul className="space-y-2">
            {patients.map((p, i) => (
              <li key={i}>
                <button
                  onClick={() => setSelectedPatient(p)}
                  className={`w-full text-left px-3 py-2 rounded ${selectedPatient?.username === p.username ? 'bg-blue-100' : 'bg-gray-100 hover:bg-gray-200'}`}
                >
                  {p.name} ({p.username})
                </button>
              </li>
            ))}
          </ul>
        </div>
        <div className="w-2/3">
          {selectedPatient ? (
            <CareTeamPatientView patient={selectedPatient} />
          ) : (
            <p>Select a patient to view profile and chat history.</p>
          )}
        </div>
      </div>
    </div>
  );
}

export default CareTeamDashboard;
