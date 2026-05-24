function getNumber(id) {
  return Number(document.getElementById(id).value) || 0;
}

function analyzeFinance() {
  const income = getNumber("income");
  const expenses = {
    rent: getNumber("rent"),
    food: getNumber("food"),
    transport: getNumber("transport"),
    bills: getNumber("bills"),
    entertainment: getNumber("entertainment"),
    others: getNumber("others")
  };
  const savingGoal = getNumber("savingGoal");
  const result = document.getElementById("result");

  if (income <= 0) {
    result.className = "empty";
    result.innerHTML = `
      <h3>Income is required</h3>
      <p>Please enter your monthly income before generating the finance analysis.</p>
    `;
    return;
  }

  const totalExpenses = Object.values(expenses).reduce((sum, value) => sum + value, 0);
  const remainingBalance = income - totalExpenses;
  const savingRate = Math.round((remainingBalance / income) * 100);
  const expenseRate = Math.round((totalExpenses / income) * 100);
  const goalProgress = savingGoal > 0 ? Math.round((remainingBalance / savingGoal) * 100) : 0;

  let score = 100;

  if (expenseRate > 80) score -= 35;
  else if (expenseRate > 65) score -= 20;
  else if (expenseRate > 50) score -= 10;

  if (savingRate < 10) score -= 25;
  else if (savingRate < 20) score -= 10;

  if (remainingBalance < savingGoal) score -= 15;
  if (remainingBalance < 0) score -= 30;

  score = Math.max(0, Math.min(100, score));

  let statusClass = "low";
  let statusText = "Needs Attention";

  if (score >= 75) {
    statusClass = "good";
    statusText = "Healthy Budget";
  } else if (score >= 45) {
    statusClass = "medium";
    statusText = "Moderate Budget";
  }

  const advice = generateAdvice(income, expenses, totalExpenses, remainingBalance, savingGoal, savingRate, expenseRate);
  const prompt = generateAIPrompt(income, totalExpenses, remainingBalance, savingGoal, savingRate);

  result.className = "";
  result.innerHTML = `
    <div class="score-box">
      <h3>Budget Health Score</h3>
      <div class="score">${score}%</div>
      <span class="status ${statusClass}">${statusText}</span>
    </div>

    <div class="summary-grid">
      <div class="summary-item">
        Income
        <strong>RM ${income.toFixed(2)}</strong>
      </div>
      <div class="summary-item">
        Expenses
        <strong>RM ${totalExpenses.toFixed(2)}</strong>
      </div>
      <div class="summary-item">
        Balance
        <strong>RM ${remainingBalance.toFixed(2)}</strong>
      </div>
    </div>

    <h3>Expense Breakdown</h3>
    ${createBar("Rent / Housing", expenses.rent, income)}
    ${createBar("Food & Groceries", expenses.food, income)}
    ${createBar("Transport", expenses.transport, income)}
    ${createBar("Bills & Utilities", expenses.bills, income)}
    ${createBar("Entertainment", expenses.entertainment, income)}
    ${createBar("Others", expenses.others, income)}

    <div class="advice-box">
      <h3>AI-Style Financial Advice</h3>
      <ul>
        ${advice.map(item => `<li>${item}</li>`).join("")}
      </ul>
    </div>

    <div class="warning-box">
      <h3>Savings Goal Progress</h3>
      <p>Your current estimated monthly balance is <strong>RM ${remainingBalance.toFixed(2)}</strong>.</p>
      <p>Saving goal progress: <strong>${goalProgress}%</strong></p>
    </div>

    <h3>AI Prompt for Deeper Financial Planning</h3>
    <div class="ai-prompt">${prompt}</div>
  `;

  saveHistory(score, income, totalExpenses, remainingBalance);
  displayHistory();
}

function createBar(label, value, income) {
  const percentage = income > 0 ? Math.min(100, Math.round((value / income) * 100)) : 0;

  return `
    <div class="bar-wrapper">
      <div class="bar-label">
        <span>${label}</span>
        <span>RM ${value.toFixed(2)} (${percentage}%)</span>
      </div>
      <div class="bar-bg">
        <div class="bar-fill" style="width: ${percentage}%"></div>
      </div>
    </div>
  `;
}

function generateAdvice(income, expenses, totalExpenses, balance, savingGoal, savingRate, expenseRate) {
  const advice = [];

  if (balance < 0) {
    advice.push("Your expenses are higher than your income. Reduce non-essential spending immediately.");
  }

  if (savingRate >= 20) {
    advice.push("Your saving rate is strong. Continue maintaining at least 20% savings if possible.");
  } else if (savingRate >= 10) {
    advice.push("Your saving rate is acceptable, but you can improve it by reducing lifestyle spending.");
  } else {
    advice.push("Your saving rate is low. Try to save at least 10% to 20% of your income monthly.");
  }

  if (expenseRate > 70) {
    advice.push("Your expenses are using more than 70% of your income. Review fixed and lifestyle expenses.");
  }

  if (expenses.entertainment > income * 0.15) {
    advice.push("Entertainment and lifestyle spending is relatively high. Consider setting a monthly lifestyle limit.");
  }

  if (expenses.food > income * 0.25) {
    advice.push("Food spending is quite high. Meal planning or reducing frequent eating out may help.");
  }

  if (savingGoal > 0 && balance < savingGoal) {
    advice.push("Your current balance is below your saving goal. Reduce expenses or adjust your goal temporarily.");
  }

  advice.push("Track your spending weekly instead of only reviewing at the end of the month.");
  advice.push("Build an emergency fund before increasing luxury or lifestyle spending.");

  return advice;
}

function generateAIPrompt(income, totalExpenses, balance, savingGoal, savingRate) {
  return `Act as a personal finance coach. My monthly income is RM ${income}, total expenses are RM ${totalExpenses}, remaining balance is RM ${balance}, monthly saving goal is RM ${savingGoal}, and saving rate is ${savingRate}%. Please create a practical monthly budget plan, identify expenses I should reduce, and suggest a realistic saving strategy.`;
}

function saveHistory(score, income, expenses, balance) {
  const history = JSON.parse(localStorage.getItem("financeCoachHistory")) || [];

  history.unshift({
    score,
    income,
    expenses,
    balance,
    date: new Date().toLocaleString()
  });

  localStorage.setItem("financeCoachHistory", JSON.stringify(history.slice(0, 5)));
}

function displayHistory() {
  const historyBox = document.getElementById("history");
  const history = JSON.parse(localStorage.getItem("financeCoachHistory")) || [];

  if (history.length === 0) {
    historyBox.innerHTML = "<p>No analysis history yet.</p>";
    return;
  }

  historyBox.innerHTML = history.map(item => `
    <div class="history-item">
      <strong>Budget Score: ${item.score}%</strong>
      <p>Income: RM ${item.income.toFixed(2)} | Expenses: RM ${item.expenses.toFixed(2)} | Balance: RM ${item.balance.toFixed(2)}</p>
      <small>${item.date}</small>
    </div>
  `).join("");
}

function clearHistory() {
  localStorage.removeItem("financeCoachHistory");
  displayHistory();
}

function loadDemo() {
  document.getElementById("income").value = 3200;
  document.getElementById("rent").value = 700;
  document.getElementById("food").value = 600;
  document.getElementById("transport").value = 250;
  document.getElementById("bills").value = 280;
  document.getElementById("entertainment").value = 300;
  document.getElementById("others").value = 200;
  document.getElementById("savingGoal").value = 500;
}

displayHistory();
