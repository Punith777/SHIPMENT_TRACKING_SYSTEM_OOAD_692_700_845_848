-- Fix driver association for trucks
UPDATE Trucks SET driver_id = 5 WHERE truck_id = 1;
UPDATE Trucks SET driver_id = 6 WHERE truck_id = 2;
