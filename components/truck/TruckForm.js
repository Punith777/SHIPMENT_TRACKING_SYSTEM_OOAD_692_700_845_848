import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Form, Button, Alert, Spinner } from 'react-bootstrap';
import { useParams, useNavigate } from 'react-router-dom';
import TruckService from '../../services/truckService';
import axios from 'axios';
import AuthService from '../../services/authService';
import DatePicker from 'react-datepicker';
import "react-datepicker/dist/react-datepicker.css";

const TruckForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEditMode = !!id;
  
  const [formData, setFormData] = useState({
    registrationNumber: '',
    model: '',
    capacityWeight: '',
    capacityVolume: '',
    driverId: '',
    homeWarehouseId: '',
    status: 'AVAILABLE',
    lastMaintenanceDate: null,
    nextMaintenanceDate: null
  });
  
  const [warehouses, setWarehouses] = useState([]);
  const [drivers, setDrivers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  
  const currentUser = AuthService.getCurrentUser();
  const token = currentUser?.token;
  
  // Configure headers with JWT token
  const config = {
    headers: { Authorization: `Bearer ${token}` }
  };

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        // Fetch warehouses
        const warehousesResponse = await axios.get('http://localhost:8080/api/warehouses', config);
        setWarehouses(warehousesResponse.data);
        
        // Fetch drivers (users with delivery_driver role)
        const driversResponse = await axios.get('http://localhost:8080/api/users/delivery-drivers', config);
        const driversData = driversResponse.data;
        setDrivers(driversData);
        
        // If in edit mode, fetch the truck data
        if (isEditMode) {
          const truckResponse = await TruckService.getTruckById(id);
          const truck = truckResponse.data;
          
          setFormData({
            registrationNumber: truck.registrationNumber,
            model: truck.model,
            capacityWeight: truck.capacityWeight,
            capacityVolume: truck.capacityVolume,
            driverId: truck.driver ? truck.driver.userId : '',
            homeWarehouseId: truck.homeWarehouse ? truck.homeWarehouse.warehouseId : '',
            status: truck.status,
            lastMaintenanceDate: truck.lastMaintenanceDate ? new Date(truck.lastMaintenanceDate) : null,
            nextMaintenanceDate: truck.nextMaintenanceDate ? new Date(truck.nextMaintenanceDate) : null
          });
        }
        
        setLoading(false);
      } catch (err) {
        console.error('Error fetching data:', err);
        setError('Failed to load data. Please try again later.');
        setLoading(false);
      }
    };

    fetchData();
  }, [id, isEditMode, token]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prevState => ({
      ...prevState,
      [name]: value
    }));
  };
  
  const handleDateChange = (date, fieldName) => {
    setFormData(prevState => ({
      ...prevState,
      [fieldName]: date
    }));
  };

  const validateForm = () => {
    if (!formData.registrationNumber) {
      setError('Registration number is required');
      return false;
    }
    
    if (!formData.model) {
      setError('Model is required');
      return false;
    }
    
    if (!formData.capacityWeight || formData.capacityWeight <= 0) {
      setError('Capacity weight must be greater than 0');
      return false;
    }
    
    if (!formData.capacityVolume || formData.capacityVolume <= 0) {
      setError('Capacity volume must be greater than 0');
      return false;
    }
    
    if (!formData.homeWarehouseId) {
      setError('Home warehouse is required');
      return false;
    }
    
    if (!formData.status) {
      setError('Status is required');
      return false;
    }
    
    return true;
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    setSubmitting(true);
    setError(null);
    setSuccess(null);
    
    try {
      // Simple truck data for API
      const truckData = {
        registrationNumber: formData.registrationNumber,
        model: formData.model,
        capacityWeight: parseFloat(formData.capacityWeight),
        capacityVolume: parseFloat(formData.capacityVolume),
        homeWarehouseId: parseInt(formData.homeWarehouseId),
        status: formData.status
      };
      
      // Only add dates if they exist
      if (formData.lastMaintenanceDate) {
        truckData.lastMaintenanceDate = formData.lastMaintenanceDate;
      }
      
      if (formData.nextMaintenanceDate) {
        truckData.nextMaintenanceDate = formData.nextMaintenanceDate;
      }
      
      // Only add driver ID if it exists
      if (formData.driverId) {
        truckData.driverId = parseInt(formData.driverId);
      }
      
      if (isEditMode) {
        // Update existing truck
        await TruckService.updateTruck(id, truckData);
        setSuccess('Truck updated successfully!');
      } else {
        // Create new truck
        await TruckService.createTruck(truckData);
        setSuccess('Truck created successfully!');
      }
      
      // Redirect to truck list after 2 seconds
      setTimeout(() => {
        navigate('/trucks');
      }, 2000);
      
    } catch (err) {
      console.error('Error saving truck:', err);
      setError(err.response?.data?.message || 'Failed to save truck. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <Container className="mt-5">
        <div className="text-center">
          <Spinner animation="border" role="status" variant="primary" style={{ width: '3rem', height: '3rem' }}>
            <span className="visually-hidden">Loading...</span>
          </Spinner>
          <p className="mt-3 text-primary fw-bold">Loading truck information...</p>
        </div>
      </Container>
    );
  }

  return (
    <Container className="mt-4">
      <Row className="mb-4">
        <Col>
          <h2 className="text-primary">{isEditMode ? 'Edit Truck' : 'Add Truck'}</h2>
          <p className="text-muted">Fill in the details to {isEditMode ? 'update' : 'add a new'} truck to the fleet</p>
        </Col>
      </Row>
      
      {error && <Alert variant="danger">{error}</Alert>}
      {success && <Alert variant="success">{success}</Alert>}
      
      <Card className="mb-4 shadow-sm border-primary">
        <Card.Header className="bg-primary text-white">
          <h5 className="mb-0">Truck Information</h5>
        </Card.Header>
        <Card.Body className="bg-light">
          <Form onSubmit={handleSubmit}>
            <Row className="mb-3">
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label><strong>Registration Number</strong></Form.Label>
                  <Form.Control
                    type="text"
                    name="registrationNumber"
                    value={formData.registrationNumber}
                    onChange={handleChange}
                    disabled={isEditMode}
                    required
                    className="border-primary"
                    placeholder="e.g., KA-01-AB-1234"
                  />
                  <Form.Text className="text-muted">
                    Enter the official vehicle registration number
                  </Form.Text>
                </Form.Group>
              </Col>
              
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label><strong>Model</strong></Form.Label>
                  <Form.Control
                    type="text"
                    name="model"
                    value={formData.model}
                    onChange={handleChange}
                    required
                    className="border-primary"
                    placeholder="e.g., Tata LPT 1613"
                  />
                  <Form.Text className="text-muted">
                    Enter the truck model name
                  </Form.Text>
                </Form.Group>
              </Col>
            </Row>
            
            <Row className="mb-3">
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label><strong>Capacity Weight (kg)</strong></Form.Label>
                  <Form.Control
                    type="number"
                    step="0.01"
                    min="0.01"
                    name="capacityWeight"
                    value={formData.capacityWeight}
                    onChange={handleChange}
                    required
                    className="border-primary"
                    placeholder="e.g., 5000"
                  />
                  <Form.Text className="text-muted">
                    Maximum weight capacity in kilograms
                  </Form.Text>
                </Form.Group>
              </Col>
              
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label><strong>Capacity Volume (m³)</strong></Form.Label>
                  <Form.Control
                    type="number"
                    step="0.01"
                    min="0.01"
                    name="capacityVolume"
                    value={formData.capacityVolume}
                    onChange={handleChange}
                    required
                    className="border-primary"
                    placeholder="e.g., 20"
                  />
                  <Form.Text className="text-muted">
                    Maximum volume capacity in cubic meters
                  </Form.Text>
                </Form.Group>
              </Col>
            </Row>
            
            <Row className="mb-3">
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label><strong>Driver</strong></Form.Label>
                  <Form.Select
                    name="driverId"
                    value={formData.driverId}
                    onChange={handleChange}
                    className="border-primary"
                  >
                    <option value="">-- No Driver Assigned --</option>
                    {drivers.map(driver => (
                      <option key={driver.id} value={driver.id}>
                        {driver.username}
                      </option>
                    ))}
                  </Form.Select>
                  <Form.Text className="text-muted">
                    Select a driver for this truck
                  </Form.Text>
                </Form.Group>
              </Col>
              
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label><strong>Home Warehouse</strong></Form.Label>
                  <Form.Select
                    name="homeWarehouseId"
                    value={formData.homeWarehouseId}
                    onChange={handleChange}
                    required
                    className="border-primary"
                  >
                    <option value="">-- Select Home Warehouse --</option>
                    {warehouses.map(warehouse => (
                      <option key={warehouse.warehouseId} value={warehouse.warehouseId}>
                        {warehouse.name} - {warehouse.location}
                      </option>
                    ))}
                  </Form.Select>
                  <Form.Text className="text-muted">
                    Select the warehouse where this truck is primarily stationed
                  </Form.Text>
                </Form.Group>
              </Col>
            </Row>
            
            <Row className="mb-3">
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label><strong>Status</strong></Form.Label>
                  <Form.Select
                    name="status"
                    value={formData.status}
                    onChange={handleChange}
                    required
                    className="border-primary"
                  >
                    <option value="AVAILABLE">Available</option>
                    <option value="ASSIGNED">Assigned</option>
                    <option value="IN_TRANSIT">In Transit</option>
                    <option value="MAINTENANCE">Maintenance</option>
                    <option value="OUT_OF_SERVICE">Out of Service</option>
                  </Form.Select>
                  <Form.Text className="text-muted">
                    Current operational status of the truck
                  </Form.Text>
                </Form.Group>
              </Col>
            </Row>
            
            <Row className="mb-3">
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label><strong>Last Maintenance Date</strong></Form.Label>
                  <DatePicker
                    selected={formData.lastMaintenanceDate}
                    onChange={(date) => handleDateChange(date, 'lastMaintenanceDate')}
                    className="form-control border-primary"
                    dateFormat="MMMM d, yyyy"
                    maxDate={new Date()}
                    isClearable
                    placeholderText="Select last maintenance date"
                  />
                  <Form.Text className="text-muted">
                    When was the last maintenance performed
                  </Form.Text>
                </Form.Group>
              </Col>
              
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label><strong>Next Maintenance Date</strong></Form.Label>
                  <DatePicker
                    selected={formData.nextMaintenanceDate}
                    onChange={(date) => handleDateChange(date, 'nextMaintenanceDate')}
                    className="form-control border-primary"
                    dateFormat="MMMM d, yyyy"
                    minDate={new Date()}
                    isClearable
                    placeholderText="Select next maintenance date"
                  />
                  <Form.Text className="text-muted">
                    When is the next scheduled maintenance
                  </Form.Text>
                </Form.Group>
              </Col>
            </Row>
            
            <div className="d-flex justify-content-between mt-4">
              <Button variant="outline-secondary" onClick={() => navigate('/trucks')} size="lg">
                <i className="bi bi-arrow-left"></i> Cancel
              </Button>
              <Button variant="primary" type="submit" disabled={submitting} size="lg" className="px-4">
                {submitting ? (
                  <>
                    <Spinner as="span" animation="border" size="sm" role="status" aria-hidden="true" className="me-2" />
                    Saving...
                  </>
                ) : (
                  <>
                    <i className="bi bi-save me-2"></i>
                    {isEditMode ? 'Update Truck' : 'Add Truck'}
                  </>
                )}
              </Button>
            </div>
          </Form>
        </Card.Body>
      </Card>
    </Container>
  );
};

export default TruckForm;
