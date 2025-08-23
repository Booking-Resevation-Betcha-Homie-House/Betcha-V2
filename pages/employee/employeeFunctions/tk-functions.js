// TK Functions - Ticketing Management Functionality
//Ticket Part - Get Custoemr Service Message to get the assigned ticket to the employee
//chat bot api for customer side 
// need to add the chat bot api for the customer side
console.log('TK Functions loaded');

// API Base URL
const API_BASE_URL = 'https://betcha-api.onrender.com';

document.addEventListener('DOMContentLoaded', function() {
    console.log('TK Functions - DOM Content Loaded');
    
    // Debug localStorage contents
    debugLocalStorage();
    
    // Check role privileges and filter sidebar/content
    checkRolePrivileges();
    
    // Initialize ticketing functionality here
    initializeTicketingFeatures();
});

// Debug function to check localStorage contents
function debugLocalStorage() {
    console.log('=== localStorage Debug ===');
    console.log('All localStorage keys:');
    for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        const value = localStorage.getItem(key);
        console.log(`${key}: ${value}`);
    }
    console.log('=== End localStorage Debug ===');
}

// Role Privilege Checking Functions
async function checkRolePrivileges() {
    try {
        const roleID = localStorage.getItem('roleID');
        if (!roleID) {
            console.warn('No roleID found in localStorage');
            return;
        }

        console.log('Checking privileges for roleID:', roleID);
        
        // Fetch role privileges from API
        const roleData = await fetchRolePrivileges(roleID);
        
        if (roleData && roleData.privileges) {
            console.log('Role privileges:', roleData.privileges);
            
            // Filter sidebar and content based on privileges
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
        const response = await fetch(`${API_BASE_URL}/roles/display/${roleID}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
            }
        });

        if (response.ok) {
            const data = await response.json();
            console.log('Role data received:', data);
            return data;
        } else {
            console.error('Failed to fetch role privileges:', response.status);
            return null;
        }
    } catch (error) {
        console.error('Error fetching role privileges:', error);
        return null;
    }
}

function filterSidebarByPrivileges(privileges) {
    console.log('TK - Filtering sidebar and content sections with privileges:', privileges);
    
    // Define what each privilege allows access to
    const privilegeMap = {
        'TS': ['ts.html'], // TS only has access to Transactions
        'PSR': ['psr.html'], // PSR has access to Property Summary Report
        'TK': ['tk.html'], // TK has access to Ticketing
        'PM': ['pm.html'] // PM has access to Property Monitoring
    };
    
    // Get all sidebar links
    const sidebarLinks = document.querySelectorAll('nav a[href]');
    
    sidebarLinks.forEach(link => {
        const href = link.getAttribute('href');
        
        // Skip dashboard link and non-management links
        if (href === 'dashboard.html' || !href.includes('.html')) {
            return;
        }
        
        let hasAccess = false;
        
        // Check if user has privilege for this link
        privileges.forEach(privilege => {
            if (privilegeMap[privilege] && privilegeMap[privilege].includes(href)) {
                hasAccess = true;
            }
        });
        
        // Hide the link if user doesn't have access
        if (!hasAccess) {
            console.log(`TK - Hiding sidebar item: ${href} (no access with privileges: ${privileges.join(', ')})`);
            link.style.display = 'none';
        } else {
            console.log(`TK - Showing sidebar item: ${href} (access granted with privileges: ${privileges.join(', ')})`);
            link.style.display = 'flex';
        }
    });
    
    // Hide content sections based on privileges
    hideDashboardSections(privileges);
    
    // Special handling for non-TK users - check if current user should have access to this page
    if (!privileges.includes('TK')) {
        console.warn('TK - User does not have TK privilege, should not access this page');
        showAccessDeniedMessage();
    }
}

function hideDashboardSections(privileges) {
    // Define content sections that should be hidden based on privileges
    const sectionPrivilegeMap = {
        'PSR-summary': ['PSR'], // PSR Summary section requires PSR privilege
        'tickets': ['TK'], // Tickets section requires TK privilege  
        'PM': ['PM'], // Property Monitoring section requires PM privilege
        'transactions': ['TS'] // Transactions section requires TS privilege
    };
    
    // Check each section
    Object.keys(sectionPrivilegeMap).forEach(sectionId => {
        const section = document.getElementById(sectionId);
        if (!section) return;
        
        const requiredPrivileges = sectionPrivilegeMap[sectionId];
        let hasAccess = false;
        
        // Check if user has any of the required privileges for this section
        privileges.forEach(privilege => {
            if (requiredPrivileges.includes(privilege)) {
                hasAccess = true;
            }
        });
        
        if (!hasAccess) {
            console.log(`TK - Hiding content section: ${sectionId} (no access with privileges: ${privileges.join(', ')})`);
            section.style.display = 'none';
        } else {
            console.log(`TK - Showing content section: ${sectionId} (access granted with privileges: ${privileges.join(', ')})`);
            section.style.display = 'block';
        }
    });
}

function hideSpecificSidebarItems(itemsToHide) {
    itemsToHide.forEach(href => {
        const link = document.querySelector(`nav a[href="${href}"]`);
        if (link) {
            console.log(`TK - Specifically hiding: ${href}`);
            link.style.display = 'none';
        }
    });
}

function showAccessDeniedMessage() {
    // Create access denied message
    const message = document.createElement('div');
    message.className = 'fixed inset-0 bg-black/50 flex items-center justify-center z-50';
    message.innerHTML = `
        <div class="bg-white p-8 rounded-lg shadow-lg max-w-md mx-4">
            <div class="text-center">
                <svg class="w-16 h-16 text-red-500 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.732 19.5c-.77.833.192 2.5 1.732 2.5z"/>
                </svg>
                <h2 class="text-xl font-bold text-gray-800 mb-2">Access Denied</h2>
                <p class="text-gray-600 mb-4">You don't have permission to access the Ticketing module.</p>
                <button onclick="window.location.href='dashboard.html'" class="bg-primary text-white px-4 py-2 rounded hover:bg-primary/90">
                    Return to Dashboard
                </button>
            </div>
        </div>
    `;
    document.body.appendChild(message);
}

// Ticketing-specific functions
function initializeTicketingFeatures() {
    console.log('Initializing ticketing features...');
    
    // Fetch and populate tickets
    fetchAndPopulateTickets();
    
    // Set up tab switching functionality
    setupTabSwitching();
    
    // Set up ticket selection functionality
    setupTicketSelection();
}

async function fetchAndPopulateTickets() {
    try {
        // Try multiple possible keys for user ID
        let userID = localStorage.getItem('userId');
        
        if (!userID) {
            // Try alternative keys
            userID = localStorage.getItem('userID');
        }
        
        if (!userID) {
            // Try to get from userData if it exists
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
            console.error('No userId found in localStorage. Available keys:', Object.keys(localStorage));
            showErrorMessage('User ID not found. Please log in again.');
            return;
        }

        console.log('Fetching tickets for userId:', userID);
        
        // Fetch tickets from API
        const response = await fetch(`${API_BASE_URL}/tk/customer-service/${userID}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
            }
        });

        if (response.ok) {
            const data = await response.json();
            console.log('Tickets data received:', data);
            
            if (data.tickets && Array.isArray(data.tickets)) {
                populateTicketList(data.tickets);
            } else {
                console.warn('No tickets found in response');
                showNoTicketsMessage();
            }
        } else {
            console.error('Failed to fetch tickets:', response.status);
            showErrorMessage('Failed to fetch tickets');
        }
    } catch (error) {
        console.error('Error fetching tickets:', error);
        showErrorMessage('Error fetching tickets');
    }
}

function populateTicketList(tickets) {
    console.log('Populating ticket list with', tickets.length, 'tickets');
    
    // Get the pending and completed tab content containers
    const pendingContainer = document.querySelector('.tab-content:first-of-type');
    const completedContainer = document.querySelector('.tab-content:last-of-type');
    
    if (!pendingContainer || !completedContainer) {
        console.error('Tab containers not found');
        return;
    }
    
    // Clear existing content (this removes all static data)
    pendingContainer.innerHTML = '';
    completedContainer.innerHTML = '';
    
    // Separate tickets by status
    const pendingTickets = tickets.filter(ticket => ticket.status !== 'resolved');
    const completedTickets = tickets.filter(ticket => ticket.status === 'resolved');
    
    console.log('Pending tickets:', pendingTickets.length);
    console.log('Completed tickets:', completedTickets.length);
    
    // If no tickets at all, clear the chat area and show no tickets message
    if (tickets.length === 0) {
        clearChatArea();
        return;
    }
    
    // Populate pending tickets
    if (pendingTickets.length > 0) {
        pendingTickets.forEach(ticket => {
            const ticketElement = createTicketElement(ticket, 'pending');
            pendingContainer.appendChild(ticketElement);
        });
    } else {
        // Show "No tickets yet..." message when no pending tickets
        pendingContainer.innerHTML = `
            <div class="w-full h-full flex justify-center items-center text-neutral-500 font-manrope">
                No tickets yet...
            </div>
        `;
    }
    
    // Populate completed tickets
    if (completedTickets.length > 0) {
        completedTickets.forEach(ticket => {
            const ticketElement = createTicketElement(ticket, 'completed');
            completedContainer.appendChild(ticketElement);
        });
    } else {
        // Show "No tickets yet..." message when no completed tickets
        completedContainer.innerHTML = `
            <div class="w-full h-full flex justify-center items-center text-neutral-500 font-manrope">
                No tickets yet...
            </div>
        `;
    }
    
    // Update ticket counts in tab buttons if they exist
    updateTicketCounts(pendingTickets.length, completedTickets.length);
}

function createTicketElement(ticket, status) {
    const ticketElement = document.createElement('div');
    ticketElement.className = `ticket-item w-full px-10 py-4 hover:bg-primary/10 cursor-pointer transition group ${status === 'completed' ? 'opacity-75' : ''}`;
    ticketElement.setAttribute('data-ticket-id', ticket._id);
    
    // Get the latest message for preview
    const latestMessage = ticket.messages && ticket.messages.length > 0 
        ? ticket.messages[ticket.messages.length - 1] 
        : null;
    
    // Get customer name from the first message (sender)
    const customerName = ticket.messages && ticket.messages.length > 0 
        ? ticket.messages[0].userName 
        : 'Unknown Customer';
    
    // Format date
    const ticketDate = new Date(ticket.createdAt);
    const formattedDate = ticketDate.toLocaleDateString();
    const formattedTime = ticketDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    
    ticketElement.innerHTML = `
        <div class="grid grid-cols-[1fr_auto] gap-2 font-inter items-center w-full">
            <p class="font-semibold text-neutral-900 font-manrope tracking-wide group-hover:text-primary transition">
                #${ticket.ticketNumber}
            </p>
            <span class="text-xs text-neutral-900 truncate overflow-hidden text-ellipsis text-right block max-w-[120px]">
                ${ticket.category || 'No Category'}
            </span>
            <p class="text-xs text-neutral-500 truncate overflow-hidden text-ellipsis block max-w-[120px]">
                ${customerName}
            </p>
            <span class="text-xs text-neutral-400 text-right">
                ${formattedDate} | ${formattedTime}
            </span>
        </div>
    `;
    
    // Add click event to load ticket details
    ticketElement.addEventListener('click', () => {
        loadTicketDetails(ticket);
        // Update active state
        document.querySelectorAll('.ticket-item, .ticket-active').forEach(item => {
            item.classList.remove('ticket-active');
            item.classList.add('ticket-item');
        });
        ticketElement.classList.remove('ticket-item');
        ticketElement.classList.add('ticket-active');
    });
    
    return ticketElement;
}

function loadTicketDetails(ticket) {
    console.log('Loading ticket details for:', ticket);
    
    // Update chat header
    const chatHeader = document.querySelector('.chat-header');
    if (chatHeader) {
        const ticketNumber = chatHeader.querySelector('p');
        const nameCategory = chatHeader.querySelector('.flex.items-center.gap-2');
        
        if (ticketNumber) ticketNumber.textContent = `#${ticket.ticketNumber}`;
        if (nameCategory) {
            const customerName = ticket.messages && ticket.messages.length > 0 
                ? ticket.messages[0].userName 
                : 'Unknown Customer';
            nameCategory.innerHTML = `
                <p class="truncate max-w-[50%]">${customerName}</p>
                |
                <span class="truncate text-right max-w-[50%]">${ticket.category || 'No Category'}</span>
            `;
        }
    }
    
    // Update messages area
    const messagesArea = document.querySelector('.flex-1.overflow-y-auto.px-10.py-6.space-y-6');
    if (messagesArea && ticket.messages) {
        messagesArea.innerHTML = '';
        
        ticket.messages.forEach(message => {
            const messageElement = createMessageElement(message, ticket);
            messagesArea.appendChild(messageElement);
        });
        
        // Scroll to bottom
        messagesArea.scrollTop = messagesArea.scrollHeight;
    }
    
    // Show main content area on mobile
    const ticketMain = document.getElementById('ticketMain');
    if (ticketMain) {
        ticketMain.classList.remove('translate-x-full');
        ticketMain.classList.add('translate-x-0');
    }
}

function createMessageElement(message, ticket) {
    const messageElement = document.createElement('div');
    const isEmployee = message.userLevel === 'Employee';
    
    messageElement.className = isEmployee ? 'message-csr' : 'message-guest';
    
    // Format date
    const messageDate = new Date(message.dateTime);
    const formattedTime = messageDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    
    messageElement.innerHTML = `
        <div class="message-bubble">
            <div class="flex items-center gap-2 mb-1">
                <span class="text-xs font-medium text-neutral-600">${message.userName}</span>
                <span class="text-xs text-neutral-400">${formattedTime}</span>
            </div>
            <p>${message.message}</p>
        </div>
    `;
    
    return messageElement;
}

function updateTicketCounts(pendingCount, completedCount) {
    // Update tab button text to show counts
    const pendingTab = document.querySelector('.tab-btn:first-of-type');
    const completedTab = document.querySelector('.tab-btn:last-of-type');
    
    if (pendingTab) {
        const span = pendingTab.querySelector('span');
        if (span) span.textContent = `Pending (${pendingCount})`;
    }
    
    if (completedTab) {
        const span = completedTab.querySelector('span');
        if (span) span.textContent = `Completed (${completedCount})`;
    }
}

function setupTabSwitching() {
    const tabButtons = document.querySelectorAll('.tab-btn');
    const tabContents = document.querySelectorAll('.tab-content');
    
    tabButtons.forEach((button, index) => {
        button.addEventListener('click', () => {
            setActiveTab(index);
        });
    });
}

function setActiveTab(index) {
    // Remove active state from all tabs
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.classList.remove('bg-white', 'text-primary', 'font-semibold', 'shadow');
        btn.classList.add('text-neutral-500');
    });
    
    document.querySelectorAll('.tab-content').forEach(content => {
        content.classList.add('hidden');
    });
    
    // Add active state to selected tab
    const selectedButton = document.querySelectorAll('.tab-btn')[index];
    const selectedContent = document.querySelectorAll('.tab-content')[index];
    
    if (selectedButton) {
        selectedButton.classList.remove('text-neutral-500');
        selectedButton.classList.add('bg-white', 'text-primary', 'font-semibold', 'shadow');
    }
    
    if (selectedContent) {
        selectedContent.classList.remove('hidden');
    }
}

function setupTicketSelection() {
    // Handle back button for mobile
    const backBtn = document.getElementById('ticketBackBtn');
    if (backBtn) {
        backBtn.addEventListener('click', () => {
            const ticketMain = document.getElementById('ticketMain');
            if (ticketMain) {
                ticketMain.classList.add('translate-x-full');
                ticketMain.classList.remove('translate-x-0');
            }
        });
    }
}

function showNoTicketsMessage() {
    const pendingContainer = document.querySelector('.tab-content:first-of-type');
    const completedContainer = document.querySelector('.tab-content:last-of-type');
    
    if (pendingContainer) {
        pendingContainer.innerHTML = `
            <div class="w-full h-full flex justify-center items-center text-neutral-500 font-manrope">
                No tickets yet...
            </div>
        `;
    }
    
    if (completedContainer) {
        completedContainer.innerHTML = `
            <div class="w-full h-full flex justify-center items-center text-neutral-500 font-manrope">
                No tickets yet...
            </div>
        `;
    }
}

function clearChatArea() {
    // Clear chat header
    const chatHeader = document.querySelector('.chat-header');
    if (chatHeader) {
        const ticketNumber = chatHeader.querySelector('p');
        const nameCategory = chatHeader.querySelector('.flex.items-center.gap-2');
        
        if (ticketNumber) ticketNumber.textContent = 'No Ticket Selected';
        if (nameCategory) {
            nameCategory.innerHTML = `
                <p class="truncate max-w-[50%] text-neutral-400">No Customer</p>
                |
                <span class="truncate text-right max-w-[50%] text-neutral-400">No Category</span>
            `;
        }
    }
    
    // Clear messages area
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
}

function showErrorMessage(message) {
    console.error(message);
    // You can implement a toast notification here if needed
}
