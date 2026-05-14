const stepButtons = Array.from(document.querySelectorAll(".step"));
const panels = Array.from(document.querySelectorAll(".screen"));

function showStep(index) {
  stepButtons.forEach((button) => {
    button.classList.toggle("is-active", Number(button.dataset.step) === index);
  });
  panels.forEach((panel) => {
    panel.classList.toggle("is-visible", Number(panel.dataset.panel) === index);
  });
}

stepButtons.forEach((button) => {
  button.addEventListener("click", () => showStep(Number(button.dataset.step)));
});

document.querySelectorAll(".next").forEach((button) => {
  button.addEventListener("click", () => {
    const current = panels.findIndex((panel) => panel.classList.contains("is-visible"));
    showStep(Math.min(current + 1, panels.length - 1));
  });
});

document.querySelectorAll(".prev").forEach((button) => {
  button.addEventListener("click", () => {
    const current = panels.findIndex((panel) => panel.classList.contains("is-visible"));
    showStep(Math.max(current - 1, 0));
  });
});

document.querySelectorAll(".candidate").forEach((button) => {
  button.addEventListener("click", () => {
    document.querySelectorAll(".candidate").forEach((item) => item.classList.remove("is-selected"));
    button.classList.add("is-selected");
  });
});
