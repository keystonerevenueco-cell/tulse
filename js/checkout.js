// ==========================
// STRIPE CHECKOUT INTEGRATION - TEST MODE
// ==========================

const STRIPE_PAYMENT_LINKS = {
    // LEAD INTELLIGENCE PACKAGES - TEST MODE
    'lead-intelligence-standard': 'https://buy.stripe.com/test_eVqfZgbzNboe2d96bX5Ne00',
    'lead-intelligence-growth': 'https://buy.stripe.com/test/YOUR_TEST_LINK_HERE',
    'lead-intelligence-professional': 'https://buy.stripe.com/test/YOUR_TEST_LINK_HERE',
    
    // CONTENT PRODUCTION PACKAGES - TEST MODE
    'content-remote-one-time': 'https://buy.stripe.com/test/YOUR_TEST_LINK_HERE',
    'content-remote-monthly': 'https://buy.stripe.com/test/YOUR_TEST_LINK_HERE',
    'content-onsite-one-time': 'https://buy.stripe.com/test/YOUR_TEST_LINK_HERE',
    'content-onsite-monthly': 'https://buy.stripe.com/test/YOUR_TEST_LINK_HERE'
};

// ==========================
// REDIRECT TO STRIPE CHECKOUT
// ==========================

function redirectToCheckout(packageKey) {
    const paymentLink = STRIPE_PAYMENT_LINKS[packageKey];
    
    if (!paymentLink) {
        console.error('Payment link not found for:', packageKey);
        alert('Payment link not found. Please contact support.');
        return;
    }
    
    // Store the package information for the onboarding page
    localStorage.setItem('tulse_package', packageKey);
    localStorage.setItem('tulse_purchase_time', new Date().toISOString());
    
    // Generate a unique session ID
    const sessionId = 'tulse_' + Date.now() + '_' + Math.random().toString(36).substr(2, 6);
    localStorage.setItem('tulse_session_id', sessionId);
    
    // Redirect to Stripe Checkout
    window.location.href = paymentLink;
}

// ==========================
// CHECK IF USER JUST COMPLETED PAYMENT
// ==========================

function checkForPaymentSuccess() {
    const urlParams = new URLSearchParams(window.location.search);
    const sessionId = urlParams.get('session_id');
    const success = urlParams.get('success');
    
    if (success === 'true' && sessionId) {
        // Payment successful - mark as verified and redirect to onboarding
        localStorage.setItem('tulse_payment_verified', 'true');
        localStorage.setItem('tulse_session_id', sessionId);
        setTimeout(() => {
            window.location.href = 'https://tulse.agency/client-onboarding.html?session_id=' + sessionId;
        }, 1500);
    }
}

// Run on page load if we're on a page with success params
document.addEventListener('DOMContentLoaded', function() {
    checkForPaymentSuccess();
});