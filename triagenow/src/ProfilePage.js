import React, { useEffect, useState } from 'react';
import ViewVitals from './ViewVitals';
import { useAuth } from './AuthContext';

function ProfilePage() {
  const { user } = useAuth();
  const [profile, setProfile] = useState(null);

  useEffect(() => {
    fetch(`http://127.0.0.1:5000/profile/${user.username}`)
      .then(res => res.json())
      .then(data => {
        if (data.profile) {
          setProfile(data.profile);
        }
      });
  }, [user]);

  const renderTable = (data) => {
  const rows = [];

  const flatten = (obj, prefix = '') => {
    for (const key in obj) {
      const val = obj[key];
      const label = prefix ? `${prefix}.${key}` : key;

      if (Array.isArray(val)) {
        if (val.every(v => typeof v === 'object')) {
          val.forEach((entry, idx) => {
            flatten(entry, `${label}[${idx}]`);
          });
        } else {
          rows.push([label, val.join(', ')]);
        }
      } else if (typeof val === 'object' && val !== null) {
        flatten(val, label);
      } else {
        rows.push([label, val]);
      }
    }
  };

  flatten(data);

  const formatLabel = (raw) => {
    return raw
      .replace(/\[\d+\]/g, '') // remove array indexes from display
      .split('.')
      .pop()
      .replace(/_/g, ' ')
      .replace(/\b\w/g, (c) => c.toUpperCase())
      .replace('Bp', 'BP')
      .replace('Hr', 'HR')
      .replace('Bmi', 'BMI')
      .replace('Ahi', 'AHI')
      .replace('Nyha', 'NYHA')
      .replace('Cgm', 'CGM')
      .replace('Vax', 'Vaccine')
      .replace('Dx', 'Diagnosis')
      .replace('Covid', 'COVID');
  };

  return (
    <table className="w-full text-sm table-auto border border-gray-300 rounded">
      <thead>
        <tr className="bg-gray-100">
          <th className="text-left p-2 border-b border-gray-300">Field</th>
          <th className="text-left p-2 border-b border-gray-300">Value</th>
        </tr>
      </thead>
      <tbody>
        {rows.map(([key, value], idx) => (
          <tr key={idx} className="even:bg-gray-50">
            <td className="p-2 font-medium">{formatLabel(key)}</td>
            <td className="p-2">{value !== null && value !== undefined ? value.toString() : '—'}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
};



  return (
    <div className="p-6 max-w-3xl mx-auto">
      <h2 className="text-2xl font-bold mb-4">👤 Your Profile</h2>
      <ul className="mb-6 space-y-2 text-lg">
        <li>🧑 Name: {user.name}</li>
        <li>👤 Username: {user.username}</li>
        <li>🧭 Role: {user.role}</li>
      </ul>

      <ViewVitals />

      <div className="mt-6">
        {profile ? (
          <>
            <h4 className="text-lg font-semibold mb-2">Structured Profile</h4>
            {renderTable(profile)}
          </>
        ) : (
          <p className="text-gray-500 text-sm">No structured profile saved yet.</p>
        )}
      </div>
    </div>
  );
}

export default ProfilePage;

