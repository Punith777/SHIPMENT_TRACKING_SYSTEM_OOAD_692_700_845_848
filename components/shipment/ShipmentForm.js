import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Form, Button, Alert } from 'react-bootstrap';
import { useParams, useNavigate } from 'react-router-dom';
import ShipmentService from '../../services/shipmentService';
import axios from 'axios';
import AuthService from '../../services/authService';

const ShipmentForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEditMode = !!id;
  
  const [formData, setFormData] = useState({
    trackingNumber: '',
    inventoryTransferId: '',
    originWarehouseId: '',
    destinationWarehouseId: '',
    totalWeight: '',
    totalVolume: '',
    notes: ''
  });
  
  const [warehouses, setWarehouses] = useState([]);
  const [inventoryTransfers, setInventoryTransfers] = useState([]);
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
        
        // Fetch inventory transfers
        const transfersResponse = await axios.get('http://localhost:8080/api/inventory-transfers', config);
        // Filter for pending transfers only
        const pendingTransfers = transfersResponse.data.filter(transfer => 
          transfer.status === 'PENDING'
        );
        setInventoryTransfers(pendingTransfers);
        
        // If in edit mode, fetch the shipment data
        if (isEditMode) {
          const shipmentResponse = await ShipmentService.getShipmentById(id);
          const shipment = shipmentResponse.data;
          
          setFormData({
            trackingNumber: shipment.trackingNumber,
            inventoryTransferId: shipment.inventoryTransfer.transferId,
            originWarehouseId: shipment.originWarehouse.warehouseId,
            destinationWarehouseId: shipment.destinationWarehouse.warehouseId,
            totalWeight: shipment.totalWeight,
            totalVolume: shipment.totalVolume,
            notes: shipment.notes || ''
          });
        } else {
          // Generate a random tracking number for new shipments
          const trackingNumber = 'SHP' + Math.floor(Math.random() * 1000000).toString().padStart(6, '0');
          setFormData(prevState => ({
            ...prevState,
            trackingNumber
          }));
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
    
    // If inventory transfer is selected, auto-populate origin and destination warehouses
    if (name === 'inventoryTransferId' && value) {
      const selectedTransfer = inventoryTransfers.find(
        transfer => transfer.transferId.toString() === value
      );
      
      if (selectedTransfer) {
        setFormData(prevState => ({
          ...prevState,
          originWarehouseId: selectedTransfer.sourceWarehouse.warehouseId,
          destinationWarehouseId: selectedTransfer.destinationWarehouse.warehouseId,
          // Calculate weight and volume based on inventory and quantity
          totalWeight: (selectedTransfer.inventory.unitWeight || 1) * selectedTransfer.quantity,
          totalVolume: (selectedTransfer.inventory.unitVolume || 0.1) * selectedTransfer.quantity
        }));
      }
    }
  };

  const validateForm = () => {
    if (!formData.trackingNumber) {
      setError('Tracking number is required');
      return false;
    }
    
    if (!formData.inventoryTransferId) {
      setError('Inventory transfer is required');
      return false;
    }
    
    if (!formData.originWarehouseId) {
      setError('Origin warehouse is required');
      return false;
    }
    
    if (!formData.destinationWarehouseId) {
      setError('Destination warehouse is required');
      return false;
    }
    
    if (formData.originWarehouseId === formData.destinationWarehouseId) {
      setError('Origin and destination warehouses must be different');
      return false;
    }
    
    if (!formData.totalWeight || formData.totalWeight <= 0) {
      setError('Total weight must be greater than 0');
      return false;
    }
    
    if (!formData.totalVolume || formData.totalVolume <= 0) {
      setError('Total volume must be greater than 0');
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
    
    try {
      // Prepare shipment data
      const shipmentData = {
        trackingNumber: formData.trackingNumber,
        inventoryTransfer: { transferId: parseInt(formData.inventoryTransferId) },
        originWarehouse: { warehouseId: parseInt(formData.originWarehouseId) },
        destinationWarehouse: { warehouseId: parseInt(formData.destinationWarehouseId) },
        totalWeight: parseFloat(formData.totalWeight),
        totalVolume: parseFloat(formData.totalVolume),
        notes: formData.notes,
        status: 'PENDING'
      };
      
      if (isEditMode) {
        // Update existing shipment
        await ShipmentService.updateShipment(id, shipmentData);
        setSuccess('Shipment updated successfully!');
      } else {
        // Create new shipment
        await ShipmentService.createShipment(shipmentData);
        setSuccess('Shipment created successfully!');
      }
      
      // Redirect to shipment list after 2 seconds
      setTimeout(() => {
        navigate('/shipments');
      }, 2000);
      
    } catch (err) {
      console.error('Error saving shipment:', err);
      setError(err.response?.data?.message || 'Failed to save shipment. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <Container className="mt-4">
        <div className="text-center">
          <div className="spinner-border" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
          <p className="mt-2">Loading...</p>
        </div>
      </Container>
    );
  }

  return (
    <Container className="mt-4">
      <h2>{isEditMode ? 'Edit Shipment' : 'Create Shipment'}</h2>
      
      {error && <Alert variant="danger">{error}</Alert>}
      {success && <Alert variant="success">{success}</Alert>}
      
      <Card className="mb-4">
        <Card.Body>
          <Form onSubmit={handleSubmit}>
            <Row className="mb-3">
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Tracking Number</Form.Label>
                  <Form.Control
                    type="text"
                    name="trackingNumber"
                    value={formData.trackingNumber}
                    onChange={handleChange}
                    disabled={isEditMode}
                    required
                  />
                </Form.Group>
              </Col>
              
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Inventory Transfer</Form.Label>
                  <Form.Select
                    name="inventoryTransferId"
                    value={formData.inventoryTransferId}
                    onChange={handleChange}
                    disabled={isEditMode}
                    required
                  >
                    <option value="">-- Select Inventory Transfer --</option>
                    {inventoryTransfers.map(transfer => (
                      <option key={transfer.transferId} value={transfer.transferId}>
                        {transfer.inventory.itemName} - Qty: {transfer.quantity} - From: {transfer.sourceWarehouse.name} To: {transfer.destinationWarehouse.name}
                      </option>
                    ))}
                  </Form.Select>
                </Form.Group>
              </Col>
            </Row>
            
            <Row className="mb-3">
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Origin Warehouse</Form.Label>
                  <Form.Select
                    name="originWarehouseId"
                    value={formData.originWarehouseId}
                    onChange={handleChange}
                    disabled={formData.inventoryTransferId !== ''}
                    required
                  >
                    <option value="">-- Select Origin Warehouse --</option>
                    {warehouses.map(warehouse => (
                      <option key={warehouse.warehouseId} value={warehouse.warehouseId}>
                        {warehouse.name} - {warehouse.location}
                      </option>
                    ))}
                  </Form.Select>
                </Form.Group>
              </Col>
              
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Destination Warehouse</Form.Label>
                  <Form.Select
                    name="destinationWarehouseId"
                    value={formData.destinationWarehouseId}
                    onChange={handleChange}
                    disabled={formData.inventoryTransferId !== ''}
                    required
                  >
                    <option value="">-- Select Destination Warehouse --</option>
                    {warehouses.map(warehouse => (
                      <option key={warehouse.warehouseId} value={warehouse.warehouseId}>
                        {warehouse.name} - {warehouse.location}
                      </option>
                    ))}
                  </Form.Select>
                </Form.Group>
              </Col>
            </Row>
            
            <Row className="mb-3">
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Total Weight (kg)</Form.Label>
                  <Form.Control
                    type="number"
                    step="0.01"
                    min="0.01"
                    name="totalWeight"
                    value={formData.totalWeight}
                    onChange={handleChange}
                    required
                  />
                </Form.Group>
              </Col>
              
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Total Volume (m³)</Form.Label>
                  <Form.Control
                    type="number"
                    step="0.01"
                    min="0.01"
                    name="totalVolume"
                    value={formData.totalVolume}
                    onChange={handleChange}
                    required
                  />
                </Form.Group>
              </Col>
            </Row>
            
            <Form.Group className="mb-3">
              <Form.Label>Notes</Form.Label>
              <Form.Control
                as="textarea"
                rows={3}
                name="notes"
                value={formData.notes}
                onChange={handleChange}
                placeholder="Add any special instructions or notes"
              />
            </Form.Group>
            
            <div className="d-flex justify-content-between">
              <Button variant="secondary" onClick={() => navigate('/shipments')}>
                Cancel
              </Button>
              <Button variant="primary" type="submit" disabled={submitting}>
                {submitting ? 'Saving...' : isEditMode ? 'Update Shipment' : 'Create Shipment'}
              </Button>
            </div>
          </Form>
        </Card.Body>
      </Card>
    </Container>
  );
};

export default ShipmentForm;
