## Exam Import Functionality

The application supports importing exams from external files via the admin interface.

### Supported File Formats

**JSON Format** (`application/json`):
- Direct import of exam data structure
- Must match the `IExam` interface schema
- See `templates/import_template_json.json` for the complete structure

**Text Format** (`text/plain`):
- Human-readable format for easy manual creation
- See `templates/import_template_txt.txt` for syntax examples

### Text Format Syntax

```
Q: <question type hint> P: <points>
<question text>
[X] (a) Correct answer
[ ] (b) Incorrect answer

# Assignment questions use:
A: Option1 | Option2 | Option3
[X] [ ] [ ] (a) Answer assigned to Option1
[ ] [X] [ ] (b) Answer assigned to Option2
```

**Prefixes:**
- `Q:` - Question header (required), followed by `P:` for points
- `A:` - Assignment options header (pipe-separated options)
- `[X]` - Correct/selected answer
- `[ ]` - Incorrect/unselected answer

### Question Types

The importer automatically determines question type:
- **SINGLE_CHOICE**: One correct answer marked with `[X]`
- **MULTIPLE_CHOICE**: Multiple correct answers marked with `[X]`
- **ASSIGNMENT**: Uses `A:` header with option columns

### Import Flow

1. Files are uploaded via the admin import page (`/admin/exams/import`)
2. `ExamImportService` processes files based on MIME type
3. Exams are validated against backend rules
4. Valid exams are saved to the database
5. Invalid exams are cached for manual correction

### Templates

Located in `/templates/`:
- `import_template_json.json` - JSON import structure example
- `import_template_txt.txt` - Text format syntax example
