package com.logistics.logistics.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class InventoryAssignmentResponse {
    private Long assignmentId;
    private Long truckId;
    private String truckRegistrationNumber;
    private String driverName;
    private String originWarehouseName;
    private String destinationWarehouseName;
    private List<InventoryItemDto> assignedInventory;
    private String status;
    private LocalDateTime assignmentDate;
    private String message;
    private boolean success;
    
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class InventoryItemDto {
        private Long inventoryId;
        private String name;
        private String sku;
        private Double weight;
        private Double volume;
        private Integer quantity;
    }
}
