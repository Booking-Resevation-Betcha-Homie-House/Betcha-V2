

const API_BASE = (window && window.API_BASE_URL) || 'https://betcha-api.onrender.com';

async function postJson(endpointPath, body) {
    const url = `${API_BASE}${endpointPath}`;
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

async function sendMessage(notification) {
    
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
    
    Object.keys(payload).forEach((k) => payload[k] === undefined && delete payload[k]);
    return postJson('/notify/message', payload);
}

async function sendCancellation(notice) {
    requireFields(notice, ['fromId', 'fromName', 'fromRole', 'toId', 'toName', 'toRole', 'message'], 'notify.sendCancellation');

    const payload = {
        fromId: notice.fromId,
        fromName: notice.fromName,
        fromRole: notice.fromRole,
        toId: notice.toId,
        toName: notice.toName,
        toRole: notice.toRole,
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

window.notify = Object.freeze({
    sendMessage,
    sendCancellation,
    
    sendSystemMessage,
    getEmployeesByPropertyAndPrivilege,
    notifyEmployeesByProperty,
    
    sendBookingEmail,
    
    notifyReservationConfirmedToTS,
    notifyPaymentCompletedToTS
});

async function sendSystemMessage(systemMessage) {
    
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

async function getEmployeesByPropertyAndPrivilege(propertyId, privilege) {
    if (!propertyId) throw new Error('getEmployeesByPropertyAndPrivilege: propertyId is required');
    const body = {
        propertyId: propertyId, 
        privilege: privilege || 'TS' 
    };
    try {
        console.log('[NotifyService] getEmployeesByPropertyAndPrivilege body', body);
    } catch (_) {}
    const url = `${API_BASE}/employee/by-property-and-privilege`;
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
            
            console.warn('notifyEmployeesByProperty: failed to send to employee', emp, e);
        }
    }
    return { sent, employees };
}

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

async function notifyPaymentCompletedToTS({ propertyId, email, amount, typeOfPayment, methodOfPayment, unitName, checkIn, checkOut, timeIn, timeOut }) {
    if (!propertyId) throw new Error('notifyPaymentCompletedToTS: propertyId is required');
    const message = 'A guest has successfully completed their Reservation/Package/Full-Payment payment. Please verify the details.';
    try {
        console.log('[NotifyService] notifyPaymentCompletedToTS args', { propertyId, email, amount, typeOfPayment, methodOfPayment, unitName, checkIn, checkOut, timeIn, timeOut, message });
    } catch (_) {}

    const notifyPromise = notifyEmployeesByProperty({
        propertyId,
        privilege: '',
        buildMessageFor: (emp) => ({ message })
    });

    const emailPromise = sendBookingEmail({ email, amount, typeOfPayment, methodOfPayment, unitName, checkIn, checkOut, timeIn, timeOut });

    const [notifyRes] = await Promise.allSettled([notifyPromise, emailPromise]);
    return notifyRes.status === 'fulfilled' ? notifyRes.value : { sent: 0, employees: [] };
}

