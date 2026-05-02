package kz.pmproject.service;

import kz.pmproject.model.market.dto.BookingRequest;
import kz.pmproject.model.market.dto.BookingResponse;
import kz.pmproject.model.market.entity.Booking;
import kz.pmproject.model.market.entity.Booking.BookingStatus;
import kz.pmproject.model.market.entity.Item;
import kz.pmproject.model.user.entity.User;
import kz.pmproject.repository.BookingRepository;
import kz.pmproject.repository.ItemRepository;
import kz.pmproject.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.Map;
import java.util.function.Function;

import static java.util.stream.Collectors.toMap;

@Service
@RequiredArgsConstructor
public class BookingService {

    private static final List<BookingStatus> OVERLAP_EXCLUDED = List.of(
            BookingStatus.REJECTED, BookingStatus.CANCELLED
    );

    private final BookingRepository bookingRepository;
    private final ItemRepository itemRepository;
    private final UserRepository userRepository;

    @Transactional
    public BookingResponse create(Long renterId, BookingRequest req) {
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
                .renterNote(normalizeNote(req.getRenterNote()))
                .build();

        return toResponse(bookingRepository.save(booking), item, null, item.getOwner());
    }

    @Transactional(readOnly = true)
    public List<BookingResponse> list(Long userId, String role, BookingStatus status) {
        boolean isOwner = "owner".equalsIgnoreCase(role);
        List<Booking> bookings = status != null
                ? (isOwner
                    ? bookingRepository.findByOwnerIdAndStatusOrderByCreatedAtDesc(userId, status)
                    : bookingRepository.findByRenterIdAndStatusOrderByCreatedAtDesc(userId, status))
                : (isOwner
                ? bookingRepository.findByOwnerIdOrderByCreatedAtDesc(userId)
                : bookingRepository.findByRenterIdOrderByCreatedAtDesc(userId));

        return toResponses(bookings);
    }

    @Transactional(readOnly = true)
    public BookingResponse getOne(Long id, Long userId) {
        Booking booking = findOrThrow(id);
        checkAccess(booking, userId);
        return toResponses(List.of(booking)).getFirst();
    }

    @Transactional
    public BookingResponse approve(Long id, Long ownerId) {
        Booking booking = findOrThrow(id);
        checkOwner(booking, ownerId);
        requireStatus(booking, BookingStatus.PENDING);
        booking.setStatus(BookingStatus.APPROVED);
        return toResponses(List.of(bookingRepository.save(booking))).getFirst();
    }

    @Transactional
    public BookingResponse reject(Long id, Long ownerId) {
        Booking booking = findOrThrow(id);
        checkOwner(booking, ownerId);
        requireStatus(booking, BookingStatus.PENDING);
        booking.setStatus(BookingStatus.REJECTED);
        return toResponses(List.of(bookingRepository.save(booking))).getFirst();
    }

    @Transactional
    public BookingResponse handover(Long id, Long ownerId) {
        Booking booking = findOrThrow(id);
        checkOwner(booking, ownerId);
        requireStatus(booking, BookingStatus.APPROVED);
        if (LocalDate.now().isBefore(booking.getDateFrom())) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "You cannot hand over the item before the booking start date");
        }
        booking.setStatus(BookingStatus.ACTIVE);
        return toResponses(List.of(bookingRepository.save(booking))).getFirst();
    }

    @Transactional
    public BookingResponse returnItem(Long id, Long actorId) {
        Booking booking = findOrThrow(id);
        checkAccess(booking, actorId);
        requireStatus(booking, BookingStatus.ACTIVE);
        booking.setStatus(BookingStatus.COMPLETED);
        return toResponses(List.of(bookingRepository.save(booking))).getFirst();
    }

    @Transactional
    public BookingResponse cancel(Long id, Long actorId) {
        Booking booking = findOrThrow(id);
        checkAccess(booking, actorId);

        if (!List.of(BookingStatus.PENDING, BookingStatus.APPROVED, BookingStatus.ACTIVE).contains(booking.getStatus()))
            throw new ResponseStatusException(HttpStatus.CONFLICT,
                    "Cannot cancel booking with status " + booking.getStatus());

        booking.setStatus(BookingStatus.CANCELLED);
        return toResponses(List.of(bookingRepository.save(booking))).getFirst();
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

    private String normalizeNote(String renterNote) {
        if (renterNote == null) {
            return null;
        }
        String trimmed = renterNote.trim();
        return trimmed.isEmpty() ? null : trimmed;
    }

    private List<BookingResponse> toResponses(List<Booking> bookings) {
        Map<Long, Item> itemsById = itemRepository.findAllById(
                bookings.stream().map(Booking::getItemId).distinct().toList()
        ).stream().collect(toMap(Item::getId, Function.identity()));

        Map<Long, User> usersById = userRepository.findAllById(
                bookings.stream()
                        .flatMap(booking -> java.util.stream.Stream.of(booking.getRenterId(), booking.getOwnerId()))
                        .distinct()
                        .toList()
        ).stream().collect(toMap(User::getId, Function.identity()));

        return bookings.stream()
                .map(booking -> toResponse(
                        booking,
                        itemsById.get(booking.getItemId()),
                        usersById.get(booking.getRenterId()),
                        usersById.get(booking.getOwnerId())
                ))
                .toList();
    }

    private BookingResponse toResponse(Booking booking, Item item, User renter, User owner) {
        return BookingResponse.builder()
                .id(booking.getId())
                .itemId(booking.getItemId())
                .itemTitle(item == null ? null : item.getTitle())
                .renterId(booking.getRenterId())
                .renterUsername(renter == null ? null : renter.getUsername())
                .ownerId(booking.getOwnerId())
                .ownerUsername(owner == null ? null : owner.getUsername())
                .dateFrom(booking.getDateFrom())
                .dateTo(booking.getDateTo())
                .status(booking.getStatus())
                .totalPrice(booking.getTotalPrice())
                .renterNote(booking.getRenterNote())
                .createdAt(booking.getCreatedAt())
                .updatedAt(booking.getUpdatedAt())
                .build();
    }
}
