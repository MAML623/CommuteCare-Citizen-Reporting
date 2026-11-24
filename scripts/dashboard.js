const dashboardTable = document.querySelector("#reports-table-body");
const dashboardMessage = document.querySelector("#dashboard-message");

const searchInput = document.querySelector("#dashboard-search");
const statusFilter = document.querySelector("#status-filter");

const dashboardStorageKey = "suriReports";

// Convert internal statuses into readable labels.
function getStatusLabel(status) {
    const labels = {
        pending: "Pending (Local)",
        received: "Received",
        "under-review": "Under Review",
        resolved: "Resolved",
        rejected: "Rejected"
    };

    return labels[status] || "Unknown";
}

// Create table cells safely.
function addCell(row, text) {
    const cell = document.createElement("td");
    cell.textContent = text ?? "";
    row.appendChild(cell);
    return cell;
}

// Load reports from browser storage and demo JSON.
async function loadDashboard() {
    let savedReports = {};
    let demoReports = {};
    const loadingErrors = [];

    // Load reports submitted in this browser.
    try {
        savedReports = JSON.parse(
            localStorage.getItem(dashboardStorageKey) || "{}"
        );
    } catch (error) {
        loadingErrors.push("Could not read locally saved reports.");
    }

    // Load sample reports.
    try {
        const response = await fetch("data/reports.json");

        if (!response.ok) {
            throw new Error("Failed to load demonstration reports.");
        }

        demoReports = await response.json();
    } catch (error) {
        loadingErrors.push(
            "Some demonstration reports could not be loaded."
        );
    }

    // Combine saved reports and sample reports.
    const reports = [
        ...Object.values(savedReports).map(report => ({
            ...report,
            source: "This Browser"
        })),

        ...Object.values(demoReports).map(report => ({
            ...report,
            source: "Demo Sample"
        }))
    ];

    // ==========================================
    // DASHBOARD SUMMARY COUNTERS
    // ==========================================

    document.querySelector("#total-reports").textContent =
        reports.length;

    document.querySelector("#received-reports").textContent =
        reports.filter(report =>
            report.status === "pending" ||
            report.status === "received"
        ).length;

    document.querySelector("#review-reports").textContent =
        reports.filter(report =>
            report.status === "under-review"
        ).length;

    document.querySelector("#resolved-reports").textContent =
        reports.filter(report =>
            report.status === "resolved"
        ).length;


    // ==========================================
    // DASHBOARD SEARCH AND FILTER
    // ==========================================

    function renderReports() {

        const searchText = searchInput.value.trim().toLowerCase();
        const selectedStatus = statusFilter.value;

        // Filter reports by search text and status.
        const filteredReports = reports.filter(report => {

            const matchesSearch =
                String(report.reportNumber || "")
                    .toLowerCase()
                    .includes(searchText) ||

                String(report.category || "")
                    .toLowerCase()
                    .includes(searchText);

            const matchesStatus =
                selectedStatus === "all" ||
                report.status === selectedStatus;

            return matchesSearch && matchesStatus;
        });

        // Clear previous table rows.
        dashboardTable.replaceChildren();

        // Display a message if no reports match.
        if (filteredReports.length === 0) {

            const row = document.createElement("tr");

            const cell = addCell(
                row,
                reports.length === 0
                    ? "No reports available."
                    : "No matching reports found."
            );

            cell.colSpan = 5;
            cell.className = "text-center py-4";

            dashboardTable.appendChild(row);
        }

        // ==========================================
        // DISPLAY FILTERED REPORTS
        // ==========================================

        filteredReports.forEach(report => {

            const row = document.createElement("tr");

            // Reference number
            addCell(row, report.reportNumber);

            // Issue category
            addCell(row, report.category);

            // Report status
            addCell(row, getStatusLabel(report.status));

            // Report source
            addCell(row, report.source);

            // View Report button
            const actionCell = document.createElement("td");

            const link = document.createElement("a");

            link.href = "track.html?report=" +
                encodeURIComponent(report.reportNumber);

            link.textContent = "View Report";

            link.className =
                "btn btn-outline-primary btn-sm";

            actionCell.appendChild(link);
            row.appendChild(actionCell);

            dashboardTable.appendChild(row);
        });

        // Show how many reports match.
        const resultsMessage =
            `${filteredReports.length} of ${reports.length} reports shown.`;

        dashboardMessage.textContent = [
            ...loadingErrors,
            resultsMessage
        ].join(" ");
    }


    // ==========================================
    // SEARCH AND FILTER EVENT LISTENERS
    // ==========================================

    // Update results while typing.
    searchInput.addEventListener("input", renderReports);

    // Update results when status changes.
    statusFilter.addEventListener("change", renderReports);

    // Display all reports when the dashboard loads.
    renderReports();
}

// Load dashboard data.
loadDashboard();
