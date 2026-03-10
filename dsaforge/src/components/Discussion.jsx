import { useState, useEffect } from "react";
import api from "../services/api";

function timeAgo(dateStr) {
  const diff  = Date.now() - new Date(dateStr).getTime();
  const mins  = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days  = Math.floor(diff / 86400000);
  if (mins < 1)   return "just now";
  if (mins < 60)  return `${mins}m ago`;
  if (hours < 24) return `${hours}h ago`;
  return `${days}d ago`;
}

function getInitials(name) {
  return name?.split(" ").map(w => w[0]).join("").toUpperCase().slice(0, 2) || "?";
}

const AVATAR_COLORS = [
  "var(--limebg)", "var(--bluebg)", "var(--pinkbg)", "var(--amberbg)"
];

function Avatar({ name, size = 32 }) {
  const idx = name?.charCodeAt(0) % AVATAR_COLORS.length || 0;
  return (
    <div style={{ width: size, height: size, borderRadius: "50%",
      background: AVATAR_COLORS[idx], border: "1px solid var(--border)",
      display: "flex", alignItems: "center", justifyContent: "center",
      fontWeight: 800, fontSize: size * 0.3, flexShrink: 0 }}>
      {getInitials(name)}
    </div>
  );
}

function CommentBox({ onSubmit, placeholder = "Share your approach or ask a question...", autoFocus = false }) {
  const [text, setText] = useState("");
  const [posting, setPosting] = useState(false);

  const handleSubmit = async () => {
    if (!text.trim()) return;
    setPosting(true);
    await onSubmit(text.trim());
    setText("");
    setPosting(false);
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: ".5rem" }}>
      <textarea
        value={text}
        onChange={e => setText(e.target.value)}
        placeholder={placeholder}
        autoFocus={autoFocus}
        rows={3}
        style={{ width: "100%", padding: ".7rem", boxSizing: "border-box",
          background: "var(--ink3)", border: "1px solid var(--border)",
          borderRadius: 8, color: "var(--fg)", fontSize: ".8rem",
          fontFamily: "'Cabinet Grotesk',sans-serif", resize: "vertical",
          lineHeight: 1.6, outline: "none" }}
        onFocus={e => e.target.style.borderColor = "var(--lime)"}
        onBlur={e => e.target.style.borderColor = "var(--border)"}
      />
      <div style={{ display: "flex", justifyContent: "space-between",
        alignItems: "center" }}>
        <span style={{ fontSize: ".65rem", color: "var(--muted)",
          fontFamily: "'JetBrains Mono',monospace" }}>
          {text.length}/2000
        </span>
        <button className="btn btn-lime" onClick={handleSubmit}
          disabled={posting || !text.trim()}
          style={{ justifyContent: "center", padding: ".4rem .9rem",
            fontSize: ".75rem", opacity: !text.trim() ? .5 : 1 }}>
          {posting ? "Posting..." : "💬 Post"}
        </button>
      </div>
    </div>
  );
}

function Comment({ comment, questionId, currentUser, onDelete, onLike }) {
  const [showReply, setShowReply] = useState(false);
  const [replies,   setReplies]   = useState(comment.replies || []);
  const [likes,     setLikes]     = useState(comment.likes || 0);
  const [liked,     setLiked]     = useState(false);

  const handleReply = async (content) => {
    try {
      const { data } = await api.post(`/discussions/${questionId}`, {
        content, parent_id: comment.id
      });
      setReplies(prev => [...prev, data.comment]);
      setShowReply(false);
    } catch (err) {
      console.error("Reply error:", err);
    }
  };

  const handleLike = async () => {
    if (liked) return;
    try {
      const { data } = await api.post(`/discussions/${comment.id}/like`);
      setLikes(data.likes);
      setLiked(true);
    } catch (err) {
      console.error("Like error:", err);
    }
  };

  const isOwn = comment.author_id === currentUser?.id;

  return (
    <div style={{ marginBottom: "1rem" }}>
      <div style={{ display: "flex", gap: ".7rem" }}>
        <Avatar name={comment.author_name} />
        <div style={{ flex: 1, minWidth: 0 }}>
          {/* HEADER */}
          <div style={{ display: "flex", alignItems: "center", gap: ".5rem",
            marginBottom: ".3rem", flexWrap: "wrap" }}>
            <span style={{ fontWeight: 700, fontSize: ".82rem" }}>
              {comment.author_name}
            </span>
            {isOwn && (
              <span style={{ fontSize: ".6rem", padding: ".1rem .4rem",
                borderRadius: 10, background: "var(--limebg)",
                color: "var(--lime)", fontFamily: "'JetBrains Mono',monospace" }}>
                you
              </span>
            )}
            <span style={{ fontSize: ".68rem", color: "var(--muted)",
              fontFamily: "'JetBrains Mono',monospace" }}>
              {timeAgo(comment.created_at)}
            </span>
          </div>

          {/* CONTENT */}
          <div style={{ fontSize: ".82rem", color: "var(--muted2)",
            lineHeight: 1.7, marginBottom: ".5rem",
            wordBreak: "break-word" }}>
            {comment.content}
          </div>

          {/* ACTIONS */}
          <div style={{ display: "flex", alignItems: "center", gap: ".8rem" }}>
            <button onClick={handleLike}
              style={{ background: "none", border: "none", cursor: liked ? "default" : "pointer",
                fontSize: ".72rem", color: liked ? "var(--lime)" : "var(--muted)",
                fontFamily: "'JetBrains Mono',monospace", padding: 0,
                display: "flex", alignItems: "center", gap: ".3rem" }}>
              👍 {likes}
            </button>
            <button onClick={() => setShowReply(!showReply)}
              style={{ background: "none", border: "none", cursor: "pointer",
                fontSize: ".72rem", color: "var(--muted)",
                fontFamily: "'JetBrains Mono',monospace", padding: 0 }}>
              💬 Reply {replies.length > 0 && `(${replies.length})`}
            </button>
            {isOwn && (
              <button onClick={() => onDelete(comment.id)}
                style={{ background: "none", border: "none", cursor: "pointer",
                  fontSize: ".72rem", color: "var(--pink)",
                  fontFamily: "'JetBrains Mono',monospace", padding: 0,
                  marginLeft: "auto" }}>
                🗑 Delete
              </button>
            )}
          </div>

          {/* REPLY BOX */}
          {showReply && (
            <div style={{ marginTop: ".7rem" }}>
              <CommentBox onSubmit={handleReply}
                placeholder="Write a reply..." autoFocus />
            </div>
          )}

          {/* REPLIES */}
          {replies.length > 0 && (
            <div style={{ marginTop: ".8rem", paddingLeft: "1rem",
              borderLeft: "2px solid var(--border)" }}>
              {replies.map(reply => (
                <div key={reply.id} style={{ display: "flex", gap: ".6rem",
                  marginBottom: ".7rem" }}>
                  <Avatar name={reply.author_name} size={26} />
                  <div style={{ flex: 1 }}>
                    <div style={{ display: "flex", gap: ".4rem",
                      alignItems: "center", marginBottom: ".2rem" }}>
                      <span style={{ fontWeight: 700, fontSize: ".78rem" }}>
                        {reply.author_name}
                      </span>
                      <span style={{ fontSize: ".65rem", color: "var(--muted)",
                        fontFamily: "'JetBrains Mono',monospace" }}>
                        {timeAgo(reply.created_at)}
                      </span>
                    </div>
                    <div style={{ fontSize: ".78rem", color: "var(--muted2)",
                      lineHeight: 1.6 }}>{reply.content}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function Discussion({ questionId, currentUser }) {
  const [comments, setComments] = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [total,    setTotal]    = useState(0);

  useEffect(() => {
    if (!questionId) return;
    const load = async () => {
      setLoading(true);
      try {
        const { data } = await api.get(`/discussions/${questionId}`);
        setComments(data.comments || []);
        setTotal(data.total || 0);
      } catch (err) {
        console.error("Discussion load error:", err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [questionId]);

  const handlePost = async (content) => {
    try {
      const { data } = await api.post(`/discussions/${questionId}`, { content });
      setComments(prev => [data.comment, ...prev]);
      setTotal(prev => prev + 1);
    } catch (err) {
      console.error("Post error:", err);
    }
  };

  const handleDelete = async (id) => {
    try {
      await api.delete(`/discussions/${id}`);
      setComments(prev => prev.filter(c => c.id !== id));
      setTotal(prev => prev - 1);
    } catch (err) {
      console.error("Delete error:", err);
    }
  };

  return (
    <div>
      {/* POST BOX */}
      <div style={{ marginBottom: "1.5rem" }}>
        <div style={{ fontSize: ".68rem", color: "var(--muted)",
          fontFamily: "'JetBrains Mono',monospace", marginBottom: ".6rem" }}>
          // add a comment
        </div>
        <CommentBox onSubmit={handlePost} />
      </div>

      {/* COMMENTS */}
      <div style={{ fontSize: ".68rem", color: "var(--muted)",
        fontFamily: "'JetBrains Mono',monospace", marginBottom: ".8rem" }}>
        // {total} comment{total !== 1 ? "s" : ""}
      </div>

      {loading ? (
        <div style={{ color: "var(--muted)", fontFamily: "'JetBrains Mono',monospace",
          fontSize: ".78rem" }}>// loading comments...</div>
      ) : comments.length === 0 ? (
        <div style={{ color: "var(--muted)", fontFamily: "'JetBrains Mono',monospace",
          fontSize: ".78rem", padding: "1rem 0", textAlign: "center" }}>
          // no comments yet — be the first to share your approach!
        </div>
      ) : (
        comments.map(comment => (
          <Comment key={comment.id} comment={comment}
            questionId={questionId} currentUser={currentUser}
            onDelete={handleDelete} onLike={() => {}} />
        ))
      )}
    </div>
  );
}
