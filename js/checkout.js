// ==========================
// STRIPE CHECKOUT INTEGRATION
// ==========================

const STRIPE_PAYMENT_LINKS = {
    // LEAD INTELLIGENCE PACKAGES
    'lead-intelligence-standard': 'https://buy.stripe.com/eVqfZgbzNboe2d96bX5Ne00',
    'lead-intelligence-growth': 'https://buy.stripe.com/6oU4gyavJ8c27xteIt5Ne02',
    'lead-intelligence-professional': 'https://buy.stripe.com/6oU4gyavJ8c27xteIt5Ne02',
    
    // CONTENT PRODUCTION PACKAGES
    'content-remote-one-time': 'https://buy.stripe.com/6oUbJ07jx2RI7xt2ZL5Ne03',
    'content-remote-monthly': 'https://buy.stripe.com/4gMcN4dHVboedVR43P5Ne04',
    'content-onsite-one-time': 'https://buy.stripe.com/14A00iavJ77YaJFdEp5Ne05',
    'content-onsite-monthly': 'https://buy.stripe.com/aFa4gy5bp8c23hdcAl5Ne06'
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
            window.location.href = '/client-onboarding.html?session_id=' + sessionId;
        }, 1500);
    }
}

// Run on page load if we're on a page with success params
document.addEventListener('DOMContentLoaded', function() {
    checkForPaymentSuccess();
});