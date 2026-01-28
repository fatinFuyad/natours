/* eslint-disable */
import axios from "axios";
import { showAlert } from "./alerts";

export async function updateSettings(data, type) {
  try {
    const url =
      type === "password"
        ? "http://127.0.0.1:8000/api/v1/users/updateMyPassword"
        : "http://127.0.0.1:8000/api/v1/users/updateMe";
    const res = await axios({
      method: "PATCH",
      url,
      data,
    });

    if (res.data.status === "success") {
      showAlert(
        "success",
        `${type[0].toUpperCase()}${type.slice(1)} updated successfully!`
      );
    }
  } catch (error) {
    showAlert("error", error.response.data.message);
  }
}
