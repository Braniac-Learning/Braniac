// Authentication API Client for Braniac
// This module handles all authentication and user data operations with the backend

// Allow override from hosting environment by setting `window.API_BASE`
const API_BASE_URL = (typeof window !== 'undefined' && window.API_BASE) ? window.API_BASE : 'http://localhost:3001'; // Update for production

class AuthAPI {
    constructor() {
        this.baseUrl = API_BASE_URL;
    }

    // Helper method for API calls
    async request(endpoint, options = {}) {
        const url = `${this.baseUrl}${endpoint}`;
        
        // Get token from localStorage as backup
        let session = null;
        try {
            const sessionStr = localStorage.getItem('braniacSession');
            session = sessionStr ? JSON.parse(sessionStr) : null;
        } catch (e) {
            console.error('Failed to parse session:', e);
        }
        const token = session?.token;
        
        const config = {
            ...options,
            headers: {
                'Content-Type': 'application/json',
                ...(token && { 'x-session-token': token }), // Send token in header
                ...options.headers
            },
            credentials: 'include' // Include cookies for session
        };

        try {
            const response = await fetch(url, config);
            const data = await response.json();
            
            if (!response.ok) {
                throw new Error(data.error || 'Request failed');
            }
            
            return data;
        } catch (error) {
            console.error('API request failed:', error);
            throw error;
        }
    }

    // Register new user
    async register(username, firstName, password, confirmPassword) {
        const data = await this.request('/api/auth/register', {
            method: 'POST',
            body: JSON.stringify({ username, firstName, password, confirmPassword })
        });
        
        if (data.ok) {
            // Save session to localStorage with profile data
            const session = {
                type: 'user',
                username: data.user.username,
                firstName: data.user.firstName,
                pfp: data.userData?.profilePicture || 'assets/icons/guest.svg',
                token: data.token
            };
            localStorage.setItem('braniacSession', JSON.stringify(session));
            
            if (data.userData?.bio) {
                localStorage.setItem('braniacBio', data.userData.bio);
            }
        }
        
        return data;
    }

    // Login user
    async login(username, password) {
        const data = await this.request('/api/auth/login', {
            method: 'POST',
            body: JSON.stringify({ username, password })
        });
        
        if (data.ok) {
            // Save session to localStorage with profile data from backend
            const session = {
                type: 'user',
                username: data.user.username,
                firstName: data.user.firstName,
                pfp: data.userData?.profilePicture || 'assets/icons/guest.svg',
                token: data.token
            };
            localStorage.setItem('braniacSession', JSON.stringify(session));
            
            if (data.userData?.bio) {
                localStorage.setItem('braniacBio', data.userData.bio);
            }
        }
        
        return data;
    }

    // Logout user
    async logout() {
        await this.request('/api/auth/logout', {
            method: 'POST'
        });
        
        localStorage.removeItem('braniacSession');
    }

    // Get current user info
    async getCurrentUser() {
        try {
            const data = await this.request('/api/auth/me');
            
            // Sync profile data to localStorage
            if (data.ok && data.user) {
                let session = null;
                try {
                    const sessionStr = localStorage.getItem('braniacSession');
                    session = sessionStr ? JSON.parse(sessionStr) : null;
                } catch (e) {
                    console.error('Failed to parse session:', e);
                }
                
                if (session) {
                    session.firstName = data.user.firstName;
                    session.pfp = data.user.profilePicture || 'assets/icons/guest.svg';
                    localStorage.setItem('braniacSession', JSON.stringify(session));
                    
                    if (data.user.bio) {
                        localStorage.setItem('braniacBio', data.user.bio);
                    }
                }
            }
            
            return data;
        } catch (error) {
            localStorage.removeItem('braniacSession');
            return null;
        }
    }

    // Get user data (scores, achievements, etc.)
    async getUserData() {
        return await this.request('/api/user/data');
    }

    // Save user data
    async saveUserData(data) {
        return await this.request('/api/user/data', {
            method: 'POST',
            body: JSON.stringify({ data })
        });
    }

    // Submit quiz score
    async submitScore(scoreData) {
        const result = await this.request('/api/user/score', {
            method: 'POST',
            body: JSON.stringify(scoreData)
        });
        
        // Sync data to localStorage for offline access
        if (result.ok && result.data) {
            await this.syncToLocalStorage(result.data);
        }
        
        return result;
    }

    // Update achievements
    async updateAchievements(achievements) {
        return await this.request('/api/user/achievements', {
            method: 'POST',
            body: JSON.stringify({ achievements })
        });
    }

    // Update profile
    async updateProfile(profileData) {
        const result = await this.request('/api/user/profile', {
            method: 'POST',
            body: JSON.stringify(profileData)
        });
        
        // Update localStorage session
        const session = JSON.parse(localStorage.getItem('braniacSession'));
        if (session) {
            if (profileData.profilePicture) {
                session.pfp = profileData.profilePicture;
            }
            if (profileData.firstName) {
                session.firstName = profileData.firstName;
            }
            localStorage.setItem('braniacSession', JSON.stringify(session));
        }
        
        return result;
    }

    // Sync data to localStorage for offline access
    async syncToLocalStorage(userData) {
        if (userData.scores) {
            localStorage.setItem('userScores', JSON.stringify(userData.scores));
        }
        if (userData.achievements) {
            localStorage.setItem('userAchievements', JSON.stringify(userData.achievements));
        }
        if (userData.bio !== undefined) {
            localStorage.setItem('braniacBio', userData.bio);
        }
    }

    // Check if user is authenticated
    isAuthenticated() {
        const session = localStorage.getItem('braniacSession');
        return session !== null;
    }

    // Get session from localStorage
    getSession() {
        const session = localStorage.getItem('braniacSession');
        return session ? JSON.parse(session) : null;
    }
}

// Create singleton instance
const authAPI = new AuthAPI();

// Export for use in other files
if (typeof window !== 'undefined') {
    window.authAPI = authAPI;
}
