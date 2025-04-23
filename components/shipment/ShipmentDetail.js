import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Badge, Button, Alert } from 'react-bootstrap';
import { Link, useParams, useNavigate } from 'react-router-dom';
import ShipmentService from '../../services/shipmentService';

const ShipmentDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [shipment, setShipment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (id) {
      fetchShipment(id);
    }
  }, [id]);

  const fetchShipment = (shipmentId) => {
    setLoading(true);
    ShipmentService.getShipmentById(shipmentId)
      .then(response => {
        setShipment(response.data);
        setLoading(false);
      })
      .catch(error => {
        console.error('Error fetching shipment:', error);
        setError('Failed to load shipment details. Please try again later.');
        setLoading(false);
      });
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'PENDING':
        return <Badge bg="warning">Pending</Badge>;
      case 'SCHEDULED_FOR_PICKUP':
        return <Badge bg="info">Scheduled for Pickup</Badge>;
      case 'IN_TRANSIT':
        return <Badge bg="primary">In Transit</Badge>;
      case 'DELIVERED':
        return <Badge bg="success">Delivered</Badge>;
      case 'CANCELLED':
        return <Badge bg="danger">Cancelled</Badge>;
      default:
        return <Badge bg="secondary">{status}</Badge>;
    }
  };

  if (loading) {
    return (
      <Container className="mt-4">
        <div className="text-center">
          <div className="spinner-border" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
          <p className="mt-2">Loading shipment details...</p>
        </div>
      </Container>
    );
  }

  if (error) {
    return (
      <Container className="mt-4">
        <Alert variant="danger">{error}</Alert>
        <Button variant="primary" onClick={() => navigate('/shipments')}>
          Back to Shipments
        </Button>
      </Container>
    );
  }

  if (!shipment) {
    return (
      <Container className="mt-4">
        <Alert variant="warning">Shipment not found.</Alert>
        <Button variant="primary" onClick={() => navigate('/shipments')}>
          Back to Shipments
        </Button>
      </Container>
    );
  }

  return (
    <Container className="mt-4">
      <Row className="mb-3">
        <Col>
          <h2>Shipment Details</h2>
        </Col>
        <Col className="text-end">
          <Button variant="primary" onClick={() => navigate('/shipments')}>
            Back to Shipments
          </Button>
        </Col>
      </Row>

      <Row>
        <Col md={8}>
          <Card className="mb-4">
            <Card.Header>
              <div className="d-flex justify-content-between align-items-center">
                <h5 className="mb-0">Tracking Number: {shipment.trackingNumber}</h5>
                {getStatusBadge(shipment.status)}
              </div>
            </Card.Header>
            <Card.Body>
              <Row className="mb-3">
                <Col md={6}>
                  <h6>Origin Warehouse</h6>
                  <p>{shipment.originWarehouse.name}</p>
                  <p>{shipment.originWarehouse.location}</p>
                </Col>
                <Col md={6}>
                  <h6>Destination Warehouse</h6>
                  <p>{shipment.destinationWarehouse.name}</p>
                  <p>{shipment.destinationWarehouse.location}</p>
                </Col>
              </Row>
              
              <Row className="mb-3">
                <Col md={6}>
                  <h6>Shipment Weight</h6>
                  <p>{shipment.totalWeight} kg</p>
                </Col>
                <Col md={6}>
                  <h6>Shipment Volume</h6>
                  <p>{shipment.totalVolume} m³</p>
                </Col>
              </Row>
              
              <Row className="mb-3">
                <Col md={12}>
                  <h6>Inventory Transfer</h6>
                  <p>
                    <Link to={`/inventory/${shipment.inventoryTransfer.inventory.inventoryId}`}>
                      {shipment.inventoryTransfer.inventory.itemName}
                    </Link>
                    {' - '}
                    Quantity: {shipment.inventoryTransfer.quantity}
                  </p>
                </Col>
              </Row>
              
              {shipment.notes && (
                <Row className="mb-3">
                  <Col md={12}>
                    <h6>Notes</h6>
                    <p>{shipment.notes}</p>
                  </Col>
                </Row>
              )}
            </Card.Body>
          </Card>
        </Col>
        
        <Col md={4}>
          <Card className="mb-4">
            <Card.Header>
              <h5 className="mb-0">Truck Assignment</h5>
            </Card.Header>
            <Card.Body>
              {shipment.assignedTruck ? (
                <>
                  <h6>Assigned Truck</h6>
                  <p>
                    <Link to={`/trucks/${shipment.assignedTruck.truckId}`}>
                      {shipment.assignedTruck.registrationNumber}
                    </Link>
                  </p>
                  <p>Model: {shipment.assignedTruck.model}</p>
                  <p>Capacity: {shipment.assignedTruck.capacityWeight} kg / {shipment.assignedTruck.capacityVolume} m³</p>
                  
                  <h6 className="mt-3">Driver</h6>
                  <p>{shipment.assignedTruck.driver ? shipment.assignedTruck.driver.username : 'No driver assigned'}</p>
                  
                  <h6 className="mt-3">Scheduled Pickup</h6>
                  <p>{shipment.scheduledPickupDate ? new Date(shipment.scheduledPickupDate).toLocaleString() : 'Not scheduled'}</p>
                </>
              ) : (
                <>
                  <p>No truck assigned yet.</p>
                  {shipment.status === 'PENDING' && (
                    <Button 
                      as={Link} 
                      to={`/shipments/${shipment.shipmentId}/assign-truck`}
                      variant="primary"
                      className="w-100"
                    >
                      Assign Truck
                    </Button>
                  )}
                </>
              )}
            </Card.Body>
          </Card>
          
          <Card className="mb-4">
            <Card.Header>
              <h5 className="mb-0">Timeline</h5>
            </Card.Header>
            <Card.Body>
              <div className="timeline">
                <div className="timeline-item">
                  <div className="timeline-marker bg-success"></div>
                  <div className="timeline-content">
                    <h6>Created</h6>
                    <p>{new Date(shipment.createdAt).toLocaleString()}</p>
                  </div>
                </div>
                
                {shipment.scheduledPickupDate && (
                  <div className="timeline-item">
                    <div className="timeline-marker bg-info"></div>
                    <div className="timeline-content">
                      <h6>Scheduled for Pickup</h6>
                      <p>{new Date(shipment.scheduledPickupDate).toLocaleString()}</p>
                    </div>
                  </div>
                )}
                
                {shipment.actualPickupDate && (
                  <div className="timeline-item">
                    <div className="timeline-marker bg-primary"></div>
                    <div className="timeline-content">
                      <h6>Picked Up</h6>
                      <p>{new Date(shipment.actualPickupDate).toLocaleString()}</p>
                    </div>
                  </div>
                )}
                
                {shipment.estimatedDeliveryDate && (
                  <div className="timeline-item">
                    <div className="timeline-marker bg-warning"></div>
                    <div className="timeline-content">
                      <h6>Estimated Delivery</h6>
                      <p>{new Date(shipment.estimatedDeliveryDate).toLocaleString()}</p>
                    </div>
                  </div>
                )}
                
                {shipment.actualDeliveryDate && (
                  <div className="timeline-item">
                    <div className="timeline-marker bg-success"></div>
                    <div className="timeline-content">
                      <h6>Delivered</h6>
                      <p>{new Date(shipment.actualDeliveryDate).toLocaleString()}</p>
                    </div>
                  </div>
                )}
              </div>
            </Card.Body>
          </Card>
          
          {shipment.status === 'PENDING' && (
            <div className="d-grid gap-2">
              <Button 
                as={Link} 
                to={`/shipments/edit/${shipment.shipmentId}`}
                variant="outline-primary"
              >
                Edit Shipment
              </Button>
            </div>
          )}
        </Col>
      </Row>
    </Container>
  );
};

export default ShipmentDetail;
