

document.addEventListener("DOMContentLoaded", () => {
    const dropdown = document.getElementById('notificationDropdown');
    const bellBtn = document.getElementById('notifBellBtnDesktop');
    const notifBadge = document.getElementById('notifBadge');

    const API_BASE = 'https://betcha-api.onrender.com';

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
            const category = (wrapper.dataset.category || '').toLowerCase();
            if (category === 'cancellation request') {
                const cModal = document.getElementById('cancelModal');
                if (cModal) {
                    
                    cModal.dataset.notificationId = wrapper.dataset.id || '';
                    cModal.dataset.bookingId = wrapper.dataset.bookingId || '';
                    cModal.dataset.fromId = wrapper.dataset.fromId || '';

                    const sender = cModal.querySelector('#notifSender');
                    const date = cModal.querySelector('#notifDate');
                    const msg = cModal.querySelector('#notifMessage');
                    
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

                    if (!trans) {
                        const txnTitle = Array.from(cModal.querySelectorAll('p')).find(p => (p.textContent || '').trim().toLowerCase().startsWith('transaction no'));
                        if (txnTitle && wrapper.dataset.transNo) {
                            txnTitle.textContent = `Transaction no. ${wrapper.dataset.transNo}`;
                        }
                    }
                    
                    const detailContainer = Array.from(cModal.querySelectorAll('.border')).find(div => div.querySelector('.flex.justify-between.items-center'));
                    if (detailContainer) {
                        const rows = detailContainer.querySelectorAll('.flex.justify-between.items-center');
                        
                        if (rows[0]) {
                            const valueEl = rows[0].querySelector('p:last-child, span');
                            if (valueEl && wrapper.dataset.amountRefund) {
                                const amt = Number(wrapper.dataset.amountRefund);
                                const formatted = isFinite(amt) ? `₱ ${amt.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : wrapper.dataset.amountRefund;
                                valueEl.textContent = formatted;
                            }
                        }
                        
                        if (rows[1]) {
                            const valueEl = rows[1].querySelector('p:last-child');
                            if (valueEl && wrapper.dataset.mode) valueEl.textContent = wrapper.dataset.mode;
                        }
                        
                        if (rows[2]) {
                            const valueEl = rows[2].querySelector('p:last-child');
                            if (valueEl && wrapper.dataset.number) valueEl.textContent = wrapper.dataset.number;
                        }
                    }

                    try {
                        const approveBtn = document.getElementById('approveCancelBtn');
                        if (approveBtn) {
                            approveBtn.disabled = false;
                            approveBtn.textContent = 'Approve';
                        }
                        const rejectBtn = document.getElementById('cancelRejectBtn');
                        if (rejectBtn) {
                            rejectBtn.disabled = false;
                            rejectBtn.textContent = 'Reject';
                        }
                    } catch (_) {}
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

        if (notifBadge) {
            const unread = list.filter((n) => {
                const isUnread = !n.seen && !readCache.has(n._id);
                const isCancellationRequest = (n.category || '').toLowerCase() === 'cancellation request';
                const isProcessedCancellation = isCancellationRequest && n.statusRejection && n.statusRejection !== 'Pending';

                return isUnread && !isProcessedCancellation;
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
            
            initializeScopedTabs(dropdown);
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
    
    initializeAllNotificationTabs();

    window.fetchNotifications = fetchNotifications;
});

function initializeScopedTabs(container) {
    if (!container) return;
    
    const groups = container.matches('[data-tab-group]') ? [container] : container.querySelectorAll('[data-tab-group]');
    groups.forEach((group) => {
        
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

        tabButtons.forEach((btn, i) => {
            btn.addEventListener('click', (ev) => {
                ev.stopPropagation();
                activate(i);
            });
        });

        activate(0);
    });
}

function initializeAllNotificationTabs() {
    
    const candidates = document.querySelectorAll('[data-tab-group]');
    candidates.forEach((c) => initializeScopedTabs(c));
}

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

        addToReadCache(notificationId);
    } catch (_) {}
}

function showNotificationSuccess(message) {
    
    console.log('✅ Success:', message);
    if (typeof showToastSuccess === 'function') {
        showToastSuccess(message);
    }
}

function showNotificationError(message) {
    
    console.error('❌ Error:', message);
    if (typeof showToastError === 'function') {
        showToastError(message);
    }
}

async function updateNotificationStatus(notifId, statusRejection) {
    try {
        if (!notifId) {
            throw new Error('Notification ID is required');
        }

        if (!['Rejected', 'Complete'].includes(statusRejection)) {
            throw new Error('Status must be either "Rejected" or "Complete"');
        }

        const url = `${API_BASE}/notify/status-rejection/${notifId}`;
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

        showNotificationSuccess(`Cancellation request ${statusRejection.toLowerCase()} successfully`);

        return result;

    } catch (error) {
        console.error('❌ Error updating notification status:', error);

        showNotificationError(`Failed to update notification status: ${error.message}`);

        throw error;
    }
}

async function cancelBooking(bookingId) {
    try {
        if (!bookingId) {
            throw new Error('Booking ID is required');
        }
        
        const url = `${API_BASE}/booking/update-status/${bookingId}`;
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

        try {
            if (window.AuditTrailFunctions) {
                const userData = JSON.parse(localStorage.getItem('userData') || '{}');
                const userId = userData.userId || userData.user_id || 'unknown';
                const userType = userData.role || 'admin';
                await window.AuditTrailFunctions.logBookingCancellation(userId, userType, bookingId);
            }
        } catch (auditError) {
            console.error('Audit trail error:', auditError);
        }

        showNotificationSuccess('Booking cancelled successfully');
        
        return result;
        
    } catch (error) {
        console.error('❌ Error cancelling booking:', error);

        showNotificationError(`Failed to cancel booking: ${error.message}`);
        
        throw error;
    }
}

async function handleCancellationRequest(notifId, bookingId, action) {
    try {
        
        if (action === 'accept') {
            
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

        showNotificationError(`Failed to process cancellation request: ${error.message}`);
        
        throw error;
    }
}

function initializeStaticModalButtons() {
    const rejectBtn = document.getElementById('cancelRejectBtn');
    if (rejectBtn) {
        
        rejectBtn.addEventListener('click', async function(e) {
            e.preventDefault();

            try {
                
                const modal = document.getElementById('cancelModal');
                if (!modal) {
                    throw new Error('Cancel modal not found');
                }
                
                const notifId = modal.dataset.notificationId;
                if (!notifId) {
                    throw new Error('No notification ID found in modal data');
                }

                let bookingId = modal.dataset.bookingId;

                if (!bookingId) {
                    const transNo = modal.querySelector('#cancel-transNo, #transNo')?.textContent?.replace('Transaction no. ', '') || 
                                   modal.querySelector('[data-trans-no]')?.textContent;

                    if (transNo) {
                        try {

                            const searchResponse = await fetch(`${API_BASE}/booking/trans/${encodeURIComponent(transNo)}`);
                            const searchData = await searchResponse.json();
                            
                            if (searchData && (searchData.booking || searchData.data)) {
                                const b = searchData.booking || searchData.data;
                                bookingId = b._id || b.id || b.bookingId || '';

                                if (bookingId) modal.dataset.bookingId = bookingId;
                            } else {

                            }
                        } catch (searchError) {

                        }
                    }
                }

                const originalText = rejectBtn.textContent;
                rejectBtn.disabled = true;
                rejectBtn.textContent = 'Processing...';

                await updateNotificationStatus(notifId, 'Rejected');

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

                    const msgResp = await fetch(`${API_BASE}/notify/message`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(payload)
                    });
                    const msgResult = await msgResp.json().catch(() => ({}));

                } catch (msgErr) {
                    console.warn('⚠️ Failed to send rejection message:', msgErr);
                }

                const closeBtn = modal.querySelector('[data-close-modal]');
                if (closeBtn) {
                    closeBtn.click();
                }

                if (typeof fetchNotifications === 'function') {
                    fetchNotifications();
                }

            } catch (error) {
                console.error('❌ Error rejecting cancellation request:', error);
                showNotificationError(`Failed to reject cancellation: ${error.message}`);
            } finally {
                
                rejectBtn.disabled = false;
                rejectBtn.textContent = originalText;
            }
        });
        
    }
    
    const approveBtn = document.getElementById('approveCancelBtn');
    if (approveBtn) {
        
        approveBtn.addEventListener('click', async function(e) {
            e.preventDefault();

            try {
                
                const modal = document.getElementById('cancelModal');
                if (!modal) {
                    throw new Error('Cancel modal not found');
                }
                
                const notifId = modal.dataset.notificationId;
                let bookingId = modal.dataset.bookingId;
                
                if (!notifId) {
                    throw new Error('No notification ID found in modal data');
                }

                if (!bookingId) {
                    const transNo = modal.querySelector('#cancel-transNo, #transNo')?.textContent?.replace('Transaction no. ', '') || 
                                   modal.querySelector('[data-trans-no]')?.textContent;

                    if (transNo) {
                        try {
                            const searchResponse = await fetch(`${API_BASE}/booking/trans/${encodeURIComponent(transNo)}`);
                            const searchData = await searchResponse.json();
                            if (searchData && (searchData.booking || searchData.data)) {
                                const b = searchData.booking || searchData.data;
                                bookingId = b._id || b.id || b.bookingId || '';
                                if (bookingId) modal.dataset.bookingId = bookingId;

                            }
                        } catch (e2) {

                        }
                    }
                }
                
                if (!bookingId) {
                    throw new Error('No booking ID found in modal data');
                }

                const originalText = approveBtn.textContent;
                approveBtn.disabled = true;
                approveBtn.textContent = 'Processing...';

                await handleCancellationRequest(notifId, bookingId, 'accept');

                const closeBtn = modal.querySelector('[data-close-modal]');
                if (closeBtn) {
                    closeBtn.click();
                }

                if (typeof fetchNotifications === 'function') {
                    fetchNotifications();
                }

            } catch (error) {
                console.error('❌ Error approving cancellation request:', error);
                showNotificationError(`Failed to approve cancellation: ${error.message}`);
            } finally {
                
                approveBtn.disabled = false;
                approveBtn.textContent = originalText;
            }
        });
        
    }
}

function initializeCancellationManagement() {
    initializeStaticModalButtons();
}

async function guestCancllationNotification() {
    try {
        
        const fromId = localStorage.getItem('adminId') || localStorage.getItem('userId') || 'admin-user';
        const fromName = localStorage.getItem('adminName') || `${localStorage.getItem('firstName') || 'Admin'} ${localStorage.getItem('lastName') || 'User'}`.trim();

        const messageTextarea = document.getElementById('input-lpc-subtitle');
        if (!messageTextarea) {
            throw new Error('Message textarea not found');
        }
        const message = messageTextarea.value.trim();
        if (!message) {
            throw new Error('Please enter a message');
        }

        const cancelModal = document.getElementById('cancelModal');
        const bookingId = cancelModal?.dataset.bookingId;
        
        if (!bookingId) {
            throw new Error('No booking selected. Please select a booking first.');
        }

        const bookingResponse = await fetch(`${API_BASE}/booking/${bookingId}`);
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

        const cancelReqModal = document.getElementById('cancelReqModal');
        const guestNameSpan = cancelReqModal?.querySelector('p span');
        if (guestNameSpan) {
            guestNameSpan.textContent = toName || 'Unknown Guest';
        }

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

        const response = await fetch(`${API_BASE}/notify/message`, {
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

        showNotificationSuccess('Guest notification sent successfully!');

        messageTextarea.value = '';
        
        return result;
        
    } catch (error) {
        console.error('❌ Error sending guest notification:', error);
        showNotificationError(`Failed to send guest notification: ${error.message}`);
        throw error;
    }
}

document.addEventListener('DOMContentLoaded', () => {
    
    initializeCancellationManagement();

    const guestMsgBtn = document.getElementById('guestMsgBtn');
    if (guestMsgBtn) {
        
        guestMsgBtn.addEventListener('click', async function(e) {
            e.preventDefault();

            try {
                
                const originalText = guestMsgBtn.textContent;
                guestMsgBtn.disabled = true;
                guestMsgBtn.textContent = 'Sending...';

                await guestCancllationNotification();

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
                    
                    const bookingResponse = await fetch(`${API_BASE}/booking/${bookingId}`);
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
