
import React, { useState } from 'react';

function ChatWithCareTeam({
  messages,
  onSubmit,
  useBot,
  currentSender = 'user'   // default to patient
}) {
  const [input, setInput] = useState('');

  const handleSend = () => {
    const text = input.trim();
    if (!text) return;
    onSubmit({ sender: currentSender, content: text });
    setInput('');
  };

  return (
    <div className="p-3 bg-white border rounded shadow">
      {/* message list */}
      <div className="h-40 overflow-y-scroll mb-2 border p-2 bg-gray-50">
        {messages.map((msg, idx) => {
          const isUser = msg.sender === 'user';
          return (
            <div
              key={idx}
              className={`mb-1 ${isUser ? 'text-right' : 'text-left'}`}
            >
              <span
                className={
                  'inline-block px-2 py-1 rounded ' +
                  (isUser ? 'bg-blue-100' : 'bg-green-100')
                }
              >
                <strong>
                  {isUser ? 'Patient' : 'Nurse'}:
                </strong>{' '}
                {msg.content}
                <div className="text-xs text-gray-500 mt-1">
                  {msg.timestamp
                    ? new Date(msg.timestamp).toLocaleString(undefined, {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })
                    : 'Just now'}
                </div>
              </span>
            </div>
          );
        })}
      </div>

      {/* input box */}
      <input
        type="text"
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onKeyDown={(e) => e.key === 'Enter' && handleSend()}
        className="w-full p-2 border rounded mb-2"
        placeholder="Type your message..."
      />
      <button
        onClick={handleSend}
        className="bg-blue-600 text-white px-4 py-1 rounded w-full"
      >
        Send
      </button>

      {useBot && (
        <p className="text-sm text-purple-700 mt-2">
          🤖 Bot assistant is now responding due to frequent messages.
        </p>
      )}
    </div>
  );
}

export default ChatWithCareTeam;


