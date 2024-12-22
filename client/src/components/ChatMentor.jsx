import { useState } from "react";
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
          ...chatHistory.map((msg) => ({ role: msg.role, content: msg.content })),
          { role: "user", content: userPrompt },
        ],
        max_tokens: 500,
        temperature: 0.7,
      },
      {
        headers: {
          "Content-Type": "application/json",
        },
      }
    );

    return roleMessage + response.data.choices[0].message.content.trim();
  };

  const handleCopy = (code) => {
    navigator.clipboard.writeText(code);
    alert("Code copied to clipboard!");
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

  const extractCode = (text) => {
    const codeMatch = text.match(/```([\s\S]*?)```/);
    return codeMatch ? codeMatch[1].trim() : null;
  };

  return (
    <div style={styles.chatMentorContainer}>
      <div style={styles.header}>
        <h2 style={styles.title}>Code Mentor Chat</h2>
      </div>
      <div style={styles.chatBox}>
        {chatHistory.map((msg, index) => {
          const codeContent = extractCode(msg.content);
          return (
            <div key={index} style={styles.messageContainer}>
              <div style={msg.role === "user" ? styles.user : styles.assistant}>
                <strong>{msg.role === "user" ? "You" : "AI"}:</strong>
                {codeContent ? (
                  <pre style={styles.codeBlock}>{codeContent}</pre>
                ) : (
                  msg.content
                )}
              </div>
              {codeContent && (
                <button
                  onClick={() => handleCopy(codeContent)}
                  style={styles.copyButton}
                >
                  Copy Code
                </button>
              )}
            </div>
          );
        })}
        {loading && <p style={styles.typing}>AI is typing...</p>}
      </div>
      <form onSubmit={handleSubmit} style={styles.form}>
        <input
          type="text"
          placeholder="Ask a question about your code..."
          value={userMessage}
          onChange={(e) => setUserMessage(e.target.value)}
          style={styles.input}
        />
        <button type="submit" disabled={loading} style={styles.sendButton}>
          Send
        </button>
      </form>
    </div>
  );
};

const styles = {
  chatMentorContainer: {
    position: "fixed",
    bottom: "20px",
    right: "20px",
    width: "350px",
    backgroundColor: "#f1f1f1",
    border: "1px solid #ddd",
    borderRadius: "10px",
    boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)",
    overflow: "hidden",
    fontFamily: "Arial, sans-serif",
    zIndex: 1000,
  },
  header: {
    backgroundColor: "#3e3e3e",
    color: "#fff",
    padding: "10px",
    textAlign: "center",
  },
  title: {
    margin: 0,
  },
  chatBox: {
    maxHeight: "400px",
    overflowY: "auto",
    padding: "10px",
    backgroundColor: "#ffffff",
  },
  messageContainer: {
    marginBottom: "10px",
  },
  user: {
    backgroundColor: "#d9e4f5",
    padding: "8px",
    borderRadius: "5px",
    color: "#333",
    marginBottom: "5px",
    fontSize: "14px",
  },
  assistant: {
    backgroundColor: "#e8e8e8",
    padding: "8px",
    borderRadius: "5px",
    color: "#333",
    marginBottom: "5px",
    fontSize: "14px",
  },
  codeBlock: {
    backgroundColor: "#2d2d2d",
    color: "#f8f8f2",
    padding: "10px",
    borderRadius: "5px",
    fontFamily: "Courier New, monospace",
    fontSize: "14px",
    overflowX: "auto",
  },
  copyButton: {
    backgroundColor: "#3e3e3e",
    color: "#fff",
    border: "none",
    borderRadius: "5px",
    padding: "5px",
    fontSize: "12px",
    cursor: "pointer",
    marginTop: "5px",
  },
  typing: {
    color: "#666",
    fontStyle: "italic",
  },
  form: {
    display: "flex",
    alignItems: "center",
    padding: "10px",
    borderTop: "1px solid #ddd",
    backgroundColor: "#f9f9f9",
  },
  input: {
    flex: 1,
    padding: "10px",
    border: "1px solid #ccc",
    borderRadius: "5px",
    marginRight: "5px",
    fontSize: "14px",
  },
  sendButton: {
    backgroundColor: "#3e3e3e",
    color: "#fff",
    border: "none",
    borderRadius: "5px",
    padding: "10px 15px",
    cursor: "pointer",
    fontSize: "14px",
  },
};

export default ChatMentor;
