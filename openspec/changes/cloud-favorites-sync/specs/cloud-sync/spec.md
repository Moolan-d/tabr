## ADDED Requirements

### Requirement: Google Drive sync available detection
The system SHALL check Drive availability on extension load by calling `chrome.identity.getAuthToken`. If the token is obtained successfully, Drive sync is enabled. If the user denies permission, sync is disabled and the system falls back to local-only.

#### Scenario: Drive permission granted
- **WHEN** user has not denied Drive permission and `chrome.identity.getAuthToken` succeeds
- **THEN** `GoogleDriveProvider.isAvailable()` returns `true`

#### Scenario: Drive permission denied
- **WHEN** user denies Drive permission or `chrome.identity.getAuthToken` fails
- **THEN** `GoogleDriveProvider.isAvailable()` returns `false` and the system operates local-only

### Requirement: Favorites pushed to Drive after local write
When a favorite is added or removed, the system SHALL write to `chrome.storage.local` immediately, then debounce-push the full favorites list to Drive after 5 seconds of inactivity.

#### Scenario: Single favorite added
- **WHEN** user adds a favorite
- **THEN** favorite is written to local storage immediately
- **AND** after 5 seconds with no further changes, full favorites JSON is pushed to Drive

#### Scenario: Rapid multiple additions
- **WHEN** user adds 3 favorites within 5 seconds
- **THEN** local storage is updated 3 times
- **AND** only one Drive push occurs (after the last change + 5s idle)

### Requirement: Favorites merged on extension load
On extension load, the system SHALL pull favorites from Drive and merge with local favorites using union by URL. Any favorite present in either set is retained.

#### Scenario: Device A has favorites X,Y; Drive has X,Z
- **WHEN** extension loads on Device A
- **THEN** local favorites become X,Y,Z (union)
- **AND** merged set is pushed back to Drive

#### Scenario: Drive file missing or empty
- **WHEN** Drive pull returns null or empty
- **THEN** local favorites are pushed to Drive as the source of truth

#### Scenario: Drive pull fails (network error)
- **WHEN** Drive pull throws an error
- **THEN** the system continues with local favorites only, no data is lost

### Requirement: FavoritePhoto schema
`FavoritePhoto` SHALL contain exactly three fields: `url` (string), `photoName` (string), `source` (string).

#### Scenario: New favorite saved
- **WHEN** a user favorites a photo
- **THEN** the stored object contains only `url`, `photoName`, and `source`

### Requirement: Legacy data migration
On first load after upgrade, the system SHALL detect old-format favorites (objects with `savedAt` or `photographerLink` fields) and transform them to the new schema. Unknown fields are dropped. `photoName` defaults to `""` for migrated entries.

#### Scenario: Old favorites exist in storage
- **WHEN** extension loads and `tabr_favorites` contains objects with `savedAt` field
- **THEN** each object is transformed to `{ url, photoName: "", source }` and saved back

#### Scenario: Already migrated
- **WHEN** extension loads and favorites already match new schema
- **THEN** no migration occurs
