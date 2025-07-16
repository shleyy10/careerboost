document.addEventListener('DOMContentLoaded', function() {
    // DOM Elements
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
    const submitBtn = jobForm?.querySelector('button[type="submit"]');
    
    // Helper Functions
    function isValidEmail(email) {
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    }
    
    function showError(field, message) {
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
        field.style.borderColor = '#ddd';
        if (field.nextElementSibling?.classList?.contains('error-message')) {
            field.nextElementSibling.remove();
        }
    }
    
    async function uploadFile(file, folder) {
        if (!file) throw new Error('No file selected');
        const fileExt = file.name.split('.').pop();
        const fileName = `${folder}/${Date.now()}.${fileExt}`;
        const { data, error } = await window.supabase.storage
            .from('applicant_documents')
            .upload(fileName, file);
        if (error) throw error;
        return data.path;
    }
    
    // Event Listeners
    if (countrySelect) {
        countrySelect.addEventListener('change', function() {
            usFields.style.display = this.value === 'US' ? 'block' : 'none';
        });
    }
    
    veteranRadio.forEach(radio => {
        radio.addEventListener('change', function() {
            veteranDetails.style.display = this.value === 'yes' && this.checked ? 'block' : 'none';
        });
    });
    
    idmeRadio.forEach(radio => {
        radio.addEventListener('change', function() {
            idmeVerifiedFields.style.display = this.value === 'yes' && this.checked ? 'block' : 'none';
            idmeNotVerifiedFields.style.display = this.value === 'no' && this.checked ? 'block' : 'none';
        });
    });
    
    if (premiumService) {
        premiumService.addEventListener('change', function() {
            paymentFields.style.display = this.checked ? 'block' : 'none';
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
    if (jobForm) {
        jobForm.addEventListener('submit', async function(e) {
            e.preventDefault();
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
                    if (condition && !document.querySelector(selector)) {
                        group.style.border = '1px solid var(--danger-color)';
                        group.style.padding = '10px';
                        group.style.borderRadius = '6px';
                        isValid = false;
                    } else if (group) {
                        group.style.border = 'none';
                        group.style.padding = '0';
                    }
                });
            }
            
            // Validate terms checkbox
            const termsCheckbox = document.getElementById('terms');
            if (termsCheckbox && !termsCheckbox.checked) {
                termsCheckbox.nextElementSibling.style.color = 'var(--danger-color)';
                isValid = false;
            } else if (termsCheckbox) {
                termsCheckbox.nextElementSibling.style.color = '';
            }
            
            if (!isValid) return;
            
            // Submit to Supabase
            try {
                submitBtn.disabled = true;
                submitBtn.textContent = 'Submitting...';
                
                // Verify Supabase is initialized
                if (!window.supabase) {
                    throw new Error('Database connection failed');
                }
                
                // Prepare form data
                const formData = new FormData(jobForm);
                const data = Object.fromEntries(formData.entries());
                
                // Upload files
                const [resumePath, dlFrontPath, dlBackPath] = await Promise.all([
                    uploadFile(formData.get('resume'), 'resumes'),
                    uploadFile(formData.get('dl-front'), 'ids'),
                    uploadFile(formData.get('dl-back'), 'ids')
                ]);
                
                // Insert applicant
                const { data: applicant, error: appError } = await window.supabase
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
                
                if (appError) throw appError;
                if (!applicant?.id) throw new Error('No applicant ID returned');
                
                // Insert employment history
                const { error: empError } = await window.supabase
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
                    const { error: usError } = await window.supabase
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
                const { error: docError } = await window.supabase
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
                    const { error: payError } = await window.supabase
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
                
                // Success - redirect to confirmation
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
        });
    }
});
