const stripe = Stripe('pk_test_51MVdpkSJhdB9b5AoOgBpZbvutOE1wtGw74pY6Mn99N14JAFX0ZNS0Rxubxd3JFQeMYZIvpTjnik8Hp0ZWUgFSvum00hGYE2gtp');
import axios from 'axios';

export const bookTour = async tourId => {
    // 1) Get the checkout session from API
    const session =  await axios(`/api/v1/bookings/checkout-session/${tourId}`);
    // console.log(session);

    
    // 2) Create checkout form + charge the credit card for us
};