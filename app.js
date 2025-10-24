const { useEffect, useMemo, useState } = React;

const ULIMA_CATEGORIES = [
  "Matrícula",
  "Cafetería ULIMA",
  "Transporte",
  "Materiales / Libros",
  "Alojamiento",
  "Entretenimiento",
  "Salud",
  "Otros",
];

const COLORS = ["#FB923C", "#F97316", "#FB8500", "#F59E0B", "#FCA311", "#FDE68A", "#FDBA74", "#FECACA"];

const currency = (v) => `S/ ${Number(v || 0).toFixed(2)}`;
const uid = () => Math.random().toString(36).slice(2, 9);
const STORAGE_KEY = "unibudget_ulima_v2";

function App() {
  const [txs, setTxs] = useState([]);
  const [budgets, setBudgets] = useState({});
  const [month, setMonth] = useState(() => new Date().toISOString().slice(0, 7));
  const [filter, setFilter] = useState("");
  const [form, setForm] = useState({
    date: new Date().toISOString().slice(0, 10),
    category: ULIMA_CATEGORIES[1],
    amount: 0,
    type: "gasto",
    note: "",
  });

  // Load from localStorage
  useEffect(() => {
    try {
      const s = localStorage.getItem(STORAGE_KEY);
      if (s) {
        const parsed = JSON.parse(s);
        setTxs(parsed.txs || []);
        setBudgets(parsed.budgets || {});
      }
    } catch (e) {
      console.error("Error leyendo storage", e);
    }
  }, []);

  // Save on change
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ txs, budgets }));
  }, [txs, budgets]);

  const monthTxs = useMemo(() => txs.filter((t) => t.date && t.date.startsWith(month)), [txs, month]);

  const totalSpent = useMemo(
    () => monthTxs.filter((t) => t.type === "gasto").reduce((s, t) => s + Number(t.amount || 0), 0),
    [monthTxs]
  );
  const totalIncome = useMemo(
    () => monthTxs.filter((t) => t.type === "ingreso").reduce((s, t) => s + Number(t.amount || 0), 0),
    [monthTxs]
  );

  const byCategory = useMemo(() => {
    return ULIMA_CATEGORIES.map((cat) => {
      const sum = monthTxs
        .filter((t) => t.category === cat && t.type === "gasto")
        .reduce((s, t) => s + Number(t.amount || 0), 0);
      return { category: cat, value: sum };
    });
  }, [monthTxs]);

  function addOrUpdateTx(e) {
    e?.preventDefault();
    if (!form.date || !form.category || !form.amount || Number(form.amount) <= 0 || !form.type) {
      alert("Completa fecha, categoría, tipo y monto válido (> 0).");
      return;
    }
    if (form.id) {
      setTxs((p) => p.map((x) => (x.id === form.id ? { ...form } : x)));
    } else {
      const newTx = {
        id: uid(),
        date: form.date,
        category: form.category,
        amount: Number(form.amount),
        type: form.type,
        note: form.note || "",
      };
      setTxs((p) => [newTx, ...p]);
    }
    setForm({ date: new Date().toISOString().slice(0, 10), category: ULIMA_CATEGORIES[1], amount: 0, type: "gasto", note: "" });
  }

  function editTx(id) {
    const t = txs.find((x) => x.id === id);
    if (!t) return;
    setForm({ ...t });
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function deleteTx(id) {
    if (!confirm("Eliminar registro?")) return;
    setTxs((p) => p.filter((x) => x.id !== id));
  }

  function setBudgetFor(category) {
    const input = prompt(`Presupuesto mensual para "${category}" (S/)`, String(budgets[category] ?? ""));
    if (input === null) return;
    const val = Number(input);
    if (Number.isNaN(val) || val < 0) {
      alert("Ingresa un número válido.");
      return;
    }
    setBudgets((p) => ({ ...p, [category]: val }));
  }

  const pieData = byCategory.filter((d) => d.value > 0);

  const last6 = useMemo(() => {
    const [y, m] = month.split("-").map(Number);
    const arr = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(y, m - 1 - i, 1);
      const label = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      const total = txs.filter((t) => t.date && t.date.startsWith(label) && t.type === "gasto").reduce((s, t) => s + Number(t.amount || 0), 0);
      arr.push({ label, total });
    }
    return arr;
  }, [txs, month]);

  const visible = monthTxs.filter(
    (t) =>
      filter.trim() === "" ||
      (t.note || "").toLowerCase().includes(filter.toLowerCase()) ||
      (t.category || "").toLowerCase().includes(filter.toLowerCase())
  );

  return (
    <div className="app-root">
      <header className="topbar">
        <div className="topbar-inner">
          <div className="logo-box">
            <div className="logo-circle">UL</div>
            <div>
              <div className="title">Sistema de Gestión Financiera Estudiantil</div>
              <div className="subtitle">Universidad de Lima — UniBudget ULIMA</div>
            </div>
          </div>

          <div className="top-controls">
            <input
              type="month"
              value={month}
              onChange={(e) => setMonth(e.target.value)}
              className="control-month"
              aria-label="Seleccionar mes"
            />
            <button
              className="btn-export"
              onClick={() => {
                const header = "id,date,category,type,amount,note\n";
                const rows = txs.map((t) => `${t.id},${t.date},${t.category},${t.type},${t.amount},"${t.note ?? ""}"`);
                const csv = header + rows.join("\n");
                const blob = new Blob([csv], { type: "text/csv" });
                const url = URL.createObjectURL(blob);
                const a = document.createElement("a");
                a.href = url;
                a.download = `unibudget_ulima_${month}.csv`;
                a.click();
                URL.revokeObjectURL(url);
              }}
            >
              Exportar CSV
            </button>
          </div>
        </div>
      </header>

      <main className="container">
        <section className="left-col card">
          <form onSubmit={addOrUpdateTx} className="form-compact">
            <h3>Registrar transacción</h3>

            <div className="row">
              <label>Fecha</label>
              <input
                type="date"
                value={form.date ?? ""}
                onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))}
              />
            </div>

            <div className="row">
              <label>Categoría</label>
              <select value={form.category} onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}>
                {ULIMA_CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>

            <div className="row">
              <label>Tipo</label>
              <select value={form.type} onChange={(e) => setForm((f) => ({ ...f, type: e.target.value }))}>
                <option value="gasto">Gasto</option>
                <option value="ingreso">Ingreso</option>
              </select>
            </div>

            <div className="row">
              <label>Monto (S/)</label>
              <input
                type="number"
                step="0.01"
                value={form.amount ?? 0}
                onChange={(e) => setForm((f) => ({ ...f, amount: Number(e.target.value) }))}
              />
            </div>

            <div className="row">
              <label>Nota</label>
              <input
                type="text"
                value={form.note ?? ""}
                onChange={(e) => setForm((f) => ({ ...f, note: e.target.value }))}
                placeholder="Ej: Almuerzo cafetería"
              />
            </div>

            <div className="row actions">
              <button type="submit" className="btn-primary">
                {form.id ? "Guardar cambios" : "Agregar"}
              </button>
              <button
                type="button"
                className="btn-ghost"
                onClick={() => setForm({ date: new Date().toISOString().slice(0, 10), category: ULIMA_CATEGORIES[1], amount: 0, type: "gasto", note: "" })}
              >
                Limpiar
              </button>
            </div>
          </form>

          <div className="summary">
            <h4>Resumen — {month}</h4>
            <div className="summary-values">
              <div>
                <div className="summary-label">Ingresos</div>
                <div className="summary-value income">{currency(totalIncome)}</div>
              </div>
              <div>
                <div className="summary-label">Gastos</div>
                <div className="summary-value expense">{currency(totalSpent)}</div>
              </div>
              <div>
                <div className="summary-label">Saldo</div>
                <div className="summary-value balance">{currency(totalIncome - totalSpent)}</div>
              </div>
            </div>

            <div style={{ marginTop: 10 }}>
              <label>Buscar (nota o categoría)</label>
              <input placeholder="buscar..." value={filter} onChange={(e) => setFilter(e.target.value)} />
            </div>
          </div>
        </section>

        <section className="middle-col">
          <div className="card charts">
            <h4>Gastos por categoría</h4>
            {pieData.length === 0 ? (
              <div className="empty">No hay gastos este mes.</div>
            ) : (
              <PieChartSVG data={pieData} />
            )}
          </div>

          <div className="card charts">
            <h4>Gasto — últimos 6 meses</h4>
            <BarChartSVG data={last6} />
          </div>

          <div className="card tips">
            <h4>Consejos ULIMA</h4>
            <ul>
              <li>Planifica tus comidas semanales en la cafetería para ahorrar.</li>
              <li>Compara precios de materiales antes de comprar.</li>
              <li>Establece un presupuesto por categoría y recibe alertas visuales.</li>
            </ul>
          </div>
        </section>

        <aside className="right-col card">
          <h4>
            Gastos — {month} <small className="muted">({monthTxs.length} registros)</small>
          </h4>

          <div className="list">
            {visible.length === 0 && <div className="empty">No hay registros para mostrar.</div>}
            {visible.map((t) => (
              <div key={t.id} className="tx-row">
                <div>
                  <div className="tx-cat">{t.category}</div>
                  <div className="tx-note">{t.note}</div>
                </div>
                <div className="tx-right">
                  <div className={`tx-amount ${t.type === "ingreso" ? "income" : "expense"}`}>
                    {t.type === "gasto" ? "-" : "+"} {currency(t.amount)}
                  </div>
                  <div className="tx-meta">
                    <small>{t.date}</small>
                  </div>
                  <div className="tx-actions">
                    <button onClick={() => editTx(t.id)} className="link">Editar</button>
                    <button onClick={() => deleteTx(t.id)} className="link danger">Eliminar</button>
                    <button onClick={() => setBudgetFor(t.category)} className="link">Presupuesto</button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="budgets">
            <h5>Presupuestos</h5>
            {ULIMA_CATEGORIES.map((c, i) => {
              const allocated = budgets[c] ?? 0;
              const spent = byCategory[i].value;
              const pct = allocated ? Math.min(100, (spent / allocated) * 100) : 0;
              return (
                <div key={c} className="budget-row">
                  <div className="budget-left">
                    <div className="dot" style={{ background: COLORS[i % COLORS.length] }} />
                    <div>
                      <div className="budget-cat">{c}</div>
                      <div className="budget-meta">{currency(spent)} / {allocated ? currency(allocated) : "—"}</div>
                    </div>
                  </div>
                  <div className="budget-right">
                    <div className="progress">
                      <div style={{ width: `${pct}%`, background: COLORS[i % COLORS.length] }} />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </aside>
      </main>

      <footer className="footer">UniBudget — Prototipo para estudiantes de la Universidad de Lima • Datos guardados localmente</footer>
    </div>
  );
}

/* --------- Small reusable SVG charts (no deps) ---------- */

function PieChartSVG({ data }) {
  const total = data.reduce((s, d) => s + d.value, 0);
  const size = 220;
  let cumulative = 0;
  return (
    <svg width="100%" height={size} viewBox={`0 0 ${size} ${size}`} style={{ maxWidth: 420 }}>
      <g transform={`translate(${size / 2}, ${size / 2})`}>
        {data.map((d, i) => {
          const start = cumulative / total;
          cumulative += d.value;
          const end = cumulative / total;
          const [sx, sy] = polarToCartesian(start, size / 2 - 10);
          const [ex, ey] = polarToCartesian(end, size / 2 - 10);
          const large = end - start > 0.5 ? 1 : 0;
          const path = `M 0 0 L ${sx} ${sy} A ${size / 2 - 10} ${size / 2 - 10} 0 ${large} 1 ${ex} ${ey} Z`;
          return <path key={d.category} d={path} fill={COLORS[i % COLORS.length]} stroke
