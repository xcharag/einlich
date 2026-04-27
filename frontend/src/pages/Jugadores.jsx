import React, { useState, useEffect } from 'react';
import Select from 'react-select';
import api from '../api';

const PLAYERS = [
  'Adrian Saucedo', 'Bruno Barbonari', 'Carlos Raña',   'Dahir Barja',
  'Diego Saavedra',  'Diego Vaca',      'Eduardo Torrico','Enoc Moro',
  'Enrique Cruz',    'Jhonny Alvarado', 'Jose David Moreno', 'Landy',
  'Lucas Lino',      'Mario Moreno',    'Mateo Eguez',    'Mateo Ruiz',
  'Mauricio Ardaya', 'Nicolas Angulo',  'Nicolas Duran',  'Oscar Aguilar',
  'Pablo Zurita',    'Paul Aguilera',   'Saiid',          'Sebastian Manzano',
].map((p) => ({ value: p, label: p }));

const SIZES = ['XS', 'S', 'M', 'L', 'XL', 'XXL', 'XXXL'];

const selectStyles = {
  control: (base, state) => ({
    ...base,
    minHeight: '48px',
    borderColor: state.isFocused ? '#C9A84C' : '#D4CEBD',
    borderWidth: '2px',
    borderRadius: '8px',
    boxShadow: state.isFocused ? '0 0 0 3px rgba(201,168,76,0.15)' : 'none',
    backgroundColor: '#fff',
    '&:hover': { borderColor: '#C9A84C' },
  }),
  option: (base, state) => ({
    ...base,
    backgroundColor: state.isSelected ? '#C9A84C' : state.isFocused ? '#FFF9EC' : '#fff',
    color: '#1A1A1A',
    fontWeight: state.isSelected ? '700' : '400',
    cursor: 'pointer',
    ':active': { backgroundColor: '#E8C96C' },
  }),
  singleValue:        (base) => ({ ...base, color: '#1A1A1A' }),
  placeholder:        (base) => ({ ...base, color: '#888' }),
  menu:               (base) => ({ ...base, borderRadius: '8px', boxShadow: '0 4px 16px rgba(0,0,0,0.12)' }),
  menuPortal:         (base) => ({ ...base, zIndex: 9999 }),
  indicatorSeparator: ()     => ({ display: 'none' }),
  dropdownIndicator:  (base) => ({ ...base, color: '#888' }),
};

export default function Jugadores() {
  const [playerName,    setPlayerName]    = useState(null);
  const [modelo,        setModelo]        = useState('');
  const [nombrePolera,  setNombrePolera]  = useState('');
  const [talla,         setTalla]         = useState('');
  const [existingId,    setExistingId]    = useState(null);
  const [isChecking,    setIsChecking]    = useState(false);
  const [isSubmitting,  setIsSubmitting]  = useState(false);
  const [error,         setError]         = useState('');
  const [successMsg,    setSuccessMsg]    = useState('');

  // When player + model change → check if submission already exists
  useEffect(() => {
    if (!playerName || !modelo) return;

    let cancelled = false;

    (async () => {
      setIsChecking(true);
      setError('');
      setExistingId(null);
      setNombrePolera('');
      setTalla('');

      try {
        const res = await api.get('/api/players/check', {
          params: { nombreJugador: playerName.value, modelo },
        });
        if (!cancelled && res.data) {
          setExistingId(res.data._id);
          setNombrePolera(res.data.nombrePolera);
          setTalla(res.data.talla);
        }
      } catch {
        // ignore — treat as new entry
      } finally {
        if (!cancelled) setIsChecking(false);
      }
    })();

    return () => { cancelled = true; };
  }, [playerName, modelo]);

  const handlePlayerChange = (v) => {
    setPlayerName(v);
    setSuccessMsg('');
    setError('');
    if (!v) {
      setModelo('');
      setNombrePolera('');
      setTalla('');
      setExistingId(null);
    }
  };

  const handleModeloChange = (m) => {
    setModelo(m);
    setSuccessMsg('');
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');

    const wasUpdate = !!existingId;
    setIsSubmitting(true);

    const payload = {
      nombreJugador: playerName.value,
      nombrePolera:  nombrePolera.trim(),
      talla,
      modelo,
    };

    try {
      if (existingId) {
        await api.put(`/api/players/${existingId}`, payload);
      } else {
        await api.post('/api/players', payload);
      }
      setSuccessMsg(
        wasUpdate
          ? '✅ ¡Pedido actualizado exitosamente!'
          : '✅ ¡Pedido enviado exitosamente!'
      );
      // Reset form
      setPlayerName(null);
      setModelo('');
      setNombrePolera('');
      setTalla('');
      setExistingId(null);
    } catch (err) {
      setError(err.response?.data?.error || 'Error al guardar el pedido');
    } finally {
      setIsSubmitting(false);
    }
  };

  const numVal       = parseInt(numero, 10);
  const isFormValid  =
    nombrePolera.trim() &&
    talla;

  const showShirtForm = playerName && modelo && !isChecking;

  return (
    <>
      <div className="page-header">
        <h1>Pedido de Jugadores</h1>
        <p>Completa tu información para el pedido de polera</p>
      </div>

      <div className="page">
        <div className="info-banner">
          <span aria-hidden="true">🎽</span>
          <span>Incluye Polera y Short</span>
        </div>

        {successMsg && <div className="alert alert-success">{successMsg}</div>}

        <form onSubmit={handleSubmit} noValidate>
          {/* ── Player selector ─── */}
          <div className="card">
            <p className="section-title">Selecciona tu nombre</p>
            <Select
              options={PLAYERS}
              value={playerName}
              onChange={handlePlayerChange}
              placeholder="Buscar jugador..."
              isClearable
              styles={selectStyles}
              noOptionsMessage={() => 'No encontrado'}
              menuPortalTarget={document.body}
              menuPosition="fixed"
            />
          </div>

          {/* ── Model selector ─── */}
          {playerName && (
            <div className="card">
              <p className="section-title">Tipo de Polera</p>
              <div className="model-selector">
                <button
                  type="button"
                  className={`model-card${modelo === 'jugador' ? ' selected' : ''}`}
                  onClick={() => handleModeloChange('jugador')}
                >
                  <span className="model-card-icon" aria-hidden="true">⚽</span>
                  <span className="model-card-label">Modelo Jugador</span>
                </button>
                <button
                  type="button"
                  className={`model-card${modelo === 'portero' ? ' selected' : ''}`}
                  onClick={() => handleModeloChange('portero')}
                >
                  <span className="model-card-icon" aria-hidden="true">🧤</span>
                  <span className="model-card-label">Modelo Portero</span>
                </button>
              </div>
            </div>
          )}

          {/* ── Checking spinner ─── */}
          {playerName && modelo && isChecking && (
            <div className="card">
              <div className="checking-box">
                <span className="spinner" style={{ color: 'var(--gold)' }} />
                <span>Verificando pedido existente…</span>
              </div>
            </div>
          )}

          {/* ── Shirt details ─── */}
          {showShirtForm && (
            <div className="card">
              {existingId && (
                <div className="update-banner">
                  ✏️ Ya tienes un pedido para este modelo. Puedes actualizarlo aquí.
                </div>
              )}

              <p className="section-title">Datos de la Polera</p>

              <div className="form-group">
                <label htmlFor="jug-nombrePolera">Nombre en la Polera</label>
                <input
                  id="jug-nombrePolera"
                  type="text"
                  value={nombrePolera}
                  onChange={(e) => { setNombrePolera(e.target.value); setError(''); }}
                  placeholder="Ej: AGUILAR"
                  maxLength={20}
                  autoCapitalize="characters"
                  autoComplete="off"
                />
              </div>

              <div className="form-group">
                <label htmlFor="jug-talla">Talla</label>
                <select
                  id="jug-talla"
                  value={talla}
                  onChange={(e) => { setTalla(e.target.value); setError(''); }}
                >
                  <option value="">Selecciona una talla</option>
                  {SIZES.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>

              {error && <div className="alert alert-error">{error}</div>}

              <button
                type="submit"
                className={`btn ${existingId ? 'btn-update' : 'btn-primary'}`}
                disabled={!isFormValid || isSubmitting}
              >
                {isSubmitting && <span className="spinner" />}
                {isSubmitting
                  ? 'Guardando…'
                  : existingId
                  ? '✏️ Actualizar Pedido'
                  : '✅ Enviar Pedido'}
              </button>
            </div>
          )}
        </form>
      </div>
    </>
  );
}
