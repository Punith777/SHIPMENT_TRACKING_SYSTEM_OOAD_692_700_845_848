-- First, let's see what users actually exist
-- SELECT user_id, username, role FROM Users;

-- Now let's update the trucks with drivers that actually exist
-- Assuming you have users with IDs 1 and 2 based on your sample data
UPDATE Trucks SET driver_id = 1 WHERE truck_id = 1;
UPDATE Trucks SET driver_id = 2 WHERE truck_id = 2;

-- If you want to assign specific drivers with the 'delivery_driver' role:
-- First, insert proper delivery driver users if they don't exist
INSERT INTO Users (username, email, password_hash, role)
SELECT 'driver1', 'driver1@example.com', SHA2('password123', 256), 'delivery_driver'
WHERE NOT EXISTS (SELECT * FROM Users WHERE username = 'driver1');

INSERT INTO Users (username, email, password_hash, role)
SELECT 'driver2', 'driver2@example.com', SHA2('password123', 256), 'delivery_driver'
WHERE NOT EXISTS (SELECT * FROM Users WHERE username = 'driver2');

-- Then assign these drivers to trucks
UPDATE Trucks SET driver_id = (SELECT user_id FROM Users WHERE username = 'driver1') 
WHERE truck_id = 1;

UPDATE Trucks SET driver_id = (SELECT user_id FROM Users WHERE username = 'driver2')
WHERE truck_id = 2;
