import React, { useState } from 'react';
import './App.css';

interface Message {
  id: number;
  text: string;
  isUser: boolean;
  timestamp: Date;
}

function App() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 1,
      text: "Hello! I am your AI assistant. How can I help you today?",
      isUser: false,
      timestamp: new Date()
    }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!inputValue.trim()) return;

    const userMessage: Message = {
      id: Date.now(),
      text: inputValue,
      isUser: true,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsLoading(true);

    try {
      let response: Response | null = null;
      let requestData;

      // Use the correct format that backend expects
      requestData = { query: inputValue };
      console.log('Sending request:', requestData);

      response = await fetch('http://localhost:3001/query', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestData),
      });

      console.log('Response status:', response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Request failed. Error:', errorText);
        throw new Error(`HTTP error! status: ${response.status}. Response: ${errorText}`);
      }

      const data = await response.text();
      console.log('Raw response:', data);

      // Parse JSON response and extract the actual answer
      let actualAnswer;
      try {
        const jsonResponse = JSON.parse(data);
        if (jsonResponse.response && jsonResponse.response.answer) {
          actualAnswer = jsonResponse.response.answer;
        } else if (jsonResponse.answer) {
          actualAnswer = jsonResponse.answer;
        } else {
          actualAnswer = data; // fallback to raw response
        }
      } catch (parseError) {
        console.log('Response is not JSON, using as-is');
        actualAnswer = data;
      }
      
      const botMessage: Message = {
        id: Date.now() + 1,
        text: actualAnswer,
        isUser: false,
        timestamp: new Date()
      };

      setMessages(prev => [...prev, botMessage]);
    } catch (error) {
      console.error('Error sending message:', error);
      const errorMessage: Message = {
        id: Date.now() + 1,
        text: "Sorry, I'm having trouble connecting to the server. Please make sure your backend is running on http://localhost:3001",
        isUser: false,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-white body" id='body'>
      {/* Chat History Panel */}
      <div id="chat-history" className="chat-history mx-auto max-w-3xl w-full px-4 md:px-0">
        {messages.map((message) => (
          <div key={message.id} className="flex items-start justify-center">
            <div className={`max-w-3xl w-full p-4 prose text-gray-800 ${
              message.isUser ? 'chat-bubble-user rounded-lg mb-4' : ''
            }`}>
              <p className={message.isUser ? 'text-white' : 'text-gray-800'}>
                {message.text}
              </p>
            </div>
          </div>
        ))}
        
        {isLoading && (
          <div className="flex items-start justify-center">
            <div className="max-w-3xl w-full p-4 prose text-gray-800">
              <p className="text-gray-500">Thinking...</p>
            </div>
          </div>
        )}
      </div>

      {/* Chat Input Form */}
      <div className="sticky bottom-0 bg-white py-4">
        <form id="chat-form" className="flex items-center gap-4 mx-auto max-w-3xl w-full px-4 md:px-0" onSubmit={sendMessage}>
          <div className="flex-1 relative">
            <input 
              id="user-input" 
              type="text" 
              placeholder="Ask a question..."
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              disabled={isLoading}
              className="w-full p-4 pr-16 rounded-full border border-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-400 transition-all duration-200 disabled:opacity-50" 
            />
            <button 
              type="submit"
              disabled={isLoading || !inputValue.trim()}
              className="absolute right-2 top-1/2 -translate-y-1/2 bg-gray-700 hover:bg-gray-800 text-white p-2 rounded-full shadow-lg focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-opacity-50 transition-all duration-200 transform hover:scale-105 disabled:opacity-50 disabled:transform-none">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2"
                stroke="currentColor" className="w-6 h-6">
                <path strokeLinecap="round" strokeLinejoin="round"
                  d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" />
              </svg>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default App;
