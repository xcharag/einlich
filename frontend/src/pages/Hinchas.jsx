import React, { useState } from 'react';
import api from '../api';

const SIZES = ['XS', 'S', 'M', 'L', 'XL', 'XXL', 'XXXL'];

const EMPTY_FORM = {
  nombre:       '',
  telefono:     '',
  genero:       '',
  nombrePolera: '',
  talla:        '',
  numero:       '',
  modelo:       '',
};

export default function Hinchas() {
  const [form,         setForm]         = useState(EMPTY_FORM);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error,        setError]        = useState('');
  const [successMsg,   setSuccessMsg]   = useState('');

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    setError('');
    setSuccessMsg('');
  };

  const handleModelo = (m) => {
    setForm((prev) => ({ ...prev, modelo: m }));
    setError('');
    setSuccessMsg('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');
    setIsSubmitting(true);

    try {
      await api.post('/api/fans', {
        nombre:       form.nombre.trim(),
        telefono:     form.telefono.trim(),
        genero:       form.genero || null,
        nombrePolera: form.nombrePolera.trim(),
        talla:        form.talla,
        numeroPolera: parseInt(form.numero, 10),
        modelo:       form.modelo,
      });
      setSuccessMsg('✅ ¡Pedido enviado exitosamente! Nos pondremos en contacto contigo.');
      setForm(EMPTY_FORM);
    } catch (err) {
      setError(err.response?.data?.error || 'Error al enviar el pedido');
    } finally {
      setIsSubmitting(false);
    }
  };

  const numVal = parseInt(form.numero, 10);
  const isFormValid =
    form.nombre.trim() &&
    form.telefono.trim() &&
    form.genero &&
    form.nombrePolera.trim() &&
    form.talla &&
    form.numero &&
    !isNaN(numVal) &&
    numVal >= 1 &&
    numVal <= 999 &&
    form.modelo;

  return (
    <>
      <div className="page-header">
        <h1>Pedido de Hinchas</h1>
        <p>Completa tus datos para pedir tu polera</p>
      </div>

      <div className="page">
        <div className="info-banner">
          <span aria-hidden="true">🎽</span>
          <span>Incluye solo Polera</span>
        </div>

        {successMsg && <div className="alert alert-success">{successMsg}</div>}

        <form onSubmit={handleSubmit} noValidate>
          {/* ── Personal data ─── */}
          <div className="card">
            <p className="section-title">Tus Datos</p>

            <div className="form-group">
              <label htmlFor="hin-nombre">Nombre Completo</label>
              <input
                id="hin-nombre"
                name="nombre"
                type="text"
                value={form.nombre}
                onChange={handleChange}
                placeholder="Ej: Juan Pérez"
                autoComplete="name"
              />
            </div>

            <div className="form-group">
              <label htmlFor="hin-telefono">Teléfono / WhatsApp</label>
              <input
                id="hin-telefono"
                name="telefono"
                type="tel"
                value={form.telefono}
                onChange={handleChange}
                placeholder="Ej: +591 77777777"
                autoComplete="tel"
                inputMode="tel"
              />
            </div>

            <div className="form-group">
              <label>Género</label>
              <div className="model-selector">
                <button
                  type="button"
                  className={`model-card${form.genero === 'hombre' ? ' selected' : ''}`}
                  onClick={() => { setForm(p => ({ ...p, genero: 'hombre' })); setError(''); }}
                >
                  <span className="model-card-icon" aria-hidden="true">👨</span>
                  <span className="model-card-label">Hombre</span>
                </button>
                <button
                  type="button"
                  className={`model-card${form.genero === 'mujer' ? ' selected' : ''}`}
                  onClick={() => { setForm(p => ({ ...p, genero: 'mujer' })); setError(''); }}
                >
                  <span className="model-card-icon" aria-hidden="true">👩</span>
                  <span className="model-card-label">Mujer</span>
                </button>
              </div>
            </div>
          </div>

          {/* ── Model selector ─── */}
          <div className="card">
            <p className="section-title">Tipo de Polera</p>
            <div className="model-selector">
              <button
                type="button"
                className={`model-card${form.modelo === 'jugador' ? ' selected' : ''}`}
                onClick={() => handleModelo('jugador')}
              >
                <span className="model-card-icon" aria-hidden="true">⚽</span>
                <span className="model-card-label">Modelo Jugador</span>
              </button>
              <button
                type="button"
                className={`model-card${form.modelo === 'portero' ? ' selected' : ''}`}
                onClick={() => handleModelo('portero')}
              >
                <span className="model-card-icon" aria-hidden="true">🧤</span>
                <span className="model-card-label">Modelo Portero</span>
              </button>
            </div>
          </div>

          {/* ── Shirt details ─── */}
          <div className="card">
            <p className="section-title">Datos de la Polera</p>

            <div className="form-group">
              <label htmlFor="hin-nombrePolera">Nombre en la Polera</label>
              <input
                id="hin-nombrePolera"
                name="nombrePolera"
                type="text"
                value={form.nombrePolera}
                onChange={handleChange}
                placeholder="Ej: PÉREZ"
                maxLength={20}
                autoCapitalize="characters"
                autoComplete="off"
              />
            </div>

            <div className="form-group">
              <label htmlFor="hin-talla">Talla</label>
              <select
                id="hin-talla"
                name="talla"
                value={form.talla}
                onChange={handleChange}
              >
                <option value="">Selecciona una talla</option>
                {SIZES.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="hin-numero">Número en la Polera</label>
              <input
                id="hin-numero"
                name="numero"
                type="number"
                value={form.numero}
                onChange={handleChange}
                placeholder="Ej: 7"
                min={1}
                max={999}
                inputMode="numeric"
              />
            </div>
          </div>

          {error && <div className="alert alert-error">{error}</div>}

          <button
            type="submit"
            className="btn btn-primary"
            disabled={!isFormValid || isSubmitting}
          >
            {isSubmitting && <span className="spinner" />}
            {isSubmitting ? 'Enviando…' : '✅ Enviar Pedido'}
          </button>
        </form>
      </div>
    </>
  );
}
