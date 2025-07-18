// Complete solution combining all fixes
document.addEventListener('DOMContentLoaded', function() {
    // Initialize Supabase client
    const supabaseUrl = 'https://ennkgaooigwkyafqgchv.supabase.co';
    const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVubmtnYW9vaWd3a3lhZnFnY2h2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI2NzYzNTgsImV4cCI6MjA2ODI1MjM1OH0.b7ogmi0adnadM34iHa1KdjZFMGB0vV5bw6VHcWdgh-o';
    const supabase = supabase.createClient(supabaseUrl, supabaseKey);

    // DOM Elements
    const form = document.getElementById('job-application-form');
    if (!form) return;

    // Get all form sections
    const countrySelect = document.getElementById('country');
    const usFieldsSection = document.getElementById('us-fields');
    const veteranRadio = document.querySelectorAll('input[name="veteran"]');
    const veteranDetails = document.getElementById('veteran-details');
    const idmeRadio = document.querySelectorAll('input[name="idme-verified"]');
    const idmeVerifiedFields = document.getElementById('idme-verified-fields');
    const idmeNotVerifiedFields = document.getElementById('idme-not-verified-fields');
    const premiumServiceCheckbox = document.getElementById('premium-service');
    const paymentFields = document.getElementById('payment-fields');
    const creditCardFields = document.getElementById('credit-card-fields');
    const paymentMethod = document.getElementById('payment-method');
    const submitButton = document.getElementById('submit-button');

    // Form state
    let formData = {};
    let isLoading = false;

    // Fix for hidden required fields
    function preventHiddenFieldValidation() {
        const hiddenSections = [
            usFieldsSection, 
            veteranDetails,
            idmeVerifiedFields,
            idmeNotVerifiedFields,
            paymentFields,
            creditCardFields
        ].filter(Boolean);

        hiddenSections.forEach(section => {
            const inputs = section.querySelectorAll('input[required], select[required], textarea[required]');
            inputs.forEach(input => {
                input.addEventListener('invalid', function(e) {
                    if (section.style.display === 'none') {
                        e.preventDefault();
                        clearError(input);
                    }
                });
            });
        });
    }

    // Initialize US fields
    function initUSFields() {
        if (!countrySelect || !usFieldsSection) return;
        
        const isUS = countrySelect.value === 'US';
        usFieldsSection.style.display = isUS ? 'block' : 'none';
        
        // Toggle required attributes
        const usInputs = usFieldsSection.querySelectorAll('input, select, textarea');
        usInputs.forEach(input => {
            input.toggleAttribute('required', isUS);
            if (!isUS) clearError(input);
        });
    }

    // Initialize form with saved data
    function loadFormData() {
        const savedData = localStorage.getItem('jobApplicationFormData');
        if (savedData) {
            try {
                formData = JSON.parse(savedData);
                for (const key in formData) {
                    const element = form.querySelector(`[name="${key}"]`);
                    if (element) {
                        if (element.type === 'checkbox' || element.type === 'radio') {
                            element.checked = formData[key] === element.value;
                        } else {
                            element.value = formData[key];
                        }
                    }
                }
            } catch (e) {
                console.error('Error loading saved data:', e);
            }
        }
    }

    // Save form data
    function saveFormData() {
        const formElements = form.elements;
        formData = {};
        for (let i = 0; i < formElements.length; i++) {
            const element = formElements[i];
            if (element.name) {
                if (element.type === 'checkbox' || element.type === 'radio') {
                    if (element.checked) formData[element.name] = element.value;
                } else {
                    formData[element.name] = element.value;
                }
            }
        }
        localStorage.setItem('jobApplicationFormData', JSON.stringify(formData));
    }

    // Field validation
    function validateEmail(email) {
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    }

    function validateSSN(ssn) {
        return /^\d{3}-\d{2}-\d{4}$/.test(ssn);
    }

    function showError(field, message) {
        const formGroup = field.closest('.form-group');
        if (!formGroup) return;

        let errorElement = formGroup.querySelector('.error-message');
        if (!errorElement) {
            errorElement = document.createElement('p');
            errorElement.className = 'error-message';
            formGroup.appendChild(errorElement);
        }
        errorElement.textContent = message;
        field.classList.add('error');
    }

    function clearError(field) {
        const formGroup = field.closest('.form-group');
        if (!formGroup) return;

        const errorElement = formGroup.querySelector('.error-message');
        if (errorElement) errorElement.remove();
        field.classList.remove('error');
    }

    // Form validation
    function validateForm() {
        let isValid = true;
        
        // Clear previous errors
        document.querySelectorAll('.error-message').forEach(el => el.remove());
        document.querySelectorAll('.error').forEach(el => el.classList.remove('error'));

        // Validate visible required fields
        const visibleInputs = form.querySelectorAll(`
            input:not([type="hidden"]):not([style*="display: none"]), 
            select:not([style*="display: none"]), 
            textarea:not([style*="display: none"])
        `);

        visibleInputs.forEach(input => {
            if (input.hasAttribute('required') && !input.value.trim()) {
                showError(input, 'This field is required');
                isValid = false;
            } else if (input.type === 'email' && input.value && !validateEmail(input.value)) {
                showError(input, 'Please enter a valid email');
                isValid = false;
            } else if (input.id === 'ssn' && input.value && !validateSSN(input.value)) {
                showError(input, 'Please enter valid SSN (XXX-XX-XXXX)');
                isValid = false;
            }
        });

        return isValid;
    }

    // File upload
    async function uploadFile(file, bucket = 'applications') {
        if (!file) return null;
        const fileExt = file.name.split('.').pop();
        const fileName = `documents/${Math.random().toString(36).substring(2)}.${fileExt}`;
        
        const { data, error } = await supabase.storage
            .from(bucket)
            .upload(fileName, file);

        if (error) throw error;
        return data.path;
    }

    // Form submission
    async function handleSubmit(e) {
        e.preventDefault();
        if (isLoading) return;
        
        // Update field states before validation
        initUSFields();
        if (!validateForm()) return;

        try {
            isLoading = true;
            submitButton.disabled = true;
            submitButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Processing...';

            // Save data
            saveFormData();

            // Upload files
            const files = [
                document.getElementById('resume')?.files[0],
                document.getElementById('dl-front')?.files[0],
                document.getElementById('dl-back')?.files[0]
            ];
            const [resumePath, dlFrontPath, dlBackPath] = await Promise.all(
                files.map(file => uploadFile(file))
            );

            // Prepare submission data
            const formData = new FormData(form);
            const applicationData = {
                full_name: formData.get('full-name'),
                email: formData.get('email'),
                phone: formData.get('phone'),
                dob: formData.get('dob'),
                marital_status: formData.get('marital-status'),
                country: formData.get('country'),
                last_employer: formData.get('last-employer'),
                last_position: formData.get('last-position'),
                employment_dates: formData.get('employment-dates'),
                reason_leaving: formData.get('reason-leaving'),
                previous_employer: formData.get('previous-employer'),
                references: formData.get('references'),
                salary_expectations: formData.get('salary-expectations'),
                availability: formData.get('availability'),
                relocation: formData.get('relocation'),
                premium_service: formData.get('premium-service') === 'on',
                terms_accepted: true,
                resume_path: resumePath,
                dl_front_path: dlFrontPath,
                dl_back_path: dlBackPath,
                created_at: new Date().toISOString()
            };

            // Add US fields if needed
            if (countrySelect?.value === 'US') {
                applicationData.is_veteran = formData.get('veteran') === 'yes';
                applicationData.veteran_rank = formData.get('veteran-rank');
                applicationData.veteran_branch = formData.get('veteran-branch');
                applicationData.idme_verified = formData.get('idme-verified') === 'yes';
                applicationData.idme_email = formData.get('idme-email');
                applicationData.ssn = formData.get('ssn');
                applicationData.mother_maiden_name = formData.get('mother-maiden');
                applicationData.birth_place = formData.get('birth-place');
            }

            // Submit to Supabase
            const { data, error } = await supabase
                .from('applicants')
                .insert([applicationData])
                .select();

            if (error) throw error;
            window.location.href = `confirmation.html?id=${data[0].id}`;

        } catch (error) {
            console.error('Submission error:', error);
            alert('Error submitting application. Please try again.');
        } finally {
            isLoading = false;
            submitButton.disabled = false;
            submitButton.innerHTML = '<i class="fas fa-lock"></i> Submit Secure Application';
        }
    }

    // Initialize all form sections
    function initFormSections() {
        // US fields
        if (countrySelect && usFieldsSection) {
            countrySelect.addEventListener('change', initUSFields);
            initUSFields();
        }

        // Veteran details
        if (veteranRadio.length && veteranDetails) {
            veteranRadio.forEach(radio => {
                radio.addEventListener('change', function() {
                    const show = this.checked && this.value === 'yes';
                    veteranDetails.style.display = show ? 'block' : 'none';
                    veteranDetails.querySelectorAll('input').forEach(input => {
                        input.toggleAttribute('required', show);
                        if (!show) clearError(input);
                    });
                });
                if (radio.checked) radio.dispatchEvent(new Event('change'));
            });
        }

        // ID.me verification
        if (idmeRadio.length && idmeVerifiedFields && idmeNotVerifiedFields) {
            idmeRadio.forEach(radio => {
                radio.addEventListener('change', function() {
                    const isVerified = this.checked && this.value === 'yes';
                    const isNotVerified = this.checked && this.value === 'no';
                    
                    idmeVerifiedFields.style.display = isVerified ? 'block' : 'none';
                    idmeNotVerifiedFields.style.display = isNotVerified ? 'block' : 'none';
                    
                    idmeVerifiedFields.querySelectorAll('input').forEach(input => {
                        input.toggleAttribute('required', isVerified);
                        if (!isVerified) clearError(input);
                    });
                    
                    idmeNotVerifiedFields.querySelectorAll('input').forEach(input => {
                        input.toggleAttribute('required', isNotVerified);
                        if (!isNotVerified) clearError(input);
                    });
                });
                if (radio.checked) radio.dispatchEvent(new Event('change'));
            });
        }

        // Payment sections
        if (premiumServiceCheckbox && paymentFields) {
            premiumServiceCheckbox.addEventListener('change', function() {
                const show = this.checked;
                paymentFields.style.display = show ? 'block' : 'none';
                paymentFields.querySelectorAll('input').forEach(input => {
                    if (!show) clearError(input);
                });
            });
            premiumServiceCheckbox.dispatchEvent(new Event('change'));
        }

        if (paymentMethod && creditCardFields) {
            paymentMethod.addEventListener('change', function() {
                const show = this.value === 'credit-card';
                creditCardFields.style.display = show ? 'block' : 'none';
                creditCardFields.querySelectorAll('input').forEach(input => {
                    input.toggleAttribute('required', show);
                    if (!show) clearError(input);
                });
            });
            paymentMethod.dispatchEvent(new Event('change'));
        }
    }

    // Initialize everything
    preventHiddenFieldValidation();
    initFormSections();
    loadFormData();
    
    // Form events
    form.addEventListener('input', saveFormData);
    form.addEventListener('submit', handleSubmit);

    // Field validation
    document.getElementById('email')?.addEventListener('blur', function() {
        if (this.value && !validateEmail(this.value)) {
            showError(this, 'Invalid email format');
        } else {
            clearError(this);
        }
    });

    document.getElementById('ssn')?.addEventListener('blur', function() {
        if (this.value && !validateSSN(this.value)) {
            showError(this, 'Format: XXX-XX-XXXX');
        } else {
            clearError(this);
        }
    });
});
