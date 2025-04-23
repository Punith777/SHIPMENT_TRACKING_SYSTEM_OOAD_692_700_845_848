import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Form, Button, Alert, Spinner, Table, Badge, ListGroup } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import InventoryAssignmentService from '../../services/inventoryAssignmentService';
import TruckService from '../../services/truckService';
import WarehouseService from '../../services/warehouseService';
import InventoryService from '../../services/inventoryService';
import AuthService from '../../services/authService';

const InventoryAssignment = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  const [trucks, setTrucks] = useState([]);
  const [warehouses, setWarehouses] = useState([]);
  const [inventory, setInventory] = useState([]);
  const [filteredInventory, setFilteredInventory] = useState([]);
  
  const [formData, setFormData] = useState({
    truckId: '',
    warehouseId: '',
    destinationWarehouseId: '',
    inventoryIds: []
  });
  
  const [selectedInventory, setSelectedInventory] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [totalWeight, setTotalWeight] = useState(0);
  const [totalVolume, setTotalVolume] = useState(0);
  const [selectedTruck, setSelectedTruck] = useState(null);
  
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError('');
                
        // Fetch trucks
        const trucksResponse = await TruckService.getAvailableTrucks();
        console.log('Trucks loaded:', trucksResponse.data);
        setTrucks(trucksResponse.data);
        
        // Fetch warehouses
        const warehousesResponse = await WarehouseService.getAllWarehouses();
        console.log('Warehouses loaded:', warehousesResponse.data);
        setWarehouses(warehousesResponse.data);
        
        // If warehouses are loaded and we don't have a selected warehouse yet, select the first one
        if (warehousesResponse.data && warehousesResponse.data.length > 0 && !formData.warehouseId) {
          const firstWarehouseId = warehousesResponse.data[0].warehouseId.toString();
          setFormData(prev => ({
            ...prev,
            warehouseId: firstWarehouseId
          }));
          
          // Also fetch inventory for this warehouse
          const inventoryResponse = await InventoryService.getInventoryByWarehouse(firstWarehouseId);
          console.log('Inventory loaded:', inventoryResponse.data);
          setInventory(inventoryResponse.data);
          setFilteredInventory(inventoryResponse.data);
        }
        
        setLoading(false);
      } catch (error) {
        setLoading(false);
        setError('Failed to load data. Please try again later.');
        console.error('Error fetching data:', error);
      }
    };
    
    fetchData();
  }, []);
  
  useEffect(() => {
    // Filter inventory based on search term
    if (inventory.length > 0 && searchTerm) {
      const filtered = inventory.filter(item => 
        item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.sku.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredInventory(filtered);
    } else {
      setFilteredInventory(inventory);
    }
  }, [searchTerm, inventory]);
  
  useEffect(() => {
    // Calculate total weight and volume of selected inventory
    if (selectedInventory.length > 0) {
      const weight = selectedInventory.reduce((sum, item) => 
        sum + (item.weight * item.quantity), 0);
      
      const volume = selectedInventory.reduce((sum, item) => 
        sum + (item.volume * item.quantity), 0);
      
      setTotalWeight(weight);
      setTotalVolume(volume);
    } else {
      setTotalWeight(0);
      setTotalVolume(0);
    }
  }, [selectedInventory]);
  
  useEffect(() => {
    // Get selected truck details
    if (formData.truckId) {
      const truck = trucks.find(t => t.truckId.toString() === formData.truckId);
      setSelectedTruck(truck);
    } else {
      setSelectedTruck(null);
    }
  }, [formData.truckId, trucks]);
  
  useEffect(() => {
    // Fetch inventory when warehouse is selected
    const fetchInventory = async () => {
      if (formData.warehouseId) {
        try {
          setLoading(true);
          const response = await InventoryService.getInventoryByWarehouse(formData.warehouseId);
          setInventory(response.data);
          setFilteredInventory(response.data);
          setLoading(false);
        } catch (error) {
          setLoading(false);
          setError('Failed to load inventory data.');
          console.error('Error fetching inventory:', error);
        }
      } else {
        setInventory([]);
        setFilteredInventory([]);
      }
    };
    
    fetchInventory();
    // Reset selected inventory when warehouse changes
    setSelectedInventory([]);
    setFormData(prev => ({
      ...prev,
      inventoryIds: []
    }));
  }, [formData.warehouseId]);
  
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
    
    // Reset destination warehouse if origin warehouse is changed to avoid same warehouse selection
    if (name === 'warehouseId' && value === formData.destinationWarehouseId) {
      setFormData(prev => ({
        ...prev,
        destinationWarehouseId: ''
      }));
    }
  };
  
  const handleInventorySelect = (e, item) => {
    const { checked } = e.target;
    
    if (checked) {
      // Add to selected inventory
      setSelectedInventory(prev => [...prev, item]);
      setFormData(prev => ({
        ...prev,
        inventoryIds: [...prev.inventoryIds, item.inventoryId]
      }));
    } else {
      // Remove from selected inventory
      setSelectedInventory(prev => 
        prev.filter(i => i.inventoryId !== item.inventoryId)
      );
      setFormData(prev => ({
        ...prev,
        inventoryIds: prev.inventoryIds.filter(id => id !== item.inventoryId)
      }));
    }
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate form
    if (!formData.truckId) {
      setError('Please select a truck');
      return;
    }
    
    if (!formData.warehouseId) {
      setError('Please select an origin warehouse');
      return;
    }
    
    if (!formData.destinationWarehouseId) {
      setError('Please select a destination warehouse');
      return;
    }
    
    if (formData.warehouseId === formData.destinationWarehouseId) {
      setError('Origin and destination warehouses cannot be the same');
      return;
    }
    
    if (formData.inventoryIds.length === 0) {
      setError('Please select at least one inventory item');
      return;
    }
    
    // Validate capacity
    if (selectedTruck && totalWeight > selectedTruck.capacityWeight) {
      setError(`Total weight (${totalWeight} kg) exceeds truck capacity (${selectedTruck.capacityWeight} kg)`);
      return;
    }
    
    if (selectedTruck && totalVolume > selectedTruck.capacityVolume) {
      setError(`Total volume (${totalVolume} m³) exceeds truck capacity (${selectedTruck.capacityVolume} m³)`);
      return;
    }
    
    try {
      setSubmitting(true);
      setError('');
      
      const response = await InventoryAssignmentService.assignInventoryToTruck(formData);
      
      if (response.data.success) {
        setSuccess('Inventory assigned successfully!');
        // Reset form after successful submission
        setFormData({
          truckId: '',
          warehouseId: '',
          destinationWarehouseId: '',
          inventoryIds: []
        });
        setSelectedInventory([]);
        
        // Redirect to truck details after 2 seconds
        setTimeout(() => {
          navigate(`/trucks/${formData.truckId}`);
        }, 2000);
      } else {
        setError(response.data.message || 'Failed to assign inventory');
      }
      
      setSubmitting(false);
    } catch (error) {
      setSubmitting(false);
      setError('Failed to assign inventory. Please try again.');
      console.error('Error assigning inventory:', error);
    }
  };
  
  if (loading && !submitting) {
    return (
      <Container className="mt-5">
        <div className="text-center">
          <Spinner animation="border" role="status" variant="primary" style={{ width: '3rem', height: '3rem' }}>
            <span className="visually-hidden">Loading...</span>
          </Spinner>
          <p className="mt-3 text-primary fw-bold">Loading inventory assignment data...</p>
        </div>
      </Container>
    );
  }
  
  return (
    <Container className="mt-4 mb-5">
      <Card className="shadow-sm mb-4 border-0">
        <Card.Body className="bg-primary text-white rounded">
          <Row className="align-items-center">
            <Col>
              <h2 className="mb-0"><i className="bi bi-box-seam me-2"></i>Inventory Assignment</h2>
              <p className="mb-0 mt-2 text-white-50">Assign inventory items to trucks for delivery</p>
            </Col>
            <Col xs="auto">
              <Button variant="light" className="fw-bold" onClick={() => navigate('/trucks')}>
                <i className="bi bi-arrow-left me-2"></i>Back to Trucks
              </Button>
            </Col>
          </Row>
        </Card.Body>
      </Card>
      
      {error && <Alert variant="danger" className="mb-4"><i className="bi bi-exclamation-triangle-fill me-2"></i>{error}</Alert>}
      {success && <Alert variant="success" className="mb-4"><i className="bi bi-check-circle-fill me-2"></i>{success}</Alert>}
      
      <Form onSubmit={handleSubmit}>
        <Row>
          <Col lg={8}>
            <Card className="shadow-sm mb-4 border-primary">
              <Card.Header className="bg-white border-bottom border-primary">
                <h4 className="text-primary mb-0">
                  <i className="bi bi-truck me-2"></i>
                  Assignment Details
                </h4>
              </Card.Header>
              <Card.Body>
                <Row className="mb-4">
                  <Col md={4}>
                    <Form.Group className="mb-3">
                      <Form.Label><strong>Select Truck</strong></Form.Label>
                      <Form.Select 
                        name="truckId" 
                        value={formData.truckId} 
                        onChange={handleChange}
                        className="border-primary"
                        disabled={submitting}
                      >
                        <option value="">-- Select Truck --</option>
                        {trucks.map(truck => (
                          <option key={truck.truckId} value={truck.truckId}>
                            {truck.registrationNumber} - {truck.model}
                          </option>
                        ))}
                      </Form.Select>
                      <Form.Text className="text-muted">
                        Only available trucks are shown
                      </Form.Text>
                    </Form.Group>
                  </Col>
                  <Col md={4}>
                    <Form.Group className="mb-3">
                      <Form.Label><strong>Origin Warehouse</strong></Form.Label>
                      <Form.Select 
                        name="warehouseId" 
                        value={formData.warehouseId} 
                        onChange={handleChange}
                        className="border-primary"
                        disabled={submitting}
                      >
                        <option value="">-- Select Origin --</option>
                        {warehouses.map(warehouse => (
                          <option key={warehouse.warehouseId} value={warehouse.warehouseId}>
                            {warehouse.name} - {warehouse.location}
                          </option>
                        ))}
                      </Form.Select>
                      <Form.Text className="text-muted">
                        Warehouse where inventory is currently stored
                      </Form.Text>
                    </Form.Group>
                  </Col>
                  <Col md={4}>
                    <Form.Group className="mb-3">
                      <Form.Label><strong>Destination Warehouse</strong></Form.Label>
                      <Form.Select 
                        name="destinationWarehouseId" 
                        value={formData.destinationWarehouseId} 
                        onChange={handleChange}
                        className="border-primary"
                        disabled={submitting || !formData.warehouseId}
                      >
                        <option value="">-- Select Destination --</option>
                        {warehouses
                          .filter(w => w.warehouseId.toString() !== formData.warehouseId)
                          .map(warehouse => (
                            <option key={warehouse.warehouseId} value={warehouse.warehouseId}>
                              {warehouse.name} - {warehouse.location}
                            </option>
                          ))}
                      </Form.Select>
                      <Form.Text className="text-muted">
                        Warehouse where inventory will be delivered
                      </Form.Text>
                    </Form.Group>
                  </Col>
                </Row>
                
                {selectedTruck && (
                  <Card className="bg-light border-0 mb-4">
                    <Card.Body>
                      <h5 className="text-primary mb-3">Selected Truck Details</h5>
                      <Row>
                        <Col md={4}>
                          <div className="mb-3">
                            <div className="text-muted mb-1">Registration</div>
                            <div className="fw-bold">{selectedTruck.registrationNumber}</div>
                          </div>
                        </Col>
                        <Col md={4}>
                          <div className="mb-3">
                            <div className="text-muted mb-1">Model</div>
                            <div className="fw-bold">{selectedTruck.model}</div>
                          </div>
                        </Col>
                        <Col md={4}>
                          <div className="mb-3">
                            <div className="text-muted mb-1">Driver</div>
                            <div className="fw-bold">
                              {selectedTruck.driver ? selectedTruck.driver.username : (
                                <Badge bg="warning" text="dark">No Driver Assigned</Badge>
                              )}
                            </div>
                          </div>
                        </Col>
                      </Row>
                      <Row>
                        <Col md={6}>
                          <div className="mb-3">
                            <div className="text-muted mb-1">Weight Capacity</div>
                            <div className="fw-bold">
                              <div className="d-flex align-items-center">
                                <div className="me-2">{selectedTruck.capacityWeight} kg</div>
                                {totalWeight > 0 && (
                                  <div className={`ms-2 ${totalWeight > selectedTruck.capacityWeight ? 'text-danger' : 'text-success'}`}>
                                    <i className={`bi ${totalWeight > selectedTruck.capacityWeight ? 'bi-exclamation-triangle' : 'bi-check-circle'} me-1`}></i>
                                    {totalWeight} kg selected ({((totalWeight / selectedTruck.capacityWeight) * 100).toFixed(1)}%)
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        </Col>
                        <Col md={6}>
                          <div className="mb-3">
                            <div className="text-muted mb-1">Volume Capacity</div>
                            <div className="fw-bold">
                              <div className="d-flex align-items-center">
                                <div className="me-2">{selectedTruck.capacityVolume} m³</div>
                                {totalVolume > 0 && (
                                  <div className={`ms-2 ${totalVolume > selectedTruck.capacityVolume ? 'text-danger' : 'text-success'}`}>
                                    <i className={`bi ${totalVolume > selectedTruck.capacityVolume ? 'bi-exclamation-triangle' : 'bi-check-circle'} me-1`}></i>
                                    {totalVolume.toFixed(2)} m³ selected ({((totalVolume / selectedTruck.capacityVolume) * 100).toFixed(1)}%)
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        </Col>
                      </Row>
                    </Card.Body>
                  </Card>
                )}
                
                {formData.warehouseId && (
                  <>
                    <h5 className="text-primary mb-3">
                      <i className="bi bi-box-seam me-2"></i>
                      Select Inventory Items
                    </h5>
                    
                    <Form.Group className="mb-3">
                      <Form.Control
                        type="text"
                        placeholder="Search inventory by name or SKU..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="border-primary mb-3"
                        disabled={submitting}
                      />
                    </Form.Group>
                    
                    {filteredInventory.length === 0 ? (
                      <Alert variant="info">
                        <div className="text-center py-3">
                          <i className="bi bi-inbox text-info" style={{ fontSize: '2rem' }}></i>
                          <p className="mt-3 mb-0">No inventory items found in this warehouse</p>
                        </div>
                      </Alert>
                    ) : (
                      <div className="table-responsive">
                        <Table hover className="align-middle">
                          <thead className="bg-light">
                            <tr>
                              <th className="border-0" width="50">Select</th>
                              <th className="border-0">Item</th>
                              <th className="border-0">SKU</th>
                              <th className="border-0">Quantity</th>
                              <th className="border-0">Weight</th>
                              <th className="border-0">Volume</th>
                              <th className="border-0">Total</th>
                            </tr>
                          </thead>
                          <tbody>
                            {filteredInventory.map(item => (
                              <tr key={item.inventoryId}>
                                <td>
                                  <Form.Check
                                    type="checkbox"
                                    checked={formData.inventoryIds.includes(item.inventoryId)}
                                    onChange={(e) => handleInventorySelect(e, item)}
                                    disabled={submitting}
                                  />
                                </td>
                                <td className="fw-bold text-primary">{item.name}</td>
                                <td>{item.sku}</td>
                                <td>{item.quantity} units</td>
                                <td>{item.weight} kg/unit</td>
                                <td>{item.volume} m³/unit</td>
                                <td>
                                  <div>{(item.weight * item.quantity).toFixed(2)} kg</div>
                                  <div>{(item.volume * item.quantity).toFixed(2)} m³</div>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </Table>
                      </div>
                    )}
                  </>
                )}
              </Card.Body>
            </Card>
          </Col>
          
          <Col lg={4}>
            <Card className="shadow-sm mb-4 border-primary">
              <Card.Header className="bg-white border-bottom border-primary">
                <h4 className="text-primary mb-0">
                  <i className="bi bi-list-check me-2"></i>
                  Selected Items
                </h4>
              </Card.Header>
              <Card.Body>
                {selectedInventory.length === 0 ? (
                  <div className="text-center py-4">
                    <i className="bi bi-cart text-muted" style={{ fontSize: '2rem' }}></i>
                    <p className="mt-3 mb-0 text-muted">No items selected</p>
                    <p className="text-muted small">Select items from the inventory list</p>
                  </div>
                ) : (
                  <>
                    <ListGroup variant="flush" className="mb-4">
                      {selectedInventory.map(item => (
                        <ListGroup.Item key={item.inventoryId} className="d-flex justify-content-between align-items-center py-3">
                          <div>
                            <div className="fw-bold">{item.name}</div>
                            <div className="text-muted small">{item.sku}</div>
                            <div className="text-muted small">{item.quantity} units</div>
                          </div>
                          <Button 
                            variant="outline-danger" 
                            size="sm"
                            onClick={() => {
                              setSelectedInventory(prev => prev.filter(i => i.inventoryId !== item.inventoryId));
                              setFormData(prev => ({
                                ...prev,
                                inventoryIds: prev.inventoryIds.filter(id => id !== item.inventoryId)
                              }));
                            }}
                            disabled={submitting}
                          >
                            <i className="bi bi-x-lg"></i>
                          </Button>
                        </ListGroup.Item>
                      ))}
                    </ListGroup>
                    
                    <div className="bg-light p-3 rounded mb-4">
                      <div className="d-flex justify-content-between mb-2">
                        <div className="text-muted">Total Items:</div>
                        <div className="fw-bold">{selectedInventory.length} items</div>
                      </div>
                      <div className="d-flex justify-content-between mb-2">
                        <div className="text-muted">Total Units:</div>
                        <div className="fw-bold">
                          {selectedInventory.reduce((sum, item) => sum + item.quantity, 0)} units
                        </div>
                      </div>
                      <div className="d-flex justify-content-between mb-2">
                        <div className="text-muted">Total Weight:</div>
                        <div className="fw-bold">
                          {totalWeight.toFixed(2)} kg
                        </div>
                      </div>
                      <div className="d-flex justify-content-between">
                        <div className="text-muted">Total Volume:</div>
                        <div className="fw-bold">
                          {totalVolume.toFixed(2)} m³
                        </div>
                      </div>
                    </div>
                  </>
                )}
                
                <div className="d-grid gap-2 mt-4">
                  <Button 
                    variant="primary" 
                    size="lg" 
                    type="submit" 
                    disabled={
                      submitting || 
                      !formData.truckId || 
                      !formData.warehouseId || 
                      !formData.destinationWarehouseId || 
                      selectedInventory.length === 0 ||
                      (selectedTruck && (totalWeight > selectedTruck.capacityWeight || totalVolume > selectedTruck.capacityVolume))
                    }
                  >
                    {submitting ? (
                      <>
                        <Spinner as="span" animation="border" size="sm" role="status" aria-hidden="true" className="me-2" />
                        Assigning...
                      </>
                    ) : (
                      <>
                        <i className="bi bi-truck me-2"></i>
                        Assign to Truck
                      </>
                    )}
                  </Button>
                  <Button 
                    variant="outline-secondary" 
                    onClick={() => navigate('/trucks')}
                    disabled={submitting}
                  >
                    Cancel
                  </Button>
                </div>
              </Card.Body>
            </Card>
            
            {selectedTruck && selectedTruck.driver && (
              <Card className="shadow-sm mb-4 border-primary">
                <Card.Header className="bg-white border-bottom border-primary">
                  <h4 className="text-primary mb-0">
                    <i className="bi bi-person me-2"></i>
                    Driver Information
                  </h4>
                </Card.Header>
                <Card.Body className="bg-light">
                  <div className="text-center mb-3">
                    <div className="bg-primary rounded-circle d-inline-flex align-items-center justify-content-center mb-3" style={{ width: '80px', height: '80px' }}>
                      <i className="bi bi-person-fill text-white" style={{ fontSize: '2.5rem' }}></i>
                    </div>
                    <h5 className="mb-1">{selectedTruck.driver.username}</h5>
                    <p className="text-muted mb-0">{selectedTruck.driver.email || 'No email available'}</p>
                  </div>
                  
                  <div className="mt-3">
                    <p className="text-center text-muted mb-0">
                      This driver will be notified when the assignment is created
                    </p>
                  </div>
                </Card.Body>
              </Card>
            )}
          </Col>
        </Row>
      </Form>
    </Container>
  );
};

export default InventoryAssignment;
