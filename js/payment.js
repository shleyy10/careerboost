// Payment method selection functionality
document.addEventListener('DOMContentLoaded', function() {
    const paymentMethods = document.querySelectorAll('input[name="payment-method"]');
    const paymentDetails = document.querySelectorAll('.payment-details');
    
    if (paymentMethods.length > 0) {
        // Show the initially selected payment method details
        const initiallySelected = document.querySelector('input[name="payment-method"]:checked');
        if (initiallySelected) {
            const selectedId = initiallySelected.id + '-details';
            document.getElementById(selectedId).style.display = 'block';
        }
        
        // Handle payment method changes
        paymentMethods.forEach(method => {
            method.addEventListener('change', function() {
                // Hide all payment details
                paymentDetails.forEach(detail => {
                    detail.style.display = 'none';
                });
                
                // Show the selected payment details
                const selectedId = this.id + '-details';
                document.getElementById(selectedId).style.display = 'block';
            });
        });
    }
    
    // Credit card input formatting
    const cardNumber = document.getElementById('card-number');
    const cardExpiry = document.getElementById('card-expiry');
    const cardCvc = document.getElementById('card-cvc');
    
    if (cardNumber) {
        cardNumber.addEventListener('input', function(e) {
            // Remove all non-digit characters
            let value = this.value.replace(/\D/g, '');
            
            // Add space after every 4 digits
            value = value.replace(/(\d{4})(?=\d)/g, '$1 ');
            
            // Limit to 16 digits + 3 spaces
            if (value.length > 19) {
                value = value.substring(0, 19);
            }
            
            this.value = value;
        });
    }
    
    if (cardExpiry) {
        cardExpiry.addEventListener('input', function(e) {
            // Remove all non-digit characters
            let value = this.value.replace(/\D/g, '');
            
            // Add slash after 2 digits
            if (value.length > 2) {
                value = value.substring(0, 2) + '/' + value.substring(2);
            }
            
            // Limit to 5 characters (MM/YY)
            if (value.length > 5) {
                value = value.substring(0, 5);
            }
            
            this.value = value;
        });
    }
    
    if (cardCvc) {
        cardCvc.addEventListener('input', function(e) {
            // Remove all non-digit characters
            let value = this.value.replace(/\D/g, '');
            
            // Limit to 4 digits (some cards have 3, some have 4)
            if (value.length > 4) {
                value = value.substring(0, 4);
            }
            
            this.value = value;
        });
    }
    
    // Payment form submission
    const paymentForm = document.getElementById('premium-payment-form');
    if (paymentForm) {
        paymentForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            // Validate form
            let isValid = true;
            
            // Validate plan selection
            const planSelection = document.getElementById('plan-selection');
            if (!planSelection.value) {
                planSelection.style.borderColor = 'var(--danger-color)';
                isValid = false;
            } else {
                planSelection.style.borderColor = '#ddd';
            }
            
            // Validate terms checkbox
            const paymentTerms = document.getElementById('payment-terms');
            if (!paymentTerms.checked) {
                const termsLabel = paymentTerms.nextElementSibling;
                termsLabel.style.color = 'var(--danger-color)';
                isValid = false;
            }
            
            // Validate credit card details if that payment method is selected
            const creditCardMethod = document.getElementById('credit-card');
            if (creditCardMethod.checked) {
                if (!cardNumber.value || cardNumber.value.replace(/\s/g, '').length !== 16) {
                    cardNumber.style.borderColor = 'var(--danger-color)';
                    isValid = false;
                } else {
                    cardNumber.style.borderColor = '#ddd';
                }
                
                if (!cardExpiry.value || cardExpiry.value.length !== 5) {
                    cardExpiry.style.borderColor = 'var(--danger-color)';
                    isValid = false;
                } else {
                    cardExpiry.style.borderColor = '#ddd';
                }
                
                if (!cardCvc.value || cardCvc.value.length < 3) {
                    cardCvc.style.borderColor = 'var(--danger-color)';
                    isValid = false;
                } else {
                    cardCvc.style.borderColor = '#ddd';
                }
                
                const cardName = document.getElementById('card-name');
                if (!cardName.value.trim()) {
                    cardName.style.borderColor = 'var(--danger-color)';
                    isValid = false;
                } else {
                    cardName.style.borderColor = '#ddd';
                }
            }
            
            if (isValid) {
                // Form is valid - process payment (in a real app, you would integrate with a payment processor)
                const selectedPlan = document.getElementById('plan-selection').value;
                let planName = '';
                let amount = '';
                
                switch(selectedPlan) {
                    case 'basic':
                        planName = 'Basic Boost';
                        amount = '$97';
                        break;
                    case 'professional':
                        planName = 'Professional Boost';
                        amount = '$197';
                        break;
                    case 'executive':
                        planName = 'Executive Boost';
                        amount = '$397';
                        break;
                }
                
                alert(`Payment processed successfully for ${planName} (${amount})! Our team will contact you within 24 hours to begin your career boost.`);
                paymentForm.reset();
            }
        });
    }
});