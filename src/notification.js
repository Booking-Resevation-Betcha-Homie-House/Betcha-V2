

document.addEventListener("DOMContentLoaded", () => {
  const dropdown = document.getElementById('notificationDropdown');
  const bellBtn = document.getElementById('notifBellBtnDesktop');
  const notifBadge = document.getElementById('notifBadge');

  const API_BASE = 'https://betcha-api.onrender.com';
  let suppressDropdownCloseOnce = false;

  const READ_CACHE_KEY = 'customerNotifReadIds';
  const getReadCache = () => {
    try {
      const raw = localStorage.getItem(READ_CACHE_KEY);
      const arr = raw ? JSON.parse(raw) : [];
      return new Set(Array.isArray(arr) ? arr : []);
    } catch (_) {
      return new Set();
    }
  };
  
  const addToReadCache = (id) => {
    if (!id) return;
    try {
      const set = getReadCache();
      set.add(id);
      localStorage.setItem(READ_CACHE_KEY, JSON.stringify(Array.from(set)));
    } catch (_) {}
  };

  const resolveCurrentUserId = () => {
    return (
      localStorage.getItem('userId') ||
      localStorage.getItem('userID') ||
      localStorage.getItem('currentUser') ||
      ''
    );
  };

  const formatDateTime = (item) => {
    if (item.dateTimePH) return item.dateTimePH;
    try {
      const d = new Date(item.dateTime);
      if (!isNaN(d.getTime())) {
        return d.toLocaleString('en-PH', { hour12: false });
      }
    } catch (_) {}
    return '';
  };

  const buildNotifItem = (n) => {
    const wrapper = document.createElement('div');
    wrapper.className = `notification ${n.seen ? 'read' : 'unread'} cursor-pointer hover:bg-primary/10 rounded-xl p-3 transition-all duration-300 ease-in-out`;
    wrapper.setAttribute('data-modal-target', 'notifModal');
    
    if (n._id) {
      wrapper.id = `notif-${n._id}`;
      wrapper.dataset.id = n._id;
    }
    
    wrapper.dataset.sender = n.from?.name || 'Unknown';
    wrapper.dataset.datetime = formatDateTime(n);
    wrapper.dataset.message = n.message || '';
    wrapper.dataset.category = n.category || '';

    const isUnread = !n.seen;
    wrapper.innerHTML = `
      <div class="flex items-start gap-2">
        <div class="w-full">
          <div class="flex justify-between">
            <div class="flex gap-2 items-center">
              ${isUnread ? '<div class="dot-notif"></div>' : ''}
              <p class="font-semibold ${isUnread ? 'text-neutral-900' : 'text-neutral-400'}">${n.from?.name || 'Unknown'}</p>
            </div>
            <span class="text-xs text-neutral-400">${formatDateTime(n)}</span>
          </div>
          <p class="text-sm ${isUnread ? 'text-neutral-700' : 'text-neutral-400'} line-clamp-2">${n.message || ''}</p>
        </div>
      </div>
    `;

    wrapper.addEventListener('click', () => {
      suppressDropdownCloseOnce = true;
      
      const modal = document.getElementById('notifModal');
      if (modal) {
        const senderEl = modal.querySelector('#notifSender');
        const dateEl = modal.querySelector('#notifDate');
        const msgEl = modal.querySelector('#notifMessage');
        
        if (senderEl) senderEl.textContent = wrapper.dataset.sender || '';
        if (dateEl) dateEl.textContent = wrapper.dataset.datetime || '';
        if (msgEl) msgEl.textContent = wrapper.dataset.message || '';

        modal.classList.remove('hidden');
        document.body.classList.add('modal-open');
      }

      const id = wrapper.dataset.id || '';
      markAsReadInUI(id);

      if (id) {
        fetch(`${API_BASE}/notify/seen/${id}`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json'
          }
        }).catch(error => {
          console.warn('Failed to mark notification as seen:', error);
        });
      }
    });

    return wrapper;
  };

  const renderNotifications = (list) => {
    const readCache = getReadCache();
    const notifContainers = document.querySelectorAll('#notificationsContainer');

    notifContainers.forEach((c) => {
      c.innerHTML = '';
      const items = list.map((n) => ({ ...n, seen: n.seen || readCache.has(n._id) }));
      
      if (items.length === 0) {
        c.innerHTML = `
          <div class="col-span-full flex items-center justify-center py-6">
            <div class="text-center">
              <p class="text-neutral-500 text-sm">No notifications</p>
            </div>
          </div>
        `;
      } else {
        items.forEach((n) => c.appendChild(buildNotifItem(n)));
      }
    });

    if (notifBadge) {
      const unread = list.filter((n) => {
        return !n.seen && !readCache.has(n._id);
      }).length;
      
      notifBadge.textContent = unread > 99 ? '99+' : String(unread);
      notifBadge.style.display = unread > 0 ? '' : 'none';
    }
  };

  const fetchNotifications = async () => {
    const uid = resolveCurrentUserId();
    if (!uid) {
      console.warn('No user id in localStorage; skipping notifications fetch');
      return;
    }
    
    try {
      const resp = await fetch(`${API_BASE}/notify/to/${uid}`);
      if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
      const json = await resp.json();
      const items = Array.isArray(json?.data) ? json.data : [];
      renderNotifications(items);
    } catch (err) {
      console.error('Failed to fetch notifications:', err);
      renderNotifications([]);
    }
  };

  if (!dropdown || !bellBtn) {
    console.log('Notification dropdown or bell button not found on this page, skipping notification.js setup');
    return;
  }

  bellBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    dropdown.classList.toggle('hidden');
    
    if (!dropdown.classList.contains('hidden')) {
      fetchNotifications();
    }
  });

  document.addEventListener('click', (e) => {
    const anyModalOpen = document.querySelector('.modal:not(.hidden)');
    if (anyModalOpen) return;
    if (suppressDropdownCloseOnce) { suppressDropdownCloseOnce = false; return; }
    const clickedInside = dropdown.contains(e.target) || bellBtn.contains(e.target);
    if (!clickedInside && !dropdown.classList.contains('hidden')) {
      dropdown.classList.add('hidden');
    }
  });

  document.addEventListener('modalClosed', () => {
    suppressDropdownCloseOnce = true;
  });

  fetchNotifications();

  window.fetchNotifications = fetchNotifications;
});

function markAsReadInUI(notificationId) {
  try {
    const items = notificationId
      ? document.querySelectorAll(`.notification[data-id="${CSS.escape(notificationId)}"]`)
      : [];

    items.forEach((item) => {
      if (item.classList.contains('unread')) {
        item.classList.remove('unread');
        item.classList.add('read');
        
        const dot = item.querySelector('.dot-notif');
        if (dot) dot.remove();
        
        item.querySelectorAll('p').forEach((p) => {
          p.classList.remove('text-neutral-900', 'text-neutral-700');
          p.classList.add('text-neutral-400');
        });
      }
    });

    const badge = document.getElementById('notifBadge');
    if (badge && !badge.dataset._lockDecrement) {
      badge.dataset._lockDecrement = 'true';
      const current = parseInt(badge.textContent || '0', 10);
      const next = isFinite(current) ? Math.max(0, current - 1) : 0;
      badge.textContent = next > 99 ? '99+' : String(next);
      badge.style.display = next > 0 ? '' : 'none';
      setTimeout(() => { delete badge.dataset._lockDecrement; }, 100);
    }

    const READ_CACHE_KEY = 'customerNotifReadIds';
    const addToReadCache = (id) => {
      if (!id) return;
      try {
        const raw = localStorage.getItem(READ_CACHE_KEY);
        const arr = raw ? JSON.parse(raw) : [];
        const set = new Set(Array.isArray(arr) ? arr : []);
        set.add(id);
        localStorage.setItem(READ_CACHE_KEY, JSON.stringify(Array.from(set)));
      } catch (_) {}
    };
    
    addToReadCache(notificationId);
  } catch (_) {}
}
