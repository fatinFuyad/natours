import "@babel/polyfill"; // make code useable for older browsers
import { login, logout } from "./login";
import { displayMap } from "./mapbox";
import { updateSettings } from "./updateSettings";
import { bookTour } from "./stripe";

// DOM elements
const loginForm = document.querySelector(".form--login");
const mapBox = document.getElementById("map");
const logoutBtn = document.querySelector(".nav__el--logout");
const userDataForm = document.querySelector(".form-user-data");
const userPasswordForm = document.querySelector(".form-user-password");
const bookBtn = document.getElementById("book-tour");

if (mapBox) {
  const locations = JSON.parse(mapBox.dataset.locations);
  displayMap(locations);
}

if (loginForm) {
  loginForm.addEventListener("submit", (e) => {
    e.preventDefault();
    const email = document.getElementById("email").value;
    const password = document.getElementById("password").value;
    login(email, password);
  });
}

if (logoutBtn) {
  logoutBtn.addEventListener("click", logout);
}

if (userDataForm) {
  userDataForm.addEventListener("submit", (e) => {
    e.preventDefault();
    const name = document.getElementById("name").value;
    const email = document.getElementById("email").value;
    const photo = document.getElementById("photo");

    const formData = new FormData();
    formData.append("name", name);
    formData.append("email", email);
    formData.append("photo", photo.files[0]);
    // console.log(Object.fromEntries(formData.entries()));

    updateSettings(formData, "data");
  });
}

const userImgEl = document.querySelector(".form__user-photo");
const userImgInputEl = document.querySelector("#photo");

const handleDisplayUserPhoto = (e) => {
  const imgFile = e.target.files?.[0];

  if (!imgFile?.type.startsWith("image/")) return;
  const reader = new FileReader();

  reader.addEventListener("load", () => {
    userImgEl.setAttribute("src", reader.result);
  });

  reader.readAsDataURL(imgFile);
};

if (userImgInputEl) {
  userImgInputEl.addEventListener("change", handleDisplayUserPhoto);
}

if (userPasswordForm) {
  userPasswordForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    const btnSavePassword = document.querySelector(".btn--save-password");
    const passwordCurrent = document.getElementById("password-current");
    const password = document.getElementById("password");
    const passwordConfirm = document.getElementById("password-confirm");

    btnSavePassword.textContent = "Updating...";
    await updateSettings(
      {
        passwordCurrent: passwordCurrent.value,
        password: password.value,
        passwordConfirm: passwordConfirm.value,
      },
      "password"
    );
    btnSavePassword.textContent = "Save password";
    passwordCurrent.value = "";
    password.value = "";
    passwordConfirm.value = "";
  });
}

console.log(bookBtn);
if (bookBtn)
  bookBtn.addEventListener("click", (e) => {
    e.target.textContent = "Processing...";
    const { tourId } = e.target.dataset;
    bookTour(tourId);
  });

// if (bookBtn) {
//   console.log(bookBtn);
//   console.log("bookingout");
//   bookBtn.addEventListener("click", async (e) => {
//     console.log("bookingin");
//     e.target.textContent = "Processing...";
//     const { tourId } = e.target.dataset; // the data-tour-id will be converted to a property of camelCase of dataset object like dataset{tourId:value}
//     await bookTour(tourId);
//   });
// }
