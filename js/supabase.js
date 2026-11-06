/**
 * ============================================================================
 * KONYS PIZZA — CAPA DE DATOS HÍBRIDA (SUPABASE + LOCALSTORAGE FALLBACK)
 * Permite funcionamiento continuo con Supabase en la nube o en Modo Demo local.
 * ============================================================================
 */

(function (window) {
  'use strict';

  // Configuración de credenciales de Supabase
  // Puedes reemplazarlas aquí o configurarlas dinámicamente desde el panel Admin
  const CONFIG = {
    url: localStorage.getItem('konys_supabase_url') || '',
    anonKey: localStorage.getItem('konys_supabase_anon_key') || '',
    storageKeyPrefix: 'konys_db_'
  };

  let supabaseClient = null;

  // Inicializar cliente Supabase si las credenciales son válidas
  function initSupabase() {
    if (CONFIG.url && CONFIG.anonKey && window.supabase && typeof window.supabase.createClient === 'function') {
      try {
        supabaseClient = window.supabase.createClient(CONFIG.url, CONFIG.anonKey);
        console.log('✓ KonysDB: Conectado a Supabase en la nube');
      } catch (e) {
        console.warn('⚠️ KonysDB: Error al inicializar Supabase, usando almacenamiento local:', e);
        supabaseClient = null;
      }
    } else {
      supabaseClient = null;
    }
  }

  initSupabase();

  // ============================================================================
  // DATOS SEMILLA PARA EL ALMACENAMIENTO LOCAL (MODO DEMO / FALLBACK)
  // ============================================================================
  const SEED_DATA = {
    mesas: [
      { id: 'mesa-1', nombre: 'Mesa 1', zona: 'terraza', capacidad: 2, activa: true, creado_en: new Date().toISOString() },
      { id: 'mesa-2', nombre: 'Mesa 2', zona: 'terraza', capacidad: 4, activa: true, creado_en: new Date().toISOString() },
      { id: 'mesa-3', nombre: 'Mesa 3', zona: 'salon', capacidad: 6, activa: true, creado_en: new Date().toISOString() },
      { id: 'mesa-4', nombre: 'Mesa 4', zona: 'salon', capacidad: 4, activa: true, creado_en: new Date().toISOString() },
      { id: 'mesa-5', nombre: 'Mesa 5', zona: 'salon', capacidad: 8, activa: true, creado_en: new Date().toISOString() }
    ],
    horarios: [
      { id: 'horario-almuerzo', dia_semana: 'todos', jornada: 'almuerzo', hora_inicio: '12:30', hora_fin: '14:30', duracion_slot: 60, activo: true },
      { id: 'horario-noche', dia_semana: 'todos', jornada: 'noche', hora_inicio: '17:00', hora_fin: '23:00', duracion_slot: 60, activo: true }
    ],
    reservas: [
      {
        id: 'KP-20261017-01',
        mesa_id: 'mesa-3',
        cliente_nombre: 'Juan Pérez',
        cliente_contacto: '315 482 9104',
        num_personas: 4,
        fecha: new Date().toISOString().split('T')[0],
        hora_inicio: '13:00',
        hora_fin: '14:00',
        estado: 'confirmada',
        creado_en: new Date().toISOString()
      },
      {
        id: 'KP-20261017-02',
        mesa_id: 'mesa-1',
        cliente_nombre: 'María Gómez',
        cliente_contacto: '310 987 6543',
        num_personas: 2,
        fecha: new Date().toISOString().split('T')[0],
        hora_inicio: '19:00',
        hora_fin: '20:00',
        estado: 'confirmada',
        creado_en: new Date().toISOString()
      }
    ],
    platos: [
      { id: 'plato-1', nombre: 'Pizza Konys Especial', categoria: 'pizzas', descripcion: 'Queso mozzarella, pepperoni artesanal, tocineta ahumada, maíz tierno y pimentón asado.', precio: 38000, disponible: true },
      { id: 'plato-2', nombre: 'Pizza Santandereana', categoria: 'pizzas', descripcion: 'Carne oreada desmechada, chorizo artesanal, plátano maduro dulce y queso doble crema.', precio: 42000, disponible: true },
      { id: 'plato-3', nombre: 'Pizza Cuatro Quesos & Miel', categoria: 'pizzas', descripcion: 'Mozzarella, provolone, gorgonzola, parmesano reggiano y un toque sutil de miel de abejas.', precio: 40000, disponible: true },
      { id: 'plato-4', nombre: 'Pan de Ajo Gratinado', categoria: 'entradas', descripcion: 'Baguette rústica horneada a la leña con mantequilla de ajo, finas hierbas y queso parmesano.', precio: 16500, disponible: true },
      { id: 'plato-5', nombre: 'Burrata sobre Focaccia', categoria: 'entradas', descripcion: 'Queso burrata fresco con tomates cherry confitados, pesto de albahaca y focaccia caliente.', precio: 26000, disponible: true },
      { id: 'plato-6', nombre: 'Volcán de Arequipe Santandereano', categoria: 'postres', descripcion: 'Bizcocho tibio relleno de dulce de leche artesanal, acompañado de helado de vainilla.', precio: 15000, disponible: true },
      { id: 'plato-7', nombre: 'Cheesecake de Frutos Rojos', categoria: 'postres', descripcion: 'Base crocante de galleta con crema de queso suave y reducción artesanal de moras y agraz.', precio: 14000, disponible: true },
      { id: 'plato-8', nombre: 'Limonada Cerezada Natural', categoria: 'bebidas', descripcion: 'Limón Tahití recién exprimido, cerezas en almíbar y hielo frappé de 16 oz.', precio: 11000, disponible: true },
      { id: 'plato-9', nombre: 'Soda Frutos Amarillos', categoria: 'bebidas', descripcion: 'Soda saborizada con maracuyá, mango, flor de jamaica y menta fresca.', precio: 12500, disponible: true },
      { id: 'plato-10', nombre: 'Cerveza Artesanal Santandereana', categoria: 'bebidas', descripcion: 'Cerveza rubia de origen local con notas cítricas y maltas tostadas (330 ml).', precio: 13500, disponible: true }
    ]
  };

  // Helper para leer colección en localStorage
  function getLocalCollection(collectionName) {
    const raw = localStorage.getItem(CONFIG.storageKeyPrefix + collectionName);
    if (!raw) {
      const initial = SEED_DATA[collectionName] || [];
      localStorage.setItem(CONFIG.storageKeyPrefix + collectionName, JSON.stringify(initial));
      return initial;
    }
    try {
      return JSON.parse(raw);
    } catch (e) {
      return SEED_DATA[collectionName] || [];
    }
  }

  // Helper para guardar colección en localStorage
  function saveLocalCollection(collectionName, items) {
    localStorage.setItem(CONFIG.storageKeyPrefix + collectionName, JSON.stringify(items));
  }

  // ============================================================================
  // OBJETO PRINCIPAL KONYS_DB
  // ============================================================================
  const KonysDB = {
    // Configuración
    getConfig: () => ({ ...CONFIG }),
    setConfig: (url, anonKey) => {
      CONFIG.url = url.trim();
      CONFIG.anonKey = anonKey.trim();
      localStorage.setItem('konys_supabase_url', CONFIG.url);
      localStorage.setItem('konys_supabase_anon_key', CONFIG.anonKey);
      initSupabase();
    },
    getStorageMode: () => (supabaseClient ? 'supabase' : 'local'),

    // --------------------------------------------------------------------------
    // MESAS (RF-01, RF-09, RF-10, RF-13)
    // --------------------------------------------------------------------------
    async getMesas(zona = 'todas') {
      if (supabaseClient) {
        try {
          let query = supabaseClient.from('mesas').select('*').order('nombre', { ascending: true });
          if (zona && zona !== 'todas') {
            query = query.eq('zona', zona);
          }
          const { data, error } = await query;
          if (!error && data) return data;
          console.warn('Fallo en Supabase getMesas, usando local:', error);
        } catch (e) {
          console.warn('Error getMesas Supabase:', e);
        }
      }
      let items = getLocalCollection('mesas');
      if (zona && zona !== 'todas') {
        items = items.filter(m => m.zona.toLowerCase() === zona.toLowerCase());
      }
      return items;
    },

    async crearMesa(mesaData) {
      const id = 'mesa-' + Date.now().toString(36);
      const nueva = {
        id,
        nombre: mesaData.nombre,
        zona: mesaData.zona || 'salon',
        capacidad: parseInt(mesaData.capacidad, 10) || 2,
        activa: mesaData.activa !== false,
        foto_url: mesaData.foto_url || null,
        creado_en: new Date().toISOString()
      };

      if (supabaseClient) {
        try {
          const { data, error } = await supabaseClient.from('mesas').insert([nueva]).select().single();
          if (!error && data) return data;
        } catch (e) {
          console.warn('Error crearMesa en Supabase:', e);
        }
      }
      const items = getLocalCollection('mesas');
      items.push(nueva);
      saveLocalCollection('mesas', items);
      return nueva;
    },

    async actualizarMesa(id, cambios) {
      if (supabaseClient) {
        try {
          const { data, error } = await supabaseClient.from('mesas').update(cambios).eq('id', id).select().single();
          if (!error && data) return data;
        } catch (e) {
          console.warn('Error actualizarMesa en Supabase:', e);
        }
      }
      const items = getLocalCollection('mesas');
      const idx = items.findIndex(m => m.id === id);
      if (idx !== -1) {
        items[idx] = { ...items[idx], ...cambios };
        saveLocalCollection('mesas', items);
        return items[idx];
      }
      return null;
    },

    async eliminarMesa(id) {
      if (supabaseClient) {
        try {
          const { error } = await supabaseClient.from('mesas').delete().eq('id', id);
          if (!error) return true;
        } catch (e) {
          console.warn('Error eliminarMesa en Supabase:', e);
        }
      }
      let items = getLocalCollection('mesas');
      items = items.filter(m => m.id !== id);
      saveLocalCollection('mesas', items);
      return true;
    },

    // --------------------------------------------------------------------------
    // HORARIOS (RF-11)
    // --------------------------------------------------------------------------
    async getHorarios() {
      if (supabaseClient) {
        try {
          const { data, error } = await supabaseClient.from('horarios').select('*').eq('activo', true);
          if (!error && data && data.length) return data;
        } catch (e) {
          console.warn('Error getHorarios Supabase:', e);
        }
      }
      return getLocalCollection('horarios');
    },

    async actualizarHorarios(nuevosHorarios) {
      if (supabaseClient) {
        try {
          for (const h of nuevosHorarios) {
            await supabaseClient.from('horarios').upsert(h);
          }
        } catch (e) {
          console.warn('Error actualizarHorarios Supabase:', e);
        }
      }
      saveLocalCollection('horarios', nuevosHorarios);
      return nuevosHorarios;
    },

    // --------------------------------------------------------------------------
    // RESERVAS (RF-03, RF-04, RF-05, RF-06, RF-12)
    // --------------------------------------------------------------------------
    async getReservas(filtros = {}) {
      if (supabaseClient) {
        try {
          let query = supabaseClient.from('reservas').select('*, mesas(nombre, zona)').order('fecha', { ascending: false });
          if (filtros.fecha) query = query.eq('fecha', filtros.fecha);
          if (filtros.mesa_id) query = query.eq('mesa_id', filtros.mesa_id);
          if (filtros.estado) query = query.eq('estado', filtros.estado);

          const { data, error } = await query;
          if (!error && data) return data;
        } catch (e) {
          console.warn('Error getReservas Supabase:', e);
        }
      }

      let items = getLocalCollection('reservas');
      const mesas = getLocalCollection('mesas');
      const mapMesas = Object.fromEntries(mesas.map(m => [m.id, m]));

      let res = items.map(r => ({
        ...r,
        mesas: mapMesas[r.mesa_id] ? { nombre: mapMesas[r.mesa_id].nombre, zona: mapMesas[r.mesa_id].zona } : null
      }));

      if (filtros.fecha) res = res.filter(r => r.fecha === filtros.fecha);
      if (filtros.mesa_id) res = res.filter(r => r.mesa_id === filtros.mesa_id);
      if (filtros.estado) res = res.filter(r => r.estado === filtros.estado);

      return res;
    },

    /**
     * Valida si un slot ya está ocupado antes de guardar (Protección de doble reserva / race condition).
     */
    async isSlotOcupado(mesaId, fecha, horaInicio) {
      if (supabaseClient) {
        try {
          const { data, error } = await supabaseClient
            .from('reservas')
            .select('id')
            .eq('mesa_id', mesaId)
            .eq('fecha', fecha)
            .eq('hora_inicio', horaInicio)
            .eq('estado', 'confirmada');
          if (!error && data) return data.length > 0;
        } catch (e) {
          console.warn('Error isSlotOcupado Supabase:', e);
        }
      }
      const reservas = getLocalCollection('reservas');
      return reservas.some(
        r => r.mesa_id === mesaId && r.fecha === fecha && r.hora_inicio === horaInicio && r.estado === 'confirmada'
      );
    },

    async crearReserva(reservaData) {
      // 1. Verificación previa de condición de carrera / doble reserva
      const yaOcupado = await this.isSlotOcupado(reservaData.mesa_id, reservaData.fecha, reservaData.hora_inicio);
      if (yaOcupado) {
        throw new Error('Lo sentimos, este horario acaba de ser reservado por otro cliente. Por favor elige otro slot.');
      }

      const id = 'KP-' + new Date().toISOString().slice(0, 10).replace(/-/g, '') + '-' + Math.random().toString(36).substring(2, 6).toUpperCase();
      const nueva = {
        id,
        mesa_id: reservaData.mesa_id,
        cliente_nombre: reservaData.cliente_nombre.trim(),
        cliente_contacto: (reservaData.cliente_contacto || '').trim(),
        num_personas: parseInt(reservaData.num_personas, 10),
        fecha: reservaData.fecha,
        hora_inicio: reservaData.hora_inicio,
        hora_fin: reservaData.hora_fin || this.calcularHoraFin(reservaData.hora_inicio),
        estado: 'confirmada',
        creado_en: new Date().toISOString()
      };

      if (supabaseClient) {
        try {
          const { data, error } = await supabaseClient.from('reservas').insert([nueva]).select().single();
          if (!error && data) return data;
          if (error && error.code === '23505') {
            throw new Error('Doble reserva detectada: Este horario ya fue confirmado.');
          }
        } catch (e) {
          if (e.message && e.message.includes('Doble reserva')) throw e;
          console.warn('Error al guardar en Supabase, guardando en local:', e);
        }
      }

      const items = getLocalCollection('reservas');
      items.push(nueva);
      saveLocalCollection('reservas', items);
      return nueva;
    },

    async actualizarEstadoReserva(id, nuevoEstado) {
      if (supabaseClient) {
        try {
          const { data, error } = await supabaseClient
            .from('reservas')
            .update({ estado: nuevoEstado })
            .eq('id', id)
            .select()
            .single();
          if (!error && data) return data;
        } catch (e) {
          console.warn('Error actualizarEstadoReserva Supabase:', e);
        }
      }
      const items = getLocalCollection('reservas');
      const idx = items.findIndex(r => r.id === id);
      if (idx !== -1) {
        items[idx].estado = nuevoEstado;
        saveLocalCollection('reservas', items);
        return items[idx];
      }
      return null;
    },

    async eliminarReserva(id) {
      if (supabaseClient) {
        try {
          const { error } = await supabaseClient.from('reservas').delete().eq('id', id);
          if (!error) return true;
        } catch (e) {
          console.warn('Error eliminarReserva Supabase:', e);
        }
      }
      let items = getLocalCollection('reservas');
      items = items.filter(r => r.id !== id);
      saveLocalCollection('reservas', items);
      return true;
    },

    // --------------------------------------------------------------------------
    // CARTA DIGITAL / PLATOS (RF-07, RF-14)
    // --------------------------------------------------------------------------
    async getPlatos(categoria = 'todas') {
      if (supabaseClient) {
        try {
          let query = supabaseClient.from('platos').select('*').order('precio', { ascending: true });
          if (categoria && categoria !== 'todas') {
            query = query.eq('categoria', categoria);
          }
          const { data, error } = await query;
          if (!error && data) return data;
        } catch (e) {
          console.warn('Error getPlatos Supabase:', e);
        }
      }
      let items = getLocalCollection('platos');
      if (categoria && categoria !== 'todas') {
        items = items.filter(p => p.categoria.toLowerCase() === categoria.toLowerCase());
      }
      return items;
    },

    async crearPlato(platoData) {
      const id = 'plato-' + Date.now().toString(36);
      const nuevo = {
        id,
        nombre: platoData.nombre.trim(),
        categoria: platoData.categoria,
        descripcion: platoData.descripcion.trim(),
        precio: parseFloat(platoData.precio) || 0,
        disponible: platoData.disponible !== false
      };

      if (supabaseClient) {
        try {
          const { data, error } = await supabaseClient.from('platos').insert([nuevo]).select().single();
          if (!error && data) return data;
        } catch (e) {
          console.warn('Error crearPlato Supabase:', e);
        }
      }
      const items = getLocalCollection('platos');
      items.push(nuevo);
      saveLocalCollection('platos', items);
      return nuevo;
    },

    async actualizarPlato(id, cambios) {
      if (supabaseClient) {
        try {
          const { data, error } = await supabaseClient.from('platos').update(cambios).eq('id', id).select().single();
          if (!error && data) return data;
        } catch (e) {
          console.warn('Error actualizarPlato Supabase:', e);
        }
      }
      const items = getLocalCollection('platos');
      const idx = items.findIndex(p => p.id === id);
      if (idx !== -1) {
        items[idx] = { ...items[idx], ...cambios };
        saveLocalCollection('platos', items);
        return items[idx];
      }
      return null;
    },

    async eliminarPlato(id) {
      if (supabaseClient) {
        try {
          const { error } = await supabaseClient.from('platos').delete().eq('id', id);
          if (!error) return true;
        } catch (e) {
          console.warn('Error eliminarPlato Supabase:', e);
        }
      }
      let items = getLocalCollection('platos');
      items = items.filter(p => p.id !== id);
      saveLocalCollection('platos', items);
      return true;
    },

    // --------------------------------------------------------------------------
    // UTILIDADES
    // --------------------------------------------------------------------------
    calcularHoraFin(horaInicio, duracionMinutos = 60) {
      const [h, m] = horaInicio.split(':').map(Number);
      const d = new Date();
      d.setHours(h, m + duracionMinutos, 0, 0);
      const finH = String(d.getHours()).padStart(2, '0');
      const finM = String(d.getMinutes()).padStart(2, '0');
      return `${finH}:${finM}`;
    },

    // Restablecer almacenamiento local al estado inicial
    resetDemoData() {
      localStorage.removeItem(CONFIG.storageKeyPrefix + 'mesas');
      localStorage.removeItem(CONFIG.storageKeyPrefix + 'horarios');
      localStorage.removeItem(CONFIG.storageKeyPrefix + 'reservas');
      localStorage.removeItem(CONFIG.storageKeyPrefix + 'platos');
      return true;
    }
  };

  window.KonysDB = KonysDB;
})(window);
