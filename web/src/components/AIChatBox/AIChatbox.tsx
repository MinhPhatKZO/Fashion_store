import React, { useState, FormEvent, ChangeEvent, useRef, useEffect } from "react";
import { aiChatAPI } from "../../services/api"; // ✅ Import từ API service
import "./AIChatbox.css";

type MessageSender = "user" | "bot";

interface Message {
  id: number;
  sender: MessageSender;
  text: string;
  timestamp?: Date;
}

const AIChatBox: React.FC = () => {
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 1,
      sender: "bot",
      text: "Xin chào 👋 Mình là trợ lý AI của Fashion Store. Bạn cần mình hỗ trợ gì?",
      timestamp: new Date(),
    }
  ]);
  const [input, setInput] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>("");
  
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // ✅ Auto scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleToggle = () => {
    setIsOpen((prev) => !prev);
    setError("");
  };

  const handleInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    setInput(e.target.value);
    setError("");
  };

  const handleSend = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const trimmed = input.trim();
    
    if (!trimmed || isLoading) return;

    // ✅ Validation
    if (trimmed.length > 500) {
      setError("Tin nhắn quá dài (tối đa 500 ký tự)");
      return;
    }

    const userMsg: Message = {
      id: Date.now(),
      sender: "user",
      text: trimmed,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setIsLoading(true);
    setError("");

    try {
      // Gửi lịch sử 10 tin nhắn gần nhất
      const historyPayload = [...messages, userMsg]
        .slice(-10)
        .map((m) => ({
          sender: m.sender,
          text: m.text,
        }));

      // ✅ Dùng API service thay vì fetch
      const response = await aiChatAPI.sendMessage({
        message: trimmed,
        history: historyPayload,
      });

      const botMsg: Message = {
        id: Date.now() + 1,
        sender: "bot",
        text: response.data.reply || "Xin lỗi, mình chưa nhận được câu trả lời.",
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, botMsg]);

    } catch (err: any) {
      console.error("❌ AI Chat Error:", err);

      let errorMessage = "⚠️ Lỗi kết nối với AI. Bạn thử lại giúp mình nhé.";

      // ✅ Error handling chi tiết
      if (err.response) {
        if (err.response.status === 429) {
          errorMessage = "⏳ AI đang quá tải, vui lòng thử lại sau ít phút.";
        } else if (err.response.status === 400) {
          errorMessage = "⚠️ Tin nhắn không hợp lệ. Vui lòng thử lại.";
        } else if (err.response.status === 504) {
          errorMessage = "⏱️ AI phản hồi quá lâu. Vui lòng thử câu hỏi ngắn gọn hơn.";
        }
      }

      setMessages((prev) => [
        ...prev,
        {
          id: Date.now() + 2,
          sender: "bot",
          text: errorMessage,
          timestamp: new Date(),
        },
      ]);
      
      setError(errorMessage);

    } finally {
      setIsLoading(false);
    }
  };

  // ✅ Suggested questions
  const suggestedQuestions = [
    "Có sản phẩm giảm giá nào không?",
    "Tìm áo thun nam",
    "Chính sách đổi trả như thế nào?",
  ];

  const handleSuggestedClick = (question: string) => {
    setInput(question);
  };

  return (
    <>
      {/* Toggle Button */}
      <button 
        className="ai-chat-toggle" 
        onClick={handleToggle}
        aria-label={isOpen ? "Đóng chat AI" : "Mở chat AI"}
      >
        {isOpen ? "×" : "AI"}
      </button>

      {/* Chatbox */}
      {isOpen && (
        <div className="ai-chatbox-container">
          {/* Header */}
          <div className="ai-chatbox-header">
            <div>
              <div className="ai-chatbox-title">Fashion AI Assistant</div>
              <div className="ai-chatbox-subtitle">
                {isLoading ? "Đang trả lời..." : "Trực tuyến • Hỗ trợ 24/7"}
              </div>
            </div>
            <button
              className="ai-chatbox-close"
              onClick={handleToggle}
              aria-label="Đóng"
            >
              ✕
            </button>
          </div>

          {/* Messages */}
          <div className="ai-chatbox-messages">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`ai-chat-message ${msg.sender === "user" ? "from-user" : "from-bot"}`}
              >
                <div className="ai-chat-bubble">
                  {msg.text}
                  {msg.timestamp && (
                    <div className="ai-chat-timestamp">
                      {msg.timestamp.toLocaleTimeString('vi-VN', { 
                        hour: '2-digit', 
                        minute: '2-digit' 
                      })}
                    </div>
                  )}
                </div>
              </div>
            ))}

            {isLoading && (
              <div className="ai-chat-message from-bot">
                <div className="ai-chat-bubble ai-chat-loading">
                  <span className="ai-chat-dot"></span>
                  <span className="ai-chat-dot"></span>
                  <span className="ai-chat-dot"></span>
                </div>
              </div>
            )}

            {/* ✅ Suggested Questions */}
            {messages.length === 1 && !isLoading && (
              <div className="ai-chat-suggestions">
                <div className="ai-chat-suggestions-title">Câu hỏi gợi ý:</div>
                {suggestedQuestions.map((q, idx) => (
                  <button
                    key={idx}
                    className="ai-chat-suggestion-btn"
                    onClick={() => handleSuggestedClick(q)}
                  >
                    {q}
                  </button>
                ))}
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* ✅ Error Display */}
          {error && (
            <div className="ai-chat-error">
              {error}
            </div>
          )}

          {/* Input Form */}
          <form className="ai-chatbox-input-row" onSubmit={handleSend}>
            <input
              type="text"
              placeholder="Nhập câu hỏi của bạn..."
              value={input}
              onChange={handleInputChange}
              disabled={isLoading}
              maxLength={500}
            />
            <button 
              type="submit" 
              disabled={isLoading || !input.trim()}
              aria-label="Gửi tin nhắn"
            >
              {isLoading ? "..." : "➤"}
            </button>
          </form>
        </div>
      )}
    </>
  );
};

export default AIChatBox;