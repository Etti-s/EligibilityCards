using EligibilityCards.Domain.Entities;
using EligibilityCards.Domain.Enums;

namespace EligibilityCards.Application.Services;

public static class UserPermissions
{
    public static bool CanCreate(UserRole actorRole, UserRole targetRole)
    {
        if (actorRole == UserRole.Admin)
        {
            return true;
        }

        if (actorRole == UserRole.BranchManager)
        {
            return targetRole == UserRole.Clerk;
        }

        return false;
    }

    public static bool CanEdit(UserRole actorRole, int actorId, User target)
    {
        if (actorRole == UserRole.Admin)
        {
            return true;
        }

        if (actorRole == UserRole.BranchManager)
        {
            return target.Id == actorId || target.Role == UserRole.Clerk;
        }

        return false;
    }

    public static bool CanToggleStatus(UserRole actorRole, int actorId, User target)
    {
        if (actorRole == UserRole.Admin)
        {
            return true;
        }

        if (actorRole == UserRole.BranchManager)
        {
            return target.Id == actorId || target.Role == UserRole.Clerk;
        }

        return false;
    }

    public static bool CanResetPassword(UserRole actorRole, int actorId, User target)
    {
        if (actorRole == UserRole.Admin)
        {
            return true;
        }

        if (actorRole == UserRole.BranchManager)
        {
            return target.Id == actorId || target.Role == UserRole.Clerk;
        }

        return false;
    }
}
