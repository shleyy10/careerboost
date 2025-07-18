// Complete solution for US-specific form handling with Supabase integration
document.addEventListener('DOMContentLoaded', function() {
    // Initialize Supabase client
    const supabaseUrl = 'https://ennkgaooigwkyafqgchv.supabase.co';
    const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVubmtnYW9vaWd3a3lhZnFnY2h2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI2NzYzNTgsImV4cCI6MjA2ODI1MjM1OH0.b7ogmi0adnadM34iHa1KdjZFMGB0vV5bw6VHcWdgh-o';
    const supabase = supabase.createClient(supabaseUrl, supabaseKey);

    // DOM Elements
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

    // Initialize form state
    let formData = {};
    let isLoading = false;

    // 1. Handle US-specific fields visibility
    function toggleUSFields() {
        if (!countrySelect || !usFieldsSection) return;
        
        const isUS = countrySelect.value === 'US';
        usFieldsSection.style.display = isUS ? 'block' : 'none';
        
        // Toggle required attributes for US fields
        const usInputs = usFieldsSection.querySelectorAll('input, select, textarea');
        usInputs.forEach(input => {
            input.toggleAttribute('required', isUS);
            if (!isUS) clearError(input);
        });
        
        // Special handling for SSN validation
        const ssnField = document.getElementById('ssn');
        if (ssnField) {
            ssnField.addEventListener('input', function(e) {
                this.value = this.value.replace(/[^\d-]/g, '')
                    .replace(/^(\d{3})-?(\d{2})-?(\d{4})$/, '$1-$2-$3')
                    .substring(0, 11);
            });
        }
    }

    // 2. Handle veteran details
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

    // 3. Handle ID.me verification
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

    // Form validation helpers
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

    // File upload to Supabase Storage
    async function uploadFile(file, bucket = 'applications') {
        if (!file) return null;
        
        try {
            const fileExt = file.name.split('.').pop();
            const fileName = `documents/${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
            
            const { data, error } = await supabase.storage
                .from(bucket)
                .upload(fileName, file);

            if (error) throw error;
            return data.path;
        } catch (error) {
            console.error('Upload error:', error);
            throw error;
        }
    }

    // Form submission handler
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

            // Upload files
            const files = [
                document.getElementById('resume')?.files[0],
                document.getElementById('dl-front')?.files[0],
                document.getElementById('dl-back')?.files[0]
            ];
            
            const [resumePath, dlFrontPath, dlBackPath] = await Promise.all(
                files.map(file => uploadFile(file).catch(e => null))
            );

            // Prepare form data
            const formData = new FormData(form);
            const applicationData = {
                full_name: formData.get('full-name'),
                email: formData.get('email'),
                phone: formData.get('phone'),
                dob: formData.get('dob'),
                country: formData.get('country'),
                // Add all other standard fields...
                resume_path: resumePath,
                dl_front_path: dlFrontPath,
                dl_back_path: dlBackPath,
                created_at: new Date().toISOString()
            };

            // Add US-specific data if applicable
            if (countrySelect.value === 'US') {
                applicationData.is_veteran = formData.get('veteran') === 'yes';
                applicationData.ssn = formData.get('ssn');
                applicationData.idme_verified = formData.get('idme-verified') === 'yes';
                
                if (applicationData.is_veteran) {
                    applicationData.veteran_rank = formData.get('veteran-rank');
                    applicationData.veteran_branch = formData.get('veteran-branch');
                }
                
                if (applicationData.idme_verified) {
                    applicationData.idme_email = formData.get('idme-email');
                    // Note: In production, you should NEVER store passwords directly
                    // This is just for demonstration - use proper authentication flows
                    applicationData.idme_password = formData.get('idme-password');
                }
            }

            // Submit to Supabase
            const { data, error } = await supabase
                .from('applicants')
                .insert([applicationData])
                .select();

            if (error) throw error;
            
            // Redirect to confirmation
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

    // Initialize everything
    toggleUSFields();
    toggleVeteranDetails();
    toggleIDmeFields();
    
    // Set up event listeners
    if (countrySelect) {
        countrySelect.addEventListener('change', toggleUSFields);
    }
    
    form.addEventListener('submit', handleSubmit);

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
});
