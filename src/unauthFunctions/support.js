document.addEventListener('DOMContentLoaded', () => {
  console.log("Support page loaded");

  // Function to get user ID from localStorage (same as genTicketInput.js)
  function getUserId() {
    const userId = localStorage.getItem('userId') ||
                   localStorage.getItem('userID') ||
                   localStorage.getItem('currentUser') ||
                   null;
    
    if (userId) {
      console.log('Found user ID in localStorage:', userId);
      return userId;
    }
    
    console.log('No user ID found in localStorage');
    return null;
  }

  // Function to format time ago
  function formatTimeAgo(dateString) {
    const now = new Date();
    const messageDate = new Date(dateString);
    const diffInSeconds = Math.floor((now - messageDate) / 1000);
    
    if (diffInSeconds < 60) {
      return 'Just now';
    } else if (diffInSeconds < 3600) {
      const minutes = Math.floor(diffInSeconds / 60);
      return `${minutes}m ago`;
    } else if (diffInSeconds < 86400) {
      const hours = Math.floor(diffInSeconds / 3600);
      return `${hours}h ago`;
    } else {
      const days = Math.floor(diffInSeconds / 86400);
      return `${days}d ago`;
    }
  }

  // Function to get status badge HTML
  function getStatusBadge(status) {
    switch (status.toLowerCase()) {
      case 'queue':
        return '<span class="ticket-status in-queue">In Queue</span>';
      case 'resolved':
        return '<span class="ticket-status resolved">Resolved</span>';
      case 'open':
        return '<span class="ticket-status open">Open</span>';
      case 'closed':
        return '<span class="ticket-status closed">Closed</span>';
      default:
        return '<span class="ticket-status">' + status + '</span>';
    }
  }

  // Cache for agent names to avoid repeated API calls
  const agentNameCache = new Map();
  
  // Store for all ticket data
  let allTicketsData = [];
  
  // Current selected ticket for message polling
  let currentSelectedTicketId = null;
  let messagePollingInterval = null;
  const POLLING_INTERVAL = 5000; // 5 seconds

  // Function to fetch customer service agent name
  async function fetchAgentName(customerServiceAgentId) {
    if (!customerServiceAgentId) {
      return 'No Agent Assigned';
    }

    // Check cache first
    if (agentNameCache.has(customerServiceAgentId)) {
      console.log('Using cached agent name for:', customerServiceAgentId);
      return agentNameCache.get(customerServiceAgentId);
    }

    console.log('Fetching agent name for ID:', customerServiceAgentId);

    try {
      const url = `https://betcha-api.onrender.com/employee/display/${customerServiceAgentId}`;
      console.log('Trying GET request to:', url);
      
      const response = await fetch(url);
      const data = await response.json();
      
      console.log('GET Response status:', response.status, 'Data:', data);
      
      if (response.ok && data._id) {
        // The API returns employee data directly, not nested under 'employee'
        // Fields are 'firstname' and 'lastname' (lowercase)
        const agentName = `${data.firstname} ${data.lastname}`;
        agentNameCache.set(customerServiceAgentId, agentName);
        console.log('Successfully fetched agent name:', agentName);
        return agentName;
      } else {
        console.warn('Failed to fetch agent name for ID:', customerServiceAgentId, 'Response:', data);
        return 'Unknown Agent';
      }
    } catch (error) {
      console.error('Error fetching agent name:', error);
      return 'Unknown Agent';
    }
  }

  // Function to fetch updated messages for a specific ticket
  async function fetchTicketMessages(ticketId) {
    try {
      const response = await fetch(`https://betcha-api.onrender.com/tk/display/${ticketId}`);
      const data = await response.json();
      
      if (response.ok && data.ticket) {
        console.log('Updated ticket messages fetched for:', ticketId);
        return data.ticket;
      } else {
        console.warn('Failed to fetch updated ticket messages:', data);
        return null;
      }
    } catch (error) {
      console.error('Error fetching updated ticket messages:', error);
      return null;
    }
  }

  // Function to start message polling for current ticket
  function startMessagePolling() {
    // Clear any existing polling
    stopMessagePolling();
    
    if (!currentSelectedTicketId) {
      console.log('No ticket selected for polling');
      return;
    }
    
    console.log('Starting message polling for ticket:', currentSelectedTicketId);
    
    messagePollingInterval = setInterval(async () => {
      if (!currentSelectedTicketId) {
        stopMessagePolling();
        return;
      }
      
      const updatedTicket = await fetchTicketMessages(currentSelectedTicketId);
      if (updatedTicket) {
        // Update the ticket in our local data
        const ticketIndex = allTicketsData.findIndex(t => t._id === currentSelectedTicketId);
        if (ticketIndex !== -1) {
          const oldMessageCount = allTicketsData[ticketIndex].messages.length;
          allTicketsData[ticketIndex] = updatedTicket;
          
          // Only re-render if there are new messages
          if (updatedTicket.messages.length !== oldMessageCount) {
            console.log('New messages detected, updating UI');
            renderTicketMessages(updatedTicket);
          }
        }
      }
    }, POLLING_INTERVAL);
  }

  // Function to stop message polling
  function stopMessagePolling() {
    if (messagePollingInterval) {
      console.log('Stopping message polling');
      clearInterval(messagePollingInterval);
      messagePollingInterval = null;
    }
  }

  // Function to create ticket card HTML
  async function createTicketCard(ticket, index) {
    const ticketNumber = ticket.ticketNumber;
    const status = ticket.status;
    const agentName = await fetchAgentName(ticket.customerServiceAgentId);
    const lastMessage = ticket.messages[ticket.messages.length - 1];
    const timeAgo = formatTimeAgo(lastMessage.dateTime);
    const isActive = index === 0; // Make first ticket active by default
    
    return `
      <div class="ticket-item w-full px-10 py-4 hover:bg-primary/10 cursor-pointer transition group ${isActive ? 'ticket-active' : ''}" 
           data-ticket-id="${ticket._id}" 
           data-ticket-number="${ticketNumber}"
           data-agent-name="${agentName}"
           data-status="${status || 'open'}">
        <div class="flex items-center justify-between">
          <p class="text-base font-bold text-gray-900 font-manrope tracking-wide group-hover:text-primary transition">
            #${ticketNumber}
          </p>
          ${getStatusBadge(status)}
        </div>
        <div class="flex items-center justify-between mt-1">
          <p class="text-xs text-gray-500 font-inter">
            CSR: <span class="text-sm text-gray-700 font-medium">${agentName}</span>
          </p>
          <span class="text-xs text-gray-400">${timeAgo}</span>
        </div>
      </div>
    `;
  }

  // Function to fetch and display tickets
  async function fetchAndDisplayTickets() {
    const userId = getUserId();
    
    if (!userId) {
      console.error('No user ID found. Cannot fetch tickets.');
      showNoTicketsMessage('Please log in to view your tickets.');
      return;
    }

    try {
      console.log('Fetching tickets for user:', userId);
      
      // Show loading state
      showLoadingState();
      
      const response = await fetch(`https://betcha-api.onrender.com/tk/sender/${userId}`);
      const data = await response.json();
      
      if (response.ok && data.tickets) {
        console.log('Tickets fetched successfully:', data.tickets);
        await displayTickets(data.tickets);
      } else {
        console.error('Failed to fetch tickets:', data);
        showNoTicketsMessage('Failed to load tickets. Please try again.');
      }
      
    } catch (error) {
      console.error('Error fetching tickets:', error);
      showNoTicketsMessage('Network error. Please check your connection and try again.');
    }
  }

  // Function to show loading state
  function showLoadingState() {
    const container = document.getElementById('ticketCardContainer');
    if (container) {
      container.innerHTML = `
        <div class="flex items-center justify-center py-10">
          <div class="flex items-center gap-3">
            <div class="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
            <span class="text-gray-500">Loading your tickets...</span>
          </div>
        </div>
      `;
    }
  }

  // Function to show no tickets message
  function showNoTicketsMessage(message) {
    const container = document.getElementById('ticketCardContainer');
    if (container) {
      container.innerHTML = `
        <div class="flex flex-col items-center justify-center py-10 px-5">
          <svg class="w-12 h-12 text-gray-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2M4 13h2m13-8l-4 4-4-4m5 8v4"></path>
          </svg>
          <p class="text-gray-500 text-center">${message}</p>
        </div>
      `;
    }
  }

  // Function to display tickets
  async function displayTickets(tickets) {
    const container = document.getElementById('ticketCardContainer');
    
    if (!container) {
      console.error('Ticket container not found');
      return;
    }

    if (tickets.length === 0) {
      showNoTicketsMessage('No tickets found. Create your first support ticket to get started.');
      return;
    }

    // Sort tickets by creation date (newest first)
    const sortedTickets = tickets.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    
    // Store ticket data for message loading
    allTicketsData = sortedTickets;
    
    // Show loading state while fetching agent names
    showLoadingState();
    
    try {
      // Generate HTML for all tickets (with agent names fetched)
      const ticketPromises = sortedTickets.map((ticket, index) => createTicketCard(ticket, index));
      const ticketsHTML = await Promise.all(ticketPromises);
      
      // Update container
      container.innerHTML = ticketsHTML.join('');
      
      // Add click event listeners to ticket cards
      addTicketClickEvents();
      
      // Initialize header with first ticket (if any)
      initializeHeaderWithFirstTicket();
    } catch (error) {
      console.error('Error creating ticket cards:', error);
      showNoTicketsMessage('Error displaying tickets. Please try again.');
    }
  }

  // Function to render ticket messages
  function renderTicketMessages(ticket) {
    const messageContainer = document.getElementById('messageContainer');
    if (!messageContainer) {
      console.error('Message container not found');
      return;
    }

    if (!ticket.messages || ticket.messages.length === 0) {
      messageContainer.innerHTML = `
        <div class="flex flex-col items-center justify-center py-10 px-5">
          <div class="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
            <svg class="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-3.582 8-8 8a8.959 8.959 0 01-4.906-1.447L3 21l2.447-5.094A8.959 8.959 0 013 12c0-4.418 3.582-8 8-8s8 3.582 8 8z"></path>
            </svg>
          </div>
          <p class="text-gray-500 text-center">No messages in this ticket yet.</p>
        </div>
      `;
      return;
    }

    // Sort messages by date (oldest first)
    const sortedMessages = ticket.messages.sort((a, b) => new Date(a.dateTime) - new Date(b.dateTime));
    
    // Generate HTML for all messages
    const messagesHTML = sortedMessages.map(message => {
      const isGuest = message.userLevel === 'Guest';
      // Guest messages should be on right side (green) = message-csr
      // Employee messages should be on left side (gray) = message-guest
      const messageClass = isGuest ? 'message-csr' : 'message-guest';
      const timeClass = isGuest ? 'text-xs text-white/70 mt-2' : 'text-xs text-gray-400 mt-2';
      
      // Format the message time
      const messageTime = new Date(message.dateTime).toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit'
      });
      
      return `
        <div class="${messageClass}">
          <div class="message-bubble">
            <p>${message.message}</p>
            <div class="message-time ${timeClass}">${messageTime}</div>
          </div>
        </div>
      `;
    }).join('');
    
    // Update the message container
    messageContainer.innerHTML = messagesHTML;
    
    // Scroll to bottom to show latest messages
    messageContainer.scrollTop = messageContainer.scrollHeight;
    
    console.log('Rendered', sortedMessages.length, 'messages for ticket:', ticket.ticketNumber);
  }

  // Function to add click events to ticket cards
  function addTicketClickEvents() {
    const ticketCards = document.querySelectorAll('.ticket-item');
    
    ticketCards.forEach(card => {
      card.addEventListener('click', () => {
        // Remove active class from all cards
        ticketCards.forEach(c => c.classList.remove('ticket-active'));
        
        // Add active class to clicked card
        card.classList.add('ticket-active');
        
        // Get ticket data
        const ticketId = card.getAttribute('data-ticket-id');
        const ticketNumber = card.getAttribute('data-ticket-number');
        const agentName = card.getAttribute('data-agent-name');
        const status = card.getAttribute('data-status');
        
        console.log('Selected ticket:', ticketNumber, ticketId, 'Agent:', agentName, 'Status:', status);
        
        // Set current ticket for polling
        currentSelectedTicketId = ticketId;
        
        // Find the full ticket data
        const fullTicketData = allTicketsData.find(ticket => ticket._id === ticketId);
        
        // Update the header with ticket details
        updateTicketHeader(ticketNumber, agentName, status);
        
        // Render the ticket messages
        if (fullTicketData) {
          renderTicketMessages(fullTicketData);
        } else {
          console.error('Could not find full ticket data for ID:', ticketId);
        }
        
        // Start polling for new messages
        startMessagePolling();
      });
    });
  }

  // Function to get status pill styling for header
  function getHeaderStatusPill(status) {
    if (!status) {
      return {
        text: 'Open',
        className: 'text-xs px-3 py-1 rounded-full bg-blue-100 text-blue-700 font-medium'
      };
    }

    switch (status.toLowerCase()) {
      case 'queue':
        return {
          text: 'In Queue',
          className: 'text-xs px-3 py-1 rounded-full bg-yellow-100 text-yellow-700 font-medium'
        };
      case 'resolved':
        return {
          text: 'Resolved',
          className: 'text-xs px-3 py-1 rounded-full bg-green-100 text-green-700 font-medium'
        };
      case 'open':
        return {
          text: 'Open',
          className: 'text-xs px-3 py-1 rounded-full bg-blue-100 text-blue-700 font-medium'
        };
      case 'closed':
        return {
          text: 'Closed',
          className: 'text-xs px-3 py-1 rounded-full bg-gray-100 text-gray-700 font-medium'
        };
      default:
        return {
          text: status,
          className: 'text-xs px-3 py-1 rounded-full bg-gray-100 text-gray-700 font-medium'
        };
    }
  }

  // Function to initialize header with first ticket data
  function initializeHeaderWithFirstTicket() {
    const firstTicketCard = document.querySelector('.ticket-item.ticket-active');
    if (firstTicketCard) {
      const ticketId = firstTicketCard.getAttribute('data-ticket-id');
      const ticketNumber = firstTicketCard.getAttribute('data-ticket-number');
      const agentName = firstTicketCard.getAttribute('data-agent-name');
      const status = firstTicketCard.getAttribute('data-status');
      
      // Set current selected ticket for polling
      currentSelectedTicketId = ticketId;
      
      // Update header
      updateTicketHeader(ticketNumber, agentName, status);
      
      // Find and render messages for the first ticket
      const fullTicketData = allTicketsData.find(ticket => ticket._id === ticketId);
      if (fullTicketData) {
        renderTicketMessages(fullTicketData);
      }
      
      // Start polling for this ticket
      startMessagePolling();
    }
  }

  // Function to update ticket header when a ticket is selected
  function updateTicketHeader(ticketNumber, agentName, status) {
    // Update ticket number
    const ticketNoElement = document.getElementById('ticketNo1');
    if (ticketNoElement) {
      ticketNoElement.textContent = `#${ticketNumber}`;
    }
    
    // Update customer service agent name
    const customerServiceNameElement = document.getElementById('customerServiceName');
    if (customerServiceNameElement) {
      customerServiceNameElement.textContent = agentName || 'No Agent Assigned';
    }
    
    // Update status pill
    const statusElement = document.getElementById('status');
    if (statusElement) {
      const statusPill = getHeaderStatusPill(status);
      statusElement.textContent = statusPill.text;
      statusElement.className = statusPill.className;
    }
    
    console.log('Updated header - Ticket:', ticketNumber, 'Agent:', agentName, 'Status:', status);
  }

  // Initialize the page
  fetchAndDisplayTickets();
  
  // Optional: Add refresh functionality
  window.refreshTickets = fetchAndDisplayTickets;
});
