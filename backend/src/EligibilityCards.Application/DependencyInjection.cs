using EligibilityCards.Application.Interfaces;
using EligibilityCards.Application.Services;
using Microsoft.Extensions.DependencyInjection;

namespace EligibilityCards.Application;

public static class DependencyInjection
{
    public static IServiceCollection AddApplication(this IServiceCollection services)
    {
        services.AddScoped<IAuthService, AuthService>();
        services.AddScoped<IUserService, UserService>();
        services.AddScoped<IEligibleService, EligibleService>();
        services.AddScoped<IEligibilityCheckService, EligibilityCheckService>();
        return services;
    }
}
