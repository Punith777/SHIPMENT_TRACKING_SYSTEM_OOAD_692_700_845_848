package com.logistics.logistics.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class TruckAssignmentRequest {
    private Integer shipmentId;
    private Integer truckId;
    private LocalDateTime scheduledPickupDate;
    private String notes;
}
