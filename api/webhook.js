// ==========================
// STRIPE WEBHOOK - VERCEL SERVERLESS
// ==========================

export default async function handler(req, res) {
    // Only allow POST requests
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    // For Vercel, we need to get the raw body
    const rawBody = req.body;
    
    // If you're using Vercel's built-in body parser, you may need to use:
    // const rawBody = JSON.stringify(req.body);
    
    const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
    const sig = req.headers['stripe-signature'];
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

    let event;

    try {
        // Construct the event with raw body
        event = stripe.webhooks.constructEvent(rawBody, sig, webhookSecret);
    } catch (err) {
        console.error('Webhook signature verification failed:', err.message);
        return res.status(400).json({ error: 'Webhook signature verification failed' });
    }

    // Handle successful payment
    if (event.type === 'checkout.session.completed') {
        const session = event.data.object;
        const customerEmail = session.customer_details.email;
        const customerName = session.customer_details.name || 'Customer';
        const packageId = session.metadata?.package_id || 'standard';

        // Build the onboarding link
        const onboardingLink = `https://tulse.vercel.app/client-onboarding.html?session_id=${session.id}`;

        // Send email using Web3Forms
        const emailData = {
            access_key: process.env.WEB3FORMS_KEY || '52800e16-01d7-49bb-a37b-b7e9ab0a0596',
            subject: 'Welcome to Tulse! Complete Your Onboarding',
            from_name: 'Tulse Team',
            email: customerEmail,
            message: `
Hello ${customerName},

Thank you for purchasing Tulse services! Your payment has been confirmed.

Click the link below to complete your onboarding and access your client portal:

${onboardingLink}

If you have any questions, reply to this email or contact us at contact.tulse@gmail.com

Best regards,
Tulse Team
            `
        };

        try {
            await fetch('https://api.web3forms.com/submit', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(emailData)
            });
            console.log('Welcome email sent to:', customerEmail);
        } catch (error) {
            console.error('Failed to send email:', error);
        }
    }

    res.status(200).json({ received: true });
}