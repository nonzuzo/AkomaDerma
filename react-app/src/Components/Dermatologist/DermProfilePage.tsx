// src/Components/Dermatologist/DermProfilePage.tsx
import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  User,
  Mail,
  Stethoscope,
  Award,
  Edit3,
  Save,
  X,
  Lock,
  Eye,
  EyeOff,
  CheckCircle,
  AlertTriangle,
  ClipboardList,
  Activity,
  Calendar,
  TrendingUp,
  RefreshCw,
  ShieldCheck,
} from "lucide-react";

const API = "http://localhost:5001/api";
const tok = () => localStorage.getItem("token") ?? "";
const auth = () => ({
  "Content-Type": "application/json",
  Authorization: `Bearer ${tok()}`,
});

// ─── Types ────────────────────────────────────────────────────────────────────
interface Profile {
  fullName: string;
  email: string;
  specialization: string;
  yearsExperience: number;
  dermatologistId: number;
  memberSince: string;
}
interface Stats {
  totalReviewed: number;
  diagnosesSubmitted: number;
  treatmentsSubmitted: number;
  completedCases: number;
  pendingReview: number;
  reviewedToday: number;
}
type Toast = { type: "success" | "error"; message: string } | null;

// ─── Toast notification ───────────────────────────────────────────────────────
function ToastBar({
  toast,
  onDismiss,
}: {
  toast: Toast;
  onDismiss: () => void;
}) {
  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(onDismiss, 3500);
    return () => clearTimeout(t);
  }, [toast, onDismiss]);

  if (!toast) return null;
  const ok = toast.type === "success";
  return (
    <div
      style={{
        position: "fixed",
        bottom: "1.5rem",
        right: "1.5rem",
        zIndex: 999,
        display: "flex",
        alignItems: "center",
        gap: "0.65rem",
        backgroundColor: ok ? "#f0fdf4" : "#fef2f2",
        border: `1px solid ${ok ? "#86efac" : "#fca5a5"}`,
        borderRadius: "12px",
        padding: "0.875rem 1.25rem",
        boxShadow: "0 4px 16px rgba(0,0,0,0.10)",
        animation: "slideUp 0.25s ease",
      }}
    >
      <style>{`@keyframes slideUp{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:none}}`}</style>
      {ok ? (
        <CheckCircle size={17} color="#059669" />
      ) : (
        <AlertTriangle size={17} color="#ef4444" />
      )}
      <span
        style={{
          fontSize: "0.875rem",
          fontWeight: 600,
          color: ok ? "#065f46" : "#991b1b",
        }}
      >
        {toast.message}
      </span>
      <button
        onClick={onDismiss}
        style={{
          background: "none",
          border: "none",
          cursor: "pointer",
          color: "#94a3b8",
        }}
      >
        <X size={14} />
      </button>
    </div>
  );
}

// ─── Stat card ────────────────────────────────────────────────────────────────
function StatCard({
  icon,
  label,
  value,
  color,
  bg,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
  color: string;
  bg: string;
}) {
  return (
    <div style={s.statCard}>
      <div style={{ ...s.statIcon, backgroundColor: bg }}>{icon}</div>
      <div>
        <div
          style={{ fontSize: "1.5rem", fontWeight: 800, color, lineHeight: 1 }}
        >
          {value}
        </div>
        <div
          style={{
            fontSize: "0.7rem",
            color: "#94a3b8",
            fontWeight: 600,
            marginTop: "0.2rem",
          }}
        >
          {label}
        </div>
      </div>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────
export default function DermProfilePage() {
  const navigate = useNavigate();

  const [profile, setProfile] = useState<Profile | null>(null);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<Toast>(null);

  // Edit form
  const [form, setForm] = useState({
    fullName: "",
    specialization: "",
    yearsExperience: "",
  });

  // Password form
  const [pwOpen, setPwOpen] = useState(false);
  const [pwSaving, setPwSaving] = useState(false);
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [pw, setPw] = useState({ current: "", newPw: "", confirm: "" });

  // ── Fetch profile + stats ─────────────────────────────────────────────────
  const load = useCallback(async () => {
    if (!tok()) {
      navigate("/login", { replace: true });
      return;
    }
    setLoading(true);
    try {
      const [profRes, statsRes] = await Promise.all([
        fetch(`${API}/dermatologists/me`, { headers: auth() }),
        fetch(`${API}/dermatologists/profile/stats`, { headers: auth() }),
      ]);
      if (profRes.status === 401) {
        navigate("/login", { replace: true });
        return;
      }

      const profData = await profRes.json();
      const statsData = statsRes.ok ? await statsRes.json() : {};

      const prof: Profile = {
        fullName: profData.fullName ?? "Dr. Dermatologist",
        email: profData.email ?? "",
        specialization: profData.specialization ?? "Dermatologist",
        yearsExperience: profData.yearsExperience ?? 0,
        dermatologistId: profData.dermatologistId ?? 0,
        memberSince: profData.memberSince ?? "",
      };
      setProfile(prof);
      setForm({
        fullName: prof.fullName,
        specialization: prof.specialization,
        yearsExperience: String(prof.yearsExperience),
      });
      setStats({
        totalReviewed: statsData.totalReviewed ?? 0,
        diagnosesSubmitted: statsData.diagnosesSubmitted ?? 0,
        treatmentsSubmitted: statsData.treatmentsSubmitted ?? 0,
        completedCases: statsData.completedCases ?? 0,
        pendingReview: statsData.pendingReview ?? 0,
        reviewedToday: statsData.reviewedToday ?? 0,
      });
    } catch {
      setToast({ type: "error", message: "Failed to load profile." });
    } finally {
      setLoading(false);
    }
  }, [navigate]);

  useEffect(() => {
    load();
  }, [load]);

  // ── Save profile ──────────────────────────────────────────────────────────
  const saveProfile = async () => {
    if (!form.fullName.trim()) {
      setToast({ type: "error", message: "Full name cannot be empty." });
      return;
    }
    setSaving(true);
    try {
      const res = await fetch(`${API}/dermatologists/profile`, {
        method: "PUT",
        headers: auth(),
        body: JSON.stringify({
          fullName: form.fullName.trim(),
          specialization: form.specialization.trim(),
          yearsExperience: Number(form.yearsExperience) || 0,
        }),
      });
      if (!res.ok) throw new Error();
      setProfile((prev) =>
        prev
          ? {
              ...prev,
              fullName: form.fullName.trim(),
              specialization: form.specialization.trim(),
              yearsExperience: Number(form.yearsExperience) || 0,
            }
          : prev
      );
      setEditing(false);
      setToast({ type: "success", message: "Profile updated successfully." });
    } catch {
      setToast({ type: "error", message: "Failed to save changes." });
    } finally {
      setSaving(false);
    }
  };

  const cancelEdit = () => {
    if (profile)
      setForm({
        fullName: profile.fullName,
        specialization: profile.specialization,
        yearsExperience: String(profile.yearsExperience),
      });
    setEditing(false);
  };

  // ── Change password ───────────────────────────────────────────────────────
  const changePassword = async () => {
    if (!pw.current || !pw.newPw || !pw.confirm) {
      setToast({
        type: "error",
        message: "Please fill in all password fields.",
      });
      return;
    }
    if (pw.newPw.length < 6) {
      setToast({
        type: "error",
        message: "New password must be at least 6 characters.",
      });
      return;
    }
    if (pw.newPw !== pw.confirm) {
      setToast({ type: "error", message: "Passwords do not match." });
      return;
    }
    setPwSaving(true);
    try {
      const res = await fetch(`${API}/dermatologists/profile/password`, {
        method: "PUT",
        headers: auth(),
        body: JSON.stringify({
          currentPassword: pw.current,
          newPassword: pw.newPw,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed");
      setPw({ current: "", newPw: "", confirm: "" });
      setPwOpen(false);
      setToast({ type: "success", message: "Password changed successfully." });
    } catch (err: any) {
      setToast({
        type: "error",
        message: err.message || "Failed to change password.",
      });
    } finally {
      setPwSaving(false);
    }
  };

  // ── Helpers ───────────────────────────────────────────────────────────────
  const initials = (name: string) =>
    name
      .split(" ")
      .filter(Boolean)
      .slice(0, 2)
      .map((n) => n[0].toUpperCase())
      .join("");

  const fmtDate = (iso: string) => {
    if (!iso) return "—";
    return new Date(iso).toLocaleDateString("en-GH", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  };

  const pwStrength = (pw: string) => {
    if (pw.length === 0) return null;
    if (pw.length < 4) return { label: "Weak", color: "#ef4444", bars: 1 };
    if (pw.length < 8) return { label: "Fair", color: "#f59e0b", bars: 2 };
    if (pw.length < 12) return { label: "Good", color: "#3db5e6", bars: 3 };
    return { label: "Strong", color: "#059669", bars: 4 };
  };

  // ── Loading ───────────────────────────────────────────────────────────────
  if (loading)
    return (
      <div style={s.center}>
        <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
        <RefreshCw
          size={28}
          color="#3db5e6"
          style={{ animation: "spin 1s linear infinite" }}
        />
        <span style={{ color: "#64748b", fontSize: "0.875rem" }}>
          Loading profile…
        </span>
      </div>
    );

  const strength = pwStrength(pw.newPw);

  return (
    <div style={s.page}>
      <style>{`
        @keyframes fadeIn { from{opacity:0;transform:translateY(5px)} to{opacity:1;transform:none} }
        @keyframes spin   { to{transform:rotate(360deg)} }
      `}</style>

      {/* ── Hero ─────────────────────────────────────────────────────────── */}
      <div style={s.hero}>
        <div style={s.heroBg} />
        <div style={s.heroContent}>
          {/* Avatar */}
          <div style={s.heroAvatar}>
            {profile ? initials(profile.fullName) : "DR"}
          </div>

          {/* Identity */}
          <div style={{ flex: 1, minWidth: 0 }}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "0.65rem",
                flexWrap: "wrap",
              }}
            >
              <h1 style={s.heroName}>{profile?.fullName}</h1>
              <span style={s.verifiedBadge}>
                <ShieldCheck size={11} /> Verified
              </span>
            </div>
            <div style={s.heroMeta}>
              <span style={s.metaChip}>
                <Stethoscope size={11} /> {profile?.specialization}
              </span>
              <span style={s.metaChip}>
                <Award size={11} /> {profile?.yearsExperience} yrs experience
              </span>
              <span style={s.metaChip}>
                <Mail size={11} /> {profile?.email}
              </span>
              {profile?.memberSince && (
                <span style={s.metaChip}>
                  <Calendar size={11} /> Since {fmtDate(profile.memberSince)}
                </span>
              )}
            </div>
          </div>

          {/* Edit / Save / Cancel */}
          {!editing ? (
            <button style={s.editBtn} onClick={() => setEditing(true)}>
              <Edit3 size={14} /> Edit Profile
            </button>
          ) : (
            <div style={{ display: "flex", gap: "0.5rem", flexShrink: 0 }}>
              <button
                style={s.cancelBtn}
                onClick={cancelEdit}
                disabled={saving}
              >
                <X size={14} /> Cancel
              </button>
              <button style={s.saveBtn} onClick={saveProfile} disabled={saving}>
                {saving ? (
                  <RefreshCw
                    size={14}
                    style={{ animation: "spin 1s linear infinite" }}
                  />
                ) : (
                  <Save size={14} />
                )}
                {saving ? "Saving…" : "Save"}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* ── Stats row ────────────────────────────────────────────────────── */}
      <div style={s.statsRow}>
        <StatCard
          icon={<ClipboardList size={15} color="#3db5e6" />}
          label="Total Reviewed"
          value={stats?.totalReviewed ?? 0}
          color="#3db5e6"
          bg="#e0f2fe"
        />
        <StatCard
          icon={<Activity size={15} color="#7c3aed" />}
          label="Diagnoses Submitted"
          value={stats?.diagnosesSubmitted ?? 0}
          color="#7c3aed"
          bg="#f3e8ff"
        />
        <StatCard
          icon={<TrendingUp size={15} color="#059669" />}
          label="Treatments Sent"
          value={stats?.treatmentsSubmitted ?? 0}
          color="#059669"
          bg="#dcfce7"
        />
        <StatCard
          icon={<CheckCircle size={15} color="#f59e0b" />}
          label="Cases Completed"
          value={stats?.completedCases ?? 0}
          color="#f59e0b"
          bg="#fef9c3"
        />
        <StatCard
          icon={<AlertTriangle size={15} color="#ef4444" />}
          label="Pending Review"
          value={stats?.pendingReview ?? 0}
          color="#ef4444"
          bg="#fee2e2"
        />
        <StatCard
          icon={<Award size={15} color="#0369a1" />}
          label="Reviewed Today"
          value={stats?.reviewedToday ?? 0}
          color="#0369a1"
          bg="#e0f2fe"
        />
      </div>

      {/* ── Two-column section ───────────────────────────────────────────── */}
      <div style={s.grid}>
        {/* Personal Details card */}
        <div style={s.card}>
          <div style={s.cardHeader}>
            <div style={{ ...s.iconBox, backgroundColor: "#e0f2fe" }}>
              <User size={14} color="#0369a1" />
            </div>
            <span style={s.cardTitle}>Personal Details</span>
          </div>
          <div style={s.cardBody}>
            {editing ? (
              <div style={s.formGrid}>
                <div style={s.formGroup}>
                  <label style={s.label}>Full Name</label>
                  <input
                    style={s.input}
                    value={form.fullName}
                    onChange={(e) =>
                      setForm({ ...form, fullName: e.target.value })
                    }
                    placeholder="Dr. Full Name"
                  />
                </div>
                <div style={s.formGroup}>
                  <label style={s.label}>Email</label>
                  <input
                    style={{
                      ...s.input,
                      backgroundColor: "#f8fafc",
                      color: "#94a3b8",
                    }}
                    value={profile?.email ?? ""}
                    disabled
                  />
                  <span style={s.fieldNote}>Email cannot be changed</span>
                </div>
                <div style={s.formGroup}>
                  <label style={s.label}>Specialization</label>
                  <input
                    style={s.input}
                    value={form.specialization}
                    onChange={(e) =>
                      setForm({ ...form, specialization: e.target.value })
                    }
                    placeholder="e.g. General Dermatology"
                  />
                </div>
                <div style={s.formGroup}>
                  <label style={s.label}>Years of Experience</label>
                  <input
                    style={s.input}
                    type="number"
                    min={0}
                    max={60}
                    value={form.yearsExperience}
                    onChange={(e) =>
                      setForm({ ...form, yearsExperience: e.target.value })
                    }
                  />
                </div>
              </div>
            ) : (
              <div style={s.detailList}>
                {[
                  {
                    label: "Full Name",
                    value: profile?.fullName,
                    icon: <User size={13} color="#3db5e6" />,
                  },
                  {
                    label: "Email",
                    value: profile?.email,
                    icon: <Mail size={13} color="#3db5e6" />,
                  },
                  {
                    label: "Specialization",
                    value: profile?.specialization,
                    icon: <Stethoscope size={13} color="#3db5e6" />,
                  },
                  {
                    label: "Years Experience",
                    value: `${profile?.yearsExperience ?? 0} years`,
                    icon: <Award size={13} color="#3db5e6" />,
                  },
                  {
                    label: "Member Since",
                    value: fmtDate(profile?.memberSince ?? ""),
                    icon: <Calendar size={13} color="#3db5e6" />,
                  },
                  {
                    label: "Derm ID",
                    value: `#${profile?.dermatologistId}`,
                    icon: <ShieldCheck size={13} color="#3db5e6" />,
                  },
                ].map((row) => (
                  <div key={row.label} style={s.detailRow}>
                    <div style={s.detailLabel}>
                      {row.icon} {row.label}
                    </div>
                    <div style={s.detailValue}>{row.value ?? "—"}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Security card */}
        <div style={s.card}>
          <div style={s.cardHeader}>
            <div style={{ ...s.iconBox, backgroundColor: "#fef9c3" }}>
              <Lock size={14} color="#d97706" />
            </div>
            <span style={s.cardTitle}>Security</span>
            <button
              style={s.togglePwBtn}
              onClick={() => {
                setPwOpen((v) => !v);
                setPw({ current: "", newPw: "", confirm: "" });
              }}
            >
              {pwOpen ? "Cancel" : "Change Password"}
            </button>
          </div>
          <div style={s.cardBody}>
            {!pwOpen ? (
              <div style={s.securityIdle}>
                <div style={s.securityCircle}>
                  <ShieldCheck size={30} color="#3db5e6" />
                </div>
                <p
                  style={{
                    fontSize: "0.9rem",
                    fontWeight: 700,
                    color: "#1e293b",
                    margin: 0,
                  }}
                >
                  Your account is secured
                </p>
                <p
                  style={{
                    fontSize: "0.8rem",
                    color: "#94a3b8",
                    margin: 0,
                    maxWidth: "240px",
                    textAlign: "center",
                  }}
                >
                  Click <strong>Change Password</strong> above to update your
                  credentials.
                </p>
              </div>
            ) : (
              <div style={s.formGrid}>
                {/* Current */}
                <div style={s.formGroup}>
                  <label style={s.label}>Current Password</label>
                  <div style={s.pwRow}>
                    <input
                      style={s.pwInput}
                      type={showCurrent ? "text" : "password"}
                      value={pw.current}
                      onChange={(e) =>
                        setPw({ ...pw, current: e.target.value })
                      }
                      placeholder="Enter current password"
                    />
                    <button
                      style={s.eyeBtn}
                      onClick={() => setShowCurrent((v) => !v)}
                    >
                      {showCurrent ? <EyeOff size={14} /> : <Eye size={14} />}
                    </button>
                  </div>
                </div>

                {/* New */}
                <div style={s.formGroup}>
                  <label style={s.label}>New Password</label>
                  <div style={s.pwRow}>
                    <input
                      style={s.pwInput}
                      type={showNew ? "text" : "password"}
                      value={pw.newPw}
                      onChange={(e) => setPw({ ...pw, newPw: e.target.value })}
                      placeholder="Min 6 characters"
                    />
                    <button
                      style={s.eyeBtn}
                      onClick={() => setShowNew((v) => !v)}
                    >
                      {showNew ? <EyeOff size={14} /> : <Eye size={14} />}
                    </button>
                  </div>
                  {/* Strength meter */}
                  {strength && (
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "0.3rem",
                        marginTop: "0.4rem",
                      }}
                    >
                      {[1, 2, 3, 4].map((i) => (
                        <div
                          key={i}
                          style={{
                            flex: 1,
                            height: "4px",
                            borderRadius: "4px",
                            transition: "background-color 0.2s",
                            backgroundColor:
                              i <= strength.bars ? strength.color : "#e2e8f0",
                          }}
                        />
                      ))}
                      <span
                        style={{
                          fontSize: "0.68rem",
                          fontWeight: 700,
                          color: "#64748b",
                          minWidth: "38px",
                        }}
                      >
                        {strength.label}
                      </span>
                    </div>
                  )}
                </div>

                {/* Confirm */}
                <div style={s.formGroup}>
                  <label style={s.label}>Confirm New Password</label>
                  <div style={s.pwRow}>
                    <input
                      style={{
                        ...s.pwInput,
                        borderColor:
                          pw.confirm && pw.confirm !== pw.newPw
                            ? "#ef4444"
                            : "#e2e8f0",
                      }}
                      type={showConfirm ? "text" : "password"}
                      value={pw.confirm}
                      onChange={(e) =>
                        setPw({ ...pw, confirm: e.target.value })
                      }
                      placeholder="Repeat new password"
                    />
                    <button
                      style={s.eyeBtn}
                      onClick={() => setShowConfirm((v) => !v)}
                    >
                      {showConfirm ? <EyeOff size={14} /> : <Eye size={14} />}
                    </button>
                  </div>
                  {pw.confirm && pw.confirm !== pw.newPw && (
                    <span
                      style={{
                        fontSize: "0.72rem",
                        color: "#ef4444",
                        marginTop: "0.2rem",
                      }}
                    >
                      Passwords do not match
                    </span>
                  )}
                </div>

                <button
                  style={{ ...s.savePwBtn, opacity: pwSaving ? 0.7 : 1 }}
                  onClick={changePassword}
                  disabled={pwSaving}
                >
                  {pwSaving ? (
                    <RefreshCw
                      size={14}
                      style={{ animation: "spin 1s linear infinite" }}
                    />
                  ) : (
                    <ShieldCheck size={14} />
                  )}
                  {pwSaving ? "Updating…" : "Update Password"}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Toast */}
      <ToastBar toast={toast} onDismiss={() => setToast(null)} />
    </div>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const s: Record<string, React.CSSProperties> = {
  page: {
    display: "flex",
    flexDirection: "column",
    gap: "1.5rem",
    animation: "fadeIn 0.2s ease",
    maxWidth: "1100px",
    margin: "0 auto",
  },
  center: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    minHeight: "300px",
    gap: "0.75rem",
  },

  // Hero
  hero: {
    position: "relative",
    borderRadius: "16px",
    overflow: "hidden",
    border: "1px solid #e5e7eb",
    boxShadow: "0 2px 12px rgba(0,0,0,0.06)",
  },
  heroBg: {
    position: "absolute",
    inset: 0,
    background: "linear-gradient(135deg,#3db5e6,#1e40af)",
    opacity: 0.07,
  },
  heroContent: {
    position: "relative",
    display: "flex",
    alignItems: "center",
    gap: "1.25rem",
    padding: "1.75rem 2rem",
    backgroundColor: "#fff",
    flexWrap: "wrap",
  },
  heroAvatar: {
    width: "70px",
    height: "70px",
    borderRadius: "18px",
    background: "linear-gradient(135deg,#3db5e6,#1e40af)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    color: "#fff",
    fontSize: "1.35rem",
    fontWeight: 800,
    flexShrink: 0,
    boxShadow: "0 4px 16px rgba(61,181,230,0.30)",
  },
  heroName: {
    fontSize: "1.3rem",
    fontWeight: 800,
    color: "#111827",
    margin: 0,
  },
  verifiedBadge: {
    display: "flex",
    alignItems: "center",
    gap: "0.3rem",
    fontSize: "0.68rem",
    fontWeight: 700,
    color: "#059669",
    backgroundColor: "#dcfce7",
    border: "1px solid #86efac",
    borderRadius: "10px",
    padding: "0.2rem 0.6rem",
  },
  heroMeta: {
    display: "flex",
    gap: "0.45rem",
    marginTop: "0.5rem",
    flexWrap: "wrap",
  },
  metaChip: {
    display: "flex",
    alignItems: "center",
    gap: "0.3rem",
    fontSize: "0.775rem",
    color: "#64748b",
    backgroundColor: "#f1f5f9",
    padding: "0.25rem 0.65rem",
    borderRadius: "8px",
  },

  // Header buttons
  editBtn: {
    display: "flex",
    alignItems: "center",
    gap: "0.4rem",
    padding: "0.6rem 1.1rem",
    backgroundColor: "#3db5e6",
    color: "#fff",
    border: "none",
    borderRadius: "10px",
    cursor: "pointer",
    fontWeight: 700,
    fontSize: "0.875rem",
    flexShrink: 0,
    boxShadow: "0 2px 8px rgba(61,181,230,0.25)",
  },
  cancelBtn: {
    display: "flex",
    alignItems: "center",
    gap: "0.4rem",
    padding: "0.6rem 1rem",
    backgroundColor: "#f1f5f9",
    color: "#64748b",
    border: "1px solid #e2e8f0",
    borderRadius: "10px",
    cursor: "pointer",
    fontWeight: 600,
    fontSize: "0.875rem",
  },
  saveBtn: {
    display: "flex",
    alignItems: "center",
    gap: "0.4rem",
    padding: "0.6rem 1.1rem",
    backgroundColor: "#059669",
    color: "#fff",
    border: "none",
    borderRadius: "10px",
    cursor: "pointer",
    fontWeight: 700,
    fontSize: "0.875rem",
    boxShadow: "0 2px 8px rgba(5,150,105,0.20)",
  },

  // Stats
  statsRow: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill,minmax(155px,1fr))",
    gap: "0.875rem",
  },
  statCard: {
    display: "flex",
    alignItems: "center",
    gap: "0.875rem",
    backgroundColor: "#fff",
    borderRadius: "12px",
    border: "1px solid #e5e7eb",
    padding: "1rem 1.1rem",
    boxShadow: "0 1px 4px rgba(0,0,0,0.04)",
  },
  statIcon: {
    width: "36px",
    height: "36px",
    borderRadius: "9px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },

  // Layout
  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill,minmax(430px,1fr))",
    gap: "1.25rem",
    alignItems: "start",
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: "14px",
    border: "1px solid #e5e7eb",
    overflow: "hidden",
    boxShadow: "0 1px 4px rgba(0,0,0,0.04)",
  },
  cardHeader: {
    display: "flex",
    alignItems: "center",
    gap: "0.6rem",
    padding: "0.9rem 1.25rem",
    borderBottom: "1px solid #f1f5f9",
  },
  cardTitle: {
    fontSize: "0.875rem",
    fontWeight: 700,
    color: "#1e293b",
    flex: 1,
  },
  cardBody: { padding: "1.25rem" },
  iconBox: {
    width: "27px",
    height: "27px",
    borderRadius: "7px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },

  // Detail view
  detailList: { display: "flex", flexDirection: "column" },
  detailRow: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "0.75rem 0",
    borderBottom: "1px solid #f8fafc",
  },
  detailLabel: {
    display: "flex",
    alignItems: "center",
    gap: "0.45rem",
    fontSize: "0.825rem",
    color: "#64748b",
    fontWeight: 500,
  },
  detailValue: { fontSize: "0.875rem", fontWeight: 600, color: "#1e293b" },

  // Edit form
  formGrid: { display: "flex", flexDirection: "column", gap: "1rem" },
  formGroup: { display: "flex", flexDirection: "column", gap: "0.35rem" },
  label: {
    fontSize: "0.72rem",
    fontWeight: 700,
    color: "#64748b",
    textTransform: "uppercase",
    letterSpacing: "0.04em",
  },
  input: {
    padding: "0.65rem 0.875rem",
    border: "1px solid #e2e8f0",
    borderRadius: "9px",
    fontSize: "0.875rem",
    outline: "none",
    color: "#1e293b",
    backgroundColor: "#fff",
    width: "100%",
    boxSizing: "border-box",
  },
  fieldNote: { fontSize: "0.7rem", color: "#94a3b8" },

  // Security card
  togglePwBtn: {
    fontSize: "0.775rem",
    fontWeight: 600,
    color: "#d97706",
    backgroundColor: "#fef9c3",
    border: "1px solid #fde68a",
    borderRadius: "8px",
    padding: "0.35rem 0.75rem",
    cursor: "pointer",
  },
  securityIdle: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: "0.6rem",
    padding: "2rem 1rem",
  },
  securityCircle: {
    width: "60px",
    height: "60px",
    borderRadius: "50%",
    backgroundColor: "#f0f9ff",
    border: "2px dashed #bae6fd",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },

  // Password inputs
  pwRow: { position: "relative", display: "flex", alignItems: "center" },
  pwInput: {
    flex: 1,
    padding: "0.65rem 2.5rem 0.65rem 0.875rem",
    border: "1px solid #e2e8f0",
    borderRadius: "9px",
    fontSize: "0.875rem",
    outline: "none",
    color: "#1e293b",
    width: "100%",
    boxSizing: "border-box",
  },
  eyeBtn: {
    position: "absolute",
    right: "0.75rem",
    background: "none",
    border: "none",
    cursor: "pointer",
    color: "#94a3b8",
    display: "flex",
    alignItems: "center",
  },
  savePwBtn: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "0.5rem",
    padding: "0.7rem",
    backgroundColor: "#d97706",
    color: "#fff",
    border: "none",
    borderRadius: "10px",
    cursor: "pointer",
    fontWeight: 700,
    fontSize: "0.875rem",
  },
};
