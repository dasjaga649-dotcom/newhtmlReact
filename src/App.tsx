import React from 'react';
import logo from './logo.svg';
import './App.css';

function App() {
  return (
    <div className="bg-white  body" id='body'>
      {/* <!-- Chat History Panel --> */}
      <div id="chat-history" className="chat-history mx-auto max-w-3xl w-full px-4 md:px-0">
        {/* <!-- Welcome Message --> */}
        <div className="flex items-start justify-center">
          <div className="max-w-3xl w-full p-4 prose text-gray-800">
            <p>Hello! I am your AI assistant. How can I help you today?</p>
          </div>
        </div>
      </div>

      {/* <!-- Chat Input Form --> */}
      <div className="sticky bottom-0 bg-white py-4">
        <form id="chat-form" className="flex items-center gap-4 mx-auto max-w-3xl w-full px-4 md:px-0">
          <div className="flex-1 relative">
            <input id="user-input" type="text" placeholder="Ask a question..."
              className="w-full p-4 pr-16 rounded-full border border-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-400 transition-all duration-200" />
            <button type="submit"
              className="absolute right-2 top-1/2 -translate-y-1/2 bg-gray-700 hover:bg-gray-800 text-white p-2 rounded-full shadow-lg focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-opacity-50 transition-all duration-200 transform hover:scale-105">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2"
                stroke="currentColor" className="w-6 h-6">
                <path stroke-linecap="round" stroke-linejoin="round"
                  d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" />
              </svg>
            </button>
          </div>
        </form>
      </div>


    </div >
  );
}

export default App;
