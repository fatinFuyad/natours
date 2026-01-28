export function hideAlert() {
  const el = document.querySelector(".alert");
  if (el) {
    el.parentElement.removeChild(el);
    // el.remove()
  }
}

// type is either success or error
export function showAlert(type, message) {
  // hideAlert();
  const markup = `<div class="alert alert--${type}">${message}</div>`;
  document.querySelector("body").insertAdjacentHTML("afterbegin", markup);
  setTimeout(hideAlert, 5000);
}
