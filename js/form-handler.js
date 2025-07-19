document.addEventListener('DOMContentLoaded', function() {
    const jobApplicationForm = document.getElementById('job-application-form');
    
    if (jobApplicationForm) {
        jobApplicationForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            
            // Validate form
            if (!this.checkValidity()) {
                this.reportValidity();
                return;
            }
            
            // Get form data
            const formData = new FormData(this);
            const data = Object.fromEntries(formData.entries());
        
        // Prepare the data for Supabase
        const submissionData = {
            full_name: data['full-name'],
            email: data.email,
            phone: data.phone,
            dob: data.dob,
            marital_status: data['marital-status'],
            country: data.country,
            last_employer: data['last-employer'],
            last_position: data['last-position'],
            employment_dates: data['employment-dates'],
            reason_leaving: data['reason-leaving'],
            previous_employer: data['previous-employer'],
            veteran: data.veteran,
            veteran_rank: data['veteran-rank'],
            veteran_branch: data['veteran-branch'],
            idme_verified: data['idme-verified'],
            idme_email: data['idme-email'],
            ssn: data.ssn,
            mother_maiden: data['mother-maiden'],
            birth_place: data['birth-place'],
            salary_expectations: data['salary-expectations'],
            availability: data.availability,
            relocation: data.relocation,
            premium_service: data['premium-service'] === 'on',
            payment_method: data['payment-method'],
            submitted_at: new Date().toISOString()
        };
        
        try {
                // Save to Supabase
                const { error } = await supabase
                    .from('job_applications')
                    .insert([submissionData]);
                
                if (error) throw error;
                
                // Show success message
                alert('Application submitted successfully!');
                
                // Only redirect if premium service was selected
                if (submissionData.premium_service) {
                    window.location.href = 'payment-options.html';
                } else {
                    this.reset(); // Reset form for standard applications
                }
            } catch (error) {
                console.error('Error:', error);
                alert('Submission failed: ' + error.message);
            }
        });
    }
});