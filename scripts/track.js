
import { auth, db } from "./firebase-config.js";

import {
    signInAnonymously
} from "https://www.gstatic.com/firebasejs/13.4.0/firebase-auth.js";

import {
    doc,
    getDoc
} from "https://www.gstatic.com/firebasejs/13.4.0/firebase-firestore.js";


// ==========================================
// TRACKING PAGE ELEMENTS
// ==========================================

const reportsStorageKey = "suriReports";

const trackSearchForm = document.querySelector("#track-search-form");
const trackNumberInput = document.querySelector("#track-report-number");
const trackNotice = document.querySelector("#track-notice");
const trackReport = document.querySelector("#track-report");
const trackStatus = document.querySelector("#track-status");
const trackTimeline = document.querySelector("#track-timeline");
const trackVerdict = document.querySelector("#track-verdict");

let latestLookupId = 0;


// ==========================================
// SAMPLE REPORTS
// ==========================================

// Keep the existing demonstration reports.
const demoReportsRequest = fetch("data/reports.json")
    .then((response) => {
        if (!response.ok) {
            throw new Error("Could not load sample reports.");
        }

        return response.json();
    })
    .catch((error) => {
        console.warn("Demo reports unavailable:", error);
        return {};
    });


// ==========================================
// TRACKING TIMELINE
// ==========================================

const timelineSteps = [
    {
        title: "Submitted",
        copy: "Your report was saved and given a reference number."
    },
    {
        title: "Received",
        copy: "CommuteCare checked your report and sent it to the right office."
    },
    {
        title: "Under Review",
        copy: "The office is checking the location and evidence."
    },
    {
        title: "Resolved",
        copy: "The office has fixed or closed the issue."
    }
];


// ==========================================
// LOCAL STORAGE FALLBACK
// ==========================================

const readReports = () => {
    try {
        return JSON.parse(
            localStorage.getItem(reportsStorageKey) || "{}"
        );
    } catch (error) {
        console.warn("Could not read local reports:", error);
        return {};
    }
};


// ==========================================
// FIREBASE AUTHENTICATION
// ==========================================

async function getFirebaseUser() {

    // Wait for Firebase to restore any existing
    // anonymous login from this browser.
    await auth.authStateReady();

    // Reuse the existing identity when possible.
    if (auth.currentUser) {
        return auth.currentUser;
    }

    // Otherwise, sign in anonymously.
    const credential = await signInAnonymously(auth);

    return credential.user;
}


// ==========================================
// FETCH REPORT FROM FIRESTORE
// ==========================================

async function getFirebaseReport(reportNumber) {

    const user = await getFirebaseUser();

    // Firestore path:
    // users / userId / reports / reportNumber
    const reportRef = doc(
        db,
        "users",
        user.uid,
        "reports",
        reportNumber
    );

    const reportSnapshot = await getDoc(reportRef);

    if (!reportSnapshot.exists()) {
        return null;
    }

    return {
        ...reportSnapshot.data(),
        reportNumber
    };
}


// ==========================================
// DATE FORMATTING
// ==========================================

const formatDate = (value) => {

    if (!value) {
        return "Not provided";
    }

    const dateText = String(value);

    const localDateMatch = dateText.match(
        /^(\d{4})-(\d{2})-(\d{2})$/
    );

    const date = localDateMatch
        ? new Date(
            Number(localDateMatch[1]),
            Number(localDateMatch[2]) - 1,
            Number(localDateMatch[3])
        )
        : new Date(dateText);

    return Number.isNaN(date.getTime())
        ? dateText
        : new Intl.DateTimeFormat(
            undefined,
            { dateStyle: "medium" }
        ).format(date);
};


// ==========================================
// DISPLAY TEXT SAFELY
// ==========================================

const setValue = (selector, value) => {
    const element = document.querySelector(selector);

    if (element) {
        element.textContent = value || "Not provided";
    }
};


// ==========================================
// BUILD TRACKING TIMELINE
// ==========================================

const buildTimeline = (report) => {

    const stepForStatus = {
        pending: 0,
        received: 1,
        "under-review": 2,
        rejected: 2,
        resolved: 4
    };

    const currentStep =
        stepForStatus[report.status] ?? 0;

    trackTimeline.replaceChildren();

    trackTimeline.classList.toggle(
        "is-rejected",
        report.status === "rejected"
    );

    timelineSteps.forEach((step, index) => {

        const item = document.createElement("li");
        const marker = document.createElement("span");
        const content = document.createElement("div");
        const title = document.createElement("h4");
        const description = document.createElement("p");

        const state =
            index < currentStep
                ? "complete"
                : index === currentStep
                    ? "current"
                    : "upcoming";

        item.className = `track-step is-${state}`;

        marker.className = "track-step-marker";

        marker.setAttribute(
            "aria-hidden",
            "true"
        );

        marker.textContent =
            state === "complete"
                ? "✓"
                : String(index + 1).padStart(2, "0");

        content.className = "track-step-content";

        title.className = "track-step-title";
        title.textContent = step.title;

        description.className = "track-step-copy";
        description.textContent = step.copy;

        if (state === "current") {
            item.setAttribute(
                "aria-current",
                "step"
            );
        }

        content.append(title, description);
        item.append(marker, content);

        trackTimeline.append(item);
    });
};


// ==========================================
// DISPLAY REPORT INFORMATION
// ==========================================

const displayReport = (
    report,
    isExample = false,
    additionalNotice = ""
) => {

    trackNotice.hidden = true;
    trackReport.hidden = false;

    trackNumberInput.value = report.reportNumber;

    setValue("#track-category", report.category);
    setValue("#track-report-heading", report.reportNumber);
    setValue("#track-description", report.description);
    setValue("#track-sender", report.office);
    setValue("#track-date-received", formatDate(report.dateObserved));
    setValue("#track-location", report.location);
    setValue("#track-submitted", formatDate(report.submittedAt));

    // --------------------------------------
    // REPORT STATUS
    // --------------------------------------

    const statusLabels = {
        pending: "Pending",
        received: "Received",
        "under-review": "Under Review",
        resolved: "Resolved",
        rejected: "Rejected"
    };

    const statusName = statusLabels[report.status]
        ? report.status
        : "pending";

    trackStatus.textContent =
        statusLabels[statusName];

    trackStatus.className =
        `track-status status-${statusName}`;

    // --------------------------------------
    // LOCATION / LANDMARK
    // --------------------------------------

    const messageRow = document.querySelector(
        "#track-message-row"
    );

    messageRow.hidden = !report.landmark;

    if (report.landmark) {
        setValue("#track-message", report.landmark);
    }

    // --------------------------------------
    // PHOTO FILENAME
    // --------------------------------------

    const screenshotRow = document.querySelector(
        "#track-screenshot-row"
    );

    screenshotRow.hidden = !report.screenshotName;

    if (report.screenshotName) {
        setValue(
            "#track-screenshot",
            `${report.screenshotName} (image file is not retained in this demo)`
        );
    }

    // --------------------------------------
    // TIMELINE
    // --------------------------------------

    buildTimeline(report);

    // --------------------------------------
    // REPORT UPDATES
    // --------------------------------------

    trackVerdict.hidden = !report.update;

    trackVerdict.classList.toggle(
        "is-rejected",
        report.status === "rejected"
    );

    if (report.update) {
        setValue("#track-verdict-title", report.office);
        setValue("#track-verdict-copy", report.update);
    }

    // --------------------------------------
    // NOTICES
    // --------------------------------------

    const messages = [];

    if (isExample) {
        messages.push(
            "Sample report shown for demonstration. " +
            "This is not a real report or assessment."
        );
    }

    if (additionalNotice) {
        messages.push(additionalNotice);
    }

    trackNotice.textContent = messages.join(" ");

    trackNotice.hidden = messages.length === 0;
};


// ==========================================
// LOAD REPORT
// ==========================================

const loadReport = async (reportNumber) => {

    // Prevent an older lookup from replacing
    // the result of a newer search.
    const lookupId = ++latestLookupId;

    trackReport.hidden = true;

    const normalizedNumber =
        reportNumber.trim().toUpperCase();

    if (!normalizedNumber) {
        trackNotice.textContent =
            "Please enter a report reference number.";

        trackNotice.hidden = false;
        return;
    }

    trackNotice.textContent =
        "Searching for your report...";

    trackNotice.hidden = false;

    // --------------------------------------
    // DEMONSTRATION REPORTS
    // --------------------------------------

    const demoReports = await demoReportsRequest;

    if (lookupId !== latestLookupId) {
        return;
    }

    // Sample reports should remain available,
    // even when Firebase is offline.
    if (demoReports[normalizedNumber]) {

        displayReport(
            demoReports[normalizedNumber],
            true
        );

        return;
    }

    // --------------------------------------
    // STEP 1: CHECK FIREBASE FIRST
    // --------------------------------------

    let firebaseError = null;

    try {

        const firebaseReport =
            await getFirebaseReport(normalizedNumber);

        if (lookupId !== latestLookupId) {
            return;
        }

        if (firebaseReport) {

            console.log(
                "Report loaded from Firestore:",
                normalizedNumber
            );

            displayReport(firebaseReport);

            return;
        }

    } catch (error) {

        firebaseError = error;

        console.error(
            "Firebase report lookup failed:",
            error
        );
    }

    if (lookupId !== latestLookupId) {
        return;
    }

    // --------------------------------------
    // STEP 2: CHECK LOCAL STORAGE
    // --------------------------------------

    const savedReports = readReports();

    const localReport =
        savedReports[normalizedNumber];

    if (localReport) {

        console.log(
            "Report loaded from localStorage:",
            normalizedNumber
        );

        const notice = firebaseError
            ? "The cloud report could not be checked. " +
              "Showing the copy saved in this browser."
            : "Showing the report saved in this browser.";

        displayReport(
            localReport,
            false,
            notice
        );

        return;
    }

    // --------------------------------------
    // STEP 3: REPORT NOT FOUND
    // --------------------------------------

    trackReport.hidden = true;
    trackNotice.hidden = false;

    if (firebaseError) {

        trackNotice.textContent =
            "Could not connect to Firebase to check this report. " +
            "Check your internet connection and try again.";

    } else {

        trackNotice.textContent =
            "No report with that number was found for this browser's " +
            "Firebase account. Check the reference number and try again.";

    }
};


// ==========================================
// DEMO REPORT BUTTONS
// ==========================================

document.querySelectorAll(".track-sample").forEach(
    (button) => {

        button.addEventListener("click", () => {

            trackNumberInput.value =
                button.textContent.trim();

            trackSearchForm.requestSubmit();
        });
    }
);


// ==========================================
// SEARCH FORM
// ==========================================

trackSearchForm.addEventListener(
    "submit",
    (event) => {

        event.preventDefault();

        const reportNumber =
            trackNumberInput.value
                .trim()
                .toUpperCase();

        const nextUrl = new URL(
            window.location.href
        );

        nextUrl.searchParams.set(
            "report",
            reportNumber
        );

        window.history.replaceState(
            null,
            "",
            nextUrl
        );

        loadReport(reportNumber);
    }
);


// ==========================================
// LOAD REPORT FROM URL
// ==========================================

const parameters = new URLSearchParams(
    window.location.search
);

const requestedReport =
    parameters.get("report") ||
    (
        parameters.get("demo") === "verdict"
            ? "SR-20261025-1003"
            : ""
    );

if (requestedReport) {
    loadReport(requestedReport);
}
