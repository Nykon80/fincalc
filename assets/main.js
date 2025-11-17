function formatNumber(num) {
  return new Intl.NumberFormat('ru-RU', { maximumFractionDigits: 2 }).format(num);
}

function parseNumber(input) {
  const value = parseFloat((input || '').toString().replace(/\s|\u00A0/g, '').replace(',', '.'));
  return isFinite(value) ? value : 0;
}

function computeCompound({ initial, monthly, annualRate, years, compoundsPerYear = 12 }) {
  const r = annualRate / 100 / compoundsPerYear;
  const n = years * compoundsPerYear;
  let future = initial * Math.pow(1 + r, n);
  // Future value of series of payments at each period end
  if (monthly > 0) {
    future += monthly * ((Math.pow(1 + r, n) - 1) / r);
  }
  const invested = initial + monthly * years * 12;
  return { future, invested, interest: future - invested };
}

function computeAnnuityPayment({ principal, annualRate, years }) {
  const i = annualRate / 100 / 12;
  const n = years * 12;
  if (i === 0) {
    const payment = principal / n;
    return { payment, total: payment * n, overpay: payment * n - principal };
  }
  const payment = principal * (i * Math.pow(1 + i, n)) / (Math.pow(1 + i, n) - 1);
  const total = payment * n;
  return { payment, total, overpay: total - principal };
}

function computeMonthlyForGoal({ target, annualRate, years, initial = 0 }) {
  const periods = years * 12;
  const r = annualRate / 100 / 12;
  // FV = initial*(1+r)^n + PMT * ((1+r)^n - 1) / r
  const fvMinusInitial = Math.max(target - initial * Math.pow(1 + r, periods), 0);
  if (r === 0) return { monthly: fvMinusInitial / periods };
  const monthly = fvMinusInitial * r / (Math.pow(1 + r, periods) - 1);
  return { monthly };
}

function on(event, selector, handler) {
  document.addEventListener(event, (e) => {
    const target = e.target.closest(selector);
    if (target) handler(e, target);
  });
}

window.financeUtils = {
  formatNumber,
  parseNumber,
  computeCompound,
  computeAnnuityPayment,
  computeMonthlyForGoal,
  on,
};

// Tabs functionality
document.addEventListener('DOMContentLoaded', function() {
  const tabBtns = document.querySelectorAll('.tab-btn');
  const tabContents = document.querySelectorAll('.tab-content');
  
  // Function to switch tabs
  function switchTab(tabName) {
    // Remove active class from all buttons and contents
    tabBtns.forEach(btn => btn.classList.remove('active'));
    tabContents.forEach(content => content.classList.remove('active'));
    
    // Add active class to selected button and content
    const selectedBtn = document.querySelector(`.tab-btn[data-tab="${tabName}"]`);
    const selectedContent = document.getElementById(tabName);
    
    if (selectedBtn) selectedBtn.classList.add('active');
    if (selectedContent) selectedContent.classList.add('active');
    
    // Update URL hash without scrolling
    history.pushState(null, null, `#${tabName}`);
    
    // Scroll to top of page smoothly
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
    
    // Load news if news tab is activated
    if (tabName === 'news' && window.newsManager) {
      const currentLang = window.i18n ? window.i18n.currentLang : (localStorage.getItem('preferredLanguage') || 'en');
      window.newsManager.loadNews(currentLang);
    }
    
    // Dispatch custom event for tab activation
    window.dispatchEvent(new CustomEvent('tabActivated', {
      detail: { tabName: tabName }
    }));
  }
  
  // Add click event to all tab buttons
  tabBtns.forEach(btn => {
    btn.addEventListener('click', function() {
      const tabName = this.getAttribute('data-tab');
      switchTab(tabName);
    });
  });
  
  // Check URL hash on load and switch to that tab
  const hash = window.location.hash.substring(1); // Remove # from hash
  if (hash && ['news', 'calculators', 'articles', 'compare'].includes(hash)) {
    switchTab(hash);
  }
  
  // Handle browser back/forward buttons
  window.addEventListener('popstate', function() {
    const hash = window.location.hash.substring(1);
    if (hash && ['news', 'calculators', 'articles', 'compare'].includes(hash)) {
      switchTab(hash);
    } else {
      switchTab('calculators'); // Default to calculators if no hash
    }
  });
  
  // Language dropdown toggle for mobile
  const langDropdown = document.querySelector('.lang-dropdown');
  const langDropdownBtn = document.querySelector('.lang-dropdown-btn');
  const langDropdownContent = document.querySelector('.lang-dropdown-content');
  
  if (langDropdownBtn && langDropdownContent) {
    // Toggle dropdown on button click (for mobile)
    langDropdownBtn.addEventListener('click', function(e) {
      e.stopPropagation();
      const isOpen = langDropdownContent.style.display === 'block';
      langDropdownContent.style.display = isOpen ? 'none' : 'block';
    });
    
    // Close dropdown when clicking outside
    document.addEventListener('click', function(e) {
      if (!langDropdown.contains(e.target)) {
        langDropdownContent.style.display = 'none';
      }
    });
    
    // Close dropdown when language is selected
    langDropdownContent.querySelectorAll('a').forEach(link => {
      link.addEventListener('click', function() {
        langDropdownContent.style.display = 'none';
      });
    });
  }
});


