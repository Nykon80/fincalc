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




