package com.logistics.logistics.controller;

import com.logistics.logistics.dto.TruckDTO;
import com.logistics.logistics.model.Truck;
import com.logistics.logistics.model.Warehouse;
import com.logistics.logistics.repository.UserRepository;
import com.logistics.logistics.repository.WarehouseRepository;
import com.logistics.logistics.service.TruckService;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping({"/api/trucks", "/api/trucks/"})
@RequiredArgsConstructor
@CrossOrigin(origins = "http://localhost:3000")
public class TruckController {
    private static final Logger logger = LoggerFactory.getLogger(TruckController.class);
    
    private final TruckService truckService;
    private final WarehouseRepository warehouseRepository;
    private final UserRepository userRepository;
    
    @GetMapping
    @PreAuthorize("hasAnyRole('ROLE_admin', 'ROLE_logistics_manager')")
    public ResponseEntity<List<TruckDTO>> getAllTrucks() {
        logger.info("GET request to fetch all trucks");
        List<TruckDTO> trucks = truckService.getAllTrucks().stream()
                .map(TruckDTO::fromEntity)
                .collect(Collectors.toList());
        return ResponseEntity.ok(trucks);
    }
    
    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('ROLE_admin', 'ROLE_logistics_manager', 'ROLE_warehouse_staff', 'ROLE_delivery_driver')")
    public ResponseEntity<TruckDTO> getTruckById(@PathVariable Integer id) {
        logger.info("GET request to fetch truck by id: {}", id);
        return truckService.getTruckById(id)
                .map(TruckDTO::fromEntity)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }
    
    @PostMapping
    @PreAuthorize("hasAnyRole('ROLE_admin', 'ROLE_logistics_manager')")
    public ResponseEntity<TruckDTO> createTruck(@RequestBody Truck truck) {
        logger.info("POST request to create truck: {}", truck);
        try {
            // Basic validation
            if (truck.getRegistrationNumber() == null || truck.getRegistrationNumber().isEmpty()) {
                return ResponseEntity.badRequest().body(TruckDTO.builder().build());
            }
            
            if (truck.getModel() == null || truck.getModel().isEmpty()) {
                return ResponseEntity.badRequest().body(TruckDTO.builder().build());
            }
            
            // Handle warehouse reference
            if (truck.getHomeWarehouseId() != null) {
                warehouseRepository.findById(truck.getHomeWarehouseId())
                    .ifPresent(truck::setHomeWarehouse);
            }
            
            if (truck.getHomeWarehouse() == null) {
                // Default to first warehouse if none specified
                warehouseRepository.findAll().stream().findFirst()
                    .ifPresent(truck::setHomeWarehouse);
            }
            
            // Handle driver reference if provided
            if (truck.getDriverId() != null) {
                // We need to get User entity from repository
                // Let's use userRepository to get the driver
                userRepository.findById(truck.getDriverId())
                    .ifPresent(driver -> {
                        truck.setDriver(driver);
                        logger.info("Setting driver: {} for truck: {}", driver.getUsername(), truck.getRegistrationNumber());
                    });
            }
            
            // Set default status if not specified
            if (truck.getStatus() == null) {
                truck.setStatus(Truck.TruckStatus.AVAILABLE);
            }
            
            Truck savedTruck = truckService.saveTruck(truck);
            return ResponseEntity.ok(TruckDTO.fromEntity(savedTruck));
        } catch (Exception e) {
            logger.error("Error creating truck: {}", e.getMessage(), e);
            return ResponseEntity.status(500).build();
        }
    }
    
    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('ROLE_admin', 'ROLE_logistics_manager')")
    public ResponseEntity<TruckDTO> updateTruck(@PathVariable Integer id, @RequestBody Truck truck) {
        logger.info("PUT request to update truck with id: {}", id);
        try {
            return truckService.getTruckById(id)
                    .map(existingTruck -> {
                        // Set the ID from the path variable
                        truck.setTruckId(id);
                        
                        // Keep existing values if not provided
                        if (truck.getRegistrationNumber() == null || truck.getRegistrationNumber().isEmpty()) {
                            truck.setRegistrationNumber(existingTruck.getRegistrationNumber());
                        }
                        
                        if (truck.getModel() == null || truck.getModel().isEmpty()) {
                            truck.setModel(existingTruck.getModel());
                        }
                        
                        // Handle warehouse reference
                        if (truck.getHomeWarehouseId() != null) {
                            warehouseRepository.findById(truck.getHomeWarehouseId())
                                .ifPresent(truck::setHomeWarehouse);
                        }
                        
                        if (truck.getHomeWarehouse() == null) {
                            truck.setHomeWarehouse(existingTruck.getHomeWarehouse());
                        }
                        
                        // Handle driver reference if provided
                        if (truck.getDriverId() != null) {
                            userRepository.findById(truck.getDriverId())
                                .ifPresent(driver -> {
                                    truck.setDriver(driver);
                                    logger.info("Setting driver: {} for truck: {}", driver.getUsername(), truck.getRegistrationNumber());
                                });
                        } else if (truck.getDriver() == null) {
                            // Keep existing driver if none provided
                            truck.setDriver(existingTruck.getDriver());
                        }
                        
                        // Keep existing status if not provided
                        if (truck.getStatus() == null) {
                            truck.setStatus(existingTruck.getStatus());
                        }
                        
                        // Keep existing dates if not provided
                        if (truck.getLastMaintenanceDate() == null) {
                            truck.setLastMaintenanceDate(existingTruck.getLastMaintenanceDate());
                        }
                        
                        if (truck.getNextMaintenanceDate() == null) {
                            truck.setNextMaintenanceDate(existingTruck.getNextMaintenanceDate());
                        }
                        
                        Truck updatedTruck = truckService.saveTruck(truck);
                        return ResponseEntity.ok(TruckDTO.fromEntity(updatedTruck));
                    })
                    .orElse(ResponseEntity.notFound().build());
        } catch (Exception e) {
            logger.error("Error updating truck: {}", e.getMessage(), e);
            return ResponseEntity.status(500).build();
        }
    }
    
    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ROLE_admin')")
    public ResponseEntity<Void> deleteTruck(@PathVariable Integer id) {
        logger.info("DELETE request to delete truck with id: {}", id);
        return truckService.getTruckById(id)
                .map(truck -> {
                    truckService.deleteTruck(id);
                    return ResponseEntity.ok().<Void>build();
                })
                .orElse(ResponseEntity.notFound().build());
    }
    
    @GetMapping("/warehouse/{warehouseId}/available")
    @PreAuthorize("hasAnyRole('ROLE_admin', 'ROLE_logistics_manager')")
    public ResponseEntity<List<TruckDTO>> getAvailableTrucksByWarehouse(@PathVariable Integer warehouseId) {
        logger.info("GET request to fetch available trucks for warehouse: {}", warehouseId);
        return warehouseRepository.findById(warehouseId)
                .map(warehouse -> {
                    List<TruckDTO> trucks = truckService.getAvailableTrucksByWarehouse(warehouse).stream()
                            .map(TruckDTO::fromEntity)
                            .collect(Collectors.toList());
                    return ResponseEntity.ok(trucks);
                })
                .orElse(ResponseEntity.notFound().build());
    }
    
    @GetMapping("/warehouse/{warehouseId}/available/capacity")
    @PreAuthorize("hasAnyRole('ROLE_admin', 'ROLE_logistics_manager')")
    public ResponseEntity<List<TruckDTO>> getAvailableTrucksWithCapacity(
            @PathVariable Integer warehouseId,
            @RequestParam BigDecimal weight,
            @RequestParam BigDecimal volume) {
        logger.info("GET request to fetch available trucks with capacity for warehouse: {}, weight: {}, volume: {}", 
                warehouseId, weight, volume);
        return warehouseRepository.findById(warehouseId)
                .map(warehouse -> {
                    List<TruckDTO> trucks = truckService.getAvailableTrucksWithCapacity(warehouse, weight, volume).stream()
                            .map(TruckDTO::fromEntity)
                            .collect(Collectors.toList());
                    return ResponseEntity.ok(trucks);
                })
                .orElse(ResponseEntity.notFound().build());
    }
    
    @GetMapping("/warehouse/{warehouseId}/available/with-driver")
    @PreAuthorize("hasAnyRole('ROLE_admin', 'ROLE_logistics_manager')")
    public ResponseEntity<List<TruckDTO>> getAvailableTrucksWithDriver(@PathVariable Integer warehouseId) {
        logger.info("GET request to fetch available trucks with driver for warehouse: {}", warehouseId);
        return warehouseRepository.findById(warehouseId)
                .map(warehouse -> {
                    List<TruckDTO> trucks = truckService.getAvailableTrucksWithDriver(warehouse).stream()
                            .map(TruckDTO::fromEntity)
                            .collect(Collectors.toList());
                    return ResponseEntity.ok(trucks);
                })
                .orElse(ResponseEntity.notFound().build());
    }
    
    @PatchMapping("/{id}/status")
    @PreAuthorize("hasAnyRole('ROLE_admin', 'ROLE_logistics_manager', 'ROLE_delivery_driver')")
    public ResponseEntity<Void> updateTruckStatus(
            @PathVariable Integer id,
            @RequestParam Truck.TruckStatus status) {
        logger.info("PATCH request to update truck status: {} to {}", id, status);
        boolean updated = truckService.updateTruckStatus(id, status);
        return updated ? ResponseEntity.ok().build() : ResponseEntity.notFound().build();
    }
}
