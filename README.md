# Suri – Citizen Reporting Website

## About the Project

**Suri** is a web-based citizen reporting platform designed to help people report problems in public spaces, particularly around transportation areas, stations, terminals, and nearby streets.

The project focuses on making it easier for citizens to report issues that may affect public safety, accessibility, and the cleanliness of their surroundings. Users can submit reports with descriptions, location details, and supporting photo evidence. They can also track the status of their submitted reports using a unique tracking number.

The initial focus of the project is on selected areas in **Pasay and Manila**, covering public-space concerns that commuters, students, employees, and other pedestrians may encounter.

## Key Features

- **Submit a Report** – Allows users to report problems in public spaces by providing the incident category, description, severity, date, and time.
- **Location Details** – Allows users to specify where the reported issue occurred and provide nearby landmarks.
- **Photo Evidence** – Supports optional image uploads to provide additional information about the reported issue.
- **Report Tracking** – Provides a tracking page where users can check the status of their submitted reports using their report number.
- **Report Information** – Displays report details, including the submitted concern, location, and current status.
- **Sample Reports** – Includes sample report data for demonstration and testing purposes.

## Types of Issues Covered

Suri focuses on common public-space concerns, including:

- Garbage and improper waste disposal
- Flooding and water accumulation
- Damaged sidewalks and walkways
- Broken streetlights
- Electrical hazards
- Other problems affecting public spaces and pedestrian safety

## Technologies Used

- **HTML5** – Structures the website's pages and content.
- **CSS3** – Handles the website's styling and responsive layouts.
- **JavaScript** – Manages form validation, report submission, and interactive features.
- **Bootstrap** – Provides responsive layout components and styling utilities.
- **JSON** – Stores sample report data used for the demonstration.
- **Local Storage** – Temporarily stores reports submitted through the demo in the user's browser.

## Running the Project Locally

The project should be opened through a local web server instead of directly opening the HTML files. This allows the browser to properly load the JSON sample data.

### Option 1: Python Built-in Server

1. Install Python from [python.org](https://www.python.org/downloads/) if it is not already installed.
2. Open a terminal in the project folder.
3. Run the following command:

   ```powershell
   py -m http.server 8000
   ```

4. Open your browser and visit:

   `http://localhost:8000/`

5. To access the report tracker, visit:

   `http://localhost:8000/track.html`

6. To stop the server, return to the terminal and press `Ctrl + C`.

If `py` is not recognized, try `python -m http.server 8000`. On macOS or Linux, use `python3 -m http.server 8000`.

### Option 2: VS Code Live Server

1. Install the **Live Server** extension in Visual Studio Code.
2. Open the project folder in VS Code.
3. Open `index.html`.
4. Click **Go Live** in the status bar.
5. Use the local address provided by Live Server to access the website.

## Important Notes

- An internet connection is required to load CDN-hosted Bootstrap, icons, and fonts.
- Sample reports are loaded from `data/reports.json`.
- Reports submitted through the demonstration are stored in the browser's local storage.
- This project is a web development demonstration. Submitted reports are not transmitted to government agencies or other official organizations.