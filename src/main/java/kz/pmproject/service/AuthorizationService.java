package kz.pmproject.service;

import kz.pmproject.model.user.data.TokenPrincipal;
import kz.pmproject.model.user.enums.PermissionDic;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;

@Service("authorization")
public class AuthorizationService {

    public boolean hasAccessToReadUser() {
        return hasRole(PermissionDic.READ_USER.name());
    }

    public boolean hasAccessToWriteUser() {
        return hasRole(PermissionDic.CREATE_USER.name());
    }

    private boolean hasRole(String role) {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();

        if (auth == null || !auth.isAuthenticated()) {
            return false;
        }

        TokenPrincipal principal = (TokenPrincipal) auth.getPrincipal();
        return principal.getPermissions().contains(role);
    }
}
