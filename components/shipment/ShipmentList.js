import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Table, Button, Badge, Alert } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import ShipmentService from '../../services/shipmentService';

const ShipmentList = () => {
  const [shipments, setShipments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchShipments();
  }, []);

  const fetchShipments = () => {
    setLoading(true);
    ShipmentService.getShipments()
      .then(response => {
        setShipments(response.data);
        setLoading(false);
      })
      .catch(error => {
        console.error('Error fetching shipments:', error);
        setError('Failed to load shipments. Please try again later.');
        setLoading(false);
      });
  };

  const getStatusBadge = (status) => {
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

  return (
    <Container className="mt-4">
      <h2>Shipments</h2>
      
      {error && <Alert variant="danger">{error}</Alert>}
      
      <Card className="mb-4">
        <Card.Header className="d-flex justify-content-between align-items-center">
          <span>All Shipments</span>
          <Button as={Link} to="/shipments/create" variant="primary" size="sm">Create Shipment</Button>
        </Card.Header>
        <Card.Body>
          {loading ? (
            <div className="text-center">
              <div className="spinner-border" role="status">
                <span className="visually-hidden">Loading...</span>
              </div>
              <p className="mt-2">Loading shipments...</p>
            </div>
          ) : shipments.length === 0 ? (
            <p>No shipments found.</p>
          ) : (
            <Table responsive hover>
              <thead>
                <tr>
                  <th>Tracking #</th>
                  <th>Origin</th>
                  <th>Destination</th>
                  <th>Status</th>
                  <th>Truck</th>
                  <th>Scheduled Pickup</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {shipments.map(shipment => (
                  <tr key={shipment.shipmentId}>
                    <td>{shipment.trackingNumber}</td>
                    <td>{shipment.originWarehouse.name}</td>
                    <td>{shipment.destinationWarehouse.name}</td>
                    <td>{getStatusBadge(shipment.status)}</td>
                    <td>
                      {shipment.assignedTruck ? (
                        <Link to={`/trucks/${shipment.assignedTruck.truckId}`}>
                          {shipment.assignedTruck.registrationNumber}
                        </Link>
                      ) : (
                        'Not Assigned'
                      )}
                    </td>
                    <td>
                      {shipment.scheduledPickupDate ? 
                        new Date(shipment.scheduledPickupDate).toLocaleString() : 
                        'Not Scheduled'}
                    </td>
                    <td>
                      <Button as={Link} to={`/shipments/${shipment.shipmentId}`} variant="link" size="sm">View</Button>
                      {shipment.status === 'PENDING' && (
                        <>
                          <Button as={Link} to={`/shipments/edit/${shipment.shipmentId}`} variant="link" size="sm">Edit</Button>
                          <Button as={Link} to={`/shipments/${shipment.shipmentId}/assign-truck`} variant="link" size="sm">Assign Truck</Button>
                        </>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
          )}
        </Card.Body>
      </Card>
    </Container>
  );
};

export default ShipmentList;
