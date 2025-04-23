import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Button, Alert, Badge, Spinner, ListGroup } from 'react-bootstrap';
import { useParams, Link, useNavigate } from 'react-router-dom';
import TruckService from '../../services/truckService';
import axios from 'axios';
import AuthService from '../../services/authService';

const TruckDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [truck, setTruck] = useState(null);
  const [assignedShipments, setAssignedShipments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const currentUser = AuthService.getCurrentUser();
  const token = currentUser?.token;
  
  // Configure headers with JWT token
  const config = {
    headers: { Authorization: `Bearer ${token}` }
  };

  useEffect(() => {
    if (id) {
      fetchTruckData(id);
    }
  }, [id]);

  const fetchTruckData = async (truckId) => {
    setLoading(true);
    try {
      // Fetch truck details
      const truckResponse = await TruckService.getTruckById(truckId);
      setTruck(truckResponse.data);
      
      // Fetch shipments assigned to this truck
      const shipmentsResponse = await axios.get(`http://localhost:8080/api/shipments`, config);
      const assignedShipmentsData = shipmentsResponse.data.filter(shipment => 
        shipment.assignedTruck && shipment.assignedTruck.truckId.toString() === truckId
      );
      setAssignedShipments(assignedShipmentsData);
      
      setLoading(false);
    } catch (error) {
      console.error('Error fetching truck data:', error);
      setError('Failed to load truck details. Please try again later.');
      setLoading(false);
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'AVAILABLE':
        return <Badge bg="success">Available</Badge>;
      case 'ASSIGNED':
        return <Badge bg="info">Assigned</Badge>;
      case 'IN_TRANSIT':
        return <Badge bg="primary">In Transit</Badge>;
      case 'MAINTENANCE':
        return <Badge bg="warning">Maintenance</Badge>;
      case 'OUT_OF_SERVICE':
        return <Badge bg="danger">Out of Service</Badge>;
      default:
        return <Badge bg="secondary">{status}</Badge>;
    }
  };

  const getShipmentStatusBadge = (status) => {
    switch (status) {
      case 'PENDING':
        return <Badge bg="warning">Pending</Badge>;
      case 'SCHEDULED_FOR_PICKUP':
        return <Badge bg="info">Scheduled</Badge>;
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
      <Container className="mt-5">
        <div className="text-center">
          <Spinner animation="border" role="status" variant="primary" style={{ width: '3rem', height: '3rem' }}>
            <span className="visually-hidden">Loading...</span>
          </Spinner>
          <p className="mt-3 text-primary fw-bold">Loading truck details...</p>
        </div>
      </Container>
    );
  }

  if (error) {
    return (
      <Container className="mt-4">
        <Alert variant="danger">{error}</Alert>
        <Button variant="primary" onClick={() => navigate('/trucks')}>
          Back to Trucks
        </Button>
      </Container>
    );
  }

  if (!truck) {
    return (
      <Container className="mt-4">
        <Alert variant="warning">Truck not found.</Alert>
        <Button variant="primary" onClick={() => navigate('/trucks')}>
          Back to Trucks
        </Button>
      </Container>
    );
  }

  return (
    <Container className="mt-4">
      <Card className="shadow-sm mb-4 border-0">
        <Card.Body className="bg-primary text-white rounded">
          <Row className="align-items-center">
            <Col>
              <h2 className="mb-0"><i className="bi bi-truck me-2"></i>Truck Details</h2>
              <p className="mb-0 mt-2 text-white-50">View detailed information about this truck</p>
            </Col>
            <Col xs="auto">
              <Button as={Link} to="/trucks" variant="light" className="me-2">
                <i className="bi bi-arrow-left me-2"></i>Back to List
              </Button>
              <Button as={Link} to={`/trucks/edit/${truck.truckId}`} variant="warning">
                <i className="bi bi-pencil me-2"></i>Edit Truck
              </Button>
            </Col>
          </Row>
        </Card.Body>
      </Card>

      <Row>
        <Col md={8}>
          <Card className="mb-4">
            <Card.Header>
              <div className="d-flex justify-content-between align-items-center">
                <h5 className="mb-0">Registration Number: {truck.registrationNumber}</h5>
                {getStatusBadge(truck.status)}
              </div>
            </Card.Header>
            <Card.Body>
              <Row className="mb-3">
                <Col md={6}>
                  <h6>Model</h6>
                  <p>{truck.model}</p>
                </Col>
                <Col md={6}>
                  <h6>Home Warehouse</h6>
                  <p>
                    {truck.homeWarehouse ? (
                      <Link to={`/warehouses/${truck.homeWarehouse.warehouseId}`}>
                        {truck.homeWarehouse.name}
                      </Link>
                    ) : (
                      'Not Assigned'
                    )}
                  </p>
                </Col>
              </Row>
              
              <Row className="mb-3">
                <Col md={6}>
                  <h6>Capacity (Weight)</h6>
                  <p>{truck.capacityWeight} kg</p>
                </Col>
                <Col md={6}>
                  <h6>Capacity (Volume)</h6>
                  <p>{truck.capacityVolume} m³</p>
                </Col>
              </Row>
              
              <Row className="mb-3">
                <Col md={6}>
                  <h6>Driver</h6>
                  <p>
                    {truck.driver ? truck.driver.username : 'Not Assigned'}
                  </p>
                </Col>
                <Col md={6}>
                  <h6>Status</h6>
                  <p>{getStatusBadge(truck.status)}</p>
                </Col>
              </Row>
              
              <Row className="mb-3">
                <Col md={6}>
                  <h6>Last Maintenance</h6>
                  <p>
                    {truck.lastMaintenanceDate ? 
                      new Date(truck.lastMaintenanceDate).toLocaleDateString() : 
                      'Not Available'}
                  </p>
                </Col>
                <Col md={6}>
                  <h6>Next Maintenance</h6>
                  <p>
                    {truck.nextMaintenanceDate ? 
                      new Date(truck.nextMaintenanceDate).toLocaleDateString() : 
                      'Not Scheduled'}
                  </p>
                </Col>
              </Row>
            </Card.Body>
          </Card>
          
          <Card className="mb-4">
            <Card.Header>
              <h5 className="mb-0">Assigned Shipments</h5>
            </Card.Header>
            <Card.Body>
              {assignedShipments.length === 0 ? (
                <p>No shipments currently assigned to this truck.</p>
              ) : (
                <Table responsive hover>
                  <thead>
                    <tr>
                      <th>Tracking #</th>
                      <th>Origin</th>
                      <th>Destination</th>
                      <th>Status</th>
                      <th>Scheduled Pickup</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {assignedShipments.map(shipment => (
                      <tr key={shipment.shipmentId}>
                        <td>{shipment.trackingNumber}</td>
                        <td>{shipment.originWarehouse.name}</td>
                        <td>{shipment.destinationWarehouse.name}</td>
                        <td>{getShipmentStatusBadge(shipment.status)}</td>
                        <td>
                          {shipment.scheduledPickupDate ? 
                            new Date(shipment.scheduledPickupDate).toLocaleString() : 
                            'Not Scheduled'}
                        </td>
                        <td>
                          <Button as={Link} to={`/shipments/${shipment.shipmentId}`} variant="link" size="sm">View</Button>
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
            <Card.Header>
              <h5 className="mb-0">Actions</h5>
            </Card.Header>
            <Card.Body>
              <div className="d-grid gap-2">
                <Button 
                  as={Link} 
                  to={`/trucks/edit/${truck.truckId}`}
                  variant="primary"
                >
                  Edit Truck
                </Button>
                
                {truck.status === 'AVAILABLE' && (
                  <Button 
                    variant="outline-primary"
                    onClick={() => TruckService.updateTruckStatus(truck.truckId, 'MAINTENANCE')
                      .then(() => {
                        fetchTruckData(id);
                      })
                      .catch(err => {
                        console.error('Error updating truck status:', err);
                        setError('Failed to update truck status.');
                      })
                    }
                  >
                    Mark for Maintenance
                  </Button>
                )}
                
                {truck.status === 'MAINTENANCE' && (
                  <Button 
                    variant="outline-success"
                    onClick={() => TruckService.updateTruckStatus(truck.truckId, 'AVAILABLE')
                      .then(() => {
                        fetchTruckData(id);
                      })
                      .catch(err => {
                        console.error('Error updating truck status:', err);
                        setError('Failed to update truck status.');
                      })
                    }
                  >
                    Mark as Available
                  </Button>
                )}
                
                {truck.status === 'OUT_OF_SERVICE' && (
                  <Button 
                    variant="outline-success"
                    onClick={() => TruckService.updateTruckStatus(truck.truckId, 'MAINTENANCE')
                      .then(() => {
                        fetchTruckData(id);
                      })
                      .catch(err => {
                        console.error('Error updating truck status:', err);
                        setError('Failed to update truck status.');
                      })
                    }
                  >
                    Send to Maintenance
                  </Button>
                )}
              </div>
            </Card.Body>
          </Card>
          
          <Card className="mb-4">
            <Card.Header>
              <h5 className="mb-0">Maintenance History</h5>
            </Card.Header>
            <Card.Body>
              <p>Maintenance history is not available at this time.</p>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
};

export default TruckDetail;
