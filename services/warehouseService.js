import axios from 'axios';
import AuthService from './authService';

const API_URL = 'http://localhost:8080/api/warehouses';

class WarehouseService {
  getAllWarehouses() {
    return axios.get(API_URL, { headers: AuthService.authHeader() });
  }

  getWarehouseById(id) {
    return axios.get(`${API_URL}/${id}`, { headers: AuthService.authHeader() });
  }

  createWarehouse(warehouseData) {
    return axios.post(API_URL, warehouseData, { headers: AuthService.authHeader() });
  }

  updateWarehouse(id, warehouseData) {
    return axios.put(`${API_URL}/${id}`, warehouseData, { headers: AuthService.authHeader() });
  }

  deleteWarehouse(id) {
    return axios.delete(`${API_URL}/${id}`, { headers: AuthService.authHeader() });
  }
}

export default new WarehouseService();
