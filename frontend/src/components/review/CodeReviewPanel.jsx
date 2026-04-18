function flattenTree(nodes, activeFile, depth = 0, prefix = "") {
  if (!Array.isArray(nodes)) {
    return [];
  }

  return nodes.flatMap((node, index) => {
    const name = node?.name || `item-${index}`;
    const key = `${prefix}${name}-${index}`;
    const isFolder = node?.type === "folder" || Array.isArray(node?.children);
    const row = {
      key,
      name,
      depth,
      type: isFolder ? "folder" : "file",
      active: !isFolder && (name === activeFile || node?.path === activeFile),
    };

    if (!isFolder) {
      return [row];
    }

    const children = flattenTree(node.children || [], activeFile, depth + 1, `${key}/`);
    return [row, ...children];
  });
}

function buildExplorerRows(fileName, fileTree) {
  const activeFile = fileName.split("/").filter(Boolean).at(-1) || fileName;

  const treeRows = flattenTree(fileTree, activeFile);
  if (treeRows.length > 0) {
    return treeRows.map((row) => ({
      ...row,
      active: row.active || row.name === activeFile,
    }));
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
      active: false,
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
  if (/^\s+$/.test(token)) {
    return "";
  }
  if (/^\/\/.*$/.test(token) || /^#.*$/.test(token)) {
    return "token-comment";
  }
  if (/^".*"$/.test(token) || /^'.*'$/.test(token)) {
    return "token-warm";
  }
  if (/^\d+$/.test(token)) {
    return "token-warm";
  }
  if (KEYWORD_RE.test(token)) {
    return "token-blue";
  }
  if (/^[A-Z_][A-Za-z0-9_]*$/.test(token)) {
    return "token-blue-soft";
  }
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
  const explorerRows = buildExplorerRows(fileName, fileTree);

  return (
    <article className="code-review-panel">
      <header className="code-panel-header">
        <div className="code-window-controls" aria-hidden="true">
          <span />
          <span />
          <span />
        </div>
        <div className="code-header-main">
          <div>
            <h3>Review File: {fileName}</h3>
            <p>Click vulnerable lines directly in the editor.</p>
          </div>
          <div className="code-meta-tabs">
            <span className="code-tab is-active">Checks {owaspCount}</span>
            <span className="code-tab">{selectedCount} selected lines</span>
          </div>
        </div>
      </header>

      <div className="code-workspace">
        <aside className="explorer-pane" aria-label="Code explorer">
          <p className="explorer-label">Explorer</p>
          <div className="explorer-tree">
            {explorerRows.map((row) => (
              <div
                key={row.key}
                className={`explorer-row ${row.active ? "is-active" : ""}`}
                style={{ "--depth": row.depth }}
              >
                <span className="explorer-icon" aria-hidden="true">
                  {row.type === "folder" ? "▾" : "•"}
                </span>
                <span className="explorer-name">{row.name}</span>
              </div>
            ))}
          </div>
        </aside>

        <div className="code-scroller">
          <div className="editor-tab-bar">
            <span className="editor-tab is-active">{fileName.split("/").filter(Boolean).at(-1) || fileName}</span>
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

export default CodeReviewPanel;
