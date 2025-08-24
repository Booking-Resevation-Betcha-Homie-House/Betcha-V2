document.addEventListener('DOMContentLoaded', () => {
  // Initialize dashboard features
  initializeDashboardFeatures();
  
  function updateGridLayout() {
    const grids = document.querySelectorAll('.my-grid');

    grids.forEach(grid => {
      const visibleCards = [...grid.children].filter(el => !el.classList.contains('hidden'));
      
      // reset all spans first
      visibleCards.forEach(el => el.classList.remove('md:col-span-2'));

      // if only 1 visible card, make it full width
      if (visibleCards.length === 1) {
        visibleCards[0].classList.add('md:col-span-2');
      }
    });
  }

  // Run on page load
  updateGridLayout();

  // Example: when you manually toggle
  document.querySelector('#card2')?.classList.toggle('hidden');
  updateGridLayout();
});

// Initialize dashboard features
function initializeDashboardFeatures() {
  // Load tickets if tickets container exists
  const ticketsContainer = document.querySelector('#tickets .space-y-4');
  if (ticketsContainer) {
    console.log('Tickets container found, initializing ticket loading...');
    loadAndPopulateTickets();
  } else {
    console.warn('Tickets container not found');
  }
}

// Load and populate tickets from API
async function loadAndPopulateTickets() {
  try {
    // Get user ID from localStorage
    const userId = localStorage.getItem('userId') || localStorage.getItem('userID');
    if (!userId) {
      console.warn('User ID not found, cannot load tickets');
      return;
    }

    console.log('Loading tickets for user:', userId);
    
    // Fetch tickets from API
    const response = await fetch(`https://betcha-api.onrender.com/tk/customer-service/${userId}`);
    
    if (!response.ok) {
      throw new Error(`Failed to fetch tickets: ${response.status}`);
    }
    
    const data = await response.json();
    console.log('Tickets data received:', data);
    
    if (data.tickets && Array.isArray(data.tickets)) {
      populateTickets(data.tickets);
    } else {
      console.warn('No tickets data or invalid format');
      showNoTicketsMessage();
    }
    
  } catch (error) {
    console.error('Error loading tickets:', error);
    showTicketsError();
  }
}

// Populate tickets in the UI
function populateTickets(tickets) {
  const ticketsContainer = document.querySelector('#tickets .space-y-4');
  if (!ticketsContainer) {
    console.warn('Tickets container not found');
    return;
  }
  
  // Clear existing content
  ticketsContainer.innerHTML = '';
  
  if (tickets.length === 0) {
    showNoTicketsMessage();
    return;
  }
  
  // Sort tickets by creation date (newest first)
  const sortedTickets = tickets.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  
  // Create ticket elements
  sortedTickets.forEach(ticket => {
    const ticketElement = createTicketElement(ticket);
    ticketsContainer.appendChild(ticketElement);
  });
  
  console.log(`Populated ${tickets.length} tickets`);
}

// Create individual ticket element matching the existing HTML structure
function createTicketElement(ticket) {
  const ticketDiv = document.createElement('div');
  ticketDiv.className = 'flex items-center justify-between bg-neutral-50 p-4 border cursor-pointer border-neutral-200 rounded-xl group hover:bg-neutral-100 transition-all duration-300 ease-in-out';
  
  // Get the latest message for preview
  const latestMessage = ticket.messages && ticket.messages.length > 0 
    ? ticket.messages[ticket.messages.length - 1] 
    : null;
  
  // Get sender name from the latest message or use a default
  const senderName = latestMessage ? latestMessage.userName : 'Guest User';
  
  // Get the first message content for the concern description
  const firstMessage = ticket.messages && ticket.messages.length > 0 
    ? ticket.messages[0] 
    : null;
  
  const concernText = firstMessage ? firstMessage.message : 'General Inquiry';
  
  // Truncate concern text if too long
  const truncatedConcern = concernText.length > 30 ? concernText.substring(0, 30) + '...' : concernText;
  
  ticketDiv.innerHTML = `
    <div class="flex flex-col">
      <span class="text-xs text-neutral-400">#${ticket.ticketNumber}</span>
      <span class="font-medium text-sm text-neutral-800">${senderName}</span>
      <span class="text-sm text-neutral-500">Concern: ${truncatedConcern}</span>
    </div>
    <svg class="w-3 stroke-neutral-500 group-hover:stroke-neutral-700 group-hover:stroke-[1.5px] transition-all duration-300 ease-in-out" viewBox="0 0 10 17" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M1 0.5L9 8.5L1 16.5" stroke-linecap="round" stroke-linejoin="round"/>
    </svg>
  `;
  
  // Make ticket clickable - redirect to tk.html
  ticketDiv.addEventListener('click', () => {
    // Store ticket data in localStorage for tk.html to access
    localStorage.setItem('selectedTicket', JSON.stringify(ticket));
    localStorage.setItem('redirectFromDashboard', 'true');
    
    // Redirect to tk.html
    window.location.href = 'tk.html';
  });
  
  return ticketDiv;
}

// Show no tickets message
function showNoTicketsMessage() {
  const ticketsContainer = document.querySelector('#tickets .space-y-4');
  if (!ticketsContainer) return;
  
  ticketsContainer.innerHTML = `
    <div class="text-center py-8">
      <svg class="w-16 h-16 text-neutral-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
      </svg>
      <p class="text-neutral-500 font-medium mb-2">No tickets found</p>
      <p class="text-neutral-400 text-sm">All caught up! No pending tickets at the moment.</p>
    </div>
  `;
}

// Show tickets error message
function showTicketsError() {
  const ticketsContainer = document.querySelector('#tickets .space-y-4');
  if (!ticketsContainer) return;
  
  ticketsContainer.innerHTML = `
    <div class="text-center py-8">
      <svg class="w-16 h-16 text-red-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.732 19.5c-.77.833.192 2.5 1.732 2.5z"/>
      </svg>
      <p class="text-red-500 font-medium mb-2">Error loading tickets</p>
      <p class="text-neutral-400 text-sm mb-3">Please try refreshing the page</p>
      <button onclick="loadAndPopulateTickets()" class="text-primary hover:underline text-sm">Try again</button>
    </div>
  `;
}
