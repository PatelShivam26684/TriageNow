// src/components/NurseAssistantChat.js
import React, { useState } from 'react';
import ChatWithCareTeam from './ChatWithCareTeam';

export default function NurseAssistantChat({ patientUsername, profile }) {
  const [messages, setMessages] = useState([]);
  const [loading,  setLoading]  = useState(false);

  const handleSend = async ({ role, content }) => {
    // 1) push the nurse’s question
    const userMsg = {
      role:      'user',
      content,
      timestamp: new Date().toISOString()
    };
    const convo = [...messages, userMsg];
    setMessages(convo);
    setLoading(true);

    try {
      // 2) hit your new nurse-chat endpoint
      const res = await fetch('http://127.0.0.1:5000/nurse-chat', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({
          username: patientUsername,
          messages: convo,
          profile  // send the full JSON profile package
        })
      });
      const data = await res.json();

      // 3) append the AI reply as “assistant”
      const botMsg = {
        role:      'assistant',
        content:   data.answer,
        timestamp: new Date().toISOString()
      };
      setMessages(prev => [...prev, botMsg]);
    } catch (err) {
      console.error("❌ NurseAssistantChat error", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mt-4 border rounded bg-gray-50 p-4">
      <ChatWithCareTeam
        messages={messages}
        onSubmit={handleSend}
        useBot={loading}
        hideBotNotice={true}
      />
    </div>
  );
}


