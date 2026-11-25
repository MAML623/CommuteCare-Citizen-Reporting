
import { auth, db } from "./firebase-config.js";

import {
    signInAnonymously
} from "https://www.gstatic.com/firebasejs/13.4.0/firebase-auth.js";

import {
    collection,
    getDocs
} from "https://www.gstatic.com/firebasejs/13.4.0/firebase-firestore.js";


// ==========================================
// DASHBOARD ELEMENTS
// ==========================================

const dashboardTable = document.querySelector("#reports-table-body");
const dashboardMessage = document.querySelector("#dashboard-message");
const searchInput = document.querySelector("#dashboard-search");
const statusFilter = document.querySelector("#status-filter");

const dashboardStorageKey = "suriReports";


// ==========================================
// REPORT STATUS LABELS
// ==========================================

function getStatusLabel(status) {
    const labels = {
        pending: "Pending",
        received: "Received",
        "under-review": "Under Review",
        resolved: "Resolved",
        rejected: "Rejected"
    };

    return labels[status] || "Unknown";
}


// ==========================================
// CREATE TABLE CELLS SAFELY
// ==========================================

function addCell(row, text) {
    const cell = document.createElement("td");

    cell.textContent = text ?? "";

    row.appendChild(cell);

    return cell;
}


// ==========================================
// LOAD LOCAL REPORTS
// ==========================================

function getLocalReports() {
    try {
        const savedReports = JSON.parse(
            localStorage.getItem(dashboardStorageKey) || "{}"
        );

        return Object.values(savedReports).map(report => ({
            ...report,
            source: "This Browser"
        }));

    } catch (error) {
        console.error("Local reports unavailable:", error);
        return [];
    }
}


// ==========================================
// LOAD DEMONSTRATION REPORTS
// ==========================================

async function getDemoReports() {
    try {
        const response = await fetch("data/reports.json");

        if (!response.ok) {
            throw new Error("Could not load demo reports.");
        }

        const demoReports = await response.json();

        return Object.values(demoReports).map(report => ({
            ...report,
            source: "Demo Sample"
        }));

    } catch (error) {
        console.error("Demo reports unavailable:", error);
        return [];
    }
}


// ==========================================
// FIREBASE AUTHENTICATION
// ==========================================

async function getFirebaseUser() {

    // Restore the existing anonymous Firebase user.
    await auth.authStateReady();

    if (auth.currentUser) {
        return auth.currentUser;
    }

    // Sign in anonymously if necessary.
    const credential = await signInAnonymously(auth);

    return credential.user;
}


// ==========================================
// LOAD FIREBASE REPORTS
// ==========================================

async function getFirebaseReports() {

    const user = await getFirebaseUser();

    // Only retrieve reports belonging
    // to the current anonymous Firebase user.
    const reportsRef = collection(
        db,
        "users",
        user.uid,
        "reports"
    );

    const snapshot = await getDocs(reportsRef);

    return snapshot.docs.map(documentSnapshot => ({
        ...documentSnapshot.data(),
        reportNumber: documentSnapshot.id,
        source: "Firebase Cloud"
    }));
}


// ==========================================
// LOAD DASHBOARD
// ==========================================

async function loadDashboard() {

    dashboardMessage.textContent = "Loading reports...";

    const loadingErrors = [];

    // --------------------------------------
    // STEP 1: LOCAL REPORTS
    // --------------------------------------

    const localReports = getLocalReports();

    // --------------------------------------
    // STEP 2: SAMPLE REPORTS
    // --------------------------------------

    const demoReports = await getDemoReports();

    // --------------------------------------
    // STEP 3: FIREBASE REPORTS
    // --------------------------------------

    let firebaseReports = [];

    try {
        firebaseReports = await getFirebaseReports();

        console.log(
            "Reports loaded from Firestore:",
            firebaseReports.length
        );

    } catch (error) {
        console.error(
            "Could not load Firebase reports:",
            error
        );

        loadingErrors.push(
            "Firebase reports could not be loaded. " +
            "Showing available browser and sample reports."
        );
    }

    // --------------------------------------
    // STEP 4: COMBINE REPORTS
    // --------------------------------------

    // A Map prevents duplicate report numbers.
    const reportsMap = new Map();

    // Add demonstration reports first.
    demoReports.forEach(report => {
        reportsMap.set(report.reportNumber, report);
    });

    // Add local reports next.
    localReports.forEach(report => {
        reportsMap.set(report.reportNumber, report);
    });

    // Firebase reports take priority when
    // the same report exists in multiple sources.
    firebaseReports.forEach(report => {
        reportsMap.set(report.reportNumber, report);
    });

    const reports = Array.from(reportsMap.values());

    // Put the newest reports first.
    reports.sort((a, b) => {
        const dateA = Date.parse(a.submittedAt || "") || 0;
        const dateB = Date.parse(b.submittedAt || "") || 0;

        return dateB - dateA;
    });

    // --------------------------------------
    // STEP 5: UPDATE SUMMARY COUNTERS
    // --------------------------------------

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


    // ======================================
    // RENDER DASHBOARD REPORTS
    // ======================================

    function renderReports() {

        const searchText =
            searchInput.value.trim().toLowerCase();

        const selectedStatus = statusFilter.value;

        // ----------------------------------
        // SEARCH AND FILTER
        // ----------------------------------

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

        // ----------------------------------
        // EMPTY RESULTS
        // ----------------------------------

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

        // ----------------------------------
        // DISPLAY REPORTS
        // ----------------------------------

        filteredReports.forEach(report => {

            const row = document.createElement("tr");

            addCell(row, report.reportNumber);

            addCell(row, report.category);

            addCell(
                row,
                getStatusLabel(report.status)
            );

            addCell(row, report.source);

            // View Report button.
            const actionCell = document.createElement("td");

            const link = document.createElement("a");

            link.href =
                "track.html?report=" +
                encodeURIComponent(report.reportNumber);

            link.textContent = "View Report";

            link.className =
                "btn btn-outline-primary btn-sm";

            actionCell.appendChild(link);
            row.appendChild(actionCell);

            dashboardTable.appendChild(row);
        });

        // ----------------------------------
        // DISPLAY RESULT COUNT
        // ----------------------------------

        dashboardMessage.textContent = [
            ...loadingErrors,
            `${filteredReports.length} of ${reports.length} reports shown.`
        ].join(" ");
    }


    // ======================================
    // SEARCH AND FILTER EVENTS
    // ======================================

    searchInput.addEventListener(
        "input",
        renderReports
    );

    statusFilter.addEventListener(
        "change",
        renderReports
    );

    // Display reports immediately after loading.
    renderReports();
}


// ==========================================
// INITIALIZE DASHBOARD
// ==========================================

loadDashboard();
