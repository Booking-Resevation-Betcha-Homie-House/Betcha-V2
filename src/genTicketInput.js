document.addEventListener('DOMContentLoaded', () => {
  console.log("Ticket dropdowns JS loaded");

  import('/src/toastNotification.js').then(module => {
    window.showToastError = module.showToastError;
  }).catch(error => {
    console.warn('Could not load toast notifications:', error);
    
    window.showToastError = function(type, title, message) {
      alert(`${title}: ${message}`);
    };
  });

  let selectedEmployeeId = null;
  let selectedCategory = null;

  function capitalize(str) {
    return str.charAt(0).toUpperCase() + str.slice(1);
  }

  function getUserId() {
    const userId = localStorage.getItem('userId') ||
                   localStorage.getItem('userID') ||
                   localStorage.getItem('currentUser') ||
                   null;
    
    if (userId) {
      console.log('Found user ID in localStorage:', userId);
      return userId;
    }

    console.log('No user ID found. Current localStorage contents:');
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      const value = localStorage.getItem(key);
      console.log(`${key}: ${value}`);
    }
    
    return null;
  }

  function handleFormSubmission(event) {
    event.preventDefault();

    const description = document.getElementById('description').value.trim();
    const otherConcernInput = document.getElementById('otherConcernInput');
    const otherConcern = otherConcernInput ? otherConcernInput.value.trim() : '';

    if (!selectedEmployeeId) {
      window.showToastError('warning', 'Agent Required', 'Please select a Customer Service Agent before creating a ticket.');
      return;
    }
    
    if (!selectedCategory) {
      window.showToastError('warning', 'Category Required', 'Please select a concern category before creating a ticket.');
      return;
    }
    
    if (!description || description.length < 10) {
      window.showToastError('warning', 'Description Required', 'Please provide a description with at least 10 characters.');
      return;
    }
    
    const userId = getUserId();
    if (!userId) {
      window.showToastError('auth', 'Login Required', 'User not logged in. Please log in to create a ticket.');
      return;
    }

    let finalCategory = selectedCategory;
    if (selectedCategory === 'Others' && otherConcern) {
      finalCategory = otherConcern;
    }

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

    const submitBtn = event.target.querySelector('button[type="submit"]') || event.target;
    const originalBtnContent = submitBtn.innerHTML;
    submitBtn.disabled = true;
    submitBtn.innerHTML = `
      <div class="flex items-center justify-center gap-2">
        <div class="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
        <span>Creating ticket...</span>
      </div>
    `;

    createTicket(ticketData, submitBtn, originalBtnContent);
  }

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
        
        console.log('Ticket created successfully:', result);

        window.showToastError('success', 'Ticket Created!', 'Your support ticket has been created successfully. You will be redirected shortly.');

        try {
            const userId = localStorage.getItem('userId') || '';
            const userType = localStorage.getItem('role') || localStorage.getItem('userType') || '';
            if (window.AuditTrailFunctions && typeof window.AuditTrailFunctions.logTicketCreation === 'function' && userId) {
                window.AuditTrailFunctions.logTicketCreation(userId, userType.charAt(0).toUpperCase() + userType.slice(1));
            }
        } catch (auditError) {
            console.warn('Audit trail for ticket creation failed:', auditError);
        }

        document.getElementById('generateTicketForm').reset();
        selectedEmployeeId = null;
        selectedCategory = null;

        document.getElementById('selectedAgent').textContent = 'Select a Customer Service Agent';
        document.getElementById('selectedConcern').textContent = 'Select a Concern';
        document.getElementById('otherConcernWrapper').classList.add('hidden');

        setTimeout(() => {
          window.location.href = '/pages/auth/support.html';
          console.log('Redirecting to support page');
        }, 2000);
        
      } else {
        
        console.error('API Error:', result);
        window.showToastError('error', 'Creation Failed', result.message || 'Failed to create ticket. Please try again.');
      }
      
    } catch (error) {
      console.error('Network Error:', error);
      window.showToastError('error', 'Network Error', 'Unable to connect to the server. Please check your connection and try again.');
    } finally {
      
      submitBtn.disabled = false;
      submitBtn.innerHTML = originalBtnContent;
    }
  }

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

      const skeletonImg = document.createElement("div");
      skeletonImg.className = "w-8 h-8 rounded-full bg-gray-300";

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

    display.innerHTML = `
      <div class="flex items-center gap-2">
        <div class="w-4 h-4 border-2 border-gray-300 border-t-primary rounded-full animate-spin"></div>
        <span>Loading agents...</span>
      </div>
    `;

    const skeletonItems = createSkeletonLoader();
    skeletonItems.forEach(item => list.appendChild(item));

    btn.addEventListener("click", () => {
      list.classList.toggle("hidden");
      icon.classList.toggle("rotate-180");
    });

    fetchTKEmployees().then(employees => {
      
      list.innerHTML = '';

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

        const img = document.createElement("img");
        img.className = "w-8 h-8 rounded-full object-cover";
        img.src = employee.pfplink || "https://via.placeholder.com/32x32?text=CS";
        img.alt = `${employee.firstname} ${employee.lastname}`;

        img.onerror = () => {
          img.src = "https://via.placeholder.com/32x32?text=CS";
        };

        const nameSpan = document.createElement("span");
        nameSpan.textContent = `CS - ${employee.firstname} ${employee.lastname}`;
        nameSpan.className = "text-sm";

        li.appendChild(img);
        li.appendChild(nameSpan);

        li.onclick = () => {
          
          selectedEmployeeId = employee._id;

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

    display.textContent = placeholder;

    btn.addEventListener("click", () => {
      list.classList.toggle("hidden");
      icon.classList.toggle("rotate-180");
    });

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

    document.addEventListener("click", (e) => {
      if (!btn.contains(e.target) && !list.contains(e.target)) {
        list.classList.add("hidden");
        icon.classList.remove("rotate-180");
      }
    });
  }

  window.getSelectedEmployeeId = function() {
    return selectedEmployeeId;
  };

  window.getSelectedCategory = function() {
    return selectedCategory;
  };

  const concerns = ["Location", "Appliances", "Amenities", "Payment", "Others"];

  setupAgentDropdown(); 
  setupDropdown("concern", concerns, "Select a Concern");

  const form = document.getElementById('generateTicketForm');
  if (form) {
    form.addEventListener('submit', handleFormSubmission);
  }
});