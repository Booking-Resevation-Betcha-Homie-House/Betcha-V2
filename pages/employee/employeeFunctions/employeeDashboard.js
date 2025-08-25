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

  // Load transactions if transactions container exists
  const transactionsContainer = document.querySelector('#transactions .space-y-4');
  if (transactionsContainer) {
    console.log('Transactions container found, initializing transaction loading...');
    loadAndPopulateTransactions();
  } else {
    console.warn('Transactions container not found');
  }

  // Load today's check-ins if PM container exists
  const pmContainer = document.querySelector('#PM .space-y-4');
  if (pmContainer) {
    console.log('PM container found, initializing today\'s check-ins loading...');
    loadAndPopulateTodayCheckins();
  } else {
    console.warn('PM container not found');
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

// Load and populate transactions from API
async function loadAndPopulateTransactions() {
  try {
    // Get property IDs from localStorage
    const properties = localStorage.getItem('properties');
    if (!properties) {
      console.warn('Properties not found in localStorage, cannot load transactions');
      return;
    }

    let propertyIds;
    try {
      propertyIds = JSON.parse(properties);
    } catch (e) {
      console.warn('Invalid properties format in localStorage:', e);
      return;
    }

    if (!Array.isArray(propertyIds) || propertyIds.length === 0) {
      console.warn('No property IDs found, cannot load transactions');
      return;
    }

    console.log('Loading transactions for properties:', propertyIds);
    
    // Fetch transactions from API
    const response = await fetch('https://betcha-api.onrender.com/ts/transactionsByProperties', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        propertyIds: propertyIds
      })
    });
    
    if (!response.ok) {
      throw new Error(`Failed to fetch transactions: ${response.status}`);
    }
    
    const data = await response.json();
    console.log('Transactions data received:', data);
    
    // Handle the actual API response structure with 'pending' and 'completed' arrays
    if (data.pending || data.completed) {
      // Combine pending and completed transactions
      const allTransactions = [
        ...(data.pending || []),
        ...(data.completed || [])
      ];
      
      if (allTransactions.length > 0) {
        populateTransactions(allTransactions);
      } else {
        console.warn('No transactions found in response');
        showNoTransactionsMessage();
      }
    } else {
      console.warn('Invalid response format - expected pending/completed arrays');
      showNoTransactionsMessage();
    }
    
  } catch (error) {
    console.error('Error loading transactions:', error);
    showTransactionsError();
  }
}

// Populate transactions in the UI
function populateTransactions(transactions) {
  const transactionsContainer = document.querySelector('#transactions .space-y-4');
  if (!transactionsContainer) {
    console.warn('Transactions container not found');
    return;
  }
  
  // Clear existing content
  transactionsContainer.innerHTML = '';
  
  if (transactions.length === 0) {
    showNoTransactionsMessage();
    return;
  }
  
  // Sort transactions by check-in date (newest first)
  const sortedTransactions = transactions.sort((a, b) => new Date(b.checkIn) - new Date(a.checkIn));
  
  // Limit to 5 transactions for dashboard display
  const limitedTransactions = sortedTransactions.slice(0, 5);
  
  // Create transaction elements
  limitedTransactions.forEach(transaction => {
    const transactionElement = createTransactionElement(transaction);
    transactionsContainer.appendChild(transactionElement);
  });
  
  console.log(`Populated ${limitedTransactions.length} transactions`);
}

// Create individual transaction element matching the existing HTML structure
function createTransactionElement(transaction) {
  const transactionDiv = document.createElement('div');
  transactionDiv.className = 'grid grid-cols-2 md:grid-cols-4 gap-5 p-4 bg-neutral-50 rounded-xl border border-neutral-200 hover:bg-neutral-100 transition-all duration-300 ease-in-out';
  
  // Format the transaction number using the correct field name
  const transactionNumber = transaction.transNo || transaction.transactionId || transaction._id || 'N/A';
  
  // Get guest name using the correct field name
  const guestName = transaction.nameOfGuest || transaction.guestName || transaction.customerName || 'Guest User';
  
  // Get property name using the correct field name
  const propertyName = transaction.propertyName || 'Property';
  
  // Format check-in date using the correct field name
  let checkInDate = 'N/A';
  if (transaction.checkIn) {
    try {
      const date = new Date(transaction.checkIn);
      checkInDate = date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      });
    } catch (e) {
      console.warn('Invalid checkIn date format:', transaction.checkIn);
    }
  }
  
  transactionDiv.innerHTML = `
    <div class="flex-1 min-w-0">
      <p class="text-xs text-neutral-500 font-manrope">Trans#</p>
      <p class="text-sm font-semibold text-neutral-800 font-inter truncate">#${transactionNumber}</p>
    </div>
    <div class="flex-1 min-w-0">
      <p class="text-xs text-neutral-500 font-manrope">Guest</p>
      <p class="text-sm font-semibold text-neutral-800 font-inter truncate">${guestName}</p>
    </div>
    <div class="flex-1 min-w-0">
      <p class="text-xs text-neutral-500 font-manrope">Property</p>
      <p class="text-sm font-semibold text-neutral-800 font-inter truncate">${propertyName}</p>
    </div>
    <div class="flex-1 min-w-0">
      <p class="text-xs text-neutral-500 font-manrope">Check-In Date</p>
      <p class="text-sm font-semibold text-neutral-800 font-inter truncate">${checkInDate}</p>
    </div>
  `;
  
  // Make transaction clickable - redirect to ts.html
  transactionDiv.addEventListener('click', () => {
    // Store transaction data in localStorage for ts.html to access
    localStorage.setItem('selectedTransaction', JSON.stringify(transaction));
    localStorage.setItem('redirectFromDashboard', 'true');
    localStorage.setItem('openTransactionModal', 'true');
    
    // Redirect to ts.html
    window.location.href = 'ts.html';
  });
  
  return transactionDiv;
}

// Show no transactions message
function showNoTransactionsMessage() {
  const transactionsContainer = document.querySelector('#transactions .space-y-4');
  if (!transactionsContainer) return;
  
  transactionsContainer.innerHTML = `
    <div class="text-center py-8">
      <svg class="w-16 h-16 text-neutral-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
      </svg>
      <p class="text-neutral-500 font-medium mb-2">No transactions found</p>
      <p class="text-neutral-400 text-sm">No recent transactions for your properties.</p>
    </div>
  `;
}

// Show transactions error message
function showTransactionsError() {
  const transactionsContainer = document.querySelector('#transactions .space-y-4');
  if (!transactionsContainer) return;
  
  transactionsContainer.innerHTML = `
    <div class="text-center py-8">
      <svg class="w-16 h-16 text-red-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.732 19.5c-.77.833.192 2.5 1.732 2.5z"/>
      </svg>
      <p class="text-red-500 font-medium mb-2">Error loading transactions</p>
      <p class="text-neutral-400 text-sm mb-3">Please try refreshing the page</p>
      <button onclick="loadAndPopulateTransactions()" class="text-primary hover:underline text-sm">Try again</button>
    </div>
  `;
}

// Load and populate today's check-ins from API
async function loadAndPopulateTodayCheckins() {
  try {
    // Get property IDs from localStorage
    const properties = localStorage.getItem('properties');
    if (!properties) {
      console.warn('Properties not found in localStorage, cannot load today\'s check-ins');
      return;
    }

    let propertyIds;
    try {
      propertyIds = JSON.parse(properties);
    } catch (e) {
      console.warn('Invalid properties format in localStorage:', e);
      return;
    }

    if (!Array.isArray(propertyIds) || propertyIds.length === 0) {
      console.warn('No property IDs found, cannot load today\'s check-ins');
      return;
    }

    console.log('Loading today\'s check-ins for properties:', propertyIds);
    
    // Fetch today's check-ins from API
    const response = await fetch('https://betcha-api.onrender.com/pm/bookings/checkinToday', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        propertyIds: propertyIds
      })
    });
    
    if (!response.ok) {
      throw new Error(`Failed to fetch today's check-ins: ${response.status}`);
    }
    
    const data = await response.json();
    console.log('Today\'s check-ins data received:', data);
    
    // Debug: Log the raw data structure
    if (Array.isArray(data)) {
      console.log('Dashboard: API returned array with', data.length, 'items');
      data.forEach((item, index) => {
        console.log(`Dashboard: Item ${index}:`, {
          hasBookingId: !!item.bookingId,
          hasPropertyId: !!item.propertyId,
          status: item.status,
          guestName: item.nameOfGuest || item.guestName,
          propertyName: item.nameOfProperty || item.propertyName
        });
      });
    }
    
    // Handle the actual API response structure - it's an array with message and booking objects
    if (Array.isArray(data)) {
      // Filter out message objects and keep only valid booking objects
      const allBookings = data.filter(item => item.bookingId && item.propertyId);
      
      // Apply the same status filtering logic as the PM page
      const validBookings = allBookings.filter(booking => {
        // Skip bookings without status
        if (!booking.status) {
          console.warn('Booking has no status, excluding:', booking);
          return false;
        }
        
        const statusLower = booking.status.toString().toLowerCase();
        
        // Exclude cancelled, completed, and checked-out bookings
        if (statusLower === 'cancel' || 
            statusLower === 'cancelled' ||
            statusLower === 'checked-out' || 
            statusLower === 'completed' ||
            statusLower === 'finished' ||
            statusLower === 'ended' ||
            statusLower.includes('checkout') ||
            statusLower.includes('checked-out') ||
            statusLower.includes('checked out') ||
            statusLower.includes('complete') ||
            statusLower.includes('finished') ||
            statusLower.includes('ended')) {
          console.log('Excluding booking with status:', booking.status, 'for guest:', booking.nameOfGuest || booking.guestName);
          return false;
        }
        
        // Include pending, reserved, confirmed, and checked-in bookings
        return true;
      });
      
      console.log(`Filtered ${allBookings.length} total bookings down to ${validBookings.length} valid check-ins`);
      
      if (validBookings.length > 0) {
        populateTodayCheckins(validBookings);
      } else {
        console.warn('No valid check-ins found after status filtering');
        showNoCheckinsMessage();
      }
    } else if (data.bookings && Array.isArray(data.bookings)) {
      // Fallback for the expected structure - apply same filtering
      const validBookings = data.bookings.filter(booking => {
        if (!booking.status) return false;
        
        const statusLower = booking.status.toString().toLowerCase();
        return !(statusLower === 'cancel' || statusLower === 'cancelled' || 
                statusLower === 'checked-out' || statusLower === 'completed' ||
                statusLower.includes('checkout') || statusLower.includes('complete'));
      });
      
      populateTodayCheckins(validBookings);
    } else {
      console.warn('Invalid response format - expected array or data.bookings');
      showNoCheckinsMessage();
    }
    
  } catch (error) {
    console.error('Error loading today\'s check-ins:', error);
    showCheckinsError();
  }
}

// Populate today's check-ins in the UI
function populateTodayCheckins(checkins) {
  const pmContainer = document.querySelector('#PM .space-y-4');
  if (!pmContainer) {
    console.warn('PM container not found');
    return;
  }
  
  // Clear existing content
  pmContainer.innerHTML = '';
  
  if (checkins.length === 0) {
    showNoCheckinsMessage();
    return;
  }
  
  // Sort check-ins by check-in time (earliest first)
  const sortedCheckins = checkins.sort((a, b) => new Date(a.checkIn) - new Date(b.checkIn));
  
  // Create check-in elements
  sortedCheckins.forEach(checkin => {
    const checkinElement = createCheckinElement(checkin);
    pmContainer.appendChild(checkinElement);
  });
  
  console.log(`Populated ${sortedCheckins.length} today's check-ins`);
}

// Create individual check-in element matching the existing HTML structure
function createCheckinElement(checkin) {
  const checkinDiv = document.createElement('div');
  checkinDiv.className = 'flex flex-col font-inter sm:flex-row sm:items-center justify-between bg-neutral-50 p-4 rounded-xl border border-neutral-200 hover:bg-neutral-100 transition cursor-pointer';
  
  // Get guest name using the correct field name
  const guestName = checkin.nameOfGuest || checkin.guestName || checkin.customerName || 'Guest User';
  
  // Get property name using the correct field name from API
  const propertyName = checkin.nameOfProperty || checkin.propertyName || 'Property';
  
  // Format check-in date and time
  let checkInDate = 'N/A';
  let checkInTime = 'N/A';
  if (checkin.checkIn) {
    try {
      const date = new Date(checkin.checkIn);
      checkInDate = date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      });
      // Use timeIn from API if available, otherwise format from date
      checkInTime = checkin.timeIn || date.toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
      });
    } catch (e) {
      console.warn('Invalid checkIn date format:', checkin.checkIn);
    }
  }
  
  // Format check-out date and time
  let checkOutDate = 'N/A';
  let checkOutTime = 'N/A';
  if (checkin.checkOut) {
    try {
      const date = new Date(checkin.checkOut);
      checkOutDate = date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      });
      // Use timeOut from API if available, otherwise format from date
      checkOutTime = checkin.timeOut || date.toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
      });
    } catch (e) {
      console.warn('Invalid checkOut date format:', checkin.checkOut);
    }
  }
  
  // Get status for display
  const status = checkin.status || 'Unknown';
  let statusColor = 'bg-blue-100 text-blue-800';
  let statusText = status;
  
  // Determine status color and text
  const statusLower = status.toString().toLowerCase();
  if (statusLower.includes('pending') || statusLower.includes('reserved')) {
    statusColor = 'bg-yellow-100 text-yellow-800';
    statusText = 'Pending';
  } else if (statusLower.includes('confirmed') || statusLower.includes('fully-paid')) {
    statusColor = 'bg-green-100 text-green-800';
    statusText = 'Confirmed';
  } else if (statusLower.includes('checked-in')) {
    statusColor = 'bg-green-100 text-green-800';
    statusText = 'Checked-In';
  }
  
  checkinDiv.innerHTML = `
    <!-- Name + Property -->
    <div class="flex-1 min-w-0 flex flex-col gap-1 mb-2 sm:mb-0 text-center sm:text-left">
      <p class="text-sm font-medium text-neutral-800 truncate font-manrope">${guestName}</p>
      <p class="text-xs text-neutral-500 truncate">${propertyName}</p>
      <!-- Status Badge -->
      <span class="inline-block px-2 py-1 text-xs rounded-full ${statusColor} font-medium mt-1">${statusText}</span>
    </div>

    <!-- Dates -->
    <div class="flex flex-col sm:flex-row sm:items-center sm:gap-4 text-center sm:text-right min-w-0">
      <div class="min-w-0">
        <p class="text-xs text-neutral-500">Check-In</p>
        <p class="text-sm font-semibold text-neutral-800 font-manrope truncate">
          <span>${checkInDate}</span> | <span>${checkInTime}</span>
        </p>
      </div>
      <div class="min-w-0 mt-2 sm:mt-0">
        <p class="text-xs text-neutral-500">Check-Out</p>
        <p class="text-sm font-semibold text-neutral-800 font-manrope truncate">
          <span>${checkOutDate}</span> | <span>${checkOutTime}</span>
        </p>
      </div>
    </div>
  `;
  
  // Make booking clickable - redirect to pm.html
  checkinDiv.addEventListener('click', () => {
    // Store booking data in localStorage for pm.html to access
    localStorage.setItem('selectedBooking', JSON.stringify(checkin));
    localStorage.setItem('redirectFromDashboard', 'true');
    localStorage.setItem('openBookingModal', 'true');
    
    // Redirect to pm.html
    window.location.href = 'pm.html';
  });
  
  return checkinDiv;
}

// Show no check-ins message
function showNoCheckinsMessage() {
  const pmContainer = document.querySelector('#PM .space-y-4');
  if (!pmContainer) return;
  
  pmContainer.innerHTML = `
    <div class="text-center py-8">
      <svg class="w-16 h-16 text-neutral-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
      </svg>
      <p class="text-neutral-500 font-medium mb-2">No check-ins today</p>
      <p class="text-neutral-400 text-sm">No guests are checking in today.</p>
    </div>
  `;
}

// Show check-ins error message
function showCheckinsError() {
  const pmContainer = document.querySelector('#PM .space-y-4');
  if (!pmContainer) return;
  
  pmContainer.innerHTML = `
    <div class="text-center py-8">
      <svg class="w-16 h-16 text-red-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.732 19.5c-.77.833.192 2.5 1.732 2.5z"/>
      </svg>
      <p class="text-red-500 font-medium mb-2">Error loading today's check-ins</p>
      <p class="text-neutral-400 text-sm mb-3">Please try refreshing the page</p>
      <button onclick="loadAndPopulateTodayCheckins()" class="text-primary hover:underline text-sm">Try again</button>
    </div>
  `;
}
