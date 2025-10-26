// Data storage with localStorage persistence
var students = [];
var rooms = [];
var exams = [];
var allocations = [];
var currentExamSession = null;

// Initialize data from localStorage
function initializeData() {
  try {
    students = JSON.parse(localStorage.getItem("examPlanner_students")) || [];
    rooms = JSON.parse(localStorage.getItem("examPlanner_rooms")) || [];
    exams = JSON.parse(localStorage.getItem("examPlanner_exams")) || [];
    allocations =
      JSON.parse(localStorage.getItem("examPlanner_allocations")) || [];
    console.log("✅ Data initialized from localStorage");
  } catch (error) {
    console.error("Error loading data:", error);
    students = [];
    rooms = [];
    exams = [];
    allocations = [];
  }
}

// Call initialization immediately
initializeData();

// Save data to localStorage
function saveToLocalStorage() {
  localStorage.setItem("examPlanner_students", JSON.stringify(students));
  localStorage.setItem("examPlanner_rooms", JSON.stringify(rooms));
  localStorage.setItem("examPlanner_exams", JSON.stringify(exams));
  localStorage.setItem("examPlanner_allocations", JSON.stringify(allocations));
  updateDataManagerStats();
}

// Clear all data
function clearAllData() {
  if (
    confirm(
      "⚠️ Are you sure you want to clear ALL data? This cannot be undone!"
    )
  ) {
    localStorage.clear();
    students = [];
    rooms = [];
    exams = [];
    allocations = [];
    renderStudents();
    renderRooms();
    renderExams();
    updateExamDropdown();
    updateDataManagerStats();
    document.getElementById("resultsContent").innerHTML = `
                    <div class="empty-state">
                        <div class="empty-state-icon">🎯</div>
                        <div>Generate seating arrangement first</div>
                    </div>
                `;
    alert("✅ All data cleared successfully!");
  }
}

// Export data as JSON file
function exportData() {
  const data = {
    students,
    rooms,
    exams,
    allocations,
    exportDate: new Date().toISOString(),
  };
  const dataStr = JSON.stringify(data, null, 2);
  const dataBlob = new Blob([dataStr], { type: "application/json" });
  const url = URL.createObjectURL(dataBlob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `exam_planner_backup_${
    new Date().toISOString().split("T")[0]
  }.json`;
  link.click();
  URL.revokeObjectURL(url);
  alert("✅ Data exported successfully!");
}

// Import data from JSON file
function importData(event) {
  const file = event.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = function (e) {
    try {
      const data = JSON.parse(e.target.result);

      if (confirm("⚠️ This will replace all current data. Continue?")) {
        students = data.students || [];
        rooms = data.rooms || [];
        exams = data.exams || [];
        allocations = data.allocations || [];

        saveToLocalStorage();
        renderStudents();
        renderRooms();
        renderExams();
        updateExamDropdown();
        updateDataManagerStats();

        alert(
          `✅ Data imported successfully!\n\nStudents: ${students.length}\nRooms: ${rooms.length}\nExams: ${exams.length}`
        );
      }
    } catch (error) {
      alert("❌ Error importing data. Please check the file format.");
    }
  };
  reader.readAsText(file);
  event.target.value = "";
}

// Tab switching
function switchTab(tabName) {
  document
    .querySelectorAll(".tab")
    .forEach((tab) => tab.classList.remove("active"));
  document
    .querySelectorAll(".tab-content")
    .forEach((content) => content.classList.remove("active"));

  event.target.classList.add("active");
  document.getElementById(tabName).classList.add("active");
}

// Student Management
function addStudent() {
  const rollNo = document.getElementById("rollNo").value.trim();
  const name = document.getElementById("studentName").value.trim();
  const dept = document.getElementById("department").value;
  const subjectsInput = document.getElementById("subjects").value.trim();

  if (!rollNo || !name || !subjectsInput) {
    showAlert("studentAlert", "Please fill all fields", "error");
    return;
  }

  const subjects = subjectsInput
    .split(",")
    .map((s) => s.trim())
    .filter((s) => s);

  students.push({
    rollNo,
    name,
    department: dept,
    subjects,
  });

  saveToLocalStorage();

  document.getElementById("rollNo").value = "";
  document.getElementById("studentName").value = "";
  document.getElementById("subjects").value = "";

  showAlert("studentAlert", `Student ${name} added successfully!`, "success");
  renderStudents();
}

function renderStudents() {
  const tbody = document.getElementById("studentTableBody");

  if (students.length === 0) {
    tbody.innerHTML = `<tr><td colspan="5" class="empty-state">
                    <div class="empty-state-icon">📚</div>
                    <div>No students added yet</div>
                </td></tr>`;
    return;
  }

  tbody.innerHTML = students
    .map(
      (student, index) => `
                <tr>
                    <td>${student.rollNo}</td>
                    <td>${student.name}</td>
                    <td>${student.department}</td>
                    <td>${student.subjects.join(", ")}</td>
                    <td><button class="btn btn-danger" onclick="deleteStudent(${index})">Delete</button></td>
                </tr>
            `
    )
    .join("");
}

function deleteStudent(index) {
  students.splice(index, 1);
  saveToLocalStorage();
  renderStudents();
}

// CSV Import Function
function importCSV(event) {
  try {
    const file = event.target.files[0];
    if (!file) {
      console.warn("No file selected");
      return;
    }

    const reader = new FileReader();
    reader.onload = function (e) {
      try {
        const text = e.target.result;
        if (!text || text.trim() === "") {
          showAlert("studentAlert", "❌ CSV file is empty", "error");
          return;
        }
        parseCSV(text);
      } catch (err) {
        console.error("Error reading file:", err);
        showAlert(
          "studentAlert",
          `❌ Error reading file: ${err.message}`,
          "error"
        );
      }
    };
    reader.onerror = function () {
      showAlert("studentAlert", "❌ Error reading file", "error");
    };
    reader.readAsText(file);
  } catch (error) {
    console.error("Import error:", error);
    showAlert("studentAlert", `❌ Error: ${error.message}`, "error");
  }
}

function parseCSV(text) {
  try {
    const lines = text.split("\n").filter((line) => line.trim());
    let importCount = 0;
    let skipCount = 0;

    if (lines.length === 0) {
      showAlert("studentAlert", "❌ CSV file is empty", "error");
      return;
    }

    console.log("Parsing CSV with", lines.length, "lines");

    // Skip header if it exists (check if first line contains "Roll" or "Name")
    const startIndex =
      lines[0].toLowerCase().includes("roll") ||
      lines[0].toLowerCase().includes("name")
        ? 1
        : 0;

    // Validate data type - Check if this looks like room or exam data
    const firstDataLine = lines[startIndex]
      ? lines[startIndex].toLowerCase()
      : "";
    if (firstDataLine.includes("room") || firstDataLine.match(/r\d+/)) {
      showAlert(
        "studentAlert",
        "❌ Invalid data! This appears to be ROOM data. Please use the Room CSV import button.",
        "error"
      );
      document.getElementById("csvFileInput").value = "";
      return;
    }
    if (
      firstDataLine.match(/\d{4}-\d{2}-\d{2}/) ||
      firstDataLine.match(/\d{2}:\d{2}/)
    ) {
      showAlert(
        "studentAlert",
        "❌ Invalid data! This appears to be EXAM data. Please use the Exam Sessions CSV import button.",
        "error"
      );
      document.getElementById("csvFileInput").value = "";
      return;
    }

    for (let i = startIndex; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;

      // Split by comma, handling potential spaces
      const parts = line.split(",").map((p) => p.trim());

      if (parts.length < 4) {
        console.warn(`Line ${i + 1}: Not enough columns (${parts.length}/4)`);
        skipCount++;
        continue;
      }

      const rollNo = parts[0];
      const name = parts[1];
      const department = parts[2];
      const subjectsStr = parts[3];

      // Validate required fields
      if (!rollNo || !name || !department || !subjectsStr) {
        console.warn(`Line ${i + 1}: Missing required fields`);
        skipCount++;
        continue;
      }

      // Check if student already exists
      const exists = students.some((s) => s.rollNo === rollNo);
      if (exists) {
        console.warn(`Line ${i + 1}: Duplicate roll number ${rollNo}`);
        skipCount++;
        continue;
      }

      // Parse subjects (handle both semicolon and comma separation)
      let subjects = [];
      if (subjectsStr.includes(";")) {
        subjects = subjectsStr
          .split(";")
          .map((s) => s.trim())
          .filter((s) => s);
      } else {
        subjects = [subjectsStr.trim()];
      }

      students.push({
        rollNo,
        name,
        department,
        subjects,
      });

      importCount++;
    }

    saveToLocalStorage();
    renderStudents();

    let message = `✅ Successfully imported ${importCount} student(s)`;
    if (skipCount > 0) {
      message += `. Skipped ${skipCount} duplicate(s) or invalid row(s)`;
    }
    showAlert("studentAlert", message, "success");

    // Reset file input
    document.getElementById("csvFileInput").value = "";

    console.log("Import complete:", importCount, "students added");
  } catch (error) {
    console.error("CSV Parse Error:", error);
    showAlert(
      "studentAlert",
      `❌ Error parsing CSV: ${error.message}`,
      "error"
    );
  }
}

// Room Management
function addRoom() {
  const roomId = document.getElementById("roomId").value.trim();
  const name = document.getElementById("roomName").value.trim();
  const capacity = parseInt(document.getElementById("capacity").value);
  const rowCount = parseInt(document.getElementById("rows").value);
  const seatsPerRow = parseInt(document.getElementById("seatsPerRow").value);

  if (!roomId || !name || !capacity || !rowCount || !seatsPerRow) {
    showAlert("roomAlert", "Please fill all fields", "error");
    return;
  }

  rooms.push({
    roomId,
    name,
    capacity,
    rows: rowCount,
    seatsPerRow,
  });

  saveToLocalStorage();

  document.getElementById("roomId").value = "";
  document.getElementById("roomName").value = "";
  document.getElementById("capacity").value = "";
  document.getElementById("rows").value = "";
  document.getElementById("seatsPerRow").value = "";

  saveToLocalStorage();
  showAlert("roomAlert", `Room ${name} added successfully!`, "success");
  renderRooms();
}

function renderRooms() {
  const tbody = document.getElementById("roomTableBody");

  if (rooms.length === 0) {
    tbody.innerHTML = `<tr><td colspan="5" class="empty-state">
                    <div class="empty-state-icon">🏛️</div>
                    <div>No rooms configured yet</div>
                </td></tr>`;
    return;
  }

  tbody.innerHTML = rooms
    .map(
      (room, index) => `
                <tr>
                    <td>${room.roomId}</td>
                    <td>${room.name}</td>
                    <td>${room.capacity}</td>
                    <td>${room.rows} × ${room.seatsPerRow}</td>
                    <td><button class="btn btn-danger" onclick="deleteRoom(${index})">Delete</button></td>
                </tr>
            `
    )
    .join("");
}

function deleteRoom(index) {
  rooms.splice(index, 1);
  saveToLocalStorage();
  renderRooms();
}

// Room CSV Import Function
function importRoomCSV(event) {
  const file = event.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = function (e) {
    const text = e.target.result;
    parseRoomCSV(text);
  };
  reader.readAsText(file);
}

function parseRoomCSV(text) {
  try {
    const lines = text.split("\n").filter((line) => line.trim());
    let importCount = 0;
    let skipCount = 0;

    if (lines.length === 0) {
      showAlert("roomAlert", "❌ CSV file is empty", "error");
      return;
    }

    // Skip header if it exists
    const startIndex =
      lines[0].toLowerCase().includes("room") ||
      lines[0].toLowerCase().includes("capacity")
        ? 1
        : 0;

    // Validate data type - Check if this looks like student or exam data
    const firstDataLine = lines[startIndex]
      ? lines[startIndex].toLowerCase()
      : "";
    if (
      firstDataLine.match(/\d{2}[a-z]{2,4}\d{3}/) ||
      (firstDataLine.split(",").length === 4 &&
        !firstDataLine.match(/\d{4}-\d{2}-\d{2}/))
    ) {
      showAlert(
        "roomAlert",
        "❌ Invalid data! This appears to be STUDENT data. Please use the Student CSV import button.",
        "error"
      );
      document.getElementById("roomCsvInput").value = "";
      return;
    }
    if (
      firstDataLine.match(/\d{4}-\d{2}-\d{2}/) ||
      firstDataLine.match(/\d{2}:\d{2}/)
    ) {
      showAlert(
        "roomAlert",
        "❌ Invalid data! This appears to be EXAM data. Please use the Exam Sessions CSV import button.",
        "error"
      );
      document.getElementById("roomCsvInput").value = "";
      return;
    }

    for (let i = startIndex; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;

      const parts = line.split(",").map((p) => p.trim());

      if (parts.length < 5) {
        console.warn(`Line ${i + 1}: Not enough columns (${parts.length}/5)`);
        skipCount++;
        continue;
      }

      const roomId = parts[0];
      const name = parts[1];
      const capacity = parseInt(parts[2]);
      const rowCount = parseInt(parts[3]);
      const seatsPerRow = parseInt(parts[4]);

      // Validate data
      if (
        !roomId ||
        !name ||
        isNaN(capacity) ||
        isNaN(rowCount) ||
        isNaN(seatsPerRow)
      ) {
        console.warn(`Line ${i + 1}: Invalid data`);
        skipCount++;
        continue;
      }

      // Check for duplicates
      const exists = rooms.some((r) => r.roomId === roomId);

      if (exists) {
        console.warn(`Line ${i + 1}: Duplicate room ID ${roomId}`);
        skipCount++;
        continue;
      }

      rooms.push({
        roomId,
        name,
        capacity,
        rows: rowCount,
        seatsPerRow,
      });

      importCount++;
    }

    saveToLocalStorage();
    renderRooms();

    let message = `✅ Successfully imported ${importCount} room(s)`;
    if (skipCount > 0) {
      message += `. Skipped ${skipCount} duplicate(s) or invalid row(s)`;
    }
    showAlert("roomAlert", message, "success");

    // Reset file input
    document.getElementById("roomCsvInput").value = "";
  } catch (error) {
    console.error("CSV Parse Error:", error);
    showAlert("roomAlert", `❌ Error parsing CSV: ${error.message}`, "error");
  }
}

// Exam Management
function addExam() {
  const subject = document.getElementById("examSubject").value.trim();
  const subjectName = document.getElementById("examSubjectName").value.trim();
  const date = document.getElementById("examDate").value;
  const time = document.getElementById("examTime").value;

  if (!subject || !subjectName || !date || !time) {
    showAlert("examAlert", "Please fill all fields", "error");
    return;
  }

  const examId = "EX" + Date.now();
  exams.push({
    examId,
    subject,
    subjectName,
    date,
    time,
  });

  saveToLocalStorage();

  document.getElementById("examSubject").value = "";
  document.getElementById("examSubjectName").value = "";
  document.getElementById("examDate").value = "";
  document.getElementById("examTime").value = "";

  saveToLocalStorage();
  showAlert("examAlert", `Exam session for ${subjectName} created!`, "success");
  renderExams();
  updateExamDropdown();
}

function renderExams() {
  const tbody = document.getElementById("examTableBody");

  if (exams.length === 0) {
    tbody.innerHTML = `<tr><td colspan="5" class="empty-state">
                    <div class="empty-state-icon">📝</div>
                    <div>No exams scheduled yet</div>
                </td></tr>`;
    return;
  }

  tbody.innerHTML = exams
    .map(
      (exam, index) => `
                <tr>
                    <td>${exam.subject}</td>
                    <td>${exam.subjectName}</td>
                    <td>${exam.date}</td>
                    <td>${exam.time}</td>
                    <td><button class="btn btn-danger" onclick="deleteExam(${index})">Delete</button></td>
                </tr>
            `
    )
    .join("");
}

function deleteExam(index) {
  exams.splice(index, 1);
  saveToLocalStorage();
  renderExams();
  updateExamDropdown();
}

// Exam CSV Import Function
function importExamCSV(event) {
  const file = event.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = function (e) {
    const text = e.target.result;
    parseExamCSV(text);
  };
  reader.readAsText(file);
}

function parseExamCSV(text) {
  try {
    const lines = text.split("\n").filter((line) => line.trim());
    let importCount = 0;
    let skipCount = 0;

    if (lines.length === 0) {
      showAlert("examAlert", "❌ CSV file is empty", "error");
      return;
    }

    // Skip header if it exists
    const startIndex =
      lines[0].toLowerCase().includes("subject") ||
      lines[0].toLowerCase().includes("code")
        ? 1
        : 0;

    // Validate data type - Check if this looks like student or room data
    const firstDataLine = lines[startIndex]
      ? lines[startIndex].toLowerCase()
      : "";
    if (firstDataLine.match(/\d{2}[a-z]{2,4}\d{3}/)) {
      showAlert(
        "examAlert",
        "❌ Invalid data! This appears to be STUDENT data. Please use the Student CSV import button.",
        "error"
      );
      document.getElementById("examCsvInput").value = "";
      return;
    }
    if (
      firstDataLine.includes("room") ||
      firstDataLine.match(/r\d+/) ||
      firstDataLine.split(",").length === 5
    ) {
      showAlert(
        "examAlert",
        "❌ Invalid data! This appears to be ROOM data. Please use the Room CSV import button.",
        "error"
      );
      document.getElementById("examCsvInput").value = "";
      return;
    }

    for (let i = startIndex; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;

      const parts = line.split(",").map((p) => p.trim());

      if (parts.length < 4) {
        console.warn(`Line ${i + 1}: Not enough columns (${parts.length}/4)`);
        skipCount++;
        continue;
      }

      const subject = parts[0];
      const subjectName = parts[1];
      const date = parts[2];
      const time = parts[3];

      // Validate data
      if (!subject || !subjectName || !date || !time) {
        console.warn(`Line ${i + 1}: Missing required fields`);
        skipCount++;
        continue;
      }

      // Check for duplicates
      const exists = exams.some(
        (e) => e.subject === subject && e.date === date && e.time === time
      );

      if (exists) {
        console.warn(`Line ${i + 1}: Duplicate exam ${subject}`);
        skipCount++;
        continue;
      }

      const examId = "EX" + Date.now() + "_" + i;
      exams.push({
        examId,
        subject,
        subjectName,
        date,
        time,
      });

      importCount++;
    }

    saveToLocalStorage();
    renderExams();
    updateExamDropdown();

    let message = `✅ Successfully imported ${importCount} exam session(s)`;
    if (skipCount > 0) {
      message += `. Skipped ${skipCount} duplicate(s) or invalid row(s)`;
    }
    showAlert("examAlert", message, "success");

    // Reset file input
    document.getElementById("examCsvInput").value = "";
  } catch (error) {
    console.error("CSV Parse Error:", error);
    showAlert("examAlert", `❌ Error parsing CSV: ${error.message}`, "error");
  }
}

function updateExamDropdown() {
  const select = document.getElementById("selectExamSession");
  select.innerHTML =
    '<option value="">-- Select an exam --</option>' +
    exams
      .map(
        (exam, index) =>
          `<option value="${index}">${exam.subject} - ${exam.subjectName} (${exam.date} ${exam.time})</option>`
      )
      .join("");
}

function generateSeating() {
  const examIndex = document.getElementById("selectExamSession").value;

  if (examIndex === "") {
    showAlert("generateAlert", "Please select an exam session", "error");
    return;
  }

  if (students.length === 0) {
    showAlert("generateAlert", "No students available. Add students first.", "error");
    return;
  }

  if (rooms.length === 0) {
    showAlert("generateAlert", "No rooms available. Add rooms first.", "error");
    return;
  }

  const exam = exams[parseInt(examIndex)];
  currentExamSession = exam;

  // Filter students registered for this subject
  const eligibleStudents = students.filter((student) =>
    student.subjects.includes(exam.subject)
  );

  if (eligibleStudents.length === 0) {
    showAlert(
      "generateAlert",
      `No students registered for ${exam.subject}`,
      "error"
    );
    return;
  }

  // Shuffle students for randomization
  const shuffled = [...eligibleStudents].sort(() => Math.random() - 0.5);

  // Sort rooms by capacity (descending)
  const sortedRooms = [...rooms].sort((a, b) => b.capacity - a.capacity);

  // Calculate total capacity
  const totalCapacity = sortedRooms.reduce(
    (sum, room) => sum + room.capacity,
    0
  );

  if (shuffled.length > totalCapacity) {
    showAlert(
      "generateAlert",
      `⚠️ Not enough capacity! ${shuffled.length} students need seats but only ${totalCapacity} seats available.`,
      "error"
    );
    return;
  }

  allocations = [];
  let studentIndex = 0;
  let roomsUsed = 0;

  for (const room of sortedRooms) {
    if (studentIndex >= shuffled.length) break;
    roomsUsed++;

    // Get the true layout from the room object
    const rows = parseInt(room.rows);        // e.g., 10
    const cols = parseInt(room.seatsPerRow); // e.g., 6

    // Fill seats row by row, col by col (grid-style, not sequential)
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols && studentIndex < shuffled.length; c++) {
        const student = shuffled[studentIndex++];
        const seatLabel = String.fromCharCode(65 + r) + (c + 1); // "A1", "A2", ..., "B1", "C6", etc.
        allocations.push({
          examId: exam.examId,
          examSubject: exam.subject,
          examName: exam.subjectName,
          examDate: exam.date,
          examTime: exam.time,
          roomId: room.roomId,
          roomName: room.name,
          seatNo: seatLabel,
          rollNo: student.rollNo,
          studentName: student.name,
          department: student.department,
        });
      }
    }
  }

  // Debug: show first 10 allocations for verification
  console.log(allocations.slice(0, 10));

  const capacityUtil = ((shuffled.length / totalCapacity) * 100).toFixed(1);
  document.getElementById("statStudents").textContent = shuffled.length;
  document.getElementById("statRooms").textContent = roomsUsed;
  document.getElementById("statCapacity").textContent = capacityUtil + "%";
  document.getElementById("statsCard").style.display = "block";

  saveToLocalStorage();
  showAlert(
    "generateAlert",
    `✅ Seating generated successfully! ${shuffled.length} students distributed across ${roomsUsed} room(s) using grid layout.`,
    "success"
  );
}

function generateAllSeating() {
  if (exams.length === 0) {
    showAlert("generateAlert", "No exams available. Add exam sessions first.", "error");
    return;
  }
  if (students.length === 0) {
    showAlert("generateAlert", "No students available. Add students first.", "error");
    return;
  }
  if (rooms.length === 0) {
    showAlert("generateAlert", "No rooms available. Add rooms first.", "error");
    return;
  }

  // Clear previous allocations
  allocations = [];
  let totalStudentsAllocated = 0;
  let totalRoomsUsed = new Set();
  let results = [];

  // Generate seating for all exams
  exams.forEach((exam, examIndex) => {
    // Students eligible for this session
    const eligibleStudents = students.filter(student =>
      student.subjects.includes(exam.subject)
    );
    if (eligibleStudents.length === 0) {
      results.push(`${exam.subject}: No students registered`);
      return;
    }
    const shuffled = [...eligibleStudents].sort(() => Math.random() - 0.5);
    const sortedRooms = [...rooms].sort((a, b) => b.capacity - a.capacity);
    const totalCapacity = sortedRooms.reduce((sum, room) => sum + room.capacity, 0);

    if (shuffled.length > totalCapacity) {
      results.push(`${exam.subject}: Not enough capacity (${shuffled.length} students, ${totalCapacity} seats)`);
      return;
    }

    let studentIndex = 0;
    let roomsUsedThisExam = 0;

    for (const room of sortedRooms) {
      if (studentIndex >= shuffled.length) break;
      roomsUsedThisExam++;
      totalRoomsUsed.add(room.roomId);

      const rows = parseInt(room.rows);
      const cols = parseInt(room.seatsPerRow);

      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols && studentIndex < shuffled.length; c++) {
          const student = shuffled[studentIndex++];
          const seatLabel = String.fromCharCode(65 + r) + (c + 1);
          allocations.push({
            examId: exam.examId,
            examSubject: exam.subject,
            examName: exam.subjectName,
            examDate: exam.date,
            examTime: exam.time,
            roomId: room.roomId,
            roomName: room.name,
            seatNo: seatLabel,
            rollNo: student.rollNo,
            studentName: student.name,
            department: student.department,
          });
        }
      }
    }
    totalStudentsAllocated += shuffled.length;
    results.push(`${exam.subject}: ${shuffled.length} students allocated across ${roomsUsedThisExam} rooms.`);
  });

  // Stats for UI
  const totalCapacitySum = rooms.reduce((sum, room) => sum + room.capacity, 0) * exams.length;
  const capacityUtil = ((totalStudentsAllocated / totalCapacitySum) * 100).toFixed(1);

  document.getElementById("statStudents").textContent = totalStudentsAllocated;
  document.getElementById("statRooms").textContent = totalRoomsUsed.size;
  document.getElementById("statCapacity").textContent = capacityUtil + "%";
  document.getElementById("statsCard").style.display = "block";

  saveToLocalStorage();

  // Show result summary
  showAlert(
    "generateAlert",
    `<div style="margin-top: 15px">
      <strong>All Exam Seating Generated!</strong><br><br>
      ${results.join("<br>")}<br><br>
      <strong>Summary</strong><br>
      Total Students: ${totalStudentsAllocated}<br>
      Rooms Utilized: ${totalRoomsUsed.size}<br>
      Overall Capacity: ${capacityUtil}%<br>
      Total Allocations: ${allocations.length}
    </div>`,
    "success",
    true
  );

  // Set current session for display/printing
  if (exams.length > 0) {
    currentExamSession = exams[0];
  }
}


function generateSeatLabel(room, seatNum) {
  const row = Math.ceil(seatNum / room.seatsPerRow);
  const col = ((seatNum - 1) % room.seatsPerRow) + 1;
  return String.fromCharCode(64 + row) + "-" + col;
}

function detectConflicts() {
  if (exams.length < 2) {
    showAlert(
      "generateAlert",
      "No conflicts possible with less than 2 exams",
      "error"
    );
    return;
  }

  const conflicts = [];
  const examsByDateTime = {};

  exams.forEach((exam) => {
    const key = `${exam.date}_${exam.time}`;
    if (!examsByDateTime[key]) {
      examsByDateTime[key] = [];
    }
    examsByDateTime[key].push(exam);
  });

  for (const [dateTime, examList] of Object.entries(examsByDateTime)) {
    if (examList.length > 1) {
      students.forEach((student) => {
        const registeredExams = examList.filter((exam) =>
          student.subjects.includes(exam.subject)
        );

        if (registeredExams.length > 1) {
          conflicts.push({
            student: student.name,
            rollNo: student.rollNo,
            exams: registeredExams.map((e) => e.subject).join(", "),
            dateTime,
          });
        }
      });
    }
  }

  if (conflicts.length === 0) {
    showAlert("generateAlert", "✅ No conflicts detected!", "success");
  } else {
    const conflictMsg =
      `⚠️ ${conflicts.length} conflict(s) found:<br>` +
      conflicts
        .map(
          (c) => `${c.student} (${c.rollNo}) has overlapping exams: ${c.exams}`
        )
        .join("<br>");
    showAlert("generateAlert", conflictMsg, "error");
  }
}

// Results Display
function showRoomWise() {
  if (allocations.length === 0) {
    showAlert("generateAlert", "Please generate seating first", "error");
    return;
  }

  // Group by exam first, then by room
  const examGroups = {};
  allocations.forEach((alloc) => {
    const examKey = `${alloc.examSubject} - ${alloc.examName}`;
    if (!examGroups[examKey]) {
      examGroups[examKey] = {};
    }

    if (!examGroups[examKey][alloc.roomId]) {
      examGroups[examKey][alloc.roomId] = [];
    }
    examGroups[examKey][alloc.roomId].push(alloc);
  });

  let html = "";

  // If only one exam, show simple room-wise view
  if (Object.keys(examGroups).length === 1) {
    const examKey = Object.keys(examGroups)[0];
    const roomGroups = examGroups[examKey];

    html += `<h3>📋 ${examKey}</h3>`;

    for (const [roomId, seats] of Object.entries(roomGroups)) {
      const roomName = seats[0].roomName;
      const room = rooms.find((r) => r.roomId === roomId);

      html += `
                        <div class="card">
                            <h3>${roomName} (${roomId})</h3>
                            <p><strong>Date:</strong> ${seats[0].examDate} at ${seats[0].examTime} | <strong>Students:</strong> ${seats.length}</p>
                            <div class="seating-grid" style="grid-template-columns: repeat(${room.seatsPerRow}, 1fr);">
                    `;

      seats.forEach((seat) => {
        html += `
                            <div class="seat">
                                <div class="seat-label">${seat.seatNo}</div>
                                <div class="seat-student">${seat.rollNo}</div>
                                <div class="seat-student">${seat.studentName}</div>
                            </div>
                        `;
      });

      html += `</div></div>`;
    }
  } else {
    // Multiple exams - show exam-wise then room-wise
    html += "<h3>📋 All Exam Seating Arrangements</h3>";

    for (const [examKey, roomGroups] of Object.entries(examGroups)) {
      const firstSeat = Object.values(roomGroups)[0][0];
      html += `
                        <div class="card" style="margin-bottom: 30px; border-left: 4px solid var(--color-teal-500);">
                            <h2 style="color: var(--color-teal-500); margin-bottom: 10px;">${examKey}</h2>
                            <p style="margin-bottom: 20px; color: var(--color-slate-500);"><strong>📅 ${firstSeat.examDate}</strong> at <strong>🕒 ${firstSeat.examTime}</strong></p>
                    `;

      for (const [roomId, seats] of Object.entries(roomGroups)) {
        const roomName = seats[0].roomName;
        const room = rooms.find((r) => r.roomId === roomId);

        html += `
                            <div style="margin-bottom: 25px; padding: 15px; background: var(--color-bg-1); border-radius: 8px;">
                                <h4>${roomName} (${roomId}) - ${seats.length} students</h4>
                                <div class="seating-grid" style="grid-template-columns: repeat(${room.seatsPerRow}, 1fr); margin-top: 15px;">
                        `;

        seats.forEach((seat) => {
          html += `
                                <div class="seat">
                                    <div class="seat-label">${seat.seatNo}</div>
                                    <div class="seat-student">${seat.rollNo}</div>
                                    <div class="seat-student">${seat.studentName}</div>
                                </div>
                            `;
        });

        html += `</div></div>`;
      }

      html += `</div>`;
    }
  }

  document.getElementById("resultsContent").innerHTML = html;
}

function showStatistics() {
  if (allocations.length === 0) {
    showAlert("generateAlert", "Please generate seating first", "error");
    return;
  }

  // Department-wise distribution
  const deptStats = {};
  const roomUtilization = {};
  const examStats = {};

  allocations.forEach((alloc) => {
    // Department stats
    deptStats[alloc.department] = (deptStats[alloc.department] || 0) + 1;

    // Room utilization
    if (!roomUtilization[alloc.roomId]) {
      const room = rooms.find((r) => r.roomId === alloc.roomId);
      roomUtilization[alloc.roomId] = {
        name: alloc.roomName,
        capacity: room ? room.capacity : 0,
        used: 0,
      };
    }
    roomUtilization[alloc.roomId].used++;

    // Exam stats
    const examKey = `${alloc.examSubject} - ${alloc.examName}`;
    examStats[examKey] = (examStats[examKey] || 0) + 1;
  });

  let html = "<h3>📊 Analytics Dashboard</h3>";

  // Department Distribution
  html += `
                <div class="card">
                    <h2>Department-wise Distribution</h2>
                    <div class="stats">
            `;

  const totalStudents = Object.values(deptStats).reduce((a, b) => a + b, 0);
  for (const [dept, count] of Object.entries(deptStats)) {
    const percentage = ((count / totalStudents) * 100).toFixed(1);
    html += `
                    <div class="stat-card">
                        <div class="stat-value">${count}</div>
                        <div class="stat-label">${dept} (${percentage}%)</div>
                    </div>
                `;
  }

  html += `</div></div>`;

  // Room Utilization
  html += `
                <div class="card">
                    <h2>Room Utilization</h2>
                    <table>
                        <thead>
                            <tr>
                                <th>Room</th>
                                <th>Capacity</th>
                                <th>Used</th>
                                <th>Available</th>
                                <th>Utilization</th>
                                <th>Status</th>
                            </tr>
                        </thead>
                        <tbody>
            `;

  for (const [roomId, data] of Object.entries(roomUtilization)) {
    const utilization = ((data.used / data.capacity) * 100).toFixed(1);
    const available = data.capacity - data.used;
    const status =
      utilization > 80 ? "🔴 High" : utilization > 50 ? "🟡 Medium" : "🟢 Low";

    html += `
                    <tr>
                        <td>${data.name}</td>
                        <td>${data.capacity}</td>
                        <td>${data.used}</td>
                        <td>${available}</td>
                        <td>${utilization}%</td>
                        <td>${status}</td>
                    </tr>
                `;
  }

  html += `</tbody></table></div>`;

  // Exam-wise Enrollment
  html += `
                <div class="card">
                    <h2>Exam-wise Enrollment</h2>
                    <div class="stats">
            `;

  for (const [exam, count] of Object.entries(examStats)) {
    html += `
                    <div class="stat-card">
                        <div class="stat-value">${count}</div>
                        <div class="stat-label">${exam}</div>
                    </div>
                `;
  }

  html += `</div></div>`;

  document.getElementById("resultsContent").innerHTML = html;
}

function exportSeatingPlan() {
  if (allocations.length === 0) {
    showAlert("generateAlert", "Please generate seating first", "error");
    return;
  }

  // Create printable HTML
  let html = `
                <!DOCTYPE html>
                <html>
                <head>
                    <title>Seating Plan Report</title>
                    <style>
                        body { font-family: Arial, sans-serif; padding: 20px; }
                        h1 { color: #21808d; text-align: center; }
                        h2 { color: #13343b; margin-top: 30px; border-bottom: 2px solid #21808d; padding-bottom: 5px; }
                        table { width: 100%; border-collapse: collapse; margin: 20px 0; }
                        th, td { border: 1px solid #ddd; padding: 10px; text-align: left; }
                        th { background-color: #21808d; color: white; }
                        .summary { background: #f0f9fa; padding: 15px; border-radius: 8px; margin: 20px 0; }
                        .summary-item { display: inline-block; margin: 10px 20px; }
                        @media print { 
                            .no-print { display: none; }
                            h2 { page-break-before: always; }
                        }
                    </style>
                </head>
                <body>
                    <h1>📋 Examination Seating Plan Report</h1>
                    <div class="summary">
                        <div class="summary-item"><strong>Generated:</strong> ${new Date().toLocaleString()}</div>
                        <div class="summary-item"><strong>Total Allocations:</strong> ${
                          allocations.length
                        }</div>
                        <div class="summary-item"><strong>Total Rooms:</strong> ${
                          new Set(allocations.map((a) => a.roomId)).size
                        }</div>
                    </div>
            `;

  // Group by exam
  const examGroups = {};
  allocations.forEach((alloc) => {
    const examKey = `${alloc.examSubject} - ${alloc.examName}`;
    if (!examGroups[examKey]) {
      examGroups[examKey] = {
        exam: alloc,
        allocations: [],
      };
    }
    examGroups[examKey].allocations.push(alloc);
  });

  for (const [examKey, data] of Object.entries(examGroups)) {
    html += `
                    <h2>${examKey}</h2>
                    <p><strong>Date:</strong> ${data.exam.examDate} | <strong>Time:</strong> ${data.exam.examTime}</p>
                    <table>
                        <thead>
                            <tr>
                                <th>Roll No</th>
                                <th>Student Name</th>
                                <th>Department</th>
                                <th>Room</th>
                                <th>Seat No</th>
                            </tr>
                        </thead>
                        <tbody>
                `;

    data.allocations.forEach((alloc) => {
      html += `
                        <tr>
                            <td>${alloc.rollNo}</td>
                            <td>${alloc.studentName}</td>
                            <td>${alloc.department}</td>
                            <td>${alloc.roomName}</td>
                            <td><strong>${alloc.seatNo}</strong></td>
                        </tr>
                    `;
    });

    html += `</tbody></table>`;
  }

  html += `
                    <div class="no-print" style="text-align: center; margin-top: 30px;">
                        <button onclick="window.print()" style="padding: 10px 20px; background: #21808d; color: white; border: none; border-radius: 5px; cursor: pointer; font-size: 16px;">🖨️ Print / Save as PDF</button>
                    </div>
                </body>
                </html>
            `;

  // Open in new window
  const printWindow = window.open("", "_blank");
  printWindow.document.write(html);
  printWindow.document.close();

  showAlert(
    "generateAlert",
    "✅ PDF export opened in new window. Use browser print to save as PDF.",
    "success"
  );
}

function showAttendanceSheet() {
  if (allocations.length === 0) {
    showAlert("generateAlert", "Please generate seating first", "error");
    return;
  }

  let html = "<h3>📋 Attendance Sheets</h3>";

  // Group by date, time, and room (for better organization)
  const dateTimeRoomGroups = {};
  allocations.forEach((alloc) => {
    const dateTimeKey = `${alloc.examDate} | ${alloc.examTime}`;
    if (!dateTimeRoomGroups[dateTimeKey]) {
      dateTimeRoomGroups[dateTimeKey] = {};
    }
    if (!dateTimeRoomGroups[dateTimeKey][alloc.roomId]) {
      dateTimeRoomGroups[dateTimeKey][alloc.roomId] = {
        date: alloc.examDate,
        time: alloc.examTime,
        roomName: alloc.roomName,
        roomId: alloc.roomId,
        exams: [],
      };
    }
    dateTimeRoomGroups[dateTimeKey][alloc.roomId].exams.push(alloc);
  });

  // Sort by date and time
  const sortedDateTimes = Object.keys(dateTimeRoomGroups).sort();

  for (const dateTimeKey of sortedDateTimes) {
    const rooms = dateTimeRoomGroups[dateTimeKey];
    const [date, time] = dateTimeKey.split(" | ");

    html += `
                    <div style="background: var(--color-bg-1); padding: 15px; margin: 20px 0; border-radius: 8px; border-left: 4px solid var(--color-teal-500);">
                        <h2 style="color: var(--color-teal-500); margin: 0;">📅 ${date} | 🕒 ${time}</h2>
                    </div>
                `;

    for (const [roomId, data] of Object.entries(rooms)) {
      // Group students by exam subject within this room/date/time
      const examGroups = {};
      data.exams.forEach((alloc) => {
        const examKey = `${alloc.examSubject} - ${alloc.examName}`;
        if (!examGroups[examKey]) {
          examGroups[examKey] = [];
        }
        examGroups[examKey].push(alloc);
      });

      html += `
                        <div class="card" style="page-break-inside: avoid;">
                            <h3 style="color: var(--color-teal-500);">🏛️ ${
                              data.roomName
                            } (${roomId})</h3>
                            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-bottom: 15px; background: var(--color-bg-3); padding: 15px; border-radius: 8px;">
                                <div><strong>📅 Date:</strong> ${
                                  data.date
                                }</div>
                                <div><strong>🕒 Time:</strong> ${
                                  data.time
                                }</div>
                                <div><strong>📚 Exams:</strong> ${
                                  Object.keys(examGroups).length
                                }</div>
                                <div><strong>👥 Total Students:</strong> ${
                                  data.exams.length
                                }</div>
                            </div>
                    `;

      // Display each exam in this room
      for (const [examKey, students] of Object.entries(examGroups)) {
        html += `
                            <div style="margin-bottom: 25px; padding: 15px; background: white; border-radius: 8px; border: 1px solid rgba(94, 82, 64, 0.2);">
                                <h4 style="color: var(--color-slate-900); margin-bottom: 15px;">📝 ${examKey}</h4>
                                <table style="margin-top: 15px;">
                                    <thead>
                                        <tr>
                                            <th style="width: 50px;">#</th>
                                            <th>Roll No</th>
                                            <th>Student Name</th>
                                            <th>Department</th>
                                            <th>Seat No</th>
                                            <th style="width: 80px;">Present</th>
                                            <th style="width: 150px;">Signature</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                        `;

        students.sort((a, b) => a.seatNo.localeCompare(b.seatNo));

        students.forEach((student, index) => {
          html += `
                            <tr>
                                <td>${index + 1}</td>
                                <td>${student.rollNo}</td>
                                <td>${student.studentName}</td>
                                <td>${student.department}</td>
                                <td><strong>${student.seatNo}</strong></td>
                                <td style="text-align: center;">☐</td>
                                <td></td>
                            </tr>
                        `;
        });

        html += `
                                </tbody>
                            </table>
                            <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid rgba(94, 82, 64, 0.2);">
                                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 40px;">
                                    <div>
                                        <strong>Subject Invigilator Name:</strong> _______________________<br><br>
                                        <strong>Signature:</strong> _______________________
                                    </div>
                                    <div>
                                        <strong>Students in this Exam:</strong> ${students.length}<br>
                                        <strong>Present:</strong> _______<br>
                                        <strong>Absent:</strong> _______
                                    </div>
                                </div>
                            </div>
                        </div>
                    `;
      }

      // Room-level summary section
      html += `
                    <div style="margin-top: 30px; padding: 20px; background: var(--color-bg-1); border-radius: 8px; border: 2px solid var(--color-teal-500);">
                        <h4 style="color: var(--color-teal-500); margin-bottom: 15px;">📊 Room Summary</h4>
                        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 40px;">
                            <div>
                                <strong>Chief Invigilator Name:</strong> _______________________<br><br>
                                <strong>Signature:</strong> _______________________
                            </div>
                            <div>
                                <strong>Total Students in Room:</strong> ${data.exams.length}<br>
                                <strong>Total Present:</strong> _______<br>
                                <strong>Total Absent:</strong> _______
                            </div>
                        </div>
                    </div>
                    <div style="text-align: center; margin-top: 20px;">
                        <button class="btn btn-primary" onclick="printAttendanceSheet(this)">🖨️ Print This Sheet</button>
                    </div>
                </div>
            `;
    }
  }

  document.getElementById("resultsContent").innerHTML = html;
}

function printAttendanceSheet(btn) {
  const card = btn.closest(".card");
  const printWindow = window.open("", "_blank");

  const html = `
                <!DOCTYPE html>
                <html>
                <head>
                    <title>Attendance Sheet</title>
                    <style>
                        body { font-family: Arial, sans-serif; padding: 20px; }
                        h3 { color: #21808d; text-align: center; margin-bottom: 20px; }
                        table { width: 100%; border-collapse: collapse; margin: 20px 0; }
                        th, td { border: 1px solid #333; padding: 8px; text-align: left; }
                        th { background-color: #21808d; color: white; }
                        .info { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin: 20px 0; }
                        .footer { margin-top: 30px; padding-top: 20px; border-top: 2px solid #333; }
                        @media print { button { display: none; } }
                    </style>
                </head>
                <body>
                    ${card.innerHTML}
                </body>
                </html>
            `;

  printWindow.document.write(html);
  printWindow.document.close();
  setTimeout(() => printWindow.print(), 250);
}

function showHallTickets() {
  if (allocations.length === 0) {
    showAlert("generateAlert", "Please generate seating first", "error");
    return;
  }

  const studentTickets = {};
  allocations.forEach((alloc) => {
    if (!studentTickets[alloc.rollNo]) {
      studentTickets[alloc.rollNo] = {
        student: alloc,
        exams: [],
      };
    }
    studentTickets[alloc.rollNo].exams.push(alloc);
  });

  let html = "<h3>🎟️ Hall Tickets</h3>";

  // If multiple exams per student, show consolidated tickets
  Object.values(studentTickets).forEach((studentData) => {
    const student = studentData.student;
    const examCount = studentData.exams.length;

    if (examCount === 1) {
      // Single exam ticket
      const alloc = studentData.exams[0];
      html += `
                        <div class="hall-ticket">
                            <h3>EXAMINATION HALL TICKET</h3>
                            <div class="hall-ticket-info">
                                <div class="hall-ticket-label">Roll Number:</div>
                                <div>${alloc.rollNo}</div>
                            </div>
                            <div class="hall-ticket-info">
                                <div class="hall-ticket-label">Name:</div>
                                <div>${alloc.studentName}</div>
                            </div>
                            <div class="hall-ticket-info">
                                <div class="hall-ticket-label">Department:</div>
                                <div>${alloc.department}</div>
                            </div>
                            <div class="hall-ticket-info">
                                <div class="hall-ticket-label">Subject:</div>
                                <div>${alloc.examSubject} - ${alloc.examName}</div>
                            </div>
                            <div class="hall-ticket-info">
                                <div class="hall-ticket-label">Date & Time:</div>
                                <div>${alloc.examDate} at ${alloc.examTime}</div>
                            </div>
                            <div class="hall-ticket-info">
                                <div class="hall-ticket-label">Room:</div>
                                <div>${alloc.roomName} (${alloc.roomId})</div>
                            </div>
                            <div class="hall-ticket-info">
                                <div class="hall-ticket-label">Seat Number:</div>
                                <div style="font-size: 1.2rem; font-weight: 600; color: var(--color-teal-500);">${alloc.seatNo}</div>
                            </div>
                            <div style="margin-top: 20px; padding-top: 15px; border-top: 1px solid rgba(94, 82, 64, 0.2); font-size: 0.85rem; color: var(--color-slate-500);">
                                <strong>Instructions:</strong><br>
                                • Bring this hall ticket to the examination hall<br>
                                • Carry a valid ID proof<br>
                                • Report 15 minutes before exam time
                            </div>
                            <div style="text-align: center; margin-top: 15px;">
                                <button class="btn btn-primary" onclick="printTicket(this)">🖨️ Print Ticket</button>
                            </div>
                        </div>
                    `;
    } else {
      // Multi-exam consolidated ticket
      html += `
                        <div class="hall-ticket" style="border: 3px solid var(--color-teal-500);">
                            <h3>CONSOLIDATED EXAMINATION HALL TICKET</h3>
                            <div style="background: var(--color-bg-1); padding: 10px; margin-bottom: 15px; border-radius: 6px;">
                                <div class="hall-ticket-info">
                                    <div class="hall-ticket-label">Roll Number:</div>
                                    <div style="font-weight: 600;">${student.rollNo}</div>
                                </div>
                                <div class="hall-ticket-info">
                                    <div class="hall-ticket-label">Name:</div>
                                    <div style="font-weight: 600;">${student.studentName}</div>
                                </div>
                                <div class="hall-ticket-info">
                                    <div class="hall-ticket-label">Department:</div>
                                    <div>${student.department}</div>
                                </div>
                            </div>
                            <h4 style="margin-bottom: 15px; color: var(--color-teal-500);">📋 Examination Schedule (${examCount} Exams)</h4>
                    `;

      // Sort exams by date and time
      studentData.exams.sort((a, b) => {
        const dateA = new Date(a.examDate + " " + a.examTime);
        const dateB = new Date(b.examDate + " " + b.examTime);
        return dateA - dateB;
      });

      studentData.exams.forEach((alloc, index) => {
        html += `
                            <div style="border-left: 3px solid var(--color-teal-500); padding-left: 15px; margin-bottom: 15px;">
                                <div style="font-weight: 600; color: var(--color-slate-900); margin-bottom: 8px;">
                                    Exam ${index + 1}: ${alloc.examSubject} - ${
          alloc.examName
        }
                                </div>
                                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px; font-size: 0.9rem;">
                                    <div><strong>📅 Date:</strong> ${
                                      alloc.examDate
                                    }</div>
                                    <div><strong>🕒 Time:</strong> ${
                                      alloc.examTime
                                    }</div>
                                    <div><strong>🏛️ Room:</strong> ${
                                      alloc.roomName
                                    } (${alloc.roomId})</div>
                                    <div><strong>💺 Seat:</strong> <span style="color: var(--color-teal-500); font-weight: 600;">${
                                      alloc.seatNo
                                    }</span></div>
                                </div>
                            </div>
                        `;
      });

      html += `
                            <div style="text-align: center; margin-top: 20px; padding-top: 15px; border-top: 1px solid rgba(94, 82, 64, 0.2);">
                                <button class="btn btn-primary" onclick="printTicket(this)">🖨️ Print All Tickets</button>
                            </div>
                        </div>
                    `;
    }
  });

  document.getElementById("resultsContent").innerHTML = html;
}

function printTicket(btn) {
  const ticket = btn.closest(".hall-ticket");
  const printWindow = window.open("", "_blank");

  const html = `
                <!DOCTYPE html>
                <html>
                <head>
                    <title>Hall Ticket</title>
                    <style>
                        body { 
                            font-family: Arial, sans-serif; 
                            padding: 40px; 
                            max-width: 800px;
                            margin: 0 auto;
                        }
                        h3 { 
                            color: #21808d; 
                            text-align: center; 
                            margin-bottom: 30px;
                            font-size: 24px;
                        }
                        h4 {
                            color: #21808d;
                            margin: 20px 0 15px 0;
                        }
                        .hall-ticket-info { 
                            display: grid; 
                            grid-template-columns: 180px 1fr; 
                            gap: 12px; 
                            margin-bottom: 12px;
                            padding: 8px 0;
                        }
                        .hall-ticket-label { 
                            font-weight: 600; 
                            color: #13343b;
                        }
                        .hall-ticket {
                            border: 2px solid #13343b;
                            padding: 30px;
                            border-radius: 8px;
                        }
                        @media print { 
                            button { display: none; }
                            body { padding: 20px; }
                        }
                    </style>
                </head>
                <body>
                    <div class="hall-ticket">
                        ${ticket.innerHTML}
                    </div>
                </body>
                </html>
            `;

  printWindow.document.write(html);
  printWindow.document.close();
  setTimeout(() => printWindow.print(), 250);
}

// Utility functions
function showAlert(elementId, message, type, persistent = false) {
  const alertDiv = document.getElementById(elementId);
  const alertClass = type === "success" ? "alert-success" : "alert-error";

  const closeBtn = persistent
    ? `<button onclick="document.getElementById('${elementId}').innerHTML=''" style="float: right; background: transparent; border: none; font-size: 1.2rem; cursor: pointer; color: inherit; padding: 0 8px;">×</button>`
    : "";

  alertDiv.innerHTML = `<div class="alert ${alertClass}">${closeBtn}${message}</div>`;

  if (!persistent) {
    setTimeout(() => {
      alertDiv.innerHTML = "";
    }, 5000);
  }
}

function showPrintableSeatingChart() {
  if (!rooms || rooms.length === 0 || !allocations || allocations.length === 0) {
    alert('No rooms/seating generated yet!');
    return;
  }

  let html = `<h1 style="text-align:center;">Exam Seating Chart</h1>`;

  // --- GROUP ALLOCATIONS BY EXAM ---
  // Get all unique exam sessions in allocations
  const examsMap = {};
  allocations.forEach(a => {
    if (!examsMap[a.examId]) examsMap[a.examId] = {
      examName: a.examName || a.examSubject,
      examDate: a.examDate,
      examTime: a.examTime,
      rooms: {}
    };
    if (!examsMap[a.examId].rooms[a.roomId]) examsMap[a.examId].rooms[a.roomId] = [];
    examsMap[a.examId].rooms[a.roomId].push(a);
  });

  Object.keys(examsMap).forEach(examId => {
    const exam = examsMap[examId];
    html += `<h2 style="margin-top:30px;color:#106682;">${exam.examName} (${exam.examDate ? exam.examDate : ''} ${exam.examTime ? exam.examTime : ''})</h2>`;
    Object.keys(exam.rooms).forEach(roomId => {
      const room = rooms.find(r => r.roomId === roomId);
      if (!room) return;
      const rows = parseInt(room.rows);
      const cols = parseInt(room.seatsPerRow);

      let grid = Array.from({ length: rows }, () => Array(cols).fill(null));
      exam.rooms[roomId].forEach(a => {
        const rowIndex = a.seatNo.charCodeAt(0) - 65;
        const colIndex = parseInt(a.seatNo.slice(1)) - 1;
        if (rowIndex < rows && colIndex < cols) {
          grid[rowIndex][colIndex] = a;
        }
      });

      html += `<h3 style="margin-bottom:1px;">${room.name} (${room.roomId})</h3>
      <table border="1" cellpadding="10" cellspacing="0" style="border-collapse:collapse; margin:auto; margin-bottom:30px; min-width: 50vw;">
      <thead>
        <tr><th></th>`;
      for (let c = 0; c < cols; c++) html += `<th>Bench ${c + 1}</th>`;
      html += `</tr>
      </thead><tbody>`;
      for (let r = 0; r < rows; r++) {
        html += `<tr><td style="font-weight:bold;background:#f2fbff;">Row ${r + 1}</td>`;
        for (let c = 0; c < cols; c++) {
          const alloc = grid[r][c];
          html += `<td style="min-width:110px;height:65px;text-align:center;background:#e6f4f3;">
            ${alloc
              ? `<div style="font-weight:600;color:#237e91;">${alloc.seatNo}</div>
                 <div style="font-size:1em;">${alloc.rollNo}</div>
                 <div style="font-size:0.98em;color:#254053;">${alloc.studentName}</div>`
              : `<div style="color:#bbb;">(empty)</div>`}
          </td>`;
        }
        html += `</tr>`;
      }
      html += `</tbody></table>`;
    });
  });

  html += `<div style="text-align:center;margin-top:20px;">
    <button onclick="window.print()" style="padding:12px 30px;font-size:18px;">Print</button>
  </div>`;

  let printWin = window.open('', '', 'width=1200,height=900');
  printWin.document.write(`
    <html>
    <head><title>Printable Seating Chart</title>
    <style>
      body { font-family: Arial, sans-serif; }
      @media print { .no-print { display: none; } th, td { font-size:1em; } }
      table { border-collapse: collapse; }
      th, td { border: 1px solid #b2c6cc; padding: 8px; }
    </style>
    </head>
    <body>${html}</body>
    </html>`);
  printWin.document.close();
}

// Update data manager stats
function updateDataManagerStats() {
  document.getElementById("dataStudentCount").textContent = students.length;
  document.getElementById("dataRoomCount").textContent = rooms.length;
  document.getElementById("dataExamCount").textContent = exams.length;
  document.getElementById("dataAllocationCount").textContent =
    allocations.length;
}

// Initialize - Load existing data and render
window.addEventListener("DOMContentLoaded", function () {
  initializeData();
  renderStudents();
  renderRooms();
  renderExams();
  updateExamDropdown();
  updateDataManagerStats();

  // Show notification if data exists
  const totalData = students.length + rooms.length + exams.length;
  if (totalData > 0) {
    console.log(
      `✅ Loaded ${students.length} students, ${rooms.length} rooms, and ${exams.length} exams from local storage`
    );
  }
});