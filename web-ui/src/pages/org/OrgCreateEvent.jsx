import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import OrgLayout from '../../components/OrgLayout';
import { createEvent } from '../../services/api';
import { formatPrice } from '../../utils/categories';

const CATEGORIES = ['Conciertos', 'Deportes', 'Tecnología', 'Teatro', 'Arte', 'Cine', 'Gastronomía', 'Formación'];

const STEPS = ['Información básica', 'Fecha y lugar', 'Entrada y publicación'];

function OrgCreateEvent() {
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);

  const [form, setForm] = useState({
    title: '',
    description: '',
    category: CATEGORIES[0],
    imageUrl: '',
    date: '',
    venue: '',
    totalCapacity: 100,
    price: 10000,
  });

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const canNext = () => {
    if (step === 0) return form.title.trim() && form.description.trim();
    if (step === 1) return form.date && form.venue.trim() && Number(form.totalCapacity) > 0;
    return true;
  };

  const publish = async () => {
    setError('');
    setSaving(true);
    try {
      const payload = {
        title: form.title.trim(),
        description: form.description.trim(),
        category: form.category,
        imageUrl: form.imageUrl.trim() || null,
        date: form.date.length === 16 ? `${form.date}:00` : form.date, // datetime-local → ISO
        venue: form.venue.trim(),
        price: Number(form.price),
        totalCapacity: Number(form.totalCapacity),
        availableStock: Number(form.totalCapacity),
        active: true,
      };
      await createEvent(payload);
      setDone(true);
    } catch (e) {
      setError(e.message || 'Error al publicar el evento');
    } finally {
      setSaving(false);
    }
  };

  if (done) {
    return (
      <OrgLayout>
        <div className="success-page" style={{ minHeight: '60vh' }}>
          <div className="success-icon-wrap">✅</div>
          <h1>¡Evento publicado!</h1>
          <p>Tu evento <strong>{form.title}</strong> ya está visible en el catálogo.</p>
          <div className="success-actions">
            <button className="btn btn-secondary" onClick={() => { setDone(false); setStep(0); setForm({ ...form, title: '', description: '' }); }}>
              Crear otro
            </button>
            <button className="btn btn-accent" onClick={() => navigate('/org')}>Ir al dashboard →</button>
          </div>
        </div>
      </OrgLayout>
    );
  }

  return (
    <OrgLayout>
      <div className="page-header">
        <div>
          <h1>Nuevo evento</h1>
          <p>Completá los pasos para publicar tu evento.</p>
        </div>
        <button className="btn btn-secondary" onClick={() => navigate('/org')}>Cancelar</button>
      </div>

      <div className="wizard-header">
        {STEPS.map((label, i) => (
          <React.Fragment key={label}>
            <div className={`wizard-step ${i < step ? 'done' : i === step ? 'active' : ''}`}>
              <span className="step-num">{i < step ? '✓' : i + 1}</span> {label}
            </div>
            {i < STEPS.length - 1 && <div className={`wizard-connector ${i < step ? 'done' : ''}`} />}
          </React.Fragment>
        ))}
      </div>

      {error && <div className="alert alert-error" style={{ maxWidth: 700 }}>{error}</div>}

      <div className="form-section">
        {step === 0 && (
          <>
            <h2>Información básica</h2>
            <p className="form-sub">Contale a la gente de qué se trata tu evento.</p>
            <div className="field"><label>Título</label>
              <input className="input" value={form.title} onChange={(e) => set('title', e.target.value)} placeholder="Ej: Conferencia Frontend 2026" />
            </div>
            <div className="field"><label>Descripción</label>
              <textarea className="textarea" rows={4} value={form.description} onChange={(e) => set('description', e.target.value)} placeholder="Describí el evento…" />
            </div>
            <div className="field"><label>Categoría</label>
              <select className="select" value={form.category} onChange={(e) => set('category', e.target.value)}>
                {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div className="field"><label>Imagen de portada (URL, opcional)</label>
              <input className="input" value={form.imageUrl} onChange={(e) => set('imageUrl', e.target.value)} placeholder="https://…" />
            </div>
          </>
        )}

        {step === 1 && (
          <>
            <h2>Fecha y lugar</h2>
            <p className="form-sub">Definí cuándo y dónde se celebra.</p>
            <div className="field"><label>Fecha y hora de inicio</label>
              <input className="input" type="datetime-local" value={form.date} onChange={(e) => set('date', e.target.value)} />
            </div>
            <div className="field"><label>Recinto / lugar</label>
              <input className="input" value={form.venue} onChange={(e) => set('venue', e.target.value)} placeholder="Ej: Centro Cultural Konex, CABA" />
            </div>
            <div className="field"><label>Aforo total</label>
              <input className="input" type="number" min={1} style={{ maxWidth: 200 }} value={form.totalCapacity} onChange={(e) => set('totalCapacity', e.target.value)} />
            </div>
          </>
        )}

        {step === 2 && (
          <>
            <h2>Entrada y publicación</h2>
            <p className="form-sub">Definí el precio y revisá antes de publicar.</p>
            <div className="field"><label>Precio de la entrada ($)</label>
              <input className="input" type="number" min={0} style={{ maxWidth: 200 }} value={form.price} onChange={(e) => set('price', e.target.value)} />
            </div>
            <div style={{ border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: 20, background: 'var(--bg-soft)' }}>
              <h4 style={{ fontSize: 14, fontWeight: 700, marginBottom: 12 }}>Resumen</h4>
              <div className="summary-row"><span>Título</span><span>{form.title || '—'}</span></div>
              <div className="summary-row"><span>Categoría</span><span>{form.category}</span></div>
              <div className="summary-row"><span>Fecha</span><span>{form.date ? form.date.replace('T', ' ') : '—'}</span></div>
              <div className="summary-row"><span>Lugar</span><span>{form.venue || '—'}</span></div>
              <div className="summary-row"><span>Aforo</span><span>{form.totalCapacity}</span></div>
              <div className="summary-row"><span>Precio</span><span>{formatPrice(Number(form.price))}</span></div>
            </div>
          </>
        )}
      </div>

      <div className="wizard-footer">
        <button className="btn btn-secondary" disabled={step === 0} onClick={() => setStep((s) => Math.max(0, s - 1))}>
          ← Atrás
        </button>
        {step < STEPS.length - 1 ? (
          <button className="btn btn-accent" disabled={!canNext()} onClick={() => setStep((s) => s + 1)}>
            Siguiente →
          </button>
        ) : (
          <button className="btn btn-accent btn-lg" disabled={saving} onClick={publish}>
            {saving ? 'Publicando…' : 'Publicar evento'}
          </button>
        )}
      </div>
    </OrgLayout>
  );
}

export default OrgCreateEvent;
