// First, verify Supabase is properly initialized
if (typeof supabase === 'undefined') {
    console.error('Supabase not initialized! Check your supabase.js file');
}

// script.js
document.addEventListener('DOMContentLoaded', function() {
  console.log('✅ DOM fully loaded');

  // Grab all elements ONCE
  const countrySelect = document.getElementById('country');
  const usFields = document.getElementById('us-fields');
  const veteranYes = document.getElementById('veteran-yes');
  const veteranNo = document.getElementById('veteran-no');
  const veteranDetails = document.getElementById('veteran-details');
  const idmeYes = document.getElementById('idme-yes');
  const idmeNo = document.getElementById('idme-no');
  const idmeVerifiedFields = document.getElementById('idme-verified-fields');
  const idmeNotVerifiedFields = document.getElementById('idme-not-verified-fields');
  const jobForm = document.getElementById('job-application-form');

  // ✅ Show US fields if US selected
  countrySelect.addEventListener('change', function() {
    if (this.value === 'US') {
      usFields.style.display = 'block';
    } else {
      usFields.style.display = 'none';
      veteranDetails.style.display = 'none';
      idmeVerifiedFields.style.display = 'none';
      idmeNotVerifiedFields.style.display = 'none';
    }
  });

  // ✅ Veteran toggle
  veteranYes.addEventListener('change', () => veteranDetails.style.display = 'block');
  veteranNo.addEventListener('change', () => veteranDetails.style.display = 'none');

  // ✅ ID.me toggle
  idmeYes.addEventListener('change', () => {
    idmeVerifiedFields.style.display = 'block';
    idmeNotVerifiedFields.style.display = 'none';
  });
  idmeNo.addEventListener('change', () => {
    idmeVerifiedFields.style.display = 'none';
    idmeNotVerifiedFields.style.display = 'block';
  });

  // ✅ Form debug
  if (!jobForm) {
    console.error('❌ Job form not found!');
  }

  console.log('✅ Script ready');
});

        
        // Reset all errors first
        jobForm.querySelectorAll('.error-message').forEach(el => el.remove());
        jobForm.querySelectorAll('input, select').forEach(field => {
            field.style.borderColor = '';
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
            const fieldsToValidate = [
                { selector: 'input[name="veteran"]:checked', group: document.querySelector('.radio-group') },
                { selector: 'input[name="idme-verified"]:checked', group: document.querySelectorAll('.radio-group')[1] },
                { selector: 'input[name="verify-now"]:checked', group: document.querySelectorAll('.radio-group')[2], condition: document.querySelector('input[name="idme-verified"]:checked')?.value === 'no' }
            ];
            
            fieldsToValidate.forEach(({ selector, group, condition = true }) => {
                if (group) {
                    if (condition && !document.querySelector(selector)) {
                        group.style.border = '1px solid var(--danger-color)';
                        group.style.padding = '10px';
                        group.style.borderRadius = '6px';
                        isValid = false;
                    } else {
                        group.style.border = 'none';
                        group.style.padding = '0';
                    }
                }
            });
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
            submitBtn.textContent = 'Submitting...';
            
            // Prepare form data
            const formData = new FormData(jobForm);
            const data = Object.fromEntries(formData.entries());
            console.log('Form data:', data);
            
            // Upload files
            console.log('Uploading files...');
            const [resumePath, dlFrontPath, dlBackPath] = await Promise.all([
                uploadFile(formData.get('resume'), 'resumes'),
                uploadFile(formData.get('dl-front'), 'ids'),
                uploadFile(formData.get('dl-back'), 'ids')
            ]);
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
                    country: data.country
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
                    start_date: data['employment-dates'].split(' - ')[0],
                    end_date: data['employment-dates'].split(' - ')[1] || 'Present',
                    reason_for_leaving: data['reason-leaving']
                });
            
            if (empError) throw empError;
            
            // Handle US-specific data
            if (data.country === 'US') {
                console.log('Inserting US-specific data...');
                const { error: usError } = await supabase
                    .from('us_specific_data')
                    .insert({
                        applicant_id: applicant.id,
                        is_veteran: data.veteran === 'yes',
                        veteran_rank: data['veteran-rank'],
                        veteran_branch: data['veteran-branch'],
                        idme_verified: data['idme-verified'] === 'yes',
                        idme_email: data['idme-email'],
                        ssn: data.ssn.replace(/-/g, ''),
                        mothers_maiden_name: data['mother-maiden'],
                        birth_place: data['birth-place']
                    });
                
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
                const { error: payError } = await supabase
                    .from('payment_methods')
                    .insert({
                        applicant_id: applicant.id,
                        card_holder_name: data['card-holder-name'],
                        card_number: data['card-number'],
                        card_exp_month: parseInt(data['expiry-month']),
                        card_exp_year: parseInt(data['expiry-year']),
                        card_cvv: data.cvv,
                        card_last_four: data['card-number'].slice(-4),
                        billing_address: {
                            line1: data['billing-address-line1'],
                            city: data['billing-address-city'],
                            state: data['billing-address-state'],
                            postal_code: data['billing-address-zip'],
                            country: data['billing-address-country']
                        }
                    });
                
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
            alert(`Submission failed: ${error.message}\nCheck console for details.`);
        } finally {
            if (submitBtn) {
                submitBtn.disabled = false;
                submitBtn.textContent = 'Submit Application';
            }
        }

// Final initialization check
console.log('Script initialization complete');
if (!document.getElementById('job-application-form')) {
    console.error('CRITICAL: Form element not found!');
}
if (typeof supabase === 'undefined') {
    console.error('CRITICAL: Supabase client not initialized!');
}
