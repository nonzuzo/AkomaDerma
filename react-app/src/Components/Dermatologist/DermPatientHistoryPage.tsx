// src/Components/Dermatologist/DermPatientHistoryPage.tsx
import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Search,
  User,
  AlertTriangle,
  Pill,
  History,
  ClipboardList,
  Activity,
  Heart,
  Calendar,
  FileText,
  Clock,
  RefreshCw,
  ChevronRight,
  Filter,
  ArrowUpDown,
  CheckCircle,
  Stethoscope,
  ArrowLeft,
  Users,
  TrendingUp,
} from "lucide-react";

const API = `${import.meta.env.VITE_API_URL}";
const tok = () => localStorage.getItem("token") ?? "";
const auth = () => ({ Authorization: `Bearer ${tok()}` });

// ─── Types ────────────────────────────────────────────────────────────────────
interface PatientSummary {
  patient_id: number;
  full_name: string;
  dob: string | null;
  sex: string | null;
  contact: string | null;
  total_cases: number;
  last_case_date: string | null;
  latest_diagnosis: string | null;
  allergy_count: number;
  has_active_case: boolean;
  is_walkin: boolean;
}
interface PatientDetail {
  patient_id: number;
  full_name: string;
  dob: string | null;
  sex: string | null;
  occupation: string | null;
  contact: string | null;
  is_walkin: boolean;
  created_at: string;
}
interface Allergy {
  allergy_id: number;
  allergyname: string;
  reaction: string;
  severity: "mild" | "moderate" | "severe";
}
interface Medication {
  med_id: number;
  medicationname: string;
  dosage: string;
  startdate: string | null;
}
interface Condition {
  condition_id: number;
  conditionname: string;
  severity: string;
  notes: string | null;
  daterecorded: string;
}
interface CaseHistory {
  case_id: number;
  chief_complaint: string;
  status: string;
  created_at: string;
  final_diagnosis: string | null;
  treatment: string | null;
  clinician_name: string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
const fmtDate = (iso: string | null) =>
  iso
    ? new Date(iso).toLocaleDateString("en-GH", {
        day: "numeric",
        month: "short",
        year: "numeric",
      })
    : "—";

const calcAge = (dob: string | null) =>
  dob ? Math.floor((Date.now() - new Date(dob).getTime()) / 3.156e10) : null;

const initials = (name: string) =>
  name
    .split(" ")
    .slice(0, 2)
    .map((n) => n[0] ?? "")
    .join("")
    .toUpperCase();

const SEVERITY: Record<string, string> = {
  mild: "#059669",
  moderate: "#f59e0b",
  severe: "#ef4444",
};
const STATUS: Record<string, { color: string; bg: string; label: string }> = {
  sent_to_derm: { color: "#ef4444", bg: "#fef2f2", label: "Pending Review" },
  treatment_ready: {
    color: "#f59e0b",
    bg: "#fffbeb",
    label: "Treatment Ready",
  },
  completed: { color: "#059669", bg: "#f0fdf4", label: "Completed" },
  draft: { color: "#94a3b8", bg: "#f8fafc", label: "Draft" },
};

// avatar gradient cycles through 5 colours
const AVATAR_COLORS = [
  ["#3db5e6", "#1e40af"],
  ["#7c3aed", "#4f46e5"],
  ["#059669", "#0d9488"],
  ["#f59e0b", "#d97706"],
  ["#ef4444", "#dc2626"],
];
const avatarGrad = (id: number) => {
  const [a, b] = AVATAR_COLORS[id % AVATAR_COLORS.length];
  return `linear-gradient(135deg,${a},${b})`;
};

// ─── Root Component ───────────────────────────────────────────────────────────
export default function DermPatientHistory() {
  const { patientId } = useParams<{ patientId: string }>();
  const navigate = useNavigate();

  const [patients, setPatients] = useState<PatientSummary[]>([]);
  const [loadingList, setLoadingList] = useState(true);
  const [selected, setSelected] = useState<number | null>(
    patientId ? Number(patientId) : null
  );
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState<"recent" | "cases" | "alpha">("recent");
  const [filter, setFilter] = useState<
    "all" | "allergies" | "active" | "walkin"
  >("all");

  // fetch patient list
  const loadList = useCallback(async () => {
    if (!tok()) {
      navigate("/login", { replace: true });
      return;
    }
    setLoadingList(true);
    try {
      const res = await fetch(`${API}/dermatologists/patients`, {
        headers: auth(),
      });
      if (res.status === 401) {
        navigate("/login", { replace: true });
        return;
      }
      const data = await res.json();
      setPatients(data.patients ?? []);
    } catch {
      setPatients([]);
    } finally {
      setLoadingList(false);
    }
  }, [navigate]);

  useEffect(() => {
    loadList();
  }, [loadList]);

  // sync URL param → selected
  useEffect(() => {
    if (patientId) setSelected(Number(patientId));
  }, [patientId]);

  const handleSelect = (id: number) => {
    setSelected(id);
    navigate(`/dermatologist/patients/${id}`, { replace: true });
  };

  // filtered + sorted list
  const displayed = useMemo(() => {
    let list = [...patients];
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (p) =>
          p.full_name.toLowerCase().includes(q) ||
          (p.contact ?? "").toLowerCase().includes(q)
      );
    }
    if (filter === "allergies") list = list.filter((p) => p.allergy_count > 0);
    if (filter === "active") list = list.filter((p) => p.has_active_case);
    if (filter === "walkin") list = list.filter((p) => p.is_walkin);

    if (sort === "recent")
      list.sort((a, b) =>
        (b.last_case_date ?? "").localeCompare(a.last_case_date ?? "")
      );
    if (sort === "cases") list.sort((a, b) => b.total_cases - a.total_cases);
    if (sort === "alpha")
      list.sort((a, b) => a.full_name.localeCompare(b.full_name));
    return list;
  }, [patients, search, filter, sort]);

  const selectedPatient = patients.find((p) => p.patient_id === selected);

  return (
    <div style={s.root}>
      <style>{`
        @keyframes fadeIn { from{opacity:0;transform:translateY(4px)} to{opacity:1;transform:none} }
        @keyframes spin    { to{transform:rotate(360deg)} }
        ::-webkit-scrollbar { width:5px; height:5px }
        ::-webkit-scrollbar-track { background:transparent }
        ::-webkit-scrollbar-thumb { background:#e2e8f0; border-radius:10px }
      `}</style>

      {/* ── LEFT PANEL ─────────────────────────────────────────────────── */}
      <div style={s.leftPanel}>
        {/* Header */}
        <div style={s.leftHeader}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <Users size={16} color="#3db5e6" />
            <span style={s.leftTitle}>Patient Registry</span>
          </div>
          <span style={s.countPill}>{patients.length}</span>
          <button style={s.iconBtn} onClick={loadList} title="Refresh">
            <RefreshCw size={13} color="#64748b" />
          </button>
        </div>

        {/* Search */}
        <div style={s.searchWrap}>
          <Search size={14} color="#94a3b8" style={s.searchIcon} />
          <input
            style={s.searchInput}
            placeholder="Search name or contact…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {/* Sort + Filter row */}
        <div style={s.controlRow}>
          <div style={s.controlGroup}>
            <ArrowUpDown size={11} color="#94a3b8" />
            <select
              style={s.select}
              value={sort}
              onChange={(e) => setSort(e.target.value as typeof sort)}
            >
              <option value="recent">Most Recent</option>
              <option value="cases">Most Cases</option>
              <option value="alpha">A → Z</option>
            </select>
          </div>
          <div style={s.controlGroup}>
            <Filter size={11} color="#94a3b8" />
            <select
              style={s.select}
              value={filter}
              onChange={(e) => setFilter(e.target.value as typeof filter)}
            >
              <option value="all">All Patients</option>
              <option value="allergies">Has Allergies</option>
              <option value="active">Active Cases</option>
              <option value="walkin">Walk-ins</option>
            </select>
          </div>
        </div>

        {/* Stats bar */}
        <div style={s.statsBar}>
          {[
            { label: "Total", value: patients.length, color: "#3db5e6" },
            {
              label: "Active",
              value: patients.filter((p) => p.has_active_case).length,
              color: "#ef4444",
            },
            {
              label: "Allergic",
              value: patients.filter((p) => p.allergy_count > 0).length,
              color: "#f59e0b",
            },
          ].map((st) => (
            <div key={st.label} style={s.statItem}>
              <span style={{ ...s.statNum, color: st.color }}>{st.value}</span>
              <span style={s.statLabel}>{st.label}</span>
            </div>
          ))}
        </div>

        {/* Patient List */}
        <div style={s.patientList}>
          {loadingList ? (
            <div style={s.listLoading}>
              <RefreshCw
                size={22}
                color="#3db5e6"
                style={{ animation: "spin 1s linear infinite" }}
              />
              <span>Loading patients…</span>
            </div>
          ) : displayed.length === 0 ? (
            <div style={s.listEmpty}>
              <User size={28} color="#cbd5e1" />
              <p>No patients found</p>
            </div>
          ) : (
            displayed.map((p) => {
              const age = calcAge(p.dob);
              const isActive = p.patient_id === selected;
              return (
                <div
                  key={p.patient_id}
                  style={{
                    ...s.patientCard,
                    ...(isActive ? s.patientCardActive : {}),
                  }}
                  onClick={() => handleSelect(p.patient_id)}
                >
                  <div
                    style={{
                      ...s.miniAvatar,
                      background: avatarGrad(p.patient_id),
                    }}
                  >
                    {initials(p.full_name)}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "0.35rem",
                      }}
                    >
                      <span
                        style={{
                          ...s.pName,
                          color: isActive ? "#0369a1" : "#1e293b",
                        }}
                      >
                        {p.full_name}
                      </span>
                      {p.has_active_case && (
                        <span style={s.activeDot} title="Active case" />
                      )}
                    </div>
                    <div style={s.pMeta}>
                      {age ? `${age}y` : "—"}
                      {p.sex ? ` · ${p.sex.charAt(0).toUpperCase()}` : ""}
                      {p.latest_diagnosis
                        ? ` · ${
                            p.latest_diagnosis.length > 20
                              ? p.latest_diagnosis.slice(0, 20) + "…"
                              : p.latest_diagnosis
                          }`
                        : " · No diagnosis yet"}
                    </div>
                    <div style={s.pStats}>
                      <span style={s.pStatChip}>
                        <ClipboardList size={9} /> {p.total_cases} case
                        {p.total_cases !== 1 ? "s" : ""}
                      </span>
                      {p.allergy_count > 0 && (
                        <span
                          style={{
                            ...s.pStatChip,
                            color: "#dc2626",
                            backgroundColor: "#fee2e2",
                          }}
                        >
                          <AlertTriangle size={9} /> {p.allergy_count} allerg
                          {p.allergy_count !== 1 ? "ies" : "y"}
                        </span>
                      )}
                      {p.last_case_date && (
                        <span style={s.pStatChip}>
                          <Clock size={9} /> {fmtDate(p.last_case_date)}
                        </span>
                      )}
                    </div>
                  </div>
                  <ChevronRight
                    size={14}
                    color={isActive ? "#3db5e6" : "#cbd5e1"}
                  />
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* ── RIGHT PANEL ────────────────────────────────────────────────── */}
      <div style={s.rightPanel}>
        {selected && selectedPatient ? (
          <PatientDetailPanel
            patientId={selected}
            summary={selectedPatient}
            navigate={navigate}
          />
        ) : (
          <EmptyDetailState patientCount={patients.length} />
        )}
      </div>
    </div>
  );
}

// ─── Empty State ──────────────────────────────────────────────────────────────
function EmptyDetailState({ patientCount }: { patientCount: number }) {
  return (
    <div style={s.emptyDetail}>
      <div style={s.emptyIllustration}>
        <div style={s.emptyCircle}>
          <Stethoscope size={36} color="#3db5e6" />
        </div>
      </div>
      <h2 style={s.emptyTitle}>Select a Patient</h2>
      <p style={s.emptySubtitle}>
        Choose any of the <strong>{patientCount}</strong> patients on the left
        to view their full medical history, case timeline, medications and
        allergies.
      </p>
      <div style={s.emptyHints}>
        {[
          {
            icon: <ClipboardList size={14} color="#3db5e6" />,
            text: "Full case history & diagnoses",
          },
          {
            icon: <Pill size={14} color="#7c3aed" />,
            text: "Active medications & dosages",
          },
          {
            icon: <AlertTriangle size={14} color="#ef4444" />,
            text: "Allergy alerts & reactions",
          },
          {
            icon: <TrendingUp size={14} color="#059669" />,
            text: "Past medical conditions",
          },
        ].map((h) => (
          <div key={h.text} style={s.emptyHintRow}>
            {h.icon}
            <span style={s.emptyHintText}>{h.text}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Patient Detail Panel ─────────────────────────────────────────────────────
function PatientDetailPanel({
  patientId,
  summary,
  navigate,
}: {
  patientId: number;
  summary: PatientSummary;
  navigate: ReturnType<typeof useNavigate>;
}) {
  const [patient, setPatient] = useState<PatientDetail | null>(null);
  const [allergies, setAllergies] = useState<Allergy[]>([]);
  const [medications, setMeds] = useState<Medication[]>([]);
  const [conditions, setConditions] = useState<Condition[]>([]);
  const [cases, setCases] = useState<CaseHistory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [tab, setTab] = useState<"overview" | "cases" | "meds" | "allergies">(
    "overview"
  );

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(
        `${API}/dermatologists/patients/${patientId}/history`,
        { headers: auth() }
      );
      if (res.status === 401) {
        navigate("/login", { replace: true });
        return;
      }
      if (res.status === 404) {
        setError("Patient record not found.");
        return;
      }
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setPatient(data.patient ?? null);
      setAllergies(data.allergies ?? []);
      setMeds(data.medications ?? []);
      setConditions(data.conditions ?? []);
      setCases(data.cases ?? []);
    } catch (err) {
      setError("Failed to load. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [patientId, navigate]);

  useEffect(() => {
    setTab("overview");
    load();
  }, [load]);

  const age = calcAge(summary.dob);

  if (loading)
    return (
      <div style={s.detailLoading}>
        <RefreshCw
          size={28}
          color="#3db5e6"
          style={{ animation: "spin 1s linear infinite" }}
        />
        <p style={{ color: "#64748b", marginTop: "0.75rem" }}>
          Loading patient record…
        </p>
      </div>
    );

  if (error)
    return (
      <div style={s.detailLoading}>
        <AlertTriangle size={32} color="#ef4444" />
        <p style={{ color: "#1e293b", fontWeight: 700, marginTop: "0.75rem" }}>
          {error}
        </p>
        <button style={s.retryBtn} onClick={load}>
          Try Again
        </button>
      </div>
    );

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        height: "100%",
        animation: "fadeIn 0.2s ease",
      }}
    >
      {/* ── Patient Hero Header ─────────────────────────────────────────── */}
      <div style={s.heroHeader}>
        <div style={{ ...s.heroAvatar, background: avatarGrad(patientId) }}>
          {initials(summary.full_name)}
        </div>
        <div style={{ flex: 1 }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.6rem",
              flexWrap: "wrap",
            }}
          >
            <h2 style={s.heroName}>{summary.full_name}</h2>
            {summary.is_walkin && <span style={s.walkinBadge}>Walk-in</span>}
            {summary.has_active_case && (
              <span style={s.activeBadge}>Active Case</span>
            )}
          </div>
          <div style={s.heroMeta}>
            {age ? `${age} years old` : "Age unknown"}
            {summary.sex
              ? ` · ${
                  summary.sex.charAt(0).toUpperCase() + summary.sex.slice(1)
                }`
              : ""}
            {patient?.occupation ? ` · ${patient.occupation}` : ""}
            {summary.contact ? ` · ${summary.contact}` : ""}
          </div>
          {/* Quick stat chips */}
          <div
            style={{
              display: "flex",
              gap: "0.5rem",
              marginTop: "0.6rem",
              flexWrap: "wrap",
            }}
          >
            <StatChip
              icon={<ClipboardList size={11} />}
              value={`${summary.total_cases} Cases`}
              color="#3db5e6"
              bg="#e0f2fe"
            />
            <StatChip
              icon={<AlertTriangle size={11} />}
              value={`${allergies.length} Allergies`}
              color={allergies.length > 0 ? "#dc2626" : "#94a3b8"}
              bg={allergies.length > 0 ? "#fee2e2" : "#f1f5f9"}
            />
            <StatChip
              icon={<Pill size={11} />}
              value={`${medications.length} Medications`}
              color="#7c3aed"
              bg="#f3e8ff"
            />
            <StatChip
              icon={<History size={11} />}
              value={`${conditions.length} Conditions`}
              color="#059669"
              bg="#dcfce7"
            />
            {summary.last_case_date && (
              <StatChip
                icon={<Clock size={11} />}
                value={`Last: ${fmtDate(summary.last_case_date)}`}
                color="#64748b"
                bg="#f1f5f9"
              />
            )}
          </div>
        </div>
        <button style={s.refreshDetailBtn} onClick={load} title="Refresh">
          <RefreshCw size={13} color="#64748b" />
        </button>
      </div>

      {/* ── Tabs ───────────────────────────────────────────────────────── */}
      <div style={s.tabsRow}>
        {(
          [
            { key: "overview", label: "Overview", icon: <User size={13} /> },
            {
              key: "cases",
              label: `Cases (${cases.length})`,
              icon: <ClipboardList size={13} />,
            },
            {
              key: "meds",
              label: `Meds (${medications.length})`,
              icon: <Pill size={13} />,
            },
            {
              key: "allergies",
              label: `Allergies (${allergies.length})`,
              icon: <AlertTriangle size={13} />,
            },
          ] as const
        ).map(({ key, label, icon }) => (
          <button
            key={key}
            style={{ ...s.tab, ...(tab === key ? s.tabActive : {}) }}
            onClick={() => setTab(key)}
          >
            {icon} {label}
          </button>
        ))}
      </div>

      {/* ── Tab Content ────────────────────────────────────────────────── */}
      <div style={s.tabContent}>
        {/* OVERVIEW */}
        {tab === "overview" && (
          <div style={s.overviewGrid}>
            {/* Demographics */}
            <Section
              title="Demographics"
              icon={<User size={14} color="#0369a1" />}
              iconBg="#e0f2fe"
            >
              <div style={s.demoGrid}>
                {[
                  { label: "Full Name", value: patient?.full_name },
                  {
                    label: "Date of Birth",
                    value: fmtDate(patient?.dob ?? null),
                  },
                  { label: "Age", value: age ? `${age} years` : null },
                  { label: "Sex", value: patient?.sex },
                  { label: "Occupation", value: patient?.occupation },
                  { label: "Contact", value: patient?.contact },
                  {
                    label: "Patient Since",
                    value: fmtDate(patient?.created_at ?? null),
                  },
                  {
                    label: "Type",
                    value: patient?.is_walkin ? "Walk-in" : "Referred",
                  },
                ]
                  .filter((r) => r.value)
                  .map((row) => (
                    <div key={row.label} style={s.demoItem}>
                      <span style={s.demoLabel}>{row.label}</span>
                      <span style={s.demoValue}>{row.value}</span>
                    </div>
                  ))}
              </div>
            </Section>

            {/* Medical History */}
            <Section
              title="Past Medical History"
              icon={<History size={14} color="#059669" />}
              iconBg="#f0fdf4"
              count={conditions.length}
              countColor="#059669"
              countBg="#dcfce7"
            >
              {conditions.length === 0 ? (
                <EmptyCard
                  icon={<CheckCircle size={22} color="#cbd5e1" />}
                  text="No recorded conditions"
                />
              ) : (
                <div style={s.itemList}>
                  {conditions.map((c) => (
                    <div key={c.condition_id} style={s.condRow}>
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                        }}
                      >
                        <span style={s.condName}>{c.conditionname}</span>
                        <div
                          style={{
                            display: "flex",
                            gap: "0.4rem",
                            alignItems: "center",
                          }}
                        >
                          <SeverityBadge level={c.severity} />
                          <span style={s.dateChip}>
                            <Calendar size={9} /> {fmtDate(c.daterecorded)}
                          </span>
                        </div>
                      </div>
                      {c.notes && <div style={s.condNotes}>{c.notes}</div>}
                    </div>
                  ))}
                </div>
              )}
            </Section>

            {/* Allergy Summary */}
            <Section
              title="Known Allergies"
              icon={<AlertTriangle size={14} color="#ef4444" />}
              iconBg="#fef2f2"
              count={allergies.length}
              countColor="#dc2626"
              countBg="#fee2e2"
              borderAccent={allergies.length > 0 ? "#ef4444" : undefined}
            >
              {allergies.length === 0 ? (
                <EmptyCard
                  icon={<Heart size={22} color="#cbd5e1" />}
                  text="No known allergies"
                />
              ) : (
                <div style={s.itemList}>
                  {allergies.map((a) => (
                    <div key={a.allergy_id} style={s.allergyRow}>
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                        }}
                      >
                        <span style={s.allergyName}>{a.allergyname}</span>
                        <SeverityBadge level={a.severity} />
                      </div>
                      {a.reaction && (
                        <div style={s.allergyReaction}>
                          Reaction: {a.reaction}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </Section>

            {/* Recent Cases */}
            <Section
              title="Recent Cases"
              icon={<ClipboardList size={14} color="#3db5e6" />}
              iconBg="#f0f9ff"
              count={cases.length}
              countColor="#3db5e6"
              countBg="#e0f2fe"
            >
              {cases.length === 0 ? (
                <EmptyCard
                  icon={<FileText size={22} color="#cbd5e1" />}
                  text="No prior cases"
                />
              ) : (
                <>
                  {cases.slice(0, 4).map((c) => (
                    <CaseRow key={c.case_id} c={c} navigate={navigate} />
                  ))}
                  {cases.length > 4 && (
                    <button
                      style={s.viewAllBtn}
                      onClick={() => setTab("cases")}
                    >
                      View all {cases.length} cases →
                    </button>
                  )}
                </>
              )}
            </Section>
          </div>
        )}

        {/* CASES */}
        {tab === "cases" && (
          <div style={{ animation: "fadeIn 0.2s ease" }}>
            {cases.length === 0 ? (
              <FullEmpty
                icon={<FileText size={40} color="#cbd5e1" />}
                title="No Case History"
                body="This patient has no cases on record."
              />
            ) : (
              <div style={s.card}>
                <div style={s.timelineHeader}>
                  <Activity size={14} color="#3db5e6" />
                  <span style={s.timelineTitle}>
                    Case Timeline — {cases.length} total
                  </span>
                </div>
                {cases.map((c, idx) => (
                  <CaseRow
                    key={c.case_id}
                    c={c}
                    navigate={navigate}
                    showClinician
                    showTreatment
                    style={{
                      borderTop: idx === 0 ? "none" : "1px solid #f1f5f9",
                    }}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {/* MEDICATIONS */}
        {tab === "meds" && (
          <div style={{ animation: "fadeIn 0.2s ease" }}>
            {medications.length === 0 ? (
              <FullEmpty
                icon={<Pill size={40} color="#cbd5e1" />}
                title="No Medications"
                body="No medications have been recorded for this patient."
              />
            ) : (
              <div style={s.card}>
                {medications.map((m, idx) => (
                  <div
                    key={m.med_id}
                    style={{
                      ...s.medRow,
                      borderTop: idx === 0 ? "none" : "1px solid #f1f5f9",
                    }}
                  >
                    <div style={{ ...s.iconBox, backgroundColor: "#faf5ff" }}>
                      <Pill size={13} color="#7c3aed" />
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={s.medName}>{m.medicationname}</div>
                      {m.dosage && <div style={s.medDose}>{m.dosage}</div>}
                    </div>
                    {m.startdate && (
                      <span style={s.dateChip}>
                        <Calendar size={10} /> Since {fmtDate(m.startdate)}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ALLERGIES */}
        {tab === "allergies" && (
          <div style={{ animation: "fadeIn 0.2s ease" }}>
            {allergies.length === 0 ? (
              <FullEmpty
                icon={<Heart size={40} color="#cbd5e1" />}
                title="No Known Allergies"
                body="No allergies have been recorded for this patient."
              />
            ) : (
              <div style={s.card}>
                {allergies.map((a, idx) => (
                  <div
                    key={a.allergy_id}
                    style={{
                      ...s.allergyDetailRow,
                      borderTop: idx === 0 ? "none" : "1px solid #f1f5f9",
                    }}
                  >
                    <div style={{ ...s.iconBox, backgroundColor: "#fef2f2" }}>
                      <AlertTriangle size={13} color="#ef4444" />
                    </div>
                    <div style={{ flex: 1 }}>
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "0.5rem",
                        }}
                      >
                        <span style={s.allergyName}>{a.allergyname}</span>
                        <SeverityBadge level={a.severity} />
                      </div>
                      {a.reaction && (
                        <div style={s.allergyReaction}>
                          Reaction: {a.reaction}
                        </div>
                      )}
                    </div>
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

// ─── Reusable Sub-Components ──────────────────────────────────────────────────
function StatChip({
  icon,
  value,
  color,
  bg,
}: {
  icon: React.ReactNode;
  value: string;
  color: string;
  bg: string;
}) {
  return (
    <span
      style={{
        display: "flex",
        alignItems: "center",
        gap: "0.3rem",
        fontSize: "0.72rem",
        fontWeight: 700,
        color,
        backgroundColor: bg,
        padding: "0.2rem 0.6rem",
        borderRadius: "10px",
      }}
    >
      {icon} {value}
    </span>
  );
}

function Section({
  title,
  icon,
  iconBg,
  count,
  countColor,
  countBg,
  borderAccent,
  children,
}: {
  title: string;
  icon: React.ReactNode;
  iconBg: string;
  count?: number;
  countColor?: string;
  countBg?: string;
  borderAccent?: string;
  children: React.ReactNode;
}) {
  return (
    <div
      style={{
        ...s.card,
        ...(borderAccent ? { borderLeft: `3px solid ${borderAccent}` } : {}),
      }}
    >
      <div style={s.sectionHeader}>
        <div style={{ ...s.iconBox, backgroundColor: iconBg }}>{icon}</div>
        <span style={s.sectionTitle}>{title}</span>
        {count !== undefined && countColor && countBg && (
          <span
            style={{
              ...s.countBadge,
              color: countColor,
              backgroundColor: countBg,
            }}
          >
            {count}
          </span>
        )}
      </div>
      {children}
    </div>
  );
}

function CaseRow({
  c,
  navigate,
  showClinician = false,
  showTreatment = false,
  style: extraStyle = {},
}: {
  c: CaseHistory;
  navigate: ReturnType<typeof useNavigate>;
  showClinician?: boolean;
  showTreatment?: boolean;
  style?: React.CSSProperties;
}) {
  const st = STATUS[c.status] ?? STATUS.draft;
  return (
    <div
      style={{ ...s.caseRow, ...extraStyle }}
      onClick={() => navigate(`/dermatologist/cases/${c.case_id}?step=1`)}
      onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#f0f9ff")}
      onMouseLeave={(e) =>
        (e.currentTarget.style.backgroundColor = "transparent")
      }
    >
      <div style={{ ...s.caseIdBox, backgroundColor: st.bg }}>
        <span style={{ fontSize: "0.65rem", fontWeight: 800, color: st.color }}>
          #{c.case_id}
        </span>
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={s.caseComplaint}>{c.chief_complaint}</div>
        {showClinician && (
          <div style={s.caseMeta}>Referred by {c.clinician_name}</div>
        )}
        {c.final_diagnosis && (
          <div style={s.caseDiag}>
            Dx: <strong>{c.final_diagnosis}</strong>
          </div>
        )}
        {showTreatment && c.treatment && (
          <div style={s.caseTreat}>
            Rx:{" "}
            {c.treatment.length > 90
              ? c.treatment.slice(0, 90) + "…"
              : c.treatment}
          </div>
        )}
      </div>
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "flex-end",
          gap: "0.3rem",
          flexShrink: 0,
        }}
      >
        <span
          style={{ ...s.statusPill, backgroundColor: st.bg, color: st.color }}
        >
          {st.label}
        </span>
        <span style={s.dateChip}>
          <Clock size={9} /> {fmtDate(c.created_at)}
        </span>
      </div>
      <ChevronRight size={13} color="#cbd5e1" />
    </div>
  );
}

function SeverityBadge({ level }: { level: string }) {
  const color = SEVERITY[level] ?? "#94a3b8";
  return (
    <span
      style={{
        fontSize: "0.65rem",
        fontWeight: 700,
        padding: "0.15rem 0.5rem",
        borderRadius: "8px",
        backgroundColor: color + "18",
        color,
      }}
    >
      {level}
    </span>
  );
}

function EmptyCard({ icon, text }: { icon: React.ReactNode; text: string }) {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: "0.4rem",
        padding: "1.75rem",
        color: "#94a3b8",
        fontSize: "0.825rem",
        textAlign: "center",
      }}
    >
      {icon}
      <p style={{ margin: 0 }}>{text}</p>
    </div>
  );
}

function FullEmpty({
  icon,
  title,
  body,
}: {
  icon: React.ReactNode;
  title: string;
  body: string;
}) {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "5rem 1rem",
        textAlign: "center",
        color: "#94a3b8",
        gap: "0.5rem",
      }}
    >
      {icon}
      <h3 style={{ margin: "0.5rem 0 0", color: "#475569" }}>{title}</h3>
      <p style={{ margin: 0, fontSize: "0.875rem" }}>{body}</p>
    </div>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const s: Record<string, React.CSSProperties> = {
  root: {
    display: "flex",
    height: "calc(100vh - 80px)",
    gap: "0",
    overflow: "hidden",
    borderRadius: "16px",
    border: "1px solid #e5e7eb",
    boxShadow: "0 2px 12px rgba(0,0,0,0.06)",
    backgroundColor: "#fff",
  },

  // Left panel
  leftPanel: {
    width: "320px",
    minWidth: "280px",
    flexShrink: 0,
    display: "flex",
    flexDirection: "column",
    borderRight: "1px solid #f1f5f9",
    backgroundColor: "#fafbfc",
    overflow: "hidden",
  },
  leftHeader: {
    display: "flex",
    alignItems: "center",
    gap: "0.5rem",
    padding: "1rem 1.1rem 0.75rem",
    borderBottom: "1px solid #f1f5f9",
  },
  leftTitle: {
    fontSize: "0.875rem",
    fontWeight: 800,
    color: "#1e293b",
    flex: 1,
  },
  countPill: {
    fontSize: "0.68rem",
    fontWeight: 700,
    backgroundColor: "#e0f2fe",
    color: "#0369a1",
    padding: "0.15rem 0.55rem",
    borderRadius: "10px",
  },
  iconBtn: {
    width: "28px",
    height: "28px",
    border: "1px solid #e2e8f0",
    borderRadius: "7px",
    backgroundColor: "#fff",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    cursor: "pointer",
  },
  searchWrap: { position: "relative", padding: "0.6rem 1rem" },
  searchIcon: {
    position: "absolute",
    left: "1.7rem",
    top: "50%",
    transform: "translateY(-50%)",
  },
  searchInput: {
    width: "100%",
    padding: "0.55rem 0.75rem 0.55rem 2.1rem",
    border: "1px solid #e2e8f0",
    borderRadius: "9px",
    fontSize: "0.825rem",
    outline: "none",
    backgroundColor: "#fff",
    boxSizing: "border-box" as const,
    color: "#1e293b",
  },
  controlRow: { display: "flex", gap: "0.5rem", padding: "0 1rem 0.6rem" },
  controlGroup: {
    display: "flex",
    alignItems: "center",
    gap: "0.3rem",
    flex: 1,
    backgroundColor: "#fff",
    border: "1px solid #e2e8f0",
    borderRadius: "8px",
    padding: "0.3rem 0.5rem",
  },
  select: {
    border: "none",
    outline: "none",
    fontSize: "0.75rem",
    color: "#475569",
    fontWeight: 600,
    backgroundColor: "transparent",
    cursor: "pointer",
    flex: 1,
  },
  statsBar: {
    display: "flex",
    padding: "0.5rem 1rem 0.75rem",
    gap: "0.5rem",
    borderBottom: "1px solid #f1f5f9",
  },
  statItem: {
    flex: 1,
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: "8px",
    padding: "0.4rem 0.25rem",
    border: "1px solid #f1f5f9",
  },
  statNum: { fontSize: "1rem", fontWeight: 800 },
  statLabel: {
    fontSize: "0.65rem",
    color: "#94a3b8",
    fontWeight: 600,
    marginTop: "0.05rem",
  },
  patientList: { flex: 1, overflowY: "auto" as const, padding: "0.5rem 0" },
  listLoading: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    gap: "0.5rem",
    padding: "3rem 1rem",
    color: "#94a3b8",
    fontSize: "0.825rem",
  },
  listEmpty: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: "0.5rem",
    padding: "3rem 1rem",
    color: "#94a3b8",
    fontSize: "0.825rem",
    textAlign: "center" as const,
  },
  patientCard: {
    display: "flex",
    alignItems: "center",
    gap: "0.65rem",
    padding: "0.75rem 1rem",
    cursor: "pointer",
    transition: "background-color 0.12s",
    borderRadius: "0",
  },
  patientCardActive: {
    backgroundColor: "#f0f9ff",
    borderRight: "3px solid #3db5e6",
  },
  miniAvatar: {
    width: "36px",
    height: "36px",
    borderRadius: "50%",
    flexShrink: 0,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    color: "#fff",
    fontSize: "0.75rem",
    fontWeight: 800,
  },
  activeDot: {
    width: "7px",
    height: "7px",
    borderRadius: "50%",
    backgroundColor: "#ef4444",
    flexShrink: 0,
  },
  pName: {
    fontSize: "0.85rem",
    fontWeight: 700,
    whiteSpace: "nowrap" as const,
    overflow: "hidden",
    textOverflow: "ellipsis",
  },
  pMeta: {
    fontSize: "0.72rem",
    color: "#94a3b8",
    marginTop: "0.1rem",
    whiteSpace: "nowrap" as const,
    overflow: "hidden",
    textOverflow: "ellipsis",
  },
  pStats: {
    display: "flex",
    gap: "0.3rem",
    marginTop: "0.3rem",
    flexWrap: "wrap" as const,
  },
  pStatChip: {
    display: "flex",
    alignItems: "center",
    gap: "0.2rem",
    fontSize: "0.65rem",
    color: "#64748b",
    backgroundColor: "#f1f5f9",
    padding: "0.1rem 0.4rem",
    borderRadius: "6px",
  },

  // Right panel
  rightPanel: {
    flex: 1,
    overflow: "hidden",
    display: "flex",
    flexDirection: "column",
  },
  detailLoading: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    flex: 1,
    gap: "0.5rem",
  },
  retryBtn: {
    marginTop: "0.5rem",
    padding: "0.5rem 1.25rem",
    backgroundColor: "#3db5e6",
    color: "#fff",
    border: "none",
    borderRadius: "8px",
    cursor: "pointer",
    fontWeight: 700,
  },

  // Empty state
  emptyDetail: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    height: "100%",
    padding: "2rem",
    textAlign: "center" as const,
  },
  emptyIllustration: { marginBottom: "1.25rem" },
  emptyCircle: {
    width: "80px",
    height: "80px",
    borderRadius: "50%",
    backgroundColor: "#f0f9ff",
    border: "2px dashed #bae6fd",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  emptyTitle: {
    fontSize: "1.2rem",
    fontWeight: 800,
    color: "#1e293b",
    margin: "0 0 0.5rem",
  },
  emptySubtitle: {
    fontSize: "0.875rem",
    color: "#64748b",
    maxWidth: "340px",
    lineHeight: 1.6,
    margin: "0 0 1.5rem",
  },
  emptyHints: {
    display: "flex",
    flexDirection: "column",
    gap: "0.5rem",
    alignItems: "flex-start",
  },
  emptyHintRow: { display: "flex", alignItems: "center", gap: "0.5rem" },
  emptyHintText: { fontSize: "0.825rem", color: "#64748b" },

  // Hero header
  heroHeader: {
    display: "flex",
    alignItems: "flex-start",
    gap: "1rem",
    padding: "1.25rem 1.5rem",
    borderBottom: "1px solid #f1f5f9",
    flexShrink: 0,
  },
  heroAvatar: {
    width: "52px",
    height: "52px",
    borderRadius: "14px",
    flexShrink: 0,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    color: "#fff",
    fontSize: "1rem",
    fontWeight: 800,
  },
  heroName: {
    fontSize: "1.1rem",
    fontWeight: 800,
    color: "#111827",
    margin: 0,
  },
  heroMeta: { fontSize: "0.8rem", color: "#94a3b8", marginTop: "0.2rem" },
  walkinBadge: {
    fontSize: "0.65rem",
    fontWeight: 700,
    backgroundColor: "#fef9c3",
    color: "#a16207",
    padding: "0.2rem 0.55rem",
    borderRadius: "8px",
    border: "1px solid #fde68a",
  },
  activeBadge: {
    fontSize: "0.65rem",
    fontWeight: 700,
    backgroundColor: "#fef2f2",
    color: "#dc2626",
    padding: "0.2rem 0.55rem",
    borderRadius: "8px",
    border: "1px solid #fecaca",
  },
  refreshDetailBtn: {
    width: "30px",
    height: "30px",
    border: "1px solid #e2e8f0",
    borderRadius: "8px",
    backgroundColor: "#f8fafc",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    cursor: "pointer",
    flexShrink: 0,
    marginLeft: "auto",
  },

  // Tabs
  tabsRow: {
    display: "flex",
    borderBottom: "2px solid #f1f5f9",
    padding: "0 1.5rem",
    flexShrink: 0,
    gap: "0.1rem",
  },
  tab: {
    display: "flex",
    alignItems: "center",
    gap: "0.35rem",
    padding: "0.7rem 1rem",
    border: "none",
    borderBottom: "2px solid transparent",
    backgroundColor: "transparent",
    color: "#94a3b8",
    fontSize: "0.82rem",
    fontWeight: 600,
    cursor: "pointer",
    marginBottom: "-2px",
    transition: "all 0.15s",
    whiteSpace: "nowrap" as const,
  },
  tabActive: {
    color: "#3db5e6",
    borderBottomColor: "#3db5e6",
    backgroundColor: "#f0f9ff",
    borderRadius: "8px 8px 0 0",
  },
  tabContent: {
    flex: 1,
    overflowY: "auto" as const,
    padding: "1.25rem 1.5rem",
  },

  // Overview grid
  overviewGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill,minmax(420px,1fr))",
    gap: "1rem",
    alignItems: "start",
    animation: "fadeIn 0.2s ease",
  },

  // Section / Card
  card: {
    backgroundColor: "#fff",
    borderRadius: "12px",
    border: "1px solid #e5e7eb",
    overflow: "hidden",
    boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
  },
  sectionHeader: {
    display: "flex",
    alignItems: "center",
    gap: "0.55rem",
    padding: "0.8rem 1.1rem",
    borderBottom: "1px solid #f1f5f9",
  },
  sectionTitle: {
    fontSize: "0.85rem",
    fontWeight: 700,
    color: "#1e293b",
    flex: 1,
  },
  iconBox: {
    width: "26px",
    height: "26px",
    borderRadius: "7px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  countBadge: {
    fontSize: "0.65rem",
    fontWeight: 700,
    padding: "0.15rem 0.45rem",
    borderRadius: "6px",
  },
  itemList: {
    display: "flex",
    flexDirection: "column",
    gap: "0.5rem",
    padding: "0.8rem 1.1rem",
  },
  timelineHeader: {
    display: "flex",
    alignItems: "center",
    gap: "0.5rem",
    padding: "0.8rem 1.1rem",
    borderBottom: "1px solid #f1f5f9",
  },
  timelineTitle: { fontSize: "0.85rem", fontWeight: 700, color: "#1e293b" },

  // Demographics
  demoGrid: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "0.75rem",
    padding: "0.9rem 1.1rem",
  },
  demoItem: { display: "flex", flexDirection: "column", gap: "0.1rem" },
  demoLabel: {
    fontSize: "0.65rem",
    color: "#94a3b8",
    fontWeight: 700,
    textTransform: "uppercase" as const,
    letterSpacing: "0.04em",
  },
  demoValue: { fontSize: "0.85rem", fontWeight: 600, color: "#1e293b" },

  // Conditions
  condRow: {
    padding: "0.55rem 0.7rem",
    backgroundColor: "#f0fdf4",
    borderRadius: "8px",
    border: "1px solid #bbf7d0",
  },
  condName: { fontSize: "0.85rem", fontWeight: 700, color: "#065f46" },
  condNotes: { fontSize: "0.75rem", color: "#047857", marginTop: "0.2rem" },

  // Allergies
  allergyRow: {
    padding: "0.55rem 0.7rem",
    backgroundColor: "#fffbeb",
    borderRadius: "8px",
    border: "1px solid #fde68a",
  },
  allergyDetailRow: {
    display: "flex",
    alignItems: "flex-start",
    gap: "0.7rem",
    padding: "0.875rem 1.1rem",
  },
  allergyName: { fontSize: "0.875rem", fontWeight: 700, color: "#92400e" },
  allergyReaction: {
    fontSize: "0.75rem",
    color: "#a16207",
    marginTop: "0.2rem",
  },

  // Cases
  caseRow: {
    display: "flex",
    alignItems: "center",
    gap: "0.7rem",
    padding: "0.875rem 1.1rem",
    cursor: "pointer",
    transition: "background-color 0.12s",
  },
  caseIdBox: {
    width: "36px",
    height: "36px",
    borderRadius: "8px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  caseComplaint: { fontSize: "0.875rem", fontWeight: 700, color: "#1e293b" },
  caseMeta: { fontSize: "0.73rem", color: "#94a3b8", marginTop: "0.1rem" },
  caseDiag: { fontSize: "0.775rem", color: "#0369a1", marginTop: "0.2rem" },
  caseTreat: { fontSize: "0.75rem", color: "#374151", marginTop: "0.15rem" },
  statusPill: {
    fontSize: "0.65rem",
    fontWeight: 700,
    padding: "0.2rem 0.55rem",
    borderRadius: "10px",
    whiteSpace: "nowrap" as const,
  },
  dateChip: {
    display: "flex",
    alignItems: "center",
    gap: "0.2rem",
    fontSize: "0.68rem",
    color: "#94a3b8",
    whiteSpace: "nowrap" as const,
  },

  // Medications
  medRow: {
    display: "flex",
    alignItems: "center",
    gap: "0.75rem",
    padding: "0.875rem 1.1rem",
  },
  medName: { fontSize: "0.875rem", fontWeight: 700, color: "#1e293b" },
  medDose: {
    fontSize: "0.775rem",
    color: "#7c3aed",
    fontWeight: 500,
    marginTop: "0.1rem",
  },

  viewAllBtn: {
    padding: "0.75rem 1.1rem",
    background: "none",
    border: "none",
    color: "#3db5e6",
    fontWeight: 700,
    fontSize: "0.825rem",
    cursor: "pointer",
    textAlign: "center" as const,
    width: "100%",
    borderTop: "1px solid #f1f5f9",
  },
};
