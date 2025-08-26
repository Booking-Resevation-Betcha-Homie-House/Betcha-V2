document.addEventListener("DOMContentLoaded", () => {
  const dropdown = document.getElementById('notificationDropdown');
  const bellBtn = document.getElementById('notifBellBtnDesktop');
  const notifBadge = document.getElementById('notifBadge');

  const API_BASE = 'https://betcha-api.onrender.com';
  // Prevent the dropdown from auto-closing on the very next outside click
  // when a modal was opened/closed from within the dropdown
  let suppressDropdownCloseOnce = false;

  const READ_CACHE_KEY = 'notifReadIds';
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

  // Resolve current user id (admin) from localStorage
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

  // Build notification DOM node
  const buildNotifItem = (n) => {
    const wrapper = document.createElement('div');
    wrapper.className = `notification ${n.seen ? 'read' : 'unread'} cursor-pointer hover:bg-primary/10 rounded-xl p-3 transition-all duration-300 ease-in-out`;
    // Route to cancel modal if category is cancellation request
    const isCancel = (n.category || '').toLowerCase() === 'cancellation request';
    wrapper.setAttribute('data-modal-target', isCancel ? 'cancelModal' : 'notifModal');
         if (n._id) {
       wrapper.id = `notif-${n._id}`;
       wrapper.dataset.id = n._id;
     }
    wrapper.dataset.sender = n.from?.name || 'Unknown';
    wrapper.dataset.fromId = n.from?.fromId || '';
    wrapper.dataset.fromRole = n.from?.role || '';
    wrapper.dataset.datetime = formatDateTime(n);
    wrapper.dataset.message = n.message || '';
    wrapper.dataset.category = n.category || '';
    wrapper.dataset.transNo = n.transNo || '';
    wrapper.dataset.amountRefund = n.amountRefund != null ? String(n.amountRefund) : '';
    wrapper.dataset.mode = n.modeOfRefund || n.mode || '';
    wrapper.dataset.number = n.numberEwalletBank || n.number || '';
    // Normalize bookingId to a plain string id
    (function() {
      try {
        let bid = '';
        if (n && Object.prototype.hasOwnProperty.call(n, 'bookingId')) {
          if (typeof n.bookingId === 'string') {
            bid = n.bookingId;
          } else if (n.bookingId && typeof n.bookingId === 'object') {
            bid = n.bookingId._id || n.bookingId.id || '';
          } else if (n.bookingId != null) {
            bid = String(n.bookingId);
          }
        }
        wrapper.dataset.bookingId = bid || '';
      } catch (e) {
        wrapper.dataset.bookingId = '';
      }
    })();

    const isUnread = !n.seen;
    wrapper.innerHTML = `
      <div class="flex items-start gap-2">
        <div>
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

          // Fill detailed modal on click (before modal.js opens it)
      wrapper.addEventListener('click', () => {
        suppressDropdownCloseOnce = true;
        const category = (wrapper.dataset.category || '').toLowerCase();
        if (category === 'cancellation request') {
          const cModal = document.getElementById('cancelModal');
          if (cModal) {
            // Store notification and booking IDs in modal data attributes
            cModal.dataset.notificationId = wrapper.dataset.id || '';
            cModal.dataset.bookingId = wrapper.dataset.bookingId || '';
            cModal.dataset.fromId = wrapper.dataset.fromId || '';
            
            console.log('Modal data stored:', {
              notificationId: wrapper.dataset.id,
              bookingId: wrapper.dataset.bookingId
            });
            
            // Fetch and log booking details when modal opens
            const bookingId = wrapper.dataset.bookingId;
            if (bookingId) {
              console.log('📋 Fetching booking details when modal opens...');
              fetch(`${API_BASE}/booking/${bookingId}`)
                .then(response => response.json())
                .then(bookingData => {
                  if (bookingData.success && bookingData.booking) {
                    const booking = bookingData.booking;
                    console.log('📊 BOOKING DETAILS WHEN MODAL OPENS:', {
                      bookingId: booking._id,
                      transNo: booking.transNo,
                      guestName: booking.guestName,
                      propertyName: booking.propertyName,
                      currentStatus: booking.status,
                      checkIn: booking.checkIn,
                      checkOut: booking.checkOut,
                      totalFee: booking.totalFee,
                      paymentCategory: booking.paymentCategory,
                      reservationFee: booking.reservationFee,
                      packageFee: booking.packageFee,
                      modeOfPayment: booking.reservation?.modeOfPayment || booking.package?.modeOfPayment,
                      paymentNo: booking.reservation?.paymentNo || booking.package?.paymentNo,
                      numberEwalletBank: booking.reservation?.numberBankEwallets || booking.package?.numberBankEwallets,
                      createdAt: booking.createdAt,
                      updatedAt: booking.updatedAt
                    });
                  } else {
                    console.warn('⚠️ Could not fetch booking details when modal opens:', bookingData);
                  }
                })
                .catch(fetchError => {
                  console.error('❌ Error fetching booking details when modal opens:', fetchError);
                });
            } else {
              console.log('⚠️ No booking ID available when modal opens - cannot fetch booking details');
            }
            
            const sender = cModal.querySelector('#notifSender');
            const date = cModal.querySelector('#notifDate');
            const msg = cModal.querySelector('#notifMessage');
            // Try explicit ids first
            const trans = cModal.querySelector('#cancel-transNo, #transNo');
            const amount = cModal.querySelector('#cancel-amountRefund');
            const mode = cModal.querySelector('#cancel-mode');
            const number = cModal.querySelector('#cancel-number');
            if (sender) sender.textContent = wrapper.dataset.sender || '';
            if (date) date.textContent = wrapper.dataset.datetime || '';
            if (msg) msg.textContent = wrapper.dataset.message || '';
            if (trans) trans.textContent = wrapper.dataset.transNo || '';
            if (amount) amount.textContent = wrapper.dataset.amountRefund || '';
            if (mode) mode.textContent = wrapper.dataset.mode || '';
            if (number) number.textContent = wrapper.dataset.number || '';

          // Fallbacks for templates without explicit ids
          // 1) Transaction no. title line
          if (!trans) {
            const txnTitle = Array.from(cModal.querySelectorAll('p')).find(p => (p.textContent || '').trim().toLowerCase().startsWith('transaction no'));
            if (txnTitle && wrapper.dataset.transNo) {
              txnTitle.textContent = `Transaction no. ${wrapper.dataset.transNo}`;
            }
          }
          // 2) Detail rows (Refund amount, Mode of refund, Number)
          const detailContainer = Array.from(cModal.querySelectorAll('.border')).find(div => div.querySelector('.flex.justify-between.items-center'));
          if (detailContainer) {
            const rows = detailContainer.querySelectorAll('.flex.justify-between.items-center');
            // Refund amount row (0)
            if (rows[0]) {
              const valueEl = rows[0].querySelector('p:last-child, span');
              if (valueEl && wrapper.dataset.amountRefund) {
                const amt = Number(wrapper.dataset.amountRefund);
                const formatted = isFinite(amt) ? `₱ ${amt.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : wrapper.dataset.amountRefund;
                valueEl.textContent = formatted;
              }
            }
            // Mode of refund row (1)
            if (rows[1]) {
              const valueEl = rows[1].querySelector('p:last-child');
              if (valueEl && wrapper.dataset.mode) valueEl.textContent = wrapper.dataset.mode;
            }
            // Number row (2)
            if (rows[2]) {
              const valueEl = rows[2].querySelector('p:last-child');
              if (valueEl && wrapper.dataset.number) valueEl.textContent = wrapper.dataset.number;
            }
          }
        }
      } else {
        const modal = document.getElementById('notifModal');
        if (modal) {
          const senderEl = modal.querySelector('#notifSender');
          const dateEl = modal.querySelector('#notifDate');
          const msgEl = modal.querySelector('#notifMessage');
          if (senderEl) senderEl.textContent = wrapper.dataset.sender || '';
          if (dateEl) dateEl.textContent = wrapper.dataset.datetime || '';
          if (msgEl) msgEl.textContent = wrapper.dataset.message || '';
        }
      }

      // Optimistically mark as read and update badge/unified duplicates
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

  // Render notifications into all matching containers in the page (desktop dropdown + small modal list)
  const renderNotifications = (list) => {
    const readCache = getReadCache();
    const notifContainers = document.querySelectorAll('#notificationsContainer');
    const cancelContainers = document.querySelectorAll('#cancelContainer');

    notifContainers.forEach((c) => {
      c.innerHTML = '';
      const items = list
        .filter((n) => (n.category || '').toLowerCase() !== 'cancellation request')
        .map((n) => ({ ...n, seen: n.seen || readCache.has(n._id) }));
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

    cancelContainers.forEach((c) => {
      c.innerHTML = '';
      const items = list
        .filter((n) => {
          const isCancellationRequest = (n.category || '').toLowerCase() === 'cancellation request';
          const isNotProcessed = !n.statusRejection || n.statusRejection === 'Pending';
          return isCancellationRequest && isNotProcessed;
        })
        .map((n) => ({ ...n, seen: n.seen || readCache.has(n._id) }));
      if (items.length === 0) {
        c.innerHTML = `
          <div class="col-span-full flex items-center justify-center py-6">
            <div class="text-center">
              <p class="text-neutral-500 text-sm">No pending cancellation requests</p>
            </div>
          </div>
        `;
      } else {
        items.forEach((n) => c.appendChild(buildNotifItem(n)));
      }
    });

    // Update badge with unread count (cap at 99+)
    if (notifBadge) {
      const unread = list.filter((n) => {
        const isUnread = !n.seen && !readCache.has(n._id);
        const isCancellationRequest = (n.category || '').toLowerCase() === 'cancellation request';
        const isProcessedCancellation = isCancellationRequest && n.statusRejection && n.statusRejection !== 'Pending';
        
        // Count as unread only if it's unread AND not a processed cancellation request
        return isUnread && !isProcessedCancellation;
      }).length;
      notifBadge.textContent = unread > 99 ? '99+' : String(unread);
      notifBadge.style.display = unread > 0 ? '' : 'none';
    }
  };

  // Fetch notifications for current user
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
      // Initialize tab behavior (scoped) for this dropdown container
      initializeScopedTabs(dropdown);
    }
  });

  // Hide dropdown when clicking outside
  document.addEventListener('click', (e) => {
    // If any modal is open, do not auto-close the dropdown
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

  // Initial prefetch so mobile modal has content too
  fetchNotifications();
  // Initialize scoped tabs for all notification tab groups (desktop + small modal)
  initializeAllNotificationTabs();
  
  // Make fetchNotifications globally accessible for other scripts
  window.fetchNotifications = fetchNotifications;
});

// Initialize tabs within a specific notification container
function initializeScopedTabs(container) {
  if (!container) return;
  // Find the nearest data-tab-group containers that include notifications UI
  const groups = container.matches('[data-tab-group]') ? [container] : container.querySelectorAll('[data-tab-group]');
  groups.forEach((group) => {
    // Only handle groups that contain our notifications containers
    if (!group.querySelector('#notificationsContainer') && !group.querySelector('#cancelContainer')) return;

    const tabButtons = group.querySelectorAll('.tab-btn');
    const contents = group.querySelectorAll('.tab-content');
    if (tabButtons.length < 2 || contents.length < 2) return;

    const activate = (idx) => {
      tabButtons.forEach((btn, i) => {
        if (i === idx) {
          btn.classList.add('bg-white', 'text-primary', 'font-semibold', 'shadow');
          btn.classList.remove('text-neutral-500');
        } else {
          btn.classList.remove('bg-white', 'text-primary', 'font-semibold', 'shadow');
          btn.classList.add('text-neutral-500');
        }
      });
      contents.forEach((c, i) => {
        if (i === idx) c.classList.remove('hidden'); else c.classList.add('hidden');
      });
    };

    // Bind click handlers (override inline to be scoped)
    tabButtons.forEach((btn, i) => {
      btn.addEventListener('click', (ev) => {
        ev.stopPropagation();
        activate(i);
      });
    });

    // Default to first tab visible
    activate(0);
  });
}

function initializeAllNotificationTabs() {
  // Desktop dropdowns and small modals may already be in DOM; set up both.
  const candidates = document.querySelectorAll('[data-tab-group]');
  candidates.forEach((c) => initializeScopedTabs(c));
}

// Optimistically mark a notification as read across the page and update badge
function markAsReadInUI(notificationId) {
  try {
    // Update all duplicates by data-id
    const items = notificationId
      ? document.querySelectorAll(`.notification[data-id="${CSS.escape(notificationId)}"]`)
      : [];

    items.forEach((item) => {
      if (item.classList.contains('unread')) {
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

    // Decrement badge once
    const badge = document.getElementById('notifBadge');
    if (badge && !badge.dataset._lockDecrement) {
      // Use a lock per notification to avoid multiple decrements in duplicate elements
      badge.dataset._lockDecrement = 'true';
      const current = parseInt(badge.textContent || '0', 10);
      const next = isFinite(current) ? Math.max(0, current - 1) : 0;
      badge.textContent = next > 99 ? '99+' : String(next);
      badge.style.display = next > 0 ? '' : 'none';
      // Release lock shortly so subsequent different clicks can decrement
      setTimeout(() => { delete badge.dataset._lockDecrement; }, 100);
    }

    // Persist read so future refresh/fetch keeps it read
    addToReadCache(notificationId);
  } catch (_) {}
}
