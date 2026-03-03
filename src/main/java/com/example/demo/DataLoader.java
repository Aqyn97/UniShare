package com.example.demo;

import com.example.demo.model.Category;
import com.example.demo.model.User;
import com.example.demo.repository.CategoryRepository;
import com.example.demo.repository.UserRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

@Component
public class DataLoader implements CommandLineRunner {

    private final CategoryRepository categoryRepository;
    private final UserRepository userRepository;

    public DataLoader(CategoryRepository categoryRepository, UserRepository userRepository) {
        this.categoryRepository = categoryRepository;
        this.userRepository = userRepository;
    }

    @Override
    public void run(String... args) throws Exception {
        if (userRepository.count() == 0) {
            userRepository.save(new User(null, "test@sdu.edu.kz", "Test", "Student"));
        }
        if (categoryRepository.count() == 0) {
            categoryRepository.save(new Category(null, "Electronics", "Gadgets and tools"));
            categoryRepository.save(new Category(null, "Textbooks", "Academic books"));
        }
        System.out.println("(NICENICE)Database populated with starter Users and Categories!");
    }
}