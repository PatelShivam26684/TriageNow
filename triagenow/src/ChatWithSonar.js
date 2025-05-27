import React, { useState } from 'react';

function ChatWithSonar() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      sendMessage();
    }
  };

  const sendMessage = async () => {
  if (!input.trim()) return;

  const newMessages = [...messages, { role: 'user', content: input }];
  setMessages(newMessages);
  setInput('');
  setLoading(true);

  const patient = {
    name: 'Bob',
    age: 35,
    conditions: ['eczema'],
    medications: ['triamcinolone cream'],
    vitals: {
      bp: '120/80',
      hr: 72
    }
  };

  const payload = {
    messages: newMessages,
    patient
  };

  console.log('📤 Sending to backend:', JSON.stringify(payload, null, 2));

  try {
    const response = await fetch('http://127.0.0.1:5000/sonar-chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)  // ✅ sending full payload now
    });

    const data = await response.json();

    let fullAnswer = data.answer;
    if (data.citations && data.citations.length > 0) {
      fullAnswer += '\n\nSources:\n' + data.citations.map((src, i) => `${i + 1}. ${src}`).join('\n');
    }

    setMessages([...newMessages, { role: 'assistant', content: fullAnswer }]);
  } catch (error) {
    setMessages([...newMessages, { role: 'assistant', content: '❌ Error fetching response.' }]);
  } finally {
    setLoading(false);
  }
};

  return (
    <div className="p-4 bg-white rounded shadow max-w-2xl mx-auto">
      <div className="mb-4 h-96 overflow-y-scroll border rounded p-3 bg-gray-50">
        {messages.map((msg, i) => (
          <div key={i} className={`mb-2 ${msg.role === 'user' ? 'text-right' : 'text-left'}`}>
            <span className={`inline-block px-3 py-2 rounded-lg ${msg.role === 'user' ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}>
              {msg.content}
            </span>
          </div>
        ))}
        {loading && <p className="text-sm text-gray-500">Sonar is thinking...</p>}
      </div>
      <input
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="Ask a health question..."
        className="w-full p-2 border rounded"
      />
      <button onClick={sendMessage} className="mt-2 bg-blue-600 text-white py-2 px-4 rounded w-full">
        Send
      </button>
    </div>
  );
}

export default ChatWithSonar;

