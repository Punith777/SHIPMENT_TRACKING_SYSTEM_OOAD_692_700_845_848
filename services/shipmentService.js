import axios from 'axios';
import AuthService from './authService';

const API_URL = 'http://localhost:8080/api/shipments/';

class ShipmentService {
  getShipments() {
    const user = AuthService.getCurrentUser();
    return axios.get(API_URL, {
      headers: {
        'Authorization': `Bearer ${user.token}`
      }
    });
  }

  getShipmentById(id) {
    const user = AuthService.getCurrentUser();
    return axios.get(API_URL + id, {
      headers: {
        'Authorization': `Bearer ${user.token}`
      }
    });
  }

  getShipmentByTrackingNumber(trackingNumber) {
    const user = AuthService.getCurrentUser();
    return axios.get(API_URL + 'tracking/' + trackingNumber, {
      headers: {
        'Authorization': `Bearer ${user.token}`
      }
    });
  }

  getPendingShipmentsByWarehouse(warehouseId) {
    const user = AuthService.getCurrentUser();
    return axios.get(API_URL + 'warehouse/' + warehouseId + '/pending', {
      headers: {
        'Authorization': `Bearer ${user.token}`
      }
    });
  }

  createShipment(shipmentData) {
    const user = AuthService.getCurrentUser();
    return axios.post(API_URL, shipmentData, {
      headers: {
        'Authorization': `Bearer ${user.token}`,
        'Content-Type': 'application/json'
      }
    });
  }

  updateShipment(id, shipmentData) {
    const user = AuthService.getCurrentUser();
    return axios.put(API_URL + id, shipmentData, {
      headers: {
        'Authorization': `Bearer ${user.token}`,
        'Content-Type': 'application/json'
      }
    });
  }

  assignTruckToShipment(assignmentData) {
    const user = AuthService.getCurrentUser();
    return axios.post(API_URL + 'assign-truck', assignmentData, {
      headers: {
        'Authorization': `Bearer ${user.token}`,
        'Content-Type': 'application/json'
      }
    });
  }
}

export default new ShipmentService();
