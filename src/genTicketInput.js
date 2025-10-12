// Function to show refund account modal
function showRefundAccountModal(paymentMethod, callback) {
  // Determine if it's an e-wallet or bank account
  const isEWallet = ['gcash', 'maya'].includes(paymentMethod.toLowerCase());
  const accountLabel = isEWallet ? 'E-wallet Number' : 'Bank Account Number';
  const expectedLength = isEWallet ? 11 : 9;
  const placeholderText = isEWallet ? '09XXXXXXXXX (11 digits)' : 'XXXXXXXXX (9 digits)';
  
  // Create modal HTML
  const modalHTML = `
    <div id="refundAccountModal" class="fixed inset-0 bg-black/50 flex items-center justify-center z-50 px-4">
      <div class="bg-white rounded-2xl shadow-xl max-w-md w-full mx-4 transform transition-all duration-300 scale-95 opacity-0">
        <div class="p-6">
          <!-- Header -->
          <div class="text-center mb-4">
            <div class="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg class="w-8 h-8" fill="none" stroke="#147b42" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"/>
              </svg>
            </div>
            <h3 class="text-xl font-semibold text-gray-900 font-manrope">
              Refund Account Information
            </h3>
          </div>
          
          <!-- Message -->
          <div class="mb-6">
            <p class="text-gray-600 text-sm text-center mb-4">
              Please provide your ${accountLabel.toLowerCase()} to process your refund. This will be the account that receives the refunded amount for the payment discrepancy.
            </p>
            <div class="bg-green-100 border border-green-200 rounded-lg p-3">
              <p class="text-xs" style="color: #147b42;">
                <strong>Important:</strong> Double-check your account number. The refund will be sent to this account.
              </p>
            </div>
          </div>
          
          <!-- Input Field -->
          <div class="mb-6">
            <label for="accountNumberInput" class="block text-sm font-medium text-gray-700 mb-2">
              ${accountLabel} <span class="text-red-500">*</span>
            </label>
            <input 
              type="text" 
              id="accountNumberInput" 
              class="w-full border border-gray-300 rounded-lg px-4 py-3 text-sm focus:ring-2 focus:ring-primary focus:border-primary outline-none transition"
              placeholder="${placeholderText}"
              maxlength="${expectedLength}"
            />
            <p id="accountNumberError" class="text-red-500 text-xs mt-1 hidden"></p>
            <p class="text-gray-500 text-xs mt-1">Payment Method: <strong>${paymentMethod}</strong></p>
          </div>
          
          <!-- Action Buttons -->
          <div class="flex gap-3">
            <button id="cancelRefundModal" class="flex-1 px-4 py-3 bg-gray-100 text-gray-700 rounded-full hover:bg-gray-200 transition font-medium text-sm">
              Cancel
            </button>
            <button id="confirmRefundAccount" class="flex-1 px-4 py-3 bg-primary rounded-full hover:bg-primary/90 transition font-medium text-sm">
              <span class="text-white">Continue</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  `;
  
  // Add modal to document
  document.body.insertAdjacentHTML('beforeend', modalHTML);
  
  // Get modal elements
  const modal = document.getElementById('refundAccountModal');
  const modalContent = modal.querySelector('.bg-white');
  const accountInput = document.getElementById('accountNumberInput');
  const errorElement = document.getElementById('accountNumberError');
  const cancelBtn = document.getElementById('cancelRefundModal');
  const confirmBtn = document.getElementById('confirmRefundAccount');
  
  // Show modal with animation
  setTimeout(() => {
    modalContent.classList.remove('scale-95', 'opacity-0');
    modalContent.classList.add('scale-100', 'opacity-100');
  }, 10);
  
  // Focus on input
  setTimeout(() => accountInput.focus(), 300);
  
  // Validation function
  function validateAccountNumber(value) {
    const cleanValue = value.replace(/\D/g, '');
    
    // Check length
    if (cleanValue.length === 0) {
      errorElement.textContent = '';
      errorElement.classList.add('hidden');
      return false;
    }
    
    if (cleanValue.length < expectedLength) {
      errorElement.textContent = `${accountLabel} must be ${expectedLength} digits. Currently ${cleanValue.length}/${expectedLength}`;
      errorElement.classList.remove('hidden');
      return false;
    }
    
    if (cleanValue.length > expectedLength) {
      errorElement.textContent = `${accountLabel} must be exactly ${expectedLength} digits`;
      errorElement.classList.remove('hidden');
      return false;
    }
    
    // Check "09" prefix for e-wallets
    if (isEWallet && !cleanValue.startsWith('09')) {
      errorElement.textContent = `${accountLabel} must start with "09"`;
      errorElement.classList.remove('hidden');
      return false;
    }
    
    errorElement.textContent = '';
    errorElement.classList.add('hidden');
    return true;
  }
  
  // Input validation - only allow numbers
  accountInput.addEventListener('input', function() {
    this.value = this.value.replace(/\D/g, '');
    validateAccountNumber(this.value);
  });
  
  // Prevent non-numeric paste
  accountInput.addEventListener('paste', function(e) {
    e.preventDefault();
    const paste = (e.clipboardData || window.clipboardData).getData('text');
    const numericPaste = paste.replace(/\D/g, '');
    this.value = numericPaste.slice(0, expectedLength);
    validateAccountNumber(this.value);
  });
  
  // Close modal function
  function closeModal() {
    modalContent.classList.add('scale-95', 'opacity-0');
    modalContent.classList.remove('scale-100', 'opacity-100');
    setTimeout(() => modal.remove(), 300);
  }
  
  // Cancel button
  cancelBtn.addEventListener('click', () => {
    closeModal();
    // Redirect back to previous page
    window.history.back();
  });
  
  // Confirm button
  confirmBtn.addEventListener('click', () => {
    const accountNumber = accountInput.value.trim();
    
    if (!validateAccountNumber(accountNumber)) {
      if (accountNumber === '') {
        errorElement.textContent = `Please enter your ${accountLabel.toLowerCase()}`;
        errorElement.classList.remove('hidden');
      }
      accountInput.focus();
      return;
    }
    
    closeModal();
    callback(accountNumber);
  });
  
  // ESC key to cancel
  document.addEventListener('keydown', function handleEscapeKey(e) {
    if (e.key === 'Escape') {
      closeModal();
      window.history.back();
      document.removeEventListener('keydown', handleEscapeKey);
    }
  });
  
  // Prevent backdrop click from closing (force user to provide account number)
  modal.addEventListener('click', (e) => {
    if (e.target === modal) {
      // Shake animation to indicate they need to fill the form
      modalContent.classList.add('animate-shake');
      setTimeout(() => modalContent.classList.remove('animate-shake'), 500);
    }
  });
}

document.addEventListener('DOMContentLoaded', () => {
  console.log("Ticket dropdowns JS loaded");

  // Import toast notification functions
  import('/src/toastNotification.js').then(module => {
    window.showToastError = module.showToastError;
    window.showToastSuccess = module.showToastSuccess;
    window.showToastWarning = module.showToastWarning;
  }).catch(error => {
    console.warn('Could not load toast notifications:', error);
    // Fallback to alert if toast fails to load
    window.showToastError = function(message, title = 'Error') {
      alert(`${title}: ${message}`);
    };
    window.showToastSuccess = function(message, title = 'Success') {
      alert(`${title}: ${message}`);
    };
    window.showToastWarning = function(message, title = 'Warning') {
      alert(`${title}: ${message}`);
    };
  });

  // Global variable to store selected employee ID
  let selectedEmployeeId = null;
  let selectedCategory = null;

  function capitalize(str) {
    return str.charAt(0).toUpperCase() + str.slice(1);
  }

  // Function to get user ID from localStorage (matches existing project pattern)
  function getUserId() {
    const userId = localStorage.getItem('userId') ||
                   localStorage.getItem('userID') ||
                   localStorage.getItem('currentUser') ||
                   null;
    
    if (userId) {
      console.log('Found user ID in localStorage:', userId);
      return userId;
    }
    
    // If no ID found, log all localStorage contents for debugging
    console.log('No user ID found. Current localStorage contents:');
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      const value = localStorage.getItem(key);
      console.log(`${key}: ${value}`);
    }
    
    return null;
  }

  // Function to handle form submission
  function handleFormSubmission(event) {
    event.preventDefault();
    
    // Get form data
    const description = document.getElementById('description').value.trim();
    const otherConcernInput = document.getElementById('otherConcernInput');
    const otherConcern = otherConcernInput ? otherConcernInput.value.trim() : '';
    
    // Validation
    if (!selectedEmployeeId) {
      window.showToastWarning('Please select a Customer Service Agent before creating a ticket.', 'Agent Required');
      return;
    }
    
    if (!selectedCategory) {
      window.showToastWarning('Please select a concern category before creating a ticket.', 'Category Required');
      return;
    }
    
    if (!description || description.length < 10) {
      window.showToastWarning('Please provide a description with at least 10 characters.', 'Description Required');
      return;
    }
    
    const userId = getUserId();
    if (!userId) {
      window.showToastError('User not logged in. Please log in to create a ticket.', 'Login Required');
      return;
    }
    
    // Determine final category
    let finalCategory = selectedCategory;
    if (selectedCategory === 'Others' && otherConcern) {
      finalCategory = otherConcern;
    }
    
    // Prepare API payload
    const ticketData = {
      category: finalCategory,
      customerServiceAgentId: selectedEmployeeId,
      senderId: userId,
      messages: [
        {
          userId: userId,
          userLevel: "guest",
          message: description
        }
      ]
    };
    
    // Show loading state
    const submitBtn = event.target.querySelector('button[type="submit"]') || event.target;
    const originalBtnContent = submitBtn.innerHTML;
    submitBtn.disabled = true;
    submitBtn.innerHTML = `
      <div class="flex items-center justify-center gap-2">
        <div class="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
        <span>Creating ticket...</span>
      </div>
    `;
    
    // Call API
    createTicket(ticketData, submitBtn, originalBtnContent);
  }

  // Function to create ticket via API
  async function createTicket(ticketData, submitBtn, originalBtnContent) {
    try {
      console.log('Creating ticket with data:', ticketData);
      
      const response = await fetch('https://betcha-api.onrender.com/tk/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(ticketData)
      });
      
      const result = await response.json();
      
      if (response.ok) {
        // Success
        console.log('Ticket created successfully:', result);
        
        // Show success message
        window.showToastSuccess('Your support ticket has been created successfully. You will be redirected shortly.', 'Ticket Created!');
        
        // Audit: Log ticket creation
        try {
            const userId = localStorage.getItem('userId') || '';
            const userType = localStorage.getItem('role') || localStorage.getItem('userType') || '';
            if (window.AuditTrailFunctions && typeof window.AuditTrailFunctions.logTicketCreation === 'function' && userId) {
                window.AuditTrailFunctions.logTicketCreation(userId, userType.charAt(0).toUpperCase() + userType.slice(1));
            }
        } catch (auditError) {
            console.warn('Audit trail for ticket creation failed:', auditError);
        }
        
        // Reset form
        document.getElementById('generateTicketForm').reset();
        selectedEmployeeId = null;
        selectedCategory = null;
        
        // Reset dropdowns
        document.getElementById('selectedAgent').textContent = 'Select a Customer Service Agent';
        document.getElementById('selectedConcern').textContent = 'Select a Concern';
        document.getElementById('otherConcernWrapper').classList.add('hidden');
        
        // Redirect to support.html after 2 seconds
        setTimeout(() => {
          window.location.href = '/pages/auth/support.html';
          console.log('Redirecting to support page');
        }, 2000);
        
      } else {
        // API error
        console.error('API Error:', result);
        window.showToastError(result.message || 'Failed to create ticket. Please try again.', 'Creation Failed');
      }
      
    } catch (error) {
      console.error('Network Error:', error);
      window.showToastError('Unable to connect to the server. Please check your connection and try again.', 'Network Error');
    } finally {
      // Restore button
      submitBtn.disabled = false;
      submitBtn.innerHTML = originalBtnContent;
    }
  }

  // Fetch TK employees from API
  async function fetchTKEmployees() {
    try {
      const response = await fetch('https://betcha-api.onrender.com/employee/privilege/tk');
      const data = await response.json();
      
      if (data.message === "Employees with TK privilege retrieved successfully") {
        return data.employees;
      } else {
        console.error('Failed to fetch TK employees:', data);
        return [];
      }
    } catch (error) {
      console.error('Error fetching TK employees:', error);
      return [];
    }
  }

  function createSkeletonLoader() {
    const skeletonItems = [];
    for (let i = 0; i < 3; i++) {
      const li = document.createElement("li");
      li.className = "px-4 py-3 flex items-center gap-3 animate-pulse";
      
      // Skeleton profile picture
      const skeletonImg = document.createElement("div");
      skeletonImg.className = "w-8 h-8 rounded-full bg-gray-300";
      
      // Skeleton text
      const skeletonText = document.createElement("div");
      skeletonText.className = "h-4 bg-gray-300 rounded flex-1";
      
      li.appendChild(skeletonImg);
      li.appendChild(skeletonText);
      skeletonItems.push(li);
    }
    return skeletonItems;
  }

  function setupAgentDropdown() {
    const btn = document.getElementById('agentDropdownBtn');
    const list = document.getElementById('agentDropdownList');
    const display = document.getElementById('selectedAgent');
    const icon = document.getElementById('agentDropdownIcon');

    // Set initial loading text
    display.innerHTML = `
      <div class="flex items-center gap-2">
        <div class="w-4 h-4 border-2 border-gray-300 border-t-primary rounded-full animate-spin"></div>
        <span>Loading agents...</span>
      </div>
    `;

    // Add skeleton loading initially
    const skeletonItems = createSkeletonLoader();
    skeletonItems.forEach(item => list.appendChild(item));

    // Toggle open/close
    btn.addEventListener("click", () => {
      list.classList.toggle("hidden");
      icon.classList.toggle("rotate-180");
    });

    // Fetch and populate TK employees
    fetchTKEmployees().then(employees => {
      // Clear skeleton loading
      list.innerHTML = '';
      
      // Reset button text
      display.textContent = "Select a Customer Service Agent";
      display.classList.add("text-muted");
      
      if (employees.length === 0) {
        const li = document.createElement("li");
        li.textContent = "No agents available";
        li.className = "px-4 py-2 text-gray-400";
        list.appendChild(li);
        return;
      }

      employees.forEach(employee => {
        const li = document.createElement("li");
        li.className = "px-4 py-3 hover:bg-neutral-100 cursor-pointer transition-all flex items-center gap-3";

        // Create profile picture
        const img = document.createElement("img");
        img.className = "w-8 h-8 rounded-full object-cover";
        img.src = employee.pfplink || "https://via.placeholder.com/32x32?text=CS";
        img.alt = `${employee.firstname} ${employee.lastname}`;
        
        // Handle image load error
        img.onerror = () => {
          img.src = "https://via.placeholder.com/32x32?text=CS";
        };

        // Create name text
        const nameSpan = document.createElement("span");
        nameSpan.textContent = `CS - ${employee.firstname} ${employee.lastname}`;
        nameSpan.className = "text-sm";

        li.appendChild(img);
        li.appendChild(nameSpan);

        li.onclick = () => {
          // Store the employee ID
          selectedEmployeeId = employee._id;
          
          // Update display
          display.innerHTML = `
            <div class="flex items-center gap-3">
              <img src="${employee.pfplink || "https://via.placeholder.com/32x32?text=CS"}" 
                   alt="${employee.firstname} ${employee.lastname}" 
                   class="w-6 h-6 rounded-full object-cover"
                   onerror="this.src='https://via.placeholder.com/32x32?text=CS'">
              <span>CS - ${employee.firstname} ${employee.lastname}</span>
            </div>
          `;
          display.classList.remove("text-muted");
          display.classList.add("text-primary-text");
          list.classList.add("hidden");
          icon.classList.remove("rotate-180");

          console.log('Selected employee ID:', selectedEmployeeId);
        };
        
        list.appendChild(li);
      });
    }).catch(error => {
      // Handle error case
      list.innerHTML = '';
      display.textContent = "Error loading agents";
      display.classList.add("text-red-500");
      
      const li = document.createElement("li");
      li.innerHTML = `
        <div class="px-4 py-2 text-red-500 text-sm">
          <div class="flex items-center gap-2">
            <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clip-rule="evenodd"/>
            </svg>
            <span>Failed to load agents. Please try again.</span>
          </div>
        </div>
      `;
      list.appendChild(li);
      console.error('Error fetching TK employees:', error);
    });

    // Close dropdown if clicked outside
    document.addEventListener("click", (e) => {
      if (!btn.contains(e.target) && !list.contains(e.target)) {
        list.classList.add("hidden");
        icon.classList.remove("rotate-180");
      }
    });
  }

  function setupDropdown(id, options, placeholder = "Select") {
    const btn = document.getElementById(`${id}DropdownBtn`);
    const list = document.getElementById(`${id}DropdownList`);
    const display = document.getElementById(`selected${capitalize(id)}`);
    const icon = document.getElementById(`${id}DropdownIcon`);

    // Set initial text
    display.textContent = placeholder;

    // Toggle open/close
    btn.addEventListener("click", () => {
      list.classList.toggle("hidden");
      icon.classList.toggle("rotate-180");
    });

    // Fill dropdown list
    options.forEach(opt => {
      const li = document.createElement("li");
      li.textContent = opt;
      li.className = "px-4 py-2 hover:bg-neutral-100 cursor-pointer transition-all";

      li.onclick = () => {
        display.textContent = opt;
        display.classList.remove("text-gray-400");
        display.classList.add("text-primary-text");
        list.classList.add("hidden");
        icon.classList.remove("rotate-180");

        // Store selected category
        if (id === "concern") {
          selectedCategory = opt;
          const otherInput = document.getElementById("otherConcernWrapper");
          if (opt === "Others") {
            otherInput.classList.remove("hidden");
          } else {
            otherInput.classList.add("hidden");
          }
        }
      };
      list.appendChild(li);
    });

    // Close dropdown if clicked outside
    document.addEventListener("click", (e) => {
      if (!btn.contains(e.target) && !list.contains(e.target)) {
        list.classList.add("hidden");
        icon.classList.remove("rotate-180");
      }
    });
  }

  // Function to get selected employee ID (can be called from other scripts)
  window.getSelectedEmployeeId = function() {
    return selectedEmployeeId;
  };

  // Function to get selected category (can be called from other scripts)
  window.getSelectedCategory = function() {
    return selectedCategory;
  };

  // Your dropdown data
  const concerns = ["Location", "Appliances", "Amenities", "Payment", "Others"];

  // Initialize dropdowns
  setupAgentDropdown(); // Custom setup for agent dropdown with API data
  setupDropdown("concern", concerns, "Select a Concern");

  // Check for URL parameters and auto-fill form
  const urlParams = new URLSearchParams(window.location.search);
  const reason = urlParams.get('reason');
  
  if (reason === 'amount_mismatch') {
    const bookingId = urlParams.get('bookingId') || 'N/A';
    const paymentNo = urlParams.get('paymentNo') || 'N/A';
    const requiredAmount = urlParams.get('requiredAmount') || 'N/A';
    const sentAmount = urlParams.get('sentAmount') || 'N/A';
    const paymentMethod = urlParams.get('paymentMethod') || 'N/A';
    
    // Show modal to collect E-wallet/Bank number first
    showRefundAccountModal(paymentMethod, (accountNumber) => {
      // Auto-select first agent when employees are loaded
      fetchTKEmployees().then(employees => {
        if (employees.length > 0) {
          const firstEmployee = employees[0];
          selectedEmployeeId = firstEmployee._id;
          
          const agentDisplay = document.getElementById('selectedAgent');
          if (agentDisplay) {
            agentDisplay.innerHTML = `
              <div class="flex items-center gap-3">
                <img src="${firstEmployee.pfplink || "https://via.placeholder.com/32x32?text=CS"}" 
                     alt="${firstEmployee.firstname} ${firstEmployee.lastname}" 
                     class="w-6 h-6 rounded-full object-cover"
                     onerror="this.src='https://via.placeholder.com/32x32?text=CS'">
                <span>CS - ${firstEmployee.firstname} ${firstEmployee.lastname}</span>
              </div>
            `;
            agentDisplay.classList.remove("text-muted");
            agentDisplay.classList.add("text-primary-text");
            
            console.log('✅ Auto-selected first agent:', firstEmployee.firstname, firstEmployee.lastname);
          }
        }
      }).catch(error => {
        console.error('Failed to auto-select agent:', error);
      });
      
      // Auto-select "Payment" in concern dropdown
      const concernDisplay = document.getElementById('selectedConcern');
      const concernIcon = document.getElementById('concernDropdownIcon');
      const concernList = document.getElementById('concernDropdownList');
      
      if (concernDisplay) {
        concernDisplay.textContent = 'Payment';
        concernDisplay.classList.remove('text-muted');
        concernDisplay.classList.add('text-primary-text');
        selectedCategory = 'Payment';
        
        // Hide the list and rotate icon back
        if (concernList) concernList.classList.add('hidden');
        if (concernIcon) concernIcon.classList.remove('rotate-180');
      }
      
      // Determine account type label based on payment method
      const isEWallet = ['gcash', 'maya'].includes(paymentMethod.toLowerCase());
      const accountLabel = isEWallet ? 'E-wallet Number' : 'Bank Account Number';
      
      // Auto-fill description with formatted message including account number
      const descriptionField = document.getElementById('description');
      if (descriptionField) {
        descriptionField.value = `I accidentally sent the wrong amount for my booking.
Here are the details:

Booking ID: ${bookingId}
Payment No.: ${paymentNo}
Payment Method: ${paymentMethod}
Required Amount: ₱${requiredAmount}
Amount Sent: ₱${sentAmount}
${accountLabel}: ${accountNumber}

Please let me know how I can correct this. Thank you!`;
      }
      
      console.log('✅ Auto-filled form with payment mismatch details:', {
        bookingId,
        paymentNo,
        paymentMethod,
        requiredAmount,
        sentAmount,
        accountNumber
      });
    });
  }

  // Add form submission handler
  const form = document.getElementById('generateTicketForm');
  if (form) {
    form.addEventListener('submit', handleFormSubmission);
  }
});