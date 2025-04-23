package com.logistics.logistics.controller;

import com.logistics.logistics.dto.InventoryAssignmentRequest;
import com.logistics.logistics.dto.InventoryAssignmentResponse;
import com.logistics.logistics.model.InventoryAssignment;
import com.logistics.logistics.model.User;
import com.logistics.logistics.repository.InventoryAssignmentRepository;
import com.logistics.logistics.service.InventoryAssignmentService;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/inventory-assignments")
@RequiredArgsConstructor
@CrossOrigin(origins = "http://localhost:3000")
public class InventoryAssignmentController {

    private final InventoryAssignmentService inventoryAssignmentService;
    private final InventoryAssignmentRepository inventoryAssignmentRepository;
    private static final Logger logger = LoggerFactory.getLogger(InventoryAssignmentController.class);

    @PostMapping
    @PreAuthorize("hasAnyRole('ROLE_admin', 'ROLE_logistics_manager', 'ROLE_warehouse_staff')")
    public ResponseEntity<InventoryAssignmentResponse> assignInventoryToTruck(
            @RequestBody InventoryAssignmentRequest request,
            @AuthenticationPrincipal User currentUser) {
        
        logger.info("Received request to assign inventory to truck. Truck ID: {}", request.getTruckId());
        
        InventoryAssignmentResponse response = inventoryAssignmentService.assignInventoryToTruck(request, currentUser);
        
        if (response.isSuccess()) {
            logger.info("Inventory assignment successful. Assignment ID: {}", response.getAssignmentId());
            return ResponseEntity.ok(response);
        } else {
            logger.error("Inventory assignment failed: {}", response.getMessage());
            return ResponseEntity.badRequest().body(response);
        }
    }
    
    @GetMapping("/truck/{truckId}")
    @PreAuthorize("hasAnyRole('ROLE_admin', 'ROLE_logistics_manager', 'ROLE_warehouse_staff', 'ROLE_delivery_driver')")
    public ResponseEntity<?> getAssignmentsByTruck(@PathVariable Integer truckId) {
        try {
            logger.info("Fetching assignments for truck ID: {}", truckId);
            List<InventoryAssignment> assignments = inventoryAssignmentRepository.findByTruckId(truckId);
            return ResponseEntity.ok(assignments);
        } catch (Exception e) {
            logger.error("Error fetching assignments for truck ID: {}", truckId, e);
            Map<String, String> response = new HashMap<>();
            response.put("error", "Failed to fetch assignments: " + e.getMessage());
            return ResponseEntity.internalServerError().body(response);
        }
    }
    
    @GetMapping("/warehouse/{warehouseId}")
    @PreAuthorize("hasAnyRole('ROLE_admin', 'ROLE_logistics_manager', 'ROLE_warehouse_staff')")
    public ResponseEntity<?> getAssignmentsByWarehouse(@PathVariable Integer warehouseId) {
        try {
            logger.info("Fetching assignments for warehouse ID: {}", warehouseId);
            List<InventoryAssignment> sourceAssignments = inventoryAssignmentRepository.findBySourceWarehouseId(warehouseId);
            List<InventoryAssignment> destinationAssignments = inventoryAssignmentRepository.findByDestinationWarehouseId(warehouseId);
            
            Map<String, Object> response = new HashMap<>();
            response.put("sourceAssignments", sourceAssignments);
            response.put("destinationAssignments", destinationAssignments);
            
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            logger.error("Error fetching assignments for warehouse ID: {}", warehouseId, e);
            Map<String, String> response = new HashMap<>();
            response.put("error", "Failed to fetch assignments: " + e.getMessage());
            return ResponseEntity.internalServerError().body(response);
        }
    }
    
    @GetMapping("/{assignmentId}")
    @PreAuthorize("hasAnyRole('ROLE_admin', 'ROLE_logistics_manager', 'ROLE_warehouse_staff', 'ROLE_delivery_driver')")
    public ResponseEntity<?> getAssignmentById(@PathVariable Integer assignmentId) {
        try {
            logger.info("Fetching assignment with ID: {}", assignmentId);
            return inventoryAssignmentRepository.findById(assignmentId)
                .map(ResponseEntity::ok)
                .orElseGet(() -> {
                    Map<String, String> response = new HashMap<>();
                    response.put("error", "Assignment not found with ID: " + assignmentId);
                    return ResponseEntity.notFound().build();
                });
        } catch (Exception e) {
            logger.error("Error fetching assignment with ID: {}", assignmentId, e);
            Map<String, String> response = new HashMap<>();
            response.put("error", "Failed to fetch assignment: " + e.getMessage());
            return ResponseEntity.internalServerError().body(response);
        }
    }
    
    @PutMapping("/{assignmentId}/status")
    @PreAuthorize("hasAnyRole('ROLE_admin', 'ROLE_logistics_manager', 'ROLE_warehouse_staff', 'ROLE_delivery_driver')")
    public ResponseEntity<?> updateAssignmentStatus(
            @PathVariable Integer assignmentId,
            @RequestBody Map<String, String> statusUpdate,
            @AuthenticationPrincipal User currentUser) {
        try {
            String newStatus = statusUpdate.get("status");
            if (newStatus == null) {
                Map<String, String> response = new HashMap<>();
                response.put("error", "Status is required");
                return ResponseEntity.badRequest().body(response);
            }
            
            logger.info("Updating assignment status. Assignment ID: {}, New Status: {}", assignmentId, newStatus);
            
            return inventoryAssignmentRepository.findById(assignmentId)
                .map(assignment -> {
                    try {
                        InventoryAssignment.AssignmentStatus status = InventoryAssignment.AssignmentStatus.valueOf(newStatus);
                        assignment.setStatus(status);
                        
                        // If status is DELIVERED or CANCELLED, update related entities
                        if (status == InventoryAssignment.AssignmentStatus.DELIVERED || 
                            status == InventoryAssignment.AssignmentStatus.CANCELLED) {
                            // Update truck status back to AVAILABLE
                            assignment.getTruck().setStatus(com.logistics.logistics.model.Truck.TruckStatus.AVAILABLE);
                        }
                        
                        InventoryAssignment updatedAssignment = inventoryAssignmentRepository.save(assignment);
                        return ResponseEntity.ok(updatedAssignment);
                    } catch (IllegalArgumentException e) {
                        Map<String, String> response = new HashMap<>();
                        response.put("error", "Invalid status: " + newStatus);
                        return ResponseEntity.badRequest().body(response);
                    }
                })
                .orElseGet(() -> {
                    Map<String, String> response = new HashMap<>();
                    response.put("error", "Assignment not found with ID: " + assignmentId);
                    return ResponseEntity.notFound().build();
                });
        } catch (Exception e) {
            logger.error("Error updating assignment status. Assignment ID: {}", assignmentId, e);
            Map<String, String> response = new HashMap<>();
            response.put("error", "Failed to update assignment status: " + e.getMessage());
            return ResponseEntity.internalServerError().body(response);
        }
    }
}
