import React, { useState } from 'react';
import { Bot, Send, Sparkles, User, MapPin, CheckCircle2, AlertTriangle, ShieldCheck } from 'lucide-react';
import { Reclamo } from '../types';

interface AsistenteViewProps {
  reclamos: Reclamo[];
  onOpenNuevoReclamo: () => void;
}

interface MensajeChat {
  id: string;
  remitente: 'asistente' | 'usuario';
  texto: string;
  tiempo: string;
  sugerencias?: string[];
}

export const AsistenteView: React.FC<AsistenteViewProps> = ({ reclamos, onOpenNuevoReclamo }) => {
  const [mensajes, setMensajes] = useState<MensajeChat[]>([
    {
      id: 'm-1',
      remitente: 'asistente',
      texto: '¡Hola! Soy el Asistente Inteligente de Gestión Territorial de Antula. Puedo ayudarte a clasificar reclamos vecinales, consultar información catastral de las 132 manzanas, analizar el estado del pavimento en las 70 calles o generar reportes automáticos.',
      tiempo: '10:00',
      sugerencias: [
        '¿Cuál es el estado de la red vial en Antula?',
        '¿Cuántos reclamos urgentes hay activos?',
        '¿Dónde se ubican las calles de ripio con cuneta?',
        '¿Cómo clasificar un reclamo de alumbrado?'
      ]
    }
  ]);
  const [inputTexto, setInputTexto] = useState('');
  const [pensando, setPensando] = useState(false);

  const procesarRespuesta = (pregunta: string) => {
    const p = pregunta.toLowerCase();
    let respuesta = '';

    if (p.includes('red vial') || p.includes('pavimento') || p.includes('asfalto') || p.includes('calles')) {
      respuesta = `De acuerdo al dataset catastral de **calles.gpkg**, el barrio cuenta con **70 tramos viales**:\n\n• **29 tramos asfaltados (41.4%)**: Vías principales de circulación rápida.\n• **41 tramos de ripio con cuneta (58.6%)**: Vías que requieren perfilado y mantenimiento con motoniveladora tras eventos de lluvia.\n\nPuedes consultar cada segmento individualmente en el Visor SIG Territorial.`;
    } else if (p.includes('urgente') || p.includes('reclamos')) {
      const urgentes = reclamos.filter(r => r.prioridad === 'urgente' && r.estado !== 'finalizado');
      respuesta = `Actualmente hay **${urgentes.length} reclamo(s) clasificado(s) como URGENTE**:\n\n` +
        urgentes.map(u => `• **${u.codigo}**: ${u.titulo} (${u.ubicacionNombre})`).join('\n') +
        `\n\nSe recomienda priorizar el despacho inmediato de cuadrilla de obras sanitarias/vial.`;
    } else if (p.includes('manzana') || p.includes('m-') || p.includes('catastro')) {
      respuesta = `El catastro de **manzanas.gpkg** cuenta con **132 polígonos** debidamente digitalizados en coordenadas EPSG:4326 (WGS84). Los identificadores van de **M-001** a **M-138**, e incluyen lotes especiales como **Baldio 01** a **04**.\n\nCualquier reclamo o habilitación puede asociarse directamente al código catastral correspondiente.`;
    } else {
      respuesta = `He analizado tu consulta sobre la gestión municipal de Antula. El sistema registra ${reclamos.length} reclamos activos y 4 cuadrillas operativas. Puedes iniciar una nueva solicitud ciudadana con el botón "+ Nuevo Reclamo" o revisar el trazado territorial en el Visor SIG.`;
    }

    return respuesta;
  };

  const enviarMensaje = (texto: string) => {
    if (!texto.trim()) return;

    const nuevoMsgUsuario: MensajeChat = {
      id: `u-${Date.now()}`,
      remitente: 'usuario',
      texto,
      tiempo: new Date().toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })
    };

    setMensajes(prev => [...prev, nuevoMsgUsuario]);
    setInputTexto('');
    setPensando(true);

    setTimeout(() => {
      const respuestaTexto = procesarRespuesta(texto);
      const nuevoMsgIA: MensajeChat = {
        id: `ia-${Date.now()}`,
        remitente: 'asistente',
        texto: respuestaTexto,
        tiempo: new Date().toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })
      };
      setMensajes(prev => [...prev, nuevoMsgIA]);
      setPensando(false);
    }, 600);
  };

  return (
    <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs flex flex-col h-[78vh] overflow-hidden">
      {/* Assistant Header */}
      <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-slate-900 to-indigo-950 text-white">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-indigo-500/20 border border-indigo-400/40 flex items-center justify-center text-indigo-300 shadow-md">
            <Bot className="w-5 h-5 text-indigo-400" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-black font-display tracking-wide">Asistente IA Municipal</h2>
              <span className="text-[10px] bg-emerald-500/20 text-emerald-300 font-bold px-2 py-0.5 rounded-full border border-emerald-500/30 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block animate-pulse" />
                OpenRouter / InsForge AI
              </span>
            </div>
            <p className="text-[11px] text-slate-300 font-medium">Clasificación, resolución y análisis territorial</p>
          </div>
        </div>

        <button
          onClick={onOpenNuevoReclamo}
          className="px-3 py-1.5 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs font-bold transition-colors border border-white/20"
        >
          Crear Reclamo Asistido
        </button>
      </div>

      {/* Messages Area */}
      <div className="flex-1 p-4 overflow-y-auto space-y-4 bg-slate-50/50">
        {mensajes.map((m) => (
          <div
            key={m.id}
            className={`flex items-start gap-3 max-w-2xl ${
              m.remitente === 'usuario' ? 'ml-auto flex-row-reverse' : ''
            }`}
          >
            <div
              className={`w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 text-white text-xs font-bold shadow-xs ${
                m.remitente === 'usuario' ? 'bg-brand-600' : 'bg-slate-900'
              }`}
            >
              {m.remitente === 'usuario' ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4 text-indigo-400" />}
            </div>

            <div
              className={`p-4 rounded-2xl text-xs leading-relaxed ${
                m.remitente === 'usuario'
                  ? 'bg-brand-600 text-white rounded-tr-none shadow-md'
                  : 'bg-white text-slate-800 border border-slate-200/80 rounded-tl-none shadow-xs'
              }`}
            >
              <div className="whitespace-pre-line">{m.texto}</div>

              {m.sugerencias && (
                <div className="mt-3 pt-3 border-t border-slate-100 flex flex-wrap gap-1.5">
                  {m.sugerencias.map((s, idx) => (
                    <button
                      key={idx}
                      onClick={() => enviarMensaje(s)}
                      className="px-2.5 py-1 bg-slate-100 hover:bg-brand-50 hover:text-brand-700 text-slate-600 rounded-lg text-[11px] font-semibold transition-colors"
                    >
                      {s}
                    </button>
                  ))}
                </div>
              )}

              <span
                className={`block text-[10px] mt-1 text-right ${
                  m.remitente === 'usuario' ? 'text-brand-200' : 'text-slate-400'
                }`}
              >
                {m.tiempo}
              </span>
            </div>
          </div>
        ))}

        {pensando && (
          <div className="flex items-center gap-2 text-xs text-slate-400 italic bg-white p-3 rounded-2xl w-fit border border-slate-100">
            <Sparkles className="w-4 h-4 text-indigo-500 animate-spin" />
            <span>Consultando capas espaciales de Antula y clasificando información...</span>
          </div>
        )}
      </div>

      {/* Input Form */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          enviarMensaje(inputTexto);
        }}
        className="p-3 border-t border-slate-100 bg-white flex items-center gap-2"
      >
        <input
          type="text"
          placeholder="Escribe tu consulta o pide clasificar un reclamo vecinal..."
          value={inputTexto}
          onChange={(e) => setInputTexto(e.target.value)}
          className="flex-1 bg-slate-50 border border-slate-200/80 rounded-xl px-4 py-2.5 text-xs text-slate-800 outline-none focus:ring-2 focus:ring-brand-500 font-medium"
        />
        <button
          type="submit"
          className="px-4 py-2.5 bg-brand-600 hover:bg-brand-700 text-white rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5 shadow-sm"
        >
          <Send className="w-3.5 h-3.5" />
          <span>Enviar</span>
        </button>
      </form>
    </div>
  );
};
