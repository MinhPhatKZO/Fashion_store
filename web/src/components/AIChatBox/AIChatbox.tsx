import React, { useState, FormEvent, ChangeEvent } from "react";
import "./AIChatbox.css";

type MessageSender = "user" | "bot";

interface Message {
  id: number;
  sender: MessageSender;
  text: string;
}

const AIChatBox: React.FC = () => {
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 1,
      sender: "bot",
      text: "Xin chào 👋 Mình là trợ lý AI của Fashion Store. Bạn cần mình hỗ trợ gì?"
    }
  ]);
  const [input, setInput] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const handleToggle = () => {
    setIsOpen((prev) => !prev);
  };

  const handleInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    setInput(e.target.value);
  };

  const handleSend = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const trimmed = input.trim();
    if (!trimmed || isLoading) return;

    const userMsg: Message = {
      id: Date.now(),
      sender: "user",
      text: trimmed,
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setIsLoading(true);

    try {
      // Gửi lịch sử rút gọn
      const historyPayload = [...messages, userMsg].slice(-10).map((m) => ({
        sender: m.sender,
        text: m.text,
      }));

      const response = await fetch("http://localhost:5000/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: trimmed,
          history: historyPayload,
        }),
      });

      const data = await response.json();

      const botMsg: Message = {
        id: Date.now() + 1,
        sender: "bot",
        text: data.reply || "Xin lỗi, mình không nhận được phản hồi từ AI.",
      };

      setMessages((prev) => [...prev, botMsg]);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now() + 2,
          sender: "bot",
          text: "⚠️ Lỗi kết nối với AI. Bạn thử lại giúp mình nhé.",
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <button className="ai-chat-toggle" onClick={handleToggle}>
        {isOpen ? "×" : "AI"}
      </button>

      {isOpen && (
        <div className="ai-chatbox-container">
          <div className="ai-chatbox-header">
            <div>
              <div className="ai-chatbox-title">Fashion AI Assistant</div>
              <div className="ai-chatbox-subtitle">Trực tuyến • Hỗ trợ 24/7</div>
            </div>
            <button
              className="ai-chatbox-close"
              onClick={handleToggle}
            >
              ✕
            </button>
          </div>

          <div className="ai-chatbox-messages">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`ai-chat-message ${msg.sender === "user" ? "from-user" : "from-bot"}`}
              >
                <div className="ai-chat-bubble">{msg.text}</div>
              </div>
            ))}

            {isLoading && (
              <div className="ai-chat-message from-bot">
                <div className="ai-chat-bubble">Đang suy nghĩ giúp bạn...</div>
              </div>
            )}
          </div>

          <form className="ai-chatbox-input-row" onSubmit={handleSend}>
            <input
              type="text"
              placeholder="Nhập câu hỏi của bạn..."
              value={input}
              onChange={handleInputChange}
              disabled={isLoading}
            />
            <button type="submit" disabled={isLoading}>
              {isLoading ? "..." : "Gửi"}
            </button>
          </form>
        </div>
      )}
    </>
  );
};

export default AIChatBox;
