
import { auth, db } from "./firebase-config.js";

import {
    signInAnonymously
} from "https://www.gstatic.com/firebasejs/13.4.0/firebase-auth.js";

import {
    doc,
    setDoc
} from "https://www.gstatic.com/firebasejs/13.4.0/firebase-firestore.js";


// ==========================================
// FORM ELEMENTS
// ==========================================

const reportForm = document.querySelector("#report-form");
const dateObservedInput = document.querySelector("#date-observed");
const screenshotInput = document.querySelector("#report-screenshot");
const selectedFile = document.querySelector("#selected-file");
const reportFormStatus = document.querySelector("#report-form-status");

const maxScreenshotSize = 10 * 1024 * 1024;
const reportsStorageKey = "suriReports";

let isSubmitting = false;


// ==========================================
// DEFAULT DATE
// ==========================================

// Default the observed date to today.
const localToday = new Date();

localToday.setMinutes(
    localToday.getMinutes() - localToday.getTimezoneOffset()
);

const todayValue = localToday.toISOString().slice(0, 10);

dateObservedInput.max = todayValue;
dateObservedInput.value = todayValue;


// ==========================================
// OPTIONAL PHOTO UPLOAD
// ==========================================

screenshotInput.addEventListener("change", () => {
    const file = screenshotInput.files[0];

    selectedFile.textContent = file
        ? `${file.name} · ${(file.size / (1024 * 1024)).toFixed(2)} MB`
        : "No file selected (optional)";

    screenshotInput.setCustomValidity("");
});


// ==========================================
// FORM SUBMISSION
// ==========================================

reportForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    // Prevent duplicate submissions.
    if (isSubmitting) {
        return;
    }

    reportFormStatus.hidden = true;
    reportFormStatus.textContent = "";

    // --------------------------------------
    // PHOTO VALIDATION
    // --------------------------------------

    const screenshot = screenshotInput.files[0];

    const screenshotIsValid = !screenshot ||
        (
            ["image/png", "image/jpeg", "image/webp"].includes(screenshot.type) &&
            screenshot.size <= maxScreenshotSize
        );

    screenshotInput.setCustomValidity(
        screenshotIsValid
            ? ""
            : "Choose a PNG, JPG, or WebP image no larger than 10 MB."
    );

    // --------------------------------------
    // DATE VALIDATION
    // --------------------------------------

    dateObservedInput.setCustomValidity(
        dateObservedInput.value > todayValue
            ? "The observed date cannot be in the future."
            : ""
    );

    // --------------------------------------
    // REQUIRED FIELD VALIDATION
    // --------------------------------------

    reportForm.classList.add("was-validated");

    if (!reportForm.reportValidity()) {
        return;
    }

    // --------------------------------------
    // GENERATE REFERENCE NUMBER
    // --------------------------------------

    const reportNumber =
        `CC-${todayValue.replace(/-/g, "")}-${Date.now()
            .toString(36)
            .slice(-5)
            .toUpperCase()}`;

    // --------------------------------------
    // PREPARE REPORT INFORMATION
    // --------------------------------------

    const report = {
        reportNumber,

        status: "pending",

        category: reportForm.elements.category.value,

        description: document
            .querySelector("#incident-description")
            .value.trim(),

        severity: reportForm.elements.severity.value,

        dateObserved: dateObservedInput.value,

        timeObserved: document
            .querySelector("#time-observed")
            .value,

        location: document
            .querySelector("#location-text")
            .value.trim(),

        landmark: document
            .querySelector("#landmark")
            .value.trim(),

        reporterName: document
            .querySelector("#reporter-name")
            .value.trim(),

        email: document
            .querySelector("#email-address")
            .value.trim(),

        contact: document
            .querySelector("#contact-number")
            .value.trim(),

        // Store filename only, not the image itself.
        screenshotName: screenshot ? screenshot.name : null,

        office: "Pending assignment",

        submittedAt: new Date().toISOString(),

        verdict: ""
    };

    // --------------------------------------
    // DISABLE BUTTON WHILE SAVING
    // --------------------------------------

    const submitButton = reportForm.querySelector(
        'button[type="submit"], input[type="submit"]'
    );

    isSubmitting = true;

    if (submitButton) {
        submitButton.disabled = true;
    }

    reportFormStatus.hidden = false;
    reportFormStatus.textContent =
        "Saving your report to the database...";

    let savedToFirestore = false;

    try {

        // ==================================
        // STEP 1: FIREBASE AUTHENTICATION
        // ==================================

        const credential = await signInAnonymously(auth);

        const userId = credential.user.uid;

        // ==================================
        // STEP 2: FIRESTORE DATABASE
        // ==================================

        // Reports are stored under the user's ID.
        const reportRef = doc(
            db,
            "users",
            userId,
            "reports",
            reportNumber
        );

        // Save the report to Cloud Firestore.
        await setDoc(reportRef, report);

        savedToFirestore = true;

        console.log(
            "Report successfully saved to Firestore:",
            reportNumber
        );

        // ==================================
        // STEP 3: LOCAL STORAGE
        // ==================================

        // Keep a local copy so the existing
        // tracking page continues to work.
        const savedReports = JSON.parse(
            localStorage.getItem(reportsStorageKey) || "{}"
        );

        savedReports[reportNumber] = report;

        localStorage.setItem(
            reportsStorageKey,
            JSON.stringify(savedReports)
        );

        console.log(
            "Report successfully saved locally:",
            reportNumber
        );

        // ==================================
        // STEP 4: REDIRECT TO TRACKING PAGE
        // ==================================

        reportFormStatus.textContent =
            "Report saved successfully! Redirecting...";

        window.location.href =
            `track.html?report=${encodeURIComponent(reportNumber)}`;

    } catch (error) {

        console.error(
            "Report submission error:",
            error
        );

        if (savedToFirestore) {

            // The cloud save succeeded, but
            // browser storage did not.
            reportFormStatus.textContent =
                `Your report was saved online with reference ` +
                `${reportNumber}, but this browser could not ` +
                `save a local copy. Please keep this reference ` +
                `number. Do not submit the same report again.`;

        } else {

            // No confirmed cloud save.
            reportFormStatus.textContent =
                "Your report could not be saved to Firebase. " +
                "Please check your internet connection " +
                "and try again.";

        }

        reportFormStatus.hidden = false;

    } finally {

        // Keep the form locked if the cloud
        // save succeeded, preventing duplicates.
        if (!savedToFirestore) {
            isSubmitting = false;

            if (submitButton) {
                submitButton.disabled = false;
            }
        }
    }
});


// ==========================================
// CLEAR CUSTOM VALIDATION ERRORS
// ==========================================

reportForm.addEventListener("input", (event) => {
    if (typeof event.target.setCustomValidity === "function") {
        event.target.setCustomValidity("");
    }
});


// ==========================================
// PROGRESS INDICATOR
// ==========================================

const progressSteps = document.querySelectorAll(
    ".report-steps li"
);

function isFieldComplete(selector) {
    const field = document.querySelector(selector);

    return Boolean(
        field &&
        field.value.trim() !== "" &&
        field.checkValidity()
    );
}

function updateProgress() {

    // --------------------------------------
    // STEP 1: REPORT INFORMATION
    // --------------------------------------

    const step1Complete =
        isFieldComplete("#report-category") &&
        isFieldComplete("#incident-description") &&
        isFieldComplete("#date-observed") &&
        isFieldComplete("#time-observed") &&
        document.querySelector(
            'input[name="severity"]:checked'
        ) !== null &&
        dateObservedInput.value <= todayValue;

    // --------------------------------------
    // STEP 2: LOCATION
    // --------------------------------------

    const step2Complete =
        step1Complete &&
        isFieldComplete("#location-text");

    // --------------------------------------
    // STEP 3: REPORTER INFORMATION
    // --------------------------------------

    const step3Complete =
        step2Complete &&
        isFieldComplete("#reporter-name") &&
        isFieldComplete("#email-address") &&
        isFieldComplete("#contact-number");

    // --------------------------------------
    // STEP 4: EVIDENCE UPLOAD
    // --------------------------------------

    // Photo upload remains optional.
    const screenshot = screenshotInput.files[0];

    const photoIsValid = !screenshot ||
        (
            ["image/png", "image/jpeg", "image/webp"].includes(screenshot.type) &&
            screenshot.size <= maxScreenshotSize
        );

    const step4Complete =
        step3Complete && photoIsValid;

    // --------------------------------------
    // STEP 5: REVIEW AND SUBMIT
    // --------------------------------------

    const privacyConsent = document.querySelector(
        "#privacy-consent"
    );

    const step5Complete =
        step4Complete &&
        privacyConsent.checked;

    // --------------------------------------
    // UPDATE PROGRESS DOTS
    // --------------------------------------

    const completedSteps = [
        step1Complete,
        step2Complete,
        step3Complete,
        step4Complete,
        step5Complete
    ];

    const firstIncompleteStep = completedSteps.findIndex(
        complete => !complete
    );

    // Keep the final step highlighted
    // when all steps are complete.
    const activeIndex =
        firstIncompleteStep === -1
            ? completedSteps.length - 1
            : firstIncompleteStep;

    progressSteps.forEach((step, index) => {

        step.classList.toggle(
            "completed",
            completedSteps[index]
        );

        step.classList.toggle(
            "active",
            index === activeIndex
        );

        if (index === activeIndex) {
            step.setAttribute(
                "aria-current",
                "step"
            );
        } else {
            step.removeAttribute(
                "aria-current"
            );
        }

    });
}


// ==========================================
// AUTOMATIC PROGRESS UPDATES
// ==========================================

reportForm.addEventListener(
    "input",
    updateProgress
);

reportForm.addEventListener(
    "change",
    updateProgress
);

// Set initial progress state.
updateProgress();


// ==========================================
// DESCRIPTION CHARACTER COUNTER
// ==========================================

const descriptionInput = document.querySelector(
    "#incident-description"
);

const descriptionCounter = document.querySelector(
    "#description-counter"
);

function updateDescriptionCounter() {

    const count = descriptionInput.value.length;

    descriptionCounter.textContent =
        `${count} / 1000 characters (minimum 20)`;
}

descriptionInput.addEventListener(
    "input",
    updateDescriptionCounter
);

// Set initial character count.
updateDescriptionCounter();
