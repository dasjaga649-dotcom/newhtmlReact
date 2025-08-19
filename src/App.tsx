import React, { useState, useEffect } from 'react';
import { marked } from 'marked';
import './App.css';

// Configure marked to return strings synchronously
marked.setOptions({
  async: false
});

interface Message {
  id: number;
  text: string;
  isUser: boolean;
  timestamp: Date;
  response?: BotResponse;
}

interface BotResponse {
  answer: string;
  related_content?: RelatedContent[];
  recommendations?: string[];
  file_links?: FileLink[];
  tables?: Table[];
}

interface RelatedContent {
  image?: string;
  title: string;
  url: string;
}

interface FileLink {
  title: string;
  url: string;
}

interface Table {
  title: string;
  headers: string[];
  rows: string[][];
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
    const currentInput = inputValue;
    setInputValue('');
    setIsLoading(true);

    try {
      const response = await fetch('http://localhost:3001/query', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ query: currentInput }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP error! status: ${response.status}. Response: ${errorText}`);
      }

      const data = await response.text();
      let botResponse: BotResponse;
      
      try {
        const jsonResponse = JSON.parse(data);
        if (jsonResponse.response) {
          botResponse = jsonResponse.response;
        } else {
          botResponse = { answer: data };
        }
      } catch (parseError) {
        botResponse = { answer: data };
      }

      const botMessage: Message = {
        id: Date.now() + 1,
        text: botResponse.answer || "Sorry, I couldn't process your request.",
        isUser: false,
        timestamp: new Date(),
        response: botResponse
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

  const handleSuggestionClick = (suggestion: string) => {
    setInputValue(suggestion);
    // Auto-submit the suggestion
    setTimeout(() => {
      const form = document.getElementById('chat-form') as HTMLFormElement;
      if (form) {
        form.dispatchEvent(new Event('submit', { cancelable: true, bubbles: true }));
      }
    }, 100);
  };

  return (
    <div className="bg-white body" id='body'>
      {/* Chat History Panel */}
      <div id="chat-history" className="chat-history mx-auto max-w-3xl w-full px-4 md:px-0">
        {messages.map((message) => (
          <div key={message.id}>
            {message.isUser ? (
              <UserMessage text={message.text} />
            ) : (
              <BotMessage message={message} onSuggestionClick={handleSuggestionClick} />
            )}
          </div>
        ))}
        
        {isLoading && <LoadingMessage />}
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

const UserMessage: React.FC<{ text: string }> = ({ text }) => {
  return (
    <div className="flex justify-end">
      <div className="rounded-xl rounded-br-none p-4 shadow-md chat-bubble-user prose text-sm max-w-lg">
        <div dangerouslySetInnerHTML={{ __html: marked(text) }} />
      </div>
    </div>
  );
};

const BotMessage: React.FC<{ 
  message: Message; 
  onSuggestionClick: (suggestion: string) => void;
}> = ({ message, onSuggestionClick }) => {
  const response = message.response;

  return (
    <div className="flex items-start justify-center">
      <div className="max-w-3xl w-full">
        
        {/* Related Content Card Carousel */}
        {response?.related_content && response.related_content.length > 0 && (
          <RelatedContentCarousel items={response.related_content} />
        )}

        {/* Main Answer */}
        {message.text && (
          <div className="p-4 rounded-xl prose text-gray-800">
            <div dangerouslySetInnerHTML={{
              __html: marked(renderIcons(renderTables(preprocessResponse(message.text), response?.tables || [])))
            }} />
          </div>
        )}

        {/* File Links */}
        {response?.file_links && response.file_links.length > 0 && (
          <FileLinksSection files={response.file_links} />
        )}

        {/* Suggested Questions */}
        {response?.recommendations && response.recommendations.length > 0 && (
          <SuggestionsSection 
            suggestions={response.recommendations} 
            onSuggestionClick={onSuggestionClick} 
          />
        )}
      </div>
    </div>
  );
};

const LoadingMessage: React.FC = () => {
  return (
    <div className="flex justify-start">
      <div className="rounded-xl rounded-bl-none p-4 shadow-md max-w-sm bg-white">
        <div className="flex space-x-2 animate-pulse">
          <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
          <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
          <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
        </div>
      </div>
    </div>
  );
};

const RelatedContentCarousel: React.FC<{ items: RelatedContent[] }> = ({ items }) => {
  const [currentIndex, setCurrentIndex] = useState(0);

  const scrollPrev = () => {
    setCurrentIndex(Math.max(0, currentIndex - 1));
  };

  const scrollNext = () => {
    setCurrentIndex(Math.min(items.length - 1, currentIndex + 1));
  };

  useEffect(() => {
    const container = document.querySelector('.card-carousel-container');
    if (container) {
      const itemWidth = (container.children[0] as HTMLElement)?.offsetWidth + 16;
      container.scrollLeft = currentIndex * itemWidth;
    }
  }, [currentIndex]);

  return (
    <div className="w-full mb-6">
      <h5 className="font-semibold text-gray-800 mb-2 px-4">Related content</h5>
      <div className="card-carousel relative w-full flex items-center justify-center gap-2">
        <button 
          onClick={scrollPrev}
          className="card-carousel-prev bg-gray-200 text-gray-600 p-2 rounded-full hover:bg-gray-300 transition-colors duration-200 focus:outline-none">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" className="w-6 h-6">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
          </svg>
        </button>
        <div className="card-carousel-container mx-auto max-w-full flex-1">
          {items.map((item, index) => (
            <div key={index} className="card-carousel-item flex-shrink-0 p-4 bg-white rounded-lg border border-gray-200 shadow-sm flex flex-col space-y-2">
              <span className="text-xs text-gray-500 font-medium">
                {new URL(item.url).hostname.replace('www.', '')}
              </span>
              {item.image && item.image !== "No image found." && (
                <img 
                  src={item.image} 
                  alt={item.title} 
                  className="w-full h-20 object-cover rounded-md mb-2"
                  onError={(e) => {
                    console.error('Image failed to load:', item.image);
                    (e.target as HTMLElement).style.display = 'none';
                  }}
                />
              )}
              <h5 className="text-sm font-medium text-gray-800 line-clamp-2">{item.title}</h5>
              {item.url && (
                <a 
                  href={item.url} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-gray-600 hover:text-gray-800 hover:underline text-xs flex items-center">
                  Learn more
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4m-6-6l6 6m0 0V8m0 4h-4" />
                  </svg>
                </a>
              )}
            </div>
          ))}
        </div>
        <button 
          onClick={scrollNext}
          className="card-carousel-next bg-gray-200 text-gray-600 p-2 rounded-full hover:bg-gray-300 transition-colors duration-200 focus:outline-none">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" className="w-6 h-6">
            <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
          </svg>
        </button>
      </div>
    </div>
  );
};

const FileLinksSection: React.FC<{ files: FileLink[] }> = ({ files }) => {
  return (
    <div className="mt-6">
      <h5 className="font-semibold text-gray-800 mb-2 px-4">Files</h5>
      {files.map((file, index) => (
        <a 
          key={index}
          href={file.url} 
          target="_blank" 
          rel="noopener noreferrer"
          className="flex items-center gap-2 p-3 my-1 rounded-lg hover:bg-gray-100 transition-colors duration-200">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-500" viewBox="0 0 20 20" fill="currentColor">
            <path d="M4 4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V8a2 2 0 00-2-2h-5L9 4H4z" />
          </svg>
          <span className="text-sm font-medium text-gray-700">{file.title}</span>
        </a>
      ))}
    </div>
  );
};

const SuggestionsSection: React.FC<{ 
  suggestions: string[]; 
  onSuggestionClick: (suggestion: string) => void;
}> = ({ suggestions, onSuggestionClick }) => {
  return (
    <div className="mt-6">
      <h5 className="font-semibold text-gray-800 mb-2 px-4">Suggested Questions</h5>
      {suggestions.map((suggestion, index) => (
        <button
          key={index}
          onClick={() => onSuggestionClick(suggestion)}
          className="suggestion-button block w-full text-left p-4 my-2 bg-gray-50 rounded-lg border border-gray-200 text-sm text-gray-700 shadow-sm hover:bg-gray-100">
          {suggestion}
        </button>
      ))}
    </div>
  );
};

// Utility functions
const renderTables = (answer: string, tables: Table[]): string => {
  if (!tables || tables.length === 0) {
    return answer;
  }

  let processedAnswer = answer;
  tables.forEach(table => {
    const placeholder = `[TABLE:${table.title}]`;
    if (processedAnswer.includes(placeholder)) {
      let tableHtml = `<div class="overflow-x-auto my-4">`;
      tableHtml += `<table class="min-w-full border border-gray-300 rounded-lg overflow-hidden shadow-sm">`;
      tableHtml += `<caption class="p-2 text-sm text-gray-500 font-medium text-left">${table.title}</caption>`;

      if (table.headers && table.headers.length > 0) {
        tableHtml += `<thead class="bg-gray-100">`;
        tableHtml += `<tr>${table.headers.map(h => `<th class="p-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">${h}</th>`).join('')}</tr>`;
        tableHtml += `</thead>`;
      }

      tableHtml += `<tbody class="divide-y divide-gray-200">`;
      table.rows.forEach(row => {
        tableHtml += `<tr class="bg-white">`;
        tableHtml += row.map(cell => `<td class="p-3 text-sm text-gray-800">${cell}</td>`).join('');
        tableHtml += `</tr>`;
      });
      tableHtml += `</tbody>`;
      tableHtml += `</table></div>`;

      processedAnswer = processedAnswer.replace(placeholder, tableHtml);
    }
  });

  return processedAnswer;
};

const getIconSVG = (iconName: string): string => {
  const icons: { [key: string]: string } = {
    location: `<svg xmlns="http://www.w3.org/2000/svg" class="inline-block w-5 h-5" viewBox="0 0 24 24"><path fill="currentColor" d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5S10.62 6.5 12 6.5s2.5 1.12 2.5 2.5S13.38 11.5 12 11.5z"/></svg>`,
    phone: `<svg xmlns="http://www.w3.org/2000/svg" class="inline-block w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2 6.5c1.5-2 4-3 6.5-2l2 2a1 1 0 010 1.4L9 10a12 12 0 005 5l2.1-1.5a1 1 0 011.4 0l2 2c1 2.5 0 5-2 6.5-.6.4-1.4.5-2.1.2C10.2 20.5 3.5 13.8 1.8 6.6c-.3-.7-.2-1.5.2-2.1z"/></svg>`,
    mobile: `<svg xmlns="http://www.w3.org/2000/svg" class="inline-block w-5 h-5" viewBox="0 0 24 24"><path fill="currentColor" d="M15.5 1h-7a.5.5 0 00-.5.5v21a.5.5 0 00.5.5h7a.5.5 0 00.5-.5V1.5a.5.5 0 00-.5-.5zM12 22a1 1 0 110-2 1 1 0 010 2z"/></svg>`,
    email: `<svg xmlns="http://www.w3.org/2000/svg" class="inline-block w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 5h18a2 2 0 012 2v10a2 2 0 01-2 2H3a2 2 0 01-2-2V7a2 2 0 012-2z" /><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 7l9 6 9-6" /></svg>`
  };
  return icons[iconName] || '';
};

const renderIcons = (text: string): string => {
  return text.replace(/\[ICON:(.*?)]/g, (match, iconName) => {
    return `<span class="inline-block align-middle">${getIconSVG(iconName.trim())}</span>`;
  });
};

const preprocessResponse = (text: string): string => {
  let processedText = text.replace(/&nbsp;|\u00A0|\t/g, ' ');
  processedText = processedText.replace(/([^\n])---/g, '$1\n\n---\n\n');
  processedText = processedText.replace(/^(\s*)\*\s+/gm, '$1* ');
  processedText = processedText.replace(/^(#+)(?! )/gm, '$1 ');
  processedText = processedText.replace(/^(\s*>)(?! )/gm, '$1 ');
  return processedText.trim();
};

export default App;
