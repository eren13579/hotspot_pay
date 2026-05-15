package com.hotspotpay.payment.model;

import com.hotspotpay.users.model.User;
import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "user_withdrawals")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UserWithdrawal {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", referencedColumnName = "userId", nullable = false)
    private User user;

    @Column(nullable = false, precision = 15, scale = 2)
    private BigDecimal amount;

    @Column(nullable = false)
    private LocalDateTime withdrawnAt;

    @Column(length = 500)
    private String description;
}