package com.example.demo.service;

import com.example.demo.model.Category;
import com.example.demo.model.Item;
import com.example.demo.model.User;
import com.example.demo.repository.CategoryRepository;
import com.example.demo.repository.ItemRepository;
import com.example.demo.repository.UserRepository;
import org.springframework.stereotype.Service;
import java.util.List;


@Service
public class ItemService {
    private final ItemRepository itemRepository;
    private final UserRepository userRepository;
    private final CategoryRepository categoryRepository;

    public ItemService(ItemRepository itemRepository, UserRepository userRepository, CategoryRepository categoryRepository) {
        this.itemRepository = itemRepository;
        this.userRepository = userRepository;
        this.categoryRepository = categoryRepository;
    }

    public List<Item> getAllItems() {
        return itemRepository.findAll();
    }

    public Item createItem(Item item) {

        User owner = userRepository.findById(item.getOwner().getId())
                .orElseThrow(() -> new RuntimeException("User not found"));

        Category category = categoryRepository.findById(item.getCategory().getId())
                .orElseThrow(() -> new RuntimeException("Category not found"));

        item.setOwner(owner);
        item.setCategory(category);

        return itemRepository.save(item);
    }
    public List<Item> searchItems(Long categoryId, String keyword) {
        // If keyword is null, make it an empty string so the query doesn't break
        String searchKeyword = (keyword == null) ? "" : keyword;
        return itemRepository.searchItems(categoryId, searchKeyword);
    }
    public Item getItemById(Long id) {
        return itemRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Item not found with id: " + id));
    }

}