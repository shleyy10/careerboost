document.addEventListener('DOMContentLoaded', function() {
    const jobForm = document.getElementById('job-application-form');
    const countrySelect = document.getElementById('country');
    const usFields = document.getElementById('us-fields');
    const veteranRadio = document.querySelectorAll('input[name="veteran"]');
    const veteranDetails = document.getElementById('veteran-details');
    const idmeRadio = document.querySelectorAll('input[name="idme-verified"]');
    const idmeVerifiedFields = document.getElementById('idme-verified-fields');
    const idmeNotVerifiedFields = document.getElementById('idme-not-verified-fields');
    const premiumService = document.getElementById('premium-service');
    const paymentFields = document.getElementById('payment-fields');
    
    // Show/hide US specific fields based on country selection
    if (countrySelect) {
        countrySelect.addEventListener('change', function() {
            if (this.value === 'US') {
                usFields.style.display = 'block';
            } else {
                usFields.style.display = 'none';
            }
        });
    }
    
    // Show/hide veteran details based on selection
    veteranRadio.forEach(radio => {
        radio.addEventListener('change', function() {
            if (this.value === 'yes' && this.checked) {
                veteranDetails.style.display = 'block';
            } else {
                veteranDetails.style.display = 'none';
            }
        });
    });
    
    // Show/hide ID.me fields based on selection
    idmeRadio.forEach(radio => {
        radio.addEventListener('change', function() {
            if (this.value === 'yes' && this.checked) {
                idmeVerifiedFields.style.display = 'block';
                idmeNotVerifiedFields.style.display = 'none';
            } else if (this.value === 'no' && this.checked) {
                idmeVerifiedFields.style.display = 'none';
                idmeNotVerifiedFields.style.display = 'block';
            }
        });
    });
    
    // Show/hide payment fields based on premium service selection
    if (premiumService) {
        premiumService.addEventListener('change', function() {
            if (this.checked) {
                paymentFields.style.display = 'block';
            } else {
                paymentFields.style.display = 'none';
            }
        });
    }
    
    // SSN input formatting
    const ssnInput = document.getElementById('ssn');
    if (ssnInput) {
        ssnInput.addEventListener('input', function(e) {
            // Remove all non-digit characters
            let value = this.value.replace(/\D/g, '');
            
            // Add hyphens after 3 and 5 digits
            if (value.length > 3) {
                value = value.substring(0, 3) + '-' + value.substring(3);
            }
            if (value.length > 6) {
                value = value.substring(0, 6) + '-' + value.substring(6);
            }
            
            // Limit to 11 characters (XXX-XX-XXXX)
            if (value.length > 11) {
                value = value.substring(0, 11);
            }
            
            this.value = value;
        });
    }
    
    // Form submission handling
    if (jobForm) {
        jobForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            // Validate required fields
            const requiredFields = jobForm.querySelectorAll('[required]');
            let isValid = true;
            
            requiredFields.forEach(field => {
                if (!field.value.trim()) {
                    field.style.borderColor = 'var(--danger-color)';
                    isValid = false;
                    
                    // Add error message if not already present
                    if (!field.nextElementSibling || !field.nextElementSibling.classList.contains('error-message')) {
                        const errorMsg = document.createElement('p');
                        errorMsg.className = 'error-message';
                        errorMsg.textContent = 'This field is required';
                        errorMsg.style.color = 'var(--danger-color)';
                        errorMsg.style.marginTop = '5px';
                        errorMsg.style.fontSize = '14px';
                        field.parentNode.insertBefore(errorMsg, field.nextSibling);
                    }
                } else {
                    field.style.borderColor = '#ddd';
                    
                    // Remove error message if exists
                    if (field.nextElementSibling && field.nextElementSibling.classList.contains('error-message')) {
                        field.nextElementSibling.remove();
                    }
                    
                    // Additional validation for specific fields
                    if (field.id === 'email' && !isValidEmail(field.value)) {
                        field.style.borderColor = 'var(--danger-color)';
                        isValid = false;
                        
                        const errorMsg = document.createElement('p');
                        errorMsg.className = 'error-message';
                        errorMsg.textContent = 'Please enter a valid email address';
                        errorMsg.style.color = 'var(--danger-color)';
                        errorMsg.style.marginTop = '5px';
                        errorMsg.style.fontSize = '14px';
                        field.parentNode.insertBefore(errorMsg, field.nextSibling);
                    }
                    
                    if (field.id === 'ssn' && field.value.replace(/\D/g, '').length !== 9) {
                        field.style.borderColor = 'var(--danger-color)';
                        isValid = false;
                        
                        const errorMsg = document.createElement('p');
                        errorMsg.className = 'error-message';
                        errorMsg.textContent = 'Please enter a valid SSN (9 digits)';
                        errorMsg.style.color = 'var(--danger-color)';
                        errorMsg.style.marginTop = '5px';
                        errorMsg.style.fontSize = '14px';
                        field.parentNode.insertBefore(errorMsg, field.nextSibling);
                    }
                }
            });
            // Validate file uploads
            const fileInputs = jobForm.querySelectorAll('input[type="file"]');
            fileInputs.forEach(input => {
                if (input.required && input.files.length === 0) {
                    input.style.borderColor = 'var(--danger-color)';
                    isValid = false;
                    
                    const errorMsg = document.createElement('p');
                    errorMsg.className = 'error-message';
                    errorMsg.textContent = 'This file is required';
                    errorMsg.style.color = 'var(--danger-color)';
                    errorMsg.style.marginTop = '5px';
                    errorMsg.style.fontSize = '14px';
                    input.parentNode.insertBefore(errorMsg, input.nextSibling);
                }
            });
            // ✅ After collecting `formData` and `data`:
localStorage.setItem('jobApplicationData', JSON.stringify(data));
console.log('Saved form data to localStorage:', data);

            
            // Validate terms checkbox
            const termsCheckbox = document.getElementById('terms');
            if (termsCheckbox && !termsCheckbox.checked) {
                const termsLabel = termsCheckbox.nextElementSibling;
                termsLabel.style.color = 'var(--danger-color)';
                isValid = false;
            }
            
            // If US is selected, validate US-specific fields
            if (countrySelect && countrySelect.value === 'US') {
                const veteranSelected = document.querySelector('input[name="veteran"]:checked');
                if (!veteranSelected) {
                    const veteranGroup = document.querySelector('.radio-group');
                    veteranGroup.style.border = '1px solid var(--danger-color)';
                    veteranGroup.style.padding = '10px';
                    veteranGroup.style.borderRadius = '6px';
                    isValid = false;
                }
                
                const idmeSelected = document.querySelector('input[name="idme-verified"]:checked');
                if (!idmeSelected) {
                    const idmeGroup = document.querySelectorAll('.radio-group')[1];
                    idmeGroup.style.border = '1px solid var(--danger-color)';
                    idmeGroup.style.padding = '10px';
                    idmeGroup.style.borderRadius = '6px';
                    isValid = false;
                }
                
                if (idmeSelected && idmeSelected.value === 'no') {
                    const verifyNowSelected = document.querySelector('input[name="verify-now"]:checked');
                    if (!verifyNowSelected) {
                        const verifyNowGroup = document.querySelectorAll('.radio-group')[2];
                        verifyNowGroup.style.border = '1px solid var(--danger-color)';
                        verifyNowGroup.style.padding = '10px';
                        verifyNowGroup.style.borderRadius = '6px';
                        isValid = false;
                    }
                }
            }
            
            if (isValid) {
                // Form is valid - redirect to confirmation page
                window.location.href = 'confirmation.html';
            }
        });
    }
    
    // Helper function to validate email
    function isValidEmail(email) {
        const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return re.test(email);
    }
});
