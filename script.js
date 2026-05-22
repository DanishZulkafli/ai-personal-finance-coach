function generatePlan() {
  const taskName = document.getElementById("taskName").value.trim();
  const priority = document.getElementById("priority").value;
  const duration = parseInt(document.getElementById("duration").value);
  const result = document.getElementById("result");

  if (taskName === "") {
    result.classList.remove("hidden");
    result.innerHTML = `
      <h2>Please enter a study task</h2>
      <p>Example: Revise HTML forms, practice Python loops, or prepare presentation slides.</p>
    `;
    return;
  }

  let focusMode = "";
  let breakTime = "";
  let strategy = "";

  if (duration === 25) {
    focusMode = "Pomodoro Sprint";
    breakTime = "5 minutes break";
  } else if (duration === 45) {
    focusMode = "Deep Focus Session";
    breakTime = "10 minutes break";
  } else if (duration === 60) {
    focusMode = "Balanced Study Session";
    breakTime = "10 to 15 minutes break";
  } else {
    focusMode = "Extended Focus Session";
    breakTime = "15 to 20 minutes break";
  }

  if (priority === "High") {
    strategy = "Start with this task first and remove distractions. Focus on completing the most important part before moving to other tasks.";
  } else if (priority === "Medium") {
    strategy = "Schedule this task after your highest priority work. Focus on steady progress and summarize your learning after the session.";
  } else {
    strategy = "Use this task as a light study session. It is suitable for revision, reading, or organizing notes.";
  }

  result.classList.remove("hidden");
  result.innerHTML = `
    <span class="badge">${priority} Priority</span>
    <h2>${taskName}</h2>
    <p><strong>Recommended Mode:</strong> ${focusMode}</p>
    <p><strong>Study Duration:</strong> ${duration} minutes</p>
    <p><strong>Break Suggestion:</strong> ${breakTime}</p>
    <p><strong>Study Strategy:</strong> ${strategy}</p>

    <h3>Suggested Plan</h3>
    <ol>
      <li>Prepare your notes and remove distractions.</li>
      <li>Focus only on this task for ${duration} minutes.</li>
      <li>Write down 3 key points you learned.</li>
      <li>Take a short break before continuing.</li>
    </ol>
  `;
}
