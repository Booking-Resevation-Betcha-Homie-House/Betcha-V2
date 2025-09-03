/**
 * Initialize employee profile picture in navigation
 */
function initializeEmployeeProfile() {
    try {
        const profilePicture = localStorage.getItem('pfplink') || '';
        const employeeProfileImgElement = document.getElementById('employeeProfileImg');
        const menuBtnElement = document.getElementById('menuBtn');
        
        if (!employeeProfileImgElement || !menuBtnElement) {
            console.warn('Employee profile elements not found in DOM');
            return;
        }
        
        // If profile picture exists, show it
        if (profilePicture && profilePicture.trim() !== '') {
            employeeProfileImgElement.src = profilePicture;
            employeeProfileImgElement.classList.remove('hidden');
            // Remove green background when showing profile picture
            menuBtnElement.classList.remove('bg-primary');
            menuBtnElement.classList.add('bg-transparent');
            console.log('Employee profile picture loaded:', profilePicture);
        } else {
            // Keep default SVG icon visible with green background
            employeeProfileImgElement.classList.add('hidden');
            menuBtnElement.classList.remove('bg-transparent');
            menuBtnElement.classList.add('bg-primary');
            console.log('No employee profile picture found, using default icon');
        }
        
    } catch (error) {
        console.error('Error initializing employee profile:', error);
    }
}

// Initialize profile when DOM loads
document.addEventListener('DOMContentLoaded', function() {
    initializeEmployeeProfile();
});

// Grid layout update function
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

document.addEventListener('DOMContentLoaded', () => {
  // Show skeleton loading while initializing
  if (window.employeeSkeleton) {
    window.employeeSkeleton.showSkeleton();
  }
  
  // Note: checkRolePrivileges() will be called by universal skeleton after sidebar restoration
  initializeDashboardFeatures();
  updateGridLayout();
  loadDashboardMetrics();
  
  // Hide skeleton after initialization (simulate loading complete)
  setTimeout(() => {
    if (window.employeeSkeleton) {
      window.employeeSkeleton.hideSkeleton();
    }
  }, 1500); // Adjust timing as needed
});

// Initialize dashboard features
function initializeDashboardFeatures() {
  const ticketsContainer = document.querySelector('#tickets .space-y-4');
  if (ticketsContainer) {
    loadAndPopulateTickets();
  } else {
    
  }

  const transactionsContainer = document.querySelector('#transactions .space-y-4');
  if (transactionsContainer) {
    loadAndPopulateTransactions();
  } else {
    
  }

  const pmContainer = document.querySelector('#PM .space-y-4');
  if (pmContainer) {
    loadAndPopulateTodayCheckins();
  } else {
    
  }
}

// Minimal metrics load (copied from PSR usage)
async function loadDashboardMetrics() {
  try {
    const [summaryData, peakBookingData] = await Promise.all([
      fetchAdminSummary(),
      fetchPeakBookingDay()
    ]);
    populateEarningsData(summaryData);
    populatePeakBookingData(peakBookingData);
  } catch (_) {}
}

async function fetchAdminSummary() {
  try {
    const response = await fetch('https://betcha-api.onrender.com/dashboard/admin/summary');
    return await response.json();
  } catch (_) { return null; }
}

async function fetchPeakBookingDay() {
  try {
    const response = await fetch('https://betcha-api.onrender.com/psr/peakBookingDay');
    return await response.json();
  } catch (_) { return null; }
}

function populateEarningsData(summaryData) {
  if (!summaryData || !summaryData.summary) return;
  const { TotalEarningsThisWeek, TotalEarningsThisMonth, TotalEarningsThisYear } = summaryData.summary;
  const formatCurrency = (amount) => new Intl.NumberFormat('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(amount || 0);
  const yearEarningElement = document.getElementById('totalYearEarning');
  const monthEarningElement = document.getElementById('totalMonthEarning');
  const weekEarningElement = document.getElementById('totalWeekEarning');
  if (yearEarningElement) yearEarningElement.textContent = formatCurrency(TotalEarningsThisYear);
  if (monthEarningElement) monthEarningElement.textContent = formatCurrency(TotalEarningsThisMonth);
  if (weekEarningElement) weekEarningElement.textContent = formatCurrency(TotalEarningsThisWeek);
}

function populatePeakBookingData(peakData) {
  if (!peakData) return;
  const formatDate = (dateString) => {
    if (!dateString || (typeof dateString === 'string' && dateString.includes('No bookings'))) return 'No bookings';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };
  const cards = document.querySelectorAll('.bg-white.rounded-xl.border.border-neutral-200');
  cards.forEach(card => {
    const titleElement = card.querySelector('span.text-lg, span.text-lg.font-manrope, span.text-lg.font-semibold, span.text-lg.font-manrope.font-semibold, span.text-lg.font-semibold.font-manrope');
    const fallbackTitleElement = card.querySelector('span');
    const header = titleElement?.textContent?.trim() || fallbackTitleElement?.textContent?.trim();
    const dateElement = card.querySelector('p.text-xl.font-bold, p.text-xl.font-bold.text-neutral-900.font-manrope');
    const infoElement = card.querySelector('p.text-sm.text-neutral-500:last-child');
    if (header === 'Year' && peakData.year) {
      if (dateElement) dateElement.textContent = formatDate(peakData.year.peakDay);
      if (infoElement) infoElement.textContent = (peakData.year.peakDay && !String(peakData.year.peakDay).includes('No bookings')) ? 'Peak day this year' : 'No bookings';
    } else if (header === 'Month' && peakData.month) {
      if (dateElement) dateElement.textContent = formatDate(peakData.month.peakDay);
      if (infoElement) infoElement.textContent = (peakData.month.peakDay && !String(peakData.month.peakDay).includes('No bookings')) ? 'Peak day this month' : 'No bookings';
    } else if (header === 'Week' && peakData.week) {
      if (dateElement) dateElement.textContent = formatDate(peakData.week.peakDay);
      if (infoElement) infoElement.textContent = (peakData.week.peakDay && !String(peakData.week.peakDay).includes('No bookings')) ? 'Peak day this week' : 'No bookings this week';
    }
  });
}

// Load and populate tickets from API
async function loadAndPopulateTickets() {
  try {
    const userId = localStorage.getItem('userId') || localStorage.getItem('userID');
    if (!userId) {
      return;
    }
    
    const response = await fetch(`https://betcha-api.onrender.com/tk/customer-service/${userId}`);
    
    if (!response.ok) {
      throw new Error(`Failed to fetch tickets: ${response.status}`);
    }
    
    const data = await response.json();
    
    if (data.tickets && Array.isArray(data.tickets)) {
      populateTickets(data.tickets);
    } else {
      showNoTicketsMessage();
    }
    
  } catch (error) {
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
  
  ticketsContainer.innerHTML = '';
  
  if (tickets.length === 0) {
    showNoTicketsMessage();
    return;
  }
  
  const sortedTickets = tickets.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  
  sortedTickets.forEach(ticket => {
    const ticketElement = createTicketElement(ticket);
    ticketsContainer.appendChild(ticketElement);
  });
}

// Create individual ticket element matching the existing HTML structure
function createTicketElement(ticket) {
  const ticketDiv = document.createElement('div');
  ticketDiv.className = 'flex items-center justify-between bg-neutral-50 p-4 border cursor-pointer border-neutral-200 rounded-xl group hover:bg-neutral-100 transition-all duration-300 ease-in-out';
  
  const latestMessage = ticket.messages && ticket.messages.length > 0 
    ? ticket.messages[ticket.messages.length - 1] 
    : null;
  
  const senderName = latestMessage ? latestMessage.userName : 'Guest User';
  
  const firstMessage = ticket.messages && ticket.messages.length > 0 
    ? ticket.messages[0] 
    : null;
  
  const concernText = firstMessage ? firstMessage.message : 'General Inquiry';
  
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
  
  ticketDiv.addEventListener('click', () => {
    localStorage.setItem('selectedTicket', JSON.stringify(ticket));
    localStorage.setItem('redirectFromDashboard', 'true');
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
  
  transactionsContainer.innerHTML = '';
  
  if (transactions.length === 0) {
    showNoTransactionsMessage();
    return;
  }
  
  const sortedTransactions = transactions.sort((a, b) => new Date(b.checkIn) - new Date(a.checkIn));
  
  const limitedTransactions = sortedTransactions.slice(0, 5);
  
  limitedTransactions.forEach(transaction => {
    const transactionElement = createTransactionElement(transaction);
    transactionsContainer.appendChild(transactionElement);
  });
}

// Create individual transaction element matching the existing HTML structure
function createTransactionElement(transaction) {
  const transactionDiv = document.createElement('div');
  transactionDiv.className = 'grid grid-cols-2 md:grid-cols-4 gap-5 p-4 bg-neutral-50 rounded-xl border border-neutral-200 hover:bg-neutral-100 transition-all duration-300 ease-in-out';
  
  const transactionNumber = transaction.transNo || transaction.transactionId || transaction._id || 'N/A';
  
  const guestName = transaction.nameOfGuest || transaction.guestName || transaction.customerName || 'Guest User';
  
  const propertyName = transaction.propertyName || 'Property';
  
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
  
  transactionDiv.addEventListener('click', () => {
    localStorage.setItem('selectedTransaction', JSON.stringify(transaction));
    localStorage.setItem('redirectFromDashboard', 'true');
    localStorage.setItem('openTransactionModal', 'true');
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
    
    // Debug: Log the raw data structure
    if (Array.isArray(data)) {}
    
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
            statusLower === 'complete' ||
            statusLower.includes('finished') ||
            statusLower.includes('ended')) {
          
          return false;
        }
        
        // Include pending, reserved, confirmed, and checked-in bookings
        return true;
      });
      
      
      
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
                statusLower === 'finished' || statusLower === 'ended' ||
                statusLower.includes('checkout') || statusLower.includes('checked-out') ||
                statusLower.includes('checked out') || statusLower.includes('finished') ||
                statusLower.includes('ended'));
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
      checkOutTime = checkin.timeOut || date.toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
      });
    } catch (e) {
      console.warn('Invalid checkOut date format:', checkin.checkOut);
    }
  }
  
  checkinDiv.innerHTML = `
    <!-- Name + Property -->
    <div class="flex-1 min-w-0 flex flex-col gap-1 mb-2 sm:mb-0 text-center sm:text-left">
      <p class="text-sm font-medium text-neutral-800 truncate font-manrope">${guestName}</p>
      <p class="text-xs text-neutral-500 truncate">${propertyName}</p>
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
  
  checkinDiv.addEventListener('click', () => {
    localStorage.setItem('selectedBooking', JSON.stringify(checkin));
    localStorage.setItem('redirectFromDashboard', 'true');
    localStorage.setItem('openBookingModal', 'true');
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

// Role Privilege Checking Functions for Dashboard
async function checkRolePrivileges() {
    try {
        const roleID = localStorage.getItem('roleID');
        if (!roleID) {
            console.warn('Dashboard - No roleID found in localStorage');
            return;
        }

        console.log('Dashboard - Checking privileges for roleID:', roleID);
        
        // Fetch role privileges from API
        const roleData = await fetchRolePrivileges(roleID);
        
        if (roleData && roleData.privileges) {
            console.log('Dashboard - Role privileges:', roleData.privileges);
            
            // Filter dashboard sections based on privileges
            filterDashboardSections(roleData.privileges);
        } else {
            console.error('Dashboard - No privileges found in role data');
        }
    } catch (error) {
        console.error('Dashboard - Error checking role privileges:', error);
    }
}

async function fetchRolePrivileges(roleID) {
    try {
        const response = await fetch(`https://betcha-api.onrender.com/roles/display/${roleID}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
            }
        });

        if (response.ok) {
            const data = await response.json();
            console.log('Dashboard - Role data received:', data);
            return data;
        } else {
            console.error('Dashboard - Failed to fetch role privileges:', response.status);
            return null;
        }
    } catch (error) {
        console.error('Dashboard - Error fetching role privileges:', error);
        return null;
    }
}

function filterDashboardSections(privileges) {
    console.log('Dashboard - Filtering sections and sidebar based on privileges:', privileges);
    
    // Define content sections that should be hidden based on privileges
    const sectionPrivilegeMap = {
        'PSR-summary': { privileges: ['PSR'], display: 'block' }, // PSR Summary section requires PSR privilege
        'tickets': { privileges: ['TK'], display: 'block' }, // Tickets section requires TK privilege  
        'PM': { privileges: ['PM'], display: 'block' }, // Property Monitoring section requires PM privilege
        'transactions': { privileges: ['TS'], display: 'flex' } // Transactions section requires TS privilege
    };
    
    // Define sidebar navigation items that should be hidden based on privileges
    const sidebarPrivilegeMap = {
        'sidebar-psr': ['PSR'], // PSR link requires PSR privilege
        'sidebar-tk': ['TK'], // TK link requires TK privilege  
        'sidebar-pm': ['PM'], // PM link requires PM privilege
        'sidebar-ts': ['TS'] // TS link requires TS privilege
    };
    
    // Filter content sections
    Object.keys(sectionPrivilegeMap).forEach(sectionId => {
        const section = document.getElementById(sectionId);
        if (!section) {
            console.log(`Dashboard - Section not found: ${sectionId}`);
            return;
        }
        
        const sectionConfig = sectionPrivilegeMap[sectionId];
        const requiredPrivileges = sectionConfig.privileges;
        let hasAccess = false;
        
        // Check if user has any of the required privileges for this section
        privileges.forEach(privilege => {
            if (requiredPrivileges.includes(privilege)) {
                hasAccess = true;
            }
        });
        
        if (!hasAccess) {
            console.log(`Dashboard - Hiding section: ${sectionId} (no access with privileges: ${privileges.join(', ')})`);
            section.style.display = 'none';
        } else {
            console.log(`Dashboard - Showing section: ${sectionId} (access granted with privileges: ${privileges.join(', ')})`);
            section.style.display = sectionConfig.display;
        }
    });
    
    // Filter sidebar navigation items
    Object.keys(sidebarPrivilegeMap).forEach(sidebarId => {
        const sidebarItem = document.getElementById(sidebarId);
        if (!sidebarItem) {
            console.log(`Dashboard - Sidebar item not found: ${sidebarId}`);
            return;
        }
        
        const requiredPrivileges = sidebarPrivilegeMap[sidebarId];
        let hasAccess = false;
        
        // Check if user has any of the required privileges for this sidebar item
        privileges.forEach(privilege => {
            if (requiredPrivileges.includes(privilege)) {
                hasAccess = true;
            }
        });
        
        if (!hasAccess) {
            console.log(`Dashboard - Hiding sidebar item: ${sidebarId} (no access with privileges: ${privileges.join(', ')})`);
            sidebarItem.style.display = 'none';
        } else {
            console.log(`Dashboard - Showing sidebar item: ${sidebarId} (access granted with privileges: ${privileges.join(', ')})`);
            sidebarItem.style.display = 'flex';
        }
    });
    
    // Update grid layout after filtering
    updateGridLayout();
    
    // Show navigation after privilege filtering is complete
    const sidebarNav = document.querySelector('#sidebar nav');
    if (sidebarNav) {
        sidebarNav.style.transition = 'opacity 0.3s ease-in-out, visibility 0.3s ease-in-out';
        sidebarNav.style.visibility = 'visible';
        sidebarNav.style.opacity = '1';
    }
}

// Export filterDashboardSections to global scope for universal skeleton
window.filterDashboardSections = filterDashboardSections;

// Skeleton Loading Helper Functions
function showDashboardSkeleton() {
    if (window.dashboardSkeleton) {
        window.dashboardSkeleton.showSkeleton();
    }
}

function hideDashboardSkeleton() {
    if (window.dashboardSkeleton) {
        window.dashboardSkeleton.hideSkeleton();
    }
}

function simulateDashboardLoading(duration = 3000) {
    if (window.dashboardSkeleton) {
        window.dashboardSkeleton.simulateLoading(duration);
    }
}

// Integration with existing async functions
async function loadDashboardWithSkeleton() {
    showDashboardSkeleton();
    
    try {
        await loadDashboardMetrics();
        await Promise.all([
            loadAndPopulateTickets(),
            loadAndPopulateTransactions(),
            loadAndPopulateTodayCheckins()
        ]);
    } catch (error) {
        console.error('Error loading dashboard:', error);
    } finally {
        hideDashboardSkeleton();
    }
}

// Export helper functions to global scope
window.showDashboardSkeleton = showDashboardSkeleton;
window.hideDashboardSkeleton = hideDashboardSkeleton;
window.simulateDashboardLoading = simulateDashboardLoading;
window.loadDashboardWithSkeleton = loadDashboardWithSkeleton;
