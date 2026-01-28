/* eslint-disable */
import axios from "axios";
import { showAlert } from "./alerts";

export async function login(email, password) {
  try {
    const res = await axios({
      method: "POST",
      url: "http://127.0.0.1:8000/api/v1/users/login",
      headers: {
        withCredentials: true,
      },
      data: {
        email,
        password,
      },
    });
    if (res.data.status === "success") {
      showAlert("success", "Logged in successfully!");
      setTimeout(() => {
        location.replace("/");
      }, 1500);
    }
  } catch (error) {
    showAlert("error", error.response.data.message);
    // console.log(error.response.data);
  }
}

export async function logout() {
  try {
    const res = await axios({
      method: "GET",
      url: "http://127.0.0.1:8000/api/v1/users/logout",
    });

    if (res.data.status === "success") {
      showAlert("success", "Successfully logged out!");
      location.replace("/");
      // location.reload(true); // true - for reloading from server not just normal reload
    }
  } catch (error) {
    showAlert("error", "Error while logging out! Please try again.");
  }
}
