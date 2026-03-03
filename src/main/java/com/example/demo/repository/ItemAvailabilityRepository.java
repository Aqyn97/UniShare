package com.example.demo.repository;
import com.example.demo.model.ItemAvailabilityBlock;
import org.springframework.data.jpa.repository.JpaRepository;
public interface ItemAvailabilityRepository extends JpaRepository<ItemAvailabilityBlock, Long> {}