namespace EligibilityCards.Domain.Common;

public static class DateTimeExtensions
{
    private static readonly TimeZoneInfo IsraelTimeZone =
        TimeZoneInfo.FindSystemTimeZoneById("Israel Standard Time");

    public static DateTime GetIsraelTime()
    {
        return TimeZoneInfo.ConvertTimeFromUtc(DateTime.UtcNow, IsraelTimeZone);
    }

    public static DateTime ConvertUtcToIsraelTime(this DateTime utcDateTime)
    {
        return TimeZoneInfo.ConvertTimeFromUtc(utcDateTime, IsraelTimeZone);
    }
}
