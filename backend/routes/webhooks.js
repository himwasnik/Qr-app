const express = require('express');
const { query } = require('../db');
const { constructWebhookEvent } = require('../utils/stripe');

const router = express.Router();

// POST /api/webhooks/stripe - Handle Stripe webhook events
// IMPORTANT: This endpoint must use raw body (not JSON parsed)
router.post('/stripe', express.raw({ type: 'application/json' }), async (req, res) => {
  const sig = req.headers['stripe-signature'];

  try {
    // Construct and verify webhook event
    const event = constructWebhookEvent(req.body, sig);

    console.log('Received Stripe webhook:', event.type);

    // Handle different event types
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object;

        // Update subscription status when checkout is completed
        if (session.mode === 'subscription') {
          await query(
            `UPDATE restaurants
             SET stripe_subscription_id = $1, subscription_status = 'active'
             WHERE stripe_customer_id = $2`,
            [session.subscription, session.customer]
          );

          console.log(`Subscription activated for customer: ${session.customer}`);
        }
        break;
      }

      case 'invoice.payment_succeeded': {
        const invoice = event.data.object;

        // Update subscription status to active
        await query(
          `UPDATE restaurants
           SET subscription_status = 'active'
           WHERE stripe_customer_id = $1`,
          [invoice.customer]
        );

        // Log event
        const restaurantResult = await query(
          'SELECT id FROM restaurants WHERE stripe_customer_id = $1',
          [invoice.customer]
        );

        if (restaurantResult.rows.length > 0) {
          await query(
            `INSERT INTO subscription_events (restaurant_id, event_type, stripe_event_id, data)
             VALUES ($1, $2, $3, $4)`,
            [restaurantResult.rows[0].id, event.type, event.id, JSON.stringify(invoice)]
          );
        }

        console.log(`Payment succeeded for customer: ${invoice.customer}`);
        break;
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object;

        // Update subscription status to past_due
        await query(
          `UPDATE restaurants
           SET subscription_status = 'past_due'
           WHERE stripe_customer_id = $1`,
          [invoice.customer]
        );

        // Log event
        const restaurantResult = await query(
          'SELECT id FROM restaurants WHERE stripe_customer_id = $1',
          [invoice.customer]
        );

        if (restaurantResult.rows.length > 0) {
          await query(
            `INSERT INTO subscription_events (restaurant_id, event_type, stripe_event_id, data)
             VALUES ($1, $2, $3, $4)`,
            [restaurantResult.rows[0].id, event.type, event.id, JSON.stringify(invoice)]
          );
        }

        console.log(`Payment failed for customer: ${invoice.customer}`);
        break;
      }

      case 'customer.subscription.updated': {
        const subscription = event.data.object;

        // Map Stripe status to our status
        let status = 'inactive';
        if (subscription.status === 'active') status = 'active';
        else if (subscription.status === 'past_due') status = 'past_due';
        else if (subscription.status === 'canceled') status = 'canceled';

        await query(
          `UPDATE restaurants
           SET subscription_status = $1
           WHERE stripe_customer_id = $2`,
          [status, subscription.customer]
        );

        console.log(`Subscription updated for customer: ${subscription.customer}, status: ${status}`);
        break;
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object;

        // Update subscription status to canceled
        await query(
          `UPDATE restaurants
           SET subscription_status = 'canceled'
           WHERE stripe_customer_id = $1`,
          [subscription.customer]
        );

        // Log event
        const restaurantResult = await query(
          'SELECT id FROM restaurants WHERE stripe_customer_id = $1',
          [subscription.customer]
        );

        if (restaurantResult.rows.length > 0) {
          await query(
            `INSERT INTO subscription_events (restaurant_id, event_type, stripe_event_id, data)
             VALUES ($1, $2, $3, $4)`,
            [restaurantResult.rows[0].id, event.type, event.id, JSON.stringify(subscription)]
          );
        }

        console.log(`Subscription canceled for customer: ${subscription.customer}`);
        break;
      }

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    // Return 200 to acknowledge receipt
    res.json({ received: true });
  } catch (error) {
    console.error('Webhook error:', error);
    return res.status(400).send(`Webhook Error: ${error.message}`);
  }
});

module.exports = router;
