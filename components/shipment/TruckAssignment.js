import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Form, Button, Alert, Table, Modal } from 'react-bootstrap';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import AuthService from '../../services/authService';
import DatePicker from 'react-datepicker';
import "react-datepicker/dist/react-datepicker.css";

const TruckAssignment = () => {
  const { shipmentId } = useParams();
  const navigate = useNavigate();
  const [shipment, setShipment] = useState(null);
  const [availableTrucks, setAvailableTrucks] = useState([]);
  const [selectedTruckId, setSelectedTruckId] = useState('');
  const [scheduledPickupDate, setScheduledPickupDate] = useState(new Date());
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [confirmationData, setConfirmationData] = useState(null);

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
        // Fetch shipment details
        const shipmentResponse = await axios.get(`http://localhost:8080/api/shipments/${shipmentId}`, config);
        setShipment(shipmentResponse.data);
        
        // Fetch available trucks from the origin warehouse with enough capacity
        const warehouseId = shipmentResponse.data.originWarehouse.warehouseId;
        const weight = shipmentResponse.data.totalWeight;
        const volume = shipmentResponse.data.totalVolume;
        
        const trucksResponse = await axios.get(
          `http://localhost:8080/api/trucks/warehouse/${warehouseId}/available/capacity?weight=${weight}&volume=${volume}`, 
          config
        );
        
        // Filter trucks to only include those with drivers
        const trucksWithDrivers = trucksResponse.data.filter(truck => truck.driver !== null);
        setAvailableTrucks(trucksWithDrivers);
        
        setLoading(false);
      } catch (err) {
        console.error('Error fetching data:', err);
        setError('Failed to load data. Please try again later.');
        setLoading(false);
      }
    };

    if (shipmentId) {
      fetchData();
    }
  }, [shipmentId, token]);

  const handleTruckSelection = (e) => {
    setSelectedTruckId(e.target.value);
  };

  const handleDateChange = (date) => {
    setScheduledPickupDate(date);
  };

  const handleNotesChange = (e) => {
    setNotes(e.target.value);
  };

  const validateForm = () => {
    if (!selectedTruckId) {
      setError('Please select a truck');
      return false;
    }
    
    if (!scheduledPickupDate) {
      setError('Please select a scheduled pickup date');
      return false;
    }
    
    // Ensure pickup date is in the future
    if (scheduledPickupDate < new Date()) {
      setError('Scheduled pickup date must be in the future');
      return false;
    }
    
    return true;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    // Find the selected truck for confirmation
    const selectedTruck = availableTrucks.find(truck => truck.truckId.toString() === selectedTruckId);
    
    setConfirmationData({
      shipment: shipment,
      truck: selectedTruck,
      scheduledPickupDate: scheduledPickupDate
    });
    
    setShowConfirmModal(true);
  };

  const confirmAssignment = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const assignmentData = {
        shipmentId: parseInt(shipmentId),
        truckId: parseInt(selectedTruckId),
        scheduledPickupDate: scheduledPickupDate.toISOString(),
        notes: notes
      };
      
      const response = await axios.post(
        'http://localhost:8080/api/shipments/assign-truck',
        assignmentData,
        config
      );
      
      setSuccess('Truck assigned successfully!');
      setShowConfirmModal(false);
      
      // Redirect to shipment details after 2 seconds
      setTimeout(() => {
        navigate(`/shipments/${shipmentId}`);
      }, 2000);
      
    } catch (err) {
      console.error('Error assigning truck:', err);
      setError(err.response?.data?.message || 'Failed to assign truck. Please try again.');
      setShowConfirmModal(false);
    } finally {
      setLoading(false);
    }
  };

  if (loading && !shipment) {
    return (
      <Container className="mt-4">
        <Card>
          <Card.Body>
            <div className="text-center">
              <div className="spinner-border" role="status">
                <span className="visually-hidden">Loading...</span>
              </div>
              <p className="mt-2">Loading shipment details...</p>
            </div>
          </Card.Body>
        </Card>
      </Container>
    );
  }

  if (error && !shipment) {
    return (
      <Container className="mt-4">
        <Alert variant="danger">{error}</Alert>
        <Button variant="primary" onClick={() => navigate('/shipments')}>
          Back to Shipments
        </Button>
      </Container>
    );
  }

  return (
    <Container className="mt-4">
      <h2>Assign Truck to Shipment</h2>
      
      {error && <Alert variant="danger">{error}</Alert>}
      {success && <Alert variant="success">{success}</Alert>}
      
      <Row>
        <Col md={6}>
          <Card className="mb-4">
            <Card.Header>Shipment Details</Card.Header>
            <Card.Body>
              {shipment && (
                <div>
                  <p><strong>Tracking Number:</strong> {shipment.trackingNumber}</p>
                  <p><strong>Origin Warehouse:</strong> {shipment.originWarehouse.name}</p>
                  <p><strong>Destination Warehouse:</strong> {shipment.destinationWarehouse.name}</p>
                  <p><strong>Total Weight:</strong> {shipment.totalWeight} kg</p>
                  <p><strong>Total Volume:</strong> {shipment.totalVolume} m³</p>
                  <p><strong>Status:</strong> {shipment.status}</p>
                </div>
              )}
            </Card.Body>
          </Card>
        </Col>
        
        <Col md={6}>
          <Card className="mb-4">
            <Card.Header>Assign Truck</Card.Header>
            <Card.Body>
              <Form onSubmit={handleSubmit}>
                <Form.Group className="mb-3">
                  <Form.Label>Select Truck</Form.Label>
                  <Form.Select 
                    value={selectedTruckId} 
                    onChange={handleTruckSelection}
                    required
                  >
                    <option value="">-- Select a truck --</option>
                    {availableTrucks.map(truck => (
                      <option key={truck.truckId} value={truck.truckId}>
                        {truck.registrationNumber} - {truck.model} - Capacity: {truck.capacityWeight}kg/{truck.capacityVolume}m³ - Driver: {truck.driver.username}
                      </option>
                    ))}
                  </Form.Select>
                  {availableTrucks.length === 0 && (
                    <Alert variant="warning" className="mt-2">
                      No suitable trucks available. Please check for trucks with sufficient capacity and assigned drivers.
                    </Alert>
                  )}
                </Form.Group>
                
                <Form.Group className="mb-3">
                  <Form.Label>Scheduled Pickup Date</Form.Label>
                  <DatePicker
                    selected={scheduledPickupDate}
                    onChange={handleDateChange}
                    showTimeSelect
                    timeFormat="HH:mm"
                    timeIntervals={15}
                    dateFormat="MMMM d, yyyy h:mm aa"
                    className="form-control"
                    minDate={new Date()}
                    required
                  />
                </Form.Group>
                
                <Form.Group className="mb-3">
                  <Form.Label>Notes</Form.Label>
                  <Form.Control 
                    as="textarea" 
                    rows={3} 
                    value={notes}
                    onChange={handleNotesChange}
                    placeholder="Add any special instructions or notes"
                  />
                </Form.Group>
                
                <div className="d-grid gap-2">
                  <Button 
                    variant="primary" 
                    type="submit"
                    disabled={loading || availableTrucks.length === 0}
                  >
                    {loading ? 'Processing...' : 'Assign Truck'}
                  </Button>
                  <Button 
                    variant="secondary" 
                    onClick={() => navigate('/shipments')}
                  >
                    Cancel
                  </Button>
                </div>
              </Form>
            </Card.Body>
          </Card>
        </Col>
      </Row>
      
      {/* Confirmation Modal */}
      <Modal show={showConfirmModal} onHide={() => setShowConfirmModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Confirm Truck Assignment</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {confirmationData && (
            <div>
              <p>Are you sure you want to assign the following truck to this shipment?</p>
              <p><strong>Shipment:</strong> {confirmationData.shipment.trackingNumber}</p>
              <p><strong>Truck:</strong> {confirmationData.truck.registrationNumber} ({confirmationData.truck.model})</p>
              <p><strong>Driver:</strong> {confirmationData.truck.driver.username}</p>
              <p><strong>Scheduled Pickup:</strong> {confirmationData.scheduledPickupDate.toLocaleString()}</p>
              <p>This will update the shipment status to "Scheduled for Pickup" and the truck status to "Assigned".</p>
            </div>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowConfirmModal(false)}>
            Cancel
          </Button>
          <Button variant="primary" onClick={confirmAssignment}>
            Confirm Assignment
          </Button>
        </Modal.Footer>
      </Modal>
    </Container>
  );
};

export default TruckAssignment;
