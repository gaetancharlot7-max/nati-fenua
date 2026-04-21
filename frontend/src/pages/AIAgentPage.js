import React, { useState, useEffect, useRef, useCallback } from "react";
import axios from "axios";

const API = process.env.REACT_APP_BACKEND_URL || "http://localhost:8000";

const AUDIT_TYPES = [
  { value: "full_app", label: "Audit complet", desc: "Securite + performance + qualite" },
  { value: "security", label: "Securite", desc: "OWASP Top 10, secrets, CVE" },
  { value: "performance", label: "Performance", desc: "N+1, pagination, lazy loading" },
  { value: "code_quality", label: "Qualite de code", desc: "Black, ESLint, types, DRY" },
];

const TOOL_ICONS = {
  read_file: "F",
  write_file: "W",
  list_directory: "D",
  search_in_codebase: "S",
  run_command: "C",
  run_tests: "T",
  analyze_code_quality: "Q",
  security_scan: "SEC",
  performance_profile: "P",
  git_operation: "G",
  query_database: "DB",
  generate_documentation: "DOC",
  save_to_memory: "MEM",
  recall_memory: "REC",
  create_plan: "PLN",
};

function MessageBubble({ msg }) {
  const [showActions, setShowActions] = useState(false);
  const isUser = msg.role === "user";

  return (
    <div
      style={{
        display: "flex",
        flexDirection: isUser ? "row-reverse" : "row",
        gap: 10,
        marginBottom: 16,
        alignItems: "flex-start",
      }}
    >
      <div
        style={{
          width: 34,
          height: 34,
          borderRadius: "50%",
          flexShrink: 0,
          background: isUser ? "#6366f1" : "#0f172a",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: 15,
          color: "#fff",
          fontWeight: 700,
        }}
      >
        {isUser ? "A" : "AI"}
      </div>
      <div style={{ maxWidth: "75%" }}>
        <div
          style={{
            padding: "12px 16px",
            borderRadius: isUser ? "18px 4px 18px 18px" : "4px 18px 18px 18px",
            background: isUser ? "#6366f1" : "#f8fafc",
            color: isUser ? "#fff" : "inherit",
            border: isUser ? "none" : "1px solid #e2e8f0",
            fontSize: 14,
            lineHeight: 1.6,
            whiteSpace: "pre-wrap",
            wordBreak: "break-word",
          }}
        >
          {msg.content}
        </div>
        {!isUser && (msg.actions_taken?.length > 0 || msg.files_modified?.length > 0) && (
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 6, alignItems: "center" }}>
            {msg.execution_time_ms && (
              <span
                style={{
                  fontSize: 11,
                  color: "#64748b",
                  background: "#f1f5f9",
                  padding: "2px 8px",
                  borderRadius: 99,
                }}
              >
                {(msg.execution_time_ms / 1000).toFixed(1)}s
              </span>
            )}
            {msg.iterations > 1 && (
              <span
                style={{
                  fontSize: 11,
                  color: "#8b5cf6",
                  background: "#f5f3ff",
                  padding: "2px 8px",
                  borderRadius: 99,
                }}
              >
                {msg.iterations} iterations
              </span>
            )}
            {msg.files_modified?.length > 0 && (
              <span
                style={{
                  fontSize: 11,
                  color: "#10b981",
                  background: "#f0fdf4",
                  padding: "2px 8px",
                  borderRadius: 99,
                }}
              >
                {msg.files_modified.length} fichier(s) modifie(s)
              </span>
            )}
            {msg.actions_taken?.length > 0 && (
              <button
                onClick={() => setShowActions((v) => !v)}
                style={{
                  background: "none",
                  border: "1px solid #e2e8f0",
                  borderRadius: 99,
                  padding: "2px 8px",
                  fontSize: 11,
                  cursor: "pointer",
                  color: "#6b7280",
                }}
              >
                {showActions ? "▲" : "▼"} {msg.actions_taken.length} actions
              </button>
            )}
          </div>
        )}
        {showActions && msg.actions_taken?.length > 0 && (
          <div
            style={{
              marginTop: 8,
              padding: 12,
              background: "#f8fafc",
              border: "1px solid #e2e8f0",
              borderRadius: 10,
            }}
          >
            {msg.actions_taken.map((a, i) => (
              <div
                key={i}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                  padding: "3px 8px",
                  borderRadius: 6,
                  fontSize: 11,
                  background: "#fff",
                  border: "1px solid #e2e8f0",
                  marginBottom: 3,
                }}
              >
                <span style={{ fontFamily: "monospace", fontWeight: 700 }}>{TOOL_ICONS[a.tool] || "?"}</span>
                <span style={{ fontWeight: 600 }}>{a.tool}</span>
                {a.input?.path && <span style={{ color: "#64748b", fontFamily: "monospace" }}>{a.input.path}</span>}
                <span style={{ marginLeft: "auto", color: "#94a3b8" }}>iter {a.iteration}</span>
              </div>
            ))}
          </div>
        )}
        {msg.files_modified?.length > 0 && (
          <div
            style={{
              marginTop: 6,
              padding: 10,
              background: "#f0fdf4",
              border: "1px solid #bbf7d0",
              borderRadius: 8,
            }}
          >
            <p style={{ fontSize: 12, fontWeight: 600, color: "#166534", margin: "0 0 4px" }}>Fichiers modifies :</p>
            {msg.files_modified.map((f, i) => (
              <code key={i} style={{ display: "block", fontSize: 12, color: "#15803d" }}>
                {f}
              </code>
            ))}
          </div>
        )}
        {msg.report && (
          <details style={{ marginTop: 6 }}>
            <summary style={{ fontSize: 12, cursor: "pointer", color: "#6366f1", fontWeight: 600 }}>
              Rapport structure
            </summary>
            <pre
              style={{
                fontSize: 11,
                background: "#1e1e2e",
                color: "#cdd6f4",
                padding: 12,
                borderRadius: 8,
                overflow: "auto",
                maxHeight: 300,
                marginTop: 6,
              }}
            >
              {JSON.stringify(msg.report, null, 2)}
            </pre>
          </details>
        )}
      </div>
    </div>
  );
}

export default function AIAgentPage() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [sessionId, setSessionId] = useState(null);
  const [autonomousMode, setAutonomousMode] = useState(true);
  const [activeTab, setActiveTab] = useState("chat");
  const [auditType, setAuditType] = useState("full_app");
  const [auditLoading, setAuditLoading] = useState(false);
  const [taskInput, setTaskInput] = useState("");
  const [taskLoading, setTaskLoading] = useState(false);
  const [memories, setMemories] = useState([]);
  const [memCat, setMemCat] = useState("");
  const [agentHealth, setAgentHealth] = useState(null);
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  useEffect(() => {
    setMessages([
      {
        role: "assistant",
        content:
          "Bonjour ! Je suis l'Agent Developpeur Principal de Nati Fenua (V2 - Claude).\n\nJe peux lire/modifier tes fichiers, lancer les tests, auditer la securite, analyser les performances, gerer git, inspecter MongoDB et me souvenir des sessions precedentes.\n\nQue veux-tu faire ?",
        actions_taken: [],
        files_modified: [],
      },
    ]);
    checkAgentHealth();
  }, []);

  const checkAgentHealth = async () => {
    try {
      const { data } = await axios.get(`${API}/api/ai/health`, {
        headers: { Authorization: `Bearer ${localStorage.getItem("admin_token")}` },
      });
      setAgentHealth(data);
    } catch {
      setAgentHealth({ status: "error" });
    }
  };

  const getAuthHeaders = () => ({
    Authorization: `Bearer ${localStorage.getItem("admin_token")}`,
    "Content-Type": "application/json",
  });

  const sendMessage = useCallback(
    async (textOverride = null) => {
      const text = textOverride || input.trim();
      if (!text || loading) return;
      if (!textOverride) setInput("");
      setMessages((prev) => [...prev, { role: "user", content: text }]);
      setLoading(true);
      try {
        const { data } = await axios.post(
          `${API}/api/ai/chat`,
          { message: text, session_id: sessionId, autonomous_mode: autonomousMode },
          { headers: getAuthHeaders() }
        );
        if (!sessionId) setSessionId(data.session_id);
        setMessages((prev) => [
          ...prev,
          {
            role: "assistant",
            content: data.response,
            actions_taken: data.actions_taken || [],
            files_modified: data.files_modified || [],
            iterations: data.iterations || 0,
            execution_time_ms: data.execution_time_ms || 0,
            report: data.report || null,
          },
        ]);
      } catch (err) {
        setMessages((prev) => [
          ...prev,
          {
            role: "assistant",
            content: "Erreur : " + (err.response?.data?.detail || err.message),
            actions_taken: [],
            files_modified: [],
          },
        ]);
      } finally {
        setLoading(false);
      }
    },
    [input, loading, sessionId, autonomousMode]
  );

  const runAudit = async () => {
    setAuditLoading(true);
    setActiveTab("chat");
    setMessages((prev) => [...prev, { role: "user", content: `Lancer audit : ${auditType}` }]);
    try {
      const { data } = await axios.post(
        `${API}/api/ai/audit`,
        { audit_type: auditType },
        { headers: getAuthHeaders() }
      );
      if (!sessionId) setSessionId(data.session_id);
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: data.response,
          actions_taken: data.actions_taken || [],
          files_modified: data.files_modified || [],
          iterations: data.iterations || 0,
          execution_time_ms: data.execution_time_ms || 0,
          report: data.report || null,
        },
      ]);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: "Erreur audit : " + (err.response?.data?.detail || err.message),
          actions_taken: [],
          files_modified: [],
        },
      ]);
    } finally {
      setAuditLoading(false);
    }
  };

  const runTask = async () => {
    if (!taskInput.trim()) return;
    setTaskLoading(true);
    setActiveTab("chat");
    setMessages((prev) => [...prev, { role: "user", content: `Tache : ${taskInput}` }]);
    try {
      const { data } = await axios.post(
        `${API}/api/ai/task`,
        { task: taskInput, session_id: sessionId },
        { headers: getAuthHeaders() }
      );
      if (!sessionId) setSessionId(data.session_id);
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: data.response,
          actions_taken: data.actions_taken || [],
          files_modified: data.files_modified || [],
          iterations: data.iterations || 0,
          execution_time_ms: data.execution_time_ms || 0,
          report: data.report || null,
        },
      ]);
      setTaskInput("");
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: "Erreur tache : " + (err.response?.data?.detail || err.message),
          actions_taken: [],
          files_modified: [],
        },
      ]);
    } finally {
      setTaskLoading(false);
    }
  };

  const loadMemories = async () => {
    try {
      const { data } = await axios.get(`${API}/api/ai/memory`, {
        params: memCat ? { category: memCat } : {},
        headers: getAuthHeaders(),
      });
      setMemories(data.memories || []);
    } catch {
      setMemories([]);
    }
  };

  useEffect(() => {
    if (activeTab === "memory") loadMemories();
  }, [activeTab, memCat]);

  const newSession = async () => {
    if (sessionId) {
      try {
        await axios.delete(`${API}/api/ai/sessions/${sessionId}`, { headers: getAuthHeaders() });
      } catch {}
    }
    setSessionId(null);
    setMessages([
      {
        role: "assistant",
        content: "Nouvelle session. Comment puis-je t'aider ?",
        actions_taken: [],
        files_modified: [],
      },
    ]);
  };

  const quickActions = [
    { label: "Structure du projet", msg: "Liste la structure complete du projet" },
    { label: "Scan securite", msg: "Fais un scan rapide des secrets hardcodes et failles evidentes" },
    { label: "Status git", msg: "Montre le git status et les derniers commits" },
    { label: "Collections MongoDB", msg: "Liste toutes les collections MongoDB" },
    { label: "Lancer les tests", msg: "Lance tous les tests pytest" },
    { label: "Memoire", msg: "Rappelle-toi tout ce que tu sais sur ce projet" },
  ];

  const S = {
    sidebar: {
      width: 240,
      background: "#0f172a",
      color: "#e2e8f0",
      display: "flex",
      flexDirection: "column",
      flexShrink: 0,
      borderRight: "1px solid #1e293b",
    },
    tab: {
      display: "flex",
      alignItems: "center",
      gap: 10,
      width: "100%",
      padding: "10px 12px",
      borderRadius: 8,
      border: "none",
      cursor: "pointer",
      fontSize: 13,
      textAlign: "left",
      marginBottom: 2,
    },
  };

  return (
    <div
      style={{
        display: "flex",
        height: "100vh",
        fontFamily: "system-ui,sans-serif",
        background: "#f8fafc",
        overflow: "hidden",
      }}
    >
      <div style={S.sidebar}>
        <div style={{ padding: "20px 16px 12px", borderBottom: "1px solid #1e293b" }}>
          <p style={{ margin: 0, fontWeight: 700, fontSize: 15 }}>Agent IA V2</p>
          <p style={{ margin: 0, fontSize: 11, color: "#64748b" }}>Claude - Principal Developer</p>
          {agentHealth && (
            <p
              style={{
                margin: "6px 0 0",
                fontSize: 10,
                color: agentHealth.status === "operational" ? "#22c55e" : "#ef4444",
              }}
            >
              {agentHealth.status === "operational" ? "● En ligne" : "● API Key manquante"}
            </p>
          )}
          {sessionId && (
            <p style={{ margin: "4px 0 0", fontSize: 10, color: "#475569", fontFamily: "monospace" }}>
              {sessionId.slice(0, 22)}...
            </p>
          )}
        </div>
        <nav style={{ padding: "8px", flex: 1 }}>
          {[
            { id: "chat", icon: "💬", label: "Chat" },
            { id: "audit", icon: "🔍", label: "Audit" },
            { id: "task", icon: "📋", label: "Tache autonome" },
            { id: "memory", icon: "🧠", label: "Memoire" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                ...S.tab,
                background: activeTab === tab.id ? "#1e293b" : "transparent",
                color: activeTab === tab.id ? "#e2e8f0" : "#64748b",
                fontWeight: activeTab === tab.id ? 600 : 400,
              }}
            >
              <span>{tab.icon}</span>
              <span>{tab.label}</span>
            </button>
          ))}
        </nav>
        <div style={{ padding: "12px 16px", borderTop: "1px solid #1e293b" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <span style={{ fontSize: 12, color: "#94a3b8" }}>Mode autonome</span>
            <button
              onClick={() => setAutonomousMode((v) => !v)}
              style={{
                width: 40,
                height: 22,
                borderRadius: 11,
                border: "none",
                cursor: "pointer",
                background: autonomousMode ? "#6366f1" : "#374151",
                position: "relative",
                transition: "background 0.2s",
              }}
            >
              <span
                style={{
                  position: "absolute",
                  top: 3,
                  left: autonomousMode ? 21 : 3,
                  width: 16,
                  height: 16,
                  borderRadius: "50%",
                  background: "#fff",
                  transition: "left 0.2s",
                }}
              />
            </button>
          </div>
          <p style={{ fontSize: 10, color: "#475569", margin: "4px 0 0" }}>
            {autonomousMode ? "Agit sur le code" : "Repond seulement"}
          </p>
        </div>
        <div style={{ padding: "0 8px 12px" }}>
          <button
            onClick={newSession}
            style={{
              width: "100%",
              padding: "8px 12px",
              borderRadius: 8,
              border: "1px solid #1e293b",
              background: "transparent",
              color: "#64748b",
              fontSize: 12,
              cursor: "pointer",
            }}
          >
            Nouvelle session
          </button>
        </div>
      </div>

      <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
        {activeTab === "chat" && (
          <>
            <div style={{ flex: 1, overflowY: "auto", padding: "20px 24px" }}>
              {messages.map((msg, i) => (
                <MessageBubble key={i} msg={msg} />
              ))}
              {loading && (
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                    padding: "12px 16px",
                    background: "#f3f4f6",
                    borderRadius: 12,
                    margin: "8px 0",
                  }}
                >
                  <span style={{ fontSize: 13, color: "#6b7280" }}>
                    {autonomousMode ? "L'agent travaille..." : "L'agent reflechit..."}
                  </span>
                </div>
              )}
              <div ref={bottomRef} />
            </div>
            {messages.length <= 1 && (
              <div style={{ padding: "0 24px 12px", display: "flex", flexWrap: "wrap", gap: 6 }}>
                {quickActions.map((a, i) => (
                  <button
                    key={i}
                    onClick={() => sendMessage(a.msg)}
                    style={{
                      padding: "6px 12px",
                      borderRadius: 99,
                      border: "1px solid #e2e8f0",
                      background: "#fff",
                      fontSize: 12,
                      cursor: "pointer",
                      color: "#475569",
                    }}
                  >
                    {a.label}
                  </button>
                ))}
              </div>
            )}
            <div style={{ padding: "12px 24px 20px", borderTop: "1px solid #e2e8f0", background: "#fff" }}>
              <div style={{ display: "flex", gap: 10, alignItems: "flex-end" }}>
                <textarea
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      sendMessage();
                    }
                  }}
                  placeholder="Dis-moi ce que tu veux faire... (Entree pour envoyer)"
                  disabled={loading}
                  rows={3}
                  style={{
                    flex: 1,
                    padding: "12px 14px",
                    borderRadius: 12,
                    border: "1px solid #e2e8f0",
                    fontSize: 14,
                    resize: "none",
                    fontFamily: "inherit",
                    outline: "none",
                  }}
                />
                <button
                  onClick={() => sendMessage()}
                  disabled={loading || !input.trim()}
                  style={{
                    padding: "12px 20px",
                    borderRadius: 12,
                    border: "none",
                    background: loading || !input.trim() ? "#e2e8f0" : "#6366f1",
                    color: loading || !input.trim() ? "#94a3b8" : "#fff",
                    fontSize: 14,
                    fontWeight: 600,
                    cursor: loading || !input.trim() ? "not-allowed" : "pointer",
                    height: 48,
                  }}
                >
                  {loading ? "..." : "Envoyer"}
                </button>
              </div>
            </div>
          </>
        )}

        {activeTab === "audit" && (
          <div style={{ padding: 32, maxWidth: 640 }}>
            <h2 style={{ margin: "0 0 8px", fontSize: 20 }}>Audit automatique</h2>
            <p style={{ color: "#64748b", margin: "0 0 24px", fontSize: 14 }}>
              L'agent analyse ton projet et genere un rapport structure.
            </p>
            <div style={{ display: "grid", gap: 10, marginBottom: 24 }}>
              {AUDIT_TYPES.map((a) => (
                <label
                  key={a.value}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 14,
                    padding: "14px 16px",
                    borderRadius: 12,
                    cursor: "pointer",
                    border: `2px solid ${auditType === a.value ? "#6366f1" : "#e2e8f0"}`,
                    background: auditType === a.value ? "#eef2ff" : "#fff",
                  }}
                >
                  <input
                    type="radio"
                    name="audit"
                    value={a.value}
                    checked={auditType === a.value}
                    onChange={() => setAuditType(a.value)}
                    style={{ display: "none" }}
                  />
                  <div>
                    <p style={{ margin: 0, fontWeight: 600, fontSize: 14 }}>{a.label}</p>
                    <p style={{ margin: 0, fontSize: 12, color: "#64748b" }}>{a.desc}</p>
                  </div>
                  {auditType === a.value && <span style={{ marginLeft: "auto", color: "#6366f1", fontWeight: 700 }}>✓</span>}
                </label>
              ))}
            </div>
            <button
              onClick={runAudit}
              disabled={auditLoading}
              style={{
                padding: "14px",
                borderRadius: 12,
                border: "none",
                background: auditLoading ? "#e2e8f0" : "#6366f1",
                color: auditLoading ? "#94a3b8" : "#fff",
                fontSize: 15,
                fontWeight: 600,
                cursor: auditLoading ? "not-allowed" : "pointer",
                width: "100%",
              }}
            >
              {auditLoading ? "En cours..." : "Lancer l'audit"}
            </button>
          </div>
        )}

        {activeTab === "task" && (
          <div style={{ padding: 32, maxWidth: 640 }}>
            <h2 style={{ margin: "0 0 8px", fontSize: 20 }}>Tache autonome</h2>
            <p style={{ color: "#64748b", margin: "0 0 20px", fontSize: 14 }}>
              Decris une tache complexe. L'agent planifie, execute, teste et corrige.
            </p>
            <textarea
              value={taskInput}
              onChange={(e) => setTaskInput(e.target.value)}
              placeholder={
                "Exemples :\n• Ajouter la pagination sur /api/products\n• Corriger les endpoints sans gestion d'erreur\n• Ajouter des index MongoDB\n• Generer les tests pytest pour orders.py"
              }
              rows={8}
              style={{
                width: "100%",
                padding: 16,
                borderRadius: 12,
                border: "1px solid #e2e8f0",
                fontSize: 14,
                resize: "vertical",
                fontFamily: "inherit",
                outline: "none",
                boxSizing: "border-box",
              }}
            />
            <button
              onClick={runTask}
              disabled={taskLoading || !taskInput.trim()}
              style={{
                marginTop: 12,
                padding: "14px",
                borderRadius: 12,
                border: "none",
                background: taskLoading || !taskInput.trim() ? "#e2e8f0" : "#6366f1",
                color: taskLoading || !taskInput.trim() ? "#94a3b8" : "#fff",
                fontSize: 15,
                fontWeight: 600,
                cursor: taskLoading || !taskInput.trim() ? "not-allowed" : "pointer",
                width: "100%",
              }}
            >
              {taskLoading ? "Execution en cours..." : "Executer la tache"}
            </button>
          </div>
        )}

        {activeTab === "memory" && (
          <div style={{ flex: 1, padding: 32, overflowY: "auto" }}>
            <h2 style={{ margin: "0 0 8px", fontSize: 20 }}>Memoire longue duree</h2>
            <div style={{ display: "flex", gap: 8, marginBottom: 20, flexWrap: "wrap" }}>
              {["", "bug_fixed", "architecture_decision", "pattern_found", "security_note", "performance_note", "todo"].map(
                (cat) => (
                  <button
                    key={cat}
                    onClick={() => setMemCat(cat)}
                    style={{
                      padding: "6px 14px",
                      borderRadius: 99,
                      border: "none",
                      cursor: "pointer",
                      fontSize: 12,
                      fontWeight: 600,
                      background: memCat === cat ? "#6366f1" : "#e2e8f0",
                      color: memCat === cat ? "#fff" : "#64748b",
                    }}
                  >
                    {cat || "Tout"}
                  </button>
                )
              )}
            </div>
            {memories.length === 0 ? (
              <p style={{ color: "#94a3b8", textAlign: "center", marginTop: 60 }}>
                Aucun souvenir. L'agent memorise automatiquement les informations importantes.
              </p>
            ) : (
              <div style={{ display: "grid", gap: 10 }}>
                {memories.map((m, i) => (
                  <div
                    key={i}
                    style={{
                      padding: "14px 16px",
                      borderRadius: 10,
                      background: "#fff",
                      border: "1px solid #e2e8f0",
                    }}
                  >
                    <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 6 }}>
                      <span
                        style={{
                          fontSize: 11,
                          fontWeight: 600,
                          padding: "2px 8px",
                          borderRadius: 99,
                          background: "#eef2ff",
                          color: "#6366f1",
                        }}
                      >
                        {m.category}
                      </span>
                      {m.file_reference && <code style={{ fontSize: 11, color: "#64748b" }}>{m.file_reference}</code>}
                      <span style={{ marginLeft: "auto", fontSize: 11, color: "#94a3b8" }}>
                        {m.created_at ? new Date(m.created_at).toLocaleDateString("fr-FR") : ""}
                      </span>
                    </div>
                    <p style={{ margin: 0, fontSize: 13, lineHeight: 1.6 }}>{m.content}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
