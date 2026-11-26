'use strict';

$(function () {
  const client = window.CoachAuth.getClient();

  const currentPage =
    window.location.pathname.split('/').pop() || 'index.html';

  const publicPages = [
    'index.html',
    'aboutus.html',
    'helpme.html',
    'login.html'
  ];

  const isPublic = publicPages.includes(currentPage);

  let signedIn = false;
  let signingOut = false;
  let authRevision = 0;
  let adminRevision = 0;
  let homeUser;
  const homeAction = $('#home-primary');

  // Crear un enlace y marcar la página actual.
  function link(title, page) {
    const anchor = $('<a>')
      .attr('href', page)
      .addClass('sidebar-link')
      .text(title);

    if (page === currentPage) {
      anchor
        .attr('aria-current', 'page')
        .addClass('active');
    }

    return anchor;
  }

  // Conservar los enlaces de las páginas administrativas.
  // Los permisos reales se siguen validando en el servidor.
  const existingAdminLinks = $('.sidebar a')
    .filter(function () {
      return /^admin-/.test($(this).attr('href') || '');
    })
    .map(function () {
      return {
        title: $(this).text(),
        page: $(this).attr('href')
      };
    })
    .get();

  // Conservar el contenido existente de cada página.
  let main = $('.app-main').first();

  if (main.length) {
    const oldLayout = main.parentsUntil('body').last();

    main.detach();

    if (oldLayout.length) {
      oldLayout.remove();
    }
  } else {
    const publicContent = $('body')
      .children()
      .not('#site-navigation, script, style, link');

    main = $('<main>').addClass('app-main');

    main.append(publicContent);
  }

  // Quitar la navegación anterior.
  $('#site-navigation').empty().addClass('d-none');
  $('.sidebar').remove();

  main.addClass('p-3 p-md-4');

  // Distribución con MDB.
  const layout = $('<div>')
    .addClass('container-fluid p-0');

  const row = $('<div>')
    .addClass('row g-0 min-vh-100');

  const sidebarColumn = $('<div>')
    .addClass('col-12 col-md-3 col-lg-2');

  const contentColumn = $('<div>')
    .addClass('col-12 col-md-9 col-lg-10');

  const sidebar = $('<aside>')
    .addClass('sidebar w-100 h-100');

  const navigation = $('<nav>')
    .attr('aria-label', 'Navegación principal');

  const playerLinks = $('<div>')
    .addClass('d-none pt-2 mt-2 border-top border-secondary');

  const footer = $('<div>')
    .addClass('sidebar-footer pt-3');

  sidebar.append(
    $('<h5>')
      .addClass('sidebar-brand')
      .text('ADAPTIVE RL COACH')
  );

  // Opciones siempre disponibles.
  navigation.append(
    link('Inicio', 'index.html')
  );

  // Opciones que requieren sesión.
  const playerPages = [
    ['Mis partidas', 'replays.html'],
    ['Resultados', 'analisis.html'],
    ['Mi entrenamiento', 'plan.html'],
    ['Mi progreso', 'sesiones.html'],
    ['Objetivos', 'objetivos.html'],
    ['Perfil', 'perfil.html']
  ];

  playerPages.forEach(function ([title, page]) {
    if (page === 'objetivos.html') playerLinks.append($('<p>').addClass('sidebar-group').text('Mi cuenta'));
    playerLinks.append(link(title, page));
  });

  // Opciones administrativas, ocultas hasta comprobar el rol.
  const adminLinks = $('<div>')
    .addClass('d-none');

  adminLinks.append(
    link('Panel de administración', 'admin-resumen.html')
  );

  // Evitar que el enlace al panel se duplique.
  const addedAdminPages = new Set([
    'admin-resumen.html'
  ]);

  existingAdminLinks.forEach(function (item) {
    if (!addedAdminPages.has(item.page)) {
      adminLinks.append(link(item.title, item.page));
      addedAdminPages.add(item.page);
    }
  });

  const information = $('<div>').addClass('sidebar-information').append(
    link('Ayuda', 'helpme.html'), link('Acerca', 'aboutus.html')
  );
  navigation.append(playerLinks, adminLinks, information);

  // El recorrido orienta sin bloquear la navegación entre pantallas.
  const journeyPages = playerPages.slice(0, 4);
  if (journeyPages.some(([, page]) => page === currentPage)) {
    const journey = $('<ol>').addClass('player-journey').attr('aria-label', 'Recorrido del jugador');
    journeyPages.forEach(([title, page], index) => {
      const item = $('<li>');
      const anchor = link((index + 1) + '. ' + title, page).removeClass('sidebar-link');
      const block = new URLSearchParams(window.location.search).get('block_id');
      if (/^[1-9]\d{0,18}$/.test(block || '') && ['analisis.html', 'plan.html'].includes(page)) {
        anchor.attr('href', page + '?' + new URLSearchParams({ block_id: block }));
      }
      item.append(anchor);
      journey.append(item);
    });
    main.prepend(journey);
  }

  const loginLink = link('Ingresar', 'login.html')
    .addClass('d-none');

  const logoutButton = $('<button>')
    .attr({
      type: 'button',
      'data-session-logout': ''
    })
    .addClass('btn-rl btn-rl-outline w-100 d-none')
    .text('Cerrar sesión');

  const status = $('<p>')
    .attr({
      id: 'navigation-status',
      role: 'status',
      'aria-live': 'polite'
    })
    .addClass('text-bray small mt-3 mb-0')
    .css('overflow-wrap', 'anywhere');

  footer.append(
    loginLink,
    logoutButton,
    status
  );

  navigation.attr('id', 'player-navigation');
  const menuButton = $('<button>').attr({ type: 'button', 'aria-controls': 'player-navigation', 'aria-expanded': 'false' })
    .addClass('sidebar-menu-toggle btn-rl btn-rl-outline d-md-none').text('Menú');
  menuButton.on('click', function () {
    const expanded = !sidebar.hasClass('menu-open');
    sidebar.toggleClass('menu-open', expanded);
    menuButton.attr('aria-expanded', String(expanded)).text(expanded ? 'Cerrar menú' : 'Menú');
  });
  sidebar.append(menuButton, navigation, footer);
  sidebarColumn.append(sidebar);
  contentColumn.append(main);

  row.append(sidebarColumn, contentColumn);
  layout.append(row);

  if ($('#site-navigation').length) {
    layout.insertAfter('#site-navigation');
  } else {
    $('body').prepend(layout);
  }

  $('body').addClass('appbody');

  async function updateHome(session) {
    const user = session?.user?.id ?? null;
    if (!homeAction.length || homeUser === user) return;
    homeUser = user;
    function next(title, description, label, href) {
      if (homeUser !== user) return;
      $('#home-title').text(title);
      $('#home-description').text(description);
      homeAction.attr('href', href).text(label);
    }
    $('#home-status').text('');
    if (!user) {
      next('Descubre qué practicar después de jugar.', 'Sube cinco partidas de Rocket League, revisa tus prioridades y prepara un entrenamiento para el tiempo que tienes.', 'Crear cuenta', 'login.html#registro');
      return;
    }
    next('Continúa tu entrenamiento.', 'Sube cinco partidas o consulta tus resultados anteriores.', 'Ir a Mis partidas', 'replays.html');
    const api = window.CoachFollowupService;
    if (!api) return;
    try {
      let profile;
      try { profile = await api.request('/profile'); }
      catch (error) { if (error.status !== 404) throw error; }
      if (homeUser !== user) return;
      if (!window.CoachProfileValidation.validate(profile).valid) {
        next('Primero, configura tu perfil.', 'Indica tu cuenta de juego y cuánto tiempo tienes para entrenar. Así podremos identificar tus partidas.', 'Completar mi perfil', 'perfil.html');
        return;
      }
      const [block] = window.CoachFollowupModel.readyBlocks(await api.blocks());
      if (homeUser !== user) return;
      if (!block) {
        next('Tu siguiente paso: subir 5 partidas.', 'Elige cinco archivos .replay del mismo jugador, modalidad y tipo de partida. Serán tu punto de partida.', 'Subir mis primeras partidas', 'replays.html');
        return;
      }
      const query = new URLSearchParams({ block_id: block.block_id });
      next('Tus resultados están listos.', 'Revisa las prioridades de tu último bloque y prepara una rutina.', 'Ver mis resultados', 'analisis.html?' + query);
      let plan;
      try { plan = await api.request('/blocks/' + encodeURIComponent(block.block_id) + '/plan'); }
      catch (error) { if (error.status !== 404) throw error; }
      if (homeUser !== user) return;
      if (plan?.plan_id && plan.version) {
        query.set('plan_id', plan.plan_id);
        query.set('version', String(plan.version));
        next('Tu entrenamiento está guardado.', 'Consulta los ejercicios de tu último bloque. Después de practicar, registra lo que hiciste en Mi progreso.', 'Continuar mi entrenamiento', 'plan.html?' + query);
      }
    } catch {
      if (homeUser === user) $('#home-status').text('No se pudieron consultar todos tus datos. Puedes volver a intentarlo desde Mis partidas.');
    }
  }

  // Actualizar las opciones sin recrear la barra.
  function updateSession(session) {
    signedIn = Boolean(session);
    void updateHome(session);

    const revision = ++adminRevision;

    adminLinks.addClass('d-none');

    if (session?.access_token) {
      checkAdminAccess(session.access_token, revision);
    }

    playerLinks.toggleClass('d-none', !signedIn);
    loginLink.toggleClass('d-none', signedIn);
    logoutButton.toggleClass('d-none', !signedIn);

    logoutButton.prop(
      'disabled',
      !signedIn || signingOut
    );
  }

  // Consultar el rol real de la cuenta en el servidor.
  async function checkAdminAccess(token, revision) {
    try {
      const account = await $.ajax({
        url: '/api/v1/me',
        method: 'GET',
        dataType: 'json',
        timeout: 15000,
        cache: false,
        headers: {
          Authorization: 'Bearer ' + token
        }
      });

      // Descartar respuestas antiguas tras salir o cambiar de cuenta.
      if (revision !== adminRevision || !signedIn) {
        return;
      }

      adminLinks.toggleClass(
        'd-none',
        account.role !== 'admin' || account.status !== 'active'
      );
    } catch {
      if (revision !== adminRevision || !signedIn) {
        return;
      }

      adminLinks.addClass('d-none');

      status.text(
        'No se pudo comprobar el acceso administrativo. Recarga para reintentar.'
      );
    }
  }

  async function initialize() {
    if (!client) {
      updateSession(null);

      status.text(
        'Falta configurar la conexión de autenticación.'
      );

      return;
    }

    status.text('Comprobando sesión…');

    client.auth.onAuthStateChange(function (event, session) {
      authRevision += 1;

      updateSession(session);
      status.text('');

      if (event === 'SIGNED_OUT' && !isPublic) {
        window.location.replace('login.html');
      }
    });

    const revisionBeforeRead = authRevision;

    try {
      const { data, error } = await client.auth.getSession();

      if (error) {
        throw error;
      }

      // No sobrescribir un cambio de sesión más reciente.
      if (authRevision === revisionBeforeRead) {
        updateSession(data.session);
        status.text('');
      }
    } catch {
      if (authRevision === revisionBeforeRead) {
        updateSession(null);

        status.text(
          'No se pudo comprobar la sesión. Recarga para reintentar.'
        );
      }
    }
  }

  logoutButton.on('click', async function () {
    if (!client || !signedIn || signingOut) {
      return;
    }

    signingOut = true;

    logoutButton.prop('disabled', true);
    status.text('Cerrando sesión…');

    try {
      const { error } = await client.auth.signOut();

      if (error) {
        throw error;
      }

      updateSession(null);
      status.text('Sesión cerrada.');

      if (!isPublic) {
        window.location.replace('login.html');
      }
    } catch {
      status.text(
        'No se pudo cerrar la sesión. Inténtalo de nuevo.'
      );
    } finally {
      signingOut = false;

      logoutButton.prop('disabled', !signedIn);
    }
  });

  initialize();
});