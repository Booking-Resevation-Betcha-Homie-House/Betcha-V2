

console.log('TK Functions loaded');

const API_BASE_URL = 'https://betcha-api.onrender.com';

let messagePollingInterval = null;
let currentSelectedTicketId = null;

document.addEventListener('DOMContentLoaded', () => {
    console.log('TK Functions - DOM Content Loaded');

    debugLocalStorage();

    initializeTicketingFeatures();
});

window.addEventListener('beforeunload', () => {
    stopMessagePolling();
});

function debugLocalStorage() {
    console.log('=== localStorage Debug ===');
    for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        console.log(`${key}: ${localStorage.getItem(key)}`);
    }
    console.log('=== End localStorage Debug ===');
}

async function checkRolePrivileges() {
    try {
        const roleID = localStorage.getItem('roleID');
        if (!roleID) {
            console.warn('No roleID found in localStorage');
            return;
        }

        console.log('Checking privileges for roleID:', roleID);
        const roleData = await fetchRolePrivileges(roleID);

        if (roleData?.privileges) {
            filterSidebarByPrivileges(roleData.privileges);
        } else {
            console.error('No privileges found in role data');
        }
    } catch (error) {
        console.error('Error checking role privileges:', error);
    }
}

async function fetchRolePrivileges(roleID) {
    try {
        const res = await fetch(`${API_BASE_URL}/roles/display/${roleID}`, {
            method: 'GET',
            headers: { 'Content-Type': 'application/json' }
        });
        if (res.ok) return res.json();
        console.error('Failed to fetch role privileges:', res.status);
        return null;
    } catch (err) {
        console.error('Error fetching role privileges:', err);
        return null;
    }
}

function filterSidebarByPrivileges(privileges) {
    const privilegeMap = {
        'TS': ['ts.html'],
        'PSR': ['psr.html'],
        'TK': ['tk.html'],
        'PM': ['pm.html']
    };

    document.querySelectorAll('#sidebar-dashboard, #sidebar-psr, #sidebar-ts, #sidebar-tk, #sidebar-pm').forEach(link => {
        const href = link.getAttribute('href');
        if (href === 'dashboard.html' || !href.includes('.html')) return;

        let hasAccess = privileges.some(p => privilegeMap[p]?.includes(href));
        link.style.display = hasAccess ? 'flex' : 'none';
    });

    hideDashboardSections(privileges);

    if (!privileges.includes('TK')) {
        console.warn('User does not have TK privilege, access denied');
        showAccessDeniedMessage();
    }

    const sidebarNav = document.querySelector('#sidebar nav');
    if (sidebarNav) {
        sidebarNav.style.transition = 'opacity 0.3s ease-in-out, visibility 0.3s ease-in-out';
        sidebarNav.style.visibility = 'visible';
        sidebarNav.style.opacity = '1';
    }
}

function hideDashboardSections(privileges) {
    const sectionPrivilegeMap = {
        'PSR-summary': ['PSR'],
        'tickets': ['TK'],
        'PM': ['PM'],
        'transactions': ['TS']
    };

    Object.entries(sectionPrivilegeMap).forEach(([id, required]) => {
        const section = document.getElementById(id);
        if (!section) return;
        const hasAccess = privileges.some(p => required.includes(p));
        section.style.display = hasAccess ? 'block' : 'none';
    });
}

function showAccessDeniedMessage() {

    try {
        if (window.AuditTrailFunctions) {
            const userData = JSON.parse(localStorage.getItem('userData') || '{}');
            const userId = userData.userId || userData.user_id || 'unknown';
            const userType = userData.role || 'employee';
            window.AuditTrailFunctions.logUnauthorizedAccess(userId, userType).catch(auditError => {
                console.error('Audit trail error:', auditError);
            });
        }
    } catch (auditError) {
        console.error('Audit trail error:', auditError);
    }
    
    const message = document.createElement('div');
    message.className = 'fixed inset-0 bg-black/50 flex items-center justify-center z-50';
    message.innerHTML = `
        <div class="bg-white p-8 rounded-lg shadow-lg max-w-md mx-4">
            <div class="text-center">
                <svg class="w-16 h-16 text-red-500 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                          d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4
                          c-.77-.833-1.964-.833-2.732 0L4.732 19.5c-.77.833.192 2.5 1.732 2.5z"/>
                </svg>
                <h2 class="text-xl font-bold text-gray-800 mb-2">Access Denied</h2>
                <p class="text-gray-600 mb-4">You don't have permission to access the Ticketing module.</p>
                <button onclick="window.location.href='dashboard.html'"
                        class="bg-primary text-white px-4 py-2 rounded hover:bg-primary/90">
                    Return to Dashboard
                </button>
            </div>
        </div>
    `;
    document.body.appendChild(message);
}

window.filterSidebarByPrivileges = filterSidebarByPrivileges;

function startMessagePolling(ticketId) {

    stopMessagePolling();
    
    currentSelectedTicketId = ticketId;
    console.log('Starting message polling for ticket:', ticketId);

    messagePollingInterval = setInterval(async () => {
        await refreshTicketMessages(ticketId);
    }, 5000);
}

function stopMessagePolling() {
    if (messagePollingInterval) {
        clearInterval(messagePollingInterval);
        messagePollingInterval = null;
        console.log('Stopped message polling');
    }
    currentSelectedTicketId = null;
}

async function refreshTicketMessages(ticketId) {
    if (!ticketId) return;
    
    try {
        const response = await fetch(`${API_BASE_URL}/tk/messages/${ticketId}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json'
            }
        });
        
        if (!response.ok) {
            console.warn('Failed to fetch updated messages:', response.status);
            return;
        }
        
        const data = await response.json();
        const messages = data.messages || [];

        updateMessagesArea(messages);
        
    } catch (error) {
        console.warn('Error polling messages:', error);
    }
}

function updateMessagesArea(messages) {
    const messagesArea = document.querySelector('.flex-1.overflow-y-auto.px-10.py-6.space-y-6');
    if (!messagesArea) return;

    const wasScrolledToBottom = messagesArea.scrollHeight - messagesArea.scrollTop <= messagesArea.clientHeight + 5;

    messagesArea.innerHTML = '';
    messages.forEach(msg => messagesArea.appendChild(createMessageElement(msg)));

    if (wasScrolledToBottom) {
        messagesArea.scrollTop = messagesArea.scrollHeight;
    }
}

function initializeTicketingFeatures() {
    console.log('Initializing ticketing features...');
    fetchAndPopulateTickets();
    setupTabSwitching();
    setupTicketSelection();
    setupAutoResizeTextarea();
    handleDashboardRedirect();

    const closeTicketBtn = document.querySelector('[data-modal-target="closeTicketModal"]');
    if (closeTicketBtn) {
        closeTicketBtn.style.display = 'none';
    }
}

function handleDashboardRedirect() {

    const redirectFromDashboard = localStorage.getItem('redirectFromDashboard');
    const selectedTicketData = localStorage.getItem('selectedTicket');
    
    if (redirectFromDashboard === 'true' && selectedTicketData) {
        console.log('Handling dashboard redirect with selected ticket');
        
        try {
            const ticket = JSON.parse(selectedTicketData);
            console.log('Selected ticket from dashboard:', ticket);

            setTimeout(() => {

                const targetTabIndex = (ticket.status === 'resolved' || ticket.status === 'completed') ? 1 : 0;
                document.querySelectorAll('[data-tab-group]').forEach(groupEl => {
                    try {
                        if (typeof setActiveTab === 'function') {
                            setActiveTab(groupEl, targetTabIndex);
                        }
                    } catch (error) {
                        console.warn('Failed to set active tab:', error);
                    }
                });
                selectTicketFromDashboard(ticket);
            }, 1000); 
            
        } catch (error) {
            console.error('Error parsing selected ticket data:', error);
        }

        localStorage.removeItem('redirectFromDashboard');
        localStorage.removeItem('selectedTicket');
    }
}

function selectTicketFromDashboard(ticket) {

    const ticketElements = document.querySelectorAll('.ticket-item');
    
    for (let element of ticketElements) {
        const ticketId = element.dataset.ticketId;
        if (ticketId === ticket._id || ticketId === ticket.ticketId) {
            console.log('Found matching ticket, selecting it:', ticketId);

            element.click();
            break;
        }
    }
}

async function fetchAndPopulateTickets() {
    try {
        let userID = localStorage.getItem('userId') || localStorage.getItem('userID');

        if (!userID) {
            const userData = localStorage.getItem('userData');
            if (userData) {
                try {
                    const user = JSON.parse(userData);
                    userID = user._id || user.id || user.userId;
                } catch (e) {
                    console.warn('Failed to parse userData:', e);
                }
            }
        }

        if (!userID) {
            return showErrorMessage('User ID not found. Please log in again.');
        }

        const res = await fetch(`${API_BASE_URL}/tk/customer-service/${userID}`);
        if (!res.ok) return showErrorMessage('Failed to fetch tickets');

        const data = await res.json();
        if (!Array.isArray(data.tickets)) {
            return showNoTicketsMessage();
        }

        document.querySelectorAll('[data-tab-group]').forEach(groupEl => {
            populateTicketList(data.tickets, groupEl);

            setActiveTab(groupEl, 0);
        });
    } catch (err) {
        console.error('Error fetching tickets:', err);
        showErrorMessage('Error fetching tickets');
    }
}

function populateTicketList(tickets, groupEl) {
    if (!groupEl) return;

    const [pendingContainer, completedContainer] = groupEl.querySelectorAll('.tab-content');
    if (!pendingContainer || !completedContainer) return;

    pendingContainer.innerHTML = '';
    completedContainer.innerHTML = '';

    tickets.sort((a, b) => parseInt(a.ticketNumber, 10) - parseInt(b.ticketNumber, 10));

    const pendingTickets = tickets.filter(t => t.status !== 'resolved');
    const completedTickets = tickets.filter(t => t.status === 'resolved');

    renderTicketGroup(pendingTickets, pendingContainer, false, 'No pending tickets...');
    renderTicketGroup(completedTickets, completedContainer, true, 'No completed tickets...');

    const tabBtns = groupEl.querySelectorAll('.tab-btn span');
    if (tabBtns[0]) tabBtns[0].textContent = 'Pending';
    if (tabBtns[1]) tabBtns[1].textContent = 'Completed';
}

function renderTicketGroup(tickets, container, isCompleted, emptyMsg) {
    if (tickets.length === 0) {
        container.innerHTML = `<div class="w-full h-full flex justify-center items-center text-neutral-500 font-manrope">${emptyMsg}</div>`;
        return;
    }
    const wrapper = document.createElement('div');
    wrapper.className = 'space-y-4 p-4';
    tickets.forEach(ticket => wrapper.appendChild(createTicketCard(ticket, isCompleted)));
    container.appendChild(wrapper);
}

function createTicketCard(ticket, isCompleted, isFirst = false) {
    const card = document.createElement('div');
    card.className = `ticket-item w-full p-4 hover:bg-primary/10 cursor-pointer transition group border border-neutral-200 rounded-xl ${isCompleted ? 'opacity-75' : ''}`;
    card.dataset.ticketId = ticket._id;

    const customerName = ticket.messages?.[0]?.userName || 'Unknown Customer';

    const d = new Date(ticket.createdAt);
    const formattedDate = d.toLocaleDateString();
    const formattedTime = d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    card.innerHTML = `
        <div class="grid grid-cols-[1fr_auto] gap-2 items-center w-full">
            <div class="flex flex-col gap-1">
                <p class="font-semibold text-neutral-900 font-manrope tracking-wide group-hover:text-primary transition">
                    #${ticket.ticketNumber}
                </p>
                <p class="text-xs text-neutral-500 truncate">${customerName}</p>
            </div>
            <div class="flex flex-col items-end gap-1">
                <span class="text-xs font-medium text-neutral-900 px-2 py-1 bg-neutral-100 rounded-full">
                    ${ticket.category || 'No Category'}
                </span>
                <span class="text-xs text-neutral-400">${formattedDate} | ${formattedTime}</span>
            </div>
        </div>
    `;

    card.addEventListener('click', () => {
        document.querySelectorAll('.ticket-item').forEach(i => i.classList.remove('bg-primaryy', 'border-primary', 'selected-ticket'));
        card.classList.add('bg-primaryy', 'border-primary', 'selected-ticket');
        loadTicketDetails(ticket);

        const ticketMain = document.getElementById('ticketMain');
        if (ticketMain) ticketMain.classList.replace('translate-x-full', 'translate-x-0');
    });

    if (isFirst && !isCompleted) {
        setTimeout(() => {
            card.classList.add('bg-primaryy', 'border-primary', 'selected-ticket');
            loadTicketDetails(ticket);
            const ticketMain = document.getElementById('ticketMain');
            if (ticketMain) ticketMain.classList.replace('translate-x-full', 'translate-x-0');
        }, 0);
    }

    return card;
}

function loadTicketDetails(ticket) {
    console.log('Loading ticket details for:', ticket);

    startMessagePolling(ticket._id);

    const composeEl = document.getElementById('messageBox');
    if (composeEl) {
        composeEl.value = '';
        composeEl.style.height = 'auto';

        setTimeout(() => {
            const event = new Event('input');
            composeEl.dispatchEvent(event);
        }, 10);
    }

    const chatHeader = document.querySelector('.chat-header');
    if (chatHeader) {
        const ticketNumber = chatHeader.querySelector('p');
        const nameCategory = chatHeader.querySelector('.flex.items-center.gap-2');
        if (ticketNumber) ticketNumber.textContent = `#${ticket.ticketNumber}`;
        if (nameCategory) {
            const customerName = ticket.messages?.[0]?.userName || 'Unknown Customer';
            nameCategory.innerHTML = `
                <p class="truncate max-w-[50%]">${customerName}</p> |
                <span class="truncate text-right max-w-[50%]">${ticket.category || 'No Category'}</span>
            `;
        }
    }

    const messagesArea = document.querySelector('.flex-1.overflow-y-auto.px-10.py-6.space-y-6');
    if (messagesArea) {
        messagesArea.innerHTML = '';
        ticket.messages?.forEach(msg => messagesArea.appendChild(createMessageElement(msg)));
        messagesArea.scrollTop = messagesArea.scrollHeight;
    }

    const closeTicketBtn = document.querySelector('[data-modal-target="closeTicketModal"]');
    if (closeTicketBtn) {
        if (ticket.status === 'completed' || ticket.status === 'resolved') {
            closeTicketBtn.style.display = 'none';
        } else {
            closeTicketBtn.style.display = 'block';
        }
    }
}

function createMessageElement(message) {
    const currentUserId = localStorage.getItem("userId"); 
    const isMine = message.userId === currentUserId;      

    const d = new Date(message.dateTime);
    const formattedTime = d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    const el = document.createElement('div');
    el.className = isMine ? 'flex justify-end' : 'flex justify-start';

    const bubbleClasses = isMine
        ? 'bg-primary rounded-2xl px-4 py-2 max-w-[70%] break-words'
        : 'bg-neutral-100 text-neutral-900 rounded-2xl px-4 py-2 max-w-[70%] break-words';

    const nameClass = isMine ? 'text-xs font-medium text-white' : 'text-xs font-medium text-neutral-600';
    const timeClass = isMine ? 'text-xs text-white/80' : 'text-xs text-neutral-400';
    const msgClass = isMine ? 'text-white whitespace-pre-wrap' : 'text-neutral-900 whitespace-pre-wrap';

    const processedMessage = escapeHtml(message.message).replace(/\n/g, '<br>');

    el.innerHTML = `
        <div class="${bubbleClasses}">
            <div class="flex items-center gap-2 mb-1">
                <span class="${nameClass}">${message.userName}</span>
                <span class="${timeClass}">${formattedTime}</span>
            </div>
            <div class="${msgClass}" style="word-wrap: break-word; overflow-wrap: anywhere;">${processedMessage}</div>
        </div>
    `;

    return el;
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function setupTabSwitching() {
    document.querySelectorAll('[data-tab-group]').forEach(groupEl => {
        const tabButtons = groupEl.querySelectorAll('.tab-btn');
        tabButtons.forEach((button, index) => {
            button.addEventListener('click', () => {
                setActiveTab(groupEl, index);
                clearChatArea(); 
            });
        });
    });
}

function setActiveTab(groupEl, index) {
    if (!groupEl) return;

    const tabBtns = groupEl.querySelectorAll('.tab-btn');
    tabBtns.forEach((btn, i) => {
        const span = btn.querySelector('span');
        if (i === index) {
            btn.classList.add('bg-white', 'shadow');
            btn.classList.remove('bg-neutral-100');
            span?.classList.add('text-primary', 'font-semibold');
            span?.classList.remove('text-neutral-500');
        } else {
            btn.classList.remove('bg-white', 'shadow');
            btn.classList.add('bg-neutral-100');
            span?.classList.remove('text-primary', 'font-semibold');
            span?.classList.add('text-neutral-500');
        }
    });

    const tabContents = groupEl.querySelectorAll('.tab-content');
    tabContents.forEach((c, i) => c.classList.toggle('hidden', i !== index));
}

function setupTicketSelection() {
    const backBtn = document.getElementById('ticketBackBtn');
    if (backBtn) {
        backBtn.addEventListener('click', () => {
            const ticketMain = document.getElementById('ticketMain');
            ticketMain?.classList.replace('translate-x-0', 'translate-x-full');
        });
    }
}

function setupAutoResizeTextarea() {
    const messageBox = document.getElementById('messageBox');
    if (!messageBox) return;

    function autoResize() {

        messageBox.style.height = 'auto';

        const maxHeight = 104; 
        const minHeight = 32;  
        const scrollHeight = Math.max(messageBox.scrollHeight, minHeight);
        
        if (scrollHeight <= maxHeight) {
            messageBox.style.height = scrollHeight + 'px';
        } else {
            messageBox.style.height = maxHeight + 'px';
        }

        messageBox.style.overflowY = scrollHeight > maxHeight ? 'auto' : 'hidden';
    }

    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) || 
                     ('ontouchstart' in window) || 
                     (navigator.maxTouchPoints > 0);

    messageBox.addEventListener('input', autoResize);
    messageBox.addEventListener('paste', () => {

        setTimeout(autoResize, 10);
    });

    messageBox.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            if (isMobile) {

                setTimeout(autoResize, 10);
                return; 
            } else {

                if (!e.shiftKey) {

                    e.preventDefault();

                    const form = messageBox.closest('form');
                    if (form) {
                        form.dispatchEvent(new Event('submit'));
                    }
                } else {

                    setTimeout(autoResize, 10);
                }
            }
        }
    });

    if (isMobile) {
        messageBox.placeholder = "Type a message... (Use send button to submit)";
    }

    autoResize();
}

function showNoTicketsMessage() {
    document.querySelectorAll('.tab-content').forEach(c => {
        c.innerHTML = `
            <div class="w-full h-full flex justify-center items-center text-neutral-500 font-manrope">
                No tickets yet...
            </div>
        `;
    });
}

async function confirmResolve(ticketId) {
    if (!ticketId) return alert("No ticket selected");

    try {
        const res = await fetch(`${API_BASE_URL}/tk/status/${ticketId}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ status: "resolved" })
        });

        const data = await res.json();
        if (!res.ok) throw new Error(data.message || "Failed to resolve ticket");

        console.log("Ticket resolved:", data);

        try {
            if (window.AuditTrailFunctions) {
                const userData = JSON.parse(localStorage.getItem('userData') || '{}');
                const userId = userData.userId || userData.user_id || localStorage.getItem("userId") || 'unknown';
                const userType = userData.role || 'employee';
                await window.AuditTrailFunctions.logTicketResolution(userId, userType);
            }
        } catch (auditError) {
            console.error('Audit trail error:', auditError);
        }

        await fetchAndPopulateTickets();

        clearChatArea();

    } catch (err) {
        console.error("Error resolving ticket:", err);
        alert("Failed to resolve ticket ❌");
    }
}

document.getElementById("confirmResolveBtn")?.addEventListener("click", () => {
    const selected = document.querySelector(".ticket-item.selected-ticket"); 
    if (!selected) {
        alert("Please select a ticket first.");
        return;
    }
    confirmResolve(selected.dataset.ticketId);
});

function clearChatArea() {

    stopMessagePolling();

    const chatHeader = document.querySelector('.chat-header');
    if (chatHeader) {
        chatHeader.querySelector('p').textContent = 'No Ticket Selected';
        chatHeader.querySelector('.flex.items-center.gap-2').innerHTML = `
            <p class="truncate max-w-[50%] text-neutral-400">No Customer</p> |
            <span class="truncate text-right max-w-[50%] text-neutral-400">No Category</span>
        `;
    }
    const messagesArea = document.querySelector('.flex-1.overflow-y-auto.px-10.py-6.space-y-6');
    if (messagesArea) {
        messagesArea.innerHTML = `
            <div class="w-full h-full flex justify-center items-center text-neutral-500 font-manrope">
                <div class="text-center">
                    <p class="text-lg mb-2">No Tickets Available</p>
                    <p class="text-sm">There are currently no tickets to display.</p>
                </div>
            </div>
        `;
    }

    const closeTicketBtn = document.querySelector('[data-modal-target="closeTicketModal"]');
    if (closeTicketBtn) {
        closeTicketBtn.style.display = 'block';
    }
}

async function sendReply(ticketId, message) {
    if (!ticketId || !message.trim()) return;

    const messagesArea = document.querySelector('#ticketMain .flex-1'); 
    const userId = localStorage.getItem("userId"); 

    const tempMsg = {
        userId: userId,
        userName: "Me",                
        message: message,              
        dateTime: new Date().toISOString()
    };

    const bubble = createMessageElement(tempMsg);
    messagesArea.appendChild(bubble);
    messagesArea.scrollTop = messagesArea.scrollHeight;

    try {
        const res = await fetch(`https://betcha-api.onrender.com/tk/reply/${ticketId}`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                userId: userId,           
                userLevel: "employee",    
                message: message          
            })
        });

        const data = await res.json();
        if (!res.ok) throw new Error(data.message || "Reply failed");
        console.log("Reply sent:", data);

        try {
            if (window.AuditTrailFunctions) {
                const userData = JSON.parse(localStorage.getItem('userData') || '{}');
                const userId = userData.userId || userData.user_id || localStorage.getItem("userId") || 'unknown';
                const userType = userData.role || 'employee';
                await window.AuditTrailFunctions.logTicketUpdate(userId, userType);
            }
        } catch (auditError) {
            console.error('Audit trail error:', auditError);
        }
    } catch (err) {
        console.error("Reply error:", err);

        const errorDiv = bubble.querySelector("div:last-child");
        if (errorDiv) {
            errorDiv.textContent = "❌ Failed to send: " + message;
            bubble.querySelector("div").classList.remove("bg-primary");
            bubble.querySelector("div").classList.add("bg-red-500");
        }
    }
}

document.querySelector('#ticketMain form').addEventListener('submit', (e) => {
    e.preventDefault();
    const textarea = document.getElementById('messageBox');
    const message = textarea.value.trim();
    const ticketId = document.querySelector('.ticket-item.selected-ticket')?.dataset.ticketId;

    if (!ticketId) {
        alert("No ticket selected!");
        return;
    }

    if (message) {
        sendReply(ticketId, message);
        textarea.value = "";
        textarea.style.height = "auto";

        setTimeout(() => {
            const event = new Event('input');
            textarea.dispatchEvent(event);
        }, 10);
    }
});

function showErrorMessage(message) {
    console.error(message);

}
