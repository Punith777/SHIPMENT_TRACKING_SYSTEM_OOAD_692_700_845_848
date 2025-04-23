import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Button, Table, Form, Modal, Alert, Badge, Spinner, Tabs, Tab } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { API_URL } from '../../config';
import { getAuthHeader } from '../../services/authService';
import AuthService from '../../services/authService';

const WarehouseStaffDashboard = () => {
  const navigate = useNavigate();
  const [pendingShipments, setPendingShipments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showProcessModal, setShowProcessModal] = useState(false);
  const [showCreateShipmentModal, setShowCreateShipmentModal] = useState(false);
  const [selectedShipment, setSelectedShipment] = useState(null);
  const [barcode, setBarcode] = useState('');
  const [weight, setWeight] = useState('');
  const [processingStatus, setProcessingStatus] = useState('VERIFIED');
  const [notes, setNotes] = useState('');
  const [processingResult, setProcessingResult] = useState(null);
  const [processingError, setProcessingError] = useState('');
  
  // Shipment creation state
  const [warehouses, setWarehouses] = useState([]);
  const [shipmentFormData, setShipmentFormData] = useState({
    trackingNumber: 'SHP' + Math.floor(Math.random() * 1000000).toString().padStart(6, '0'),
    originWarehouseId: '',
    destinationWarehouseId: '',
    totalWeight: '',
    totalVolume: '',
    notes: ''
  });
  const [shipmentFormError, setShipmentFormError] = useState('');
  const [shipmentFormSuccess, setShipmentFormSuccess] = useState('');
  const [creatingShipment, setCreatingShipment] = useState(false);

  useEffect(() => {
    fetchPendingShipments();
    fetchWarehousesAndTransfers();
  }, []);

  const fetchPendingShipments = async () => {
    try {
      setLoading(true);
      // Using a try-catch to handle potential API errors
      try {
        const response = await axios.get(`${API_URL}/shipments`, getAuthHeader());
        // Filter shipments that are scheduled for pickup
        const scheduled = response.data.filter(shipment => 
          shipment.status === 'SCHEDULED_FOR_PICKUP' || shipment.status === 'READY_FOR_PICKUP'
        );
        setPendingShipments(scheduled);
      } catch (apiError) {
        console.error('API error fetching shipments:', apiError);
        // If the API fails, set an empty array instead of failing completely
        setPendingShipments([]);
      }
      setLoading(false);
    } catch (err) {
      console.error('Error fetching shipments:', err);
      setError('Failed to load shipments. Please try again.');
      setLoading(false);
    }
  };
  
  const fetchWarehousesAndTransfers = async () => {
    try {
      // Get the current user's token
      const currentUser = AuthService.getCurrentUser();
      const token = currentUser?.token;
      
      // Configure headers with JWT token
      const config = {
        headers: { Authorization: `Bearer ${token}` }
      };
      
      // Fetch warehouses
      const warehousesResponse = await axios.get(`${API_URL}/warehouses`, config);
      setWarehouses(warehousesResponse.data);
    } catch (err) {
      console.error('Error fetching warehouses:', err);
    }
  };

  const openProcessModal = (shipment) => {
    setSelectedShipment(shipment);
    setShowProcessModal(true);
    setProcessingResult(null);
    setProcessingError('');
  };

  const closeProcessModal = () => {
    setShowProcessModal(false);
    setSelectedShipment(null);
    setBarcode('');
    setWeight('');
    setNotes('');
    setProcessingResult(null);
    setProcessingError('');
  };

  const handleProcessItem = async (e) => {
    e.preventDefault();
    setProcessingError('');
    setProcessingResult(null);

    if (!barcode) {
      setProcessingError('Please enter a barcode');
      return;
    }

    if (!weight) {
      setProcessingError('Please enter the item weight');
      return;
    }

    try {
      const response = await axios.post(
        `${API_URL}/shipments/process-item`,
        {
          trackingNumber: selectedShipment.trackingNumber,
          barcode,
          weight: parseFloat(weight),
          status: processingStatus,
          notes
        },
        getAuthHeader()
      );

      if (response.data.success) {
        setProcessingResult(response.data);
        setBarcode('');
        setWeight('');
        setNotes('');
        // Refresh shipments list if item was processed successfully
        fetchPendingShipments();
      } else {
        setProcessingError(response.data.message || 'Failed to process item');
      }
    } catch (err) {
      setProcessingError(err.response?.data?.message || 'An error occurred while processing the item');
    }
  };

  const handleReportMissing = async () => {
    if (!barcode) {
      setProcessingError('Please enter a barcode to report as missing');
      return;
    }

    try {
      const response = await axios.post(
        `${API_URL}/shipments/report-missing/${selectedShipment.trackingNumber}/${barcode}`,
        {},
        getAuthHeader()
      );

      if (response.data.success) {
        setProcessingResult(response.data);
        setBarcode('');
        fetchPendingShipments();
      } else {
        setProcessingError(response.data.message || 'Failed to report missing item');
      }
    } catch (err) {
      setProcessingError(err.response?.data?.message || 'An error occurred while reporting the missing item');
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'PENDING':
        return <Badge bg="secondary">Pending</Badge>;
      case 'SCHEDULED_FOR_PICKUP':
        return <Badge bg="primary">Scheduled</Badge>;
      case 'READY_FOR_PICKUP':
        return <Badge bg="success">Ready</Badge>;
      case 'IN_TRANSIT':
        return <Badge bg="info">In Transit</Badge>;
      case 'DELIVERED':
        return <Badge bg="success">Delivered</Badge>;
      case 'CANCELLED':
        return <Badge bg="danger">Cancelled</Badge>;
      default:
        return <Badge bg="secondary">{status}</Badge>;
    }
  };

  // Handle shipment form change
  const handleShipmentFormChange = (e) => {
    const { name, value } = e.target;
    setShipmentFormData(prevState => ({
      ...prevState,
      [name]: value
    }));
  };
  
  // Validate shipment form
  const validateShipmentForm = () => {
    if (!shipmentFormData.trackingNumber) {
      setShipmentFormError('Tracking number is required');
      return false;
    }
    
    if (!shipmentFormData.originWarehouseId) {
      setShipmentFormError('Origin warehouse is required');
      return false;
    }
    
    if (!shipmentFormData.destinationWarehouseId) {
      setShipmentFormError('Destination warehouse is required');
      return false;
    }
    
    if (shipmentFormData.originWarehouseId === shipmentFormData.destinationWarehouseId) {
      setShipmentFormError('Origin and destination warehouses must be different');
      return false;
    }
    
    if (!shipmentFormData.totalWeight || shipmentFormData.totalWeight <= 0) {
      setShipmentFormError('Total weight must be greater than 0');
      return false;
    }
    
    if (!shipmentFormData.totalVolume || shipmentFormData.totalVolume <= 0) {
      setShipmentFormError('Total volume must be greater than 0');
      return false;
    }
    
    return true;
  };
  
  // Handle shipment form submit
  const handleCreateShipment = async (e) => {
    e.preventDefault();
    
    if (!validateShipmentForm()) {
      return;
    }
    
    setCreatingShipment(true);
    setShipmentFormError('');
    
    try {
      // Prepare shipment data
      const shipmentData = {
        trackingNumber: shipmentFormData.trackingNumber,
        originWarehouse: { warehouseId: parseInt(shipmentFormData.originWarehouseId) },
        destinationWarehouse: { warehouseId: parseInt(shipmentFormData.destinationWarehouseId) },
        totalWeight: parseFloat(shipmentFormData.totalWeight),
        totalVolume: parseFloat(shipmentFormData.totalVolume),
        notes: shipmentFormData.notes,
        status: 'PENDING',
        // Add required fields that might be missing
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      
      // Create new shipment - using a more robust approach
      try {
        await axios.post(`${API_URL}/shipments`, shipmentData, getAuthHeader());
      } catch (apiError) {
        console.error('API error details:', apiError.response?.data);
        throw apiError; // Re-throw to be caught by the outer catch block
      }
      setShipmentFormSuccess('Shipment created successfully!');
      
      // Reset form and close modal after 2 seconds
      setTimeout(() => {
        setShowCreateShipmentModal(false);
        setShipmentFormData({
          trackingNumber: 'SHP' + Math.floor(Math.random() * 1000000).toString().padStart(6, '0'),
          originWarehouseId: '',
          destinationWarehouseId: '',
          totalWeight: '',
          totalVolume: '',
          notes: ''
        });
        setShipmentFormSuccess('');
        fetchPendingShipments();
      }, 2000);
      
    } catch (err) {
      console.error('Error creating shipment:', err);
      setShipmentFormError(err.response?.data?.message || 'Failed to create shipment. Please try again.');
    } finally {
      setCreatingShipment(false);
    }
  };
  
  return (
    <Container fluid className="mt-4">
      <h2 className="mb-4">Warehouse Staff Dashboard</h2>
      
      {error && <Alert variant="danger">{error}</Alert>}
      <Row>
        <Col md={4}>
          <Card className="mb-4">
            <Card.Body>
              <Card.Title>Pending Shipments</Card.Title>
              <div className="h2">{loading ? <Spinner animation="border" size="sm" /> : pendingShipments.length}</div>
              <Button variant="primary" size="sm" onClick={() => fetchPendingShipments()}>Refresh</Button>
            </Card.Body>
          </Card>
        </Col>
        <Col md={4}>
          <Card className="mb-4">
            <Card.Body>
              <Card.Title>Ready for Pickup</Card.Title>
              <div className="h2">
                {loading ? <Spinner animation="border" size="sm" /> : 
                  pendingShipments.filter(s => s.status === 'READY_FOR_PICKUP').length}
              </div>
              <Button variant="success" size="sm">View Ready Shipments</Button>
            </Card.Body>
          </Card>
        </Col>
        <Col md={4}>
          <Card className="mb-4">
            <Card.Body>
              <Card.Title>Scheduled Today</Card.Title>
              <div className="h2">
                {loading ? <Spinner animation="border" size="sm" /> : 
                  pendingShipments.filter(s => {
                    if (!s.scheduledPickupDate) return false;
                    const pickupDate = new Date(s.scheduledPickupDate).toDateString();
                    const today = new Date().toDateString();
                    return pickupDate === today;
                  }).length}
              </div>
              <Button variant="primary" size="sm">View Schedule</Button>
            </Card.Body>
          </Card>
        </Col>
      </Row>
      <Row>
        <Col md={8}>
          <Card className="mb-4">
            <Card.Header>Shipments to Process</Card.Header>
            <Card.Body>
              {loading ? (
                <div className="text-center p-3">
                  <Spinner animation="border" />
                  <p className="mt-2">Loading shipments...</p>
                </div>
              ) : pendingShipments.length === 0 ? (
                <Alert variant="info">No shipments to process at this time.</Alert>
              ) : (
                <Table responsive>
                  <thead>
                    <tr>
                      <th>Tracking #</th>
                      <th>Origin</th>
                      <th>Destination</th>
                      <th>Scheduled Pickup</th>
                      <th>Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pendingShipments.map(shipment => (
                      <tr key={shipment.shipmentId}>
                        <td>{shipment.trackingNumber}</td>
                        <td>{shipment.originWarehouse?.name || 'N/A'}</td>
                        <td>{shipment.destinationWarehouse?.name || 'N/A'}</td>
                        <td>
                          {shipment.scheduledPickupDate 
                            ? new Date(shipment.scheduledPickupDate).toLocaleString() 
                            : 'Not scheduled'}
                        </td>
                        <td>{getStatusBadge(shipment.status)}</td>
                        <td>
                          <Button 
                            variant={shipment.status === 'READY_FOR_PICKUP' ? "success" : "primary"} 
                            size="sm"
                            onClick={() => openProcessModal(shipment)}
                          >
                            {shipment.status === 'READY_FOR_PICKUP' ? 'View Details' : 'Process Items'}
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              )}
            </Card.Body>
          </Card>
        </Col>
        <Col md={4}>
          <Card className="mb-4">
            <Card.Header>Quick Actions</Card.Header>
            <Card.Body>
              <div className="d-grid gap-2">
                <Button variant="primary" className="mb-2" onClick={() => setShowCreateShipmentModal(true)}>Create New Shipment</Button>
                <Button variant="outline-primary" className="mb-2" onClick={() => fetchPendingShipments()}>Refresh Shipments</Button>
                <Button variant="outline-primary" className="mb-2">Print Shipping Labels</Button>
                <Button variant="outline-primary">Report Issue</Button>
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Create Shipment Modal */}
      <Modal show={showCreateShipmentModal} onHide={() => setShowCreateShipmentModal(false)} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>Create New Shipment</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {shipmentFormError && <Alert variant="danger">{shipmentFormError}</Alert>}
          {shipmentFormSuccess && <Alert variant="success">{shipmentFormSuccess}</Alert>}
          
          <Form onSubmit={handleCreateShipment}>
            <Row>
              <Col md={12}>
                <Form.Group className="mb-3">
                  <Form.Label>Tracking Number</Form.Label>
                  <Form.Control
                    type="text"
                    name="trackingNumber"
                    value={shipmentFormData.trackingNumber}
                    onChange={handleShipmentFormChange}
                    required
                    disabled
                  />
                  <Form.Text className="text-muted">
                    Auto-generated tracking number
                  </Form.Text>
                </Form.Group>
              </Col>
            </Row>
            
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Origin Warehouse</Form.Label>
                  <Form.Select
                    name="originWarehouseId"
                    value={shipmentFormData.originWarehouseId}
                    onChange={handleShipmentFormChange}
                    required
                  >
                    <option value="">Select Origin Warehouse</option>
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
                    value={shipmentFormData.destinationWarehouseId}
                    onChange={handleShipmentFormChange}
                    required
                  >
                    <option value="">Select Destination Warehouse</option>
                    {warehouses.map(warehouse => (
                      <option key={warehouse.warehouseId} value={warehouse.warehouseId}>
                        {warehouse.name} - {warehouse.location}
                      </option>
                    ))}
                  </Form.Select>
                </Form.Group>
              </Col>
            </Row>
            
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Total Weight (kg)</Form.Label>
                  <Form.Control
                    type="number"
                    step="0.01"
                    name="totalWeight"
                    value={shipmentFormData.totalWeight}
                    onChange={handleShipmentFormChange}
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
                    name="totalVolume"
                    value={shipmentFormData.totalVolume}
                    onChange={handleShipmentFormChange}
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
                value={shipmentFormData.notes}
                onChange={handleShipmentFormChange}
              />
            </Form.Group>
            
            <div className="d-flex justify-content-end">
              <Button variant="secondary" className="me-2" onClick={() => setShowCreateShipmentModal(false)}>
                Cancel
              </Button>
              <Button variant="primary" type="submit" disabled={creatingShipment}>
                {creatingShipment ? 'Creating...' : 'Create Shipment'}
              </Button>
            </div>
          </Form>
        </Modal.Body>
      </Modal>

      {/* Shipment Processing Modal */}
      <Modal show={showProcessModal} onHide={closeProcessModal} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>
            Process Shipment: {selectedShipment?.trackingNumber}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {selectedShipment && (
            <>
              <Row className="mb-3">
                <Col md={6}>
                  <p><strong>Origin:</strong> {selectedShipment.originWarehouse?.name || 'N/A'}</p>
                  <p><strong>Destination:</strong> {selectedShipment.destinationWarehouse?.name || 'N/A'}</p>
                </Col>
                <Col md={6}>
                  <p><strong>Status:</strong> {getStatusBadge(selectedShipment.status)}</p>
                  <p><strong>Total Weight:</strong> {selectedShipment.totalWeight} kg</p>
                </Col>
              </Row>

              {processingError && <Alert variant="danger">{processingError}</Alert>}
              
              {processingResult && processingResult.success && (
                <Alert variant="success">
                  <p>{processingResult.message}</p>
                  <p>Processed items: {processingResult.processedItemsCount} of {processingResult.totalItemsCount}</p>
                  {processingResult.readyForLoading && (
                    <p className="fw-bold">Shipment is now ready for pickup!</p>
                  )}
                </Alert>
              )}

              {selectedShipment.status !== 'READY_FOR_PICKUP' && (
                <Form onSubmit={handleProcessItem}>
                  <Row>
                    <Col md={4}>
                      <Form.Group className="mb-3">
                        <Form.Label>Barcode</Form.Label>
                        <Form.Control
                          type="text"
                          placeholder="Scan or enter barcode"
                          value={barcode}
                          onChange={(e) => setBarcode(e.target.value)}
                          required
                        />
                      </Form.Group>
                    </Col>
                    <Col md={4}>
                      <Form.Group className="mb-3">
                        <Form.Label>Weight (kg)</Form.Label>
                        <Form.Control
                          type="number"
                          step="0.01"
                          placeholder="Enter weight"
                          value={weight}
                          onChange={(e) => setWeight(e.target.value)}
                          required
                        />
                      </Form.Group>
                    </Col>
                    <Col md={4}>
                      <Form.Group className="mb-3">
                        <Form.Label>Status</Form.Label>
                        <Form.Select
                          value={processingStatus}
                          onChange={(e) => setProcessingStatus(e.target.value)}
                        >
                          <option value="VERIFIED">Verified</option>
                          <option value="DAMAGED">Damaged</option>
                          <option value="MISSING">Missing</option>
                        </Form.Select>
                      </Form.Group>
                    </Col>
                  </Row>
                  <Form.Group className="mb-3">
                    <Form.Label>Notes</Form.Label>
                    <Form.Control
                      as="textarea"
                      rows={2}
                      placeholder="Optional notes"
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                    />
                  </Form.Group>
                  <div className="d-flex">
                    <Button variant="primary" type="submit" className="me-2">
                      Process Item
                    </Button>
                    <Button variant="danger" type="button" onClick={handleReportMissing}>
                      Report Missing
                    </Button>
                  </div>
                </Form>
              )}

              {selectedShipment.status === 'READY_FOR_PICKUP' && (
                <Alert variant="success">
                  <p className="mb-0">This shipment has been fully processed and is ready for pickup.</p>
                </Alert>
              )}
            </>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={closeProcessModal}>
            Close
          </Button>
          {selectedShipment?.status === 'READY_FOR_PICKUP' && (
            <Button variant="success">
              Print Shipping Label
            </Button>
          )}
        </Modal.Footer>
      </Modal>
    </Container>
  );
};

export default WarehouseStaffDashboard;