package kz.pmproject.repository;

import kz.pmproject.model.market.entity.Booking;
import kz.pmproject.model.market.entity.Booking.BookingStatus;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDate;
import java.util.List;

public interface BookingRepository extends JpaRepository<Booking, Long> {

    List<Booking> findByRenterIdOrderByCreatedAtDesc(Long renterId);
    List<Booking> findByRenterIdAndStatusOrderByCreatedAtDesc(Long renterId, BookingStatus status);
    List<Booking> findByOwnerIdOrderByCreatedAtDesc(Long ownerId);
    List<Booking> findByOwnerIdAndStatusOrderByCreatedAtDesc(Long ownerId, BookingStatus status);

    boolean existsByItemIdAndStatusNotInAndDateFromLessThanEqualAndDateToGreaterThanEqual(
            Long itemId,
            List<BookingStatus> statuses,
            LocalDate dateTo,
            LocalDate dateFrom
    );

    long countBy();
}