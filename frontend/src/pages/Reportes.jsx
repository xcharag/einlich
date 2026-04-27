import React, { useState } from 'react';
import * as XLSX from 'xlsx';
import api from '../api';

// ── helpers ───────────────────────────────────────────────────────────────────
function modelLabel(m) {
  return m === 'portero' ? 'Portero' : 'Jugador';
}

function exportExcel(rows, sheetName, fileName) {
  const ws = XLSX.utils.json_to_sheet(rows);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, sheetName);
  XLSX.writeFile(wb, `${fileName}.xlsx`);
}

async function copyText(rows, fields, setCopied) {
  const lines = rows.map((row) =>
    fields.map((f) => `${f.label}: ${row[f.key] ?? '-'}`).join(' | ')
  );
  await navigator.clipboard.writeText(lines.join('\n'));
  setCopied(true);
  setTimeout(() => setCopied(false), 2200);
}

// ── NumberCell — inline editable shirt number (admin only) ───────────────────
function NumberCell({ player, token, onUpdated }) {
  const [editing,  setEditing]  = useState(false);
  const [value,    setValue]    = useState(player.numeroPolera ?? '');
  const [saving,   setSaving]   = useState(false);
  const [rowError, setRowError] = useState('');

  const handleSave = async () => {
    const num = parseInt(value, 10);
    if (isNaN(num) || num < 1 || num > 999) {
      setRowError('Número inválido');
      return;
    }
    setSaving(true);
    setRowError('');
    try {
      const res = await api.patch(`/api/players/${player._id}/numero`, { numeroPolera: num }, {
        headers: { Authorization: `Bearer ${token}` },
      });
      onUpdated(res.data);
      setEditing(false);
    } catch (err) {
      setRowError(err.response?.data?.error || 'Error al guardar');
    } finally {
      setSaving(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') handleSave();
    if (e.key === 'Escape') { setEditing(false); setValue(player.numeroPolera ?? ''); setRowError(''); }
  };

  if (!editing) {
    return (
      <span
        className="num-cell"
        title="Haz clic para editar el número"
        style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.35rem' }}
        onClick={() => { setEditing(true); setValue(player.numeroPolera ?? ''); }}
      >
        {player.numeroPolera ?? <span style={{ color: 'var(--gray)', fontWeight: 400, fontStyle: 'italic' }}>—</span>}
        <span style={{ fontSize: '0.65rem', color: 'var(--gray)' }}>✏️</span>
      </span>
    );
  }

  return (
    <span style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
      <span style={{ display: 'flex', gap: '0.3rem', alignItems: 'center' }}>
        <input
          type="number"
          value={value}
          onChange={(e) => { setValue(e.target.value); setRowError(''); }}
          onKeyDown={handleKeyDown}
          autoFocus
          min={1}
          max={999}
          inputMode="numeric"
          style={{ width: '72px', padding: '0.25rem 0.4rem', border: '2px solid var(--gold)', borderRadius: '6px', fontSize: '0.85rem' }}
        />
        <button
          className="btn btn-primary btn-sm"
          onClick={handleSave}
          disabled={saving}
          style={{ margin: 0, minHeight: '28px', padding: '0.2rem 0.55rem', fontSize: '0.75rem' }}
        >
          {saving ? <span className="spinner" style={{ width: 12, height: 12 }} /> : '✓'}
        </button>
        <button
          className="btn btn-outline btn-sm"
          onClick={() => { setEditing(false); setValue(player.numeroPolera ?? ''); setRowError(''); }}
          style={{ margin: 0, minHeight: '28px', padding: '0.2rem 0.5rem', fontSize: '0.75rem' }}
        >
          ✕
        </button>
      </span>
      {rowError && <span style={{ fontSize: '0.7rem', color: 'var(--red)' }}>{rowError}</span>}
    </span>
  );
}

// ── sub-components ────────────────────────────────────────────────────────────
function PlayerTable({ players: initialPlayers, token }) {
  const [players,       setPlayers]       = useState(initialPlayers);
  const [copiedPlayers, setCopiedPlayers] = useState(false);

  // Keep in sync when parent reloads data
  React.useEffect(() => { setPlayers(initialPlayers); }, [initialPlayers]);

  const handleUpdated = (updated) => {
    setPlayers((prev) => prev.map((p) => p._id === updated._id ? updated : p));
  };

  const excelRows = players.map((p) => ({
    Jugador:         p.nombreJugador,
    Modelo:          modelLabel(p.modelo),
    'Nombre Polera': p.nombrePolera,
    Talla:           p.talla,
    'Número':        p.numeroPolera ?? '',
  }));

  const clipFields = [
    { key: 'nombreJugador', label: 'Jugador' },
    { key: 'modelo',        label: 'Modelo'  },
    { key: 'nombrePolera',  label: 'Nombre'  },
    { key: 'talla',         label: 'Talla'   },
    { key: 'numeroPolera',  label: 'Número'  },
  ];

  const clipRows = players.map((p) => ({
    ...p,
    modelo: modelLabel(p.modelo),
    numeroPolera: p.numeroPolera ?? '—',
  }));

  return (
    <div className="report-section">
      <div className="report-section-header">
        <h2 className="report-section-title">⚽ Jugadores ({players.length})</h2>
        <div className="report-actions">
          <button
            className="btn btn-outline btn-sm"
            onClick={() => copyText(clipRows, clipFields, setCopiedPlayers)}
            disabled={players.length === 0}
          >
            {copiedPlayers ? '✅ Copiado' : '📋 Copiar'}
          </button>
          <button
            className="btn btn-primary btn-sm"
            onClick={() => exportExcel(excelRows, 'Jugadores', 'einlich-jugadores')}
            disabled={players.length === 0}
          >
            📥 Excel
          </button>
        </div>
      </div>

      <div className="reports-table-wrap">
        <table className="reports-table">
          <thead>
            <tr>
              <th>Jugador</th>
              <th>Modelo</th>
              <th>Nombre Polera</th>
              <th>Talla</th>
              <th>Nro. ✏️</th>
            </tr>
          </thead>
          <tbody>
            {players.length === 0 ? (
              <tr><td colSpan={5} className="empty-cell">Sin pedidos aún</td></tr>
            ) : (
              players.map((p) => (
                <tr key={p._id}>
                  <td style={{ fontWeight: 700 }}>{p.nombreJugador}</td>
                  <td><span className={`badge badge-${p.modelo}`}>{modelLabel(p.modelo)}</span></td>
                  <td>{p.nombrePolera}</td>
                  <td>{p.talla}</td>
                  <td><NumberCell player={p} token={token} onUpdated={handleUpdated} /></td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function FanTable({ fans }) {
  const [copiedFans, setCopiedFans] = useState(false);

  const excelRows = fans.map((f) => ({
    Nombre:          f.nombre,
    Teléfono:        f.telefono,
    Modelo:          modelLabel(f.modelo),
    'Nombre Polera': f.nombrePolera,
    Talla:           f.talla,
    'Número':        f.numeroPolera,
  }));

  const clipFields = [
    { key: 'nombre',       label: 'Nombre'   },
    { key: 'telefono',     label: 'Tel'       },
    { key: 'modelo',       label: 'Modelo'    },
    { key: 'nombrePolera', label: 'Polera'    },
    { key: 'talla',        label: 'Talla'     },
    { key: 'numeroPolera', label: 'Número'    },
  ];

  const clipRows = fans.map((f) => ({ ...f, modelo: modelLabel(f.modelo) }));

  return (
    <div className="report-section">
      <div className="report-section-header">
        <h2 className="report-section-title">👕 Hinchas ({fans.length})</h2>
        <div className="report-actions">
          <button
            className="btn btn-outline btn-sm"
            onClick={() => copyText(clipRows, clipFields, setCopiedFans)}
            disabled={fans.length === 0}
          >
            {copiedFans ? '✅ Copiado' : '📋 Copiar'}
          </button>
          <button
            className="btn btn-primary btn-sm"
            onClick={() => exportExcel(excelRows, 'Hinchas', 'einlich-hinchas')}
            disabled={fans.length === 0}
          >
            📥 Excel
          </button>
        </div>
      </div>

      <div className="reports-table-wrap">
        <table className="reports-table">
          <thead>
            <tr>
              <th>Nombre</th>
              <th>Teléfono</th>
              <th>Modelo</th>
              <th>Nombre Polera</th>
              <th>Talla</th>
              <th>Nro.</th>
            </tr>
          </thead>
          <tbody>
            {fans.length === 0 ? (
              <tr><td colSpan={6} className="empty-cell">Sin pedidos aún</td></tr>
            ) : (
              fans.map((f) => (
                <tr key={f._id}>
                  <td style={{ fontWeight: 700 }}>{f.nombre}</td>
                  <td>{f.telefono}</td>
                  <td><span className={`badge badge-${f.modelo}`}>{modelLabel(f.modelo)}</span></td>
                  <td>{f.nombrePolera}</td>
                  <td>{f.talla}</td>
                  <td className="num-cell">{f.numeroPolera}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ── Main component ─────────────────────────────────────────────────────────────
export default function Reportes() {
  const [password,     setPassword]     = useState('');
  const [token,        setToken]        = useState('');
  const [loginError,   setLoginError]   = useState('');
  const [isLoggingIn,  setIsLoggingIn]  = useState(false);
  const [players,      setPlayers]      = useState([]);
  const [fans,         setFans]         = useState([]);
  const [loadError,    setLoadError]    = useState('');
  const [isLoading,    setIsLoading]    = useState(false);
  const [hasLoaded,    setHasLoaded]    = useState(false);

  const loadData = async (tok) => {
    setIsLoading(true);
    setLoadError('');
    try {
      const headers = { Authorization: `Bearer ${tok}` };
      const [pRes, fRes] = await Promise.all([
        api.get('/api/players', { headers }),
        api.get('/api/fans',    { headers }),
      ]);
      setPlayers(pRes.data);
      setFans(fRes.data);
      setHasLoaded(true);
    } catch (err) {
      setLoadError(err.response?.data?.error || 'Error al cargar los datos');
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoginError('');
    setIsLoggingIn(true);
    try {
      const res  = await api.post('/api/auth/login', { password });
      const tok  = res.data.token;
      setToken(tok);
      await loadData(tok);
    } catch (err) {
      setLoginError(err.response?.data?.error || 'Error al iniciar sesión');
    } finally {
      setIsLoggingIn(false);
    }
  };

  // ── Password gate ────────────────────────────────────────────────────────
  if (!token) {
    return (
      <>
        <div className="page-header">
          <h1>Reportes</h1>
          <p>Acceso restringido</p>
        </div>
        <div className="password-form">
          <div className="card">
            <p className="section-title">Contraseña de Acceso</p>
            <form onSubmit={handleLogin} noValidate>
              <div className="form-group">
                <label htmlFor="rep-password">Contraseña</label>
                <input
                  id="rep-password"
                  type="password"
                  value={password}
                  onChange={(e) => { setPassword(e.target.value); setLoginError(''); }}
                  placeholder="••••••••"
                  autoComplete="current-password"
                />
              </div>
              {loginError && <div className="alert alert-error">{loginError}</div>}
              <button
                type="submit"
                className="btn btn-primary"
                disabled={!password || isLoggingIn}
              >
                {isLoggingIn && <span className="spinner" />}
                {isLoggingIn ? 'Ingresando…' : '🔐 Ingresar'}
              </button>
            </form>
          </div>
        </div>
      </>
    );
  }

  // ── Initial loading screen ───────────────────────────────────────────────
  if (isLoading && !hasLoaded) {
    return (
      <div className="loading-box" style={{ minHeight: '60vh' }}>
        <span className="spinner" />
        <span>Cargando datos…</span>
      </div>
    );
  }

  // ── Reports view ─────────────────────────────────────────────────────────
  return (
    <>
      <div className="page-header">
        <h1>Reportes</h1>
        <p>Resumen de todos los pedidos</p>
      </div>

      <div className="page" style={{ maxWidth: '100%' }}>
        {loadError && <div className="alert alert-error">{loadError}</div>}

        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '1rem' }}>
          <button
            className="btn btn-outline btn-sm"
            onClick={() => loadData(token)}
            disabled={isLoading}
          >
            {isLoading
              ? <><span className="spinner" style={{ width: 14, height: 14 }} /> Actualizando…</>
              : '🔄 Actualizar'}
          </button>
        </div>

        <PlayerTable players={players} token={token} />
        <FanTable    fans={fans}       />
      </div>
    </>
  );
}
