const STORAGE_KEY = "financeCoachProHistory";
let latestAnalysis = null;

function getValue(id) {
  return Number(document.getElementById(id).value) || 0;
}

function getCurrency() {
  return document.getElementById("currency").value || "RM";
}

function money(value) {
  return `${getCurrency()} ${Number(value || 0).toFixed(2)}`;
}

function scrollToForm() {
  document.getElementById("financeForm").scrollIntoView({ behavior: "smooth" });
}

function analyzeBudget() {
  const currency = getCurrency();
  const income = getValue("income");

  if (income <= 0) {
    document.getElementById("analysisResult").innerHTML = `
      <div class="empty-box">
        <h3>Income is required</h3>
        <p>Please enter your monthly income before generating the finance analysis.</p>
      </div>
    `;
    return;
  }

  const categories = {
    "Rent / Housing": getValue("rent"),
    "Food & Groceries": getValue("food"),
    "Transport": getValue("transport"),
    "Bills & Utilities": getValue("bills"),
    "Entertainment / Lifestyle": getValue("lifestyle"),
    "Subscriptions": getValue("subscriptions"),
    "Education / Learning": getValue("education"),
    "Debt / Loan Payment": getValue("debt"),
    "Other Expenses": getValue("other")
  };

  const savingGoal = getValue("savingGoal");
  const currentSavings = getValue("currentSavings");
  const emergencyTarget = getValue("emergencyTarget");

  const totalExpenses = Object.values(categories).reduce((sum, value) => sum + value, 0);
  const balance = income - totalExpenses;
  const savingsRate = income > 0 ? (Math.max(balance, 0) / income) * 100 : 0;
  const expenseRatio = income > 0 ? (totalExpenses / income) * 100 : 0;
  const debtRatio = income > 0 ? (categories["Debt / Loan Payment"] / income) * 100 : 0;
  const emergencyRunway = totalExpenses > 0 ? currentSavings / totalExpenses : 0;
  const savingGap = Math.max(0, savingGoal - Math.max(balance, 0));
  const emergencyProgress = emergencyTarget > 0 ? (currentSavings / emergencyTarget) * 100 : 0;

  const needs = categories["Rent / Housing"] + categories["Food & Groceries"] + categories["Transport"] + categories["Bills & Utilities"];
  const wants = categories["Entertainment / Lifestyle"] + categories["Subscriptions"] + categories["Other Expenses"];
  const growth = categories["Education / Learning"];
  const debt = categories["Debt / Loan Payment"];

  const needsRatio = (needs / income) * 100;
  const wantsRatio = (wants / income) * 100;
  const savingsAndDebtRatio = ((Math.max(balance, 0) + debt) / income) * 100;

  const score = calculateScore({
    savingsRate,
    expenseRatio,
    debtRatio,
    emergencyRunway,
    emergencyProgress,
    balance
  });

  const status = getStatus(score);
  const recommendations = generateRecommendations({
    income,
    totalExpenses,
    balance,
    savingsRate,
    expenseRatio,
    debtRatio,
    emergencyRunway,
    emergencyProgress,
    savingGoal,
    savingGap,
    needsRatio,
    wantsRatio,
    savingsAndDebtRatio,
    categories
  });

  latestAnalysis = {
    id: Date.now(),
    currency,
    income,
    categories,
    totalExpenses,
    balance,
    savingsRate,
    expenseRatio,
    debtRatio,
    emergencyRunway,
    emergencyProgress,
    savingGoal,
    savingGap,
    needsRatio,
    wantsRatio,
    savingsAndDebtRatio,
    score,
    status,
    recommendations,
    createdAt: new Date().toISOString()
  };

  renderAnalysis(latestAnalysis);
  renderDashboard(latestAnalysis);
  renderBreakdown(categories, totalExpenses);
  renderBudgetRule(latestAnalysis);
  saveHistory(latestAnalysis);
  renderHistory();
}

function calculateScore(data) {
  let score = 0;

  if (data.balance > 0) score += 20;
  if (data.savingsRate >= 20) score += 25;
  else if (data.savingsRate >= 10) score += 15;
  else if (data.savingsRate > 0) score += 8;

  if (data.expenseRatio <= 70) score += 20;
  else if (data.expenseRatio <= 85) score += 12;
  else if (data.expenseRatio <= 100) score += 5;

  if (data.debtRatio <= 10) score += 15;
  else if (data.debtRatio <= 25) score += 8;

  if (data.emergencyRunway >= 6) score += 20;
  else if (data.emergencyRunway >= 3) score += 12;
  else if (data.emergencyRunway >= 1) score += 6;

  return Math.min(100, Math.round(score));
}

function getStatus(score) {
  if (score >= 85) return "Excellent";
  if (score >= 70) return "Good";
  if (score >= 50) return "Needs Improvement";
  return "High Attention";
}

function generateRecommendations(data) {
  const tips = [];

  if (data.balance < 0) {
    tips.push("Your expenses are higher than your income. Focus on reducing non-essential spending first.");
  }

  if (data.savingsRate < 10) {
    tips.push("Your savings rate is low. Try to target at least 10% first, then slowly move toward 20%.");
  } else if (data.savingsRate >= 20) {
    tips.push("Your savings rate is strong. Continue protecting this habit and avoid lifestyle inflation.");
  }

  if (data.wantsRatio > 30) {
    tips.push("Your lifestyle and optional spending are above the recommended 30% range. Review entertainment, subscriptions, and other flexible expenses.");
  }

  if (data.needsRatio > 55) {
    tips.push("Your essential expenses are high. Review housing, food, transport, and bills for possible optimization.");
  }

  if (data.debtRatio > 25) {
    tips.push("Your debt payment is taking a large part of income. Consider a repayment plan and avoid adding new debt.");
  }

  if (data.emergencyRunway < 3) {
    tips.push("Your emergency runway is below 3 months. Build emergency savings before taking bigger financial risks.");
  }

  if (data.savingGap > 0) {
    tips.push(`You are short by ${money(data.savingGap)} from your monthly saving goal. Try reducing flexible expenses or increasing income.`);
  }

  const highestExpense = Object.entries(data.categories).sort((a, b) => b[1] - a[1])[0];

  if (highestExpense && highestExpense[1] > 0) {
    tips.push(`Your highest expense category is ${highestExpense[0]}. Review this category first for improvement.`);
  }

  if (tips.length === 0) {
    tips.push("Your budget looks balanced. Keep tracking monthly and review your goals regularly.");
  }

  return tips;
}

function renderAnalysis(data) {
  document.getElementById("analysisResult").innerHTML = `
    <div class="summary-box">
      <span class="badge ${data.score >= 70 ? "green" : data.score >= 50 ? "orange" : "red"}">${data.status}</span>
      <span class="badge">${data.currency}</span>

      <h3>Budget Score</h3>
      <div class="score-big">${data.score}%</div>

      <div class="progress-bg">
        <div style="width: ${data.score}%"></div>
      </div>

      <p>
        Your monthly income is <strong>${money(data.income)}</strong>, total expenses are
        <strong>${money(data.totalExpenses)}</strong>, and your balance is
        <strong>${money(data.balance)}</strong>.
      </p>

      <div class="rule-grid">
        <div class="rule-card">
          <strong>Savings Rate</strong>
          <p>${data.savingsRate.toFixed(1)}% of income remains after expenses.</p>
        </div>

        <div class="rule-card">
          <strong>Expense Ratio</strong>
          <p>${data.expenseRatio.toFixed(1)}% of your income is used for expenses.</p>
        </div>

        <div class="rule-card">
          <strong>Emergency Runway</strong>
          <p>Your current savings can cover about ${data.emergencyRunway.toFixed(1)} month(s) of expenses.</p>
        </div>

        <div class="rule-card">
          <strong>Saving Goal Gap</strong>
          <p>${data.savingGap > 0 ? `You still need ${money(data.savingGap)} to reach your monthly saving goal.` : "You reached your monthly saving goal."}</p>
        </div>
      </div>
    </div>

    <div class="tip-box">
      <h3>AI-Style Budget Coach Suggestions</h3>
      <ul>
        ${data.recommendations.map(tip => `<li>${tip}</li>`).join("")}
      </ul>
    </div>

    <div class="tip-box">
      <h3>30-Day Action Plan</h3>
      <ol>
        <li>Track every expense for the next 7 days.</li>
        <li>Cancel or reduce one low-value subscription.</li>
        <li>Set an automatic saving transfer after income is received.</li>
        <li>Review your highest spending category and reduce it by 5% to 10%.</li>
        <li>Build emergency savings until you reach at least 3 months of expenses.</li>
      </ol>
    </div>
  `;
}

function renderDashboard(data) {
  document.getElementById("statIncome").textContent = money(data.income);
  document.getElementById("statExpenses").textContent = money(data.totalExpenses);
  document.getElementById("statBalance").textContent = money(data.balance);
  document.getElementById("statSavingsRate").textContent = `${data.savingsRate.toFixed(1)}%`;
  document.getElementById("statExpenseRatio").textContent = `${data.expenseRatio.toFixed(1)}%`;
  document.getElementById("statRunway").textContent = `${data.emergencyRunway.toFixed(1)} months`;
  document.getElementById("statDebt").textContent = `${data.debtRatio.toFixed(1)}%`;
  document.getElementById("statScore").textContent = `${data.score}%`;

  document.getElementById("heroScore").textContent = `${data.score}%`;
  document.getElementById("heroStatus").textContent = data.status;
  document.getElementById("heroProgress").style.width = `${data.score}%`;
}

function renderBreakdown(categories, totalExpenses) {
  const box = document.getElementById("categoryBreakdown");
  const entries = Object.entries(categories)
    .filter(item => item[1] > 0)
    .sort((a, b) => b[1] - a[1]);

  if (entries.length === 0) {
    box.innerHTML = `
      <div class="empty-box">
        <p>No expense data yet.</p>
      </div>
    `;
    return;
  }

  box.innerHTML = entries.map(([label, value]) => {
    const percentage = totalExpenses > 0 ? (value / totalExpenses) * 100 : 0;

    return `
      <div class="breakdown-item">
        <div class="breakdown-top">
          <span>${label}</span>
          <span>${money(value)} · ${percentage.toFixed(1)}%</span>
        </div>
        <div class="breakdown-bg">
          <div class="breakdown-fill" style="width: ${percentage}%"></div>
        </div>
      </div>
    `;
  }).join("");
}

function renderBudgetRule(data) {
  const box = document.getElementById("budgetRule");

  box.innerHTML = `
    <div class="rule-grid">
      <div class="rule-card">
        <strong>Needs</strong>
        <p>${data.needsRatio.toFixed(1)}% used for rent, food, transport, and bills. Recommended: around 50%.</p>
      </div>

      <div class="rule-card">
        <strong>Wants</strong>
        <p>${data.wantsRatio.toFixed(1)}% used for lifestyle, subscriptions, and other flexible expenses. Recommended: around 30%.</p>
      </div>

      <div class="rule-card">
        <strong>Savings + Debt</strong>
        <p>${data.savingsAndDebtRatio.toFixed(1)}% goes toward remaining balance and debt payment. Recommended: around 20% or more.</p>
      </div>
    </div>
  `;
}

function runSimulation() {
  if (!latestAnalysis) {
    alert("Please analyze your budget first.");
    return;
  }

  const lifestyleCut = getValue("reduceLifestyle") / 100;
  const subscriptionCut = getValue("reduceSubscriptions") / 100;
  const extraIncome = getValue("extraIncome");
  const extraSaving = getValue("extraSaving");

  const lifestyleSaving = latestAnalysis.categories["Entertainment / Lifestyle"] * lifestyleCut;
  const subscriptionSaving = latestAnalysis.categories["Subscriptions"] * subscriptionCut;
  const totalImprovement = lifestyleSaving + subscriptionSaving + extraIncome - extraSaving;
  const newBalance = latestAnalysis.balance + totalImprovement;
  const newSavingsRate = ((Math.max(newBalance, 0)) / (latestAnalysis.income + extraIncome)) * 100;

  document.getElementById("simulationResult").innerHTML = `
    <h3>Simulation Result</h3>
    <p>Estimated lifestyle saving: <strong>${money(lifestyleSaving)}</strong></p>
    <p>Estimated subscription saving: <strong>${money(subscriptionSaving)}</strong></p>
    <p>Extra income added: <strong>${money(extraIncome)}</strong></p>
    <p>Extra saving target added: <strong>${money(extraSaving)}</strong></p>
    <p>New estimated balance: <strong>${money(newBalance)}</strong></p>
    <p>New estimated savings rate: <strong>${newSavingsRate.toFixed(1)}%</strong></p>
  `;
}

function saveHistory(data) {
  const history = JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];

  history.unshift({
    score: data.score,
    status: data.status,
    currency: data.currency,
    income: data.income,
    expenses: data.totalExpenses,
    balance: data.balance,
    savingsRate: data.savingsRate,
    createdAt: data.createdAt
  });

  localStorage.setItem(STORAGE_KEY, JSON.stringify(history.slice(0, 10)));
}

function renderHistory() {
  const history = JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
  const box = document.getElementById("historyList");

  if (history.length === 0) {
    box.innerHTML = `
      <div class="empty-box">
        <p>No analysis history yet.</p>
      </div>
    `;
    return;
  }

  box.innerHTML = history.map(item => `
    <div class="history-item">
      <span class="badge ${item.score >= 70 ? "green" : item.score >= 50 ? "orange" : "red"}">${item.status}</span>
      <strong>Budget Score: ${item.score}%</strong>
      <p>
        Income: ${item.currency} ${Number(item.income).toFixed(2)} |
        Expenses: ${item.currency} ${Number(item.expenses).toFixed(2)} |
        Balance: ${item.currency} ${Number(item.balance).toFixed(2)} |
        Savings Rate: ${Number(item.savingsRate).toFixed(1)}%
      </p>
      <small>${new Date(item.createdAt).toLocaleString()}</small>
    </div>
  `).join("");
}

function clearHistory() {
  const confirmed = confirm("Clear all finance analysis history?");
  if (!confirmed) return;

  localStorage.removeItem(STORAGE_KEY);
  latestAnalysis = null;
  renderHistory();
}

function loadDemoData() {
  document.getElementById("currency").value = "RM";
  document.getElementById("income").value = 4600;
  document.getElementById("savingGoal").value = 800;
  document.getElementById("currentSavings").value = 3500;
  document.getElementById("emergencyTarget").value = 12000;
  document.getElementById("rent").value = 900;
  document.getElementById("food").value = 650;
  document.getElementById("transport").value = 280;
  document.getElementById("bills").value = 320;
  document.getElementById("lifestyle").value = 300;
  document.getElementById("subscriptions").value = 90;
  document.getElementById("education").value = 150;
  document.getElementById("debt").value = 300;
  document.getElementById("other").value = 180;

  analyzeBudget();
}

function exportCSV() {
  const history = JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];

  if (history.length === 0) {
    alert("No history to export.");
    return;
  }

  const headers = [
    "Score",
    "Status",
    "Currency",
    "Income",
    "Expenses",
    "Balance",
    "Savings Rate",
    "Created At"
  ];

  const rows = history.map(item => [
    item.score,
    item.status,
    item.currency,
    item.income,
    item.expenses,
    item.balance,
    item.savingsRate,
    new Date(item.createdAt).toLocaleString()
  ]);

  const csv = [headers, ...rows]
    .map(row => row.map(value => `"${String(value).replaceAll('"', '""')}"`).join(","))
    .join("\n");

  downloadFile(csv, "finance-coach-history.csv", "text/csv");
}

function exportJSON() {
  const history = JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];

  if (history.length === 0) {
    alert("No history to export.");
    return;
  }

  downloadFile(
    JSON.stringify(history, null, 2),
    "finance-coach-history.json",
    "application/json"
  );
}

function downloadFile(content, filename, type) {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");

  link.href = url;
  link.download = filename;
  link.click();

  URL.revokeObjectURL(url);
}

function printReport() {
  if (!latestAnalysis) {
    alert("Please analyze your budget first.");
    return;
  }

  window.print();
}

renderHistory();
