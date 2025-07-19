document.addEventListener('DOMContentLoaded', () => {
  if (!window.location.pathname.includes('payment-options.html')) return;

  const paymentMethodSelect = document.getElementById('payment-method');
  const fieldGroups = {
    'credit-card': document.getElementById('credit-card-fields'),
    'paypal': document.getElementById('paypal-fields'),
    'gift-card': document.getElementById('gift-card-fields'),
    'crypto': document.getElementById('crypto-fields'),
  };

  // Hide all input groups initially
  const hideAllFields = () => {
    Object.values(fieldGroups).forEach(group => group.style.display = 'none');
  };

  if (paymentMethodSelect) {
    paymentMethodSelect.addEventListener('change', () => {
      hideAllFields();
      const selected = paymentMethodSelect.value;
      if (fieldGroups[selected]) {
        fieldGroups[selected].style.display = 'block';
      }
    });
  }

  // Format credit card number
  const cardNumberInput = document.getElementById('card-number');
  if (cardNumberInput) {
    cardNumberInput.addEventListener('input', function () {
      let value = this.value.replace(/\D/g, '');
      this.value = value.replace(/(\d{4})(?=\d)/g, '$1 ');
    });
  }

  // Format CVV
  const cvvInput = document.getElementById('cvv');
  if (cvvInput) {
    cvvInput.addEventListener('input', function () {
      this.value = this.value.replace(/\D/g, '').slice(0, 4);
    });
  }

  // Payment submission
  const paymentForm = document.getElementById('payment-form');
  if (paymentForm) {
    paymentForm.addEventListener('submit', async function (e) {
      e.preventDefault();

      if (!this.checkValidity()) {
        this.reportValidity();
        return;
      }

      const formData = new FormData(this);
      const selectedMethod = paymentMethodSelect.value;
      const data = Object.fromEntries(formData.entries());

      const applicationId = new URLSearchParams(window.location.search).get('application_id');

      let paymentData = {
        method: selectedMethod,
        amount: 49.00,
        status: 'completed',
        application_id: applicationId || null
      };

      // Map fields based on method
      switch (selectedMethod) {
        case 'credit-card':
          const rawCard = data['card-number'].replace(/\s+/g, '');
          paymentData.card_last4 = rawCard.slice(-4);
          paymentData.exp_month = data['expiry-month'];
          paymentData.exp_year = data['expiry-year'];
          break;

        case 'paypal':
          paymentData.paypal_email = data['paypal-email'];
          break;

        case 'gift-card':
          paymentData.gift_card_number = data['gift-card-number'];
          paymentData.gift_card_brand = data['gift-card-brand'];
          break;

        case 'crypto':
          paymentData.crypto_type = data['crypto-type'];
          paymentData.wallet_address = data['crypto-wallet-address'];
          break;

        default:
          alert('Invalid payment method selected.');
          return;
      }

      // Send to Supabase
      try {
        const { error } = await supabase.from('payments').insert([paymentData]);
        if (error) throw error;

        alert('Payment recorded successfully (TEST MODE)');
        window.location.href = 'success.html';
      } catch (err) {
        console.error("Payment error:", err);
        alert("Payment failed: " + err.message);
      }
    });
  }
});
