import axios from 'axios';
import AuthService from './authService';

const API_URL = 'http://localhost:8080/api/trucks';

class TruckService {
  getTrucks() {
    const user = AuthService.getCurrentUser();
    return axios.get(API_URL, {
      headers: {
        'Authorization': `Bearer ${user.token}`
      }
    });
  }

  getTruckById(id) {
    const user = AuthService.getCurrentUser();
    return axios.get(API_URL + id, {
      headers: {
        'Authorization': `Bearer ${user.token}`
      }
    });
  }

  getAvailableTrucksByWarehouse(warehouseId) {
    const user = AuthService.getCurrentUser();
    return axios.get(API_URL + 'warehouse/' + warehouseId + '/available', {
      headers: {
        'Authorization': `Bearer ${user.token}`
      }
    });
  }

  getAvailableTrucksWithCapacity(warehouseId, weight, volume) {
    const user = AuthService.getCurrentUser();
    return axios.get(
      `${API_URL}warehouse/${warehouseId}/available/capacity?weight=${weight}&volume=${volume}`, 
      {
        headers: {
          'Authorization': `Bearer ${user.token}`
        }
      }
    );
  }

  getAvailableTrucksWithDriver(warehouseId) {
    const user = AuthService.getCurrentUser();
    return axios.get(API_URL + 'warehouse/' + warehouseId + '/available/with-driver', {
      headers: {
        'Authorization': `Bearer ${user.token}`
      }
    });
  }

  getAvailableTrucks() {
    const user = AuthService.getCurrentUser();
    return this.getTrucks(); // Use the existing getTrucks method
  }

  createTruck(truckData) {
    const user = AuthService.getCurrentUser();
    return axios.post(API_URL, truckData, {
      headers: {
        'Authorization': `Bearer ${user.token}`,
        'Content-Type': 'application/json'
      }
    });
  }

  updateTruck(id, truckData) {
    const user = AuthService.getCurrentUser();
    return axios.put(API_URL + id, truckData, {
      headers: {
        'Authorization': `Bearer ${user.token}`,
        'Content-Type': 'application/json'
      }
    });
  }

  updateTruckStatus(id, status) {
    const user = AuthService.getCurrentUser();
    return axios.patch(
      `${API_URL}${id}/status?status=${status}`,
      {},
      {
        headers: {
          'Authorization': `Bearer ${user.token}`
        }
      }
    );
  }
  
  deleteTruck(id) {
    const user = AuthService.getCurrentUser();
    return axios.delete(`${API_URL}${id}`, {
      headers: {
        'Authorization': `Bearer ${user.token}`
      }
    });
  }
}

export default new TruckService();
