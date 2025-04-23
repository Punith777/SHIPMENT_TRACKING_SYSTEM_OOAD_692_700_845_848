package com.logistics.logistics.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "AssignmentItems")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AssignmentItem {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "assignment_item_id")
    private Integer assignmentItemId;
    
    @ManyToOne
    @JoinColumn(name = "assignment_id", nullable = false)
    private InventoryAssignment assignment;
    
    @ManyToOne
    @JoinColumn(name = "inventory_id", nullable = false)
    private Inventory inventory;
    
    @Column(nullable = false)
    private Integer quantity;
}
