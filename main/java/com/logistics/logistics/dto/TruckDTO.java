package com.logistics.logistics.dto;

import com.logistics.logistics.model.Truck;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TruckDTO {
    private Integer truckId;
    private String registrationNumber;
    private String model;
    private BigDecimal capacityWeight;
    private BigDecimal capacityVolume;
    private Integer driverId;
    private String driverName;
    private Integer homeWarehouseId;
    private String homeWarehouseName;
    private Truck.TruckStatus status;
    private LocalDate lastMaintenanceDate;
    private LocalDate nextMaintenanceDate;
    
    public static TruckDTO fromEntity(Truck truck) {
        return TruckDTO.builder()
                .truckId(truck.getTruckId())
                .registrationNumber(truck.getRegistrationNumber())
                .model(truck.getModel())
                .capacityWeight(truck.getCapacityWeight())
                .capacityVolume(truck.getCapacityVolume())
                .driverId(truck.getDriver() != null ? truck.getDriver().getUserId() : null)
                .driverName(truck.getDriver() != null ? truck.getDriver().getUsername() : null)
                .homeWarehouseId(truck.getHomeWarehouse() != null ? truck.getHomeWarehouse().getWarehouseId() : null)
                .homeWarehouseName(truck.getHomeWarehouse() != null ? truck.getHomeWarehouse().getName() : null)
                .status(truck.getStatus())
                .lastMaintenanceDate(truck.getLastMaintenanceDate())
                .nextMaintenanceDate(truck.getNextMaintenanceDate())
                .build();
    }
}
