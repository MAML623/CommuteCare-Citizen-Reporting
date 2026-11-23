
const reportForm = document.querySelector("#report-form");
const dateObservedInput = document.querySelector("#date-observed");
const screenshotInput = document.querySelector("#report-screenshot");
const selectedFile = document.querySelector("#selected-file");
const reportFormStatus = document.querySelector("#report-form-status");

const maxScreenshotSize = 10 * 1024 * 1024;
const reportsStorageKey = "suriReports";

// Default the observed date to today, using the visitor's local date.
const localToday = new Date();
localToday.setMinutes(
    localToday.getMinutes() - localToday.getTimezoneOffset()
);

const todayValue = localToday.toISOString().slice(0, 10);

dateObservedInput.max = todayValue;
dateObservedInput.value = todayValue;


// OPTIONAL PHOTO UPLOAD
screenshotInput.addEventListener("change", () => {
    const file = screenshotInput.files[0];

    selectedFile.textContent = file
        ? `${file.name} · ${(file.size / (1024 * 1024)).toFixed(2)} MB`
        : "No file selected (optional)";

    screenshotInput.setCustomValidity("");
});


// FORM SUBMISSION
reportForm.addEventListener("submit", (event) => {
    event.preventDefault();

    reportFormStatus.hidden = true;
    reportFormStatus.textContent = "";

    // Photo is optional.
    const screenshot = screenshotInput.files[0];

    // Only validate the photo if the user selected one.
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

    // Prevent future dates.
    dateObservedInput.setCustomValidity(
        dateObservedInput.value > todayValue
            ? "The observed date cannot be in the future."
            : ""
    );

    // Validate all required fields.
    reportForm.classList.add("was-validated");

    if (!reportForm.reportValidity()) {
        return;
    }

    // Generate report tracking number.
    const reportNumber =
        `CC-${todayValue.replace(/-/g, "")}-${Date.now()
            .toString(36)
            .slice(-5)
            .toUpperCase()}`;

    // Prepare report information.
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

        // FIX: Save null if no picture was uploaded.
        screenshotName: screenshot ? screenshot.name : null,

        office: "Pending assignment",

        submittedAt: new Date().toISOString(),

        verdict: ""
    };

    // Save report to local storage.
    try {
        const savedReports = JSON.parse(
            localStorage.getItem(reportsStorageKey) || "{}"
        );

        savedReports[reportNumber] = report;

        localStorage.setItem(
            reportsStorageKey,
            JSON.stringify(savedReports)
        );

        // Redirect to tracking page.
        window.location.href =
            `track.html?report=${encodeURIComponent(reportNumber)}`;

    } catch (error) {
        reportFormStatus.textContent =
            "This browser could not save the report. Please check your browser storage settings and try again.";

        reportFormStatus.hidden = false;
    }
});


// CLEAR CUSTOM VALIDATION ERRORS WHEN INPUT CHANGES.
reportForm.addEventListener("input", (event) => {
    event.target.setCustomValidity("");
});


// ==========================================
// PROGRESS INDICATOR
// ==========================================

const progressSteps = document.querySelectorAll(".report-steps li");

function isFieldComplete(selector) {
    const field = document.querySelector(selector);

    return Boolean(
        field &&
        field.value.trim() !== "" &&
        field.checkValidity()
    );
}

function updateProgress() {
    // STEP 1: Report Information
    const step1Complete =
        isFieldComplete("#report-category") &&
        isFieldComplete("#incident-description") &&
        isFieldComplete("#date-observed") &&
        isFieldComplete("#time-observed") &&
        document.querySelector('input[name="severity"]:checked') !== null &&
        dateObservedInput.value <= todayValue;

    // STEP 2: Location
    const step2Complete =
        step1Complete &&
        isFieldComplete("#location-text");

    // STEP 3: Reporter Information
    const step3Complete =
        step2Complete &&
        isFieldComplete("#reporter-name") &&
        isFieldComplete("#email-address") &&
        isFieldComplete("#contact-number");

    // STEP 4: Evidence Upload
    // Uploading a photo is optional.
    const screenshot = screenshotInput.files[0];

    const photoIsValid = !screenshot ||
        (
            ["image/png", "image/jpeg", "image/webp"].includes(screenshot.type) &&
            screenshot.size <= maxScreenshotSize
        );

    const step4Complete = step3Complete && photoIsValid;

    // STEP 5: Review and Submit
    const step5Complete =
        step4Complete &&
        document.querySelector("#privacy-consent").checked;

    const completedSteps = [
        step1Complete,
        step2Complete,
        step3Complete,
        step4Complete,
        step5Complete
    ];

    // Find the first incomplete step.
    const activeIndex = completedSteps.findIndex(
        complete => !complete
    );

    progressSteps.forEach((step, index) => {
        step.classList.toggle("completed", completedSteps[index]);
        step.classList.toggle("active", index === activeIndex);

        if (index === activeIndex) {
            step.setAttribute("aria-current", "step");
        } else {
            step.removeAttribute("aria-current");
        }
    });
}

// Update progress whenever the user changes a field.
reportForm.addEventListener("input", updateProgress);
reportForm.addEventListener("change", updateProgress);

// Initial progress state.
updateProgress();

