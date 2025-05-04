// Function to fit the layout on window screen
function fitLayoutToWindow() {
  const container = document.querySelector('.container');
  const header = document.querySelector('header');
  const footer = document.querySelector('footer');

  const windowHeight = window.innerHeight;
  const headerHeight = header.offsetHeight;
  const footerHeight = footer.offsetHeight;
  const availableHeight = windowHeight - headerHeight - footerHeight;

  container.style.height = `${availableHeight}px`;
}

// Call the fitLayoutToWindow function initially
fitLayoutToWindow();

// Call the fitLayoutToWindow function on window resize
window.addEventListener('resize', fitLayoutToWindow);

// Get current time and date for Colorado
function getColoradoTime() {
  const options = { timeZone: 'America/Denver' };
  const currentTime = new Date().toLocaleTimeString('en-US', options);
  const currentDate = new Date().toLocaleDateString('en-US', options);

  return `${currentTime}, ${currentDate}`;
}

// Update the time display element
function updateTime() {
  const coloradoTimeElement = document.getElementById('colorado-time');
  coloradoTimeElement.textContent = getColoradoTime();
}

// Get current time and date for a specific time zone
function getTimeAndDate(timeZone) {
  const options = { timeZone };
  const currentTime = new Date().toLocaleTimeString('en-US', options);

  return `${currentTime}`;
}

// Update the time display element for a specific market
function updateMarketTime(market, elementId, timeZone) {
  const marketTimeElement = document.getElementById(elementId);
  marketTimeElement.textContent = `${market}: ${getTimeAndDate(timeZone)}`;
}

// Update market times
function updateMarketTimes() {
  // London - United Kingdom
  updateMarketTime('London', 'london-time', 'Europe/London');

  // Tokyo - Japan
  updateMarketTime('Tokyo', 'tokyo-time', 'Asia/Tokyo');

  // Sydney - Australia
  updateMarketTime('Sydney', 'sydney-time', 'Australia/Sydney');

  // Frankfurt - Germany
  updateMarketTime('Frankfurt', 'frankfurt-time', 'Europe/Berlin');

  // Hong Kong - China
  updateMarketTime('Hong Kong', 'hongkong-time', 'Asia/Hong_Kong');
}

// Update market times initially
updateMarketTimes();

// Update market times every second
setInterval(updateMarketTimes, 1000);

// Update time every second
setInterval(updateTime, 1000);

// Generate the calendar
function generateCalendar() {
  // Get current date
  const today = new Date();
  const currentYear = today.getFullYear();
  const currentMonth = today.getMonth();
  const currentDate = today.getDate();

  // Get the calendar body element
  const calendarBody = document.getElementById('calendar-body');

  // Clear previous calendar data
  calendarBody.innerHTML = '';

  // Create a new date object for the first day of the month
  const firstDayOfMonth = new Date(currentYear, currentMonth, 1);

  // Get the day of the week for the first day
  const startingDay = firstDayOfMonth.getDay();

  // Determine the number of days in the current month
  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();

  // Create calendar rows and cells
  let date = 1;
  for (let i = 0; i < 6; i++) {
    // Create a table row
    const row = document.createElement('tr');

    // Create cells for each day
    for (let j = 0; j < 7; j++) {
      if (i === 0 && j < startingDay) {
        // Create empty cells before the first day of the month
        const cell = document.createElement('td');
        row.appendChild(cell);
      } else if (date > daysInMonth) {
        // Stop creating cells if all days have been displayed
        break;
      } else {
        // Create a cell with the current date
        const cell = document.createElement('td');
        cell.textContent = date;

        if (currentYear === today.getFullYear() && currentMonth === today.getMonth() && date === currentDate) {
          // Highlight the cell if it represents today's date
          cell.classList.add('today');
        }

        row.appendChild(cell);
        date++;
      }
    }

    // Append the row to the calendar body
    calendarBody.appendChild(row);
  }
}


// Generate the calendar when the page loads
generateCalendar();

// Update the calendar every second to show real-time changes
setInterval(generateCalendar, 1000);

// ... [PREVIOUS CODE REMAINS UNCHANGED]

// ... [PREVIOUS CODE FROM YOUR SCRIPT]

let noteCounter = 1;

// Function to add a new note
// ... [PREVIOUS CODE REMAINS UNCHANGED]

// Removed setInterval for calendar generation
// setInterval(generateCalendar, 1000);

// ... [PREVIOUS CODE REMAINS UNCHANGED]

// ... [PREVIOUS CODE REMAINS UNCHANGED]

function addNote() {
  const noteContainer = document.createElement('div');
  noteContainer.classList.add('note');

  const noteHeader = document.createElement('div');
  noteHeader.classList.add('note-header');

  const addButton = document.createElement('button');
  addButton.classList.add('add-note');
  addButton.textContent = '+';
  addButton.onclick = addNote;
  noteHeader.appendChild(addButton);  // Added this before the delete button

  const deleteButton = document.createElement('button');
  deleteButton.classList.add('delete-note');
  deleteButton.textContent = 'x';
  deleteButton.onclick = function() {
    noteContainer.remove();
  };
  noteHeader.appendChild(deleteButton);

  noteContainer.appendChild(noteHeader);

  const textArea = document.createElement('textarea');
  textArea.rows = 10;
  textArea.placeholder = "Write your trade notes here...";
  noteContainer.appendChild(textArea);

  document.getElementById('notes-container').appendChild(noteContainer);
}

// Bind the + button in the initial note to the addNote function
document.querySelector('.note .add-note').addEventListener('click', addNote);

// ... [PREVIOUS CODE REMAINS UNCHANGED]

function addRule() {
  const rulesList = document.getElementById('rules-list');
  const ruleItems = document.querySelectorAll('.rule-item');

  const ruleItem = document.createElement('li');
  ruleItem.classList.add('rule-item');

  const ruleSpan = document.createElement('span');
  ruleSpan.innerHTML = `Rule ${ruleItems.length + 1}: <input type="text" value="[Your trading rule]">`;
  ruleItem.appendChild(ruleSpan);

  const addRuleButton = document.createElement('button');
  addRuleButton.classList.add('add-rule');
  addRuleButton.textContent = '+';
  addRuleButton.onclick = addRule;
  ruleItem.appendChild(addRuleButton);

  const deleteRuleButton = document.createElement('button');
  deleteRuleButton.classList.add('delete-rule');
  deleteRuleButton.textContent = 'x';
  deleteRuleButton.onclick = function() {
    ruleItem.remove();
    updateRuleNumbers();
  };
  ruleItem.appendChild(deleteRuleButton);

  rulesList.appendChild(ruleItem);
}

// After deleting a rule, we need to update the numbers to ensure they're consecutive.
function updateRuleNumbers() {
  const ruleSpans = document.querySelectorAll('.rule-item > span');
  ruleSpans.forEach((span, index) => {
    span.textContent = `Rule ${index + 1}: `;
    const input = document.createElement('input');
    input.type = 'text';
    input.value = '[Your trading rule]';
    span.appendChild(input);
  });
}

// Initial rule's bindings
document.querySelector('.rule-item .add-rule').addEventListener('click', addRule);
document.querySelector('.rule-item .delete-rule').addEventListener('click', function() {
  this.parentElement.remove();
  updateRuleNumbers();
});

// ... [PREVIOUS CODE REMAINS UNCHANGED]



