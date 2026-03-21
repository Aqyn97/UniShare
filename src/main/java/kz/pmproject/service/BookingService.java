package kz.pmproject.service;

import kz.pmproject.model.market.dto.BookingRequest;
import kz.pmproject.model.market.entity.Booking;
import kz.pmproject.model.market.entity.Booking.BookingStatus;
import kz.pmproject.model.market.entity.Item;
import kz.pmproject.repository.BookingRepository;
import kz.pmproject.repository.ItemRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.time.temporal.ChronoUnit;
import java.util.List;

@Service
@RequiredArgsConstructor
public class BookingService {

    private static final List<BookingStatus> OVERLAP_EXCLUDED = List.of(
            BookingStatus.REJECTED, BookingStatus.CANCELLED
    );

    private final BookingRepository bookingRepository;
    private final ItemRepository itemRepository;

    @Transactional
    public Booking create(Long renterId, BookingRequest req) {
        if (!req.getDateFrom().isBefore(req.getDateTo()))
            throw new ResponseStatusException(HttpStatus.UNPROCESSABLE_ENTITY, "date_from must be before date_to");

        Item item = itemRepository.findById(req.getItemId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Item not found"));

        if (!item.isPublished())
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Item is not available");

        boolean overlap = bookingRepository
                .existsByItemIdAndStatusNotInAndDateFromLessThanEqualAndDateToGreaterThanEqual(
                        req.getItemId(), OVERLAP_EXCLUDED, req.getDateTo(), req.getDateFrom()
                );
        if (overlap)
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Selected dates are already booked");

        long days = ChronoUnit.DAYS.between(req.getDateFrom(), req.getDateTo());
        BigDecimal total = item.getPrice().multiply(BigDecimal.valueOf(days));

        Booking booking = Booking.builder()
                .itemId(req.getItemId())
                .renterId(renterId)
                .ownerId(item.getOwner().getId())
                .dateFrom(req.getDateFrom())
                .dateTo(req.getDateTo())
                .totalPrice(total)
                .build();

        return bookingRepository.save(booking);
    }

    @Transactional(readOnly = true)
    public List<Booking> list(Long userId, String role, BookingStatus status) {
        boolean isOwner = "owner".equalsIgnoreCase(role);
        if (status != null)
            return isOwner
                    ? bookingRepository.findByOwnerIdAndStatusOrderByCreatedAtDesc(userId, status)
                    : bookingRepository.findByRenterIdAndStatusOrderByCreatedAtDesc(userId, status);
        return isOwner
                ? bookingRepository.findByOwnerIdOrderByCreatedAtDesc(userId)
                : bookingRepository.findByRenterIdOrderByCreatedAtDesc(userId);
    }

    @Transactional(readOnly = true)
    public Booking getOne(Long id, Long userId) {
        Booking booking = findOrThrow(id);
        checkAccess(booking, userId);
        return booking;
    }

    @Transactional
    public Booking approve(Long id, Long ownerId) {
        Booking booking = findOrThrow(id);
        checkOwner(booking, ownerId);
        requireStatus(booking, BookingStatus.PENDING);
        booking.setStatus(BookingStatus.APPROVED);
        return bookingRepository.save(booking);
    }

    @Transactional
    public Booking reject(Long id, Long ownerId) {
        Booking booking = findOrThrow(id);
        checkOwner(booking, ownerId);
        requireStatus(booking, BookingStatus.PENDING);
        booking.setStatus(BookingStatus.REJECTED);
        return bookingRepository.save(booking);
    }

    @Transactional
    public Booking handover(Long id, Long ownerId) {
        Booking booking = findOrThrow(id);
        checkOwner(booking, ownerId);
        requireStatus(booking, BookingStatus.APPROVED);
        booking.setStatus(BookingStatus.ACTIVE);
        return bookingRepository.save(booking);
    }

    @Transactional
    public Booking returnItem(Long id, Long ownerId) {
        Booking booking = findOrThrow(id);
        checkOwner(booking, ownerId);
        requireStatus(booking, BookingStatus.ACTIVE);
        booking.setStatus(BookingStatus.COMPLETED);
        return bookingRepository.save(booking);
    }

    @Transactional
    public Booking cancel(Long id, Long actorId) {
        Booking booking = findOrThrow(id);
        checkAccess(booking, actorId);

        if (!List.of(BookingStatus.PENDING, BookingStatus.APPROVED, BookingStatus.ACTIVE).contains(booking.getStatus()))
            throw new ResponseStatusException(HttpStatus.CONFLICT,
                    "Cannot cancel booking with status " + booking.getStatus());

        booking.setStatus(BookingStatus.CANCELLED);
        return bookingRepository.save(booking);
    }

    private Booking findOrThrow(Long id) {
        return bookingRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Booking not found"));
    }

    private void checkOwner(Booking b, Long userId) {
        if (!b.getOwnerId().equals(userId))
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Forbidden");
    }

    private void checkAccess(Booking b, Long userId) {
        if (!b.getOwnerId().equals(userId) && !b.getRenterId().equals(userId))
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Forbidden");
    }

    private void requireStatus(Booking b, BookingStatus required) {
        if (b.getStatus() != required)
            throw new ResponseStatusException(HttpStatus.CONFLICT,
                    "Required status " + required + ", current is " + b.getStatus());
    }
}