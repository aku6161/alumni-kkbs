/**
 * ==============================================================================
 * SISTEM SANDARAN AUTOMATIK CLOUD-TO-CLOUD (FIRESTORE -> GOOGLE DRIVE)
 * PERSATUAN ALUMNI KOLEJ KOMUNITI BEAUFORT SABAH (PAKKBS)
 * ==============================================================================
 * 
 * SUMBER (Database) : Firebase Firestore (Project ID: icamp-aa9e4)
 * DESTINASI (Drive) : Google Drive Folder ID: 1wGTh5vxZePNzv0hq2e51jkxuSXYVVear
 * JADUAL (Schedule) : Setiap hari Ahad, jam 2:00 Pagi
 * PENGEKALAN (Retention): 14 Hari (2 Minggu terkini sahaja, selebihnya dipadam automatik)
 * 
 * PANDUAN PENYEDIAAN:
 * 1. Buka https://script.google.com/ dan cipta projek baharu bernama "Alumni KKBS Firestore Backup".
 * 2. Salin dan tampal keseluruhan kod ini ke dalam fail Code.gs.
 * 3. Di Apps Script, buka Project Settings -> tandakan "Show 'appsscript.json' manifest file in editor".
 * 4. Tambahkan skop OAuth dalam appsscript.json (lihat panduan di bawah).
 * 5. Jalankan fungsi "backupFirestoreToDrive" untuk menguji sandaran serta-merta.
 * 6. Jalankan fungsi "setupWeeklySunday2AMTrigger" sekali untuk mengaktifkan jadual automatik setiap Ahad 2:00 AM.
 * ==============================================================================
 */

// KONFIGURASI UTAMA
const CONFIG = {
  FIREBASE_PROJECT_ID: 'icamp-aa9e4',
  DRIVE_FOLDER_ID: '1wGTh5vxZePNzv0hq2e51jkxuSXYVVear',
  RETENTION_DAYS: 14, // 2 minggu data terkini
  COLLECTIONS: [
    'alumni-members',
    'alumni-transactions',
    'alumni-programs',
    'alumni-config'
  ]
};

/**
 * Fungsi Utama: Menjalankan sandaran lengkap dari Firestore ke Google Drive
 * dan memadam fail sandaran melebihi 14 hari secara automatik.
 */
function backupFirestoreToDrive() {
  Logger.log('=== MEMULAKAN SANDARAN CLOUD-TO-CLOUD FIRESTORE KE GOOGLE DRIVE ===');
  const startTime = new Date();
  
  try {
    const folder = DriveApp.getFolderById(CONFIG.DRIVE_FOLDER_ID);
    if (!folder) {
      throw new Error(`Folder Google Drive dengan ID "${CONFIG.DRIVE_FOLDER_ID}" tidak dijumpai.`);
    }

    const backupData = {
      system: 'PERSATUAN ALUMNI KOLEJ KOMUNITI BEAUFORT SABAH',
      firebaseProjectId: CONFIG.FIREBASE_PROJECT_ID,
      backupTimestamp: startTime.toISOString(),
      backupLocalTime: Utilities.formatDate(startTime, 'Asia/Kuala_Lumpur', 'yyyy-MM-dd HH:mm:ss (z)'),
      totalCollections: CONFIG.COLLECTIONS.length,
      counts: {},
      data: {}
    };

    // 1. Tarik setiap koleksi daripada Firestore REST API dengan OAuth Bearer token
    CONFIG.COLLECTIONS.forEach(collectionName => {
      Logger.log(`Menarik data dari koleksi: ${collectionName}...`);
      const docs = getFirestoreDocuments(CONFIG.FIREBASE_PROJECT_ID, collectionName);
      backupData.counts[collectionName] = docs.length;
      backupData.data[collectionName] = docs;
      Logger.log(`✓ Selesai ${collectionName}: ${docs.length} rekod.`);
    });

    // 2. Cipta fail sandaran JSON dalam Google Drive
    const timeFormatted = Utilities.formatDate(startTime, 'Asia/Kuala_Lumpur', 'yyyy-MM-dd_HHmmss');
    const fileName = `BACKUP_ALUMNI_KKBS_${timeFormatted}.json`;
    const jsonContent = JSON.stringify(backupData, null, 2);
    
    const backupFile = folder.createFile(fileName, jsonContent, MimeType.PLAIN_TEXT);
    backupFile.setDescription(`Sandaran automatik pangkalan data Firestore Alumni KKBS (icamp-aa9e4) pada ${backupData.backupLocalTime}`);
    Logger.log(`✓ Fail sandaran JSON berjaya dicipta: ${fileName} (ID: ${backupFile.getId()})`);

    // 3. Hasilkan juga salinan CSV untuk alumni-members bagi semakan mudah dalam Spreadsheet
    if (backupData.data['alumni-members'] && backupData.data['alumni-members'].length > 0) {
      const csvName = `RINGKASAN_AHLI_ALUMNI_${timeFormatted}.csv`;
      const csvContent = convertMembersToCsv(backupData.data['alumni-members']);
      const csvFile = folder.createFile(csvName, csvContent, MimeType.CSV);
      Logger.log(`✓ Fail CSV ahli berjaya dicipta: ${csvName} (ID: ${csvFile.getId()})`);
    }

    // 4. Bersihkan fail sandaran lama yang melebihi 14 hari (Retention Policy)
    cleanupOldBackups(folder, CONFIG.RETENTION_DAYS);

    const endTime = new Date();
    const durationSec = ((endTime.getTime() - startTime.getTime()) / 1000).toFixed(2);
    Logger.log(`=== SANDARAN SELESAI DENGAN JAYANYA DALAM ${durationSec} SAAT ===`);

    return {
      success: true,
      fileName: fileName,
      fileId: backupFile.getId(),
      backupTime: backupData.backupLocalTime,
      counts: backupData.counts
    };

  } catch (error) {
    Logger.log(`❌ RALAT SANDARAN: ${error.toString()}`);
    return {
      success: false,
      error: error.toString()
    };
  }
}

/**
 * Mengambil semua dokumen daripada satu koleksi Firestore REST API (dengan sokongan pagination & OAuth)
 */
function getFirestoreDocuments(projectId, collectionName) {
  let documents = [];
  let pageToken = '';
  const baseUrl = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/${collectionName}`;

  // Dapatkan OAuth Token Google Cloud untuk mengelakkan isu Security Rules
  let authToken = '';
  try {
    authToken = ScriptApp.getOAuthToken();
  } catch (e) {
    Logger.log('Nota: Tiada OAuth token diambil, mencuba sambungan tanpa token.');
  }

  do {
    let url = `${baseUrl}?pageSize=300`;
    if (pageToken) {
      url += `&pageToken=${encodeURIComponent(pageToken)}`;
    }

    const headers = {};
    if (authToken) {
      headers['Authorization'] = 'Bearer ' + authToken;
    }

    const options = {
      method: 'GET',
      headers: headers,
      muteHttpExceptions: true
    };

    const response = UrlFetchApp.fetch(url, options);
    const responseCode = response.getResponseCode();

    if (responseCode === 200) {
      const result = JSON.parse(response.getContentText());
      if (result.documents && result.documents.length > 0) {
        result.documents.forEach(doc => {
          const docId = doc.name ? doc.name.split('/').pop() : '';
          const parsedFields = parseFirestoreFields(doc.fields || {});
          documents.push({
            id: docId,
            ...parsedFields
          });
        });
      }
      pageToken = result.nextPageToken || '';
    } else if (responseCode === 404) {
      // Koleksi belum wujud
      break;
    } else {
      Logger.log(`Amaran: Respons Firestore ${responseCode} untuk ${collectionName}: ${response.getContentText()}`);
      break;
    }
  } while (pageToken);

  return documents;
}

/**
 * Menukar jenis data Firestore (stringValue, integerValue, booleanValue, mapValue, arrayValue) ke format JSON biasa
 */
function parseFirestoreFields(fields) {
  const output = {};
  for (const key in fields) {
    output[key] = parseFirestoreValue(fields[key]);
  }
  return output;
}

function parseFirestoreValue(val) {
  if (!val || typeof val !== 'object') return val;
  if ('stringValue' in val) return val.stringValue;
  if ('integerValue' in val) return parseInt(val.integerValue, 10);
  if ('doubleValue' in val) return parseFloat(val.doubleValue);
  if ('booleanValue' in val) return val.booleanValue;
  if ('timestampValue' in val) return val.timestampValue;
  if ('nullValue' in val) return null;
  if ('mapValue' in val) return parseFirestoreFields(val.mapValue.fields || {});
  if ('arrayValue' in val) {
    const arr = val.arrayValue.values || [];
    return arr.map(v => parseFirestoreValue(v));
  }
  return val;
}

/**
 * Menukar senarai ahli alumni kepada teks CSV dengan escaping selamat
 */
function convertMembersToCsv(members) {
  if (!members || members.length === 0) return '';
  const headers = [
    'ID', 'No Ahli', 'Nama', 'No KP', 'No Pendaftaran', 'Tahun Lulusan',
    'Program', 'Jantina', 'Agama', 'Kaum', 'Tarikh Graduasi', 'No Telefon',
    'Emel', 'Pekerjaan/Jawatan', 'Nama Majikan', 'Negeri', 'Status', 'Peranan'
  ];

  const escapeCsv = (str) => {
    const text = String(str || '');
    if (text.includes(',') || text.includes('"') || text.includes('\n')) {
      return `"${text.replace(/"/g, '""')}"`;
    }
    return text;
  };

  const rows = [headers.join(',')];
  members.forEach(m => {
    const row = [
      escapeCsv(m.id),
      escapeCsv(m.noAhli),
      escapeCsv(m.nama),
      escapeCsv(m.noKp),
      escapeCsv(m.noPendaftaran),
      escapeCsv(m.tahunLulusan),
      escapeCsv(m.program),
      escapeCsv(m.jantina),
      escapeCsv(m.agama),
      escapeCsv(m.kaumUtama),
      escapeCsv(m.tarikhGraduasi),
      escapeCsv(m.noTelefon),
      escapeCsv(m.emel),
      escapeCsv(m.pekerjaanJawatan),
      escapeCsv(m.namaMajikan),
      escapeCsv(m.negeri),
      escapeCsv(m.status),
      escapeCsv(m.role)
    ];
    rows.push(row.join(','));
  });

  return rows.join('\r\n');
}

/**
 * Memadam fail sandaran yang melebihi 14 hari (2 Minggu Retention Policy)
 */
function cleanupOldBackups(folder, retentionDays) {
  Logger.log(`Memeriksa fail lama melebihi ${retentionDays} hari untuk dipadamkan...`);
  const now = new Date().getTime();
  const retentionMs = retentionDays * 24 * 60 * 60 * 1000;
  const cutoffTime = now - retentionMs;

  const files = folder.getFiles();
  let deletedCount = 0;
  let keptCount = 0;

  while (files.hasNext()) {
    const file = files.next();
    const fileName = file.getName();
    
    // Hanya proses fail yang bermula dengan prefix sandaran alumni
    if (fileName.startsWith('BACKUP_ALUMNI_') || fileName.startsWith('RINGKASAN_AHLI_')) {
      const fileCreatedTime = file.getDateCreated().getTime();
      if (fileCreatedTime < cutoffTime) {
        Logger.log(`🗑️ Memadam fail lama (> ${retentionDays} hari): ${fileName} (Dicipta pada: ${file.getDateCreated()})`);
        file.setTrashed(true);
        deletedCount++;
      } else {
        keptCount++;
      }
    }
  }

  Logger.log(`✓ Pembersihan selesai: ${deletedCount} fail lama dipadam, ${keptCount} fail terkini disimpan.`);
}

/**
 * ==============================================================================
 * PENETAPAN TRIGGER AUTOMATIK (SETIAP HARI AHAD JAM 2:00 PAGI)
 * ==============================================================================
 * Jalankan fungsi ini SEKALI di Apps Script Editor untuk mengaktifkan jadual automatik.
 */
function setupWeeklySunday2AMTrigger() {
  Logger.log('Menyediakan trigger mingguan: Setiap hari Ahad jam 2:00 Pagi...');
  
  // 1. Padam trigger sedia ada dengan nama yang sama untuk elak pertindihan
  const allTriggers = ScriptApp.getProjectTriggers();
  allTriggers.forEach(trigger => {
    if (trigger.getHandlerFunction() === 'backupFirestoreToDrive') {
      ScriptApp.deleteTrigger(trigger);
      Logger.log('Trigger lama dipadam.');
    }
  });

  // 2. Cipta Trigger Baharu: Setiap Hari Ahad, jam 2.00 Pagi (Waktu Tempatan)
  ScriptApp.newTrigger('backupFirestoreToDrive')
    .timeBased()
    .onWeekDay(ScriptApp.WeekDay.SUNDAY)
    .atHour(2)
    .create();

  Logger.log('✅ Trigger automatik BERJAYA dipasang!');
  Logger.log('Jadual: Setiap Hari Ahad pada jam 2:00 AM (02:00).');
}

/**
 * Web App Endpoint (Opsional: membolehkan trigger sandaran manual melalui URL)
 */
function doGet(e) {
  const result = backupFirestoreToDrive();
  return ContentService.createTextOutput(JSON.stringify(result))
    .setMimeType(ContentService.MimeType.JSON);
}
