package com.logistics.logistics.controller;

import com.logistics.logistics.dto.ShipmentProcessingRequest;
import com.logistics.logistics.dto.ShipmentProcessingResponse;
import com.logistics.logistics.dto.ShipmentProcessingSummary;
import com.logistics.logistics.model.User;
import com.logistics.logistics.repository.UserRepository;
import com.logistics.logistics.service.ShipmentProcessingService;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.Optional;

@RestController
@RequestMapping("/api/shipment-processing")
@RequiredArgsConstructor
@CrossOrigin(origins = "http://localhost:3000")
public class ShipmentProcessingController {
    private static final Logger logger = LoggerFactory.getLogger(ShipmentProcessingController.class);
    
    private final ShipmentProcessingService shipmentProcessingService;
    private final UserRepository userRepository;
    
    /**
     * Process a shipment item by scanning its barcode
     */
    @PostMapping("/scan-item")
    @PreAuthorize("hasAnyRole('ROLE_admin', 'ROLE_warehouse_staff')")
    public ResponseEntity<ShipmentProcessingResponse> processShipmentItem(
            @RequestBody ShipmentProcessingRequest request,
            @AuthenticationPrincipal UserDetails userDetails) {
        
        logger.info("POST request to process shipment item: {}", request);
        
        // Get the user from the database
        Optional<User> userOpt = userRepository.findByUsername(userDetails.getUsername());
        if (userOpt.isEmpty()) {
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
    @GetMapping("/summary/{trackingNumber}")
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
        if (userOpt.isEmpty()) {
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
    
    /**
     * Report a weight mismatch in a shipment
     */
    @PostMapping("/report-weight-mismatch/{trackingNumber}")
    @PreAuthorize("hasAnyRole('ROLE_admin', 'ROLE_warehouse_staff')")
    public ResponseEntity<ShipmentProcessingResponse> reportWeightMismatch(
            @PathVariable String trackingNumber,
            @RequestParam BigDecimal actualWeight,
            @AuthenticationPrincipal UserDetails userDetails) {
        
        logger.info("POST request to report weight mismatch in shipment {}", trackingNumber);
        
        // Get the user from the database
        Optional<User> userOpt = userRepository.findByUsername(userDetails.getUsername());
        if (userOpt.isEmpty()) {
            logger.error("User not found: {}", userDetails.getUsername());
            return ResponseEntity.badRequest().build();
        }
        
        ShipmentProcessingResponse response = shipmentProcessingService.handleWeightMismatch(trackingNumber, actualWeight, userOpt.get());
        
        if (response.isSuccess()) {
            return ResponseEntity.ok(response);
        } else {
            return ResponseEntity.badRequest().body(response);
        }
    }
}
