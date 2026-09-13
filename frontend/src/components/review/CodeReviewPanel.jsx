import { useState, useMemo } from "react";

/**
 * Build a flat tree from a nested node array.
 * Each folder node gets: key, name, depth, type, expanded state
 * On initial render, all folders are collapsed — only the active file's ancestors are expanded.
 */
function buildTree(nodes, activeFileName, depth = 0, prefix = "", expandTarget = null) {
  if (!Array.isArray(nodes)) return [];

  return nodes.flatMap((node, index) => {
    const name = node?.name || `item-${index}`;
    const key = `${prefix}${name}-${index}`;
    const isFolder = node?.type === "folder" || Array.isArray(node?.children);

    if (!isFolder) {
      return [{ key, name, depth, type: "file", active: name === activeFileName, path: node.path }];
    }

    const children = node.children || [];
    const hasActiveChild = expandTarget
      ? children.some((c) => c.name === expandTarget)
      : children.some((c) => c.path === activeFileName || c.name === activeFileName);
    const expanded = hasActiveChild;

    const folderNode = { key, name, depth, type: "folder", expanded, hasActiveChild };
    const childRows = expanded
      ? buildTree(children, activeFileName, depth + 1, `${key}/`, expandTarget)
      : [];

    return [folderNode, ...childRows];
  });
}

/**
 * Build explorer rows from the file tree or fallback to flat path segments.
 */
function buildExplorerRows(fileName, fileTree) {
  const activeFile = fileName.split("/").filter(Boolean).at(-1) || fileName;

  if (Array.isArray(fileTree) && fileTree.length > 0) {
    return buildTree(fileTree, activeFile, 0, "", activeFile);
  }

  const segments = fileName.split("/").filter(Boolean);
  const fileLabel = segments.at(-1) || fileName;
  const folders = segments.slice(0, -1);

  return [
    ...folders.map((segment, index) => ({
      key: `${segment}-${index}`,
      name: segment,
      depth: index,
      type: "folder",
      expanded: index === folders.length - 1,
      hasActiveChild: index === folders.length - 1,
    })),
    {
      key: `${fileLabel}-file`,
      name: fileLabel,
      depth: folders.length,
      type: "file",
      active: true,
    },
  ];
}

const KEYWORD_RE =
  /^(?:require_once|return|const|let|var|class|import|from|export|def|public|private|package|func|if|else|for|while|try|catch|new|await|async|router|app)$/;

function classifyToken(token) {
  if (/^\s+$/.test(token)) return "";
  if (/^\/\/.*$/.test(token) || /^#.*$/.test(token)) return "token-comment";
  if (/^".*"$/.test(token) || /^'.*'$/.test(token)) return "token-warm";
  if (/^\d+$/.test(token)) return "token-warm";
  if (KEYWORD_RE.test(token)) return "token-blue";
  if (/^[A-Z_][A-Za-z0-9_]*$/.test(token)) return "token-blue-soft";
  return "";
}

function renderStyledLine(line) {
  const text = line || " ";
  const tokens =
    text.match(/(\/\/.*$|#.*$|".*?"|'.*?'|\b[A-Za-z_][A-Za-z0-9_]*\b|\b\d+\b|\s+|.)/g) || [];

  return tokens.map((token, index) => {
    const className = classifyToken(token);
    return (
      <span key={`${token}-${index}`} className={className}>
        {token}
      </span>
    );
  });
}

function CodeReviewPanel({
  fileName,
  fileTree,
  codeLines,
  selectedSet,
  selectedCount,
  onToggleLine,
  lineStateClass,
  owaspCount,
}) {
  // Manage folder expansion state
  const initialRows = useMemo(() => buildExplorerRows(fileName, fileTree), [fileName, fileTree]);
  const [expandedSet, setExpandedSet] = useState(() => {
    const set = new Set();
    initialRows.forEach((row) => {
      if (row.type === "folder" && row.expanded) set.add(row.key);
    });
    return set;
  });

  function toggleFolder(key) {
    setExpandedSet((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }

  // Build rendered rows respecting current expanded state
  const explorerRows = useMemo(() => {
    const activeFile = fileName.split("/").filter(Boolean).at(-1) || fileName;
    if (Array.isArray(fileTree) && fileTree.length > 0) {
      return renderTreeRows(fileTree, activeFile, 0, "", expandedSet);
    }
    // Fallback for flat paths (no file tree)
    const segments = fileName.split("/").filter(Boolean);
    const fileLabel = segments.at(-1) || fileName;
    const folders = segments.slice(0, -1);
    return [
      ...folders.map((segment, index) => ({
        key: `${segment}-${index}`,
        name: segment,
        depth: index,
        type: "folder",
        expanded: expandedSet.has(`${segment}-${index}`),
      })),
      {
        key: `${fileLabel}-file`,
        name: fileLabel,
        depth: folders.length,
        type: "file",
        active: true,
      },
    ];
  }, [fileName, fileTree, expandedSet]);

  return (
    <article className="code-review-panel">
      {/* VS Code-style title bar */}
      <header className="code-panel-header">
        <div className="code-window-controls" aria-hidden="true">
          <span />
          <span />
          <span />
        </div>
        <div className="code-header-main">
          <div className="code-header-left">
            <span className="code-header-filename">{fileName.split("/").filter(Boolean).at(-1) || fileName}</span>
            <span className="code-header-badge">{owaspCount} checks</span>
          </div>
          <div className="code-header-right">
            <span className="code-header-select-count">{selectedCount} selected</span>
          </div>
        </div>
      </header>

      <div className="code-workspace">
        {/* VS Code sidebar — Explorer */}
        <aside className="explorer-pane" aria-label="File explorer">
          <p className="explorer-label">Explorer</p>
          <div className="explorer-tree">
            {explorerRows.map((row) => (
              <div
                key={row.key}
                className={`explorer-row ${row.type === "folder" ? "is-folder" : ""} ${row.active ? "is-active" : ""}`}
                style={{ "--depth": row.depth }}
                onClick={row.type === "folder" ? () => toggleFolder(row.key) : undefined}
                role={row.type === "folder" ? "button" : undefined}
                tabIndex={row.type === "folder" ? 0 : undefined}
                onKeyDown={row.type === "folder" ? (e) => { if (e.key === "Enter" || e.key === " ") toggleFolder(row.key); } : undefined}
              >
                {/* Indentation guide lines */}
                {Array.from({ length: row.depth }, (_, i) => (
                  <span key={i} className="explorer-indent" />
                ))}
                {/* Chevron or spacer */}
                <span className="explorer-chevron">
                  {row.type === "folder" ? (expandedSet.has(row.key) ? "▾" : "▸") : null}
                </span>
                {/* File/folder icon */}
                <span className={`explorer-node-icon ${row.type === "folder" ? "icon-folder" : "icon-file"}`} />
                <span className="explorer-name">{row.name}</span>
              </div>
            ))}
          </div>
        </aside>

        {/* VS Code-style editor area */}
        <div className="code-scroller">
          <div className="editor-tab-bar">
            <span className="editor-tab is-active">
              {fileName.split("/").filter(Boolean).at(-1) || fileName}
            </span>
          </div>
          {codeLines.map((line, index) => {
            const lineNumber = index + 1;
            const selected = selectedSet.has(lineNumber);

            return (
              <button
                key={`${lineNumber}-${line}`}
                type="button"
                className={`code-row ${selected ? "is-selected" : ""} ${lineStateClass(lineNumber)}`}
                onClick={() => onToggleLine(lineNumber)}
              >
                <span className="line-index">{lineNumber}</span>
                <span className="line-content">{renderStyledLine(line)}</span>
              </button>
            );
          })}
        </div>
      </div>
    </article>
  );
}

/**
 * Recursive render of tree nodes, respecting expandedSet state.
 */
function renderTreeRows(nodes, activeFileName, depth, prefix, expandedSet) {
  if (!Array.isArray(nodes)) return [];

  return nodes.flatMap((node, index) => {
    const name = node?.name || `item-${index}`;
    const key = `${prefix}${name}-${index}`;
    const isFolder = node?.type === "folder" || Array.isArray(node?.children);
    const expanded = expandedSet.has(key);

    if (!isFolder) {
      return [{ key, name, depth, type: "file", active: name === activeFileName, path: node.path }];
    }

    const children = node.children || [];
    const folderNode = { key, name, depth, type: "folder", expanded };
    const childRows = expanded ? renderTreeRows(children, activeFileName, depth + 1, `${key}/`, expandedSet) : [];

    return [folderNode, ...childRows];
  });
}

export default CodeReviewPanel;
