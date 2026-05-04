import React, { useEffect, useRef, useState } from "react";

/* ─── Google Fonts injected once ─── */
const injectFonts = () => {
  if (document.getElementById("ed-fonts")) return;
  const link = document.createElement("link");
  link.id = "ed-fonts";
  link.rel = "stylesheet";
  link.href =
    "https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600&family=Syne:wght@700&display=swap";
  document.head.appendChild(link);
};

/* ─── Helpers ─── */
const initials = (name = "") =>
  name
    .split(" ")
    .map((p) => p[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

const getDate = () =>
  new Date().toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });

const formatMessageTime = (value) =>
  new Date(value).toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
  });

const STATUS_LABELS = {
  pending: "Pending",
  in_progress: "In progress",
  completed: "Completed",
};

/* ─── Sub-components ─── */

const StatCard = ({ label, value, variant }) => (
  <div style={{ ...s.statCard, ...s[`stat_${variant}`] }}>
    <div style={s.statAccent(variant)} />
    <div style={s.statLabel}>{label}</div>
    <div style={s.statValue}>{value}</div>
    <div style={s.statSub}>
      {variant === "pending"
        ? "awaiting action"
        : variant === "in_progress"
        ? "currently active"
        : "finished tasks"}
    </div>
  </div>
);

const Badge = ({ status }) => (
  <span style={{ ...s.badge, ...s[`badge_${status}`] }}>
    <span style={{ ...s.badgeDot, ...s[`dot_${status}`] }} />
    {STATUS_LABELS[status] || status}
  </span>
);

const WorkCard = ({ work, onUpdateStatus }) => (
  <div
    style={{
      ...s.workCard,
      ...(work.status === "completed" ? s.workCardDone : {}),
    }}
  >
    <div style={{ ...s.statusBar, ...s[`bar_${work.status}`] }} />

    <div style={s.workLeft}>
      <div style={s.workTitle}>{work.title}</div>
      <div style={s.workDesc}>{work.description}</div>
      <div style={s.workMeta}>
        <Badge status={work.status} />
      </div>
    </div>

    <div style={s.workRight}>
      {work.status === "pending" && (
        <button
          style={{ ...s.actionBtn, ...s.btnAccept }}
          onClick={() => onUpdateStatus(work.id, "in_progress")}
        >
          Accept
        </button>
      )}
      {work.status === "in_progress" && (
        <button
          style={{ ...s.actionBtn, ...s.btnComplete }}
          onClick={() => onUpdateStatus(work.id, "completed")}
        >
          Mark done
        </button>
      )}
    </div>
  </div>
);

/* ─── Main Component ─── */

const EmployeeDashboard = () => {
  injectFonts();

  const employeeId = localStorage.getItem("user_id");
  const employeeName = localStorage.getItem("username") || "Alex Morgan";
  const firstName = employeeName.split(" ")[0];
  const token = localStorage.getItem("token");
  const apiFetch = (url, options = {}) =>
    window.fetch(url, {
      ...options,
      headers: {
        Authorization: `Token ${token}`,
        ...(options.headers || {}),
      },
    });

  const [works, setWorks] = useState([]);
  const [filter, setFilter] = useState("all");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [contacts, setContacts] = useState([]);
  const [selectedManager, setSelectedManager] = useState("");
  const [messages, setMessages] = useState([]);
  const [messageBody, setMessageBody] = useState("");
  const [messageLoading, setMessageLoading] = useState(false);
  const [messageSending, setMessageSending] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [contactSummaries, setContactSummaries] = useState({});
  const [notification, setNotification] = useState(null);
  const [editingMessageId, setEditingMessageId] = useState(null);
  const [editingMessageBody, setEditingMessageBody] = useState("");
  const selectedManagerRef = useRef("");
  const messageRequestRef = useRef(0);

  useEffect(() => {
    verifySession();
    fetchWorks();
    fetchContacts();
    fetchUnreadCount();
    fetchContactSummaries();

    const unreadTimer = setInterval(() => {
      fetchUnreadCount();
      fetchContactSummaries();
    }, 10000);
    return () => clearInterval(unreadTimer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (selectedManager) {
      fetchMessages(selectedManager);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedManager]);

  useEffect(() => {
    selectedManagerRef.current = selectedManager;
  }, [selectedManager]);

  useEffect(() => {
    if (!selectedManager) return;

    const messageTimer = setInterval(() => {
      fetchMessages(selectedManager, { silent: true });
    }, 3000);

    return () => clearInterval(messageTimer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedManager]);

  /* ── API calls ── */

  const verifySession = async () => {
    try {
      const res = await apiFetch("http://127.0.0.1:8000/me/");
      if (!res.ok) throw new Error("Session expired");
      const user = await res.json();

      if (user.role !== "employee") throw new Error("Invalid role");

      if (String(user.id) !== String(employeeId)) {
        throw new Error("Session user mismatch");
      }

      if (user.username !== employeeName) {
        localStorage.setItem("username", user.username);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const fetchWorks = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await apiFetch(
        `http://127.0.0.1:8000/employee-work/${employeeId}/`
      );
      if (!res.ok) throw new Error("Failed to load tasks");
      const data = await res.json();
      setWorks(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (workId, status) => {
    /* Optimistic update */
    setWorks((prev) =>
      prev.map((w) => (w.id === workId ? { ...w, status } : w))
    );

    try {
      const res = await apiFetch(
        `http://127.0.0.1:8000/update-work/${workId}/`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status }),
        }
      );
      if (!res.ok) throw new Error("Update failed");
    } catch (err) {
      /* Rollback on error */
      fetchWorks();
      alert("Status update failed. Please try again.");
    }
  };

  const fetchContacts = async () => {
    try {
      const res = await apiFetch(`http://127.0.0.1:8000/users/?exclude_id=${employeeId}`);
      if (!res.ok) throw new Error("Failed to load people");
      const data = await res.json();
      const availableContacts = data.filter(
        (user) =>
          String(user.id) !== String(employeeId) &&
          user.username !== employeeName
      );
      setContacts(availableContacts);
      setSelectedManager((current) => {
        if (availableContacts.some((user) => String(user.id) === String(current))) return current;
        return availableContacts.length > 0 ? availableContacts[0].id : "";
      });
    } catch (err) {
      console.error(err);
    }
  };

  const fetchMessages = async (managerId, options = {}) => {
    if (!employeeId || !managerId) return;

    const requestId = ++messageRequestRef.current;
    const requestedManagerId = String(managerId);
    if (!options.silent) setMessageLoading(true);
    try {
      const res = await apiFetch(`http://127.0.0.1:8000/messages/${employeeId}/${managerId}/`);
      if (!res.ok) throw new Error("Failed to load messages");
      const data = await res.json();

      if (
        requestId !== messageRequestRef.current ||
        String(selectedManagerRef.current) !== requestedManagerId
      ) {
        return;
      }

      if (!Array.isArray(data)) throw new Error("Invalid messages response");

      setMessages(data);
      await apiFetch(`http://127.0.0.1:8000/messages/${employeeId}/${managerId}/seen/`, {
        method: "POST",
      });
      fetchUnreadCount();
      fetchContactSummaries();
    } catch (err) {
      console.error(err);
      if (!options.silent) notify("Could not load messages", "danger");
    } finally {
      if (!options.silent && String(selectedManagerRef.current) === requestedManagerId) {
        setMessageLoading(false);
      }
    }
  };

  const fetchUnreadCount = async () => {
    if (!employeeId) return;

    try {
      const res = await apiFetch(`http://127.0.0.1:8000/messages/unread/${employeeId}/`);
      if (!res.ok) return;
      const data = await res.json();
      setUnreadCount(data.count || 0);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchContactSummaries = async () => {
    if (!employeeId) return;

    try {
      const res = await apiFetch(`http://127.0.0.1:8000/messages/summaries/${employeeId}/`);
      if (!res.ok) return;
      const data = await res.json();
      setContactSummaries(Object.fromEntries(data.map((item) => [item.contact, item])));
    } catch (err) {
      console.error(err);
    }
  };

  const handleLogout = () => {
    localStorage.clear();
    localStorage.setItem("logged_out", "true");
    window.location.href = "/login";
  };

  const notify = (msg, type = "success") => {
    setNotification({ msg, type });
    setTimeout(() => setNotification(null), 3000);
  };

  const sendMessage = async () => {
    const receiverId = selectedManager;
    const body = messageBody.trim();

    if (!receiverId || String(receiverId) === String(employeeId) || !body || messageSending) return;

    setMessageSending(true);

    try {
      const res = await apiFetch("http://127.0.0.1:8000/messages/send/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sender: employeeId,
          receiver: receiverId,
          body,
        }),
      });

      if (!res.ok) throw new Error("Message failed to send");

      const sent = await res.json();
      if (String(selectedManagerRef.current) === String(receiverId)) {
        setMessages((prev) => [...prev, sent]);
      }
      setMessageBody("");
      fetchMessages(receiverId, { silent: true });
      fetchContactSummaries();
    } catch (err) {
      console.error(err);
      notify("Message failed to send. Please try again.", "danger");
    } finally {
      setMessageSending(false);
    }
  };

  const startEditMessage = (msg) => {
    setEditingMessageId(msg.id);
    setEditingMessageBody(msg.body);
  };

  const cancelEditMessage = () => {
    setEditingMessageId(null);
    setEditingMessageBody("");
  };

  const saveEditedMessage = async (messageId) => {
    if (!editingMessageBody.trim()) {
      notify("Message cannot be empty", "warning");
      return;
    }

    const res = await apiFetch(`http://127.0.0.1:8000/messages/${messageId}/edit/`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sender: employeeId, body: editingMessageBody }),
    });

    if (res.ok) {
      const updated = await res.json();
      setMessages((prev) => prev.map((msg) => (msg.id === messageId ? updated : msg)));
      cancelEditMessage();
      fetchContactSummaries();
      notify("Message updated");
    } else {
      notify("Message edit failed", "danger");
    }
  };

  const deleteMessage = async (messageId) => {
    if (!window.confirm("Delete this message?")) return;

    const res = await apiFetch(`http://127.0.0.1:8000/messages/${messageId}/delete/`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sender: employeeId }),
    });

    if (res.ok) {
      setMessages((prev) => prev.filter((msg) => msg.id !== messageId));
      fetchContactSummaries();
      notify("Message deleted", "danger");
    } else {
      notify("Message delete failed", "danger");
    }
  };

  /* ── Derived state ── */

  const counts = {
    pending: works.filter((w) => w.status === "pending").length,
    in_progress: works.filter((w) => w.status === "in_progress").length,
    completed: works.filter((w) => w.status === "completed").length,
  };

  const filtered =
    filter === "all" ? works : works.filter((w) => w.status === filter);
  const selectedUnreadCount = contactSummaries[selectedManager]?.unread_count || 0;

  /* ── Render ── */

  return (
    <div style={s.container}>
      {notification && (
        <div style={{ ...s.toast, ...s[`toast_${notification.type}`] }}>
          {notification.msg}
        </div>
      )}
      {unreadCount > 0 && (
        <button style={s.messagePopup}>
          {unreadCount} new message{unreadCount === 1 ? "" : "s"}
        </button>
      )}
      {/* ── Top bar ── */}
      <div style={s.topBar}>
        <div style={s.greetingBlock}>
          <div style={s.avatar}>{initials(employeeName)}</div>
          <div>
            <h1 style={s.title}>Hello, {firstName}</h1>
            <p style={s.subtitle}>Here's your workload today</p>
          </div>
        </div>
        <div style={s.topActions}>
          <div style={s.dateChip}>{getDate()}</div>
          <button style={s.logoutBtn} onClick={handleLogout}>
            Logout
          </button>
        </div>
      </div>

      {/* ── Stat cards ── */}
      <div style={s.statsRow}>
        <StatCard label="Pending" value={counts.pending} variant="pending" />
        <StatCard
          label="In progress"
          value={counts.in_progress}
          variant="in_progress"
        />
        <StatCard
          label="Completed"
          value={counts.completed}
          variant="completed"
        />
      </div>

      {/* ── Task list ── */}
      <div style={s.card}>
        <div style={s.sectionHeader}>
          <span style={s.sectionTitle}>My tasks</span>
          <div style={s.filterPills}>
            {["all", "pending", "in_progress", "completed"].map((f) => (
              <button
                key={f}
                style={{
                  ...s.pill,
                  ...(filter === f ? s.pillActive : {}),
                }}
                onClick={() => setFilter(f)}
              >
                {f === "all"
                  ? "All"
                  : f === "in_progress"
                  ? "Active"
                  : f.charAt(0).toUpperCase() + f.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {loading && <p style={s.stateMsg}>Loading tasks…</p>}

        {error && (
          <div style={s.errorBox}>
            <span>{error}</span>
            <button style={s.retryBtn} onClick={fetchWorks}>
              Retry
            </button>
          </div>
        )}

        {!loading && !error && filtered.length === 0 && (
          <div style={s.emptyState}>
            <svg
              width="40"
              height="40"
              viewBox="0 0 40 40"
              fill="none"
              style={{ opacity: 0.3, marginBottom: 12 }}
            >
              <rect
                x="6"
                y="4"
                width="28"
                height="33"
                rx="3"
                stroke="currentColor"
                strokeWidth="2"
              />
              <path
                d="M13 14h14M13 20h14M13 26h8"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
              />
            </svg>
            <p style={s.emptyText}>No tasks here</p>
          </div>
        )}

        {!loading && !error && (
          <div style={s.workList}>
            {filtered.map((work) => (
              <WorkCard
                key={work.id}
                work={work}
                onUpdateStatus={updateStatus}
              />
            ))}
          </div>
        )}
      </div>

      <div style={{ ...s.card, marginTop: 20 }}>
        <div style={s.sectionHeader}>
          <span style={s.sectionTitle}>Private messages</span>
          <div style={s.chatHeaderActions}>
            <span style={s.messageCount}>{selectedUnreadCount} unread received</span>
            <span style={s.secureChip}>Encrypted at rest</span>
          </div>
        </div>

        <div style={s.messageGrid}>
          <div style={s.managerList}>
            {contacts.length === 0 && <p style={s.stateMsg}>No approved users found</p>}
            {contacts.map((manager) => {
              const summary = contactSummaries[manager.id] || {};
              return (
                <button
                  key={manager.id}
                  style={{
                    ...s.contactRow,
                    ...(String(selectedManager) === String(manager.id) ? s.contactRowActive : {}),
                  }}
                  onClick={() => setSelectedManager(manager.id)}
                >
                  <span style={s.contactAvatar}>{initials(manager.username)}</span>
                  <span style={s.contactInfo}>
                    <span style={s.contactNameRow}>
                      <span style={s.contactName}>{manager.username}</span>
                      {summary.unread_count > 0 && (
                        <span style={s.contactUnreadBadge}>{summary.unread_count}</span>
                      )}
                    </span>
                    <span style={summary.unread_count > 0 ? s.contactUnreadText : s.contactEmail}>
                      {summary.unread_count > 0
                        ? `${summary.unread_count} unread`
                        : summary.status || "No messages"}
                    </span>
                  </span>
                </button>
              );
            })}
          </div>

          <div>
            {!selectedManager && <p style={s.stateMsg}>Select a person to view messages</p>}
            {selectedManager && (
              <>
                <div style={s.messageList}>
                  {messageLoading && <p style={s.stateMsg}>Loading messages...</p>}
                  {!messageLoading && messages.length === 0 && (
                    <p style={s.stateMsg}>No messages yet</p>
                  )}
                  {!messageLoading &&
                    messages.map((msg) => {
                      const isMine = String(msg.sender) === String(employeeId);
                      return (
                        <div
                          key={msg.id}
                          style={{
                            ...s.messageBubbleWrap,
                            justifyContent: isMine ? "flex-end" : "flex-start",
                          }}
                        >
                          <div style={{ ...s.messageBubble, ...(isMine ? s.messageMine : s.messageTheirs) }}>
                            {editingMessageId === msg.id ? (
                              <>
                                <textarea
                                  style={s.editMessageInput}
                                  value={editingMessageBody}
                                  onChange={(e) => setEditingMessageBody(e.target.value)}
                                />
                                <div style={s.messageActions}>
                                  <button style={s.messageTinyBtn} onClick={() => saveEditedMessage(msg.id)}>Save</button>
                                  <button style={s.messageTinyBtn} onClick={cancelEditMessage}>Cancel</button>
                                </div>
                              </>
                            ) : (
                              <>
                                <div style={s.messageText}>{msg.body}</div>
                                <div style={s.messageMeta}>
                                  {formatMessageTime(msg.created_at)}
                                  {msg.edited_at && " · Edited"}
                                  {isMine && ` · ${msg.seen_at ? "Seen" : "Delivered"}`}
                                </div>
                                {isMine && (
                                  <div style={s.messageActions}>
                                    <button style={s.messageTinyBtn} onClick={() => startEditMessage(msg)}>Edit</button>
                                    <button style={s.messageTinyBtn} onClick={() => deleteMessage(msg.id)}>Delete</button>
                                  </div>
                                )}
                              </>
                            )}
                          </div>
                        </div>
                      );
                    })}
                </div>

                <div style={s.messageComposer}>
                  <textarea
                    style={{ ...s.messageInput }}
                    placeholder="Write a private message..."
                    value={messageBody}
                    onChange={(e) => setMessageBody(e.target.value)}
                  />
                  <button
                    style={{
                      ...s.btnSend,
                      ...(messageSending ? s.btnSendDisabled : {}),
                    }}
                    onClick={sendMessage}
                    disabled={messageSending}
                  >
                    {messageSending ? "Sending..." : "Send"}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default EmployeeDashboard;

/* ═══════════════════════════════════════
   STYLES
═══════════════════════════════════════ */

const COLORS = {
  amber: { bg: "#FAEEDA", text: "#854F0B", dot: "#EF9F27", bar: "#EF9F27" },
  blue: { bg: "#E6F1FB", text: "#185FA5", dot: "#378ADD", bar: "#378ADD" },
  green: { bg: "#EAF3DE", text: "#3B6D11", dot: "#639922", bar: "#639922" },
};

const s = {
  /* Layout */
  container: {
    minHeight: "100vh",
    padding: "28px 24px",
    background: "#f4f7fb",
    fontFamily: "'Plus Jakarta Sans', Arial, sans-serif",
  },
  toast: {
    position: "fixed",
    top: 20,
    right: 20,
    zIndex: 9999,
    padding: "10px 18px",
    borderRadius: 8,
    fontSize: 13,
    fontWeight: 600,
    boxShadow: "0 4px 12px rgba(0,0,0,0.12)",
  },
  toast_success: { background: "#EAF3DE", color: "#3B6D11" },
  toast_danger: { background: "#FCEBEB", color: "#A32D2D" },
  toast_warning: { background: "#FAEEDA", color: "#854F0B" },
  messagePopup: {
    position: "fixed",
    top: 18,
    left: "50%",
    transform: "translateX(-50%)",
    zIndex: 9998,
    padding: "10px 16px",
    borderRadius: 8,
    border: "none",
    background: "#185FA5",
    color: "#E6F1FB",
    fontSize: 13,
    fontWeight: 700,
    cursor: "pointer",
    boxShadow: "0 4px 12px rgba(0,0,0,0.14)",
    fontFamily: "inherit",
  },

  /* Top bar */
  topBar: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 28,
    flexWrap: "wrap",
    gap: 12,
  },
  greetingBlock: { display: "flex", alignItems: "center", gap: 14 },
  avatar: {
    width: 46,
    height: 46,
    borderRadius: "50%",
    background: "#185FA5",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontFamily: "'Syne', Arial, sans-serif",
    fontSize: 16,
    fontWeight: 700,
    color: "#B5D4F4",
    letterSpacing: "0.5px",
    flexShrink: 0,
  },
  title: {
    fontFamily: "'Syne', Arial, sans-serif",
    fontSize: 20,
    fontWeight: 700,
    color: "#0f172a",
    margin: 0,
  },
  subtitle: { fontSize: 13, color: "#64748b", marginTop: 2 },
  topActions: {
    display: "flex",
    alignItems: "center",
    gap: 10,
  },
  dateChip: {
    fontSize: 12,
    color: "#64748b",
    background: "#fff",
    border: "0.5px solid #e2e8f0",
    borderRadius: 8,
    padding: "6px 12px",
    fontWeight: 500,
    whiteSpace: "nowrap",
  },
  logoutBtn: {
    fontSize: 12,
    fontWeight: 700,
    padding: "8px 12px",
    borderRadius: 8,
    border: "0.5px solid #fecaca",
    background: "#fff",
    color: "#A32D2D",
    cursor: "pointer",
    fontFamily: "inherit",
  },

  /* Stats */
  statsRow: {
    display: "grid",
    gridTemplateColumns: "repeat(3, 1fr)",
    gap: 12,
    marginBottom: 24,
  },
  statCard: {
    background: "#fff",
    border: "0.5px solid #e2e8f0",
    borderRadius: 12,
    padding: 16,
    position: "relative",
    overflow: "hidden",
  },
  statAccent: (variant) => ({
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 3,
    background:
      variant === "pending"
        ? COLORS.amber.bar
        : variant === "in_progress"
        ? COLORS.blue.bar
        : COLORS.green.bar,
  }),
  statLabel: {
    fontSize: 11,
    fontWeight: 600,
    letterSpacing: "0.06em",
    textTransform: "uppercase",
    color: "#94a3b8",
    marginBottom: 6,
  },
  statValue: {
    fontFamily: "'Syne', Arial, sans-serif",
    fontSize: 28,
    fontWeight: 700,
    color: "#0f172a",
    lineHeight: 1,
  },
  statSub: { fontSize: 11, color: "#94a3b8", marginTop: 4 },

  /* Card wrapper */
  card: {
    background: "#fff",
    border: "0.5px solid #e2e8f0",
    borderRadius: 12,
    padding: "20px",
  },

  /* Section header */
  sectionHeader: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 14,
    flexWrap: "wrap",
    gap: 8,
  },
  sectionTitle: {
    fontFamily: "'Syne', Arial, sans-serif",
    fontSize: 15,
    fontWeight: 700,
    color: "#0f172a",
  },
  filterPills: { display: "flex", gap: 6, flexWrap: "wrap" },
  pill: {
    fontSize: 11,
    fontWeight: 600,
    padding: "4px 10px",
    borderRadius: 20,
    border: "0.5px solid #cbd5e1",
    cursor: "pointer",
    color: "#64748b",
    background: "transparent",
    fontFamily: "inherit",
  },
  pillActive: {
    background: "#f1f5f9",
    color: "#0f172a",
    borderColor: "#94a3b8",
  },

  /* Work list */
  workList: { display: "flex", flexDirection: "column", gap: 10 },

  workCard: {
    background: "#fff",
    border: "0.5px solid #e2e8f0",
    borderRadius: 12,
    padding: "16px 16px 16px 20px",
    display: "flex",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 12,
    position: "relative",
  },
  workCardDone: { opacity: 0.6 },

  statusBar: {
    position: "absolute",
    left: 0,
    top: 12,
    bottom: 12,
    width: 3,
    borderRadius: "0 2px 2px 0",
  },
  bar_pending: { background: COLORS.amber.bar },
  bar_in_progress: { background: COLORS.blue.bar },
  bar_completed: { background: COLORS.green.bar },

  workLeft: { flex: 1, minWidth: 0 },
  workTitle: {
    fontSize: 14,
    fontWeight: 600,
    color: "#0f172a",
    marginBottom: 4,
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
  },
  workDesc: {
    fontSize: 12,
    color: "#64748b",
    lineHeight: 1.5,
    display: "-webkit-box",
    WebkitLineClamp: 2,
    WebkitBoxOrient: "vertical",
    overflow: "hidden",
  },
  workMeta: { display: "flex", alignItems: "center", gap: 8, marginTop: 8 },

  /* Badge */
  badge: {
    fontSize: 10,
    fontWeight: 600,
    padding: "3px 8px",
    borderRadius: 20,
    display: "inline-flex",
    alignItems: "center",
    gap: 4,
  },
  badge_pending: { background: COLORS.amber.bg, color: COLORS.amber.text },
  badge_in_progress: { background: COLORS.blue.bg, color: COLORS.blue.text },
  badge_completed: { background: COLORS.green.bg, color: COLORS.green.text },

  badgeDot: { width: 5, height: 5, borderRadius: "50%" },
  dot_pending: { background: COLORS.amber.dot },
  dot_in_progress: { background: COLORS.blue.dot },
  dot_completed: { background: COLORS.green.dot },

  /* Work right (actions) */
  workRight: {
    display: "flex",
    flexDirection: "column",
    alignItems: "flex-end",
    gap: 6,
    flexShrink: 0,
  },
  actionBtn: {
    fontSize: 11,
    fontWeight: 600,
    padding: "7px 13px",
    borderRadius: 8,
    border: "none",
    cursor: "pointer",
    fontFamily: "inherit",
  },
  btnAccept: { background: "#185FA5", color: "#E6F1FB" },
  btnComplete: { background: "#3B6D11", color: "#EAF3DE" },

  /* States */
  stateMsg: { textAlign: "center", color: "#94a3b8", padding: "24px 0", fontSize: 13 },
  emptyState: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    padding: "40px 20px",
    color: "#94a3b8",
  },
  emptyText: { fontSize: 13 },
  errorBox: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    background: "#FCEBEB",
    border: "0.5px solid #F09595",
    borderRadius: 8,
    padding: "10px 14px",
    fontSize: 13,
    color: "#A32D2D",
    marginBottom: 12,
  },
  retryBtn: {
    fontSize: 11,
    fontWeight: 600,
    padding: "4px 10px",
    borderRadius: 6,
    border: "0.5px solid #E24B4A",
    background: "transparent",
    color: "#A32D2D",
    cursor: "pointer",
    fontFamily: "inherit",
    marginLeft: 12,
  },

  /* Messages */
  secureChip: {
    fontSize: 10,
    fontWeight: 700,
    color: "#0F6E56",
    background: "#E1F5EE",
    borderRadius: 20,
    padding: "4px 9px",
  },
  chatHeaderActions: { display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" },
  messageCount: {
    fontSize: 10,
    fontWeight: 700,
    color: "#475569",
    background: "#f1f5f9",
    borderRadius: 20,
    padding: "4px 9px",
  },
  messageGrid: {
    display: "grid",
    gridTemplateColumns: "260px minmax(0, 1fr)",
    gap: 16,
    alignItems: "start",
  },
  managerList: { display: "flex", flexDirection: "column", gap: 6 },
  contactRow: {
    width: "100%",
    display: "flex",
    alignItems: "center",
    gap: 10,
    padding: "10px",
    border: "0.5px solid transparent",
    borderRadius: 8,
    background: "transparent",
    cursor: "pointer",
    fontFamily: "inherit",
    textAlign: "left",
    outline: "none",
    WebkitTapHighlightColor: "transparent",
  },
  contactRowActive: {
    background: "#f1f5f9",
    borderColor: "#cbd5e1",
  },
  contactAvatar: {
    width: 34,
    height: 34,
    borderRadius: "50%",
    background: "#E6F1FB",
    color: "#185FA5",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontFamily: "'Syne', Arial, sans-serif",
    fontSize: 12,
    fontWeight: 700,
    flexShrink: 0,
  },
  contactInfo: { display: "flex", flexDirection: "column", gap: 2, minWidth: 0 },
  contactNameRow: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
    minWidth: 0,
  },
  contactName: { fontSize: 13, fontWeight: 600, color: "#0f172a" },
  contactEmail: { fontSize: 11, color: "#64748b" },
  contactUnreadBadge: {
    minWidth: 22,
    height: 20,
    padding: "0 7px",
    borderRadius: 20,
    background: "#185FA5",
    color: "#E6F1FB",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: 10,
    fontWeight: 800,
    flexShrink: 0,
  },
  contactUnreadText: {
    fontSize: 11,
    color: "#185FA5",
    fontWeight: 800,
  },
  messageList: {
    minHeight: 280,
    maxHeight: 380,
    overflowY: "auto",
    display: "flex",
    flexDirection: "column",
    gap: 10,
    padding: "12px",
    border: "0.5px solid #e2e8f0",
    borderRadius: 8,
    background: "#f8fafc",
  },
  messageBubbleWrap: { display: "flex" },
  messageBubble: {
    maxWidth: "72%",
    borderRadius: 8,
    padding: "9px 11px",
    fontSize: 13,
    lineHeight: 1.45,
  },
  messageMine: { background: "#185FA5", color: "#E6F1FB" },
  messageTheirs: {
    background: "#fff",
    color: "#0f172a",
    border: "0.5px solid #e2e8f0",
  },
  messageText: { whiteSpace: "pre-wrap", overflowWrap: "anywhere" },
  messageMeta: { fontSize: 10, opacity: 0.7, marginTop: 4, textAlign: "right" },
  messageActions: {
    display: "flex",
    justifyContent: "flex-end",
    gap: 6,
    marginTop: 6,
  },
  messageTinyBtn: {
    border: "0.5px solid rgba(100, 116, 139, 0.35)",
    borderRadius: 6,
    background: "rgba(255,255,255,0.18)",
    color: "inherit",
    cursor: "pointer",
    fontFamily: "inherit",
    fontSize: 10,
    fontWeight: 700,
    padding: "3px 7px",
  },
  editMessageInput: {
    width: "100%",
    minHeight: 56,
    resize: "vertical",
    border: "0.5px solid rgba(100, 116, 139, 0.35)",
    borderRadius: 6,
    padding: 8,
    boxSizing: "border-box",
    fontFamily: "inherit",
    fontSize: 13,
  },
  messageComposer: {
    display: "grid",
    gridTemplateColumns: "1fr auto",
    gap: 10,
    marginTop: 12,
    alignItems: "end",
  },
  messageInput: {
    width: "100%",
    minHeight: 58,
    resize: "vertical",
    padding: "9px 12px",
    fontSize: 13,
    color: "#0f172a",
    background: "#f8fafc",
    border: "0.5px solid #cbd5e1",
    borderRadius: 8,
    outline: "none",
    fontFamily: "inherit",
    boxSizing: "border-box",
  },
  btnSend: {
    fontSize: 12,
    fontWeight: 700,
    padding: "11px 18px",
    borderRadius: 8,
    border: "none",
    cursor: "pointer",
    background: "#185FA5",
    color: "#E6F1FB",
    fontFamily: "inherit",
  },
  btnSendDisabled: {
    opacity: 0.65,
    cursor: "not-allowed",
  },
};
