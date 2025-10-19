// Customer/Guest Notification System
// Simplified notification viewing functionality for customers

// Add custom scrollbar styles for notification modal
const style = document.createElement('style');
style.textContent = `
  #notifModal .overflow-y-auto::-webkit-scrollbar {
    width: 8px;
  }
  #notifModal .overflow-y-auto::-webkit-scrollbar-track {
    background: transparent;
    border-radius: 0 12px 12px 0;
  }
  #notifModal .overflow-y-auto::-webkit-scrollbar-thumb {
    background: #d1d5db;
    border-radius: 4px;
  }
  #notifModal .overflow-y-auto::-webkit-scrollbar-thumb:hover {
    background: #9ca3af;
  }
`;
document.head.appendChild(style);

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

  // Resolve current customer user id from localStorage
  const resolveCurrentUserId = () => {
    return (
      localStorage.getItem('userId') ||
      localStorage.getItem('userID') ||
      localStorage.getItem('currentUser') ||
      ''
    );
  };

  // Format to human-friendly PH time
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

  // Build notification DOM node for customers
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

    // Fill detailed modal on click
    wrapper.addEventListener('click', async () => {
      suppressDropdownCloseOnce = true;
      
      const modal = document.getElementById('notifModal');
      if (modal) {
        // Fix modal wrapper classes for proper display
        const modalWrapper = modal.querySelector('.w-full.h-full.bg-background');
        if (modalWrapper) {
          // Ensure rounded corners on desktop
          if (!modalWrapper.classList.contains('rounded-3xl')) {
            modalWrapper.classList.remove('md:rounded-3xl');
            modalWrapper.classList.add('md:rounded-3xl');
          }
          // Fix overflow for scrolling
          if (modalWrapper.classList.contains('overflow-hidden')) {
            modalWrapper.classList.remove('overflow-hidden');
          }
        }
        
        const senderEl = modal.querySelector('#notifSender');
        const dateEl = modal.querySelector('#notifDate');
        const msgEl = modal.querySelector('#notifMessage');
        
        if (senderEl) senderEl.textContent = wrapper.dataset.sender || '';
        if (dateEl) dateEl.textContent = wrapper.dataset.datetime || '';
        
        // Check if message contains Refund ID
        const message = wrapper.dataset.message || '';
        const refundIdMatch = message.match(/Refund ID:\s*([a-f0-9]{24})/i);
        
        if (msgEl) {
          // Replace \n with <br> to support newlines
          msgEl.innerHTML = message.replace(/\n/g, '<br>');
        }
        
        // Remove any existing refund details section
        const existingRefundSection = modal.querySelector('#refundDetailsSection');
        if (existingRefundSection) {
          existingRefundSection.remove();
        }
        
        // Ensure the content wrapper has scrolling enabled and is properly structured
        const contentWrapper = msgEl?.closest('.flex.flex-col.items-start');
        if (contentWrapper) {
          // Change from items-start to items-stretch for full width
          contentWrapper.classList.remove('items-start');
          contentWrapper.classList.add('items-stretch');
          
          // Move scrolling to the content wrapper itself (not parent)
          if (!contentWrapper.classList.contains('overflow-y-auto')) {
            contentWrapper.classList.add('overflow-y-auto');
            contentWrapper.classList.add('flex-1'); // Allow it to take available space
            contentWrapper.style.maxHeight = '100%';
            // Custom scrollbar styling
            contentWrapper.style.paddingRight = '12px';
          }
          
          // Ensure parent container doesn't have overflow-y-auto
          const modalContent = contentWrapper.parentElement;
          if (modalContent) {
            modalContent.classList.remove('overflow-y-auto');
            modalContent.classList.remove('overflow-hidden');
            // Keep flex-col structure
            if (!modalContent.classList.contains('flex-col')) {
              modalContent.classList.add('flex-col');
            }
          }
        }
        
        // If Refund ID is found, fetch and display refund details
        if (refundIdMatch) {
          const refundId = refundIdMatch[1];
          await fetchAndDisplayRefundDetails(refundId, modal);
        }
        
        // Open the modal
        modal.classList.remove('hidden');
        document.body.classList.add('modal-open');
      }

      // Mark as read
      const id = wrapper.dataset.id || '';
      markAsReadInUI(id);
      
      // Mark notification as seen on server
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

  // Render notifications for customers
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

    // Update badge with unread count
    if (notifBadge) {
      const unread = list.filter((n) => {
        return !n.seen && !readCache.has(n._id);
      }).length;
      
      notifBadge.textContent = unread > 99 ? '99+' : String(unread);
      notifBadge.style.display = unread > 0 ? '' : 'none';
    }
  };

  // Fetch notifications for current customer
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

  // Toggle dropdown
  bellBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    dropdown.classList.toggle('hidden');
    // Refresh when opened
    if (!dropdown.classList.contains('hidden')) {
      fetchNotifications();
    }
  });

  // Hide dropdown when clicking outside
  document.addEventListener('click', (e) => {
    const anyModalOpen = document.querySelector('.modal:not(.hidden)');
    if (anyModalOpen) return;
    if (suppressDropdownCloseOnce) { suppressDropdownCloseOnce = false; return; }
    const clickedInside = dropdown.contains(e.target) || bellBtn.contains(e.target);
    if (!clickedInside && !dropdown.classList.contains('hidden')) {
      dropdown.classList.add('hidden');
    }
  });

  // When any modal closes, suppress the immediate outside-close once
  document.addEventListener('modalClosed', () => {
    suppressDropdownCloseOnce = true;
  });

  // Initial fetch
  fetchNotifications();
  
  // Make fetchNotifications globally accessible for other scripts
  window.fetchNotifications = fetchNotifications;
});

// Fetch refund details and display in notification modal
async function fetchAndDisplayRefundDetails(refundId, modal) {
  try {
    const API_BASE = 'https://betcha-api.onrender.com';
    const response = await fetch(`${API_BASE}/refund/${refundId}`);
    
    if (!response.ok) {
      console.error('Failed to fetch refund details:', response.status);
      return;
    }
    
    const data = await response.json();
    const refund = data.refund || data.data || data;
    
    if (!refund) {
      console.error('No refund data found');
      return;
    }
    
    // Create refund details section
    const refundSection = document.createElement('div');
    refundSection.id = 'refundDetailsSection';
    refundSection.className = 'mt-5 pt-5 border-t border-neutral-300';
    refundSection.innerHTML = `
      <h3 class="text-base font-semibold text-primary-text mb-4">Refund Details</h3>
      <div class="bg-neutral-50 rounded-2xl p-4 space-y-3 border border-neutral-200">
        <div class="flex justify-between items-center py-2">
          <span class="text-sm font-medium text-neutral-600">Amount</span>
          <span class="text-base font-bold text-primary-text">₱${parseFloat(refund.amount || 0).toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
        </div>
        <div class="h-px bg-neutral-200"></div>
        <div class="flex justify-between items-center py-2">
          <span class="text-sm font-medium text-neutral-600">Status</span>
          <span class="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-700 shadow-sm">
            ✓ Refunded
          </span>
        </div>
        ${refund.image ? `
          <div class="h-px bg-neutral-200"></div>
          <div class="pt-2">
            <span class="text-sm font-medium text-neutral-600 block mb-3">Proof of Refund</span>
            <div class="relative w-full rounded-xl overflow-hidden border border-neutral-300 shadow-sm hover:shadow-md transition-all duration-300 bg-white">
              <img src="${refund.image}" alt="Refund Proof" class="w-full h-auto object-contain cursor-pointer" onclick="window.open('${refund.image}', '_blank')" style="max-height: 400px;" />
            </div>
          </div>
        ` : ''}
      </div>
    `;
    
    // Insert after the message element
    const messageEl = modal.querySelector('#notifMessage');
    if (messageEl && messageEl.parentNode) {
      messageEl.parentNode.appendChild(refundSection);
    }
    
  } catch (error) {
    console.error('Error fetching refund details:', error);
  }
}

// Mark a notification as read in UI
function markAsReadInUI(notificationId) {
  try {
    const items = notificationId
      ? document.querySelectorAll(`.notification[data-id="${CSS.escape(notificationId)}"]`)
      : [];

    let wasActuallyUnread = false;

    items.forEach((item) => {
      if (item.classList.contains('unread')) {
        wasActuallyUnread = true;
        item.classList.remove('unread');
        item.classList.add('read');
        // Remove the unread dot if present
        const dot = item.querySelector('.dot-notif');
        if (dot) dot.remove();
        // Gray out text
        item.querySelectorAll('p').forEach((p) => {
          p.classList.remove('text-neutral-900', 'text-neutral-700');
          p.classList.add('text-neutral-400');
        });
      }
    });

    // Only decrement badge if notification was actually unread
    const badge = document.getElementById('notifBadge');
    if (badge && wasActuallyUnread && !badge.dataset._lockDecrement) {
      badge.dataset._lockDecrement = 'true';
      const current = parseInt(badge.textContent || '0', 10);
      const next = isFinite(current) ? Math.max(0, current - 1) : 0;
      badge.textContent = next > 99 ? '99+' : String(next);
      badge.style.display = next > 0 ? '' : 'none';
      setTimeout(() => { delete badge.dataset._lockDecrement; }, 100);
    }

    // Persist read status only if it was actually unread
    if (wasActuallyUnread) {
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
    }
  } catch (_) {}
}
