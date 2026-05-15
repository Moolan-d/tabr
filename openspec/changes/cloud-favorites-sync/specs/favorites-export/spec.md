## ADDED Requirements

### Requirement: Export favorites as JSON
The system SHALL allow users to download their favorites as a JSON file from the Settings menu.

#### Scenario: User clicks export
- **WHEN** user clicks "Export Favorites" in Settings
- **THEN** a JSON file named `tabr_favorites_<date>.json` is downloaded containing all current favorites

### Requirement: Import favorites from JSON
The system SHALL allow users to import favorites from a JSON file via the Settings menu. Imported favorites are merged with existing favorites by URL (union).

#### Scenario: Valid JSON file imported
- **WHEN** user selects a valid `tabr_favorites.json` file
- **THEN** favorites from the file are merged with existing favorites by URL
- **AND** a confirmation message shows how many new favorites were added

#### Scenario: Invalid file imported
- **WHEN** user selects a file that is not valid JSON or has wrong schema
- **THEN** an error message is shown and no existing data is modified

### Requirement: Export available when Drive is denied
The export/import feature SHALL always be available regardless of Drive sync status. When Drive permission is denied, the Settings menu SHALL show a prompt recommending the user export their favorites.

#### Scenario: Drive denied, user opens Settings
- **WHEN** Drive permission is denied and user opens Settings
- **THEN** a visible prompt recommends exporting favorites as backup
