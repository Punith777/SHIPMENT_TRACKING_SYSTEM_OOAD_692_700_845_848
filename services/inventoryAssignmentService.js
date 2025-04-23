import axios from 'axios';
import AuthService from './authService';

const API_URL = 'http://localhost:8080/api/inventory-assignments';

class InventoryAssignmentService {
  assignInventoryToTruck(assignmentData) {
    return axios.post(API_URL, assignmentData, { headers: AuthService.authHeader() });
  }

  getAssignmentsByTruck(truckId) {
    return axios.get(`${API_URL}/truck/${truckId}`, { headers: AuthService.authHeader() });
  }

  getAssignmentsByWarehouse(warehouseId) {
    return axios.get(`${API_URL}/warehouse/${warehouseId}`, { headers: AuthService.authHeader() });
  }
}

export default new InventoryAssignmentService();
