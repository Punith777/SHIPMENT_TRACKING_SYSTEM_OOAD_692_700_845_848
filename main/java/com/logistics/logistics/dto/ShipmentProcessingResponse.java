package com.logistics.logistics.dto;

import com.logistics.logistics.model.Shipment;
import com.logistics.logistics.model.ShipmentItem;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ShipmentProcessingResponse {
    private boolean success;
    private String message;
    private String trackingNumber;
    private Shipment.ShipmentStatus shipmentStatus;
    private String itemBarcode;
    private ShipmentItem.ShipmentItemStatus itemStatus;
    private BigDecimal itemWeight;
    private BigDecimal totalProcessedWeight;
    private BigDecimal totalExpectedWeight;
    private int processedItemsCount;
    private int totalItemsCount;
    private boolean allItemsProcessed;
    private boolean readyForLoading;
    private List<String> missingItems;
}
