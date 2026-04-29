-- Script: 01-create-first-admin.sql
-- Date: 2026-04-29
-- Description: יצירת משתמש אדמין ראשון במערכת
-- הסקריפט מיועד להרצה ידנית ב-SQL Server Management Studio
-- הסיסמה נשמרת כטקסט גולמי (ללא הצפנה) בהתאם לדרישת המערכת

IF NOT EXISTS (
    SELECT 1 FROM Users WHERE Email = 'admin@city.gov.il'
)
BEGIN
    INSERT INTO Users (FullName, Email, Phone, Password, Role, IsActive, CreatedAt)
    VALUES (
        N'מנהל מערכת',
        'admin@city.gov.il',
        '0500000000',
        'Admin@123',
        1,
        1,
        CAST(SYSDATETIMEOFFSET() AT TIME ZONE 'Israel Standard Time' AS DATETIME2)
    );
END
GO
