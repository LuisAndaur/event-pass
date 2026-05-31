package com.eventpass.reservation.infrastructure.persistence;

import com.eventpass.reservation.domain.Reservation;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ReservationRepository extends JpaRepository<Reservation, String> {
    List<Reservation> findByUserId(String userId);
    List<Reservation> findByUserIdAndStatus(String userId, Reservation.Status status);
    List<Reservation> findByStatus(Reservation.Status status);
}
