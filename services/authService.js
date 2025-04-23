import axios from 'axios';

const API_URL = 'http://localhost:8080/api/auth/';

class AuthService {
  async login(username, password) {
    console.log('Attempting login for user:', username);
    try {
      // Create the request configuration with CORS headers
      const config = {
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        }
      };
      
      // Make the login request
      const response = await axios.post(
        API_URL + 'login', 
        { username, password },
        config
      );
      
      console.log('Login response:', response);
      
      // Check if we have a valid token in the response
      if (response.data && response.data.token) {
        // Store user details in localStorage
        localStorage.setItem('user', JSON.stringify(response.data));
        return response.data;
      } else {
        console.error('Invalid login response format:', response.data);
        return { 
          success: false, 
          message: 'Invalid response from server. Please try again.' 
        };
      }
    } catch (error) {
      console.error('Login error:', error);
      
      // Handle error response
      if (error.response) {
        console.error('Error response status:', error.response.status);
        console.error('Error response data:', error.response.data);
        
        if (error.response.data && error.response.data.message) {
          return { 
            success: false, 
            message: error.response.data.message 
          };
        }
      }
      
      return { 
        success: false, 
        message: error.message || 'Login failed. Please try again.' 
      };
    }
  }

  logout() {
    localStorage.removeItem('user');
  }

  register(username, email, password, role) {
    console.log('Registering new user:', username, 'with role:', role);
    return axios.post(API_URL + 'register', {
      username,
      email,
      password,
      role
    })
    .then(response => {
      console.log('Registration successful:', response.data);
      return response;
    })
    .catch(error => {
      console.error('Registration error:', error);
      throw error;
    });
  }

  getCurrentUser() {
    return JSON.parse(localStorage.getItem('user'));
  }

  authHeader() {
    const user = this.getCurrentUser();
    if (user && user.token) {
      return { 'Authorization': 'Bearer ' + user.token };
    } else {
      return {};
    }
  }
}

// Helper function to get auth header for axios requests
export const getAuthHeader = () => {
  const user = JSON.parse(localStorage.getItem('user'));
  if (user && user.token) {
    return { headers: { 'Authorization': 'Bearer ' + user.token } };
  } else {
    return { headers: {} };
  }
}
export default new AuthService();
