// form-handler.js
document.addEventListener('DOMContentLoaded', function() {
    // Initialize application after Supabase is loaded
    const initApp = async () => {
        if (typeof supabase === 'undefined') {
            console.error('Supabase library not loaded!');
            return;
        }

        try {
            // Initialize Supabase client
            const supabase = supabase.createClient(
                window.supabaseConfig.supabaseUrl,
                window.supabaseConfig.supabaseKey
            );

            // Get form elements
            const form = document.getElementById('job-application-form');
            if (!form) return;

            // US-specific elements
            const countrySelect = document.getElementById('country');
            const usFieldsSection = document.getElementById('us-fields');
            const veteranRadio = document.querySelectorAll('input[name="veteran"]');
            const veteranDetails = document.getElementById('veteran-details');
            const idmeRadio = document.querySelectorAll('input[name="idme-verified"]');
            const idmeVerifiedFields = document.getElementById('idme-verified-fields');
            const idmeNotVerifiedFields = document.getElementById('idme-not-verified-fields');
            const submitButton = document.getElementById('submit-button');

            // ======================
            // FORM STATE MANAGEMENT
            // ======================
            
            let formData = {};
            let isLoading = false;

            // Load saved form data
            function loadFormData() {
                const savedData = localStorage.getItem('jobApplicationData');
                if (savedData) {
                    try {
                        formData = JSON.parse(savedData);
                        populateForm();
                    } catch (e) {
                        console.error('Error loading form data:', e);
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
                // Trigger change events to update conditional fields
                if (countrySelect) countrySelect.dispatchEvent(new Event('change'));
                document.querySelectorAll('input[type="radio"]:checked').forEach(radio => {
                    radio.dispatchEvent(new Event('change'));
                });
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
                
                localStorage.setItem('jobApplicationData', JSON.stringify(formData));
            }

            // ======================
            // US-SPECIFIC FIELDS LOGIC
            // ======================

            // Toggle US fields visibility
            function toggleUSFields() {
                if (!countrySelect || !usFieldsSection) return;
                
                const isUS = countrySelect.value === 'US';
                usFieldsSection.style.display = isUS ? 'block' : 'none';
                
                // Toggle required attributes
                const usInputs = usFieldsSection.querySelectorAll('input, select, textarea');
                usInputs.forEach(input => {
                    input.toggleAttribute('required', isUS);
                    if (!isUS) clearError(input);
                });
                
                // SSN formatting
                const ssnField = document.getElementById('ssn');
                if (ssnField) {
                    ssnField.addEventListener('input', function(e) {
                        // Format as XXX-XX-XXXX
                        this.value = this.value.replace(/[^\d-]/g, '')
                            .replace(/^(\d{3})-?(\d{2})-?(\d{4})$/, '$1-$2-$3')
                            .substring(0, 11);
                    });
                }
            }

            // Toggle veteran details
            function toggleVeteranDetails() {
                if (!veteranRadio.length || !veteranDetails) return;
                
                veteranRadio.forEach(radio => {
                    radio.addEventListener('change', function() {
                        const showDetails = this.checked && this.value === 'yes';
                        veteranDetails.style.display = showDetails ? 'block' : 'none';
                        
                        // Toggle required fields
                        const inputs = veteranDetails.querySelectorAll('input, select');
                        inputs.forEach(input => {
                            input.toggleAttribute('required', showDetails);
                            if (!showDetails) clearError(input);
                        });
                    });
                });
            }

            // Toggle ID.me verification fields
            function toggleIDmeFields() {
                if (!idmeRadio.length || !idmeVerifiedFields || !idmeNotVerifiedFields) return;
                
                idmeRadio.forEach(radio => {
                    radio.addEventListener('change', function() {
                        const isVerified = this.checked && this.value === 'yes';
                        const isNotVerified = this.checked && this.value === 'no';
                        
                        idmeVerifiedFields.style.display = isVerified ? 'block' : 'none';
                        idmeNotVerifiedFields.style.display = isNotVerified ? 'block' : 'none';
                        
                        // Toggle required fields
                        idmeVerifiedFields.querySelectorAll('input').forEach(input => {
                            input.toggleAttribute('required', isVerified);
                            if (!isVerified) clearError(input);
                        });
                        
                        idmeNotVerifiedFields.querySelectorAll('input').forEach(input => {
                            input.toggleAttribute('required', isNotVerified);
                            if (!isNotVerified) clearError(input);
                        });
                    });
                });
            }

            // ======================
            // VALIDATION HELPERS
            // ======================

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

            // Main form validation
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
                        showError(input, 'Please enter a valid email address');
                        isValid = false;
                    } else if (input.id === 'ssn' && input.value && !validateSSN(input.value)) {
                        showError(input, 'Please enter a valid SSN (XXX-XX-XXXX)');
                        isValid = false;
                    }
                });

                return isValid;
            }

            // ======================
            // FILE UPLOAD & SUPABASE INTEGRATION
            // ======================

            async function uploadFile(file) {
                if (!file) return null;
                
                try {
                    const fileExt = file.name.split('.').pop();
                    const fileName = `documents/${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
                    
                    const { data, error } = await supabase.storage
                        .from(window.supabaseConfig.storageBucket)
                        .upload(fileName, file);

                    if (error) throw error;
                    return data.path;
                } catch (error) {
                    console.error('Upload error:', error);
                    throw error;
                }
            }

            // ======================
            // FORM SUBMISSION HANDLER
            // ======================

            async function handleSubmit(e) {
                e.preventDefault();
                if (isLoading) return;
                
                // Update field states before validation
                toggleUSFields();
                if (!validateForm()) return;

                try {
                    isLoading = true;
                    submitButton.disabled = true;
                    submitButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Processing...';

                    // Save form data
                    saveFormData();

                    // Upload files
                    const files = [
                        document.getElementById('resume')?.files[0],
                        document.getElementById('dl-front')?.files[0],
                        document.getElementById('dl-back')?.files[0]
                    ];
                    
                    const [resumePath, dlFrontPath, dlBackPath] = await Promise.all(
                        files.map(file => uploadFile(file).catch(e => null))
                    );

                    // Prepare form data for Supabase
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
                        resume_path: resumePath,
                        dl_front_path: dlFrontPath,
                        dl_back_path: dlBackPath,
                        created_at: new Date().toISOString()
                    };

                    // Add US-specific data if applicable
                    if (countrySelect.value === 'US') {
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

                    // Submit to Supabase
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
                    submitButton.disabled = false;
                    submitButton.innerHTML = '<i class="fas fa-lock"></i> Submit Secure Application';
                }
            }

            // ======================
            // INITIALIZATION
            // ======================

            // Set up event listeners
            if (countrySelect) {
                countrySelect.addEventListener('change', toggleUSFields);
            }
            
            form.addEventListener('submit', handleSubmit);
            form.addEventListener('input', saveFormData);

            // Initialize conditional fields
            toggleUSFields();
            toggleVeteranDetails();
            toggleIDmeFields();
            
            // Load any saved form data
            loadFormData();

            // Real-time validation
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

        } catch (error) {
            console.error('Application initialization failed:', error);
            alert('Failed to initialize application. Please refresh the page.');
        }
    };

    // Start the application
    initApp();
});
