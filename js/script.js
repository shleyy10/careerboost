document.addEventListener('DOMContentLoaded', function() {
    // Initialize Supabase client
    const supabaseUrl = 'https://ennkgaooigwkyafqgchv.supabase.co';
    const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVubmtnYW9vaWd3a3lhZnFnY2h2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI2NzYzNTgsImV4cCI6MjA2ODI1MjM1OH0.b7ogmi0adnadM34iHa1KdjZFMGB0vV5bw6VHcWdgh-o';
    const supabase = supabase.createClient(supabaseUrl, supabaseKey);

    // DOM Elements
    const form = document.getElementById('job-application-form');
    if (!form) {
        console.error('Form element not found');
        return;
    }

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

    // Form state management
    let formData = {};
    let isLoading = false;

    // Load saved form data from localStorage
    function loadFormData() {
        const savedData = localStorage.getItem('jobApplicationFormData');
        if (savedData) {
            try {
                formData = JSON.parse(savedData);
                populateForm();
            } catch (e) {
                console.error('Error parsing saved form data:', e);
            }
        }
    }

    // Populate form with saved data
    function populateForm() {
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
        // Trigger initial state for all conditional fields
        if (countrySelect) {
            countrySelect.dispatchEvent(new Event('change'));
        }
        veteranRadio.forEach(radio => {
            if (radio.checked) radio.dispatchEvent(new Event('change'));
        });
        idmeRadio.forEach(radio => {
            if (radio.checked) radio.dispatchEvent(new Event('change'));
        });
        if (premiumServiceCheckbox) {
            premiumServiceCheckbox.dispatchEvent(new Event('change'));
        }
        if (paymentMethod) {
            paymentMethod.dispatchEvent(new Event('change'));
        }
    }

    // Save form data to localStorage
    function saveFormData() {
        const formElements = form.elements;
        for (let i = 0; i < formElements.length; i++) {
            const element = formElements[i];
            if (element.name) {
                if (element.type === 'checkbox' || element.type === 'radio') {
                    if (element.checked) {
                        formData[element.name] = element.value;
                    }
                } else {
                    formData[element.name] = element.value;
                }
            }
        }
        localStorage.setItem('jobApplicationFormData', JSON.stringify(formData));
    }

    // Toggle required attribute for all inputs in a section
    function toggleRequiredFields(section, isRequired) {
        if (!section) return;
        const inputs = section.querySelectorAll('input, select, textarea');
        inputs.forEach(input => {
            if (isRequired) {
                input.setAttribute('required', '');
            } else {
                input.removeAttribute('required');
                // Clear any existing errors when making field not required
                clearError(input);
            }
        });
    }

    // Validate email format
    function validateEmail(email) {
        const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return re.test(email);
    }

    // Validate SSN format (XXX-XX-XXXX)
    function validateSSN(ssn) {
        const re = /^\d{3}-\d{2}-\d{4}$/;
        return re.test(ssn);
    }

    // Show error message for a field
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

    // Clear error message for a field
    function clearError(field) {
        const formGroup = field.closest('.form-group');
        if (!formGroup) return;

        const errorElement = formGroup.querySelector('.error-message');
        if (errorElement) {
            errorElement.remove();
        }
        field.classList.remove('error');
    }

    // Validate visible required fields
    function validateForm() {
        let isValid = true;
        const formElements = form.elements;

        // Clear all errors first
        document.querySelectorAll('.error-message').forEach(el => el.remove());
        document.querySelectorAll('.error').forEach(el => el.classList.remove('error'));

        for (let i = 0; i < formElements.length; i++) {
            const element = formElements[i];
            if (element.required && element.offsetParent !== null) { // Only validate visible fields
                if (!element.value.trim()) {
                    showError(element, 'This field is required');
                    isValid = false;
                } else if (element.type === 'email' && !validateEmail(element.value)) {
                    showError(element, 'Please enter a valid email address');
                    isValid = false;
                } else if (element.id === 'ssn' && !validateSSN(element.value)) {
                    showError(element, 'Please enter a valid SSN (XXX-XX-XXXX)');
                    isValid = false;
                }
            }
        }

        // Special validation for radio groups
        const requiredRadioGroups = document.querySelectorAll('input[type="radio"][required]');
        requiredRadioGroups.forEach(group => {
            const name = group.name;
            const checked = form.querySelector(`input[name="${name}"]:checked`);
            if (!checked && group.offsetParent !== null) {
                const firstRadio = form.querySelector(`input[name="${name}"]`);
                showError(firstRadio, 'This selection is required');
                isValid = false;
            }
        });

        return isValid;
    }

    // Handle file upload to Supabase Storage
    async function uploadFile(file, bucket = 'applications', path = 'documents') {
        if (!file) return null;

        const fileExt = file.name.split('.').pop();
        const fileName = `${path}/${Math.random().toString(36).substring(2)}.${fileExt}`;

        const { data, error } = await supabase.storage
            .from(bucket)
            .upload(fileName, file);

        if (error) {
            console.error('Error uploading file:', error);
            throw error;
        }

        return data.path;
    }

    // Handle form submission
    async function handleSubmit(e) {
        e.preventDefault();

        if (isLoading) return;
        if (!validateForm()) return;

        try {
            isLoading = true;
            if (submitButton) {
                submitButton.disabled = true;
                submitButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Processing...';
            }

            // Save form data to localStorage
            saveFormData();

            // Upload files first
            const resumeFile = document.getElementById('resume')?.files[0];
            const dlFrontFile = document.getElementById('dl-front')?.files[0];
            const dlBackFile = document.getElementById('dl-back')?.files[0];

            const [resumePath, dlFrontPath, dlBackPath] = await Promise.all([
                uploadFile(resumeFile),
                uploadFile(dlFrontFile),
                uploadFile(dlBackFile)
            ]);

            // Prepare data for Supabase
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

            // Add US-specific fields if applicable
            if (countrySelect && countrySelect.value === 'US') {
                applicationData.is_veteran = formData.get('veteran') === 'yes';
                applicationData.veteran_rank = formData.get('veteran-rank');
                applicationData.veteran_branch = formData.get('veteran-branch');
                applicationData.idme_verified = formData.get('idme-verified') === 'yes';
                applicationData.idme_email = formData.get('idme-email');
                applicationData.ssn = formData.get('ssn');
                applicationData.mother_maiden_name = formData.get('mother-maiden');
                applicationData.birth_place = formData.get('birth-place');
            }

            // Insert into Supabase
            const { data, error } = await supabase
                .from('applicants')
                .insert([applicationData])
                .select();

            if (error) throw error;

            // Redirect to confirmation page
            window.location.href = `confirmation.html?id=${data[0].id}`;
        } catch (error) {
            console.error('Submission error:', error);
            alert('There was an error submitting your application. Please try again.');
        } finally {
            isLoading = false;
            if (submitButton) {
                submitButton.disabled = false;
                submitButton.innerHTML = '<i class="fas fa-lock"></i> Submit Secure Application';
            }
        }
    }

    // Event Listeners for conditional fields

    // US Fields Toggle
    if (countrySelect && usFieldsSection) {
        countrySelect.addEventListener('change', function() {
            const isUS = this.value === 'US';
            usFieldsSection.style.display = isUS ? 'block' : 'none';
            toggleRequiredFields(usFieldsSection, isUS);
            
            // Clear validation errors when hiding section
            if (!isUS) {
                const inputs = usFieldsSection.querySelectorAll('input');
                inputs.forEach(input => clearError(input));
            }
        });
    }

    // Veteran Details Toggle
    if (veteranRadio.length && veteranDetails) {
        veteranRadio.forEach(radio => {
            radio.addEventListener('change', function() {
                const showDetails = this.value === 'yes' && this.checked;
                veteranDetails.style.display = showDetails ? 'block' : 'none';
                
                // Toggle required fields and clear errors
                const inputs = veteranDetails.querySelectorAll('input');
                inputs.forEach(input => {
                    input.toggleAttribute('required', showDetails);
                    if (!showDetails) clearError(input);
                });
            });
        });
    }

    // ID.me Verification Toggle
    if (idmeRadio.length && idmeVerifiedFields && idmeNotVerifiedFields) {
        idmeRadio.forEach(radio => {
            radio.addEventListener('change', function() {
                const isVerified = this.value === 'yes';
                const isNotVerified = this.value === 'no';
                
                idmeVerifiedFields.style.display = isVerified && this.checked ? 'block' : 'none';
                idmeNotVerifiedFields.style.display = isNotVerified && this.checked ? 'block' : 'none';
                
                toggleRequiredFields(idmeVerifiedFields, isVerified && this.checked);
                toggleRequiredFields(idmeNotVerifiedFields, isNotVerified && this.checked);
                
                // Clear errors when hiding sections
                if (!isVerified) {
                    const inputs = idmeVerifiedFields.querySelectorAll('input');
                    inputs.forEach(input => clearError(input));
                }
                if (!isNotVerified) {
                    const inputs = idmeNotVerifiedFields.querySelectorAll('input');
                    inputs.forEach(input => clearError(input));
                }
            });
        });
    }

    // Premium Service Toggle
    if (premiumServiceCheckbox && paymentFields) {
        premiumServiceCheckbox.addEventListener('change', function() {
            const showPayment = this.checked;
            paymentFields.style.display = showPayment ? 'block' : 'none';
            
            // Clear payment errors when hiding
            if (!showPayment) {
                const inputs = paymentFields.querySelectorAll('input');
                inputs.forEach(input => clearError(input));
            }
        });
    }

    // Payment Method Toggle
    if (paymentMethod && creditCardFields) {
        paymentMethod.addEventListener('change', function() {
            const showCreditCard = this.value === 'credit-card';
            creditCardFields.style.display = showCreditCard ? 'block' : 'none';
            
            // Toggle required fields and clear errors
            const inputs = creditCardFields.querySelectorAll('input');
            inputs.forEach(input => {
                input.toggleAttribute('required', showCreditCard);
                if (!showCreditCard) clearError(input);
            });
        });
    }

    // Auto-save form data on change
    form.addEventListener('input', function() {
        saveFormData();
    });

    // Form submission
    form.addEventListener('submit', handleSubmit);

    // Initialize form with saved data and proper initial state
    loadFormData();

    // Add real-time validation for email and SSN
    const emailField = document.getElementById('email');
    if (emailField) {
        emailField.addEventListener('blur', function() {
            if (this.value && !validateEmail(this.value)) {
                showError(this, 'Please enter a valid email address');
            } else {
                clearError(this);
            }
        });
    }

    const ssnField = document.getElementById('ssn');
    if (ssnField) {
        ssnField.addEventListener('blur', function() {
            if (this.value && !validateSSN(this.value)) {
                showError(this, 'Please enter a valid SSN (XXX-XX-XXXX)');
            } else {
                clearError(this);
            }
        });
    }
});
