(function (root) {
  'use strict';

  const ROLES = {
    default: { name: 'Default', short: 'Default', icon: 'spark', description: 'Asistente general para consultas de arquitectura.' },
    analyst: { name: 'Analista del Repositorio', short: 'Analista', icon: 'search', description: 'Explora el modelo y comprende el negocio.' },
    writer: { name: 'Documentalista', short: 'Documentalista', icon: 'file', description: 'Convierte arquitectura en documentación clara.' },
    modeler: { name: 'Modelador', short: 'Modelador', icon: 'network', description: 'Propone elementos, relaciones y diagramas.' },
    reviewer: { name: 'Revisor de Calidad', short: 'Revisor', icon: 'shield', description: 'Revisa consistencia, trazabilidad e impactos.' }
  };
  const MODELS = {
    claude: { name: 'Claude opus 5.5', factor: 1.18 },
    fable: { name: 'Fable 5.1', factor: .88 },
    luna: { name: 'GPT 6 LUNA', factor: .65 },
    sol: { name: 'GPT 6 SOL', factor: 1 }
  };
  const EFFORTS = {
    low: { name: 'Bajo', level: 1, factor: .72, duration: 3000 },
    medium: { name: 'Medio', level: 2, factor: 1, duration: 4200 },
    high: { name: 'Alto', level: 3, factor: 1.34, duration: 5800 },
    max: { name: 'Máximo', level: 4, factor: 1.75, duration: 7400 }
  };
  const COPY = {
    default: {
      plan: 'Voy a revisar el contexto disponible y preparar una respuesta general sobre el repositorio.',
      steps: ['Comprender la consulta', 'Reunir el contexto disponible', 'Organizar la información', 'Preparar la respuesta'],
      descriptions: ['Identificando el objetivo de la consulta.', 'Recopilando información del modelo de ejemplo.', 'Seleccionando los puntos más relevantes.', 'Presentando un resumen claro para el usuario.'],
    },
    analyst: {
      plan: 'Voy a recorrer la estructura del repositorio, consultar sus elementos y preparar una visión general del negocio.',
      steps: ['Explorar la estructura del repositorio', 'Consultar paquetes y diagramas', 'Analizar elementos del modelo', 'Sintetizar el resumen'],
      descriptions: ['Identificando dominios, paquetes y contexto de trabajo.', 'Consultando elementos y relaciones del modelo de ejemplo.', 'Relacionando procesos, aplicaciones y capacidades.', 'Organizando los hallazgos y sus referencias.'],
    },
    writer: {
      plan: 'Voy a reunir el contexto del paquete y preparar un borrador estructurado, con referencias al modelo de ejemplo.',
      steps: ['Identificar las fuentes del modelo', 'Recopilar descripciones y relaciones', 'Estructurar el documento', 'Preparar el borrador'],
      descriptions: ['Delimitando el paquete y las fuentes autorizadas.', 'Reuniendo notas y descripciones disponibles.', 'Organizando alcance, componentes y responsabilidades.', 'Marcando los puntos que necesitan revisión humana.'],
    },
    modeler: {
      plan: 'Voy a organizar una propuesta de elementos y relaciones. La maqueta no realizará cambios en Enterprise Architect.',
      steps: ['Interpretar la solicitud de modelado', 'Consultar las convenciones', 'Proponer elementos y relaciones', 'Preparar la propuesta para revisión'],
      descriptions: ['Delimitando el objetivo y la notación sugerida.', 'Revisando tipos y estructura del modelo de ejemplo.', 'Preparando una estructura coherente de componentes.', 'Separando la propuesta de cualquier operación de escritura.'],
    },
    reviewer: {
      plan: 'Voy a revisar consistencia y trazabilidad, identificar dependencias y presentar observaciones de ejemplo.',
      steps: ['Delimitar el alcance de la revisión', 'Revisar nombres y descripciones', 'Comprobar relaciones e impactos', 'Priorizar las observaciones'],
      descriptions: ['Identificando los elementos del paquete seleccionado.', 'Buscando inconsistencias en el conjunto de ejemplo.', 'Relacionando aplicaciones, procesos e interfaces.', 'Preparando una lista de revisión, sin modificar el modelo.'],
    }
  };

  const REPORT = {
    title: '📋 Repositorio Telco - ML2 (Claro Perú)',
    intro: 'Este es un repositorio integral de Arquitectura Empresarial perteneciente a Claro Perú, una empresa del sector de telecomunicaciones. Fue creado en abril de 2012 y se mantiene activamente actualizado.',
    sections: [
      {
        heading: '🏗️ Estructura Principal',
        paragraphs: ['El modelo se organiza en 3 paquetes raíz:'],
        columns: ['Paquete', 'Descripción'],
        rows: [
          ['ASSETS', 'Activos reutilizables: componentes, capacidades, catálogos'],
          ['WORKSPACE', 'Espacio de trabajo activo para proyectos e iniciativas'],
          ['VIEWS', 'Vistas y diagramas organizados para consulta']
        ],
        boldFirstColumn: true
      },
      {
        heading: '📊 Volumen del Repositorio',
        paragraphs: [
          '+2,193 diagramas que incluyen análisis, flujos BPMN, arquitectura lógica, mockups, diseño funcional, reportes y más.',
          'Utiliza un MDG personalizado (MDG_CLARO_PERU) con estereotipos específicos para la organización.'
        ]
      },
      {
        heading: '🏛️ Dominios de Arquitectura Documentados',
        columns: ['Dominio', 'Contenido'],
        rows: [
          ['Arquitectura de Aplicaciones', 'Catálogo de aplicaciones, diagramas lógicos de proyectos'],
          ['Arquitectura de Integración', 'Servicios, métodos, procesos SDR'],
          ['Arquitectura de Datos', 'Servidores, bases de datos'],
          ['Arquitectura de Solución', 'Diagramas AS-IS / TO-BE'],
          ['Arquitectura Física', 'Escenarios de red interna/externa, sizing, permisos entre servidores'],
          ['Procesos de Negocio (BPMN)', 'Gestión financiera TI, gestión de requerimientos, sprints, ventas']
        ]
      },
      {
        heading: '🗺️ Mapa de Capacidades (alineado con TM Forum / eTOM)',
        paragraphs: ['El repositorio documenta un extenso mapa de capacidades de telecomunicaciones:'],
        items: [
          'Customer Engagement — Marketing digital, self-service, ventas, chat bot, redes sociales, eSales',
          'Core Systems BSS/OSS — Billing, charging, order management, service assurance, incident management',
          'Integration — API governance, microservicios, orquestación, mediación, data transformation',
          'Data & Analytics — Customer 360, AI, real-time event processing, dashboards',
          'Security — Access control, GDPR, SOX compliance, fraud management, risk assessment',
          'Monitoring — Red, aplicaciones, infraestructura, KPIs, business activity monitoring',
          'Retail & Channels — ePOS, tiendas, contact center, IVR, canales digitales, mobile apps'
        ]
      },
      {
        heading: '📝 Plantillas Estandarizadas para Proyectos',
        paragraphs: ['Cada proyecto sigue una estructura documental estándar:'],
        ordered: true,
        items: [
          'Alcance del Release del Proyecto',
          'Matriz de Roles y Responsabilidades',
          'Supuestos',
          'Arquitectura de Aplicaciones',
          'Arquitectura de Integración',
          'Arquitectura de Datos',
          'Componentes de la Solución',
          'Diagrama de Arquitectura de Solución'
        ]
      }
    ],
    summary: 'Es un repositorio maduro y completo de arquitectura empresarial para una operadora de telecomunicaciones, que abarca desde procesos de negocio y capacidades estratégicas hasta arquitectura técnica de aplicaciones, integración, datos y red, todo alineado con estándares de la industria como TM Forum/eTOM.',
    followUp: '¿Te gustaría profundizar en algún dominio o aspecto específico del repositorio?'
  };

  function reportToText(report) {
    const lines = [report.title, report.intro];
    for (const section of report.sections) {
      lines.push(section.heading, ...(section.paragraphs || []));
      if (section.columns) lines.push(section.columns.join('\t'), ...section.rows.map(row => row.join('\t')));
      if (section.items) lines.push(...section.items.map((item, i) => section.ordered ? (i + 1) + '. ' + item : '• ' + item));
    }
    lines.push('En resumen: ' + report.summary, report.followUp);
    return lines.join('\n\n');
  }

  function effortKey(position) {
    return ['low', 'medium', 'high', 'max'][Number(position)] || 'high';
  }

  function estimateUsage(message, modelId, effortId, roleId) {
    const model = MODELS[modelId] || MODELS.sol;
    const effort = EFFORTS[effortId] || EFFORTS.medium;
    const role = ROLES[roleId] ? roleId : 'analyst';
    const words = String(message || '').trim().split(/\s+/).filter(Boolean).length;
    const input = Math.round((10800 + Math.min(words, 4000) * 13) * effort.factor);
    const output = Math.round(({ default: 1350, analyst: 1450, writer: 2100, modeler: 1850, reviewer: 1660 }[role]) * effort.factor);
    // Fictional demo coefficients; these are not any provider's prices.
    const usd = Number(((input * 8.5 + output * 38) / 1000000 * model.factor).toFixed(4));
    return { input, output, total: input + output, usd, credits: Math.ceil(usd * 100) };
  }

  function makeResponse(roleId, repository, scope) {
    const role = ROLES[roleId] ? roleId : 'analyst';
    return { ...COPY[role], report: REPORT, repository: String(repository), scope: String(scope), role };
  }

  const api = { ROLES, MODELS, EFFORTS, estimateUsage, makeResponse, reportToText, effortKey };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.KernaroMock = api;
})(typeof globalThis !== 'undefined' ? globalThis : this);
