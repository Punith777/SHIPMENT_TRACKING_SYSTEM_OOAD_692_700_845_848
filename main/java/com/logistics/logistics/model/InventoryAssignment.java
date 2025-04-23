package com.logistics.logistics.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;

@Entity
@Table(name = "InventoryAssignments")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class InventoryAssignment {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "assignment_id")
    private Integer assignmentId;
    
    @ManyToOne
    @JoinColumn(name = "truck_id", nullable = false)
    private Truck truck;
    
    @ManyToOne
    @JoinColumn(name = "source_warehouse_id", nullable = false)
    private Warehouse sourceWarehouse;
    
    @ManyToOne
    @JoinColumn(name = "destination_warehouse_id", nullable = false)
    private Warehouse destinationWarehouse;
    
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private AssignmentStatus status = AssignmentStatus.PENDING;
    
    @ManyToOne
    @JoinColumn(name = "assigned_by", nullable = false)
    private User assignedBy;
    
    @Column(name = "assigned_at")
    private LocalDateTime assignedAt;
    
    @Column(name = "completed_at")
    private LocalDateTime completedAt;
    
    @OneToMany(mappedBy = "assignment", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<AssignmentItem> assignmentItems;
    
    @PrePersist
    protected void onCreate() {
        assignedAt = LocalDateTime.now();
    }
    
    public enum AssignmentStatus {
        PENDING,
        IN_TRANSIT,
        DELIVERED,
        CANCELLED
    }
}
