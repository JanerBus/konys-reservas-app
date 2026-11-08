/**
 * ============================================================================
 * KONYS PIZZA — CAPA DE DATOS HÍBRIDA (SUPABASE + LOCALSTORAGE FALLBACK)
 * Permite funcionamiento continuo con Supabase en la nube o en Modo Demo local.
 * ============================================================================
 */

(function (window) {
  'use strict';

  // ============================================================================
  // CREDENCIALES DE SUPABASE CLOUD (PostgreSQL)
  // ============================================================================
  const CONFIG = {
    // 1. Project URL de Supabase
    url: 'https://psukwmpjzdzechbgkcaz.supabase.co',

    // 2. Anon Public API Key
    anonKey: 'sb_publishable_qRPT1b3aKK7iCjN0pXgy0g_X1iUhDd1',

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
      { id: 'horario-almuerzo', dia_semana: 'todos', jornada: 'almuerzo', hora_inicio: '12:00', hora_fin: '14:30', duracion_slot: 60, activo: true },
      { id: 'horario-noche-semana', dia_semana: 'lunes-viernes', jornada: 'noche', hora_inicio: '17:00', hora_fin: '22:30', duracion_slot: 60, activo: true },
      { id: 'horario-noche-finde', dia_semana: 'sabado-domingo', jornada: 'noche', hora_inicio: '17:00', hora_fin: '23:00', duracion_slot: 60, activo: true }
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
      { id: 'plato-bukara', nombre: 'BUKARA ⭐💚 (Ganadora Pizza Master)', categoria: 'pizzas', descripcion: 'Homenaje a la Ciudad Bonita: trozos de jugosa carne de hamburguesa, mermelada de tocineta ahumada en reducción de miel y panela, sobre nuestra exquisita salsa napolitana.', precio: 28900, disponible: true },
      { id: 'plato-dulcinea', nombre: 'KONYS DULCINEA (Conopizza de Temporada)', categoria: 'pizzas', descripcion: 'Pollo marinado al horno, mozzarella argentino, cremoso de tocineta caramelizada con queso crema Kraft, nacho artesanal y lluvia de parmesano. Acompañado de papitas al horno.', precio: 28900, disponible: true },
      { id: 'plato-colombianisima', nombre: 'Colombianísima (Pizza Master 2022)', categoria: 'pizzas', descripcion: 'Jugosa carne desmechada, dulces maduritos fritos y maicitos frescos, coronados con un trozo de arepa de maíz santandereana.', precio: 28900, disponible: true },
      { id: 'plato-hawaiana', nombre: 'Pizza Hawaiana Clásica', categoria: 'pizzas', descripcion: 'La combinación perfecta de tocineta y jamón ahumados con piña OroMiel caramelizada y queso mozzarella fundido.', precio: 27900, disponible: true },
      { id: 'plato-mexicana', nombre: 'Pizza Mexicana Tex-Mex', categoria: 'pizzas', descripcion: 'Carne molida sazonada, maíz tierno, pimentón, cebolla caramelizada, crujientes nachos y un toque especial de picante Tex-Mex.', precio: 27900, disponible: true },
      { id: 'plato-pepperoni', nombre: 'Carnes - Auténtica Pepperoni', categoria: 'pizzas', descripcion: 'Pepperoni picante artesanal, cábano tradicional y jamón ahumado, la combinación favorita de los amantes de la carne.', precio: 27900, disponible: true },
      { id: 'plato-especial', nombre: 'Pizza Konys Especial', categoria: 'pizzas', descripcion: 'Pollo marinado al horno, tocineta ahumada crocante y champiñones frescos en salsa napolitana de la casa.', precio: 27900, disponible: true },
      { id: 'plato-carbonara', nombre: 'Pizza Carbonara', categoria: 'pizzas', descripcion: 'Tocineta ahumada, jamón seleccionado, maíz dulce y queso parmesano gratinado sobre una base de cremosa salsa blanca.', precio: 27900, disponible: true },
      { id: 'plato-italianisima', nombre: 'Pizza Italianísima', categoria: 'pizzas', descripcion: 'Jamón serrano madurado, tomates asados al horno, pesto artesanal de albahaca fresca y queso parmesano.', precio: 28900, disponible: true },
      { id: 'plato-bondiola', nombre: 'Pizza Bondiola Premium', categoria: 'pizzas', descripcion: 'Corte premium de bondiola de cerdo ahumada, champiñones frescos y queso parmesano sobre salsa napolitana.', precio: 28900, disponible: true },
      { id: 'plato-lasana', nombre: 'Lasaña al Horno Konys', categoria: 'pizzas', descripcion: 'Capas de pasta artesanal con carne molida sazonada, tocineta ahumada, bechamel y queso parmesano gratinado, servida con papas al horno sin aceite.', precio: 31800, disponible: true },
      { id: 'plato-desgranado', nombre: 'Desgranado de Carne al Horno', categoria: 'pizzas', descripcion: 'Servido en Kono crocante, relleno de mazorca bogotana salteada con carne desmechada, chorizo santarosano, salsita Konys y mozzarella.', precio: 38500, disponible: true },
      { id: 'plato-mini-konitos', nombre: 'Entrada Mini Konitos (x5)', categoria: 'entradas', descripcion: 'Cinco (5) mini conos Konys rellenos de queso gratinado fundido, salsa napolitana y sabor a elegir (Hawaiano, Pepperoni o Queso).', precio: 15000, disponible: true },
      { id: 'plato-nachos', nombre: 'Nachos Enchulados para Compartir', categoria: 'entradas', descripcion: 'Nachos crujientes con queso costeño rallado, salsa tártara de la casa y piña caramelizada.', precio: 16000, disponible: true },
      { id: 'plato-papas-locas', nombre: 'Papas Locas - Fries Ikónicas', categoria: 'entradas', descripcion: 'Únicas papas fritas al horno sin aceite de la ciudad, cubiertas con chorizo santarosano, salchicha llanera, carne de hamburguesa, maicitos, tártara y queso rallado.', precio: 39000, disponible: true },
      { id: 'plato-chicken-fries', nombre: 'Chicken Fries Mini', categoria: 'entradas', descripcion: 'Papas al horno sin aceite, nuggets de pollo hechos en casa, bañadas en mozzarella derretido y salsas tártara y piña.', precio: 18000, disponible: true },
      { id: 'plato-maracumango', nombre: 'Granizado MaracuMango', categoria: 'bebidas', descripcion: 'Bebida frappé refrescante elaborada con pulpa 100% natural de maracuyá y mango maduro.', precio: 9900, disponible: true },
      { id: 'plato-cerezada', nombre: 'Granizado Cerezada Natural', categoria: 'bebidas', descripcion: 'Limonada natural en frappé con cerezas en almíbar y el balance dulce-ácido característico de Konys.', precio: 9900, disponible: true },
      { id: 'plato-limonada-coco', nombre: 'Limonada de Coco Frappé', categoria: 'bebidas', descripcion: 'Cremosa limonada frappé elaborada con leche de coco natural y hielo finamente granizado.', precio: 11000, disponible: true },
      { id: 'plato-soda-lulo', nombre: 'Soda Lulo Fizz', categoria: 'bebidas', descripcion: 'Mermelada de lulo natural, zumo de limón, soda, perlas explosivas de maracuyá y ginger ale macerado.', precio: 12900, disponible: true },
      { id: 'plato-soda-rojos', nombre: 'Soda Frutos Rojos con Perlas', categoria: 'bebidas', descripcion: 'Sirope natural de frutos rojos, fresa picada, limón, soda y perlas explosivas de cereza.', precio: 12900, disponible: true },
      { id: 'plato-cerveza-club', nombre: 'Cerveza Club Colombia Dorada', categoria: 'bebidas', descripcion: 'Cerveza dorada prémium tipo lager (330 ml).', precio: 7000, disponible: true },
      { id: 'plato-cerveza-corona', nombre: 'Cerveza Corona Extra', categoria: 'bebidas', descripcion: 'Cerveza rubia mexicana servida bien fría con rodaja de limón (330 ml).', precio: 9500, disponible: true },
      { id: 'plato-copa-ikonica', nombre: 'Copa de Helado Ikónica', categoria: 'postres', descripcion: 'Doble bola de helado cookies and cream con fresas frescas picadas, leche condensada, salsa de chocolate y maní tostado.', precio: 7500, disponible: true },
      { id: 'plato-copa-clasica', nombre: 'Copa de Helado Clásica', categoria: 'postres', descripcion: 'Helado artesanal de cookies and cream con salsa de chocolate caliente y lluvia de maní.', precio: 4900, disponible: true }
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
