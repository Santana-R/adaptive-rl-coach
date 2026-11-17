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
    .addClass('d-none');

  const footer = $('<div>')
    .addClass('sidebar-footer pt-3');

  sidebar.append(
    $('<h5>')
      .addClass('sidebar-brand')
      .text('ADAPTIVE RL COACH')
  );

  // Opciones siempre disponibles.
  navigation.append(
    link('Inicio', 'index.html'),
    link('Acerca', 'aboutus.html'),
    link('Ayuda', 'helpme.html')
  );

  // Opciones que requieren sesión.
  const playerPages = [
    ['Perfil', 'perfil.html'],
    ['Replays', 'replays.html'],
    ['Análisis', 'analisis.html'],
    ['Objetivos', 'objetivos.html'],
    ['Plan', 'plan.html'],
    ['Sesiones', 'sesiones.html']
  ];

  playerPages.forEach(function ([title, page]) {
    playerLinks.append(link(title, page));
  });

  existingAdminLinks.forEach(function (item) {
    playerLinks.append(link(item.title, item.page));
  });

  navigation.append(playerLinks);

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

  sidebar.append(navigation, footer);
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

  // Actualizar opciones sin recrear la barra.
  function updateSession(session) {
    signedIn = Boolean(session);

    playerLinks.toggleClass('d-none', !signedIn);
    loginLink.toggleClass('d-none', signedIn);
    logoutButton.toggleClass('d-none', !signedIn);

    logoutButton.prop(
      'disabled',
      !signedIn || signingOut
    );
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

      // Evitar sobrescribir un cambio de sesión más reciente.
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