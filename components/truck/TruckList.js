import React, { useState, useEffect } from 'react';
import { Container, Table, Button, Alert, Modal, Card, Row, Col, Badge, Spinner, Form, InputGroup } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import TruckService from '../../services/truckService';
import AuthService from '../../services/authService';

const TruckList = () => {
  const [trucks, setTrucks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [truckToDelete, setTruckToDelete] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  
  const currentUser = AuthService.getCurrentUser();

  useEffect(() => {
    fetchTrucks();
  }, []);

  const fetchTrucks = () => {
    setLoading(true);
    setError(null);
    TruckService.getTrucks()
      .then(response => {
        setTrucks(response.data);
        setLoading(false);
      })
      .catch(error => {
        console.error('Error fetching trucks:', error);
        setError('Failed to load trucks. Please try again later.');
        setLoading(false);
      });
  };
  
  const handleShowDeleteModal = (truck) => {
    setTruckToDelete(truck);
    setShowDeleteModal(true);
  };

  const handleCloseDeleteModal = () => {
    setShowDeleteModal(false);
    setTruckToDelete(null);
  };

  const handleDeleteTruck = () => {
    if (!truckToDelete) return;
    
    TruckService.deleteTruck(truckToDelete.truckId)
      .then(() => {
        fetchTrucks();
        handleCloseDeleteModal();
      })
      .catch(error => {
        console.error('Error deleting truck:', error);
        setError('Failed to delete truck. Please try again later.');
        handleCloseDeleteModal();
      });
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

  // Filter trucks based on search term and status filter
  const filteredTrucks = trucks.filter(truck => {
    const matchesSearch = !searchTerm || 
      (truck.registrationNumber && truck.registrationNumber.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (truck.model && truck.model.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (truck.driverName && truck.driverName.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (truck.homeWarehouseName && truck.homeWarehouseName.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesStatus = !statusFilter || truck.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  return (
    <Container className="mt-4">
      <Card className="shadow-sm mb-4 border-0">
        <Card.Body className="bg-primary text-white rounded">
          <Row className="align-items-center">
            <Col>
              <h2 className="mb-0"><i className="bi bi-truck me-2"></i>Trucks Management</h2>
              <p className="mb-0 mt-2 text-white-50">Manage your fleet of delivery trucks</p>
            </Col>
            <Col xs="auto">
              <Button as={Link} to="/trucks/add" variant="light" className="fw-bold">
                <i className="bi bi-plus-circle me-2"></i>Add New Truck
              </Button>
            </Col>
          </Row>
        </Card.Body>
      </Card>
      
      <Card className="shadow-sm mb-4">
        <Card.Body>
          <Row className="mb-3">
            <Col md={6}>
              <InputGroup>
                <InputGroup.Text><i className="bi bi-search"></i></InputGroup.Text>
                <Form.Control 
                  placeholder="Search trucks..." 
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </InputGroup>
            </Col>
            <Col md={6} className="d-flex justify-content-md-end mt-3 mt-md-0">
              <Form.Select 
                className="w-auto"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="">All Statuses</option>
                <option value="AVAILABLE">Available</option>
                <option value="ASSIGNED">Assigned</option>
                <option value="IN_TRANSIT">In Transit</option>
                <option value="MAINTENANCE">Maintenance</option>
                <option value="OUT_OF_SERVICE">Out of Service</option>
              </Form.Select>
            </Col>
          </Row>
          {error && <Alert variant="danger">{error}</Alert>}
          {loading ? (
            <div className="text-center py-5">
              <Spinner animation="border" variant="primary" />
              <p className="mt-3">Loading trucks...</p>
            </div>
          ) : filteredTrucks.length === 0 ? (
            <Alert variant="info">
              {searchTerm || statusFilter ? 
                "No trucks match your search criteria." : 
                "No trucks found. Add a truck to get started."}
            </Alert>
          ) : (
            <Table hover responsive className="align-middle">
              <thead className="bg-light">
                <tr>
                  <th>Registration #</th>
                  <th>Model</th>
                  <th>Capacity</th>
                  <th>Driver</th>
                  <th>Home Warehouse</th>
                  <th>Status</th>
                  <th className="text-center">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredTrucks.map(truck => (
                  <tr key={truck.truckId}>
                    <td className="fw-bold">{truck.registrationNumber}</td>
                    <td>{truck.model}</td>
                    <td>
                      <div><i className="bi bi-box-seam me-1"></i> {truck.capacityWeight} kg</div>
                      <div><i className="bi bi-arrows-angle-expand me-1"></i> {truck.capacityVolume} m³</div>
                    </td>
                    <td>
                      {truck.driverName ? (
                        <div className="d-flex align-items-center">
                          <div className="bg-light rounded-circle p-2 me-2">
                            <i className="bi bi-person text-primary"></i>
                          </div>
                          {truck.driverName}
                        </div>
                      ) : (
                        <Badge bg="secondary">No Driver</Badge>
                      )}
                    </td>
                    <td>
                      {truck.homeWarehouseName ? (
                        <div>
                          <i className="bi bi-building me-1"></i>
                          {truck.homeWarehouseName}
                        </div>
                      ) : (
                        <Badge bg="secondary">Not Assigned</Badge>
                      )}
                    </td>
                    <td>
                      {getStatusBadge(truck.status)}
                    </td>
                    <td>
                      <div className="d-flex justify-content-center">
                        <Button as={Link} to={`/trucks/${truck.truckId}`} variant="info" size="sm" className="me-2">
                          <i className="bi bi-eye"></i> View
                        </Button>
                        {currentUser && (currentUser.role === 'admin' || currentUser.role === 'logistics_manager') && (
                          <>
                            <Button as={Link} to={`/trucks/edit/${truck.truckId}`} variant="primary" size="sm" className="me-2">
                              <i className="bi bi-pencil"></i> Edit
                            </Button>
                            <Button 
                              variant="danger" 
                              size="sm"
                              onClick={() => handleShowDeleteModal(truck)}
                            >
                              <i className="bi bi-trash"></i> Delete
                            </Button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
          )}
        </Card.Body>
      </Card>
      
      {/* Delete Confirmation Modal */}
      <Modal show={showDeleteModal} onHide={handleCloseDeleteModal} centered>
        <Modal.Header closeButton>
          <Modal.Title>Confirm Delete</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          Are you sure you want to delete the truck with registration number{' '}
          <strong>{truckToDelete?.registrationNumber}</strong>?
          This action cannot be undone.
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={handleCloseDeleteModal}>
            Cancel
          </Button>
          <Button variant="danger" onClick={handleDeleteTruck}>
            Delete
          </Button>
        </Modal.Footer>
      </Modal>
    </Container>
  );
};

export default TruckList;
