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
public class TruckAssignmentResponse {
    private Integer shipmentId;
    private String trackingNumber;
    private Integer truckId;
    private String truckRegistrationNumber;
    private String driverName;
    private String status;
    private LocalDateTime scheduledPickupDate;
    private String message;
    private boolean success;
}
