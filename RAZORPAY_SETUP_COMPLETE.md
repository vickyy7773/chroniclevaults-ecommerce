# 🎉 Razorpay Setup - Complete Guide

## ✅ What's Done:

### Backend (100% Complete):
- ✅ Payment controller with all handlers
- ✅ Webhook controller for automatic updates
- ✅ Routes configured
- ✅ Order model updated
- ✅ .env files ready

### Frontend (95% Complete):
- ✅ Payment service created
- ✅ Razorpay script loader added
- ⚠️ Manual UI update needed (see below)

---

## 📋 Step-by-Step Setup

### **Step 1: Get Razorpay API Keys**

1. **Go to Razorpay Dashboard**
   - URL: https://dashboard.razorpay.com/
   - Sign up with email/phone

2. **Navigate to API Keys**
   - Dashboard → Settings → **API Keys**

3. **Generate Test Keys** (for development)
   - Click "Generate Test Keys"
   - Copy:
     ```
     Key ID: rzp_test_xxxxxxxxxxxxx
     Key Secret: xxxxxxxxxxxxxxxxxxxxx
     ```

4. **For Live Keys** (production - after KYC)
   - Complete KYC verification (24-48 hours)
   - Generate Live Keys
   - Replace test keys with live keys

---

### **Step 2: Setup Webhooks (Optional)**

1. **Navigate to Webhooks**
   - Dashboard → Settings → **Webhooks**

2. **Add New Webhook**
   - Webhook URL: `https://chroniclevaults.com/api/payments/webhook`
   - Active Events:
     - ✅ `payment.authorized`
     - ✅ `payment.captured`
     - ✅ `payment.failed`
     - ✅ `order.paid`

3. **Copy Webhook Secret**
   - Will be auto-generated
   - Example: `whsec_xxxxxxxxxxxxx`

---

### **Step 3: Update Environment Variables**

#### **Local Development (.env):**

```bash
# In: backend/.env

RAZORPAY_KEY_ID=rzp_test_xxxxxxxxxxxxx
RAZORPAY_KEY_SECRET=xxxxxxxxxxxxxxxxxxxxx
RAZORPAY_WEBHOOK_SECRET=whsec_xxxxxxxxxxxxx
```

#### **Production Server:**

```bash
# SSH to server
ssh root@72.60.202.163

# Navigate to backend
cd /home/chroniclevaults.com/app/backend

# Edit .env file
nano .env

# Update these lines (replace with actual values):
RAZORPAY_KEY_ID=rzp_test_xxxxxxxxxxxxx
RAZORPAY_KEY_SECRET=xxxxxxxxxxxxxxxxxxxxx
RAZORPAY_WEBHOOK_SECRET=whsec_xxxxxxxxxxxxx

# Save: Ctrl+O, Enter, Ctrl+X

# Restart backend
pm2 restart all

# Check logs
pm2 logs
```

You should see:
```
✅ Razorpay payment gateway enabled
```

---

### **Step 4: Frontend Update (Manual)**

Update `src/pages/Checkout.jsx`:

#### **A) Add Razorpay Payment Option (around line 837-850):**

Find the payment options section and add this **after** the COD option:

```jsx
{/* Razorpay Payment Option */}
<label className={`flex items-center p-4 border-2 rounded-lg cursor-pointer transition-all ${
  formData.paymentMethod === 'razorpay' ? 'border-amber-500 bg-amber-50' : 'border-gray-200'
}`}>
  <input
    type="radio"
    name="paymentMethod"
    value="razorpay"
    checked={formData.paymentMethod === 'razorpay'}
    onChange={handleInputChange}
    className="w-4 h-4 text-amber-600 focus:ring-amber-500"
  />
  <div className="ml-3">
    <div className="font-medium">Pay Online via Razorpay</div>
    <div className="text-sm text-gray-500">Cards, UPI, Netbanking, Wallets</div>
  </div>
</label>
```

#### **B) Add Razorpay Handler Function (before handlePlaceOrder, around line 363):**

```javascript
const handleRazorpayPayment = async (orderData, createdOrder) => {
  try {
    // Create Razorpay order
    const razorpayOrderResponse = await paymentService.createRazorpayOrder(total);

    if (!razorpayOrderResponse.success) {
      throw new Error('Failed to create payment order');
    }

    const { orderId: razorpayOrderId, amount, currency, keyId } = razorpayOrderResponse.data;

    const options = {
      key: keyId,
      amount: amount,
      currency: currency,
      name: 'ChronicleVaults',
      description: 'Order Payment',
      image: 'https://chroniclevaults.com/logo.png', // Optional: Add your logo
      order_id: razorpayOrderId,
      handler: async function (response) {
        try {
          // Verify payment
          const verificationData = {
            razorpay_order_id: response.razorpay_order_id,
            razorpay_payment_id: response.razorpay_payment_id,
            razorpay_signature: response.razorpay_signature,
            orderId: createdOrder._id
          };

          const verifyResponse = await paymentService.verifyPayment(verificationData);

          if (verifyResponse.success) {
            setOrderId(createdOrder._id);
            setOrderPlaced(true);
            localStorage.removeItem('cart');
            console.log('✅ Payment successful');
          } else {
            alert('Payment verification failed. Please contact support.');
          }
        } catch (error) {
          console.error('Payment verification error:', error);
          alert('Payment verification failed: ' + error.message);
        }
      },
      prefill: {
        name: formData.fullName,
        email: formData.email,
        contact: formData.phone
      },
      theme: {
        color: '#D97706' // Amber color
      },
      modal: {
        ondismiss: async function() {
          await paymentService.handlePaymentFailure(createdOrder._id, {
            description: 'Payment cancelled by user'
          });
          alert('Payment cancelled');
        }
      }
    };

    const razorpay = new window.Razorpay(options);

    razorpay.on('payment.failed', async function (response) {
      await paymentService.handlePaymentFailure(createdOrder._id, response.error);
      alert('Payment failed: ' + response.error.description);
    });

    razorpay.open();
  } catch (error) {
    console.error('Razorpay payment error:', error);
    alert('Failed to initiate payment: ' + error.message);
  }
};
```

#### **C) Update handlePlaceOrder (around line 426):**

Change:
```javascript
paymentMethod: formData.paymentMethod === 'cod' ? 'COD' : 'Card',
```

To:
```javascript
paymentMethod: formData.paymentMethod === 'cod' ? 'COD' :
               formData.paymentMethod === 'razorpay' ? 'Razorpay' : 'Card',
```

#### **D) Update Order Success Handler (around line 439-443):**

Change:
```javascript
if (response && response.data && response.data.success) {
  setOrderId(response.data.data._id);
  setOrderPlaced(true);
  localStorage.removeItem('cart');
  console.log('✅ Order created successfully:', response.data.data);
}
```

To:
```javascript
if (response && response.data && response.data.success) {
  const createdOrder = response.data.data;

  // If Razorpay payment, initiate payment gateway
  if (formData.paymentMethod === 'razorpay') {
    await handleRazorpayPayment(orderData, createdOrder);
  } else {
    // For COD, directly show success
    setOrderId(createdOrder._id);
    setOrderPlaced(true);
    localStorage.removeItem('cart');
    console.log('✅ Order created successfully:', createdOrder);
  }
}
```

---

## 🧪 Testing

### **Test Mode Credentials:**

Use these test cards in Razorpay checkout:

**Success Card:**
```
Card Number: 4111 1111 1111 1111
CVV: 123
Expiry: 12/25 (any future date)
Name: Test User
```

**UPI (Test):**
```
UPI ID: success@razorpay
```

**Other Test Cards:**
- Visa: `4111 1111 1111 1111`
- Mastercard: `5555 5555 5555 4444`
- Amex: `3782 822463 10005`

**Test Flow:**
1. Add products to cart
2. Go to checkout
3. Fill shipping address
4. Select "Pay Online via Razorpay"
5. Click "Place Order"
6. Razorpay popup opens
7. Enter test card details
8. Payment succeeds
9. Order shows as "Paid"

---

## 📊 API Endpoints Available:

```
GET  /api/payments/razorpay-key          - Get Razorpay public key
POST /api/payments/create-order          - Create Razorpay order
POST /api/payments/verify-payment        - Verify payment signature
POST /api/payments/payment-failed        - Handle payment failure
POST /api/payments/webhook               - Razorpay webhook handler
```

---

## 🔒 Security Features:

- ✅ Payment signature verification (HMAC SHA256)
- ✅ Server-side validation
- ✅ Webhook signature verification
- ✅ Protected API endpoints
- ✅ Key Secret never exposed to frontend

---

## 🚀 Going Live:

1. **Complete KYC on Razorpay**
   - Submit PAN, address proof, bank details
   - Wait 24-48 hours for approval

2. **Generate Live Keys**
   - Dashboard → Settings → API Keys → Generate Live Keys

3. **Update Production .env**
   ```env
   RAZORPAY_KEY_ID=rzp_live_xxxxxxxxxxxxx
   RAZORPAY_KEY_SECRET=live_key_secret_here
   ```

4. **Update Webhook URL** (if using webhooks)
   - Change to production domain

5. **Test with Small Real Payment**
   - Test with ₹1 or ₹10 first

6. **Monitor Transactions**
   - Dashboard → Transactions

---

## 📞 Support:

**Razorpay:**
- Docs: https://razorpay.com/docs/
- Support: support@razorpay.com
- Dashboard: https://dashboard.razorpay.com/

**Test Environment:**
- All test transactions visible in dashboard
- No real money charged

---

## ✅ Checklist:

- [ ] Razorpay account created
- [ ] Test API keys generated
- [ ] Keys added to .env (local)
- [ ] Keys added to .env (production server)
- [ ] Backend restarted (`pm2 restart all`)
- [ ] Webhook configured (optional)
- [ ] Frontend UI updated (`Checkout.jsx`)
- [ ] Test payment successful
- [ ] Ready for production!

---

**Need help? Batao kaunsa step mein problem aa raha hai!** 🚀
