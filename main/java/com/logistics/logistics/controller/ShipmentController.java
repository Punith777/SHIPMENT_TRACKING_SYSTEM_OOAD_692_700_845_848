package com.logistics.logistics.controller;

import com.logistics.logistics.dto.ShipmentProcessingRequest;
import com.logistics.logistics.dto.ShipmentProcessingResponse;
import com.logistics.logistics.dto.ShipmentProcessingSummary;
import com.logistics.logistics.dto.TruckAssignmentRequest;
import com.logistics.logistics.dto.TruckAssignmentResponse;
import com.logistics.logistics.model.Shipment;
import com.logistics.logistics.model.User;
import com.logistics.logistics.model.Warehouse;
import com.logistics.logistics.repository.UserRepository;
import com.logistics.logistics.repository.WarehouseRepository;
import com.logistics.logistics.service.ShipmentProcessingService;
import com.logistics.logistics.service.ShipmentService;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Optional;

@RestController
@RequestMapping("/api/shipments")
@RequiredArgsConstructor
@CrossOrigin(origins = "http://localhost:3000")
public class ShipmentController {
    private static final Logger logger = LoggerFactory.getLogger(ShipmentController.class);
    
    private final ShipmentService shipmentService;
    private final ShipmentProcessingService shipmentProcessingService;
    private final WarehouseRepository warehouseRepository;
    private final UserRepository userRepository;
    
    @GetMapping
    @PreAuthorize("hasAnyRole('ROLE_admin', 'ROLE_logistics_manager')")
    public ResponseEntity<List<Shipment>> getAllShipments() {
        logger.info("GET request to fetch all shipments");
        return ResponseEntity.ok(shipmentService.getAllShipments());
    }
    
    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('ROLE_admin', 'ROLE_logistics_manager', 'ROLE_warehouse_staff', 'ROLE_delivery_driver')")
    public ResponseEntity<Shipment> getShipmentById(@PathVariable Integer id) {
        logger.info("GET request to fetch shipment by id: {}", id);
        return shipmentService.getShipmentById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }
    
    @GetMapping("/tracking/{trackingNumber}")
    @PreAuthorize("hasAnyRole('ROLE_admin', 'ROLE_logistics_manager', 'ROLE_warehouse_staff', 'ROLE_delivery_driver')")
    public ResponseEntity<Shipment> getShipmentByTrackingNumber(@PathVariable String trackingNumber) {
        logger.info("GET request to fetch shipment by tracking number: {}", trackingNumber);
        return shipmentService.getShipmentByTrackingNumber(trackingNumber)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }
    
    @PostMapping
    @PreAuthorize("hasAnyRole('ROLE_admin', 'ROLE_logistics_manager')")
    public ResponseEntity<Shipment> createShipment(@RequestBody Shipment shipment) {
        logger.info("POST request to create shipment: {}", shipment);
        return ResponseEntity.ok(shipmentService.saveShipment(shipment));
    }
    
    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('ROLE_admin', 'ROLE_logistics_manager')")
    public ResponseEntity<Shipment> updateShipment(@PathVariable Integer id, @RequestBody Shipment shipment) {
        logger.info("PUT request to update shipment with id: {}", id);
        return shipmentService.getShipmentById(id)
                .map(existingShipment -> {
                    shipment.setShipmentId(id);
                    return ResponseEntity.ok(shipmentService.saveShipment(shipment));
                })
                .orElse(ResponseEntity.notFound().build());
    }
    
    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ROLE_admin')")
    public ResponseEntity<Void> deleteShipment(@PathVariable Integer id) {
        logger.info("DELETE request to delete shipment with id: {}", id);
        return shipmentService.getShipmentById(id)
                .map(shipment -> {
                    shipmentService.deleteShipment(id);
                    return ResponseEntity.ok().<Void>build();
                })
                .orElse(ResponseEntity.notFound().build());
    }
    
    @GetMapping("/warehouse/{warehouseId}/pending")
    @PreAuthorize("hasAnyRole('ROLE_admin', 'ROLE_logistics_manager')")
    public ResponseEntity<List<Shipment>> getPendingShipmentsByWarehouse(@PathVariable Integer warehouseId) {
        logger.info("GET request to fetch pending shipments for warehouse: {}", warehouseId);
        return warehouseRepository.findById(warehouseId)
                .map(warehouse -> ResponseEntity.ok(shipmentService.getPendingShipmentsByWarehouse(warehouse)))
                .orElse(ResponseEntity.notFound().build());
    }
    
    @PostMapping("/assign-truck")
    @PreAuthorize("hasAnyRole('ROLE_admin', 'ROLE_logistics_manager')")
    public ResponseEntity<TruckAssignmentResponse> assignTruckToShipment(
            @RequestBody TruckAssignmentRequest request,
            @AuthenticationPrincipal UserDetails userDetails) {
        logger.info("POST request to assign truck to shipment: {}", request);
        
        // Get the user from the database
        Optional<User> userOpt = userRepository.findByUsername(userDetails.getUsername());
        if (!userOpt.isPresent()) {
            logger.error("User not found: {}", userDetails.getUsername());
            return ResponseEntity.badRequest().build();
        }
        
        TruckAssignmentResponse response = shipmentService.assignTruckToShipment(request, userOpt.get());
        
        if (response.isSuccess()) {
            return ResponseEntity.ok(response);
        } else {
            return ResponseEntity.badRequest().body(response);
        }
    }
    
    /**
     * Process a shipment item by scanning its barcode
     */
    @PostMapping("/process-item")
    @PreAuthorize("hasAnyRole('ROLE_admin', 'ROLE_warehouse_staff')")
    public ResponseEntity<ShipmentProcessingResponse> processShipmentItem(
            @RequestBody ShipmentProcessingRequest request,
            @AuthenticationPrincipal UserDetails userDetails) {
        
        logger.info("POST request to process shipment item: {}", request);
        
        // Get the user from the database
        Optional<User> userOpt = userRepository.findByUsername(userDetails.getUsername());
        if (!userOpt.isPresent()) {
            logger.error("User not found: {}", userDetails.getUsername());
            return ResponseEntity.badRequest().build();
        }
        
        ShipmentProcessingResponse response = shipmentProcessingService.processShipmentItem(request, userOpt.get());
        
        if (response.isSuccess()) {
            return ResponseEntity.ok(response);
        } else {
            return ResponseEntity.badRequest().body(response);
        }
    }
    
    /**
     * Get a summary of the shipment processing status
     */
    @GetMapping("/processing-summary/{trackingNumber}")
    @PreAuthorize("hasAnyRole('ROLE_admin', 'ROLE_warehouse_staff', 'ROLE_logistics_manager')")
    public ResponseEntity<ShipmentProcessingSummary> getShipmentProcessingSummary(@PathVariable String trackingNumber) {
        logger.info("GET request to get processing summary for shipment: {}", trackingNumber);
        
        ShipmentProcessingSummary summary = shipmentProcessingService.getShipmentProcessingSummary(trackingNumber);
        
        if (summary != null) {
            return ResponseEntity.ok(summary);
        } else {
            return ResponseEntity.notFound().build();
        }
    }
    
    /**
     * Report a missing item in a shipment
     */
    @PostMapping("/report-missing/{trackingNumber}/{barcode}")
    @PreAuthorize("hasAnyRole('ROLE_admin', 'ROLE_warehouse_staff')")
    public ResponseEntity<ShipmentProcessingResponse> reportMissingItem(
            @PathVariable String trackingNumber,
            @PathVariable String barcode,
            @AuthenticationPrincipal UserDetails userDetails) {
        
        logger.info("POST request to report missing item with barcode {} in shipment {}", barcode, trackingNumber);
        
        // Get the user from the database
        Optional<User> userOpt = userRepository.findByUsername(userDetails.getUsername());
        if (!userOpt.isPresent()) {
            logger.error("User not found: {}", userDetails.getUsername());
            return ResponseEntity.badRequest().build();
        }
        
        ShipmentProcessingResponse response = shipmentProcessingService.handleMissingItem(trackingNumber, barcode, userOpt.get());
        
        if (response.isSuccess()) {
            return ResponseEntity.ok(response);
        } else {
            return ResponseEntity.badRequest().body(response);
        }
    }
}
