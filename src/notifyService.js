// Global Notification Service
// Centralized helpers for creating/sending notifications across the app

/*
Usage examples (in any page script):

  // Message to a user (guest/admin/employee)
  await window.notify.sendMessage({
      fromId, fromName, fromRole: 'admin',
      toId, toName, toRole: 'guest',
      message,
      category // optional
  });

  // Cancellation notice to admin
  await window.notify.sendCancellation({
      fromId, fromName, fromRole: 'employee',
      toId: adminId, toName: 'admin', toRole: 'admin',
      message,
      transNo,
      numberEwalletBank,
      amountRefund,
      modeOfRefund,
      reasonToGuest,
      bookingId
  });
*/

// Prefer an app-wide base if present; otherwise default to production URL
window.API_BASE = window.API_BASE || 'https://betcha-api.onrender.com';

// Shared POST helper with structured error handling
async function postJson(endpointPath, body) {
    const url = `${window.API_BASE}${endpointPath}`;
    try {
        console.log('[NotifyService] POST', endpointPath, { url, body });
    } catch (_) {}
    const resp = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
    });
    if (!resp.ok) {
        const text = await resp.text().catch(() => '');
        throw new Error(`HTTP ${resp.status} ${resp.statusText}${text ? ` - ${text}` : ''}`);
    }
    try {
        return await resp.json();
    } catch (_) {
        return {};
    }
}

function requireFields(obj, fields, context) {
    const missing = fields.filter((f) => obj[f] === undefined || obj[f] === null || obj[f] === '');
    if (missing.length) {
        throw new Error(`${context}: missing required field(s): ${missing.join(', ')}`);
    }
}

// Send a user-to-user notification message
async function sendMessage(notification) {
    // Required minimal payload fields
    requireFields(notification, ['fromId', 'fromName', 'fromRole', 'toId', 'toName', 'toRole', 'message'], 'notify.sendMessage');

    const payload = {
        fromId: notification.fromId,
        fromName: notification.fromName,
        fromRole: notification.fromRole,
        toId: notification.toId,
        toName: notification.toName,
        toRole: notification.toRole,
        message: String(notification.message || '').trim(),
        category: notification.category || undefined
    };
    // Strip undefined
    Object.keys(payload).forEach((k) => payload[k] === undefined && delete payload[k]);
    return postJson('/notify/message', payload);
}

// Send a cancellation notice (typically employee -> admin)
async function sendCancellation(notice) {
    requireFields(notice, ['fromId', 'fromName', 'fromRole', , 'message'], 'notify.sendCancellation'); // deleted toId, toName, toRole for trial

    const payload = {
        fromId: notice.fromId,
        fromName: notice.fromName,
        fromRole: notice.fromRole,
       // toId: notice.toId,
       // toName: notice.toName,
       // toRole: notice.toRole,
        message: String(notice.message || '').trim(),
        transNo: notice.transNo || undefined,
        numberEwalletBank: notice.numberEwalletBank || undefined,
        amountRefund: typeof notice.amountRefund === 'number' ? notice.amountRefund : undefined,
        modeOfRefund: notice.modeOfRefund || undefined,
        reasonToGuest: notice.reasonToGuest || undefined,
        bookingId: notice.bookingId || undefined
    };
    Object.keys(payload).forEach((k) => payload[k] === undefined && delete payload[k]);
    return postJson('/notify/cancellation', payload);
}

// Expose globally for non-module scripts
window.notify = Object.freeze({
    sendMessage,
    sendCancellation,
    // System messages and utilities
    sendSystemMessage,
    getEmployeesByPropertyAndPrivilege,
    notifyEmployeesByProperty,
    // Email helper
    sendBookingEmail,
    // Convenience wrappers for guest actions
    notifyReservationConfirmedToTS,
    notifyPaymentCompletedToTS
});

// =========================
// System Message (to employees)
// =========================
async function sendSystemMessage(systemMessage) {
    // Required minimal payload fields
    requireFields(systemMessage, ['toId', 'toName', 'toRole', 'message'], 'notify.sendSystemMessage');

    const payload = {
        toId: systemMessage.toId,
        toName: systemMessage.toName,
        toRole: systemMessage.toRole,
        message: String(systemMessage.message || '').trim()
    };
    try {
        console.log('[NotifyService] sendSystemMessage payload', payload);
    } catch (_) {}
    return postJson('/notify/system', payload);
}

// =========================
// Fetch employees by property and privilege
// =========================
async function getEmployeesByPropertyAndPrivilege(propertyId, privilege) {
    if (!propertyId) throw new Error('getEmployeesByPropertyAndPrivilege: propertyId is required');
    const body = {
        propertyId: propertyId, 
        privilege: privilege || 'TS' //NOTE is always TS, that's I put a static TS value
    };
    try {
        console.log('[NotifyService] getEmployeesByPropertyAndPrivilege body', body);
    } catch (_) {}
    const url = `${window.API_BASE}/employee/by-property-and-privilege`;
    const resp = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
    });
    if (!resp.ok) {
        const text = await resp.text().catch(() => '');
        throw new Error(`HTTP ${resp.status} ${resp.statusText}${text ? ` - ${text}` : ''}`);
    }
    try {
        const data = await resp.json();
        const list = Array.isArray(data) ? data : (Array.isArray(data?.employees) ? data.employees : []);
        try {
            console.log('[NotifyService] employees fetched', list.length);
        } catch (_) {}
        return list;
    } catch (_) {
        return [];
    }
}

// =========================
// Notify all employees for a property (filtered by privilege if provided)
// =========================
async function notifyEmployeesByProperty({ propertyId, privilege, buildMessageFor }) {
    if (!propertyId) throw new Error('notifyEmployeesByProperty: propertyId is required');
    if (typeof buildMessageFor !== 'function') throw new Error('notifyEmployeesByProperty: buildMessageFor(emp) function is required');

    const employees = await getEmployeesByPropertyAndPrivilege(propertyId, privilege);
    if (!Array.isArray(employees) || employees.length === 0) return { sent: 0, employees: [] };

    let sent = 0;
    for (const emp of employees) {
        try {
            const msg = buildMessageFor(emp);
            if (!msg || !msg.message) continue;
            const sysPayload = {
                toId: msg.toId || emp._id || emp.userId || emp.uid,
                toName: msg.toName || emp.name || emp.fullName || 'Employee',
                toRole: msg.toRole || 'employee',
                message: msg.message
            };
            try {
                console.log('[NotifyService] notifyEmployeesByProperty -> sendSystemMessage', sysPayload);
            } catch (_) {}
            await sendSystemMessage(sysPayload);
            sent += 1;
        } catch (e) {
            // continue other employees
            console.warn('notifyEmployeesByProperty: failed to send to employee', emp, e);
        }
    }
    return { sent, employees };
}

// =========================
// Email: /email/bookingmessage
// =========================
async function sendBookingEmail({ email, amount, typeOfPayment, methodOfPayment, unitName, checkIn, checkOut, timeIn, timeOut }) {
    requireFields({ email, amount, typeOfPayment, methodOfPayment, unitName, checkIn, checkOut, timeIn, timeOut },
        ['email', 'amount', 'typeOfPayment', 'methodOfPayment', 'unitName', 'checkIn', 'checkOut', 'timeIn', 'timeOut'],
        'notify.sendBookingEmail');

    const payload = { email, amount, typeOfPayment, methodOfPayment, unitName, checkIn, checkOut, timeIn, timeOut };
    try {
        console.log('[NotifyService] sendBookingEmail payload', payload);
    } catch (_) {}
    return postJson('/email/bookingmessage', payload);
}

// =========================
// Convenience wrappers for the two guest flows
// =========================
// 1) Guest confirmed reservation → notify TS employees for the property
async function notifyReservationConfirmedToTS({ propertyId, propertyName }) {
    if (!propertyId) throw new Error('notifyReservationConfirmedToTS: propertyId is required');
    const message = `A guest has confirmed their reservation on property ${propertyName || 'this property'}.`;
    try {
        console.log('[NotifyService] notifyReservationConfirmedToTS args', { propertyId, propertyName, message });
    } catch (_) {}
    return notifyEmployeesByProperty({
        propertyId,
        privilege: '',
        buildMessageFor: (emp) => ({ message })
    });
}

// 2) Guest completed payment → notify TS employees and send booking email
async function notifyPaymentCompletedToTS({ propertyId, email, amount, typeOfPayment, methodOfPayment, unitName, checkIn, checkOut, timeIn, timeOut }) {
    if (!propertyId) throw new Error('notifyPaymentCompletedToTS: propertyId is required');
    const message = 'A guest has successfully completed their Reservation/Package/Full-Payment payment. Please verify the details.';
    try {
        console.log('[NotifyService] notifyPaymentCompletedToTS args', { propertyId, email, amount, typeOfPayment, methodOfPayment, unitName, checkIn, checkOut, timeIn, timeOut, message });
    } catch (_) {}

    // Fire-and-forget both operations; wait for both to settle
    const notifyPromise = notifyEmployeesByProperty({
        propertyId,
        privilege: '',
        buildMessageFor: (emp) => ({ message })
    });

    const emailPromise = sendBookingEmail({ email, amount, typeOfPayment, methodOfPayment, unitName, checkIn, checkOut, timeIn, timeOut });

    const [notifyRes] = await Promise.allSettled([notifyPromise, emailPromise]);
    return notifyRes.status === 'fulfilled' ? notifyRes.value : { sent: 0, employees: [] };
}


