using ClosedXML.Excel;
using EligibilityCards.Application.Common.Exceptions;
using EligibilityCards.Application.DTOs.Eligibles;
using EligibilityCards.Application.Interfaces;
using EligibilityCards.Domain.Entities;
using EligibilityCards.Domain.Enums;

namespace EligibilityCards.Application.Services;

public class EligibleService : IEligibleService
{
    private static readonly string[] TemplateHeaders = new[]
    {
        "שם פרטי",
        "שם משפחה",
        "טלפון",
        "אימייל",
        "תעודת זהות",
        "כתובת",
        "מספר נפשות"
    };

    private readonly IEligibleRepository _repository;
    private readonly ICurrentUserService _currentUser;

    public EligibleService(IEligibleRepository repository, ICurrentUserService currentUser)
    {
        _repository = repository;
        _currentUser = currentUser;
    }

    public async Task<List<EligibleListDto>> GetAllAsync(EligibleFilterDto filter, CancellationToken cancellationToken = default)
    {
        RequireRoleForRead();
        var items = await _repository.GetFilteredAsync(filter, cancellationToken);
        return items.Select(MapToDto).ToList();
    }

    public async Task<List<int>> GetDistinctNumberOfPersonsAsync(CancellationToken cancellationToken = default)
    {
        RequireRoleForRead();
        return await _repository.GetDistinctNumberOfPersonsAsync(cancellationToken);
    }

    public async Task<EligibleListDto> CreateAsync(CreateEligibleDto dto, CancellationToken cancellationToken = default)
    {
        RequireAdmin();

        ValidateRequiredFields(dto.IdNumber, dto.NumberOfPersons);

        var idNumber = dto.IdNumber.Trim();
        if (await _repository.IdNumberExistsAsync(idNumber, null, cancellationToken))
        {
            throw new ConflictException("תעודת הזהות כבר קיימת במערכת");
        }

        var entity = new Eligible
        {
            FirstName = (dto.FirstName ?? string.Empty).Trim(),
            LastName = (dto.LastName ?? string.Empty).Trim(),
            Phone = NormalizeOptional(dto.Phone),
            Email = NormalizeOptional(dto.Email),
            IdNumber = idNumber,
            Address = NormalizeOptional(dto.Address),
            NumberOfPersons = dto.NumberOfPersons,
            CardNumber = null
        };

        await _repository.AddAsync(entity, cancellationToken);
        await _repository.SaveChangesAsync(cancellationToken);

        return MapToDto(entity);
    }

    public async Task<EligibleListDto> UpdateAsync(int id, UpdateEligibleDto dto, CancellationToken cancellationToken = default)
    {
        RequireAdmin();

        var entity = await _repository.GetByIdAsync(id, cancellationToken)
            ?? throw new NotFoundException("הזכאי לא נמצא");

        ValidateRequiredFields(dto.IdNumber, dto.NumberOfPersons);

        var cardNumber = NormalizeOptional(dto.CardNumber);
        if (cardNumber != null && !IsAllDigits(cardNumber))
        {
            throw new ValidationException("מספר כרטיס חייב להכיל ספרות בלבד");
        }

        var idNumber = dto.IdNumber.Trim();
        if (await _repository.IdNumberExistsAsync(idNumber, id, cancellationToken))
        {
            throw new ConflictException("תעודת הזהות כבר קיימת במערכת");
        }

        entity.FirstName = (dto.FirstName ?? string.Empty).Trim();
        entity.LastName = (dto.LastName ?? string.Empty).Trim();
        entity.Phone = NormalizeOptional(dto.Phone);
        entity.Email = NormalizeOptional(dto.Email);
        entity.IdNumber = idNumber;
        entity.Address = NormalizeOptional(dto.Address);
        entity.NumberOfPersons = dto.NumberOfPersons;
        entity.CardNumber = cardNumber;

        _repository.Update(entity);
        await _repository.SaveChangesAsync(cancellationToken);

        return MapToDto(entity);
    }

    public async Task DeleteAsync(int id, CancellationToken cancellationToken = default)
    {
        RequireAdmin();

        var entity = await _repository.GetByIdAsync(id, cancellationToken)
            ?? throw new NotFoundException("הזכאי לא נמצא");

        if (!string.IsNullOrWhiteSpace(entity.CardNumber))
        {
            throw new ValidationException("לא ניתן למחוק זכאי שהוקצה לו כרטיס. יש לבטל את הכרטיס תחילה");
        }

        _repository.Remove(entity);
        await _repository.SaveChangesAsync(cancellationToken);
    }

    public async Task<ImportResultDto> ImportAsync(Stream excelStream, CancellationToken cancellationToken = default)
    {
        RequireAdmin();

        var result = new ImportResultDto();
        var rows = new List<(int RowNumber, CreateEligibleDto Dto)>();

        using (var workbook = new XLWorkbook(excelStream))
        {
            var sheet = workbook.Worksheets.FirstOrDefault();
            if (sheet == null)
            {
                throw new ValidationException("קובץ ה-Excel ריק");
            }

            var lastRow = sheet.LastRowUsed()?.RowNumber() ?? 1;
            for (var rowNumber = 2; rowNumber <= lastRow; rowNumber++)
            {
                var row = sheet.Row(rowNumber);
                if (row.IsEmpty())
                {
                    continue;
                }

                var firstName = GetCell(row, 1);
                var lastName = GetCell(row, 2);
                var phone = GetCell(row, 3);
                var email = GetCell(row, 4);
                var idNumber = GetCell(row, 5);
                var address = GetCell(row, 6);
                var personsRaw = GetCell(row, 7);

                var dto = new CreateEligibleDto
                {
                    FirstName = firstName,
                    LastName = lastName,
                    Phone = phone,
                    Email = email,
                    IdNumber = idNumber,
                    Address = address
                };

                if (string.IsNullOrWhiteSpace(idNumber))
                {
                    result.Errors.Add(new ImportRowErrorDto
                    {
                        RowNumber = rowNumber,
                        Error = "שדה חובה: תעודת זהות"
                    });
                }
                else if (!IsValidIdNumber(idNumber))
                {
                    result.Errors.Add(new ImportRowErrorDto
                    {
                        RowNumber = rowNumber,
                        Error = $"תעודת זהות '{idNumber}' אינה תקינה - חייבת להכיל 9 ספרות"
                    });
                }

                if (string.IsNullOrWhiteSpace(personsRaw))
                {
                    result.Errors.Add(new ImportRowErrorDto
                    {
                        RowNumber = rowNumber,
                        Error = "שדה חובה: מספר נפשות"
                    });
                }
                else if (!int.TryParse(personsRaw, out var persons) || persons <= 0)
                {
                    result.Errors.Add(new ImportRowErrorDto
                    {
                        RowNumber = rowNumber,
                        Error = "מספר נפשות חייב להיות מספר חיובי"
                    });
                }
                else
                {
                    dto.NumberOfPersons = persons;
                }

                rows.Add((rowNumber, dto));
            }
        }

        var idGroups = rows
            .Where(r => !string.IsNullOrWhiteSpace(r.Dto.IdNumber))
            .GroupBy(r => r.Dto.IdNumber.Trim())
            .Where(g => g.Count() > 1);

        foreach (var group in idGroups)
        {
            var rowList = string.Join(", ", group.Select(g => g.RowNumber));
            result.Errors.Add(new ImportRowErrorDto
            {
                RowNumber = group.First().RowNumber,
                Error = $"תעודת זהות {group.Key} מופיעה יותר מפעם אחת בקובץ (שורות: {rowList})"
            });
        }

        var idNumbers = rows
            .Where(r => !string.IsNullOrWhiteSpace(r.Dto.IdNumber))
            .Select(r => r.Dto.IdNumber.Trim())
            .Distinct()
            .ToList();

        var existing = await _repository.GetExistingIdNumbersAsync(idNumbers, cancellationToken);
        foreach (var row in rows)
        {
            var idNumber = (row.Dto.IdNumber ?? string.Empty).Trim();
            if (!string.IsNullOrEmpty(idNumber) && existing.Contains(idNumber))
            {
                result.Errors.Add(new ImportRowErrorDto
                {
                    RowNumber = row.RowNumber,
                    Error = $"תעודת זהות {idNumber} כבר קיימת במערכת"
                });
            }
        }

        if (rows.Count == 0)
        {
            result.Errors.Add(new ImportRowErrorDto
            {
                RowNumber = 0,
                Error = "הקובץ אינו מכיל שורות נתונים"
            });
        }

        if (result.Errors.Count > 0)
        {
            result.Success = false;
            return result;
        }

        var entities = rows.Select(r => new Eligible
        {
            FirstName = (r.Dto.FirstName ?? string.Empty).Trim(),
            LastName = (r.Dto.LastName ?? string.Empty).Trim(),
            Phone = NormalizeOptional(r.Dto.Phone),
            Email = NormalizeOptional(r.Dto.Email),
            IdNumber = r.Dto.IdNumber.Trim(),
            Address = NormalizeOptional(r.Dto.Address),
            NumberOfPersons = r.Dto.NumberOfPersons,
            CardNumber = null
        }).ToList();

        await _repository.AddRangeAsync(entities, cancellationToken);
        await _repository.SaveChangesAsync(cancellationToken);

        result.Success = true;
        result.ImportedCount = entities.Count;
        return result;
    }

    public byte[] GenerateImportTemplate()
    {
        RequireAdmin();

        using var workbook = new XLWorkbook();
        var sheet = workbook.Worksheets.Add("זכאים");
        sheet.RightToLeft = true;

        for (var i = 0; i < TemplateHeaders.Length; i++)
        {
            var cell = sheet.Cell(1, i + 1);
            cell.Value = TemplateHeaders[i];
            cell.Style.Font.Bold = true;
            cell.Style.Fill.BackgroundColor = XLColor.LightGray;
            cell.Style.Alignment.Horizontal = XLAlignmentHorizontalValues.Center;
        }

        // עמודת תעודת זהות (5) - טקסט, כדי לשמור אפסים מובילים
        sheet.Column(5).Style.NumberFormat.Format = "@";
        // עמודת טלפון (3) - טקסט
        sheet.Column(3).Style.NumberFormat.Format = "@";

        sheet.Columns().AdjustToContents();

        using var stream = new MemoryStream();
        workbook.SaveAs(stream);
        return stream.ToArray();
    }

    private static EligibleListDto MapToDto(Eligible entity)
    {
        return new EligibleListDto
        {
            Id = entity.Id,
            FirstName = entity.FirstName,
            LastName = entity.LastName,
            Phone = entity.Phone,
            Email = entity.Email,
            IdNumber = entity.IdNumber,
            Address = entity.Address,
            NumberOfPersons = entity.NumberOfPersons,
            CardNumber = entity.CardNumber
        };
    }

    private static string? NormalizeOptional(string? value)
    {
        return string.IsNullOrWhiteSpace(value) ? null : value.Trim();
    }

    private static void ValidateRequiredFields(string idNumber, int numberOfPersons)
    {
        if (string.IsNullOrWhiteSpace(idNumber))
        {
            throw new ValidationException("שדה חובה: תעודת זהות");
        }

        var trimmed = idNumber.Trim();
        if (!IsValidIdNumber(trimmed))
        {
            throw new ValidationException("תעודת זהות חייבת להכיל 9 ספרות");
        }

        if (numberOfPersons <= 0)
        {
            throw new ValidationException("שדה חובה: מספר נפשות חייב להיות מספר חיובי");
        }
    }

    private static bool IsValidIdNumber(string value)
    {
        if (value.Length != 9)
        {
            return false;
        }

        return IsAllDigits(value);
    }

    private static bool IsAllDigits(string value)
    {
        if (value.Length == 0)
        {
            return false;
        }

        foreach (var c in value)
        {
            if (c < '0' || c > '9')
            {
                return false;
            }
        }

        return true;
    }

    private static string GetCell(IXLRow row, int columnIndex)
    {
        var cell = row.Cell(columnIndex);
        if (cell == null || cell.IsEmpty())
        {
            return string.Empty;
        }

        return cell.GetString().Trim();
    }

    private void RequireAdmin()
    {
        var role = _currentUser.Role
            ?? throw new UnauthorizedException("המשתמש אינו מחובר");

        if (role != UserRole.Admin)
        {
            throw new ForbiddenException("אין הרשאה לפעולה זו");
        }
    }

    private void RequireRoleForRead()
    {
        var role = _currentUser.Role
            ?? throw new UnauthorizedException("המשתמש אינו מחובר");

        if (role != UserRole.Admin && role != UserRole.BranchManager)
        {
            throw new ForbiddenException("אין הרשאה לצפייה ברשימת הזכאים");
        }
    }
}
