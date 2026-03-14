package kz.pmproject.model.user.data;

import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;

import java.util.Collection;
import java.util.Set;
import java.util.stream.Collectors;

public class TokenPrincipal implements UserDetails {
    private final String username;
    private final Long userId;
    private final Set<String> permissions;

    public TokenPrincipal(String username, Long userId, Set<String> permissions) {
        this.username = username;
        this.userId = userId;
        this.permissions = permissions;
    }

    @Override
    public Collection<? extends GrantedAuthority> getAuthorities() {
        return permissions.stream()
                .map(p -> new SimpleGrantedAuthority("PERMISSION_" + p))
                .collect(Collectors.toList());
    }

    @Override public String getPassword() { return null; }
    @Override public String getUsername() { return username; }
    @Override public boolean isAccountNonExpired() { return true; }
    @Override public boolean isAccountNonLocked() { return true; }
    @Override public boolean isCredentialsNonExpired() { return true; }
    @Override public boolean isEnabled() { return true; }

    public Set<String> getPermissions() { return permissions; }
    public Long getUserId() { return userId; }
}