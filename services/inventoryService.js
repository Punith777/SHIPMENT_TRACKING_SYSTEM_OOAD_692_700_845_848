import axios from 'axios';
import AuthService from './authService';

const API_URL = 'http://localhost:8080/api/inventory';

class InventoryService {
  getAllInventory() {
    return axios.get(API_URL, { headers: AuthService.authHeader() });
  }

  getInventoryById(id) {
    return axios.get(`${API_URL}/${id}`, { headers: AuthService.authHeader() });
  }

  getInventoryByWarehouse(warehouseId) {
    return axios.get(`${API_URL}/warehouse/${warehouseId}`, { headers: AuthService.authHeader() });
  }

  createInventory(inventoryData) {
    return axios.post(API_URL, inventoryData, { headers: AuthService.authHeader() });
  }

  updateInventory(id, inventoryData) {
    return axios.put(`${API_URL}/${id}`, inventoryData, { headers: AuthService.authHeader() });
  }

  deleteInventory(id) {
    return axios.delete(`${API_URL}/${id}`, { headers: AuthService.authHeader() });
  }

  transferInventory(transferData) {
    return axios.post(`${API_URL}/transfer`, transferData, { headers: AuthService.authHeader() });
  }
}

export default new InventoryService();
