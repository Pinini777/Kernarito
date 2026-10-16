(() => {
  'use strict';
  const { ROLES, MODELS, EFFORTS, estimateUsage, makeResponse, reportToText, effortKey } = window.KernaroMock;
  const $ = id => document.getElementById(id);
  const number = value => Math.round(value).toLocaleString('es-AR');
  const money = value => '$' + value.toFixed(2);
  const seconds = value => value.toFixed(1).replace('.', ',') + ' s';
  const logoPath = 'assets/kernaro-logo.png';
  const chats = [];
  let currentChat;
  let selectedRole = 'default';
  let selectedScope = 'Todo el repositorio';
  let running = null;
  let toastTimer;
  let nextId = 0;

  function element(tag, className, text) {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (text !== undefined) node.textContent = text;
    return node;
  }
  function icon(name, className = '') {
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    if (className) svg.setAttribute('class', className);
    svg.setAttribute('aria-hidden', 'true');
    const use = document.createElementNS(svg.namespaceURI, 'use');
    use.setAttribute('href', '#i-' + name);
    svg.append(use);
    return svg;
  }
  function logo() {
    const img = element('img', 'assistant-logo');
    img.src = logoPath;
    img.alt = 'Kernaro';
    return img;
  }
  function timeLabel() {
    return new Intl.DateTimeFormat('es-AR', { hour: '2-digit', minute: '2-digit', timeZone: 'America/Argentina/Buenos_Aires' }).format(new Date());
  }
  function announce(text) { $('announcement').textContent = text; }
  function toast(text) {
    clearTimeout(toastTimer);
    $('toast').textContent = text;
    $('toast').classList.add('visible');
    toastTimer = setTimeout(() => $('toast').classList.remove('visible'), 2600);
  }
  function scrollToLatest() { $('conversation').scrollTop = $('conversation').scrollHeight; }
  function zeroUsage() { return { input: 0, output: 0, total: 0, usd: 0, credits: 0 }; }

  function createChat() {
    if (running) cancelRun();
    if (currentChat && currentChat.messages.length === 0) {
      $('prompt').focus();
      return;
    }
    const chat = { id: ++nextId, repository: $('repository').value, messages: [], title: 'Nueva conversación', time: timeLabel() };
    chats.unshift(chat);
    currentChat = chat;
    selectedScope = 'Todo el repositorio';
    $('context-chip').textContent = selectedScope;
    renderConversation();
    renderHistory();
    renderTree();
    renderMetrics();
    $('prompt').focus();
    document.body.classList.remove('sidebar-open');
  }

  function renderHistory() {
    $('history').replaceChildren();
    for (const chat of chats) {
      if (!chat.messages.length) continue;
      const button = element('button', 'history-item' + (chat === currentChat ? ' active' : ''));
      if (chat === currentChat) button.setAttribute('aria-current', 'page');
      const detail = element('div');
      detail.append(element('span', 'history-title', chat.title), element('span', 'history-time', chat.time));
      button.append(icon('chat'), detail);
      button.title = chat.title;
      button.addEventListener('click', () => {
        if (running) cancelRun();
        currentChat = chat;
        $('repository').value = chat.repository;
        selectedScope = 'Todo el repositorio';
        $('context-chip').textContent = selectedScope;
        renderHistory(); renderConversation(); renderTree(); renderMetrics();
        document.body.classList.remove('sidebar-open');
      });
      $('history').append(button);
    }
  }

  function renderUser(message) {
    const row = element('div', 'user-message');
    const content = element('div');
    content.append(element('div', 'user-bubble', message.text), element('div', 'message-time', message.time));
    row.append(content, element('div', 'avatar', 'E'));
    return row;
  }

  function createTrace(record) {
    const row = element('div', 'assistant-message');
    const content = element('div', 'assistant-content');
    const trace = element('section', 'trace');
    const heading = element('button', 'trace-heading');
    heading.type = 'button';
    heading.setAttribute('aria-expanded', 'true');
    heading.append(icon('bulb'), element('strong', '', 'Razonamiento'), element('span', 'trace-label', 'Actividad simulada'), icon('chevron', 'trace-chevron'));
    const body = element('div', 'trace-body');
    body.append(element('p', 'trace-plan', record.data.plan));
    const steps = element('div', 'trace-steps');
    const durations = [.22, .28, .28, .22].map(p => p * record.elapsed);
    record.data.steps.forEach((label, index) => {
      const done = record.status === 'done';
      const step = element('div', 'trace-step ' + (done ? 'done' : 'pending'));
      const button = element('button', 'step-summary');
      button.type = 'button';
      button.setAttribute('aria-expanded', 'false');
      const status = element('span', 'step-status');
      if (done) status.append(icon('check'));
      else status.textContent = index + 1;
      const text = element('span', 'step-text');
      text.append(element('strong', '', label), element('span', '', record.data.descriptions[index]));
      const expand = element('span', 'step-expand');
      expand.append(icon('chevron'));
      button.append(status, text, element('span', 'step-duration', done ? seconds(durations[index]) : '—'), expand);
      const detail = element('div', 'step-detail');
      detail.hidden = true;
      detail.append(element('div', '', 'Operación de ejemplo: ' + ['Get Repository Structure', 'Get Packages & Diagrams', 'Get Elements & Connectors', 'Prepare Response'][index]), element('div', '', 'Contexto: ' + record.data.repository + ' / ' + record.data.scope), element('div', '', 'Demostración visual. No se ha llamado a ninguna herramienta real.'));
      button.addEventListener('click', () => {
        detail.hidden = !detail.hidden;
        button.setAttribute('aria-expanded', String(!detail.hidden));
      });
      step.append(button, detail);
      steps.append(step);
    });
    body.append(steps);
    trace.append(heading, body);
    heading.addEventListener('click', () => {
      const collapsed = trace.classList.toggle('collapsed');
      heading.setAttribute('aria-expanded', String(!collapsed));
    });
    content.append(trace);
    row.append(logo(), content);
    return { row, steps: [...steps.children] };
  }

  function renderAnswer(record) {
    const row = element('div', 'assistant-message');
    const card = element('article', 'answer-card report-card assistant-content');
    const report = record.data.report;
    card.append(element('span', 'report-label', 'RESPUESTA PREDEFINIDA · DEMOSTRACIÓN'), element('h2', '', report.title), element('p', 'report-intro', report.intro));
    for (const section of report.sections) {
      const block = element('section', 'report-section');
      block.append(element('h3', '', section.heading));
      for (const paragraph of section.paragraphs || []) block.append(element('p', '', paragraph));
      if (section.columns) {
        const wrapper = element('div', 'report-table-wrap');
        const table = element('table', 'report-table');
        const head = element('thead');
        const headerRow = element('tr');
        for (const column of section.columns) {
          const cell = element('th', '', column);
          cell.scope = 'col';
          headerRow.append(cell);
        }
        head.append(headerRow);
        const body = element('tbody');
        for (const values of section.rows) {
          const tr = element('tr');
          values.forEach((value, index) => {
            const cell = element('td');
            if (index === 0 && section.boldFirstColumn) cell.append(element('strong', '', value));
            else cell.textContent = value;
            tr.append(cell);
          });
          body.append(tr);
        }
        table.append(head, body);
        wrapper.append(table);
        block.append(wrapper);
      }
      if (section.items) {
        const list = element(section.ordered ? 'ol' : 'ul', 'report-list');
        for (const item of section.items) {
          const li = element('li');
          const split = item.indexOf(' — ');
          if (split !== -1) li.append(element('strong', '', item.slice(0, split)), document.createTextNode(item.slice(split)));
          else li.textContent = item;
          list.append(li);
        }
        block.append(list);
      }
      card.append(block);
    }
    const summary = element('p', 'report-summary');
    summary.append(element('strong', '', 'En resumen: '), document.createTextNode(report.summary));
    card.append(summary, element('p', 'report-follow-up', report.followUp));
    const sources = element('div', 'source-chips');
    for (const source of [record.data.repository, record.data.scope]) {
      const chip = element('span', 'source-chip');
      chip.append(icon('database'), document.createTextNode(source));
      sources.append(chip);
    }
    card.append(sources);
    const footer = element('div', 'answer-footer');
    footer.append(icon('clock'), element('span', '', 'Simulación completada en ' + seconds(record.elapsed)), element('span', '', ' · ' + ROLES[record.data.role].short));
    const copy = element('button', 'copy-answer');
    copy.type = 'button';
    copy.append(icon('copy'), document.createTextNode('Copiar'));
    copy.addEventListener('click', async () => {
      const plain = reportToText(report);
      try {
        await navigator.clipboard.writeText(plain);
        toast('Respuesta de demostración copiada.');
      } catch {
        toast('El navegador no permite copiar aquí. Puedes seleccionar el texto.');
      }
    });
    footer.append(copy);
    card.append(footer);
    row.append(logo(), card);
    return row;
  }

  function renderWelcome() {
    const welcome = element('div', 'welcome');
    const img = element('img'); img.src = logoPath; img.alt = 'Kernaro';
    const title = element('h1');
    title.append(element('span', '', 'Unlock Expert Insights. Elevate Your Architecture.'), element('span', '', 'Maximize Efficiency.'));
    welcome.append(img, title, element('p', '', 'Meet Kernaro AI, your AI assistant for Enterprise Architecture. Get quick support with modeling, documentation, and drive smarter decisions.'));
    return welcome;
  }

  function renderConversation() {
    const messages = $('messages');
    messages.replaceChildren();
    messages.classList.toggle('is-empty', currentChat.messages.length === 0);
    if (!currentChat.messages.length) { messages.append(renderWelcome()); return; }
    for (const record of currentChat.messages) {
      if (record.type === 'user') messages.append(renderUser(record));
      else {
        messages.append(createTrace(record).row);
        if (record.status === 'done') messages.append(renderAnswer(record));
        if (record.status === 'cancelled') messages.append(element('div', 'interrupted', 'Simulación detenida. Puedes enviar otra consulta o cambiar de rol.'));
      }
    }
  }

  function renderMetrics() {
    const records = currentChat.messages.filter(m => m.type === 'assistant');
    const last = records.at(-1);
    const usage = last ? last.usage : zeroUsage();
    $('usage-input').textContent = number(usage.input);
    $('usage-output').textContent = number(usage.output);
    $('usage-total').textContent = number(usage.total);
    $('usage-cost').textContent = money(usage.usd);
    $('usage-credits').textContent = number(usage.credits);
    $('usage-time').textContent = seconds(last ? last.elapsed : 0);
    $('live-indicator').hidden = !running;
    const total = records.reduce((a, r) => ({ input: a.input + r.usage.input, output: a.output + r.usage.output, total: a.total + r.usage.total, usd: a.usd + r.usage.usd, credits: a.credits + r.usage.credits }), zeroUsage());
    $('session-cost').replaceChildren(document.createTextNode(money(total.usd)), element('small', '', 'USD'));
    $('session-tokens').textContent = number(total.total);
    $('session-queries').textContent = records.filter(r => r.status === 'done').length;
    const remaining = Math.max(0, 500 - total.credits);
    $('credit-balance').textContent = number(remaining) + ' / 500';
    $('credit-meter').style.width = remaining / 5 + '%';
    $('input-bar').style.width = (total.total ? total.input / total.total * 100 : 50) + '%';
  }

  function selectRole(role) {
    selectedRole = role;
    $('role-trigger').replaceChildren(icon(ROLES[role].icon), element('span', '', ROLES[role].name), icon('chevron', 'role-chevron'));
    $('role-menu').hidden = true;
    $('role-trigger').setAttribute('aria-expanded', 'false');
    renderRoleMenu();
  }
  function renderRoleMenu() {
    $('role-menu').replaceChildren();
    for (const [id, role] of Object.entries(ROLES)) {
      const button = element('button', 'role-option' + (id === selectedRole ? ' selected' : ''));
      button.type = 'button';
      const text = element('div');
      text.append(element('strong', '', role.name), element('small', '', role.description));
      button.append(icon(role.icon), text);
      if (id === selectedRole) button.append(icon('check', 'role-check'));
      button.addEventListener('click', () => { selectRole(id); $('prompt').focus(); });
      $('role-menu').append(button);
    }
  }

  function closeModelMenu(restoreFocus = false) {
    $('model-menu').hidden = true;
    $('model').setAttribute('aria-expanded', 'false');
    if (restoreFocus) $('model').focus();
  }

  function renderModelMenu() {
    $('model-menu').replaceChildren();
    for (const [id, model] of Object.entries(MODELS)) {
      const selected = $('model').value === id;
      const option = element('button', 'model-option' + (selected ? ' selected' : ''));
      option.type = 'button';
      option.setAttribute('role', 'option');
      option.setAttribute('aria-selected', String(selected));
      option.tabIndex = selected ? 0 : -1;
      const mark = element('span', 'model-mark');
      mark.dataset.model = id;
      mark.append(icon('spark'));
      mark.setAttribute('aria-hidden', 'true');
      option.append(mark, element('span', '', model.name));
      if (selected) option.append(icon('check', 'model-check'));
      option.addEventListener('click', () => {
        $('model').value = id;
        $('model-name').textContent = model.name;
        $('model-mark').replaceChildren(icon('spark'));
        $('model-mark').dataset.model = id;
        closeModelMenu(true);
        renderModelMenu();
      });
      $('model-menu').append(option);
    }
  }

  function openModelMenu() {
    closeEffortMenu();
    $('role-menu').hidden = true;
    $('role-trigger').setAttribute('aria-expanded', 'false');
    $('model-menu').hidden = false;
    $('model').setAttribute('aria-expanded', 'true');
    $('model-menu').querySelector('[aria-selected="true"]').focus();
  }

  function renderEffort() {
    const key = effortKey($('effort').value);
    $('effort-value').textContent = EFFORTS[key].name;
    $('effort-summary').textContent = EFFORTS[key].name;
    $('effort').setAttribute('aria-valuetext', EFFORTS[key].name);
    $('effort').style.setProperty('--range-fill', Number($('effort').value) / 3 * 100 + '%');
    document.querySelectorAll('.effort-ticks span').forEach((tick, index) => tick.classList.toggle('selected', index === Number($('effort').value)));
  }

  function setBusy(busy) {
    if (busy) { closeModelMenu(); closeEffortMenu(); }
    for (const id of ['model', 'effort', 'effort-trigger', 'repository', 'role-trigger']) $(id).disabled = busy;
    $('send').classList.toggle('busy', busy);
    $('send').setAttribute('aria-label', busy ? 'Detener simulación' : 'Enviar mensaje');
    $('send').replaceChildren(icon(busy ? 'stop' : 'arrow'));
    $('prompt').setAttribute('aria-busy', String(busy));
  }

  function cancelRun() {
    if (!running) return;
    clearInterval(running.timer);
    running.record.status = 'cancelled';
    running = null;
    setBusy(false);
    renderConversation(); renderMetrics(); scrollToLatest();
    announce('Simulación detenida. No se realizaron llamadas reales.');
  }

  function submit() {
    if (running) { cancelRun(); return; }
    const prompt = $('prompt').value.trim();
    if (!prompt) { $('prompt').focus(); return; }
    const model = $('model').value;
    const effort = effortKey($('effort').value);
    const duration = EFFORTS[effort].duration;
    const finalUsage = estimateUsage(prompt, model, effort, selectedRole);
    const record = { type: 'assistant', data: makeResponse(selectedRole, currentChat.repository, selectedScope), status: 'running', usage: zeroUsage(), elapsed: 0 };
    if (!currentChat.messages.length) {
      currentChat.title = prompt;
      currentChat.time = timeLabel();
    }
    currentChat.messages.push({ type: 'user', text: prompt, time: timeLabel() }, record);
    $('prompt').value = ''; $('prompt').style.height = '';
    renderConversation(); renderHistory();
    const steps = [...$('messages').querySelectorAll('.trace')].at(-1).querySelectorAll('.trace-step');
    const start = performance.now();
    const run = { record, timer: null };
    running = run;
    setBusy(true);
    announce(ROLES[selectedRole].name + ': simulación iniciada.');
    const update = () => {
      if (running !== run) return;
      const elapsed = performance.now() - start;
      const progress = Math.min(elapsed / duration, 1);
      record.elapsed = elapsed / 1000;
      const input = Math.round(finalUsage.input * Math.min(progress / .66, 1));
      const output = Math.round(finalUsage.output * Math.max(0, (progress - .55) / .45));
      const fraction = (input + output) / finalUsage.total;
      record.usage = { input, output, total: input + output, usd: finalUsage.usd * fraction, credits: Math.ceil(finalUsage.usd * fraction * 100) };
      steps.forEach((step, index) => {
        const done = progress >= (index + 1) / 4;
        const active = !done && progress >= index / 4;
        step.className = 'trace-step ' + (done ? 'done' : active ? 'running' : 'pending');
        const status = step.querySelector('.step-status');
        status.replaceChildren();
        if (done) status.append(icon('check'));
        else if (active) status.append(element('span', 'spinner'));
        else status.textContent = index + 1;
        step.querySelector('.step-duration').textContent = done ? seconds(duration / 4000) : active ? seconds(Math.max(0, elapsed / 1000 - index * duration / 4000)) : '—';
      });
      renderMetrics();
      if (progress >= 1) {
        clearInterval(run.timer);
        record.status = 'done'; record.usage = finalUsage;
        running = null;
        setBusy(false);
        renderConversation(); renderMetrics();
        const answer = [...$('messages').querySelectorAll('.report-card')].at(-1);
        if (answer) {
          const conversation = $('conversation');
          const top = answer.getBoundingClientRect().top - conversation.getBoundingClientRect().top + conversation.scrollTop - 16;
          conversation.scrollTo({ top: Math.max(0, top), behavior: 'smooth' });
        }
        announce('Respuesta de demostración completada. Consumo simulado: ' + number(finalUsage.total) + ' tokens y ' + money(finalUsage.usd) + ' USD.');
      }
    };
    run.timer = setInterval(update, 80);
    update();
    scrollToLatest();
  }

  const treeData = [
    { name: 'Dominio de Negocio', color: '#ffd044', children: ['Estrategia', 'Procesos de Negocio', 'Capacidades', 'Organización'] },
    { name: 'Aplicaciones', color: '#38b6f1', children: ['Catálogo de Aplicaciones', 'Componentes', 'Interfaces'] },
    { name: 'Datos', color: '#9c79f0', children: ['Modelo de Datos', 'Diccionario de Datos'] },
    { name: 'Tecnología', color: '#20bd87', children: ['Infraestructura', 'Plataformas', 'Servicios Tecnológicos'] },
    { name: 'Diagramas', color: '#ffa13d', children: ['Mapa de capacidades', 'Diagrama de aplicaciones'], closed: true },
    { name: 'Paquetes', color: '#9ca8bb', children: ['Arquitectura actual', 'Arquitectura objetivo'], closed: true }
  ];
  const openFolders = new Set(treeData.filter(n => !n.closed).map(n => n.name));
  function renderTree() {
    const query = '';
    const tree = $('tree'); tree.replaceChildren();
    const root = element('button', 'tree-row');
    root.type = 'button'; root.setAttribute('aria-label', 'Seleccionar todo el repositorio');
    const rootChevron = icon('chevron', 'tree-caret'); rootChevron.style.transform = 'rotate(90deg)';
    root.append(rootChevron, icon('database', 'tree-root-icon'), element('span', 'tree-name', currentChat.repository));
    root.addEventListener('click', () => selectScope('Todo el repositorio'));
    tree.append(root);
    const branches = element('div', 'tree-children');
    let matches = 0;
    for (const node of treeData) {
      const parentMatch = node.name.toLocaleLowerCase('es').includes(query);
      const children = query && !parentMatch ? node.children.filter(n => n.toLocaleLowerCase('es').includes(query)) : node.children;
      if (query && !parentMatch && !children.length) continue;
      matches++;
      const group = element('div', 'tree-node');
      const button = element('button', 'tree-row' + (selectedScope === node.name ? ' selected' : ''));
      const isOpen = Boolean(query) || openFolders.has(node.name);
      button.type = 'button'; button.setAttribute('aria-expanded', String(isOpen));
      const folder = element('span', 'folder-icon'); folder.style.setProperty('--folder-color', node.color);
      button.append(icon('chevron', 'tree-caret'), folder, element('span', 'tree-name', node.name));
      button.addEventListener('click', () => {
        if (openFolders.has(node.name)) openFolders.delete(node.name); else openFolders.add(node.name);
        selectScope(node.name);
      });
      group.append(button);
      if (isOpen) {
        const list = element('div', 'tree-children');
        for (const child of children) {
          const leaf = element('button', 'tree-row leaf' + (selectedScope === child ? ' selected' : ''));
          leaf.type = 'button';
          const leafIcon = element('span', 'folder-icon');
          leafIcon.style.setProperty('--folder-color', node.name === 'Dominio de Negocio' ? '#ffd85f' : '#a1aabc');
          leaf.append(icon('chevron', 'tree-caret'), leafIcon, element('span', 'tree-name', child));
          leaf.addEventListener('click', () => selectScope(child));
          list.append(leaf);
        }
        group.append(list);
      }
      branches.append(group);
    }
    if (!matches) branches.append(element('p', 'empty-tree', 'No hay resultados en el repositorio de ejemplo.'));
    tree.append(branches);
  }
  function selectScope(scope) {
    selectedScope = scope;
    $('context-chip').textContent = scope;
    renderTree();
  }

  $('chat-form').addEventListener('submit', event => { event.preventDefault(); submit(); });
  $('prompt').addEventListener('keydown', event => {
    if (event.key === 'Enter' && !event.shiftKey && !event.isComposing) {
      event.preventDefault();
      if (!running) submit();
    }
  });
  $('prompt').addEventListener('input', () => {
    $('prompt').style.height = 'auto';
    $('prompt').style.height = Math.min(110, $('prompt').scrollHeight) + 'px';
  });
  $('new-chat').addEventListener('click', () => createChat());
  document.querySelector('.brand').addEventListener('click', event => { event.preventDefault(); createChat(); });
  $('role-trigger').addEventListener('click', () => {
    closeModelMenu();
    closeEffortMenu();
    const opening = $('role-menu').hidden;
    $('role-menu').hidden = !opening;
    $('role-trigger').setAttribute('aria-expanded', String(opening));
    if (opening) $('role-menu').querySelector('button').focus();
  });
  document.addEventListener('click', event => {
    if (!event.target.closest('.model-control')) closeModelMenu();
    if (!event.target.closest('.effort-field')) closeEffortMenu();
    if (!event.target.closest('.role-wrapper')) { $('role-menu').hidden = true; $('role-trigger').setAttribute('aria-expanded', 'false'); }
    if (!event.target.closest('.context-panel') && !event.target.closest('#context-toggle')) document.body.classList.remove('context-open');
    if (!event.target.closest('.sidebar') && !event.target.closest('#mobile-menu')) document.body.classList.remove('sidebar-open');
  });
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape') {
      const effortWasOpen = !$('effort-menu').hidden;
      closeEffortMenu(effortWasOpen);
      const modelWasOpen = !$('model-menu').hidden;
      closeModelMenu(modelWasOpen);
      const menuWasOpen = !$('role-menu').hidden;
      $('role-menu').hidden = true; $('role-trigger').setAttribute('aria-expanded', 'false');
      document.body.classList.remove('sidebar-open', 'context-open');
      if (menuWasOpen) $('role-trigger').focus();
    }
  });
  $('model').addEventListener('click', () => {
    if ($('model-menu').hidden) openModelMenu();
    else closeModelMenu();
  });
  $('model').addEventListener('keydown', event => {
    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      event.preventDefault();
      openModelMenu();
    }
  });
  $('model-menu').addEventListener('keydown', event => {
    if (!['ArrowDown', 'ArrowUp', 'Home', 'End'].includes(event.key)) return;
    event.preventDefault();
    const options = [...$('model-menu').querySelectorAll('[role="option"]')];
    const index = options.indexOf(document.activeElement);
    const next = event.key === 'Home' ? 0 : event.key === 'End' ? options.length - 1 : (index + (event.key === 'ArrowDown' ? 1 : -1) + options.length) % options.length;
    options[next].focus();
  });
  document.querySelector('.model-control').addEventListener('focusout', event => {
    if (!event.currentTarget.contains(event.relatedTarget)) closeModelMenu();
  });
  $('effort').addEventListener('input', renderEffort);
  function closeEffortMenu(restoreFocus = false) {
    $('effort-menu').hidden = true;
    $('effort-trigger').setAttribute('aria-expanded', 'false');
    if (restoreFocus) $('effort-trigger').focus();
  }
  $('effort-trigger').addEventListener('click', () => {
    const opening = $('effort-menu').hidden;
    closeModelMenu();
    $('role-menu').hidden = true;
    $('role-trigger').setAttribute('aria-expanded', 'false');
    $('effort-menu').hidden = !opening;
    $('effort-trigger').setAttribute('aria-expanded', String(opening));
    if (opening) $('effort').focus();
  });
  document.querySelector('.effort-field').addEventListener('focusout', event => {
    if (!event.currentTarget.contains(event.relatedTarget)) closeEffortMenu();
  });
  $('repository').addEventListener('change', () => {
    if (currentChat.messages.length) createChat();
    else { currentChat.repository = $('repository').value; renderTree(); }
    toast('Repositorio de ejemplo seleccionado.');
  });
  $('context-toggle').addEventListener('click', () => document.body.classList.toggle(matchMedia('(max-width:900px)').matches ? 'context-open' : 'context-hidden'));
  $('mobile-menu').addEventListener('click', () => document.body.classList.toggle('sidebar-open'));
  renderEffort();
  renderModelMenu();
  renderRoleMenu();
  createChat();
})();
