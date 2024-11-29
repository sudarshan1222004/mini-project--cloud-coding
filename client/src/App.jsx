import { useCallback, useEffect, useState } from "react";
import "./App.css";
import Terminal from "./components/terminal";
import FileTree from "./components/tree";
import socket from "./socket";
import AceEditor from "react-ace";

import { getFileMode } from "./utils/getFileMode";

import "ace-builds/src-noconflict/mode-javascript";
import "ace-builds/src-noconflict/theme-github";
import "ace-builds/src-noconflict/theme-twilight"; 
import "ace-builds/src-noconflict/ext-language_tools";

function App() {
  const [fileTree, setFileTree] = useState({});
  const [selectedFile, setSelectedFile] = useState("");
  const [selectedFileContent, setSelectedFileContent] = useState("");
  const [code, setCode] = useState("");
  const [theme, setTheme] = useState("github");
  const [isSaving, setIsSaving] = useState(false);

  const isSaved = selectedFileContent === code;

  useEffect(() => {
    if (!isSaved && code) {
      const timer = setTimeout(() => {
        setIsSaving(true);
        socket.emit("file:change", {
          path: selectedFile,
          content: code,
        });
        setTimeout(() => {
          setIsSaving(false);
          setSelectedFileContent(code); 
        }, 500);
      }, 5000);

      return () => clearTimeout(timer);
    }
  }, [code, selectedFile, isSaved]);

  useEffect(() => {
    setCode("");
  }, [selectedFile]);

  useEffect(() => {
    setCode(selectedFileContent);
  }, [selectedFileContent]);

  const getFileTree = async () => {
    const response = await fetch("http://localhost:9000/files");
    const result = await response.json();
    setFileTree(result.tree);
  };

  const getFileContents = useCallback(async () => {
    if (!selectedFile) return;
    const response = await fetch(
      `http://localhost:9000/files/content?path=${selectedFile}`
    );
    const result = await response.json();
    setSelectedFileContent(result.content);
  }, [selectedFile]);

  useEffect(() => {
    if (selectedFile) getFileContents();
  }, [getFileContents, selectedFile]);

  useEffect(() => {
    socket.on("file:refresh", getFileTree);
    return () => socket.off("file:refresh", getFileTree);
  }, [socket.io]);

  return (
    <div className="playground-container">
      <header className="app-header">
        <h1>Code on Cloud</h1>
        <button onClick={() => setTheme(theme === "github" ? "twilight" : "github")}>
          Toggle Theme
        </button>
      </header>
      <div className="main-container">
        <div className="files">
          <FileTree
            onSelect={(path) => {
              setSelectedFileContent("");
              setSelectedFile(path);
            }}
            tree={fileTree}
          />
        </div>
        <div className="editor-container">
          {selectedFile ? (
            <>
              <div className="file-info">
                <p>
                  {selectedFile.replaceAll("/", " > ")}{" "}
                  <span className={isSaving ? "saving" : "saved"}>
                    {isSaving ? "Saving..." : isSaved ? "Saved" : ""}
                  </span>
                </p>
              </div>
              <AceEditor
                width="100%"
                height="70vh"
                mode={getFileMode({ selectedFile })}
                theme={theme}
                value={code}
                onChange={(e) => setCode(e)}
              />
            </>
          ) : (
            <p className="placeholder">Select a file to start editing.</p>
          )}
        </div>
      </div>
      <div className="terminal-container">
        <Terminal />
      </div>
    </div>
  );
}

export default App;
