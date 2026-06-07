import { useState, useEffect, useRef } from "react";

// ═══════════════════════════════════════════
// MOCK DATA
// ═══════════════════════════════════════════
const CAMPAIGNS = [
  { id: "C001", name: "حملة يناير 2025", department: "الموارد البشرية", sent: 45, clicked: 18, aware: 27, date: "2025-01-15" },
  { id: "C002", name: "حملة فبراير 2025", department: "المالية", sent: 30, clicked: 8, aware: 22, date: "2025-02-10" },
  { id: "C003", name: "حملة مارس 2025", department: "تقنية المعلومات", sent: 25, clicked: 3, aware: 22, date: "2025-03-05" },
  { id: "C004", name: "حملة أبريل 2025", department: "المبيعات", sent: 50, clicked: 22, aware: 28, date: "2025-04-20" },
  { id: "C005", name: "حملة مايو 2025", department: "الإدارة", sent: 20, clicked: 5, aware: 15, date: "2025-05-12" },
];

const WEEKLY = [
  { day: "السبت", clicks: 4 }, { day: "الأحد", clicks: 7 },
  { day: "الاثنين", clicks: 12 }, { day: "الثلاثاء", clicks: 9 },
  { day: "الأربعاء", clicks: 6 }, { day: "الخميس", clicks: 3 },
  { day: "الجمعة", clicks: 1 },
];

const FEED_INIT = [
  { dept: "الموارد البشرية", action: "نقر على رابط تجريبي", time: "منذ دقيقتين", risk: "high" },
  { dept: "المالية", action: "وصل لصفحة التوعية", time: "منذ 5 دقائق", risk: "low" },
  { dept: "المبيعات", action: "نقر على رابط تجريبي", time: "منذ 11 دقيقة", risk: "high" },
  { dept: "تقنية المعلومات", action: "وصل لصفحة التوعية", time: "منذ 18 دقيقة", risk: "low" },
];

const SCENARIO_STEPS = [
  {
    id: 1, actor: "المؤسسة", icon: "🏢", color: "#60a5fa", title: "إرسال بريد تجريبي",
    desc: "يقوم قسم أمن المعلومات بإرسال بريد إلكتروني تجريبي يحتوي على رابط مشبوه للموظفين المستهدفين.",
    detail: 'من: it-support@company-secure.net\nالموضوع: "عاجل: تحديث كلمة المرور خلال 24 ساعة"\nالرابط: http://company-secure.net/update?id=emp-042',
    warning: null, code: null,
  },
  {
    id: 2, actor: "الموظف", icon: "👤", color: "#fbbf24", title: "الموظف يقرأ البريد",
    desc: "الموظف يرى البريد ولا ينتبه للعلامات التحذيرية الثلاث الواضحة في الرسالة.",
    detail: null,
    warning: [
      { icon: "🔗", text: "النطاق: company-secure.net (وليس company.com الرسمي)" },
      { icon: "⏰", text: 'أسلوب الإلحاح: "عاجل خلال 24 ساعة"' },
      { icon: "🎭", text: "انتحال هوية قسم تقنية المعلومات الداخلي" },
    ], code: null,
  },
  {
    id: 3, actor: "الموظف", icon: "🖱️", color: "#f87171", title: "الموظف يضغط على الرابط",
    desc: "يضغط الموظف على الرابط المشبوه — هنا يلتقط النظام الحدث ويبدأ بالتسجيل.",
    detail: "GET /track/click/emp-042\nUser-Agent: Chrome/Windows\nTimestamp: 2025-05-20 09:14:33",
    warning: null,
    code: `// Backend يستقبل طلب النقر
app.get('/track/click/:empId', (req, res) => {
  const { empId } = req.params;

  // تسجيل النقرة فقط — بدون بيانات حساسة
  db.run(\`INSERT INTO clicks
    (employee_id, department, clicked_at)
    VALUES (?, ?, ?)\`,
    [empId, 'HR', new Date()]
  );

  // توجيه فوري لصفحة التوعية
  res.redirect(\`/awareness?id=\${empId}\`);
});`,
  },
  {
    id: 4, actor: "النظام", icon: "⚙️", color: "#a78bfa", title: "تسجيل النقرة في قاعدة البيانات",
    desc: "الباك-إند يحفظ الحدث ويحدّث الإحصائيات في الوقت الفعلي بدون جمع أي بيانات حساسة.",
    detail: "✅ تم التسجيل: موظف من HR نقر على الرابط\n📊 تحديث لوحة التحكم فوراً\n🔒 لا كلمات مرور — لا بيانات شخصية",
    warning: null,
    code: `-- تصميم جدول قاعدة البيانات
CREATE TABLE clicks (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  emp_id     TEXT    NOT NULL,
  department TEXT    NOT NULL,
  clicked_at DATETIME DEFAULT CURRENT_TIMESTAMP
  -- ❌ لا يوجد حقل password
  -- ❌ لا يوجد حقل credentials
);

-- استعلام الإحصائيات للداشبورد
SELECT department,
       COUNT(*) as total_clicks,
       DATE(clicked_at) as click_date
FROM clicks
GROUP BY department, DATE(clicked_at);`,
  },
  {
    id: 5, actor: "النظام", icon: "↩️", color: "#34d399", title: "توجيه لصفحة التوعية",
    desc: "بدلاً من أي صفحة ضارة، يُوجَّه الموظف فوراً لصفحة توعية تشرح له ما حدث.",
    detail: "HTTP 302 Redirect → /awareness?id=emp-042",
    warning: null,
    code: `// Frontend - صفحة التوعية تستقبل المعرّف
const params = new URLSearchParams(window.location.search);
const empId = params.get('id'); // 'emp-042'

// تعرض رسالة مخصصة للموظف
// وتشرح الأخطاء التي وقع فيها`,
  },
  {
    id: 6, actor: "الموظف", icon: "🎓", color: "#34d399", title: "الموظف يتعلم الدرس",
    desc: "يرى الموظف صفحة توعية تشرح له الأخطاء وكيف يتجنبها — المهمة اكتملت بنجاح.",
    detail: "⚠️ هذا كان اختباراً توعوياً!\n✅ لم تُجمع أي بيانات حساسة\n📚 تعلّم كيف تتعرف على التصيد",
    warning: null, code: null,
  },
];

// ═══════════════════════════════════════════
// SHARED COMPONENTS
// ═══════════════════════════════════════════
const TABS = [
  { id: "dashboard", label: "لوحة التحكم", icon: "📊" },
  { id: "campaigns", label: "الحملات", icon: "📧" },
  { id: "scenario", label: "السيناريو التوضيحي", icon: "🎬" },
  { id: "awareness", label: "صفحة التوعية", icon: "🛡️" },
];

function StatCard({ title, value, subtitle, color, icon, trend }) {
  const colorMap = {
    blue: { bg: "rgba(59,130,246,0.08)", border: "rgba(59,130,246,0.3)", text: "#60a5fa", glow: "rgba(59,130,246,0.15)" },
    green: { bg: "rgba(16,185,129,0.08)", border: "rgba(16,185,129,0.3)", text: "#34d399", glow: "rgba(16,185,129,0.15)" },
    amber: { bg: "rgba(245,158,11,0.08)", border: "rgba(245,158,11,0.3)", text: "#fbbf24", glow: "rgba(245,158,11,0.15)" },
    red: { bg: "rgba(239,68,68,0.08)", border: "rgba(239,68,68,0.3)", text: "#f87171", glow: "rgba(239,68,68,0.15)" },
  };
  const c = colorMap[color];
  return (
    <div style={{ background: c.bg, border: `1px solid ${c.border}`, borderRadius: 16, padding: "22px 24px", boxShadow: `0 0 24px ${c.glow}`, transition: "transform 0.2s", cursor: "default" }}
      onMouseEnter={e => e.currentTarget.style.transform = "translateY(-3px)"}
      onMouseLeave={e => e.currentTarget.style.transform = "translateY(0)"}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div>
          <p style={{ color: "#94a3b8", fontSize: 12, marginBottom: 6, fontFamily: "Cairo,sans-serif" }}>{title}</p>
          <p style={{ color: c.text, fontSize: 34, fontWeight: 800, lineHeight: 1, fontFamily: "Cairo,sans-serif" }}>{value}</p>
          <p style={{ color: "#64748b", fontSize: 11, marginTop: 6, fontFamily: "Cairo,sans-serif" }}>{subtitle}</p>
        </div>
        <span style={{ fontSize: 28, opacity: 0.8 }}>{icon}</span>
      </div>
      {trend && (
        <p style={{ color: trend > 0 ? "#34d399" : "#f87171", fontSize: 11, marginTop: 12, fontFamily: "Cairo,sans-serif" }}>
          {trend > 0 ? "▲" : "▼"} {Math.abs(trend)}% مقارنة بالشهر الماضي
        </p>
      )}
    </div>
  );
}

function BarChart({ data }) {
  const max = Math.max(...data.map(d => d.clicks));
  return (
    <div style={{ display: "flex", alignItems: "flex-end", gap: 8, height: 130 }}>
      {data.map((item, i) => (
        <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
          <span style={{ color: "#60a5fa", fontSize: 10 }}>{item.clicks}</span>
          <div style={{ width: "100%", height: `${(item.clicks / max) * 100}%`, minHeight: 4, background: "linear-gradient(180deg,#60a5fa,#3b82f6)", borderRadius: "4px 4px 0 0", boxShadow: "0 0 8px rgba(59,130,246,0.4)" }} />
          <span style={{ color: "#475569", fontSize: 9 }}>{item.day}</span>
        </div>
      ))}
    </div>
  );
}

function RiskBar({ dept, clicked, sent }) {
  const pct = Math.round((clicked / sent) * 100);
  const color = pct > 50 ? "#f87171" : pct > 25 ? "#fbbf24" : "#34d399";
  return (
    <div style={{ marginBottom: 14 }}>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 }}>
        <span style={{ color: "#cbd5e1", fontSize: 12, fontFamily: "Cairo,sans-serif" }}>{dept}</span>
        <span style={{ color, fontSize: 12, fontWeight: 700, fontFamily: "Cairo,sans-serif" }}>{pct}%</span>
      </div>
      <div style={{ background: "rgba(255,255,255,0.05)", borderRadius: 99, height: 7, overflow: "hidden" }}>
        <div style={{ width: `${pct}%`, height: "100%", background: color, borderRadius: 99, transition: "width 1s ease" }} />
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════
// PAGE: DASHBOARD
// ═══════════════════════════════════════════
function DashboardPage() {
  const [newEvent, setNewEvent] = useState(null);
  const [feed, setFeed] = useState(FEED_INIT);
  const depts = ["الموارد البشرية", "المالية", "تقنية المعلومات", "المبيعات", "الإدارة"];

  useEffect(() => {
    const t = setInterval(() => {
      const isRisk = Math.random() > 0.4;
      const ev = { dept: depts[Math.floor(Math.random() * depts.length)], action: isRisk ? "نقر على رابط تجريبي" : "وصل لصفحة التوعية", risk: isRisk ? "high" : "low", time: "الآن" };
      setNewEvent(ev);
      setTimeout(() => { setNewEvent(null); setFeed(p => [{ ...ev, time: "منذ لحظات" }, ...p.slice(0, 6)]); }, 3000);
    }, 7000);
    return () => clearInterval(t);
  }, []);

  const totalSent = CAMPAIGNS.reduce((a, c) => a + c.sent, 0);
  const totalClicked = CAMPAIGNS.reduce((a, c) => a + c.clicked, 0);
  const totalAware = CAMPAIGNS.reduce((a, c) => a + c.aware, 0);

  return (
    <div style={{ animation: "fadeIn 0.4s ease" }}>
      <div style={{ marginBottom: 24 }}>
        <h2 style={{ fontSize: 20, fontWeight: 800, color: "#f1f5f9", fontFamily: "Cairo,sans-serif" }}>لوحة التحكم الرئيسية</h2>
        <p style={{ color: "#64748b", fontSize: 12, marginTop: 3, fontFamily: "Cairo,sans-serif" }}>إحصائيات حملات التوعية بالتصيد الإلكتروني</p>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 14, marginBottom: 20 }}>
        <StatCard title="إجمالي الرسائل" value={totalSent} subtitle="في جميع الحملات" color="blue" icon="📨" trend={12} />
        <StatCard title="إجمالي النقرات" value={totalClicked} subtitle="موظف نقر على رابط" color="red" icon="⚠️" trend={-8} />
        <StatCard title="معدل النقر" value={`${Math.round((totalClicked / totalSent) * 100)}%`} subtitle="نسبة الموظفين الذين نقروا" color="amber" icon="📉" trend={-5} />
        <StatCard title="معدل الوعي" value={`${Math.round((totalAware / totalSent) * 100)}%`} subtitle="وصلوا لصفحة التوعية" color="green" icon="✅" trend={15} />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 16 }}>
        <div style={{ background: "rgba(15,23,42,0.8)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 14, padding: 22 }}>
          <h3 style={{ color: "#cbd5e1", fontSize: 13, fontWeight: 700, marginBottom: 18, fontFamily: "Cairo,sans-serif" }}>📈 النشاط الأسبوعي</h3>
          <BarChart data={WEEKLY} />
        </div>
        <div style={{ background: "rgba(15,23,42,0.8)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 14, padding: 22 }}>
          <h3 style={{ color: "#cbd5e1", fontSize: 13, fontWeight: 700, marginBottom: 18, fontFamily: "Cairo,sans-serif" }}>🏢 معدل الخطر حسب القسم</h3>
          {CAMPAIGNS.map((c, i) => <RiskBar key={i} dept={c.department} clicked={c.clicked} sent={c.sent} />)}
        </div>
      </div>

      <div style={{ background: "rgba(15,23,42,0.8)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 14, padding: 22 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
          <h3 style={{ color: "#cbd5e1", fontSize: 13, fontWeight: 700, fontFamily: "Cairo,sans-serif" }}>⚡ سجل النشاط المباشر</h3>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <div style={{ width: 7, height: 7, background: "#ef4444", borderRadius: "50%", animation: "pulse 1.5s infinite" }} />
            <span style={{ color: "#ef4444", fontSize: 11, fontFamily: "Cairo,sans-serif" }}>مباشر</span>
          </div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 8, maxHeight: 260, overflowY: "auto" }}>
          {newEvent && (
            <div style={{ background: "rgba(239,68,68,0.15)", border: "1px solid rgba(239,68,68,0.5)", borderRadius: 10, padding: "10px 14px", display: "flex", justifyContent: "space-between", animation: "pulse 1s ease 3" }}>
              <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                <span style={{ fontSize: 16 }}>🔴</span>
                <div>
                  <p style={{ color: "#fca5a5", fontSize: 12, fontWeight: 700, fontFamily: "Cairo,sans-serif" }}>{newEvent.dept}</p>
                  <p style={{ color: "#94a3b8", fontSize: 11, fontFamily: "Cairo,sans-serif" }}>{newEvent.action}</p>
                </div>
              </div>
              <span style={{ color: "#ef4444", fontSize: 11, fontFamily: "Cairo,sans-serif" }}>الآن</span>
            </div>
          )}
          {feed.map((ev, i) => (
            <div key={i} style={{ background: ev.risk === "high" ? "rgba(239,68,68,0.06)" : "rgba(16,185,129,0.06)", border: `1px solid ${ev.risk === "high" ? "rgba(239,68,68,0.2)" : "rgba(16,185,129,0.2)"}`, borderRadius: 10, padding: "9px 14px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                <span style={{ fontSize: 14 }}>{ev.risk === "high" ? "⚠️" : "✅"}</span>
                <div>
                  <p style={{ color: ev.risk === "high" ? "#fca5a5" : "#6ee7b7", fontSize: 12, fontWeight: 600, fontFamily: "Cairo,sans-serif" }}>{ev.dept}</p>
                  <p style={{ color: "#475569", fontSize: 11, fontFamily: "Cairo,sans-serif" }}>{ev.action}</p>
                </div>
              </div>
              <span style={{ color: "#334155", fontSize: 11, fontFamily: "Cairo,sans-serif" }}>{ev.time}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════
// PAGE: CAMPAIGNS
// ═══════════════════════════════════════════
function CampaignsPage() {
  const totalSent = CAMPAIGNS.reduce((a, c) => a + c.sent, 0);
  const totalClicked = CAMPAIGNS.reduce((a, c) => a + c.clicked, 0);
  const totalAware = CAMPAIGNS.reduce((a, c) => a + c.aware, 0);

  return (
    <div style={{ animation: "fadeIn 0.4s ease" }}>
      <div style={{ marginBottom: 24, display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
        <div>
          <h2 style={{ fontSize: 20, fontWeight: 800, color: "#f1f5f9", fontFamily: "Cairo,sans-serif" }}>الحملات التدريبية</h2>
          <p style={{ color: "#64748b", fontSize: 12, marginTop: 3, fontFamily: "Cairo,sans-serif" }}>سجل جميع حملات التوعية المنفذة</p>
        </div>
        <button style={{ background: "linear-gradient(135deg,#3b82f6,#1d4ed8)", border: "none", borderRadius: 10, padding: "9px 18px", color: "#fff", fontSize: 12, fontFamily: "Cairo,sans-serif", fontWeight: 700, cursor: "pointer" }}>+ إضافة حملة</button>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 14, marginBottom: 20 }}>
        {[
          { label: "إجمالي الحملات", val: CAMPAIGNS.length, color: "#60a5fa", icon: "📋" },
          { label: "إجمالي المُرسَل", val: totalSent, color: "#a78bfa", icon: "📨" },
          { label: "معدل الوعي الكلي", val: `${Math.round((totalAware / totalSent) * 100)}%`, color: "#34d399", icon: "🎯" },
        ].map((item, i) => (
          <div key={i} style={{ background: "rgba(15,23,42,0.8)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 14, padding: 18, display: "flex", gap: 14, alignItems: "center" }}>
            <span style={{ fontSize: 26 }}>{item.icon}</span>
            <div>
              <p style={{ color: "#64748b", fontSize: 11, fontFamily: "Cairo,sans-serif" }}>{item.label}</p>
              <p style={{ color: item.color, fontSize: 24, fontWeight: 800, fontFamily: "Cairo,sans-serif" }}>{item.val}</p>
            </div>
          </div>
        ))}
      </div>

      <div style={{ background: "rgba(15,23,42,0.8)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 14, overflow: "hidden" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontFamily: "Cairo,sans-serif" }}>
          <thead>
            <tr style={{ borderBottom: "1px solid rgba(255,255,255,0.06)", background: "rgba(255,255,255,0.02)" }}>
              {["الحملة", "القسم", "التاريخ", "المُرسَل", "النقرات", "الواعون", "نسبة الأمان"].map(h => (
                <th key={h} style={{ padding: "12px 16px", color: "#475569", fontSize: 11, textAlign: "right", fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.5 }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {CAMPAIGNS.map((c, i) => {
              const safe = Math.round(((c.sent - c.clicked) / c.sent) * 100);
              const color = safe > 75 ? "#34d399" : safe > 50 ? "#fbbf24" : "#f87171";
              return (
                <tr key={i} style={{ borderBottom: "1px solid rgba(255,255,255,0.04)" }}
                  onMouseEnter={e => e.currentTarget.style.background = "rgba(255,255,255,0.02)"}
                  onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                  <td style={{ padding: "13px 16px", color: "#cbd5e1", fontSize: 13 }}>{c.name}</td>
                  <td style={{ padding: "13px 16px" }}>
                    <span style={{ background: "rgba(99,102,241,0.12)", border: "1px solid rgba(99,102,241,0.25)", borderRadius: 99, padding: "2px 10px", color: "#a5b4fc", fontSize: 11 }}>{c.department}</span>
                  </td>
                  <td style={{ padding: "13px 16px", color: "#475569", fontSize: 12 }}>{c.date}</td>
                  <td style={{ padding: "13px 16px", color: "#60a5fa", fontSize: 14, fontWeight: 700 }}>{c.sent}</td>
                  <td style={{ padding: "13px 16px", color: "#f87171", fontSize: 14, fontWeight: 700 }}>{c.clicked}</td>
                  <td style={{ padding: "13px 16px", color: "#34d399", fontSize: 14, fontWeight: 700 }}>{c.aware}</td>
                  <td style={{ padding: "13px 16px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <div style={{ flex: 1, background: "rgba(255,255,255,0.05)", borderRadius: 99, height: 6, overflow: "hidden" }}>
                        <div style={{ width: `${safe}%`, height: "100%", background: color, borderRadius: 99 }} />
                      </div>
                      <span style={{ color, fontWeight: 800, fontSize: 13, minWidth: 36 }}>{safe}%</span>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════
// PAGE: SCENARIO
// ═══════════════════════════════════════════
function ScenarioPage() {
  const [current, setCurrent] = useState(0);
  const [playing, setPlaying] = useState(false);
  const step = SCENARIO_STEPS[current];

  useEffect(() => {
    if (!playing) return;
    if (current >= SCENARIO_STEPS.length - 1) { setPlaying(false); return; }
    const t = setTimeout(() => setCurrent(s => s + 1), 2500);
    return () => clearTimeout(t);
  }, [playing, current]);

  const reset = () => { setCurrent(0); setPlaying(false); };

  return (
    <div style={{ animation: "fadeIn 0.4s ease" }}>
      <div style={{ marginBottom: 24, display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
        <div>
          <h2 style={{ fontSize: 20, fontWeight: 800, color: "#f1f5f9", fontFamily: "Cairo,sans-serif" }}>🎬 السيناريو التوضيحي</h2>
          <p style={{ color: "#64748b", fontSize: 12, marginTop: 3, fontFamily: "Cairo,sans-serif" }}>رحلة الموظف خطوة بخطوة من استلام البريد حتى صفحة التوعية</p>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button onClick={reset} style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, padding: "7px 14px", color: "#94a3b8", fontSize: 12, cursor: "pointer", fontFamily: "Cairo,sans-serif" }}>↺ إعادة</button>
          <button onClick={() => { if (current >= SCENARIO_STEPS.length - 1) reset(); setPlaying(p => !p); }}
            style={{ background: playing ? "rgba(239,68,68,0.2)" : "linear-gradient(135deg,#3b82f6,#1d4ed8)", border: playing ? "1px solid rgba(239,68,68,0.4)" : "none", borderRadius: 8, padding: "7px 16px", color: "#fff", fontSize: 12, cursor: "pointer", fontFamily: "Cairo,sans-serif", fontWeight: 700 }}>
            {playing ? "⏸ إيقاف" : current >= SCENARIO_STEPS.length - 1 ? "↺ إعادة" : "▶ تشغيل"}
          </button>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "300px 1fr", gap: 20 }}>
        {/* Steps List */}
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {SCENARIO_STEPS.map((s, i) => (
            <div key={s.id} onClick={() => { setPlaying(false); setCurrent(i); }}
              style={{ background: i === current ? `${s.color}15` : i < current ? "rgba(52,211,153,0.05)" : "rgba(15,23,42,0.6)", border: `2px solid ${i === current ? s.color : i < current ? "rgba(52,211,153,0.25)" : "rgba(255,255,255,0.05)"}`, borderRadius: 12, padding: "12px 16px", cursor: "pointer", display: "flex", alignItems: "center", gap: 12, transition: "all 0.25s", transform: i === current ? "scale(1.02)" : "scale(1)" }}>
              <div style={{ width: 38, height: 38, borderRadius: "50%", background: i === current ? s.color + "30" : "rgba(255,255,255,0.04)", border: `2px solid ${i === current ? s.color : i < current ? "#34d399" : "rgba(255,255,255,0.08)"}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 17, flexShrink: 0 }}>
                {i < current && i !== current ? "✓" : s.icon}
              </div>
              <div style={{ flex: 1 }}>
                <p style={{ color: i === current ? s.color : i < current ? "#34d399" : "#94a3b8", fontSize: 12, fontWeight: 700, fontFamily: "Cairo,sans-serif" }}>{s.title}</p>
                <p style={{ color: "#475569", fontSize: 10, fontFamily: "Cairo,sans-serif" }}>{s.actor}</p>
              </div>
            </div>
          ))}
          <div style={{ background: "rgba(255,255,255,0.04)", borderRadius: 99, height: 5, marginTop: 6, overflow: "hidden" }}>
            <div style={{ width: `${((current + 1) / SCENARIO_STEPS.length) * 100}%`, height: "100%", background: "linear-gradient(90deg,#3b82f6,#34d399)", borderRadius: 99, transition: "width 0.5s ease" }} />
          </div>
        </div>

        {/* Detail */}
        <div key={current} style={{ animation: "fadeIn 0.35s ease" }}>
          <div style={{ background: `${step.color}10`, border: `1px solid ${step.color}33`, borderRadius: 16, padding: 26, marginBottom: 14, boxShadow: `0 0 30px ${step.color}18` }}>
            <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 14 }}>
              <span style={{ fontSize: 44 }}>{step.icon}</span>
              <div>
                <span style={{ background: step.color + "20", border: `1px solid ${step.color}40`, color: step.color, fontSize: 10, padding: "2px 10px", borderRadius: 99, fontWeight: 700, fontFamily: "Cairo,sans-serif" }}>{step.actor}</span>
                <h3 style={{ fontSize: 20, fontWeight: 800, color: "#f1f5f9", marginTop: 6, fontFamily: "Cairo,sans-serif" }}>{step.title}</h3>
              </div>
            </div>
            <p style={{ color: "#94a3b8", fontSize: 14, lineHeight: 1.8, fontFamily: "Cairo,sans-serif" }}>{step.desc}</p>
          </div>

          {step.detail && (
            <div style={{ background: "rgba(15,23,42,0.8)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 12, padding: 18, marginBottom: 14 }}>
              <p style={{ color: "#475569", fontSize: 10, fontWeight: 700, marginBottom: 8, textTransform: "uppercase", letterSpacing: 1, fontFamily: "Cairo,sans-serif" }}>مثال توضيحي</p>
              <pre style={{ color: "#cbd5e1", fontSize: 12, whiteSpace: "pre-wrap", lineHeight: 1.7, fontFamily: "monospace", direction: "ltr", textAlign: "left" }}>{step.detail}</pre>
            </div>
          )}

          {step.warning && (
            <div style={{ background: "rgba(251,191,36,0.06)", border: "1px solid rgba(251,191,36,0.2)", borderRadius: 12, padding: 18, marginBottom: 14 }}>
              <p style={{ color: "#fbbf24", fontSize: 13, fontWeight: 700, marginBottom: 12, fontFamily: "Cairo,sans-serif" }}>⚠️ علامات التصيد المخفية في هذا البريد:</p>
              {step.warning.map((w, i) => (
                <div key={i} style={{ display: "flex", gap: 10, alignItems: "flex-start", marginBottom: 10, background: "rgba(251,191,36,0.04)", borderRadius: 8, padding: "9px 12px" }}>
                  <span style={{ fontSize: 18 }}>{w.icon}</span>
                  <span style={{ color: "#94a3b8", fontSize: 13, lineHeight: 1.6, fontFamily: "Cairo,sans-serif" }}>{w.text}</span>
                </div>
              ))}
            </div>
          )}

          {step.code && (
            <div style={{ background: "#0d1117", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 12, overflow: "hidden" }}>
              <div style={{ display: "flex", gap: 6, padding: "8px 14px", borderBottom: "1px solid rgba(255,255,255,0.05)", background: "rgba(255,255,255,0.02)" }}>
                {["#f87171", "#fbbf24", "#34d399"].map(c => <div key={c} style={{ width: 9, height: 9, borderRadius: "50%", background: c }} />)}
                <span style={{ color: "#334155", fontSize: 10, marginRight: "auto" }}>كود توضيحي</span>
              </div>
              <pre style={{ padding: 18, color: "#7dd3fc", fontSize: 12, lineHeight: 1.8, overflowX: "auto", fontFamily: "monospace", direction: "ltr", textAlign: "left" }}>{step.code}</pre>
            </div>
          )}

          {current === SCENARIO_STEPS.length - 1 && (
            <div style={{ marginTop: 14, background: "rgba(52,211,153,0.08)", border: "1px solid rgba(52,211,153,0.3)", borderRadius: 14, padding: 20, textAlign: "center" }}>
              <p style={{ color: "#34d399", fontWeight: 800, fontSize: 16, fontFamily: "Cairo,sans-serif" }}>🎓 اكتمل السيناريو بنجاح!</p>
              <p style={{ color: "#64748b", fontSize: 13, marginTop: 6, fontFamily: "Cairo,sans-serif" }}>الموظف تعلّم الدرس بدون أي ضرر حقيقي</p>
            </div>
          )}

          <div style={{ display: "flex", justifyContent: "space-between", marginTop: 16 }}>
            <button onClick={() => setCurrent(s => Math.max(0, s - 1))} disabled={current === 0}
              style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 9, padding: "9px 20px", color: current === 0 ? "#1e293b" : "#94a3b8", fontSize: 13, cursor: current === 0 ? "not-allowed" : "pointer", fontFamily: "Cairo,sans-serif" }}>← السابق</button>
            <button onClick={() => setCurrent(s => Math.min(SCENARIO_STEPS.length - 1, s + 1))} disabled={current === SCENARIO_STEPS.length - 1}
              style={{ background: current === SCENARIO_STEPS.length - 1 ? "rgba(255,255,255,0.03)" : "linear-gradient(135deg,#3b82f6,#1d4ed8)", border: "none", borderRadius: 9, padding: "9px 20px", color: current === SCENARIO_STEPS.length - 1 ? "#1e293b" : "#fff", fontSize: 13, cursor: current === SCENARIO_STEPS.length - 1 ? "not-allowed" : "pointer", fontFamily: "Cairo,sans-serif", fontWeight: 700 }}>التالي →</button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════
// PAGE: AWARENESS
// ═══════════════════════════════════════════
function AwarenessPage() {
  const [revealed, setRevealed] = useState(false);
  useEffect(() => { setTimeout(() => setRevealed(true), 300); }, []);

  return (
    <div style={{ animation: "fadeIn 0.4s ease" }}>
      <div style={{ marginBottom: 24 }}>
        <h2 style={{ fontSize: 20, fontWeight: 800, color: "#f1f5f9", fontFamily: "Cairo,sans-serif" }}>🛡️ صفحة التوعية الأمنية</h2>
        <p style={{ color: "#64748b", fontSize: 12, marginTop: 3, fontFamily: "Cairo,sans-serif" }}>هذا ما يراه الموظف بعد النقر على الرابط التجريبي</p>
      </div>

      <div style={{ maxWidth: 680, margin: "0 auto" }}>
        {/* Alert Box */}
        <div style={{ background: "rgba(239,68,68,0.07)", border: "2px solid rgba(239,68,68,0.35)", borderRadius: 20, padding: 36, textAlign: "center", marginBottom: 20, boxShadow: "0 0 50px rgba(239,68,68,0.1)" }}>
          <div style={{ fontSize: 58, marginBottom: 16 }}>⚠️</div>
          <div style={{ display: "inline-block", background: "rgba(239,68,68,0.12)", border: "1px solid rgba(239,68,68,0.35)", borderRadius: 99, padding: "5px 18px", marginBottom: 16 }}>
            <span style={{ color: "#f87171", fontSize: 11, fontWeight: 700, fontFamily: "Cairo,sans-serif" }}>اختبار توعوي من قسم أمن المعلومات</span>
          </div>
          <h2 style={{ fontSize: 22, fontWeight: 800, color: "#fca5a5", marginBottom: 14, fontFamily: "Cairo,sans-serif" }}>لقد نقرت على رابط تصيد إلكتروني تجريبي!</h2>
          <p style={{ color: "#94a3b8", fontSize: 14, lineHeight: 1.9, fontFamily: "Cairo,sans-serif" }}>
            هذا البريد كان جزءاً من تدريب داخلي لرفع الوعي الأمني.<br />
            <strong style={{ color: "#34d399" }}>لم يتم جمع أي بيانات حساسة أو كلمات مرور.</strong>
          </p>
        </div>

        {/* Warning Cards */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 12, marginBottom: 20 }}>
          {[
            { icon: "🔗", title: "رابط مشبوه", desc: "النطاق لا يطابق العنوان الرسمي للمؤسسة" },
            { icon: "⏰", title: "ضغط زمني", desc: "طلب تصرف فوري بدون وقت للتفكير" },
            { icon: "🎭", title: "انتحال هوية", desc: "تظاهر بأنه بريد رسمي من الإدارة" },
          ].map((w, i) => (
            <div key={i} style={{ background: "rgba(15,23,42,0.8)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 14, padding: 18, textAlign: "center", transition: "transform 0.2s", cursor: "default" }}
              onMouseEnter={e => e.currentTarget.style.transform = "translateY(-3px)"}
              onMouseLeave={e => e.currentTarget.style.transform = "translateY(0)"}>
              <div style={{ fontSize: 28, marginBottom: 10 }}>{w.icon}</div>
              <p style={{ color: "#fbbf24", fontSize: 13, fontWeight: 700, marginBottom: 6, fontFamily: "Cairo,sans-serif" }}>{w.title}</p>
              <p style={{ color: "#64748b", fontSize: 11, lineHeight: 1.6, fontFamily: "Cairo,sans-serif" }}>{w.desc}</p>
            </div>
          ))}
        </div>

        {/* Tips */}
        <div style={{ background: "rgba(16,185,129,0.06)", border: "1px solid rgba(16,185,129,0.2)", borderRadius: 16, padding: 24 }}>
          <h3 style={{ color: "#34d399", fontSize: 14, fontWeight: 800, marginBottom: 16, textAlign: "center", fontFamily: "Cairo,sans-serif" }}>✅ كيف تحمي نفسك في المستقبل؟</h3>
          {[
            "تحقق دائماً من عنوان المُرسِل ونطاق الرابط قبل أي نقرة",
            "لا تُدخل بياناتك في أي صفحة وصلت إليها عبر بريد إلكتروني",
            "إذا شككت في أي بريد، أبلغ قسم أمن المعلومات فوراً",
            "تذكر: المؤسسة لن تطلب منك كلمة مرورك عبر البريد الإلكتروني أبداً",
          ].map((tip, i) => (
            <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: 10, marginBottom: 12, padding: "10px 14px", background: "rgba(16,185,129,0.04)", borderRadius: 10 }}>
              <span style={{ color: "#34d399", fontSize: 14, marginTop: 1, flexShrink: 0 }}>◆</span>
              <span style={{ color: "#94a3b8", fontSize: 13, lineHeight: 1.7, fontFamily: "Cairo,sans-serif" }}>{tip}</span>
            </div>
          ))}
        </div>

        {/* Quiz */}
        <div style={{ marginTop: 20, background: "rgba(99,102,241,0.06)", border: "1px solid rgba(99,102,241,0.2)", borderRadius: 16, padding: 24 }}>
          <h3 style={{ color: "#a5b4fc", fontSize: 14, fontWeight: 800, marginBottom: 16, fontFamily: "Cairo,sans-serif" }}>🧠 اختبر معلوماتك — ما الخطوة الصحيحة عند تلقي بريد مشبوه؟</h3>
          <Quiz />
        </div>
      </div>
    </div>
  );
}

function Quiz() {
  const [selected, setSelected] = useState(null);
  const options = [
    { text: "أنقر على الرابط لأرى ما يحدث", correct: false },
    { text: "أحذف البريد وأبلغ قسم أمن المعلومات", correct: true },
    { text: "أرسله لزملائي لأعرف رأيهم", correct: false },
    { text: "أدخل بياناتي إذا بدا الموقع رسمياً", correct: false },
  ];
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      {options.map((opt, i) => {
        const picked = selected === i;
        const showResult = selected !== null;
        const bg = !showResult ? "rgba(255,255,255,0.04)" : picked && opt.correct ? "rgba(52,211,153,0.12)" : picked && !opt.correct ? "rgba(239,68,68,0.12)" : "rgba(255,255,255,0.02)";
        const border = !showResult ? "rgba(255,255,255,0.08)" : picked && opt.correct ? "rgba(52,211,153,0.4)" : picked && !opt.correct ? "rgba(239,68,68,0.4)" : "rgba(255,255,255,0.04)";
        return (
          <button key={i} onClick={() => !selected && setSelected(i)}
            style={{ background: bg, border: `1px solid ${border}`, borderRadius: 10, padding: "11px 16px", color: showResult && opt.correct ? "#6ee7b7" : "#94a3b8", fontSize: 13, textAlign: "right", cursor: selected ? "default" : "pointer", fontFamily: "Cairo,sans-serif", display: "flex", justifyContent: "space-between", alignItems: "center", transition: "all 0.2s" }}>
            {opt.text}
            {showResult && opt.correct && <span style={{ color: "#34d399" }}>✓ صحيح</span>}
            {showResult && picked && !opt.correct && <span style={{ color: "#f87171" }}>✗ خطأ</span>}
          </button>
        );
      })}
      {selected !== null && (
        <p style={{ color: options[selected].correct ? "#34d399" : "#f87171", fontSize: 13, textAlign: "center", fontWeight: 700, marginTop: 4, fontFamily: "Cairo,sans-serif" }}>
          {options[selected].correct ? "🎉 ممتاز! هذا هو القرار الصحيح دائماً." : "❌ هذا القرار خاطئ — الإبلاغ الفوري هو الحل الصحيح دائماً."}
        </p>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════
// MAIN APP
// ═══════════════════════════════════════════
export default function App() {
  const [activeTab, setActiveTab] = useState("dashboard");

  return (
    <div dir="rtl" style={{ minHeight: "100vh", background: "#0b0f1a", color: "#e2e8f0" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700;800&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        ::-webkit-scrollbar { width: 5px; }
        ::-webkit-scrollbar-thumb { background: #1e293b; border-radius: 3px; }
        @keyframes fadeIn { from{opacity:0;transform:translateY(10px)} to{opacity:1;transform:translateY(0)} }
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.4} }
      `}</style>

      {/* Header */}
      <header style={{ borderBottom: "1px solid rgba(255,255,255,0.06)", background: "rgba(11,15,26,0.97)", backdropFilter: "blur(20px)", position: "sticky", top: 0, zIndex: 100 }}>
        <div style={{ maxWidth: 1200, margin: "0 auto", padding: "0 24px", height: 58, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ width: 34, height: 34, background: "linear-gradient(135deg,#3b82f6,#1d4ed8)", borderRadius: 9, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, boxShadow: "0 0 16px rgba(59,130,246,0.4)" }}>🛡️</div>
            <div>
              <h1 style={{ fontSize: 15, fontWeight: 800, color: "#f1f5f9", fontFamily: "Cairo,sans-serif" }}>PhishShield</h1>
              <p style={{ fontSize: 9, color: "#334155", fontFamily: "Cairo,sans-serif" }}>نظام التوعية بالتصيد الإلكتروني</p>
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <div style={{ width: 7, height: 7, background: "#34d399", borderRadius: "50%", animation: "pulse 2s infinite", boxShadow: "0 0 8px #34d399" }} />
            <span style={{ color: "#34d399", fontSize: 11, fontFamily: "Cairo,sans-serif" }}>النظام نشط</span>
          </div>
        </div>

        {/* Tabs */}
        <div style={{ maxWidth: 1200, margin: "0 auto", padding: "0 24px", display: "flex", gap: 2, borderTop: "1px solid rgba(255,255,255,0.03)" }}>
          {TABS.map(t => (
            <button key={t.id} onClick={() => setActiveTab(t.id)} style={{
              padding: "11px 18px", border: "none", background: "transparent", cursor: "pointer",
              color: activeTab === t.id ? "#60a5fa" : "#475569",
              borderBottom: `2px solid ${activeTab === t.id ? "#3b82f6" : "transparent"}`,
              fontSize: 12, fontFamily: "Cairo,sans-serif", fontWeight: activeTab === t.id ? 700 : 400,
              display: "flex", alignItems: "center", gap: 6, transition: "all 0.2s"
            }}>
              <span>{t.icon}</span>{t.label}
            </button>
          ))}
        </div>
      </header>

      {/* Content */}
      <main style={{ maxWidth: 1200, margin: "0 auto", padding: "28px 24px" }}>
        {activeTab === "dashboard" && <DashboardPage />}
        {activeTab === "campaigns" && <CampaignsPage />}
        {activeTab === "scenario" && <ScenarioPage />}
        {activeTab === "awareness" && <AwarenessPage />}
      </main>
    </div>
  );
}
