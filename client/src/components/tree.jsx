import React, { useState } from "react";
import "./tree.css"; 

const FileTreeNode = ({ fileName, nodes, onSelect, path }) => {
  const [isOpen, setIsOpen] = useState(false); 
  const isDir = !!nodes; 
  return (
    <div className={`file-tree-node ${isDir ? "directory" : "file"}`}>
      <p
        className="node-label"
        onClick={(e) => {
          e.stopPropagation();
          if (isDir) {
            setIsOpen((prev) => !prev); 
          } else {
            onSelect(path); 
          }
        }}
      >
        {isDir ? (isOpen ? "📂" : "📁") : "📄"} {fileName}
      </p>

      {isDir && isOpen && fileName !== "node_modules" && (
        <ul className="file-tree-children">
          {Object.keys(nodes).map((child) => (
            <li key={child}>
              <FileTreeNode
                onSelect={onSelect}
                path={`${path}/${child}`}
                fileName={child}
                nodes={nodes[child]}
              />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

const FileTree = ({ tree, onSelect }) => {
  return (
    <div className="file-tree">
      <FileTreeNode onSelect={onSelect} fileName="/" path="" nodes={tree} />
    </div>
  );
};

export default FileTree;
