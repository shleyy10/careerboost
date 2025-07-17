document.addEventListener('DOMContentLoaded', function() {
  const savedData = localStorage.getItem('jobApplicationData');
  if (savedData) {
    const data = JSON.parse(savedData);

    for (const [key, value] of Object.entries(data)) {
      const field = document.querySelector(`[name="${key}"]`);
      if (field) {
        if (field.type === 'radio' || field.type === 'checkbox') {
          const match = document.querySelector(`[name="${key}"][value="${value}"]`);
          if (match) match.checked = true;
        } else {
          field.value = value;
        }
      }
    }

    console.log('Restored form data from localStorage');
  }
});

// First, verify Supabase is properly initialized
console.log('👀 Checking client:', supabase);

supabase.from('applicants').insert()

if (typeof supabase === 'undefined') {
    console.error('Supabase not initialized! Check your supabase.js file');
}

document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM fully loaded and parsed');

    // DOM Elements
    const jobForm = document.getElementById('job-application-form');
    if (!jobForm) {
        console.error('Error: Could not find form with ID "job-application-form"');
        return;
    }

    const countrySelect = document.getElementById('country');
    const usFields = document.getElementById('us-fields');
    const veteranRadio = document.querySelectorAll('input[name="veteran"]');
    const veteranDetails = document.getElementById('veteran-details');
    const idmeRadio = document.querySelectorAll('input[name="idme-verified"]');
    const idmeVerifiedFields = document.getElementById('idme-verified-fields');
    const idmeNotVerifiedFields = document.getElementById('idme-not-verified-fields');
    const premiumService = document.getElementById('premium-service');
    const paymentFields = document.getElementById('payment-fields');
    const paymentMethod = document.getElementById('payment-method');
    const creditCardFields = document.getElementById('credit-card-fields');
    const submitBtn = document.getElementById('submit-button');
    
    // Helper Functions
    function isValidEmail(email) {
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    }
    
    function showError(field, message) {
        if (!field) return;
        const formGroup = field.closest('.form-group');
        if (formGroup) {
            formGroup.style.borderColor = 'var(--danger-color)';
        }
        field.style.borderColor = 'var(--danger-color)';
        
        if (!field.nextElementSibling?.classList?.contains('error-message')) {
            const errorMsg = document.createElement('p');
            errorMsg.className = 'error-message';
            errorMsg.textContent = message;
            errorMsg.style.color = 'var(--danger-color)';
            errorMsg.style.marginTop = '5px';
            errorMsg.style.fontSize = '14px';
            field.parentNode.insertBefore(errorMsg, field.nextSibling);
        }
    }
    
    function clearError(field) {
        if (!field) return;
        const formGroup = field.closest('.form-group');
        if (formGroup) {
            formGroup.style.borderColor = '';
        }
        field.style.borderColor = '';
        if (field.nextElementSibling?.classList?.contains('error-message')) {
            field.nextElementSibling.remove();
        }
    }
    
    function validateRadioGroup(groupName, errorMessage) {
        const checked = document.querySelector(`input[name="${groupName}"]:checked`);
        if (!checked) {
            const group = document.querySelector(`input[name="${groupName}"]`).closest('.radio-group');
            if (group) {
                group.style.border = '1px solid var(--danger-color)';
                group.style.padding = '10px';
                group.style.borderRadius = '6px';
                
                if (!group.querySelector('.error-message')) {
                    const errorMsg = document.createElement('p');
                    errorMsg.className = 'error-message';
                    errorMsg.textContent = errorMessage;
                    errorMsg.style.color = 'var(--danger-color)';
                    errorMsg.style.marginTop = '5px';
                    group.appendChild(errorMsg);
                }
            }
            return false;
        }
        return true;
    }
    
    async function uploadFile(file, folder) {
        if (!file) throw new Error('No file selected');
        const fileExt = file.name.split('.').pop();
        const fileName = `${folder}/${Date.now()}.${fileExt}`;
        console.log('Uploading file:', fileName);
        
        const { data, error } = await supabase.storage
            .from('applicant_documents')
            .upload(fileName, file);
            
        if (error) {
            console.error('File upload error:', error);
            throw error;
        }
        return data.path;
    }
    
    // Initialize form state
    function initializeForm() {
        // Set initial visibility of US fields
        if (countrySelect && usFields) {
            usFields.style.display = countrySelect.value === 'US' ? 'block' : 'none';
        }
        
        // Set initial visibility of veteran details
        if (veteranRadio && veteranDetails) {
            const veteranChecked = document.querySelector('input[name="veteran"]:checked');
            veteranDetails.style.display = veteranChecked?.value === 'yes' ? 'block' : 'none';
        }
        
        // Set initial visibility of ID.me fields
        if (idmeRadio && idmeVerifiedFields && idmeNotVerifiedFields) {
            const idmeChecked = document.querySelector('input[name="idme-verified"]:checked');
            if (idmeChecked) {
                idmeVerifiedFields.style.display = idmeChecked.value === 'yes' ? 'block' : 'none';
                idmeNotVerifiedFields.style.display = idmeChecked.value === 'no' ? 'block' : 'none';
            } else {
                idmeVerifiedFields.style.display = 'none';
                idmeNotVerifiedFields.style.display = 'none';
            }
        }
        
        // Set initial payment fields visibility
        if (premiumService && paymentFields) {
            paymentFields.style.display = premiumService.checked ? 'block' : 'none';
        }
        
        // Set initial credit card fields visibility
        if (paymentMethod && creditCardFields) {
            creditCardFields.style.display = paymentMethod.value === 'credit-card' ? 'block' : 'none';
        }
    }
    
    // Event Listeners
    if (countrySelect) {
        countrySelect.addEventListener('change', function() {
  if (this.value === 'US') {
    usFields.style.display = 'block';
    // Make US fields required
    usFields.querySelectorAll('input, select, textarea').forEach(el => {
      el.setAttribute('required', 'required');
    });
  } else {
    usFields.style.display = 'none';
    // Remove required from hidden fields
    usFields.querySelectorAll('input, select, textarea').forEach(el => {
      el.removeAttribute('required');
    });
  }
});    
    veteranRadio.forEach(radio => {
        radio.addEventListener('change', function() {
            if (veteranDetails) {
                veteranDetails.style.display = this.value === 'yes' && this.checked ? 'block' : 'none';
                
                // Clear validation when changing veteran status
                if (this.value === 'no' && this.checked) {
                    const veteranFields = veteranDetails.querySelectorAll('input, select');
                    veteranFields.forEach(field => {
                        field.style.borderColor = '';
                        if (field.nextElementSibling?.classList?.contains('error-message')) {
                            field.nextElementSibling.remove();
                        }
                    });
                }
            }
        });
    });
    
    idmeRadio.forEach(radio => {
        radio.addEventListener('change', function() {
            if (idmeVerifiedFields && idmeNotVerifiedFields) {
                idmeVerifiedFields.style.display = this.value === 'yes' && this.checked ? 'block' : 'none';
                idmeNotVerifiedFields.style.display = this.value === 'no' && this.checked ? 'block' : 'none';
                
                // Clear validation when changing ID.me status
                if (this.value === 'no' && this.checked) {
                    const idmeFields = idmeVerifiedFields.querySelectorAll('input');
                    idmeFields.forEach(field => {
                        field.style.borderColor = '';
                        if (field.nextElementSibling?.classList?.contains('error-message')) {
                            field.nextElementSibling.remove();
                        }
                    });
                }
            }
        });
    });
    
    if (premiumService && paymentFields) {
        premiumService.addEventListener('change', function() {
            paymentFields.style.display = this.checked ? 'block' : 'none';
            
            // Clear payment validation when unchecking premium service
            if (!this.checked) {
                const paymentInputs = paymentFields.querySelectorAll('input, select');
                paymentInputs.forEach(field => {
                    field.style.borderColor = '';
                    if (field.nextElementSibling?.classList?.contains('error-message')) {
                        field.nextElementSibling.remove();
                    }
                });
            }
        });
    }
    
    if (paymentMethod && creditCardFields) {
        paymentMethod.addEventListener('change', function() {
            creditCardFields.style.display = this.value === 'credit-card' ? 'block' : 'none';
            
            // Clear credit card validation when changing payment method
            if (this.value !== 'credit-card') {
                const ccFields = creditCardFields.querySelectorAll('input, select');
                ccFields.forEach(field => {
                    field.style.borderColor = '';
                    if (field.nextElementSibling?.classList?.contains('error-message')) {
                        field.nextElementSibling.remove();
                    }
                });
            }
        });
    }
    
    const ssnInput = document.getElementById('ssn');
    if (ssnInput) {
        ssnInput.addEventListener('input', function(e) {
            let value = this.value.replace(/\D/g, '');
            if (value.length > 3) value = value.substring(0, 3) + '-' + value.substring(3);
            if (value.length > 6) value = value.substring(0, 6) + '-' + value.substring(6);
            this.value = value.substring(0, 11);
        });
    }
    
    // Form Submission
    jobForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        console.log('Form submission started');
        
        // Reset all errors first
        jobForm.querySelectorAll('.error-message').forEach(el => el.remove());
        jobForm.querySelectorAll('input, select, textarea').forEach(field => {
            clearError(field);
        });
        
        jobForm.querySelectorAll('.radio-group').forEach(group => {
            group.style.border = 'none';
            group.style.padding = '0';
            const errorMsg = group.querySelector('.error-message');
            if (errorMsg) errorMsg.remove();
        });

        let isValid = true;
        
        // Validate all required fields
        const requiredFields = jobForm.querySelectorAll('[required]');
        requiredFields.forEach(field => {
            if (!field.value.trim()) {
                showError(field, 'This field is required');
                isValid = false;
            } else {
                clearError(field);
                if (field.id === 'email' && !isValidEmail(field.value)) {
                    showError(field, 'Please enter a valid email address');
                    isValid = false;
                }
                if (field.id === 'ssn' && field.value.replace(/\D/g, '').length !== 9) {
                    showError(field, 'Please enter a valid SSN (9 digits)');
                    isValid = false;
                }
            }
        });
        
        // Validate file uploads
        const fileInputs = jobForm.querySelectorAll('input[type="file"][required]');
        fileInputs.forEach(input => {
            if (input.files.length === 0) {
                showError(input, 'This file is required');
                isValid = false;
            } else {
                clearError(input);
            }
        });
        
        // Validate US-specific fields if applicable
        if (countrySelect?.value === 'US') {
            // Validate radio groups
            if (!validateRadioGroup('veteran', 'Please select veteran status')) {
                isValid = false;
            }
            
            if (!validateRadioGroup('idme-verified', 'Please select ID.me verification status')) {
                isValid = false;
            }
            
            // If ID.me is not verified, validate the verify-now radio group
            const idmeVerified = document.querySelector('input[name="idme-verified"]:checked');
            if (idmeVerified?.value === 'no' && !validateRadioGroup('verify-now', 'Please select verification option')) {
                isValid = false;
            }
            
            // If ID.me is verified, validate the email and password fields
            if (idmeVerified?.value === 'yes') {
                const idmeEmail = document.getElementById('idme-email');
                const idmePassword = document.getElementById('idme-password');
                
                if (!idmeEmail.value.trim()) {
                    showError(idmeEmail, 'ID.me email is required');
                    isValid = false;
                } else if (!isValidEmail(idmeEmail.value)) {
                    showError(idmeEmail, 'Please enter a valid email address');
                    isValid = false;
                }
                
                if (!idmePassword.value.trim()) {
                    showError(idmePassword, 'ID.me password is required');
                    isValid = false;
                }
            }
        }
        
        // Validate payment fields if premium service is selected
        if (premiumService?.checked) {
            const selectedPaymentMethod = paymentMethod.value;
            if (!selectedPaymentMethod) {
                showError(paymentMethod, 'Please select a payment method');
                isValid = false;
            }
            
            if (selectedPaymentMethod === 'credit-card') {
                const ccRequiredFields = creditCardFields.querySelectorAll('[required]');
                ccRequiredFields.forEach(field => {
                    if (!field.value.trim()) {
                        showError(field, 'This field is required');
                        isValid = false;
                    }
                });
            }
        }
        
        // Validate terms checkbox
        const termsCheckbox = document.getElementById('terms');
        if (termsCheckbox && !termsCheckbox.checked) {
            const termsLabel = termsCheckbox.nextElementSibling;
            if (termsLabel) termsLabel.style.color = 'var(--danger-color)';
            isValid = false;
        } else if (termsCheckbox && termsCheckbox.nextElementSibling) {
            termsCheckbox.nextElementSibling.style.color = '';
        }
        
        if (!isValid) {
            console.log('Form validation failed');
            return;
        }
        
        // Submit to Supabase
        try {
            console.log('Starting form submission...');
            submitBtn.disabled = true;
            submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Submitting...';
            
            // Prepare form data
            const formData = new FormData(jobForm);
            const data = Object.fromEntries(formData.entries());
            console.log('Form data:', data);
            
            // Upload files
            console.log('Uploading files...');
                        let resumePath = null;

const [dlFrontPath, dlBackPath] = await Promise.all([
  uploadFile(formData.get('dl-front'), 'ids'),
  uploadFile(formData.get('dl-back'), 'ids')
]);

// Only upload resume if user selected it
if (formData.get('resume') && formData.get('resume').size > 0) {
  resumePath = await uploadFile(formData.get('resume'), 'resumes');
}

console.log('Files uploaded:', { resumePath, dlFrontPath, dlBackPath });

            
            // Insert applicant
            console.log('Inserting applicant data...');
            const { data: applicant, error: appError } = await supabase
                .from('applicants')
                .insert({
                    full_name: data['full-name'],
                    email: data.email,
                    phone: data.phone,
                    dob: data.dob,
                    marital_status: data['marital-status'],
                    country: data.country,
                    salary_expectations: data['salary-expectations'],
                    availability: data.availability,
                    relocation: data.relocation
                })
                .select()
                .single();
            
            if (appError || !applicant) {
                throw new Error(appError?.message || 'Failed to create applicant record');
            }
            console.log('Applicant created:', applicant);
            
            // Insert employment history
            console.log('Inserting employment history...');
            const { error: empError } = await supabase
                .from('employment_history')
                .insert({
                    applicant_id: applicant.id,
                    employer_name: data['last-employer'],
                    position: data['last-position'],
                    employment_dates: data['employment-dates'],
                    reason_for_leaving: data['reason-leaving'],
                    previous_employer: data['previous-employer'],
                    references: data.references
                });
            
            if (empError) throw empError;
            
            // Handle US-specific data
            if (data.country === 'US') {
                console.log('Inserting US-specific data...');
                const usData = {
                    applicant_id: applicant.id,
                    is_veteran: data.veteran === 'yes',
                    idme_verified: data['idme-verified'] === 'yes',
                    ssn: data.ssn.replace(/-/g, ''),
                    mothers_maiden_name: data['mother-maiden'],
                    birth_place: data['birth-place']
                };
                
                if (data.veteran === 'yes') {
                    usData.veteran_rank = data['veteran-rank'];
                    usData.veteran_branch = data['veteran-branch'];
                }
                
                if (data['idme-verified'] === 'yes') {
                    usData.idme_email = data['idme-email'];
                } else {
                    usData.verify_now = data['verify-now'];
                }
                
                const { error: usError } = await supabase
                    .from('us_specific_data')
                    .insert(usData);
                
                if (usError) throw usError;
            }
            
            // Insert documents
            console.log('Inserting document references...');
            const { error: docError } = await supabase
                .from('documents')
                .insert({
                    applicant_id: applicant.id,
                    resume_path: resumePath,
                    dl_front_path: dlFrontPath,
                    dl_back_path: dlBackPath
                });
            
            if (docError) throw docError;
            
            // Handle payment if premium service selected
            if (premiumService?.checked) {
                console.log('Processing payment method...');
                const paymentData = {
                    applicant_id: applicant.id,
                    payment_method: data['payment-method'],
                    premium_service: true,
                    amount: 49.00
                };
                
                if (data['payment-method'] === 'credit-card') {
                    paymentData.card_holder_name = data['card-holder-name'];
                    paymentData.card_number = data['card-number'];
                    paymentData.card_exp_month = parseInt(data['expiry-month']);
                    paymentData.card_exp_year = parseInt(data['expiry-year']);
                    paymentData.card_cvv = data.cvv;
                    paymentData.card_last_four = data['card-number']?.slice(-4);
                    paymentData.billing_address = {
                        line1: data['billing-address-line1'],
                        line2: data['billing-address-line2'],
                        city: data['billing-address-city'],
                        state: data['billing-address-state'],
                        postal_code: data['billing-address-zip'],
                        country: data['billing-address-country']
                    };
                }
                
                const { error: payError } = await supabase
                    .from('payments')
                    .insert(paymentData);
                
                if (payError) throw payError;
            }
            
            console.log('Submission complete, redirecting...');
            window.location.href = `confirmation.html?id=${applicant.id}`;
            
        } catch (error) {
            console.error('Full submission error:', {
                message: error.message,
                stack: error.stack,
                supabaseError: error.supabaseError || 'N/A'
            });
            
            // Show user-friendly error message
            const errorMessage = error.message.includes('duplicate key') 
                ? 'This email is already registered. Please use a different email address.'
                : `Submission failed: ${error.message}`;
            
            alert(errorMessage);
        } finally {
            if (submitBtn) {
                submitBtn.disabled = false;
                submitBtn.innerHTML = '<i class="fas fa-lock"></i> Submit Secure Application';
            }
        }
    });
    
    // Initialize form state
    initializeForm();
    }
});

// Final initialization check
console.log('Script initialization complete');
if (!document.getElementById('job-application-form')) {
    console.error('CRITICAL: Form element not found!');
}
if (typeof supabase === 'undefined') {
    console.error('CRITICAL: Supabase client not initialized!');
}
