document.addEventListener('DOMContentLoaded', function() {
    // Check if Supabase is available
    if (typeof supabase === 'undefined') {
        console.error('Supabase client not loaded');
        return;
    }

    // Check if user is logged in
    async function checkAuth() {
        try {
            const { data: { user }, error } = await supabase.auth.getUser();
            
            if (error) throw error;
            
            if (user) {
                console.log('User:', user);
                // Update UI for logged-in users
            }
        } catch (error) {
            console.error('Auth error:', error.message);
        }
    }
    
    // Initialize auth check
    checkAuth();
});