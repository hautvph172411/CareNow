import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { MessageCircle, X, Send, Trash2, Maximize2, Minimize2 } from 'lucide-react';

const ChatWidget = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [sessionId, setSessionId] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);

  const WEBHOOK_URL = import.meta.env.VITE_N8N_WEBHOOK_URL || 'https://carenowdigital.app.n8n.cloud/webhook/bd710719-608b-45a0-a56e-7d7cb1f08283';
  const AUTH_USER = import.meta.env.VITE_N8N_BASIC_AUTH_USER;
  const AUTH_PASSWORD = import.meta.env.VITE_N8N_BASIC_AUTH_PASSWORD;

  useEffect(() => {
    let sid = localStorage.getItem('carenow_chat_session_id');
    if (!sid) {
      sid = 'sess_' + Math.random().toString(36).substr(2, 9) + '_' + Date.now();
      localStorage.setItem('carenow_chat_session_id', sid);
    }
    setSessionId(sid);
    
    const savedMessages = JSON.parse(localStorage.getItem('carenow_chat_messages') || '[]');
    if (savedMessages.length > 0) {
      setMessages(savedMessages);
    } else {
      const greeting = { sender: 'bot', text: 'Xin chào! Tôi có thể giúp gì cho bạn?' };
      setMessages([greeting]);
      localStorage.setItem('carenow_chat_messages', JSON.stringify([greeting]));
    }
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    if (messages.length > 0) {
      localStorage.setItem('carenow_chat_messages', JSON.stringify(messages));
    }
  }, [messages]);

  const clearChat = () => {
    if(window.confirm('Bạn có chắc chắn muốn xóa toàn bộ lịch sử trò chuyện?')) {
      setMessages([]);
      localStorage.removeItem('carenow_chat_messages');
      const newSid = 'sess_' + Math.random().toString(36).substr(2, 9) + '_' + Date.now();
      setSessionId(newSid);
      localStorage.setItem('carenow_chat_session_id', newSid);
    }
  };

  const sendMessage = async () => {
    if (!inputText.trim()) return;
    
    const userMsg = { sender: 'user', text: inputText };
    setMessages(prev => [...prev, userMsg]);
    setInputText('');
    setIsLoading(true);

    try {
      const headers = {};
      if (AUTH_USER && AUTH_PASSWORD) {
        headers['Authorization'] = 'Basic ' + btoa(AUTH_USER + ':' + AUTH_PASSWORD);
      }

      const response = await axios.post(
        WEBHOOK_URL,
        {
          message: userMsg.text,
          session_id: sessionId
        },
        { headers }
      );
      
      let botResponseText = 'Xin lỗi, tôi không thể xử lý phản hồi này.';
      if (response.data) {
        if (typeof response.data === 'string') botResponseText = response.data;
        else if (response.data.response) botResponseText = response.data.response;
        else if (response.data.message) botResponseText = response.data.message;
        else if (response.data.text) botResponseText = response.data.text;
        else if (response.data.output) botResponseText = response.data.output;
        else if (Array.isArray(response.data) && response.data[0]?.message) botResponseText = response.data[0].message;
        else botResponseText = JSON.stringify(response.data);
      }

      setMessages(prev => [...prev, { sender: 'bot', text: botResponseText }]);
    } catch (error) {
      console.error("Chat error:", error);
      setMessages(prev => [...prev, { sender: 'bot', text: 'Xin lỗi, có lỗi xảy ra khi kết nối. Vui lòng thử lại sau.' }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      // Bỏ qua sự kiện Enter nếu người dùng đang gõ Telex/VNI (isComposing)
      if (e.nativeEvent.isComposing || e.isComposing) return;
      
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <div className="fixed bottom-5 right-5 z-[9999] flex flex-col items-end font-sans">
      {isOpen && (
        <div className={`bg-white rounded-xl shadow-2xl border border-gray-100 overflow-hidden mb-3 flex flex-col transition-all duration-300 ${isExpanded ? 'w-[90vw] md:w-[700px]' : 'w-[350px]'}`} style={{ height: isExpanded ? '85vh' : '480px', boxShadow: '0 10px 40px -10px rgba(0,0,0,0.2)' }}>
          <div className="bg-blue-600 text-white px-4 py-3 flex justify-between items-center shadow-sm">
            <div className="font-medium flex items-center gap-2 text-[15px]">
              <img src="https://www.shutterstock.com/image-vector/medical-chatbot-icon-line-design-260nw-2645939497.jpg" alt="Bot Logo" className="w-6 h-6 rounded-full object-cover bg-white" />
              <span>Hỗ trợ CareNow</span>
            </div>
            <div className="flex items-center gap-1">
              <button onClick={clearChat} title="Xóa lịch sử" className="hover:bg-blue-700 p-1.5 rounded-full transition-colors">
                <Trash2 size={16} />
              </button>
              <button onClick={() => setIsExpanded(!isExpanded)} title={isExpanded ? "Thu nhỏ" : "Phóng to"} className="hover:bg-blue-700 p-1.5 rounded-full transition-colors">
                {isExpanded ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
              </button>
              <button onClick={() => setIsOpen(false)} title="Đóng" className="hover:bg-blue-700 p-1.5 rounded-full transition-colors ml-1">
                <X size={18} />
              </button>
            </div>
          </div>
          
          <div className="flex-1 overflow-y-auto p-4 bg-gray-50 flex flex-col gap-3">
            {messages.map((msg, idx) => {
              const formatText = (text) => {
                const parts = text.split(/(\*\*.*?\*\*)/g);
                return parts.map((part, i) => {
                  if (part.startsWith('**') && part.endsWith('**')) {
                    return <strong key={i}>{part.slice(2, -2)}</strong>;
                  }
                  return part;
                });
              };

              return (
                <div key={idx} className={`max-w-[85%] rounded-2xl px-3.5 py-2 text-[14px] leading-relaxed shadow-sm whitespace-pre-wrap ${msg.sender === 'user' ? 'bg-blue-600 text-white self-end rounded-tr-none' : 'bg-white border border-gray-100 text-gray-800 self-start rounded-tl-none'}`}>
                  {formatText(msg.text)}
                </div>
              );
            })}
            {isLoading && (
              <div className="bg-white border border-gray-100 text-gray-500 self-start rounded-2xl rounded-tl-none px-4 py-2.5 text-sm flex gap-1.5 items-center shadow-sm">
                <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce"></span>
                <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.15s' }}></span>
                <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.3s' }}></span>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          <div className="p-3 bg-white border-t border-gray-100 flex gap-2 items-end">
            <textarea 
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={handleKeyPress}
              placeholder="Nhập tin nhắn..." 
              className="flex-1 bg-gray-50 border border-gray-200 rounded-2xl px-3.5 py-2 text-[14px] focus:outline-none focus:border-blue-400 focus:bg-white transition-colors resize-none overflow-hidden min-h-[40px] max-h-[100px]"
              rows="1"
            />
            <button 
              onClick={sendMessage}
              disabled={isLoading || !inputText.trim()}
              className="bg-blue-600 text-white p-2.5 rounded-full hover:bg-blue-700 transition-colors disabled:bg-blue-300 flex items-center justify-center shadow-sm"
            >
              <Send size={16} className="ml-0.5" />
            </button>
          </div>
        </div>
      )}
      
      {!isOpen && (
        <button 
          onClick={() => setIsOpen(true)} 
          className="bg-white w-14 h-14 rounded-full shadow-[0_4px_14px_0_rgba(37,99,235,0.39)] hover:shadow-[0_6px_20px_rgba(37,99,235,0.23)] flex items-center justify-center transition-all hover:scale-105 overflow-hidden border border-gray-200"
        >
          <img src="https://www.shutterstock.com/image-vector/medical-chatbot-icon-line-design-260nw-2645939497.jpg" alt="Chat Bot" className="w-12 h-12 object-contain" />
        </button>
      )}
    </div>
  );
};

export default ChatWidget;
