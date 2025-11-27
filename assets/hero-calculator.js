/**
 * Multi-Calculator System with Mobile Navigation
 * Handles all calculators on homepage + mobile sidebar
 */

(function() {
    'use strict';
    
    // Store chart instances for each calculator
    const charts = {};
    let currentCalc = 'deposit';
    
    // Currency settings
    const currencies = {
        'USD': '$',
        'EUR': '€',
        'PLN': 'zł',
        'RUB': '₽'
    };
    let currentCurrency = '₽';
    
    // =========================================
    // UTILITY FUNCTIONS
    // =========================================
    
    function formatCurrency(num, currency = '₽') {
        const formatted = new Intl.NumberFormat('ru-RU', {
            maximumFractionDigits: 0,
            minimumFractionDigits: 0
        }).format(Math.abs(num));
        return `${currency}${formatted}`;
    }
    
    function parseNumber(str) {
        return parseFloat((str || '').toString().replace(/\s|\u00A0/g, '').replace(',', '.')) || 0;
    }
    
    function formatInput(value) {
        return new Intl.NumberFormat('ru-RU').format(Math.round(value));
    }
    
    // =========================================
    // MOBILE MENU SYSTEM
    // =========================================
    
    function initMobileMenu() {
        const menuToggle = document.getElementById('mobile-menu-toggle');
        const sidebarClose = document.getElementById('sidebar-close');
        const sidebar = document.getElementById('app-sidebar');
        const overlay = document.getElementById('sidebar-overlay');
        
        if (!menuToggle || !sidebar) return;
        
        function openSidebar() {
            sidebar.classList.add('open');
            if (overlay) overlay.classList.add('active');
            menuToggle.classList.add('active');
            document.body.style.overflow = 'hidden';
        }
        
        function closeSidebar() {
            sidebar.classList.remove('open');
            if (overlay) overlay.classList.remove('active');
            menuToggle.classList.remove('active');
            document.body.style.overflow = '';
        }
        
        menuToggle.addEventListener('click', () => {
            if (sidebar.classList.contains('open')) {
                closeSidebar();
            } else {
                openSidebar();
            }
        });
        
        if (sidebarClose) {
            sidebarClose.addEventListener('click', closeSidebar);
        }
        
        if (overlay) {
            overlay.addEventListener('click', closeSidebar);
        }
        
        // Close on Escape key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && sidebar.classList.contains('open')) {
                closeSidebar();
            }
        });
        
        // Return close function for use in calculator switching
        return closeSidebar;
    }
    
    // =========================================
    // CALCULATOR SWITCHING SYSTEM
    // =========================================
    
    function initCalculatorSwitching(closeSidebar) {
        const sidebarLinks = document.querySelectorAll('.sidebar-link[data-calc]');
        const calculators = document.querySelectorAll('.calc-hero[data-calc]');
        const appLayout = document.querySelector('.app-layout');
        
        sidebarLinks.forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const calcId = link.dataset.calc;
                
                // Switch to calculators tab if on another tab
                if (window.switchTab) {
                    window.switchTab('calculators');
                }
                
                if (calcId === currentCalc) {
                    if (closeSidebar) closeSidebar();
                    return;
                }
                
                // Update active link
                sidebarLinks.forEach(l => l.classList.remove('active'));
                link.classList.add('active');
                
                // Update active calculator
                calculators.forEach(calc => calc.classList.remove('active'));
                const targetCalc = document.getElementById(`calc-${calcId}`);
                if (targetCalc) {
                    targetCalc.classList.add('active');
                }
                
                // Update body attribute for themed sidebar
                if (appLayout) {
                    appLayout.setAttribute('data-active-calc', calcId);
                }
                
                currentCalc = calcId;
                
                // Close mobile sidebar
                if (closeSidebar) closeSidebar();
                
                // Initialize calculator if needed
                initCalculator(calcId);
                
                // Scroll to top
                window.scrollTo({ top: 0, behavior: 'smooth' });
            });
        });
    }
    
    // =========================================
    // CALCULATOR CALCULATIONS
    // =========================================
    
    // Deposit Calculator
    function calcDeposit() {
        const initial = parseNumber(document.getElementById('deposit-initial')?.value || 100000);
        const rate = parseNumber(document.getElementById('deposit-rate')?.value || 16);
        const term = parseNumber(document.getElementById('deposit-term')?.value || 12);
        const termUnit = document.getElementById('deposit-term-unit')?.value || 'months';
        const compound = parseInt(document.getElementById('deposit-compound')?.value || 12);
        
        const years = termUnit === 'years' ? term : term / 12;
        const n = compound;
        const r = rate / 100;
        
        const future = initial * Math.pow(1 + r/n, n * years);
        const interest = future - initial;
        
        document.getElementById('deposit-result-total').textContent = formatCurrency(future, currentCurrency);
        document.getElementById('deposit-result-invested').textContent = formatCurrency(initial, currentCurrency);
        document.getElementById('deposit-result-interest').textContent = '+' + formatCurrency(interest, currentCurrency);
        
        updateDepositChart(initial, rate, term, termUnit, compound);
    }
    
    // Loan Calculator
    function calcLoan() {
        const amount = parseNumber(document.getElementById('loan-amount')?.value || 100000);
        const rate = parseNumber(document.getElementById('loan-rate')?.value || 18);
        const term = parseNumber(document.getElementById('loan-term')?.value || 12);
        const termUnit = document.getElementById('loan-term-unit')?.value || 'months';
        
        const months = termUnit === 'years' ? term * 12 : term;
        const monthlyRate = rate / 100 / 12;
        
        let payment, totalPayment, totalInterest;
        
        if (monthlyRate === 0) {
            payment = amount / months;
            totalPayment = amount;
            totalInterest = 0;
        } else {
            payment = amount * (monthlyRate * Math.pow(1 + monthlyRate, months)) / (Math.pow(1 + monthlyRate, months) - 1);
            totalPayment = payment * months;
            totalInterest = totalPayment - amount;
        }
        
        document.getElementById('loan-result-payment').textContent = formatCurrency(payment, currentCurrency);
        document.getElementById('loan-result-total').textContent = formatCurrency(totalPayment, currentCurrency);
        document.getElementById('loan-result-interest').textContent = formatCurrency(totalInterest, currentCurrency);
        
        updateLoanChart(amount, rate, months);
    }
    
    // Savings Goal Calculator
    function calcSavings() {
        const goal = parseNumber(document.getElementById('savings-goal')?.value || 100000);
        const initial = parseNumber(document.getElementById('savings-initial')?.value || 0);
        const rate = parseNumber(document.getElementById('savings-rate')?.value || 10);
        const term = parseNumber(document.getElementById('savings-term')?.value || 12);
        const termUnit = document.getElementById('savings-term-unit')?.value || 'months';
        
        const months = termUnit === 'years' ? term * 12 : term;
        const monthlyRate = rate / 100 / 12;
        
        let monthlyNeeded;
        const needToSave = goal - initial * Math.pow(1 + monthlyRate, months);
        
        if (monthlyRate === 0) {
            monthlyNeeded = needToSave / months;
        } else {
            monthlyNeeded = needToSave * monthlyRate / (Math.pow(1 + monthlyRate, months) - 1);
        }
        
        const totalContributions = initial + monthlyNeeded * months;
        const interestEarned = goal - totalContributions;
        
        document.getElementById('savings-result-monthly').textContent = formatCurrency(Math.max(0, monthlyNeeded), currentCurrency);
        document.getElementById('savings-result-goal').textContent = formatCurrency(goal, currentCurrency);
        document.getElementById('savings-result-interest').textContent = '+' + formatCurrency(Math.max(0, interestEarned), currentCurrency);
        
        updateSavingsChart(initial, monthlyNeeded, rate, months);
    }
    
    // Mortgage Calculator
    function calcMortgage() {
        const price = parseNumber(document.getElementById('mortgage-price')?.value || 3000000);
        const downPaymentPercent = parseNumber(document.getElementById('mortgage-down')?.value || 20);
        const rate = parseNumber(document.getElementById('mortgage-rate')?.value || 12);
        const termYears = parseInt(document.getElementById('mortgage-term')?.value || 15);
        
        const downPayment = price * (downPaymentPercent / 100);
        const loanAmount = price - downPayment;
        const months = termYears * 12;
        const monthlyRate = rate / 100 / 12;
        
        let payment;
        if (monthlyRate === 0) {
            payment = loanAmount / months;
        } else {
            payment = loanAmount * (monthlyRate * Math.pow(1 + monthlyRate, months)) / (Math.pow(1 + monthlyRate, months) - 1);
        }
        
        const totalPayment = payment * months;
        const totalInterest = totalPayment - loanAmount;
        
        document.getElementById('mortgage-result-payment').textContent = formatCurrency(payment, currentCurrency);
        document.getElementById('mortgage-result-total').textContent = formatCurrency(totalPayment, currentCurrency);
        document.getElementById('mortgage-result-interest').textContent = formatCurrency(totalInterest, currentCurrency);
        
        updateMortgageChart(loanAmount, rate, months);
    }
    
    // Credit Card Calculator
    function calcCreditCard() {
        const balance = parseNumber(document.getElementById('cc-balance')?.value || 50000);
        const apr = parseNumber(document.getElementById('cc-apr')?.value || 24);
        const payment = parseNumber(document.getElementById('cc-payment')?.value || 5000);
        
        const monthlyRate = apr / 100 / 12;
        let currentBalance = balance;
        let totalPaid = 0;
        let months = 0;
        const maxMonths = 360;
        
        const balanceHistory = [balance];
        
        while (currentBalance > 0.01 && months < maxMonths) {
            const interest = currentBalance * monthlyRate;
            const principalPayment = Math.min(payment - interest, currentBalance);
            
            if (principalPayment <= 0) {
                months = -1; // Infinite
                break;
            }
            
            currentBalance = currentBalance + interest - payment;
            if (currentBalance < 0) currentBalance = 0;
            
            totalPaid += payment;
            months++;
            balanceHistory.push(Math.max(0, currentBalance));
        }
        
        const totalInterest = totalPaid - balance;
        
        const monthsText = months === -1 ? '∞' : `${months} мес.`;
        document.getElementById('cc-result-months').textContent = monthsText;
        document.getElementById('cc-result-total').textContent = formatCurrency(totalPaid, currentCurrency);
        document.getElementById('cc-result-interest').textContent = formatCurrency(totalInterest, currentCurrency);
        
        updateCreditCardChart(balanceHistory);
    }
    
    // ROI Calculator
    function calcROI() {
        const initial = parseNumber(document.getElementById('roi-initial')?.value || 100000);
        const final = parseNumber(document.getElementById('roi-final')?.value || 150000);
        const period = parseNumber(document.getElementById('roi-period')?.value || 12);
        
        const profit = final - initial;
        const roi = (profit / initial) * 100;
        const annualizedROI = ((Math.pow(final / initial, 12 / period) - 1) * 100);
        
        const roiSign = roi >= 0 ? '+' : '';
        document.getElementById('roi-result-percent').textContent = `${roiSign}${roi.toFixed(1)}%`;
        document.getElementById('roi-result-profit').textContent = (profit >= 0 ? '+' : '') + formatCurrency(profit, currentCurrency);
        document.getElementById('roi-result-annual').textContent = `${annualizedROI.toFixed(1)}%`;
        
        updateROIChart(initial, profit);
    }
    
    // =========================================
    // CHART UPDATES
    // =========================================
    
    function updateDepositChart(initial, rate, term, termUnit, compound) {
        const ctx = document.getElementById('deposit-chart');
        if (!ctx) return;
        
        const periods = termUnit === 'years' ? term : Math.ceil(term / 12);
        const n = compound;
        const r = rate / 100;
        
        const labels = [];
        const investedData = [];
        const interestData = [];
        
        for (let year = 0; year <= periods; year++) {
            labels.push(year === 0 ? 'Старт' : `${year}г`);
            const balance = initial * Math.pow(1 + r/n, n * year);
            investedData.push(initial);
            interestData.push(Math.round(balance - initial));
        }
        
        createOrUpdateChart('deposit', ctx, {
            type: 'line',
            labels,
            datasets: [
                { label: 'Вложено', data: investedData, color: 'rgba(107, 114, 128, 0.8)', bgColor: 'rgba(107, 114, 128, 0.2)' },
                { label: 'Проценты', data: interestData, color: 'rgba(0, 168, 107, 1)', bgColor: 'rgba(0, 168, 107, 0.2)' }
            ]
        });
    }
    
    function updateLoanChart(amount, rate, months) {
        const ctx = document.getElementById('loan-chart');
        if (!ctx) return;
        
        const monthlyRate = rate / 100 / 12;
        const payment = amount * (monthlyRate * Math.pow(1 + monthlyRate, months)) / (Math.pow(1 + monthlyRate, months) - 1);
        
        const labels = [];
        const principalData = [];
        const interestData = [];
        let balance = amount;
        
        const step = Math.max(1, Math.floor(months / 12));
        
        for (let m = 0; m <= months; m += step) {
            labels.push(m === 0 ? 'Старт' : `${m}м`);
            const interest = balance * monthlyRate;
            principalData.push(Math.round(balance));
            interestData.push(Math.round(payment * (months - m) - balance));
            balance = balance - (payment - interest);
            if (balance < 0) balance = 0;
        }
        
        createOrUpdateChart('loan', ctx, {
            type: 'line',
            labels,
            datasets: [
                { label: 'Остаток', data: principalData, color: '#0066ff', bgColor: 'rgba(0, 102, 255, 0.2)' },
                { label: 'Проценты', data: interestData, color: '#ff9500', bgColor: 'rgba(255, 149, 0, 0.2)' }
            ]
        });
    }
    
    function updateSavingsChart(initial, monthly, rate, months) {
        const ctx = document.getElementById('savings-chart');
        if (!ctx) return;
        
        const monthlyRate = rate / 100 / 12;
        const labels = [];
        const contributionsData = [];
        const interestData = [];
        let balance = initial;
        let totalContributions = initial;
        
        const step = Math.max(1, Math.floor(months / 12));
        
        for (let m = 0; m <= months; m += step) {
            labels.push(m === 0 ? 'Старт' : `${m}м`);
            contributionsData.push(Math.round(totalContributions));
            interestData.push(Math.round(balance - totalContributions));
            
            for (let i = 0; i < step && (m + i) < months; i++) {
                balance = balance * (1 + monthlyRate) + monthly;
                totalContributions += monthly;
            }
        }
        
        createOrUpdateChart('savings', ctx, {
            type: 'line',
            labels,
            datasets: [
                { label: 'Вложения', data: contributionsData, color: '#14b8a6', bgColor: 'rgba(20, 184, 166, 0.2)' },
                { label: 'Проценты', data: interestData, color: '#00a86b', bgColor: 'rgba(0, 168, 107, 0.2)' }
            ]
        });
    }
    
    function updateMortgageChart(amount, rate, months) {
        const ctx = document.getElementById('mortgage-chart');
        if (!ctx) return;
        
        const monthlyRate = rate / 100 / 12;
        const payment = monthlyRate === 0 ? amount / months : 
            amount * (monthlyRate * Math.pow(1 + monthlyRate, months)) / (Math.pow(1 + monthlyRate, months) - 1);
        
        const labels = [];
        const principalData = [];
        const interestData = [];
        let balance = amount;
        let totalInterestPaid = 0;
        
        const step = Math.max(1, Math.floor(months / 24));
        
        for (let m = 0; m <= months; m += step) {
            const year = Math.floor(m / 12);
            labels.push(m === 0 ? 'Старт' : `${year}г`);
            principalData.push(Math.round(amount - balance));
            interestData.push(Math.round(totalInterestPaid));
            
            for (let i = 0; i < step && (m + i) < months; i++) {
                const interest = balance * monthlyRate;
                totalInterestPaid += interest;
                balance -= (payment - interest);
                if (balance < 0) balance = 0;
            }
        }
        
        createOrUpdateChart('mortgage', ctx, {
            type: 'line',
            labels,
            datasets: [
                { label: 'Основной долг', data: principalData, color: '#8b5cf6', bgColor: 'rgba(139, 92, 246, 0.2)' },
                { label: 'Проценты', data: interestData, color: '#ef4444', bgColor: 'rgba(239, 68, 68, 0.2)' }
            ]
        });
    }
    
    function updateCreditCardChart(balanceHistory) {
        const ctx = document.getElementById('creditcard-chart');
        if (!ctx) return;
        
        const labels = [];
        const step = Math.max(1, Math.floor(balanceHistory.length / 12));
        const data = [];
        
        for (let i = 0; i < balanceHistory.length; i += step) {
            labels.push(i === 0 ? 'Старт' : `${i}м`);
            data.push(Math.round(balanceHistory[i]));
        }
        
        createOrUpdateChart('creditcard', ctx, {
            type: 'line',
            labels,
            datasets: [
                { label: 'Баланс', data: data, color: '#ec4899', bgColor: 'rgba(236, 72, 153, 0.2)' }
            ]
        });
    }
    
    function updateROIChart(initial, profit) {
        const ctx = document.getElementById('roi-chart');
        if (!ctx) return;
        
        createOrUpdateChart('roi', ctx, {
            type: 'doughnut',
            labels: ['Вложения', profit >= 0 ? 'Прибыль' : 'Убыток'],
            datasets: [
                { data: [initial, Math.abs(profit)], colors: ['#6b7280', profit >= 0 ? '#10b981' : '#ef4444'] }
            ]
        });
    }
    
    function createOrUpdateChart(id, ctx, config) {
        if (charts[id]) {
            charts[id].destroy();
        }
        
        const chartConfig = config.type === 'doughnut' ? {
            type: 'doughnut',
            data: {
                labels: config.labels,
                datasets: [{
                    data: config.datasets[0].data,
                    backgroundColor: config.datasets[0].colors,
                    borderWidth: 0
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                cutout: '70%',
                plugins: {
                    legend: { display: false },
                    tooltip: {
                        backgroundColor: 'rgba(17, 24, 39, 0.95)',
                        callbacks: {
                            label: function(context) {
                                return `${context.label}: ${formatCurrency(context.parsed, currentCurrency)}`;
                            }
                        }
                    }
                }
            }
        } : {
            type: 'line',
            data: {
                labels: config.labels,
                datasets: config.datasets.map(ds => ({
                    label: ds.label,
                    data: ds.data,
                    borderColor: ds.color,
                    backgroundColor: ds.bgColor,
                    borderWidth: 2,
                    fill: true,
                    tension: 0.4,
                    pointRadius: 0,
                    pointHoverRadius: 4
                }))
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                interaction: { intersect: false, mode: 'index' },
                plugins: {
                    legend: { display: false },
                    tooltip: {
                        backgroundColor: 'rgba(17, 24, 39, 0.95)',
                        callbacks: {
                            label: function(context) {
                                return `${context.dataset.label}: ${formatCurrency(context.parsed.y, currentCurrency)}`;
                            }
                        }
                    }
                },
                scales: {
                    x: { grid: { display: false }, ticks: { color: '#9ca3af' } },
                    y: {
                        stacked: config.type !== 'doughnut',
                        grid: { color: 'rgba(156, 163, 175, 0.1)' },
                        ticks: {
                            color: '#9ca3af',
                            callback: function(value) {
                                if (value >= 1000000) return (value / 1000000).toFixed(1) + 'M';
                                if (value >= 1000) return (value / 1000).toFixed(0) + 'K';
                                return value;
                            }
                        }
                    }
                }
            }
        };
        
        charts[id] = new Chart(ctx, chartConfig);
    }
    
    // =========================================
    // INPUT HANDLING
    // =========================================
    
    function initCalculator(calcId) {
        const calcFunctions = {
            deposit: calcDeposit,
            loan: calcLoan,
            savings: calcSavings,
            mortgage: calcMortgage,
            creditcard: calcCreditCard,
            roi: calcROI
        };
        
        if (calcFunctions[calcId]) {
            calcFunctions[calcId]();
        }
    }
    
    function setupInputHandlers() {
        // Deposit inputs
        setupRangeSync('deposit-initial', 'deposit-initial-range', true);
        setupRangeSync('deposit-rate', 'deposit-rate-range', false);
        setupCalcInputs('deposit', ['deposit-initial', 'deposit-rate', 'deposit-term', 'deposit-term-unit', 'deposit-compound'], calcDeposit);
        
        // Loan inputs
        setupRangeSync('loan-amount', 'loan-amount-range', true);
        setupRangeSync('loan-rate', 'loan-rate-range', false);
        setupCalcInputs('loan', ['loan-amount', 'loan-rate', 'loan-term', 'loan-term-unit'], calcLoan);
        
        // Savings inputs
        setupRangeSync('savings-goal', 'savings-goal-range', true);
        setupRangeSync('savings-rate', 'savings-rate-range', false);
        setupCalcInputs('savings', ['savings-goal', 'savings-initial', 'savings-rate', 'savings-term', 'savings-term-unit'], calcSavings);
        
        // Mortgage inputs
        setupRangeSync('mortgage-price', 'mortgage-price-range', true);
        setupRangeSync('mortgage-down', 'mortgage-down-range', false);
        setupRangeSync('mortgage-rate', 'mortgage-rate-range', false);
        setupCalcInputs('mortgage', ['mortgage-price', 'mortgage-down', 'mortgage-rate', 'mortgage-term'], calcMortgage);
        
        // Credit Card inputs
        setupRangeSync('cc-balance', 'cc-balance-range', true);
        setupRangeSync('cc-apr', 'cc-apr-range', false);
        setupRangeSync('cc-payment', 'cc-payment-range', true);
        setupCalcInputs('creditcard', ['cc-balance', 'cc-apr', 'cc-payment'], calcCreditCard);
        
        // ROI inputs
        setupRangeSync('roi-initial', 'roi-initial-range', true);
        setupRangeSync('roi-final', 'roi-final-range', true);
        setupRangeSync('roi-period', 'roi-period-range', false);
        setupCalcInputs('roi', ['roi-initial', 'roi-final', 'roi-period'], calcROI);
        
        // Reset buttons
        document.querySelectorAll('[data-reset]').forEach(btn => {
            btn.addEventListener('click', () => resetCalculator(btn.dataset.reset));
        });
        
        // Deposit presets
        setupPresets();
    }
    
    function setupRangeSync(inputId, rangeId, formatAsNumber) {
        const input = document.getElementById(inputId);
        const range = document.getElementById(rangeId);
        if (!input || !range) return;
        
        input.addEventListener('input', () => {
            range.value = parseNumber(input.value);
        });
        
        range.addEventListener('input', () => {
            input.value = formatAsNumber ? formatInput(range.value) : range.value;
        });
    }
    
    function setupCalcInputs(calcId, inputIds, calcFn) {
        inputIds.forEach(id => {
            const el = document.getElementById(id);
            if (el) {
                el.addEventListener('input', calcFn);
                el.addEventListener('change', calcFn);
            }
            
            // Also setup range if exists
            const range = document.getElementById(id + '-range');
            if (range) {
                range.addEventListener('input', calcFn);
            }
        });
    }
    
    function setupPresets() {
        const presetBtns = document.querySelectorAll('.preset-btn');
        
        presetBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                presetBtns.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                
                const rate = parseFloat(btn.dataset.rate);
                const currency = btn.dataset.currency;
                
                currentCurrency = currencies[currency] || '₽';
                
                document.querySelectorAll('.currency-symbol').forEach(el => {
                    el.textContent = currentCurrency;
                });
                
                const rateInput = document.getElementById('deposit-rate');
                const rateRange = document.getElementById('deposit-rate-range');
                if (rateInput) rateInput.value = rate;
                if (rateRange) rateRange.value = rate;
                
                calcDeposit();
            });
        });
    }
    
    function resetCalculator(calcId) {
        const defaults = {
            deposit: { 'deposit-initial': 100000, 'deposit-rate': 16, 'deposit-term': 12 },
            loan: { 'loan-amount': 100000, 'loan-rate': 18, 'loan-term': 12 },
            savings: { 'savings-goal': 100000, 'savings-initial': 0, 'savings-rate': 10, 'savings-term': 12 },
            mortgage: { 'mortgage-price': 3000000, 'mortgage-down': 20, 'mortgage-rate': 12, 'mortgage-term': 15 },
            creditcard: { 'cc-balance': 50000, 'cc-apr': 24, 'cc-payment': 5000 },
            roi: { 'roi-initial': 100000, 'roi-final': 150000, 'roi-period': 12 }
        };
        
        const vals = defaults[calcId];
        if (!vals) return;
        
        Object.entries(vals).forEach(([id, value]) => {
            const input = document.getElementById(id);
            const range = document.getElementById(id + '-range');
            
            if (input) {
                if (id.includes('rate') || id.includes('down') || id.includes('apr') || id.includes('term') || id.includes('period')) {
                    input.value = value;
                } else {
                    input.value = formatInput(value);
                }
            }
            if (range) range.value = value;
        });
        
        initCalculator(calcId);
    }
    
    // =========================================
    // INITIALIZATION
    // =========================================
    
    function init() {
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', init);
            return;
        }
        
        // Check if we're on the homepage
        if (!document.getElementById('calculators-container')) return;
        
        // Initialize mobile menu
        const closeSidebar = initMobileMenu();
        
        // Initialize calculator switching
        initCalculatorSwitching(closeSidebar);
        
        // Setup input handlers
        setupInputHandlers();
        
        // Initialize deposit calculator (default)
        setTimeout(() => {
            calcDeposit();
        }, 100);
    }
    
    init();
})();
