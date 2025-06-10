document.addEventListener('DOMContentLoaded', () => {
  Papa.parse('2024_output.csv', {
    download: true,
    header: true,
    complete: results => {
      const data = results.data;

      // Build the new structure: { eventName: { conference1: listData, conference2: listData, ... } }
      const eventDataByEvent = {};

      // Get all keys except 'events' and 'scores' for conference names
      const conferenceKeys = Object.keys(data[0]).filter(k => k !== 'events' && k !== 'scores');

      data.forEach(row => {
        const eventName = row.events;
        eventDataByEvent[eventName] = {};

        conferenceKeys.forEach(conf => {
          // Assuming your list data is a string like "[1, 2, 3]"
          // You might want to parse it into an actual array:
          let listData;
          try {
            listData = JSON.parse(row[conf]);
          } catch {
            // fallback: keep original string if parsing fails
            listData = row[conf];
          }

          eventDataByEvent[eventName][conf] = listData;
        });
      });

      // Now eventDataByEvent looks like:
      // {
      //   "100m": { "Big_Ten": [1079, 1034, ...], "SEC": [...], ... },
      //   "200m": { "Big_Ten": [...], "SEC": [...], ... },
      //   ...
      // }

      // Use eventDataByEvent going forward:
      window.eventData = eventDataByEvent;

      

      // Render checkboxes: events as keys of eventDataByEvent
      const events = Object.keys(eventDataByEvent);
      renderCheckboxes('event', events, 'event-container');

      // Conferences from keys of the first event object
      const conferences = Object.keys(eventDataByEvent[events[0]] || {});
      renderCheckboxes('category', conferences, 'category-container');

      // Score keys, if relevant, from original data
      const scoreKeys = Object.keys(data[0]).filter(k => k.startsWith('score_'));
      window.scoreKeys = scoreKeys;

      updateConfPlot();
      updateEventPlot();
    }
  });
});




function renderCheckboxes(name, items, containerId) {
  const container = document.getElementById(containerId);
  container.innerHTML = '';
  items.forEach(item => {
    const label = document.createElement('label');
    label.innerHTML = `
      <input type="checkbox" name="${name}" value="${item}" checked> ${item}
    `;
    container.appendChild(label);
    container.appendChild(document.createElement('br'));
  });
}

function toggleAll(type, checked) {
  document.querySelectorAll(`input[name="${type}"]`).forEach(cb => cb.checked = checked);
}

function getChecked(name) {
  return Array.from(document.querySelectorAll(`input[name="${name}"]:checked`)).map(cb => cb.value);
}

function updateConfPlot() {
  const selectedConfs = getChecked('category'); // Selected conferences
  const data = window.eventData; // Your nested JSON: { event1: { con1: [...], con2: [...] }, event2: {...} }
  const topN = +document.getElementById('conf-number').value || 10;

  // Gather all events (keys)
  const events = Object.keys(data);

  const traces = [];

  for (const conf of selectedConfs) {
    const avgScores = [];

    for (const event of events) {
      const scores = data[event][conf];
      if (scores && Array.isArray(scores) && scores.length > 0) {
        // Take top n scores (assuming scores are sorted descending)
        const topScores = scores.slice(0, topN);
        const avg = topScores.reduce((a, b) => a + b, 0) / topScores.length;
        avgScores.push(avg);
      } else {
        avgScores.push(null);
      }
    }

    traces.push({
      x: events,
      y: avgScores,
      mode: 'lines+markers',
      name: conf
    });
  }

  Plotly.newPlot('conferencePlot', traces, {
    title: `Average Top ${topN} Scores per Event by Conference`,
    xaxis: { title: 'Event' },
    yaxis: { title: 'Average Score' }
  });
}


function updateEventPlot() {const selectedEvents = getChecked('event'); // e.g., ['event1', 'event2']
const data = window.eventData; // Nested JSON: event -> conference -> array of numbers

const n = parseInt(document.getElementById('event-number').value); // number of values to average
if (isNaN(n) || n <= 0) {
  alert("Please enter a valid positive number.");
  return;
}

const sortEventKey = document.getElementById('sort-event').value; // Event key to sort by
if (!sortEventKey || !data[sortEventKey]) {
  alert("Please enter a valid event to sort by.");
  return;
}

const conSet = new Set();

// Step 1: Collect all unique conference keys from all selected events
for (const eventKey of selectedEvents) {
  const event = data[eventKey];
  if (!event) continue;
  for (const conKey in event) {
    conSet.add(conKey);
  }
}

let allConKeys = Array.from(conSet);

// Step 2: Compute average values for the sorting event, per conference
const sortEventData = data[sortEventKey];
const averagesForSortEvent = allConKeys.map(conKey => {
  const values = sortEventData[conKey];
  if (Array.isArray(values) && values.length > 0) {
    const limited = values.slice(0, n);
    const avg = limited.reduce((a, b) => a + b, 0) / limited.length;
    return { conKey, avg };
  }
  return { conKey, avg: -Infinity }; // treat missing as very low so they go last
});

// Step 3: Sort conferences by avg descending (or ascending, adjust as needed)
averagesForSortEvent.sort((a, b) => b.avg - a.avg);
allConKeys = averagesForSortEvent.map(item => item.conKey);

// Step 4: Build traces with conferences in sorted order
const traces = [];

for (const eventKey of selectedEvents) {
  const event = data[eventKey];
  if (!event) continue;

  const y = [];

  for (const conKey of allConKeys) {
    const values = event[conKey];
    if (Array.isArray(values) && values.length > 0) {
      const limited = values.slice(0, n);
      const avg = limited.reduce((a, b) => a + b, 0) / limited.length;
      y.push(avg);
    } else {
      y.push(null);
    }
  }

  traces.push({
    x: allConKeys,
    y,
    type: 'scatter',
    mode: 'lines+markers',
    name: eventKey
  });
}

// Step 5: Plot
Plotly.newPlot('eventPlot', traces, {
  title: `Top ${n} Values per Event per Confrence`,
  xaxis: { title: 'Conference' },
  yaxis: { title: 'Average Score' }
})};
