package com.logistics.logistics.dto;

import com.logistics.logistics.model.Shipment;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ShipmentProcessingSummary {
    private Integer shipmentId;
    private String trackingNumber;
    private Shipment.ShipmentStatus status;
    private BigDecimal totalWeight;
    private BigDecimal processedWeight;
    private int totalItems;
    private int processedItems;
    private int missingItems;
    private int damagedItems;
    private boolean readyForLoading;
    private LocalDateTime lastProcessedAt;
    private List<ShipmentItemDto> items;
    
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ShipmentItemDto {
        private Integer itemId;
        private String barcode;
        private String description;
        private BigDecimal weight;
        private String status;
        private LocalDateTime processedAt;
    }
}
