package com.logistics.logistics.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class InventoryAssignmentRequest {
    private Long truckId;
    private Long warehouseId;
    private Long destinationWarehouseId;
    private List<Long> inventoryIds;
}
