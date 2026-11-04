// FAQ page: accordion, category filter, and keyword search.
const items = document.querySelectorAll(".faq-item");
const categoryButtons = document.querySelectorAll("#faq-categories button");
const searchForm = document.querySelector("#faq-search-form");
const searchInput = document.querySelector("#faq-search");
const emptyMessage = document.querySelector("#faq-empty");
const statusText = document.querySelector("#faq-status");

let activeCategory = "all";

// Accordion: open one answer at a time.
items.forEach((item) => {
  const toggle = item.querySelector(".faq-toggle");
  toggle.addEventListener("click", () => {
    const willOpen = toggle.getAttribute("aria-expanded") !== "true";
    items.forEach((other) => setOpen(other, false));
    setOpen(item, willOpen);
  });
});

function setOpen(item, open) {
  const toggle = item.querySelector(".faq-toggle");
  const answer = item.querySelector(".faq-a");
  toggle.setAttribute("aria-expanded", String(open));
  answer.hidden = !open;
  const icon = toggle.querySelector("i");
  icon.className = open ? "bi bi-dash-lg" : "bi bi-plus-lg";
}

// Show only the items that match the active category and the search text.
function applyFilters() {
  const query = searchInput.value.trim().toLowerCase();
  let visible = 0;

  items.forEach((item) => {
    const matchesCategory = activeCategory === "all" || item.dataset.category === activeCategory;
    const matchesSearch = item.textContent.toLowerCase().includes(query);
    const show = matchesCategory && matchesSearch;
    item.hidden = !show;
    if (show) visible++;
  });

  emptyMessage.hidden = visible !== 0;
  statusText.textContent = `${visible} question${visible === 1 ? "" : "s"} shown`;
}

categoryButtons.forEach((button) => {
  button.addEventListener("click", () => {
    activeCategory = button.dataset.category;
    categoryButtons.forEach((b) => {
      b.classList.toggle("active", b === button);
      b.setAttribute("aria-pressed", String(b === button));
    });
    applyFilters();
  });
});

searchForm.addEventListener("submit", (event) => {
  event.preventDefault();
  applyFilters();
});
searchInput.addEventListener("input", applyFilters);

// Open the first question by default, like the wireframe.
setOpen(items[0], true);
applyFilters();
