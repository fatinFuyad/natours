/* eslint-disable */
import axios from "axios";
import { showAlert } from "./alerts";
// import { loadStripe } from "@stripe/stripe-js";

export const bookTour = async (tourId) => {
  // const stripe = await loadStripe(
  //   "pk_test_51St8c5LkPebK8tsmOL6G0LlDkAnK6cwsnfKAX5arbH8Ddb1jWL001WWQ6CfSu06ZQS9RGKl6KnzvrovLEFtirp8800E4lQewH6"
  // );

  try {
    // 1) Get Checkout session
    const response = await axios.get(
      `http://127.0.0.1:8000/api/v1/bookings/checkout-session/${tourId}`
    );
    const session = response.data.session;

    // 2) Redirect to checkout form

    location.assign(session.url);
    // deprecated
    // await stripe.redirectToCheckout({
    //   sessionId: session.id,
    // });
  } catch (err) {
    console.log(err);
    showAlert("error");
  }
};

// /*eslint-disable*/
// import axios from "axios";
// import { showAlert } from "./alerts";
//import { loadStripe } from "@stripe/stripe-js";

// export const bookTour = async function (tourId) {
//   try {
//     const response = await axios(
//       `http://127.0.0.1:8000/api/v1/bookings/checkout-session/${tourId}`
//     );

//     console.log(response);
//     await stripe.redirectToCheckout({
//       sessionId: response.data.session.id,
//     });
//   } catch (error) {
//     console.log(error);
//     showAlert;
//   }
// };
