import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Form, Button, Card, Table, Alert, Badge, Container, Row, Col, Spinner } from 'react-bootstrap';
import axios from 'axios';
import { API_URL } from '../../config';
import { getAuthHeader } from '../../services/authService';

const ShipmentProcessing = () => {
  const { trackingNumber } = useParams();
  const navigate = useNavigate();
  const [shipment, setShipment] = useState(null);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [barcode, setBarcode] = useState('');
  const [weight, setWeight] = useState('');
  const [processingStatus, setProcessingStatus] = useState('VERIFIED');
  const [notes, setNotes] = useState('');

  useEffect(() => {
    fetchShipmentDetails();
    fetchProcessingSummary();
  }, [trackingNumber]);

  const fetchShipmentDetails = async () => {
    try {
      const response = await axios.get(`${API_URL}/shipments/tracking/${trackingNumber}`, getAuthHeader());
      setShipment(response.data);
      setLoading(false);
    } catch (err) {
      setError('Failed to load shipment details. Please try again.');
      setLoading(false);
    }
  };

  const fetchProcessingSummary = async () => {
    try {
      const response = await axios.get(`${API_URL}/shipments/processing-summary/${trackingNumber}`, getAuthHeader());
      setSummary(response.data);
    } catch (err) {
      console.error('Error fetching processing summary:', err);
    }
  };

  const handleScanItem = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!barcode) {
      setError('Please enter a barcode');
      return;
    }

    if (!weight) {
      setError('Please enter the item weight');
      return;
    }

    try {
      const response = await axios.post(
        `${API_URL}/shipments/process-item`,
        {
          trackingNumber,
          barcode,
          weight: parseFloat(weight),
          status: processingStatus,
          notes
        },
        getAuthHeader()
      );

      if (response.data.success) {
        setSuccess(`Item ${barcode} processed successfully!`);
        // Clear form
        setBarcode('');
        setWeight('');
        setNotes('');
        // Refresh data
        fetchProcessingSummary();
        fetchShipmentDetails();
      } else {
        setError(response.data.message || 'Failed to process item');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'An error occurred while processing the item');
    }
  };

  const handleReportMissing = async () => {
    if (!barcode) {
      setError('Please enter a barcode to report as missing');
      return;
    }

    try {
      const response = await axios.post(
        `${API_URL}/shipments/report-missing/${trackingNumber}/${barcode}`,
        {},
        getAuthHeader()
      );

      if (response.data.success) {
        setSuccess(`Item ${barcode} reported as missing`);
        setBarcode('');
        fetchProcessingSummary();
      } else {
        setError(response.data.message || 'Failed to report missing item');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'An error occurred while reporting the missing item');
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

  const getItemStatusBadge = (status) => {
    switch (status) {
      case 'PENDING':
        return <Badge bg="secondary">Pending</Badge>;
      case 'VERIFIED':
        return <Badge bg="success">Verified</Badge>;
      case 'MISSING':
        return <Badge bg="danger">Missing</Badge>;
      case 'DAMAGED':
        return <Badge bg="warning">Damaged</Badge>;
      case 'LOADED':
        return <Badge bg="info">Loaded</Badge>;
      default:
        return <Badge bg="secondary">{status}</Badge>;
    }
  };

  if (loading) {
    return (
      <Container className="mt-4 text-center">
        <Spinner animation="border" />
        <p>Loading shipment details...</p>
      </Container>
    );
  }

  if (!shipment) {
    return (
      <Container className="mt-4">
        <Alert variant="danger">
          Shipment not found. Please check the tracking number and try again.
        </Alert>
        <Button variant="primary" onClick={() => navigate('/dashboard')}>
          Back to Dashboard
        </Button>
      </Container>
    );
  }

  return (
    <Container className="mt-4">
      <h2>Process Shipment: {trackingNumber}</h2>
      
      {error && <Alert variant="danger">{error}</Alert>}
      {success && <Alert variant="success">{success}</Alert>}
      
      <Card className="mb-4">
        <Card.Header>
          <h4>Shipment Details</h4>
        </Card.Header>
        <Card.Body>
          <Row>
            <Col md={6}>
              <p><strong>Status:</strong> {getStatusBadge(shipment.status)}</p>
              <p><strong>Origin:</strong> {shipment.originWarehouse.name}</p>
              <p><strong>Destination:</strong> {shipment.destinationWarehouse.name}</p>
            </Col>
            <Col md={6}>
              <p><strong>Total Weight:</strong> {shipment.totalWeight} kg</p>
              <p><strong>Scheduled Pickup:</strong> {shipment.scheduledPickupDate ? new Date(shipment.scheduledPickupDate).toLocaleString() : 'Not scheduled'}</p>
              <p><strong>Assigned Truck:</strong> {shipment.assignedTruck ? shipment.assignedTruck.registrationNumber : 'Not assigned'}</p>
            </Col>
          </Row>
        </Card.Body>
      </Card>

      {summary && (
        <Card className="mb-4">
          <Card.Header>
            <h4>Processing Summary</h4>
          </Card.Header>
          <Card.Body>
            <Row>
              <Col md={6}>
                <p><strong>Processed Items:</strong> {summary.processedItems} of {summary.totalItems}</p>
                <p><strong>Missing Items:</strong> {summary.missingItems}</p>
                <p><strong>Damaged Items:</strong> {summary.damagedItems}</p>
              </Col>
              <Col md={6}>
                <p><strong>Processed Weight:</strong> {summary.processedWeight} kg</p>
                <p><strong>Expected Weight:</strong> {summary.totalWeight} kg</p>
                <p><strong>Ready for Loading:</strong> {summary.readyForLoading ? 'Yes' : 'No'}</p>
              </Col>
            </Row>
          </Card.Body>
        </Card>
      )}

      <Card className="mb-4">
        <Card.Header>
          <h4>Scan Item</h4>
        </Card.Header>
        <Card.Body>
          <Form onSubmit={handleScanItem}>
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
        </Card.Body>
      </Card>

      {summary && summary.items && summary.items.length > 0 && (
        <Card className="mb-4">
          <Card.Header>
            <h4>Processed Items</h4>
          </Card.Header>
          <Card.Body>
            <Table striped bordered hover responsive>
              <thead>
                <tr>
                  <th>Barcode</th>
                  <th>Description</th>
                  <th>Weight</th>
                  <th>Status</th>
                  <th>Processed At</th>
                </tr>
              </thead>
              <tbody>
                {summary.items.map((item) => (
                  <tr key={item.itemId}>
                    <td>{item.barcode}</td>
                    <td>{item.description}</td>
                    <td>{item.weight} kg</td>
                    <td>{getItemStatusBadge(item.status)}</td>
                    <td>{item.processedAt ? new Date(item.processedAt).toLocaleString() : 'Not processed'}</td>
                  </tr>
                ))}
              </tbody>
            </Table>
          </Card.Body>
        </Card>
      )}

      <div className="d-flex justify-content-between mb-4">
        <Button variant="secondary" onClick={() => navigate('/dashboard')}>
          Back to Dashboard
        </Button>
        {summary && summary.readyForLoading && (
          <Button variant="success">
            Shipment Ready for Pickup
          </Button>
        )}
      </div>
    </Container>
  );
};

export default ShipmentProcessing;
