-- Add READY_FOR_PICKUP status to the shipment_status enum if it doesn't exist
-- This is database-specific, for MySQL:
ALTER TABLE Shipments MODIFY COLUMN status ENUM('PENDING', 'SCHEDULED_FOR_PICKUP', 'READY_FOR_PICKUP', 'IN_TRANSIT', 'DELIVERED', 'CANCELLED') NOT NULL;

-- Create ShipmentItems table
CREATE TABLE IF NOT EXISTS ShipmentItems (
    shipment_item_id INT AUTO_INCREMENT PRIMARY KEY,
    shipment_id INT NOT NULL,
    inventory_id INT NOT NULL,
    quantity INT NOT NULL DEFAULT 1,
    weight DECIMAL(10, 2),
    volume DECIMAL(10, 2),
    barcode VARCHAR(50),
    status ENUM('PENDING', 'VERIFIED', 'MISSING', 'DAMAGED', 'LOADED') NOT NULL DEFAULT 'PENDING',
    verified_by INT,
    verified_at DATETIME,
    notes VARCHAR(500),
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (shipment_id) REFERENCES Shipments(shipment_id) ON DELETE CASCADE,
    FOREIGN KEY (inventory_id) REFERENCES Inventory(inventory_id),
    FOREIGN KEY (verified_by) REFERENCES Users(user_id)
);

-- Create index for faster lookups
CREATE INDEX idx_shipment_items_shipment_id ON ShipmentItems(shipment_id);
CREATE INDEX idx_shipment_items_barcode ON ShipmentItems(barcode);
CREATE INDEX idx_shipment_items_status ON ShipmentItems(status);

-- Add WAREHOUSE_MANAGER role to users table if needed
-- Insert a warehouse manager user for testing
INSERT INTO Users (username, email, password_hash, role, created_at, updated_at)
SELECT 'warehousemanager', 'warehouse.manager@logistics.com', '$2a$10$hKDVYxLefVHV/vtuPhWD3OigtRyOykRLDdUAp80Z1crSoS1lFqaFS', 'warehouse_manager', NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM Users WHERE role = 'warehouse_manager' LIMIT 1);
