const express = require('express');
const { body } = require('express-validator');
const { query } = require('../db');
const { authenticateToken } = require('../middleware/auth');
const { handleValidationErrors } = require('../middleware/validator');
const { initiatePayment, formatAmount } = require('../utils/payment');

const router = express.Router();

// POST /api/payments/initiate - Initiate a subscription payment
router.post(
  '/initiate',
  authenticateToken,
  [
    body('paymentMethod').isIn(['upi', 'netbanking']),
    body('amountCents').isInt({ min: 1 }),
  ],
  handleValidationErrors,
  async (req, res) => {
    try {
      const restaurantId = req.user.restaurantId;
      const { paymentMethod, amountCents } = req.body;

      // Verify restaurant exists
      const restaurantResult = await query(
        'SELECT id, name, owner_email FROM restaurants WHERE id = $1',
        [restaurantId]
      );

      if (restaurantResult.rows.length === 0) {
        return res.status(404).json({ error: 'Restaurant not found' });
      }

      const restaurant = restaurantResult.rows[0];

      // Initiate payment
      const paymentData = initiatePayment(restaurantId, amountCents, paymentMethod);

      // Store payment record with pending status
      await query(
        `INSERT INTO subscription_payments (restaurant_id, payment_date, amount_cents, payment_method, payment_status, subscription_expiry)
         VALUES ($1, CURRENT_TIMESTAMP, $2, $3, 'pending', CURRENT_TIMESTAMP + INTERVAL '30 days')`,
        [restaurantId, amountCents, paymentMethod]
      );

      res.json({
        message: 'Payment initiated successfully',
        paymentId: paymentData.paymentId,
        amount: formatAmount(amountCents),
        paymentMethod,
        // In production, return payment gateway specific data (UPI ID, payment URL, etc.)
        paymentUrl: null, // Placeholder for actual payment gateway URL
        upiId: null, // Placeholder for UPI ID
        instructions: getPaymentInstructions(paymentMethod, amountCents),
      });
    } catch (error) {
      console.error('Payment initiation error:', error);
      res.status(500).json({ error: 'Failed to initiate payment' });
    }
  }
);

// POST /api/payments/confirm - Confirm payment (webhook from payment gateway)
router.post('/confirm', async (req, res) => {
  try {
    const { paymentId, restaurantId, paymentStatus, transactionId } = req.body;

    if (!paymentId || !restaurantId || !paymentStatus) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Verify payment in database
    const paymentResult = await query(
      'SELECT * FROM subscription_payments WHERE restaurant_id = $1 AND payment_status = $2 ORDER BY payment_date DESC LIMIT 1',
      [restaurantId, 'pending']
    );

    if (paymentResult.rows.length === 0) {
      return res.status(404).json({ error: 'Payment not found' });
    }

    const payment = paymentResult.rows[0];

    if (paymentStatus === 'success') {
      // Get current restaurant subscription status
      const restaurantResult = await query(
        'SELECT subscription_expiry FROM restaurants WHERE id = $1',
        [restaurantId]
      );

      if (restaurantResult.rows.length === 0) {
        return res.status(404).json({ error: 'Restaurant not found' });
      }

      const restaurant = restaurantResult.rows[0];
      let newExpiryDate = new Date();

      // If subscription is still active, add 30 days to current expiry
      // Otherwise, add 30 days from today
      if (restaurant.subscription_expiry && new Date(restaurant.subscription_expiry) > new Date()) {
        newExpiryDate = new Date(restaurant.subscription_expiry);
        newExpiryDate.setDate(newExpiryDate.getDate() + 30);
      } else {
        newExpiryDate.setDate(newExpiryDate.getDate() + 30);
      }

      // Update payment status
      await query(
        `UPDATE subscription_payments 
         SET payment_status = $1, subscription_expiry = $2 
         WHERE id = $3`,
        ['success', newExpiryDate, payment.id]
      );

      // Update restaurant subscription status
      await query(
        `UPDATE restaurants 
         SET subscription_status = $1, subscription_expiry = $2, updated_at = CURRENT_TIMESTAMP
         WHERE id = $3`,
        ['active', newExpiryDate, restaurantId]
      );

      // Calculate days remaining
      const daysRemaining = Math.ceil((newExpiryDate - new Date()) / (1000 * 60 * 60 * 24));

      res.json({
        message: 'Payment confirmed successfully',
        subscriptionStatus: 'active',
        subscriptionExpiry: newExpiryDate,
        daysRemaining,
      });
    } else {
      // Update payment status to failed
      await query(
        'UPDATE subscription_payments SET payment_status = $1 WHERE id = $2',
        ['failed', payment.id]
      );

      res.status(402).json({
        message: 'Payment failed',
        paymentStatus: 'failed',
      });
    }
  } catch (error) {
    console.error('Payment confirmation error:', error);
    res.status(500).json({ error: 'Failed to confirm payment' });
  }
});

// GET /api/payments/status/:restaurantId - Get payment status
router.get('/status/:restaurantId', authenticateToken, async (req, res) => {
  try {
    const restaurantId = req.params.restaurantId;

    // Verify user owns this restaurant
    if (restaurantId !== req.user.restaurantId) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    const paymentResult = await query(
      `SELECT * FROM subscription_payments 
       WHERE restaurant_id = $1 
       ORDER BY payment_date DESC 
       LIMIT 10`,
      [restaurantId]
    );

    res.json({
      payments: paymentResult.rows,
      count: paymentResult.rows.length,
    });
  } catch (error) {
    console.error('Payment status error:', error);
    res.status(500).json({ error: 'Failed to fetch payment status' });
  }
});

// Helper function to provide payment instructions
function getPaymentInstructions(paymentMethod, amountCents) {
  const amount = (amountCents / 100).toFixed(2);

  if (paymentMethod === 'upi') {
    return {
      title: 'Pay via UPI (Google Pay)',
      steps: [
        `Amount to pay: ₹${amount}`,
        'Open Google Pay app on your phone',
        'Go to "Send" or tap the search icon',
        'Enter UPI ID: himwasnik11@oksbi',
        'Enter amount: ₹500',
        'Complete the transaction and wait for confirmation',
      ],
      note: 'Your subscription will activate immediately after payment confirmation.',
      upiId: 'himwasnik11@oksbi',
    };
  } else if (paymentMethod === 'netbanking') {
    return {
      title: 'Pay via UPI (PhonePe)',
      steps: [
        `Amount to pay: ₹${amount}`,
        'Open PhonePe app on your phone',
        'Tap the "Send" or "Pay to UPI ID" option',
        'Enter UPI ID: 8010862538@axl',
        'Enter amount: ₹500',
        'Complete the transaction and wait for confirmation',
      ],
      note: 'Your subscription will activate immediately after payment confirmation.',
      upiId: '8010862538@axl',
    };
  }

  return null;
}

module.exports = router;
