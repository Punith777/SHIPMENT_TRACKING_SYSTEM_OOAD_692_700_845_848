package com.logistics.logistics.dto;

import com.logistics.logistics.model.ShipmentItem;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ShipmentProcessingRequest {
    private String trackingNumber;
    private String barcode;
    private BigDecimal weight;
    private ShipmentItem.ShipmentItemStatus status;
    private String notes;
}
