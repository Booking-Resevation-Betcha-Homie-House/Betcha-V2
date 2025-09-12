document.addEventListener('DOMContentLoaded', () => {
  console.log("Support page loaded");

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

  const agentNameCache = new Map();

  let allTicketsData = [];

  let currentSelectedTicketId = null;
  let messagePollingInterval = null;
  const POLLING_INTERVAL = 5000; 

  function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  async function fetchAgentName(customerServiceAgentId) {
    if (!customerServiceAgentId) {
      return 'No Agent Assigned';
    }

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

  function startMessagePolling() {

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

        const ticketIndex = allTicketsData.findIndex(t => t._id === currentSelectedTicketId);
        if (ticketIndex !== -1) {
          const oldMessageCount = allTicketsData[ticketIndex].messages.length;
          allTicketsData[ticketIndex] = updatedTicket;

          if (updatedTicket.messages.length !== oldMessageCount) {
            console.log('New messages detected, updating UI');
            renderTicketMessages(updatedTicket);
          }
        }
      }
    }, POLLING_INTERVAL);
  }

  function stopMessagePolling() {
    if (messagePollingInterval) {
      console.log('Stopping message polling');
      clearInterval(messagePollingInterval);
      messagePollingInterval = null;
    }
  }

  async function createTicketCard(ticket, index) {
    const ticketNumber = ticket.ticketNumber;
    const status = ticket.status;
    const agentName = await fetchAgentName(ticket.customerServiceAgentId);
    const lastMessage = ticket.messages[ticket.messages.length - 1];
    const timeAgo = formatTimeAgo(lastMessage.dateTime);
    const isActive = index === 0; 
    
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

  async function fetchAndDisplayTickets() {
    const userId = getUserId();
    
    if (!userId) {
      console.error('No user ID found. Cannot fetch tickets.');

      await new Promise(resolve => setTimeout(resolve, 800));
      showNoTicketsMessage('Please log in to view your tickets.');
      return;
    }

    try {
      console.log('Fetching tickets for user:', userId);
      
      const response = await fetch(`https://betcha-api.onrender.com/tk/sender/${userId}`);
      const data = await response.json();
      
      if (response.ok && data.tickets) {
        console.log('Tickets fetched successfully:', data.tickets);
        await displayTickets(data.tickets);
      } else {
        console.error('Failed to fetch tickets:', data);

        await new Promise(resolve => setTimeout(resolve, 500));
        showNoTicketsMessage('Failed to load tickets. Please try again.');
      }
      
    } catch (error) {
      console.error('Error fetching tickets:', error);

      await new Promise(resolve => setTimeout(resolve, 500));
      showNoTicketsMessage('Network error. Please check your connection and try again.');
    }
  }

  function showInitialSkeletonLoading() {

    const ticketContainer = document.getElementById('ticketCardContainer');
    if (ticketContainer) {
      const skeletonTickets = Array(5).fill(0).map((_, index) => {

        const titleWidths = ['w-20', 'w-24', 'w-28', 'w-32', 'w-24'];
        const statusWidths = ['w-14', 'w-16', 'w-18', 'w-16', 'w-20'];
        const nameWidths = ['w-16', 'w-20', 'w-24', 'w-18', 'w-22'];
        const timeWidths = ['w-10', 'w-12', 'w-14', 'w-12', 'w-16'];
        
        return `
          <div class="animate-pulse w-full px-10 py-4 border-b border-neutral-100 last:border-b-0">
            <div class="flex items-center justify-between mb-3">
              <div class="h-4 bg-gray-200 rounded-full ${titleWidths[index]}"></div>
              <div class="h-5 bg-gray-200 rounded-full ${statusWidths[index]}"></div>
            </div>
            <div class="flex items-center justify-between">
              <div class="flex items-center gap-2">
                <div class="h-3 bg-gray-200 rounded-full w-8"></div>
                <div class="h-3 bg-gray-200 rounded-full ${nameWidths[index]}"></div>
              </div>
              <div class="h-3 bg-gray-200 rounded-full ${timeWidths[index]}"></div>
            </div>
          </div>
        `;
      }).join('');
      
      ticketContainer.innerHTML = skeletonTickets;
    }

    const messageContainer = document.getElementById('messageContainer');
    if (messageContainer) {
      const skeletonMessages = `
        <div class="animate-pulse space-y-6">
          <!-- Date separator skeleton -->
          <div class="flex items-center justify-center my-4">
            <div class="bg-gray-200 h-6 w-40 rounded-full"></div>
          </div>
          
          <!-- Left side message skeleton (CSR) -->
          <div class="flex justify-start">
            <div class="bg-gray-200 rounded-2xl p-4 max-w-[70%] space-y-2">
              <div class="h-4 bg-gray-300 rounded w-full"></div>
              <div class="h-4 bg-gray-300 rounded w-3/4"></div>
              <div class="h-3 bg-gray-300 rounded w-16 mt-2"></div>
            </div>
          </div>

          <!-- Right side message skeleton (User) -->
          <div class="flex justify-end">
            <div class="bg-gray-200 rounded-2xl p-4 max-w-[70%] space-y-2">
              <div class="h-4 bg-gray-300 rounded w-full"></div>
              <div class="h-4 bg-gray-300 rounded w-2/3"></div>
              <div class="h-3 bg-gray-300 rounded w-16 mt-2"></div>
            </div>
          </div>

          <!-- Left side message skeleton -->
          <div class="flex justify-start">
            <div class="bg-gray-200 rounded-2xl p-4 max-w-[70%] space-y-2">
              <div class="h-4 bg-gray-300 rounded w-5/6"></div>
              <div class="h-3 bg-gray-300 rounded w-16 mt-2"></div>
            </div>
          </div>

          <!-- Right side message skeleton -->
          <div class="flex justify-end">
            <div class="bg-gray-200 rounded-2xl p-4 max-w-[70%] space-y-2">
              <div class="h-4 bg-gray-300 rounded w-full"></div>
              <div class="h-4 bg-gray-300 rounded w-4/5"></div>
              <div class="h-4 bg-gray-300 rounded w-1/2"></div>
              <div class="h-3 bg-gray-300 rounded w-16 mt-2"></div>
            </div>
          </div>

          <!-- Loading indicator at bottom -->
          <div class="flex items-center justify-center py-4 opacity-75">
            <div class="flex items-center gap-3">
              <div class="w-4 h-4 border-2 border-gray-300 border-t-gray-400 rounded-full animate-spin"></div>
              <span class="text-gray-400 text-sm">Loading your conversations...</span>
            </div>
          </div>
        </div>
      `;
      
      messageContainer.innerHTML = skeletonMessages;
    }

    const ticketNoElement = document.getElementById('ticketNo1');
    const customerServiceNameElement = document.getElementById('customerServiceName');
    const statusElement = document.getElementById('status');
    
    if (ticketNoElement) {
      ticketNoElement.innerHTML = '<div class="animate-pulse h-4 bg-gray-200 rounded w-20 inline-block"></div>';
    }
    
    if (customerServiceNameElement) {
      customerServiceNameElement.innerHTML = '<div class="animate-pulse h-3 bg-gray-200 rounded w-24 inline-block"></div>';
    }
    
    if (statusElement) {
      statusElement.innerHTML = '<div class="animate-pulse h-5 bg-gray-200 rounded-full w-16"></div>';
      statusElement.className = 'animate-pulse';
    }

    disableMessageInput();
    
    console.log('Initial skeleton loading displayed');
  }

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

    const sortedTickets = tickets.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    allTicketsData = sortedTickets;
    
    try {

      const ticketPromises = sortedTickets.map((ticket, index) => createTicketCard(ticket, index));
      const ticketsHTML = await Promise.all(ticketPromises);

      container.innerHTML = ticketsHTML.join('');

      addTicketClickEvents();

      initializeHeaderWithFirstTicket();
    } catch (error) {
      console.error('Error creating ticket cards:', error);
      showNoTicketsMessage('Error displaying tickets. Please try again.');
    }
  }

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
          <p class="text-gray-400 text-sm text-center mt-2">Start the conversation by sending a message below.</p>
        </div>
      `;
      return;
    }

    const sortedMessages = ticket.messages.sort((a, b) => new Date(a.dateTime) - new Date(b.dateTime));

    const isScrolledToBottom = messageContainer.scrollHeight - messageContainer.clientHeight <= messageContainer.scrollTop + 1;

    const messagesHTML = sortedMessages.map((message, index) => {
      const isGuest = message.userLevel === 'Guest';

      const messageClass = isGuest ? 'message-csr' : 'message-guest';
      const timeClass = isGuest ? 'text-xs text-white/70 mt-2' : 'text-xs text-gray-400 mt-2';

      const messageDate = new Date(message.dateTime);
      const messageTime = messageDate.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit'
      });

      let dateSeparator = '';
      if (index === 0) {

        dateSeparator = `
          <div class="flex items-center justify-center my-4">
            <div class="bg-gray-100 px-3 py-1 rounded-full text-xs text-gray-500">
              ${messageDate.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
            </div>
          </div>
        `;
      } else {
        const prevMessageDate = new Date(sortedMessages[index - 1].dateTime);
        if (messageDate.toDateString() !== prevMessageDate.toDateString()) {
          dateSeparator = `
            <div class="flex items-center justify-center my-4">
              <div class="bg-gray-100 px-3 py-1 rounded-full text-xs text-gray-500">
                ${messageDate.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
              </div>
            </div>
          `;
        }
      }

      const processedMessage = escapeHtml(message.message).replace(/\n/g, '<br>');
      
      return `
        ${dateSeparator}
        <div class="${messageClass}">
          <div class="message-bubble">
            <div style="white-space: pre-wrap; word-wrap: break-word; overflow-wrap: anywhere;">${processedMessage}</div>
            <div class="message-time ${timeClass}">${messageTime}</div>
          </div>
        </div>
      `;
    }).join('');

    messageContainer.innerHTML = messagesHTML;

    if (isScrolledToBottom || sortedMessages.length === 1) {
      messageContainer.scrollTop = messageContainer.scrollHeight;
    }
    
    console.log('Rendered', sortedMessages.length, 'messages for ticket:', ticket.ticketNumber);
  }

  function addTicketClickEvents() {
    const ticketCards = document.querySelectorAll('.ticket-item');
    
    ticketCards.forEach(card => {
      card.addEventListener('click', () => {

        ticketCards.forEach(c => c.classList.remove('ticket-active'));

        card.classList.add('ticket-active');

        const ticketId = card.getAttribute('data-ticket-id');
        const ticketNumber = card.getAttribute('data-ticket-number');
        const agentName = card.getAttribute('data-agent-name');
        const status = card.getAttribute('data-status');
        
        console.log('Selected ticket:', ticketNumber, ticketId, 'Agent:', agentName, 'Status:', status);

        currentSelectedTicketId = ticketId;

        showMessageLoadingState();

        const fullTicketData = allTicketsData.find(ticket => ticket._id === ticketId);

        updateTicketHeader(ticketNumber, agentName, status);

        if (fullTicketData) {
          renderTicketMessages(fullTicketData);
        } else {
          console.error('Could not find full ticket data for ID:', ticketId);
          showMessageError('Failed to load ticket messages');
        }

        stopMessagePolling();
        startMessagePolling();

        enableMessageInput();

        showChatArea();
      });
    });
  }

  function showMessageLoadingState() {
    const messageContainer = document.getElementById('messageContainer');
    if (messageContainer) {
      messageContainer.innerHTML = `
        <div class="animate-pulse space-y-6 py-6">
          <!-- Quick skeleton for message switching -->
          <div class="flex justify-start">
            <div class="bg-gray-200 rounded-2xl p-4 max-w-[70%]">
              <div class="space-y-2">
                <div class="h-4 bg-gray-300 rounded w-full"></div>
                <div class="h-4 bg-gray-300 rounded w-3/4"></div>
                <div class="h-3 bg-gray-300 rounded w-16 mt-2"></div>
              </div>
            </div>
          </div>

          <div class="flex justify-end">
            <div class="bg-gray-200 rounded-2xl p-4 max-w-[70%]">
              <div class="space-y-2">
                <div class="h-4 bg-gray-300 rounded w-full"></div>
                <div class="h-4 bg-gray-300 rounded w-2/3"></div>
                <div class="h-3 bg-gray-300 rounded w-16 mt-2"></div>
              </div>
            </div>
          </div>

          <div class="flex items-center justify-center py-4">
            <div class="flex items-center gap-3">
              <div class="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
              <span class="text-gray-500 text-sm">Loading messages...</span>
            </div>
          </div>
        </div>
      `;
    }
  }

  function showMessageError(errorMessage) {
    const messageContainer = document.getElementById('messageContainer');
    if (messageContainer) {
      messageContainer.innerHTML = `
        <div class="flex flex-col items-center justify-center py-10 px-5">
          <svg class="w-12 h-12 text-red-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
          </svg>
          <p class="text-red-500 text-center">${errorMessage}</p>
          <button onclick="location.reload()" class="mt-3 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition">
            Refresh Page
          </button>
        </div>
      `;
    }
  }

  function enableMessageInput() {
    const messageBox = document.getElementById('messageBox');
    const sendButton = document.querySelector('form button[type="submit"]');
    
    if (messageBox) {
      messageBox.disabled = false;
      messageBox.placeholder = 'Type a message...';
    }
    
    if (sendButton) {
      sendButton.disabled = false;
    }
  }

  function disableMessageInput() {
    const messageBox = document.getElementById('messageBox');
    const sendButton = document.querySelector('form button[type="submit"]');
    
    if (messageBox) {
      messageBox.disabled = true;
      messageBox.placeholder = 'Select a ticket to start messaging...';
      messageBox.value = '';
    }
    
    if (sendButton) {
      sendButton.disabled = true;
    }
  }

  function showChatArea() {
    const ticketMain = document.getElementById('ticketMain');
    if (ticketMain) {
      ticketMain.classList.remove('translate-x-full');
      ticketMain.classList.add('translate-x-0');
    }
  }

  function hideChatArea() {
    const ticketMain = document.getElementById('ticketMain');
    if (ticketMain) {
      ticketMain.classList.remove('translate-x-0');
      ticketMain.classList.add('translate-x-full');
    }
  }

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

  function initializeHeaderWithFirstTicket() {
    const firstTicketCard = document.querySelector('.ticket-item.ticket-active');
    if (firstTicketCard) {
      const ticketId = firstTicketCard.getAttribute('data-ticket-id');
      const ticketNumber = firstTicketCard.getAttribute('data-ticket-number');
      const agentName = firstTicketCard.getAttribute('data-agent-name');
      const status = firstTicketCard.getAttribute('data-status');

      currentSelectedTicketId = ticketId;

      updateTicketHeader(ticketNumber, agentName, status);

      const fullTicketData = allTicketsData.find(ticket => ticket._id === ticketId);
      if (fullTicketData) {
        renderTicketMessages(fullTicketData);
      }

      startMessagePolling();

      enableMessageInput();
    } else {

      disableMessageInput();

      const messageContainer = document.getElementById('messageContainer');
      if (messageContainer) {
        messageContainer.innerHTML = `
          <div class="flex flex-col items-center justify-center py-10 px-5">
            <div class="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
              <svg class="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-3.582 8-8 8a8.959 8.959 0 01-4.906-1.447L3 21l2.447-5.094A8.959 8.959 0 013 12c0-4.418 3.582-8 8-8s8 3.582 8 8z"></path>
              </svg>
            </div>
            <p class="text-gray-500 text-center">Select a ticket to start viewing messages.</p>
          </div>
        `;
      }
    }
  }

  function setupMobileNavigation() {
    const backButton = document.getElementById('ticketBackBtn');
    if (backButton) {
      backButton.addEventListener('click', () => {
        hideChatArea();
      });
    }
  }

  function updateTicketHeader(ticketNumber, agentName, status) {

    const ticketNoElement = document.getElementById('ticketNo1');
    if (ticketNoElement) {
      ticketNoElement.textContent = `#${ticketNumber}`;
    }

    const customerServiceNameElement = document.getElementById('customerServiceName');
    if (customerServiceNameElement) {
      customerServiceNameElement.textContent = agentName || 'No Agent Assigned';
    }

    const statusElement = document.getElementById('status');
    if (statusElement) {
      const statusPill = getHeaderStatusPill(status);
      statusElement.textContent = statusPill.text;
      statusElement.className = statusPill.className;
    }
    
    console.log('Updated header - Ticket:', ticketNumber, 'Agent:', agentName, 'Status:', status);
  }

  function setupMessageForm() {
    const messageForm = document.querySelector('form');
    const messageBox = document.getElementById('messageBox');
    
    if (!messageForm || !messageBox) {
      console.error('Message form or message box not found');
      return;
    }

    const newForm = messageForm.cloneNode(true);
    messageForm.parentNode.replaceChild(newForm, messageForm);

    const newMessageBox = document.getElementById('messageBox');
    const newMessageForm = document.querySelector('form');

    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) || 
                     ('ontouchstart' in window) || 
                     (navigator.maxTouchPoints > 0);

    newMessageForm.addEventListener('submit', async (event) => {
      event.preventDefault(); 
      
      const message = newMessageBox.value.trim();
      if (!message) {
        console.log('No message to send');
        showToast('Please enter a message', 'warning');
        return;
      }
      
      if (!currentSelectedTicketId) {
        console.error('No ticket selected');
        showToast('Please select a ticket first', 'error');
        return;
      }
      
      const userId = getUserId();
      if (!userId) {
        console.error('User not logged in');
        showToast('Please log in to send messages', 'error');
        return;
      }

      await sendMessage(message, currentSelectedTicketId, userId);

      newMessageBox.value = '';
      autoResize(); 
      newMessageBox.focus(); 
    });

    function autoResize() {
      newMessageBox.style.height = 'auto';
      const maxHeight = 104; 
      const minHeight = 32;  
      const scrollHeight = Math.max(newMessageBox.scrollHeight, minHeight);
      
      if (scrollHeight <= maxHeight) {
        newMessageBox.style.height = scrollHeight + 'px';
      } else {
        newMessageBox.style.height = maxHeight + 'px';
      }
      
      newMessageBox.style.overflowY = scrollHeight > maxHeight ? 'auto' : 'hidden';
    }

    newMessageBox.addEventListener('input', autoResize);
    newMessageBox.addEventListener('paste', () => {
      setTimeout(autoResize, 10);
    });

    newMessageBox.addEventListener('keydown', function(event) {
      if (event.key === 'Enter') {
        if (isMobile) {

          setTimeout(autoResize, 10);
          return; 
        } else {

          if (!event.shiftKey) {
            event.preventDefault();
            newMessageForm.dispatchEvent(new Event('submit'));
          } else {
            setTimeout(autoResize, 10);
          }
        }
      }
    });

    if (isMobile) {
      newMessageBox.placeholder = "Type a message... (Use send button to submit)";
    }

    autoResize();
    
    console.log('Enhanced message form setup completed');
  }

  async function sendMessage(message, ticketId, userId) {
    const sendButton = document.querySelector('form button[type="submit"]');
    let originalHTML = null;
    
    try {
      console.log('Sending message:', message, 'to ticket:', ticketId);

      if (sendButton) {
        originalHTML = sendButton.innerHTML;
        sendButton.disabled = true;
        sendButton.innerHTML = `
          <svg class="h-5 w-auto animate-spin fill-primary/50" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M10 3.5a6.5 6.5 0 106.5 6.5h-2a4.5 4.5 0 11-4.5-4.5v2z"/>
          </svg>
        `;
      }
      
      const response = await fetch(`https://betcha-api.onrender.com/tk/reply/${ticketId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: userId,
          userLevel: 'Guest',  
          message: message
        })
      });
      
      const result = await response.json();
      
      if (response.ok) {
        console.log('Message sent successfully:', result);

        addMessageToUI(message, true); 

        const updatedTicket = await fetchTicketMessages(ticketId);
        if (updatedTicket) {

          const ticketIndex = allTicketsData.findIndex(t => t._id === ticketId);
          if (ticketIndex !== -1) {
            allTicketsData[ticketIndex] = updatedTicket;

            renderTicketMessages(updatedTicket);
          }
        }
      } else {
        console.error('Failed to send message:', result);
        showToast('Failed to send message. Please try again.', 'error');
      }
      
    } catch (error) {
      console.error('Error sending message:', error);
      showToast('Network error. Please check your connection.', 'error');
    } finally {

      if (sendButton && originalHTML) {
        sendButton.disabled = false;
        sendButton.innerHTML = originalHTML;
      }
    }
  }

  function addMessageToUI(message, isFromCurrentUser = false) {
    const messageContainer = document.getElementById('messageContainer');
    if (!messageContainer) return;

    const messageClass = isFromCurrentUser ? 'message-csr' : 'message-guest';
    const timeClass = isFromCurrentUser ? 'text-xs text-white/70 mt-2' : 'text-xs text-gray-400 mt-2';
    
    const currentTime = new Date().toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    });

    const processedMessage = escapeHtml(message).replace(/\n/g, '<br>');

    const messageHTML = `
      <div class="${messageClass}">
        <div class="message-bubble">
          <div style="white-space: pre-wrap; word-wrap: break-word; overflow-wrap: anywhere;">${processedMessage}</div>
          <div class="message-time ${timeClass}">${currentTime}</div>
        </div>
      </div>
    `;

    messageContainer.insertAdjacentHTML('beforeend', messageHTML);
    messageContainer.scrollTop = messageContainer.scrollHeight;
  }

  function showToast(message, type = 'info') {

    if (typeof window.showToast === 'function') {
      window.showToast(message, type);
    } else {

      console.log(`Toast (${type}):`, message);
    }
  }

  async function initializePage() {
    console.log('Initializing support page...');

    showInitialSkeletonLoading();

    setupMobileNavigation();

    setupMessageForm();

    await new Promise(resolve => setTimeout(resolve, 500));

    await fetchAndDisplayTickets();
    
    console.log('Support page initialization complete');
  }

  initializePage();

  window.refreshTickets = fetchAndDisplayTickets;
});
