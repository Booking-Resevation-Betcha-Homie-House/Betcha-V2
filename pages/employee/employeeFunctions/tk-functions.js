// TK Functions - Ticketing Management Functionality
//Ticket Part - Get Custoemr Service Message to get the assigned ticket to the employee
//chat bot api for customer side 
// need to add the chat bot api for the customer side
console.log('TK Functions loaded');

const API_BASE_URL = 'https://betcha-api.onrender.com';

document.addEventListener('DOMContentLoaded', () => {
    console.log('TK Functions - DOM Content Loaded');

    debugLocalStorage();
    checkRolePrivileges();
    initializeTicketingFeatures();
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

    // Get ONLY sidebar navigation links using specific IDs
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

// =========================
// Ticketing Features
// =========================
function initializeTicketingFeatures() {
    console.log('Initializing ticketing features...');
    fetchAndPopulateTickets();
    setupTabSwitching();
    setupTicketSelection();
    setupAutoResizeTextarea();
    handleDashboardRedirect();
    
    // Initially hide close ticket button until a ticket is selected
    const closeTicketBtn = document.querySelector('[data-modal-target="closeTicketModal"]');
    if (closeTicketBtn) {
        closeTicketBtn.style.display = 'none';
    }
}

function handleDashboardRedirect() {
    // Check if we were redirected from dashboard with a specific ticket
    const redirectFromDashboard = localStorage.getItem('redirectFromDashboard');
    const selectedTicketData = localStorage.getItem('selectedTicket');
    
    if (redirectFromDashboard === 'true' && selectedTicketData) {
        console.log('Handling dashboard redirect with selected ticket');
        
        try {
            const ticket = JSON.parse(selectedTicketData);
            console.log('Selected ticket from dashboard:', ticket);
            
            // Wait for tickets to be loaded, then find and select the specific ticket
            setTimeout(() => {
                // Ensure the correct tab is active based on ticket status
                const targetTabIndex = (ticket.status === 'resolved' || ticket.status === 'completed') ? 1 : 0;
                document.querySelectorAll('[data-tab-group]').forEach(groupEl => {
                    try {
                        if (typeof setActiveTab === 'function') {
                            setActiveTab(groupEl, targetTabIndex);
                        }
                    } catch (_) {}
                });
                selectTicketFromDashboard(ticket);
            }, 1000); // Give time for tickets to load
            
        } catch (error) {
            console.error('Error parsing selected ticket data:', error);
        }
        
        // Clean up the redirect flags
        localStorage.removeItem('redirectFromDashboard');
        localStorage.removeItem('selectedTicket');
    }
}

function selectTicketFromDashboard(ticket) {
    // Find the ticket element that matches the ticket from dashboard
    const ticketElements = document.querySelectorAll('.ticket-item');
    
    for (let element of ticketElements) {
        const ticketId = element.dataset.ticketId;
        if (ticketId === ticket._id || ticketId === ticket.ticketId) {
            console.log('Found matching ticket, selecting it:', ticketId);
            
            // Simulate a click on the ticket to open it
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
            // 👇 activate Pending tab by default after populate
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

    // 👇 sort by ticketNumber ascending before splitting
    tickets.sort((a, b) => parseInt(a.ticketNumber, 10) - parseInt(b.ticketNumber, 10));

    const pendingTickets = tickets.filter(t => t.status !== 'resolved');
    const completedTickets = tickets.filter(t => t.status === 'resolved');

    renderTicketGroup(pendingTickets, pendingContainer, false, 'No pending tickets...');
    renderTicketGroup(completedTickets, completedContainer, true, 'No completed tickets...');

    // Update tab labels
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

    // 🔥 Fix: pull customer name from messages[0]
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

    // ✅ Click to select
    card.addEventListener('click', () => {
        document.querySelectorAll('.ticket-item').forEach(i => i.classList.remove('bg-primaryy', 'border-primary', 'selected-ticket'));
        card.classList.add('bg-primaryy', 'border-primary', 'selected-ticket');
        loadTicketDetails(ticket);

        const ticketMain = document.getElementById('ticketMain');
        if (ticketMain) ticketMain.classList.replace('translate-x-full', 'translate-x-0');
    });

    // ✅ Auto-select first ticket in pending
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

    // Reset compose box when switching tickets
    const composeEl = document.getElementById('messageBox');
    if (composeEl) {
        composeEl.value = '';
        composeEl.style.height = 'auto';
        // Trigger auto-resize to ensure proper initial height
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

    // Hide close ticket button for completed/resolved tickets
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
    const currentUserId = localStorage.getItem("userId"); // your logged-in employee ID
    const isMine = message.userId === currentUserId;      // check if this message is mine

    const d = new Date(message.dateTime);
    const formattedTime = d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    const el = document.createElement('div');
    el.className = isMine ? 'flex justify-end' : 'flex justify-start';

    const bubbleClasses = isMine
        ? 'bg-primary rounded-2xl px-4 py-2 max-w-[70%]'
        : 'bg-neutral-100 text-neutral-900 rounded-2xl px-4 py-2 max-w-[70%]';

    const nameClass = isMine ? 'text-xs font-medium text-white' : 'text-xs font-medium text-neutral-600';
    const timeClass = isMine ? 'text-xs text-white/80' : 'text-xs text-neutral-400';
    const msgClass = isMine ? 'text-white' : 'text-neutral-900';

    el.innerHTML = `
        <div class="${bubbleClasses}">
            <div class="flex items-center gap-2 mb-1">
                <span class="${nameClass}">${message.userName}</span>
                <span class="${timeClass}">${formattedTime}</span>
            </div>
            <p class="${msgClass}">${message.message}</p>
        </div>
    `;

    return el;
}

// =========================
// Tabs
// =========================
function setupTabSwitching() {
    document.querySelectorAll('[data-tab-group]').forEach(groupEl => {
        const tabButtons = groupEl.querySelectorAll('.tab-btn');
        tabButtons.forEach((button, index) => {
            button.addEventListener('click', () => {
                setActiveTab(groupEl, index);
                clearChatArea(); // 👈 now runs only when switching tabs
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

// =========================
// Misc
// =========================
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

    // Function to auto-resize the textarea
    function autoResize() {
        // Reset height to auto to get the correct scrollHeight
        messageBox.style.height = 'auto';
        
        // Set height to scrollHeight, but limit to max height (6.5rem = 104px)
        const maxHeight = 104; // 6.5rem in pixels
        const scrollHeight = messageBox.scrollHeight;
        
        if (scrollHeight <= maxHeight) {
            messageBox.style.height = scrollHeight + 'px';
        } else {
            messageBox.style.height = maxHeight + 'px';
        }
    }

    // Add event listeners
    messageBox.addEventListener('input', autoResize);
    messageBox.addEventListener('paste', () => {
        // Small delay to allow paste content to be processed
        setTimeout(autoResize, 10);
    });

    // Initial resize
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

    // Reset close ticket button to visible when no ticket is selected
    const closeTicketBtn = document.querySelector('[data-modal-target="closeTicketModal"]');
    if (closeTicketBtn) {
        closeTicketBtn.style.display = 'block';
    }
}

// Reply function
// Reply function
async function sendReply(ticketId, message) {
    if (!ticketId || !message.trim()) return;

    const messagesArea = document.querySelector('#ticketMain .flex-1'); // chat messages container
    const userId = localStorage.getItem("userId"); // <-- employee ID from storage

    // ✅ 1. Append message immediately using createMessageElement
    const tempMsg = {
        userId: userId,
        userName: "Me",                // you can replace with actual employee name if stored
        message: message,
        dateTime: new Date().toISOString()
    };

    const bubble = createMessageElement(tempMsg);
    messagesArea.appendChild(bubble);
    messagesArea.scrollTop = messagesArea.scrollHeight;

    // ✅ 2. Call API
    try {
        const res = await fetch(`https://betcha-api.onrender.com/tk/reply/${ticketId}`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                userId: userId,           // employee ID from storage
                userLevel: "employee",    // employee role
                message: message
            })
        });

        const data = await res.json();
        if (!res.ok) throw new Error(data.message || "Reply failed");
        console.log("Reply sent:", data);
    } catch (err) {
        console.error("Reply error:", err);
        // ❌ Show error feedback in bubble
        bubble.querySelector("p").textContent = "❌ Failed to send: " + message;
        bubble.querySelector("div").classList.add("bg-red-500");
    }
}


// Attach to form submit
document.querySelector('#ticketMain form').addEventListener('submit', (e) => {
    e.preventDefault();
    const textarea = document.getElementById('messageBox');
    const message = textarea.value.trim();
    const ticketId = document.querySelector('.ticket-item.selected-ticket')?.dataset.ticketId;
 // currently opened ticket

    if (!ticketId) {
        alert("No ticket selected!");
        return;
    }

    if (message) {
        sendReply(ticketId, message);
        textarea.value = "";
        textarea.style.height = "auto";
    }
});


function showErrorMessage(message) {
    console.error(message);
    // Optionally hook in toast/notification system here
}
