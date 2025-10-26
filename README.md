# Schedulix

A smart, single-page web application designed to streamline exam seating arrangements for colleges and universities. The system automates seat allocation, generates hall tickets, and provides comprehensive analytics—all while working completely offline with local storage persistence.

## Features

### Student Management
- Add students manually or via CSV bulk import
- Store roll number, name, department, and subject registrations
- Automatic duplicate detection and validation
- Smart CSV format detection (prevents wrong data imports)

### Room Configuration
- Configure multiple exam halls with capacity and layout
- Define rows and seats per row for visual seating grids
- CSV import for quick room setup
- Real-time capacity tracking

### Exam Session Scheduling
- Schedule exams with subject codes, dates, and times
- CSV import for bulk exam creation
- Automatic conflict detection for overlapping exams
- Multi-exam management

### Intelligent Seating Generation
- **Smart Distribution:** Automatically distributes students across all available rooms evenly
- **Optimized Spacing:** Uses strategic seat spacing instead of consecutive allocation for better exam integrity
- **Multi-Exam Support:** Generate seating for all exams at once with a single click
- Real-time capacity utilization statistics

### Hall Ticket Generation
- Individual hall tickets for each student-exam pair
- Professional printable format with exam instructions
- One-click print functionality
- Consolidated view for students with multiple exams

### Analytics Dashboard
- Department-wise student distribution
- Room utilization percentages with color-coded status indicators
- Exam-wise enrollment statistics
- Visual stat cards with hover effects

### Export & Reporting
- **PDF Export:** Professional seating plan reports with print dialog
- **Attendance Sheets:** Organized by date, time, and room with checkboxes for marking attendance
- **Room-wise View:** Interactive seating grid visualization
- Individual sheet printing for invigilators

### Data Persistence
- **Local Storage:** All data automatically saved to browser
- **Backup/Restore:** Export and import complete system state as JSON
- **CSV Import:** Bulk data import for students, rooms, and exams
- Data validation and format checking

### Modern UI/UX
- Responsive design with mobile support
- Smooth animations and transitions
- Gradient effects and hover interactions
- Color-coded status indicators
- Tab-based navigation

## Quick Start

### Installation
1. Download the `index.html`, `style.css`, `script.js` files
2. Open it in any modern web browser
3. Start adding your data!

### Usage Flow
1. **Add Rooms** → Configure exam halls with capacity
2. **Add Students** → Import via CSV or add manually
3. **Schedule Exams** → Create exam sessions with dates/times
4. **Generate Seating** → Click "Generate All Exams" for instant allocation
5. **View Results** → Access hall tickets, attendance sheets, and analytics

## CSV Import Format

### Students CSV
```csv
RollNo,Name,Department,SubjectCodes
21CS001,Alice Johnson,CSE,CS301;CS302;MA301
21CS002,Bob Smith,CSE,CS301;MA301
```

### Rooms CSV
```csv
RoomID,RoomName,Capacity,Rows,SeatsPerRow
R101,Main Hall,60,10,6
R102,Lab Block,40,8,5
```

### Exams CSV
```csv
SubjectCode,SubjectName,Date,Time
CS301,Data Structures,2025-11-15,09:00 AM
MA301,Mathematics III,2025-11-16,09:00 AM
```

## Data Validation

The system includes intelligent validation to prevent errors:
- **Format Detection:** Automatically detects if wrong CSV type is uploaded
- **Duplicate Prevention:** Checks for existing records before import
- **Conflict Detection:** Warns about scheduling conflicts
- **Capacity Checks:** Alerts when student count exceeds available seats

## Key Algorithms

### Seating Allocation Strategy
1. **Even Distribution:** Students distributed evenly across all available rooms
2. **Strategic Spacing:** Seats allocated with calculated spacing (not consecutively) for better distancing
3. **Capacity Optimization:** Smart utilization of room capacity with overflow prevention
4. **Department Mixing:** Natural mixing across departments for exam integrity

### Conflict Detection
- Identifies students with overlapping exam schedules
- Checks for same date/time exam conflicts
- Provides detailed conflict reports with student information

## Technical Stack

- **Frontend:** Pure HTML5, CSS3, JavaScript (ES6+)
- **Storage:** Browser LocalStorage API
- **Architecture:** Single-page application (SPA)
- **No Dependencies:** Works offline, no external libraries required

## Browser Compatibility

- ✅ Chrome/Edge (Recommended)
- ✅ Firefox
- ✅ Safari
- ✅ Opera

## Privacy & Security

- **100% Local:** All data stored in your browser only
- **No Server:** No data sent to external servers
- **Offline Capable:** Works completely without internet
- **Export Control:** You control all data exports and backups

## Design System

- Custom CSS variables for theming
- Gradient effects and shadows
- Smooth cubic-bezier transitions
- Accessible color contrasts
- Responsive grid layouts

## Documentation

All features are self-explanatory with:
- Inline format guides
- Sample CSV format examples
- Tooltips and help sections
- Clear error messages

## Contributing

This is an open-source educational project. Feel free to:
- Report bugs
- Suggest features
- Submit improvements

## License

Free to use for educational and non-commercial purposes.

## Credits

Developed as a solution for **PS52: Automated Exam Seating Planner** - an intermediate-level college automation project.

---

**Made with 💙 for CBIT Hacktober'25.**