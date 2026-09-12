import { Fragment, useCallback, useEffect, useRef, useState } from "react";
import { api } from "../lib/api";

const explain = (error) => error.response?.status === 404
  ? "El bot todavía no tiene el editor de cumpleaños. Despliega la versión nueva de Risitas y vuelve a cargar."
  : error.response?.data?.error || "No se pudo contactar con Risitas. Inténtalo de nuevo.";

export default function RisitasBirthdays() {
  const [document, setDocument] = useState(null);
  const [draft, setDraft] = useState(null);
  const [preview, setPreview] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [previewBusy, setPreviewBusy] = useState(false);
  const [previewError, setPreviewError] = useState("");
  const [notice, setNotice] = useState(null);
  const previewSequence = useRef(0);
  const dirty = Boolean(draft && JSON.stringify(draft) !== JSON.stringify(document?.settings));

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.get("/bots/risitas/birthday");
      setDocument(data); setDraft(data.settings); setPreview(data.preview); setNotice(null);
    } catch (error) { setNotice({ type: "error", text: explain(error) }); }
    finally { setLoading(false); }
  }, []);
  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    if (!dirty) return;
    const warn = (event) => { event.preventDefault(); event.returnValue = ""; };
    const warnNavigation = (event) => {
      if (!window.confirm("Tienes cambios de cumpleaños sin guardar. ¿Salir y descartarlos?")) event.preventDefault();
    };
    window.addEventListener("beforeunload", warn);
    window.addEventListener("darkops:before-navigate", warnNavigation);
    return () => {
      window.removeEventListener("beforeunload", warn);
      window.removeEventListener("darkops:before-navigate", warnNavigation);
    };
  }, [dirty]);

  useEffect(() => {
    if (!draft) return;
    const sequence = ++previewSequence.current;
    let active = true;
    const timer = window.setTimeout(async () => {
      setPreviewBusy(true);
      try {
        const { data } = await api.post("/bots/risitas/birthday/preview", { settings: draft });
        if (active && sequence === previewSequence.current) { setPreview(data.preview); setPreviewError(""); }
      } catch (error) {
        if (active && sequence === previewSequence.current) setPreviewError(explain(error));
      } finally { if (active && sequence === previewSequence.current) setPreviewBusy(false); }
    }, 400);
    return () => { active = false; window.clearTimeout(timer); };
  }, [draft]);

  function change(key, value) { setNotice(null); setDraft((current) => ({ ...current, [key]: value })); }
  function changeField(index, key, value) {
    change("fields", draft.fields.map((field, i) => i === index ? { ...field, [key]: value } : field));
  }
  async function save(event) {
    event.preventDefault(); setSaving(true); setNotice(null);
    try {
      const { data } = await api.put("/bots/risitas/birthday", { settings: draft, revision: document.revision });
      setDocument(data); setDraft(data.settings); setPreview(data.preview);
      setNotice({ type: "success", text: "Configuración guardada en Risitas. Se usará en los próximos cumpleaños." });
    } catch (error) { setNotice({ type: "error", text: explain(error) }); }
    finally { setSaving(false); }
  }

  if (loading && !draft) return <div className="card bot-loading" role="status"><span className="spinner" />Cargando configuración de cumpleaños…</div>;
  if (!draft) return <div className="card bot-unavailable" role="alert"><div><h2>No se pudo cargar cumpleaños</h2><p>{notice?.text}</p></div><button type="button" onClick={load} className="refresh-btn">Volver a cargar</button></div>;
  const channel = document.channels.find((item) => item.id === draft.channel_id);
  const roles = document.roles.filter((item) => item.guild_id === channel?.guild_id);
  const updateText = (key) => (event) => change(key, event.target.value);

  return <form className="birthday-editor" onSubmit={save}>
    <header className="birthday-editor-heading"><div><h2>Cumpleaños en Discord</h2><p>Personaliza la felicitación y decide dónde y cuándo se entrega.</p></div><span className="birthday-save-state" role="status">{dirty ? "Cambios sin guardar" : "Configuración guardada"}</span></header>
    {notice && <div className={`bot-notice ${notice.type}`} role={notice.type === "error" ? "alert" : "status"}><span>{notice.text}</span></div>}
    <div className="birthday-editor-columns">
      <fieldset className="birthday-editor-fields" disabled={saving || loading}>
        <section className="birthday-form-section" aria-labelledby="birthday-delivery"><h3 id="birthday-delivery">Entrega del mensaje</h3>
          <label className="birthday-check"><input type="checkbox" checked={draft.enabled} onChange={(e) => change("enabled", e.target.checked)} />Enviar felicitaciones automáticamente</label>
          <div className="birthday-form-grid">
            <Field label="Canal de Discord"><select value={draft.channel_id} onChange={(e) => { change("channel_id", e.target.value); change("role_id", ""); }} required={draft.enabled}>
              <option value="">Selecciona un canal</option>
              {draft.channel_id && !channel && <option value={draft.channel_id}>Canal actual no disponible · {draft.channel_id}</option>}
              {document.channels.map((item) => <option key={item.id} value={item.id}>{item.guild} / #{item.name}</option>)}
            </select></Field>
            <Field label="Rol de cumpleaños"><select value={draft.role_id} onChange={updateText("role_id")}><option value="">Sin rol</option>
              {draft.role_id && !roles.some((item) => item.id === draft.role_id) && <option value={draft.role_id}>Rol actual · {draft.role_id}</option>}
              {roles.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
            </select></Field>
            <Field label="Hora del envío"><select value={draft.hour} onChange={(e) => change("hour", Number(e.target.value))}>{Array.from({ length: 24 }, (_, hour) => <option key={hour} value={hour}>{String(hour).padStart(2, "0")}:00 – {String(hour).padStart(2, "0")}:59</option>)}</select></Field>
            <Field label="Zona horaria"><input value={draft.timezone} onChange={updateText("timezone")} list="birthday-timezones" required /><datalist id="birthday-timezones">{["America/Bogota", "America/Mexico_City", "America/Lima", "America/Argentina/Buenos_Aires", "Europe/Madrid", "UTC"].map((zone) => <option key={zone} value={zone} />)}</datalist></Field>
          </div>
          <p className="birthday-help">El bot revisa una vez por hora. El rol se menciona; no se asigna al usuario. Solo aparecen canales donde el bot puede enviar embeds.</p>
          <div className="birthday-checks"><label className="birthday-check"><input type="checkbox" checked={draft.mention_user} onChange={(e) => change("mention_user", e.target.checked)} />Notificar al cumpleañero</label><label className="birthday-check"><input type="checkbox" checked={draft.mention_role} onChange={(e) => change("mention_role", e.target.checked)} />Notificar al rol mencionado</label></div>
        </section>
        <section className="birthday-form-section" aria-labelledby="birthday-message"><h3 id="birthday-message">Mensaje y embed</h3>
          <p className="birthday-help">Puedes usar <code>{"{user_mention}"}</code>, <code>{"{role_id}"}</code> y <code>{"{avatar_url}"}</code>. Conserva el formato Markdown de Discord en tus textos.</p>
          <Field label="Mensaje fuera del embed" count={`${draft.content.length}/2000`}><textarea value={draft.content} onChange={updateText("content")} maxLength={2000} rows={3} /></Field>
          <Field label="Título" count={`${draft.title.length}/256`}><input value={draft.title} onChange={updateText("title")} maxLength={256} /></Field>
          <Field label="Descripción" count={`${draft.description.length}/4096`}><textarea value={draft.description} onChange={updateText("description")} maxLength={4096} rows={5} /></Field>
          <div className="birthday-form-grid"><Field label="Color del embed"><input type="color" value={`#${draft.color.toString(16).padStart(6, "0")}`} onChange={(e) => change("color", parseInt(e.target.value.slice(1), 16))} /></Field><Field label="Autor"><input value={draft.author} onChange={updateText("author")} maxLength={256} /></Field></div>
          <Field label="Imagen principal · URL HTTPS"><input value={draft.image_url} onChange={updateText("image_url")} maxLength={2048} /></Field>
          <Field label="Miniatura · URL HTTPS o {avatar_url}"><input value={draft.thumbnail_url} onChange={updateText("thumbnail_url")} maxLength={2048} /></Field>
          <Field label="Pie del embed"><input value={draft.footer} onChange={updateText("footer")} maxLength={2048} /></Field>
        </section>
        <section className="birthday-form-section" aria-labelledby="birthday-extra"><h3 id="birthday-extra">Campos adicionales</h3>
          {draft.fields.map((field, index) => <div className="birthday-custom-field" key={index}>
            <Field label={`Campo ${index + 1} · Nombre`}><input value={field.name} onChange={(e) => changeField(index, "name", e.target.value)} maxLength={256} required /></Field>
            <Field label="Contenido"><textarea value={field.value} onChange={(e) => changeField(index, "value", e.target.value)} maxLength={1024} required rows={2} /></Field>
            <div className="birthday-field-actions"><label className="birthday-check"><input type="checkbox" checked={field.inline} onChange={(e) => changeField(index, "inline", e.target.checked)} />En la misma fila</label><button type="button" className="refresh-btn" onClick={() => change("fields", draft.fields.filter((_, i) => i !== index))}>Eliminar campo {index + 1}</button></div>
          </div>)}
          <button type="button" className="refresh-btn" disabled={draft.fields.length >= 25} onClick={() => change("fields", [...draft.fields, { name: "", value: "", inline: false }])}>Añadir campo</button>
        </section>
      </fieldset>
      <aside className="birthday-live-preview"><div className="birthday-preview-heading"><h3>Vista previa</h3><span role="status">{previewBusy ? "Actualizando…" : previewError ? "Revisa los campos" : "Generada por Risitas"}</span></div>
        <p className="birthday-help">Ejemplo con @Usuario. Guardar no envía ningún mensaje.</p>
        {previewError && <p className="birthday-preview-error" role="alert">{previewError} La vista conserva el último ejemplo válido.</p>}
        <div className="birthday-discord-message"><div className="birthday-discord-author">Risitas <span>APP</span><small>Hoy</small></div><EmbedPreview preview={preview} /></div>
        <p className="birthday-help">Discord puede distribuir el texto de forma distinta según la pantalla. El contenido guardado y sus variables se usan directamente en el envío.</p>
      </aside>
    </div>
    <footer className="birthday-editor-save"><span>{dirty ? "Los cambios se aplicarán después de guardar." : `Versión guardada: ${document.revision}`}</span><div><button type="button" className="refresh-btn" disabled={saving || loading} onClick={() => { if (!dirty || window.confirm("Se descartarán los cambios sin guardar. ¿Recargar?")) load(); }}>Recargar configuración</button><button type="submit" className="save-btn" disabled={!dirty || saving || loading}>{saving ? "Guardando…" : "Guardar configuración"}</button></div></footer>
  </form>;
}

function Field({ label, count, children }) { return <label className="birthday-field"><span>{label}{count && <small>{count}</small>}</span>{children}</label>; }

function RichText({ value }) {
  const text = String(value || "").replace(/<@&\d+>/g, "@Cumpleaños").replace(/<@!?\d+>/g, "@Usuario");
  return text.split(/(\*\*[^*]+\*\*|`[^`]+`|\*[^*]+\*|\[[^\]]+\]\(https:\/\/[^\s)]+\))/g).map((part, index) => {
    if (part.startsWith("**")) return <strong key={index}>{part.slice(2, -2)}</strong>;
    if (part.startsWith("`")) return <code key={index}>{part.slice(1, -1)}</code>;
    if (part.startsWith("*")) return <em key={index}>{part.slice(1, -1)}</em>;
    const link = part.match(/^\[([^\]]+)\]\((https:\/\/[^\s)]+)\)$/);
    if (link) return <a key={index} href={link[2]} target="_blank" rel="noreferrer">{link[1]}</a>;
    return <Fragment key={index}>{part}</Fragment>;
  });
}

function EmbedPreview({ preview }) {
  if (!preview) return null;
  const embed = preview.embed || {};
  return <><p className="birthday-discord-content"><RichText value={preview.content} /></p><div className="discord-embed-preview" style={{ "--embed-color": `#${Number(embed.color || 0).toString(16).padStart(6, "0")}` }}>
    {embed.thumbnail?.url && <img className="discord-embed-thumb" src={embed.thumbnail.url} alt="Miniatura" />}
    {embed.author?.name && <div className="birthday-embed-author"><RichText value={embed.author.name} /></div>}
    {embed.title && <strong><RichText value={embed.title} /></strong>}
    {embed.description && <p><RichText value={embed.description} /></p>}
    <div className="birthday-embed-fields">{embed.fields?.map((field, i) => <div key={i} className={field.inline ? "inline" : ""}><strong><RichText value={field.name} /></strong><p><RichText value={field.value} /></p></div>)}</div>
    {embed.image?.url && <img className="discord-embed-image" src={embed.image.url} alt="Imagen de cumpleaños" />}
    {embed.footer?.text && <div className="birthday-embed-footer"><RichText value={embed.footer.text} /></div>}
  </div></>;
}
