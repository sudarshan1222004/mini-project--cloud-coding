import { useState, useEffect } from "react";
import axios from "axios";

const ChatMentor = ({ code }) => {
  const [chatHistory, setChatHistory] = useState([]);
  const [userMessage, setUserMessage] = useState("");
  const [hintCount, setHintCount] = useState(0); 
  const [loading, setLoading] = useState(false);

  const callGPT4 = async (message, codeContext, hintCount) => {
    const systemPrompt = `
      You are a helpful AI mentor for developers working on a codebase.
      - Provide hints for the first 2 questions.
      - Give the final answer after the user asks the third time.
      - Always consider the provided code context when answering.
    `;

    const userPrompt = `User question: "${message}" \n Code context: \n ${codeContext}`;

    let roleMessage;
    if (hintCount < 2) {
      roleMessage = "Hint: "; 
    } else {
      roleMessage = "Answer: "; 
    }

    const response = await axios.post(
      "https://api.openai.com/v1/chat/completions",
      {
        model: "gpt-4",
        messages: [
          { role: "system", content: systemPrompt },
          ...chatHistory.map(msg => ({ role: msg.role, content: msg.content })), 
          { role: "user", content: userPrompt },
        ],
        max_tokens: 500,
        temperature: 0.7,
      },
      {
        headers: {
          "Content-Type": "application/json",
      }
    );

    return roleMessage + response.data.choices[0].message.content.trim();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!userMessage.trim()) return; 

    setChatHistory([...chatHistory, { role: "user", content: userMessage }]);
    setLoading(true);

    try {
      const aiResponse = await callGPT4(userMessage, code, hintCount);
      setChatHistory((prev) => [
        ...prev,
        { role: "assistant", content: aiResponse },
      ]);

      
      if (hintCount < 2) {
        setHintCount(hintCount + 1);
      }
    } catch (error) {
      setChatHistory((prev) => [
        ...prev,
        { role: "assistant", content: "Error fetching response from AI." },
      ]);
    } finally {
      setLoading(false);
      setUserMessage(""); 
    }
  };

  return (
    <div className="chat-mentor-container">
      <h2>Code Mentor Chat</h2>
      <div className="chat-box">
        {chatHistory.map((msg, index) => (
          <div key={index} className={msg.role}>
            <strong>{msg.role === "user" ? "You" : "AI"}:</strong> {msg.content}
          </div>
        ))}
        {loading && <p>AI is typing...</p>}
      </div>

      <form onSubmit={handleSubmit}>
        <input
          style={ {width: "95%",height:"110%",marginRight:"10px" }}
          type="text"
          placeholder="Ask a question about your code..."
          value={userMessage}
          onChange={(e) => setUserMessage(e.target.value)}
        />
        <button type="submit" disabled={loading}
        style={ {width: "4%"}}>
          Send
        </button>
      </form>
    </div>
  );
};

export default ChatMentor;
