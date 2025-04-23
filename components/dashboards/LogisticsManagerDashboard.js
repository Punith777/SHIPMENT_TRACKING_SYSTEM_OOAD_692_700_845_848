import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Button, Table, Alert, Badge, Spinner } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import axios from 'axios';
import AuthService from '../../services/authService';

const LogisticsManagerDashboard = () => {
  const [warehouses, setWarehouses] = useState([]);
  const [inventory, setInventory] = useState([]);
  const [trucks, setTrucks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [stats, setStats] = useState({
    totalWarehouses: 0,
    totalInventory: 0,
    lowStockItems: 0,
    pendingTransfers: 0,
    availableTrucks: 0
  });

  const currentUser = AuthService.getCurrentUser();
  const token = currentUser?.token;

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        // Configure headers with JWT token
        const config = {
          headers: { Authorization: `Bearer ${token}` }
        };

        // Fetch warehouses
        const warehousesResponse = await axios.get('http://localhost:8080/api/warehouses', config);
        setWarehouses(warehousesResponse.data);

        // Fetch inventory
        const inventoryResponse = await axios.get('http://localhost:8080/api/inventory', config);
        setInventory(inventoryResponse.data);
        
        // We no longer need to fetch shipments since we're using inventory assignments
        
        // Fetch available trucks
        const trucksResponse = await axios.get('http://localhost:8080/api/trucks', config);
        const availableTrucksData = trucksResponse.data.filter(truck => 
          truck.status === 'AVAILABLE' && truck.driver !== null
        );
        setTrucks(availableTrucksData);

        // Update stats
        setStats({
          totalWarehouses: warehousesResponse.data.length,
          totalInventory: inventoryResponse.data.length,
          lowStockItems: inventoryResponse.data.filter(item => item.quantity < (item.reorderPoint || 0)).length,
          pendingTransfers: 3, // This would be replaced with actual API call
          availableTrucks: availableTrucksData.length
        });

        setLoading(false);
      } catch (err) {
        console.error('Error fetching dashboard data:', err);
        setError('Failed to load dashboard data. Please try again later.');
        setLoading(false);
      }
    };

    fetchData();
  }, [token]);

  return (
    <Container fluid className="mt-4">
      <h2 className="mb-4">Logistics Manager Dashboard</h2>
      
      {error && <Alert variant="danger">{error}</Alert>}
      
      <Row>
        <Col md={2}>
          <Card className="mb-4">
            <Card.Body>
              <Card.Title>Total Warehouses</Card.Title>
              <Card.Text className="h2">{loading ? '...' : stats.totalWarehouses}</Card.Text>
              <Button as={Link} to="/warehouses" variant="primary" size="sm">View Warehouses</Button>
            </Card.Body>
          </Card>
        </Col>
        <Col md={2}>
          <Card className="mb-4">
            <Card.Body>
              <Card.Title>Inventory Items</Card.Title>
              <Card.Text className="h2">{loading ? '...' : stats.totalInventory}</Card.Text>
              <Button as={Link} to="/inventory" variant="primary" size="sm">View Inventory</Button>
            </Card.Body>
          </Card>
        </Col>
        <Col md={2}>
          <Card className="mb-4">
            <Card.Body>
              <Card.Title>Low Stock Items</Card.Title>
              <Card.Text className="h2">{loading ? '...' : stats.lowStockItems}</Card.Text>
              <Button as={Link} to="/inventory/reorder" variant="primary" size="sm">Reorder Items</Button>
            </Card.Body>
          </Card>
        </Col>
        <Col md={2}>
          <Card className="mb-4">
            <Card.Body>
              <Card.Title>Pending Transfers</Card.Title>
              <Card.Text className="h2">{loading ? '...' : stats.pendingTransfers}</Card.Text>
              <Button as={Link} to="/transfers" variant="primary" size="sm">View Transfers</Button>
            </Card.Body>
          </Card>
        </Col>
        <Col md={2}>
          <Card className="mb-4">
            <Card.Body>
              <Card.Title>Inventory Transport</Card.Title>
              <Card.Text className="h2">{loading ? '...' : stats.availableTrucks}</Card.Text>
              <Button as={Link} to="/inventory-assignment" variant="primary" size="sm">Assign Inventory</Button>
            </Card.Body>
          </Card>
        </Col>
        <Col md={2}>
          <Card className="mb-4">
            <Card.Body>
              <Card.Title>Available Trucks</Card.Title>
              <Card.Text className="h2">{loading ? '...' : stats.availableTrucks}</Card.Text>
              <Button as={Link} to="/trucks" variant="primary" size="sm">View Trucks</Button>
            </Card.Body>
          </Card>
        </Col>
      </Row>
      
      <Row>
        <Col md={6}>
          <Card className="mb-4">
            <Card.Header className="d-flex justify-content-between align-items-center">
              <span>Warehouse Management</span>
              <Button as={Link} to="/warehouses/add" variant="primary" size="sm">Add Warehouse</Button>
            </Card.Header>
            <Card.Body>
              {loading ? (
                <p>Loading warehouses...</p>
              ) : warehouses.length === 0 ? (
                <p>No warehouses found.</p>
              ) : (
                <Table responsive hover>
                  <thead>
                    <tr>
                      <th>ID</th>
                      <th>Name</th>
                      <th>Location</th>
                      <th>Capacity</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {warehouses.slice(0, 5).map(warehouse => (
                      <tr key={warehouse.warehouseId}>
                        <td>{warehouse.warehouseId}</td>
                        <td>{warehouse.name}</td>
                        <td>{warehouse.location}</td>
                        <td>{warehouse.capacity || 'N/A'}</td>
                        <td>
                          <Button as={Link} to={`/warehouses/${warehouse.warehouseId}`} variant="link" size="sm">View</Button>
                          <Button as={Link} to={`/warehouses/edit/${warehouse.warehouseId}`} variant="link" size="sm">Edit</Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              )}
              {warehouses.length > 5 && (
                <div className="text-center mt-3">
                  <Button as={Link} to="/warehouses" variant="outline-primary" size="sm">View All Warehouses</Button>
                </div>
              )}
            </Card.Body>
          </Card>
          
          <Card className="mb-4">
            <Card.Header className="d-flex justify-content-between align-items-center">
              <span>Available Trucks for Transport</span>
              <Button as={Link} to="/inventory-assignment" variant="primary" size="sm">Assign Inventory</Button>
            </Card.Header>
            <Card.Body>
              {loading ? (
                <div className="text-center py-3">
                  <Spinner animation="border" variant="primary" />
                  <p className="mt-2">Loading available trucks...</p>
                </div>
              ) : trucks.length === 0 ? (
                <Alert variant="info">No available trucks found for inventory assignment.</Alert>
              ) : (
                <Table responsive hover>
                  <thead>
                    <tr>
                      <th>Registration #</th>
                      <th>Model</th>
                      <th>Driver</th>
                      <th>Capacity</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {trucks.slice(0, 5).map(truck => (
                      <tr key={truck.truckId}>
                        <td className="fw-bold">{truck.registrationNumber}</td>
                        <td>{truck.model}</td>
                        <td>{truck.driver ? truck.driver.username : 'No driver'}</td>
                        <td>
                          {truck.capacityWeight} kg / {truck.capacityVolume} m³
                        </td>
                        <td>
                          <Button 
                            as={Link} 
                            to="/inventory-assignment" 
                            variant="outline-primary" 
                            size="sm"
                          >
                            Assign Inventory
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              )}
              {trucks.length > 5 && (
                <div className="text-center mt-3">
                  <Button as={Link} to="/trucks" variant="outline-primary" size="sm">View All Trucks</Button>
                </div>
              )}
            </Card.Body>
          </Card>
        </Col>
        
        <Col md={6}>
          <Card className="mb-4">
            <Card.Header className="d-flex justify-content-between align-items-center">
              <span>Available Trucks</span>
              <Button as={Link} to="/trucks/add" variant="primary" size="sm">Add Truck</Button>
            </Card.Header>
            <Card.Body>
              {loading ? (
                <p>Loading trucks...</p>
              ) : trucks.length === 0 ? (
                <p>No available trucks found.</p>
              ) : (
                <Table responsive hover>
                  <thead>
                    <tr>
                      <th>Reg #</th>
                      <th>Model</th>
                      <th>Capacity</th>
                      <th>Driver</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {trucks.slice(0, 5).map(truck => (
                      <tr key={truck.truckId}>
                        <td>{truck.registrationNumber}</td>
                        <td>{truck.model}</td>
                        <td>{truck.capacityWeight}kg/{truck.capacityVolume}m³</td>
                        <td>{truck.driver ? truck.driver.username : 'None'}</td>
                        <td>
                          <Button as={Link} to={`/trucks/${truck.truckId}`} variant="link" size="sm">View</Button>
                          <Button as={Link} to={`/trucks/edit/${truck.truckId}`} variant="link" size="sm">Edit</Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              )}
              {trucks.length > 5 && (
                <div className="text-center mt-3">
                  <Button as={Link} to="/trucks" variant="outline-primary" size="sm">View All Trucks</Button>
                </div>
              )}
            </Card.Body>
          </Card>
          
          <Row>
            <Col md={6}>
              <Card className="mb-4">
                <Card.Header>Inventory Management</Card.Header>
                <Card.Body>
                  <div className="d-grid gap-2">
                    <Button as={Link} to="/inventory/add" variant="primary" className="mb-2">Add New Inventory</Button>
                    <Button as={Link} to="/inventory" variant="outline-primary" className="mb-2">View All Inventory</Button>
                    <Button as={Link} to="/inventory/reorder" variant="outline-primary">Manage Reorder Levels</Button>
                  </div>
                </Card.Body>
              </Card>
            </Col>
            
            <Col md={6}>
              <Card className="mb-4">
                <Card.Header>Shipment Management</Card.Header>
                <Card.Body>
                  <div className="d-grid gap-2">
                    <Button as={Link} to="/shipments" variant="primary" className="mb-2">View All Shipments</Button>
                    <Button as={Link} to="/transfers/create" variant="outline-primary" className="mb-2">Create Inventory Transfer</Button>
                    <Button as={Link} to="/trucks/assign" variant="outline-primary">Assign Trucks to Shipments</Button>
                  </div>
                </Card.Body>
              </Card>
            </Col>
          </Row>
          
          <Card className="mb-4">
            <Card.Header>Low Stock Items</Card.Header>
            <Card.Body>
              {loading ? (
                <p>Loading inventory...</p>
              ) : inventory.filter(item => item.quantity < item.reorderLevel).length === 0 ? (
                <p>No low stock items found.</p>
              ) : (
                <>
                  <ul className="list-group">
                    {inventory
                      .filter(item => item.quantity < item.reorderLevel)
                      .slice(0, 4)
                      .map(item => (
                        <li key={item.inventoryId} className="list-group-item d-flex justify-content-between align-items-center">
                          {item.name}
                          <span className="badge bg-danger rounded-pill">{item.quantity} / {item.reorderLevel}</span>
                        </li>
                      ))}
                  </ul>
                  {inventory.filter(item => item.quantity < item.reorderLevel).length > 4 && (
                    <div className="text-center mt-3">
                      <Button as={Link} to="/inventory/reorder" variant="outline-danger" size="sm">View All Low Stock</Button>
                    </div>
                  )}
                </>
              )}
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
};

export default LogisticsManagerDashboard;