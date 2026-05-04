-- Script: 02-create-eligibles-table.sql
-- Date: 2026-05-03
-- Description: יצירת טבלת זכאים (Eligibles) - ניהול זכאים וכרטיסי זכאות

IF NOT EXISTS (
    SELECT * FROM INFORMATION_SCHEMA.TABLES
    WHERE TABLE_NAME = 'Eligibles'
)
BEGIN
    CREATE TABLE Eligibles (
        Id INT IDENTITY(1,1) NOT NULL CONSTRAINT PK_Eligibles PRIMARY KEY,
        FirstName NVARCHAR(100) NOT NULL,
        LastName NVARCHAR(100) NOT NULL,
        Phone NVARCHAR(20) NULL,
        Email NVARCHAR(150) NULL,
        IdNumber NVARCHAR(20) NOT NULL,
        Address NVARCHAR(250) NULL,
        NumberOfPersons INT NOT NULL,
        CardNumber NVARCHAR(50) NULL,
        CreatedAt DATETIME2 NOT NULL,
        UpdatedAt DATETIME2 NULL,
        CreatedByUserId INT NULL,
        UpdatedByUserId INT NULL
    );
END
GO

IF NOT EXISTS (
    SELECT * FROM sys.indexes
    WHERE name = 'IX_Eligibles_IdNumber' AND object_id = OBJECT_ID('Eligibles')
)
BEGIN
    CREATE UNIQUE INDEX IX_Eligibles_IdNumber ON Eligibles(IdNumber);
END
GO

IF NOT EXISTS (
    SELECT * FROM sys.indexes
    WHERE name = 'IX_Eligibles_CardNumber' AND object_id = OBJECT_ID('Eligibles')
)
BEGIN
    CREATE INDEX IX_Eligibles_CardNumber ON Eligibles(CardNumber);
END
GO
