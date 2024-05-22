document.getElementById('algorithm').addEventListener('change', function() {
  const quantumLabel = document.getElementById('quantumLabel');
  if (this.value === 'RR') {
      quantumLabel.style.display = 'block';
  } else {
      quantumLabel.style.display = 'none';
  }
});

document.getElementById('solveButton').addEventListener('click', function() {
  const algorithm = document.getElementById('algorithm').value;
  const arrivalTimes = document.getElementById('arrivalTimes').value.split(' ').map(Number);
  const burstTimes = document.getElementById('burstTimes').value.split(' ').map(Number);
  const quantum = parseInt(document.getElementById('quantum').value);

  let processes = arrivalTimes.map((arrivalTime, index) => ({
      pid: String.fromCharCode(65 + index),
      arrivalTime: arrivalTime,
      burstTime: burstTimes[index],
      waitingTime: 0,
      turnaroundTime: 0,
      finishTime: 0
  }));

  let ganttChartInfo = [];
  if (algorithm === 'FCFS') {
      ganttChartInfo = fcfsScheduling(processes);
  } else if (algorithm === 'SJF') {
      ganttChartInfo = sjfScheduling(processes);
  } else if (algorithm === 'RR') {
      const result = rrScheduling(processes, quantum);
      processes = result.solvedProcessesInfo;
      ganttChartInfo = result.ganttChartInfo;
  }

  displayResults(processes);
  displayGanttChart(ganttChartInfo);
});

function fcfsScheduling(processes) {
  processes.sort((a, b) => a.arrivalTime - b.arrivalTime);
  let currentTime = 0;
  const ganttChart = [];

  processes.forEach(process => {
      if (currentTime < process.arrivalTime) {
          currentTime = process.arrivalTime;
      }
      process.waitingTime = currentTime - process.arrivalTime;
      process.finishTime = currentTime + process.burstTime;
      process.turnaroundTime = process.finishTime - process.arrivalTime;
      ganttChart.push({ job: process.pid, start: currentTime, stop: process.finishTime });
      currentTime = process.finishTime;
  });

  return ganttChart;
}

function sjfScheduling(processes) {
  processes.sort((a, b) => a.arrivalTime - b.arrivalTime);
  let currentTime = 0, completed = 0;
  const ganttChart = [];

  while (completed < processes.length) {
      const readyQueue = processes.filter(p => p.arrivalTime <= currentTime && p.finishTime === 0);
      if (readyQueue.length > 0) {
          readyQueue.sort((a, b) => a.burstTime - b.burstTime);
          const process = readyQueue[0];
          ganttChart.push({ job: process.pid, start: currentTime, stop: currentTime + process.burstTime });
          process.waitingTime = currentTime - process.arrivalTime;
          process.finishTime = currentTime + process.burstTime;
          process.turnaroundTime = process.finishTime - process.arrivalTime;
          currentTime = process.finishTime;
          completed++;
      } else {
          currentTime++;
      }
  }

  return ganttChart;
}

function rrScheduling(processes, quantum) {
  processes.sort((a, b) => a.arrivalTime - b.arrivalTime);  // Sắp xếp theo arrival time
  const queue = [];
  const ganttChart = [];
  const remainingBurstTimes = processes.map(p => p.burstTime);
  let currentTime = 0;
  let index = 0;

  while (processes.some(p => p.finishTime === 0)) {
      // Thêm tất cả các tiến trình đã đến vào hàng đợi
      while (index < processes.length && processes[index].arrivalTime <= currentTime) {
          queue.push(processes[index]);
          index++;
      }

      if (queue.length > 0) {
          const process = queue.shift();  // Lấy tiến trình đầu tiên ra khỏi hàng đợi
          const processIndex = processes.indexOf(process);
          if (remainingBurstTimes[processIndex] > quantum) {
              ganttChart.push({ job: process.pid, start: currentTime, stop: currentTime + quantum });
              remainingBurstTimes[processIndex] -= quantum;
              currentTime += quantum;
              // Thêm tất cả các tiến trình đã đến vào hàng đợi
              while (index < processes.length && processes[index].arrivalTime <= currentTime) {
                  queue.push(processes[index]);
                  index++;
              }
              queue.push(process);  // Thêm lại tiến trình vào cuối hàng đợi
          } else {
              ganttChart.push({ job: process.pid, start: currentTime, stop: currentTime + remainingBurstTimes[processIndex] });
              currentTime += remainingBurstTimes[processIndex];
              process.finishTime = currentTime;
              process.turnaroundTime = process.finishTime - process.arrivalTime;
              process.waitingTime = process.turnaroundTime - process.burstTime;
              remainingBurstTimes[processIndex] = 0;
          }
      } else {
          currentTime++;
      }
  }

  return { solvedProcessesInfo: processes, ganttChartInfo: ganttChart };
}

function displayResults(processes) {
  const resultsTableBody = document.querySelector('#resultsTable tbody');
  resultsTableBody.innerHTML = '';
  let totalTurnaroundTime = 0, totalWaitingTime = 0;

  processes.forEach(process => {
      const row = resultsTableBody.insertRow();
      row.insertCell().innerText = process.pid;
      row.insertCell().innerText = process.arrivalTime;
      row.insertCell().innerText = process.burstTime;
      row.insertCell().innerText = process.finishTime;
      row.insertCell().innerText = process.turnaroundTime;
      row.insertCell().innerText = process.waitingTime;

      totalTurnaroundTime += process.turnaroundTime;
      totalWaitingTime += process.waitingTime;
  });

  document.getElementById('avgTurnaroundTime').innerText = (totalTurnaroundTime / processes.length).toFixed(2);
  document.getElementById('avgWaitingTime').innerText = (totalWaitingTime / processes.length).toFixed(2);
}

function displayGanttChart(ganttChartInfo) {
  const ganttChart = document.getElementById('ganttChart');
  ganttChart.innerHTML = '';

  ganttChartInfo.forEach(item => {
      const bar = document.createElement('div');
      bar.classList.add('gantt-bar');
      bar.style.width = `${(item.stop - item.start) * 20}px`;
      bar.style.backgroundColor = getRandomColor();
      bar.innerText = item.job;

      const timeLabelStart = document.createElement('div');
      timeLabelStart.innerText = item.start;
      timeLabelStart.style.marginRight = '5px';

      ganttChart.appendChild(timeLabelStart);
      ganttChart.appendChild(bar);
  });

  const timeLabelEnd = document.createElement('div');
  timeLabelEnd.innerText = ganttChartInfo[ganttChartInfo.length - 1].stop;
  ganttChart.appendChild(timeLabelEnd);
}

function getRandomColor() {
  const letters = '0123456789ABCDEF';
  let color = '#';
  for (let i = 0; i < 6; i++) {
      color += letters[Math.floor(Math.random() * 16)];
  }
  return color;
}