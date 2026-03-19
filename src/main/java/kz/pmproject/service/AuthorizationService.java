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

    public boolean isAdmin() {
        return hasRole(PermissionDic.MANAGE_SYSTEM.name()) || hasRole(PermissionDic.MANAGE_CONTENT.name());
    }

    public boolean canManageCategories() {
        return isAdmin();
    }

    public boolean canModifyItemOwnerId(Long ownerId) {
        if (ownerId == null) return false;
        return isAdmin() || ownerId.equals(getCurrentUserId());
    }

    public Long getCurrentUserId() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !auth.isAuthenticated()) {
            return null;
        }
        Object principal = auth.getPrincipal();
        if (!(principal instanceof TokenPrincipal tp)) {
            return null;
        }
        return tp.getUserId();
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
