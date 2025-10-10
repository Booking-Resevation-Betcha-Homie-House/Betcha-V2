// Admin Notification System
// Consolidated notification functionality for admin and employee pages

// API Base URL - Use window property to avoid duplicate identifier errors
window.API_BASE = window.API_BASE || 'https://betcha-api.onrender.com';

document.addEventListener("DOMContentLoaded", () => {
    const dropdown = document.getElementById('notificationDropdown');
    const bellBtn = document.getElementById('notifBellBtnDesktop');
    const notifBadge = document.getElementById('notifBadge');
    // Prevent the dropdown from auto-closing on the very next outside click
    // when a modal was opened/closed from within the dropdown
    let suppressDropdownCloseOnce = false;

    const READ_CACHE_KEY = 'notifReadIds';
    const getReadCache = () => {
        try {
            const raw = localStorage.getItem(READ_CACHE_KEY);
            const arr = raw ? JSON.parse(raw) : [];
            return new Set(Array.isArray(arr) ? arr : []);
        } catch {
            return new Set();
        }
    };
    window.addToReadCache = (id) => {
        if (!id) return;
        try {
            const set = getReadCache();
            set.add(id);
            localStorage.setItem(READ_CACHE_KEY, JSON.stringify(Array.from(set)));
        } catch {
            // Failed to save to cache
        }
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
        } catch {
            // Invalid date format
        }
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
            } catch {
                wrapper.dataset.bookingId = '';
            }
        })();

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

                    // Reset action buttons to default state each time modal opens
                    try {
                        const approveBtn = document.getElementById('approveCancelBtn');
                        const approveLbl = document.getElementById('approveLabel');
                        if (approveBtn && approveLbl) {
                            approveBtn.disabled = false;
                            approveLbl.textContent = 'Approve';
                        }
                        const rejectBtn = document.getElementById('cancelRejectBtn');
                        const rejectLbl = document.getElementById('rejectLabel');
                        if (rejectBtn && rejectLbl) {
                            rejectBtn.disabled = false;
                            rejectLbl.textContent = 'Reject';
                        }
                    } catch {
                        // Failed to reset buttons
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
                fetch(`${window.API_BASE}/notify/seen/${id}`, {
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
            const resp = await fetch(`${window.API_BASE}/notify/to/${uid}`);
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
        
        // Close menu dropdown if it's open
        const menuDropdown = document.getElementById('dropdownMenu');
        if (menuDropdown && !menuDropdown.classList.contains('hidden')) {
            menuDropdown.classList.add('hidden');
        }
        
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
    const groups = container.matches('[data-tab-group="notification"]') ? [container] : container.querySelectorAll('[data-tab-group="notification"]');
    groups.forEach((group) => {
        // Only handle groups that contain our notifications containers
        if (!group.querySelector('#notificationsContainer') && !group.querySelector('#cancelContainer')) return;

        const tabButtons = group.querySelectorAll('.notif-tab-btn');
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
    const candidates = document.querySelectorAll('[data-tab-group="notification"]');
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
        window.addToReadCache(notificationId);
    } catch {
        // Failed to mark as read in UI
    }
}

// Admin-specific notification functions

// Show notification success message
function showNotificationSuccess(message) {
    // You can implement a toast notification system here
    console.log('✅ Success:', message);
    if (typeof window.showToastSuccess === 'function') {
        window.showToastSuccess(message);
    }
}

// Show notification error message
function showNotificationError(message) {
    // You can implement a toast notification system here
    console.error('❌ Error:', message);
    if (typeof window.showToastError === 'function') {
        window.showToastError(message);
    }
}

// Update notification status (Reject or Accept cancellation request)
async function updateNotificationStatus(notifId, statusRejection) {
    try {
        if (!notifId) {
            throw new Error('Notification ID is required');
        }

        if (!['Rejected', 'Complete'].includes(statusRejection)) {
            throw new Error('Status must be either "Rejected" or "Complete"');
        }

        const url = `${window.API_BASE}/notify/status-rejection/${notifId}`;
        const body = { statusRejection };



        const response = await fetch(url, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(body)
        });

        if (!response.ok) {
            const errorText = await response.text().catch(() => 'Unknown error');
            throw new Error(`HTTP error! status: ${response.status} - ${errorText}`);
        }

        const result = await response.json();


        // Show success message
        showNotificationSuccess(`Cancellation request ${statusRejection.toLowerCase()} successfully`);

        return result;

    } catch (error) {
        console.error('❌ Error updating notification status:', error);

        // Show error message
        showNotificationError(`Failed to update notification status: ${error.message}`);

        throw error;
    }
}

// Cancel booking function
async function cancelBooking(bookingId) {
    try {
        if (!bookingId) {
            throw new Error('Booking ID is required');
        }
        
        const url = `${window.API_BASE}/booking/update-status/${bookingId}`;
        const body = { status: 'Cancel' };

        
        const response = await fetch(url, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(body)
        });
        
        if (!response.ok) {
            const errorText = await response.text().catch(() => 'Unknown error');
            throw new Error(`HTTP error! status: ${response.status} - ${errorText}`);
        }
        
        const result = await response.json();

        // Log booking cancellation audit
        try {
            if (window.AuditTrailFunctions) {
                const userData = JSON.parse(localStorage.getItem('userData') || '{}');
                const userId = userData._id || userData.userId || userData.user_id || 'unknown';
                let userType = userData.userType || userData.role || 'admin';
                
                // Normalize userType to match API expectations
                if (userType.toLowerCase() === 'admin') {
                    userType = 'Admin';
                } else if (userType.toLowerCase() === 'employee') {
                    userType = 'Employee';
                } else if (userType.toLowerCase() === 'guest') {
                    userType = 'Guest';
                } else {
                    userType = 'Admin'; // Default fallback
                }
                
                await window.AuditTrailFunctions.logBookingCancellation(userId, userType);
            }
        } catch (auditError) {
            console.error('Audit trail error:', auditError);
        }
        
        // Show success message
        showNotificationSuccess('Booking cancelled successfully');
        
        return result;
        
    } catch (error) {
        console.error('❌ Error cancelling booking:', error);
        
        // Show error message
        showNotificationError(`Failed to cancel booking: ${error.message}`);
        
        throw error;
    }
}

// Handle cancellation request workflow
async function handleCancellationRequest(notifId, bookingId, action) {
    try {
        
        if (action === 'accept') {
            // Admin accepts cancellation
            if (!bookingId) {
                throw new Error('Booking ID is required when accepting cancellation');
            }
            
            const notifResult = await updateNotificationStatus(notifId, 'Complete');
            const bookingResult = await cancelBooking(bookingId);
            
            return {
                success: true,
                action: 'accepted',
                notification: notifResult,
                booking: bookingResult,
                message: 'Cancellation request accepted and booking cancelled'
            };
            
        } else if (action === 'reject') {
            const notifResult = await updateNotificationStatus(notifId, 'Rejected');
            
            return {
                success: true,
                action: 'rejected',
                notification: notifResult,
                message: 'Cancellation request rejected'
            };
            
        } else {
            throw new Error('Invalid action. Must be "accept" or "reject"');
        }
        
    } catch (error) {
        console.error('❌ Error handling cancellation request:', error);
        
        // Show error message
        showNotificationError(`Failed to process cancellation request: ${error.message}`);
        
        throw error;
    }
}

// Initialize static modal buttons for cancellation management
function initializeStaticModalButtons() {
    const rejectBtn = document.getElementById('cancelRejectBtn');
    const rejectLbl = document.getElementById('rejectLabel');
    if (rejectBtn && rejectLbl) {
        
        rejectBtn.addEventListener('click', async function(e) {
            e.preventDefault();

            // Declare originalText outside try block to avoid scope issues
            const originalText = rejectLbl.textContent;
            
            try {
                // Get notification data from the modal
                const modal = document.getElementById('cancelModal');
                if (!modal) {
                    throw new Error('Cancel modal not found');
                }
                
                const notifId = modal.dataset.notificationId;
                if (!notifId) {
                    throw new Error('No notification ID found in modal data');
                }
                

                
                // Get booking ID from modal data
                let bookingId = modal.dataset.bookingId;

                
                // If no booking ID, try to get it from transaction number
                if (!bookingId) {
                    const transNo = modal.querySelector('#cancel-transNo, #transNo')?.textContent?.replace('Transaction no. ', '') || 
                                   modal.querySelector('[data-trans-no]')?.textContent;

                    
                    if (transNo) {
                        try {

                            const searchResponse = await fetch(`${window.API_BASE}/booking/trans/${encodeURIComponent(transNo)}`);
                            const searchData = await searchResponse.json();
                            
                            if (searchData && (searchData.booking || searchData.data)) {
                                const b = searchData.booking || searchData.data;
                                bookingId = b._id || b.id || b.bookingId || '';

                                if (bookingId) modal.dataset.bookingId = bookingId;
                            }
                        } catch {
                            // Failed to search by transaction number
                        }
                    }
                }
                

                
                // Disable button during processing
                rejectBtn.disabled = true;
                rejectLbl.textContent = 'Processing...';
                
                // Update notification status to "Rejected"
                await updateNotificationStatus(notifId, 'Rejected');

                // Send a static message back to the requester about rejection
                try {
                    const fromId = localStorage.getItem('adminId') || localStorage.getItem('userId') || 'admin-user';
                    const fromName = localStorage.getItem('adminName') || `${localStorage.getItem('firstName') || 'Admin'} ${localStorage.getItem('lastName') || 'User'}`.trim();
                    const toId = modal.dataset.fromId || '';
                    const toName = 'Employee';
                    const payload = {
                        fromId,
                        fromName,
                        fromRole: 'admin',
                        toId,
                        toName,
                        toRole: 'employee',
                        message: 'Your cancellation request has been reviewed and rejected by the admin. The booking will remain active. This thread does not accept replies. For any concerns, please reach out to the admin via the designated support channel.'
                    };

                    const msgResp = await fetch(`${window.API_BASE}/notify/message`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(payload)
                    });
                    await msgResp.json().catch(() => ({}));

                } catch (msgErr) {
                    console.warn('⚠️ Failed to send rejection message:', msgErr);
                }
                
                // Close the modal
                const closeBtn = modal.querySelector('[data-close-modal]');
                if (closeBtn) {
                    closeBtn.click();
                }
                
                // Refresh notifications to update the UI
                if (typeof window.fetchNotifications === 'function') {
                    window.fetchNotifications();
                }
                

                
            } catch (error) {
                console.error('❌ Error rejecting cancellation request:', error);
                showNotificationError(`Failed to reject cancellation: ${error.message}`);
            } finally {
                // Re-enable button
                rejectBtn.disabled = false;
                rejectLbl.textContent = originalText;
            }
        });
        
    }
    
    const approveBtn = document.getElementById('approveCancelBtn');
    const approvelbl = document.getElementById('approveLabel');
    if (approveBtn && approvelbl) {
        
        approveBtn.addEventListener('click', async function(e) {
            e.preventDefault();
            
            // Declare originalText outside try block to avoid scope issues
            const originalText = approvelbl.textContent;

            
            try {
                // Get notification data from the modal
                const modal = document.getElementById('cancelModal');
                if (!modal) {
                    throw new Error('Cancel modal not found');
                }
                
                const notifId = modal.dataset.notificationId;
                let bookingId = modal.dataset.bookingId;
                
                if (!notifId) {
                    throw new Error('No notification ID found in modal data');
                }
                
                // If bookingId missing, try resolve via transNo
                if (!bookingId) {
                    const transNo = modal.querySelector('#cancel-transNo, #transNo')?.textContent?.replace('Transaction no. ', '') || 
                                   modal.querySelector('[data-trans-no]')?.textContent;

                    if (transNo) {
                        try {
                            const searchResponse = await fetch(`${window.API_BASE}/booking/trans/${encodeURIComponent(transNo)}`);
                            const searchData = await searchResponse.json();
                            if (searchData && (searchData.booking || searchData.data)) {
                                const b = searchData.booking || searchData.data;
                                bookingId = b._id || b.id || b.bookingId || '';
                                if (bookingId) modal.dataset.bookingId = bookingId;

                            }
                        } catch {
                            // Failed to search by transaction number
                        }
                    }
                }
                
                if (!bookingId) {
                    throw new Error('No booking ID found in modal data');
                }
                

                
                // Disable button during processing
                approveBtn.disabled = true;
                approvelbl.textContent = 'Processing...';
                
                // Handle the complete cancellation workflow
                await handleCancellationRequest(notifId, bookingId, 'accept');
                
                // Close the modal
                const closeBtn = modal.querySelector('[data-close-modal]');
                if (closeBtn) {
                    closeBtn.click();
                }
                
                // Refresh notifications to update the UI
                if (typeof window.fetchNotifications === 'function') {
                    window.fetchNotifications();
                }
                

                
            } catch (error) {
                console.error('❌ Error approving cancellation request:', error);
                showNotificationError(`Failed to approve cancellation: ${error.message}`);
            } finally {
                // Re-enable button
                approveBtn.disabled = false;
                approvelbl.textContent = originalText;
            }
        });
        
    }
}

// Initialize cancellation management functionality
function initializeCancellationManagement() {
    initializeStaticModalButtons();
}

async function guestCancllationNotification() {
    try {
        // Get admin user data from localStorage
        const fromId = localStorage.getItem('adminId') || localStorage.getItem('userId') || 'admin-user';
        const fromName = localStorage.getItem('adminName') || `${localStorage.getItem('firstName') || 'Admin'} ${localStorage.getItem('lastName') || 'User'}`.trim();
        
        // Get message from textarea
        const messageTextarea = document.getElementById('input-lpc-subtitle');
        if (!messageTextarea) {
            throw new Error('Message textarea not found');
        }
        const message = messageTextarea.value.trim();
        if (!message) {
            throw new Error('Please enter a message');
        }
        
        // Get guest data from the selected booking (assuming there's a way to get selected booking ID)
        // Look for booking data in modal or selected booking
        const cancelModal = document.getElementById('cancelModal');
        const bookingId = cancelModal?.dataset.bookingId;
        
        if (!bookingId) {
            throw new Error('No booking selected. Please select a booking first.');
        }
        
        // Fetch booking details to get guest information
        const bookingResponse = await fetch(`${window.API_BASE}/booking/${bookingId}`);
        const bookingData = await bookingResponse.json();
        
        if (!bookingData || !bookingData.booking) {
            throw new Error('Could not fetch booking details');
        }
        
        const booking = bookingData.booking;
        const toId = booking.guestId;
        const toName = booking.guestName;
        
        if (!toId) {
            throw new Error('Guest ID not found in booking data');
        }
        
        // Update the guest name in the cancelReqModal
        const cancelReqModal = document.getElementById('cancelReqModal');
        const guestNameSpan = cancelReqModal?.querySelector('p span');
        if (guestNameSpan) {
            guestNameSpan.textContent = toName || 'Unknown Guest';
        }
        
        // Create notification payload for guest
        const payload = {
            fromId,
            fromName,
            fromRole: 'admin',
            toId,
            toName,
            toRole: 'guest',
            message
        };
        
        console.log('🐛 DEBUG - Guest notification payload:', {
            fromId: payload.fromId,
            fromName: payload.fromName,
            fromRole: payload.fromRole,
            toId: payload.toId,
            toName: payload.toName,
            toRole: payload.toRole,
            message: payload.message,
            messageLength: payload.message.length,
            bookingId: bookingId
        });
        

        
        // Send notification to guest
        const response = await fetch(`${window.API_BASE}/notify/message`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(payload)
        });
        
        if (!response.ok) {
            const errorText = await response.text().catch(() => 'Unknown error');
            throw new Error(`HTTP error! status: ${response.status} - ${errorText}`);
        }
        
        const result = await response.json();

        
        // Show success message
        showNotificationSuccess('Guest notification sent successfully!');
        
        // Clear the textarea after successful send
        messageTextarea.value = '';
        
        return result;
        
    } catch (error) {
        console.error('❌ Error sending guest notification:', error);
        showNotificationError(`Failed to send guest notification: ${error.message}`);
        throw error;
    }
}

// Initialize everything when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    // Initialize cancellation management
    initializeCancellationManagement();
    
    // Initialize guest message button
    const guestMsgBtn = document.getElementById('guestMsgBtn');
    if (guestMsgBtn) {
        
        guestMsgBtn.addEventListener('click', async function(e) {
            e.preventDefault();

            // Declare originalText outside try block to avoid scope issues
            const originalText = guestMsgBtn.textContent;
            
            try {
                // Disable button during processing
                guestMsgBtn.disabled = true;
                guestMsgBtn.textContent = 'Sending...';
                
                // Send guest notification
                await guestCancllationNotification();

                // Close the send message modal on success
                const reqModal = document.getElementById('cancelReqModal');
                const closeBtn = reqModal?.querySelector('[data-close-modal]');
                if (closeBtn) {
                    closeBtn.click();
                } else if (reqModal) {
                    reqModal.classList.add('hidden');
                }
                
            } catch (error) {
                console.error('❌ Error sending guest notification:', error);
            } finally {
                // Re-enable button
                guestMsgBtn.disabled = false;
                guestMsgBtn.textContent = originalText;
            }
        });
        
    }
    
    document.addEventListener('click', (e) => {
        if (e.target.closest('[data-modal-target="cancelReqModal"]')) {
            setTimeout(async () => {
                try {
                    const cancelModal = document.getElementById('cancelModal');
                    const bookingId = cancelModal?.dataset.bookingId;
                    if (!bookingId) return;
                    
                    const bookingResponse = await fetch(`${window.API_BASE}/booking/${bookingId}`);
                    const bookingData = await bookingResponse.json();
                    
                    if (bookingData && bookingData.booking) {
                        const cancelReqModal = document.getElementById('cancelReqModal');
                        const guestNameSpan = cancelReqModal?.querySelector('p span');
                        if (guestNameSpan) {
                            guestNameSpan.textContent = bookingData.booking.guestName || 'Unknown Guest';
                        }
                    }
                } catch (error) {
                    console.warn('Could not update guest name:', error);
                }
            }, 100);
        }
    });
});
