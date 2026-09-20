/**
 * ============================================================================
 * PERSATUAN ALUMNI KOLEJ KOMUNITI BEAUFORT (ALUMNI KKBS) - DATABASE API (v1.0)
 * ============================================================================
 * Skrip ini bertindak sebagai enjin API yang menghubungkan Web App Alumni KKBS
 * ke Google Sheets anda sebagai pangkalan data utama untuk:
 * 1. Pendaftaran, kelulusan, kemaskini & pemadaman rekod alumni (AHLI).
 * 2. Merekod aliran tunai masuk/keluar bagi akaun persatuan (KEWANGAN).
 * 3. Mengemas kini maklumat nama persatuan, yuran, dan versi web (TETAPAN).
 * ============================================================================
 */

var SHEET_AHLI = "AHLI";
var SHEET_KEWANGAN = "KEWANGAN";
var SHEET_TETAPAN = "TETAPAN";
var SHEET_PROGRAM = "PROGRAM";

/**
 * SETUP: Jalankan fungsi ini sekali sahaja di Editor Apps Script untuk persediaan.
 */
function setupDatabase() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  
  // 1. Dapatkan sheet pertama (sumber data asal)
  var sheets = ss.getSheets();
  var sourceSheet = sheets[0];
  var sourceData = sourceSheet.getDataRange().getValues();
  var sourceHeaders = sourceData[0].map(function(h) { return h.toString().trim().toUpperCase(); });
  
  // Jika tab pertama adalah AHLI dan kosong, cari tab kedua yang mengandungi data asal
  if (sourceSheet.getName() === SHEET_AHLI && sourceData.length <= 1 && sheets.length > 1) {
    sourceSheet = sheets[1];
    sourceData = sourceSheet.getDataRange().getValues();
    sourceHeaders = sourceData[0].map(function(h) { return h.toString().trim().toUpperCase(); });
  }

  var headersAhli = [
    "id", "noAhli", "nama", "noKp", "noPendaftaran", "tahunLulusan", 
    "program", "jantina", "agama", "kaumUtama", "tarikhGraduasi", 
    "noTelefon", "emel", "pekerjaanJawatan", "namaMajikan", 
    "negeri", "status", "role", "createdAt", "password"
  ];
  
  // Sediakan/bersihkan tab AHLI
  var sheetAhli = ss.getSheetByName(SHEET_AHLI);
  if (!sheetAhli) {
    sheetAhli = ss.insertSheet(SHEET_AHLI);
    sheetAhli.appendRow(headersAhli);
  } else {
    // Jika tab AHLI sudah ada rekod, kita formatkan lajur noKp secara langsung menggunakan batch write (laju & selamat)
    var dataAhli = sheetAhli.getDataRange().getValues();
    var headersAhliData = dataAhli[0];
    var colIdxKp = headersAhliData.indexOf("noKp");
    if (colIdxKp !== -1 && dataAhli.length > 1) {
      var isChanged = false;
      for (var rowIdx = 1; rowIdx < dataAhli.length; rowIdx++) {
        var rawKpVal = dataAhli[rowIdx][colIdxKp];
        var cleanKpVal = rawKpVal.toString().replace(/\D/g, '').trim();
        if (cleanKpVal.length > 0 && cleanKpVal.length < 12) {
          cleanKpVal = cleanKpVal.padStart(12, '0');
        }
        if (cleanKpVal.length === 12) {
          var formattedKp = cleanKpVal.substring(0, 6) + "-" + cleanKpVal.substring(6, 8) + "-" + cleanKpVal.substring(8);
          if (rawKpVal.toString() !== formattedKp) {
            dataAhli[rowIdx][colIdxKp] = formattedKp;
            isChanged = true;
          }
        }
      }
      if (isChanged) {
        sheetAhli.getRange(1, 1, dataAhli.length, dataAhli[0].length).setValues(dataAhli);
      }
      Logger.log("Format IC semua ahli sedia ada telah diselaraskan.");
    }
    
    // Jika tab AHLI kosong (hanya header), kita boleh tulis semula
    if (sheetAhli.getLastRow() <= 1) {
      sheetAhli.clear();
      sheetAhli.appendRow(headersAhli);
    }
  }

  // Jika tab AHLI masih kosong, kita migrasikan data daripada sourceSheet secara automatik
  if (sheetAhli.getLastRow() <= 1 && sourceData.length > 1 && sourceHeaders.indexOf("NAMA") !== -1) {
    var idxTahun = sourceHeaders.indexOf("TAHUN LULUSAN");
    var idxNegeri = sourceHeaders.indexOf("NEGERI");
    var idxNama = sourceHeaders.indexOf("NAMA");
    var idxKp = sourceHeaders.indexOf("NO_KP");
    var idxPendaftaran = sourceHeaders.indexOf("NO_PENDAFTARAN");
    var idxProgram = sourceHeaders.indexOf("PROGRAM");
    var idxJantina = sourceHeaders.indexOf("JANTINA");
    var idxAgama = sourceHeaders.indexOf("AGAMA");
    var idxKaum = sourceHeaders.indexOf("KAUM_UTAMA");
    var idxGraduasi = sourceHeaders.indexOf("TARIKH GRADUASI");
    var idxAhli = sourceHeaders.indexOf("NO_AHLI");
    var idxTelefon = sourceHeaders.indexOf("NO_TELEFON");
    var idxEmel = sourceHeaders.indexOf("EMEL");
    var idxPassword = sourceHeaders.indexOf("PASSWORD");
    var idxPekerjaan = sourceHeaders.indexOf("PEKERJAAN/JAWATAN");
    var idxMajikan = sourceHeaders.indexOf("NAMA_MAJIKAN");

    var rowsToWrite = [];
    for (var i = 1; i < sourceData.length; i++) {
      var cols = sourceData[i];
      if (!cols[idxNama]) continue;

      var nama = cols[idxNama] || '';
      var rawKp = cols[idxKp] || '';
      var cleanKpDigits = rawKp.toString().replace(/\D/g, '').trim();
      if (cleanKpDigits.length > 0 && cleanKpDigits.length < 12) {
        cleanKpDigits = cleanKpDigits.padStart(12, '0');
      }
      var noKp = cleanKpDigits.length === 12 
        ? cleanKpDigits.substring(0, 6) + "-" + cleanKpDigits.substring(6, 8) + "-" + cleanKpDigits.substring(8)
        : cleanKpDigits;
      var noPendaftaran = cols[idxPendaftaran] || '';
      var noAhli = cols[idxAhli] || '';
      var emel = cols[idxEmel] || (noPendaftaran ? noPendaftaran.toString().toLowerCase() + "@kkbs.edu.my" : "");
      var status = noAhli ? "Active" : "Pending";
      var role = "Member";
      var password = cols[idxPassword] || noKp.toString().replace(/\D/g, '') || "alumni123";

      rowsToWrite.push([
        "MEM-" + i,
        noAhli,
        nama,
        noKp,
        noPendaftaran,
        cols[idxTahun] || "2026",
        cols[idxProgram] || "Sijil Kulinari",
        cols[idxJantina] || "Lelaki",
        cols[idxAgama] || "Islam",
        cols[idxKaum] || "Melayu",
        cols[idxGraduasi] || "",
        cols[idxTelefon] || "",
        emel,
        cols[idxPekerjaan] || "-",
        cols[idxMajikan] || "-",
        cols[idxNegeri] || "Sabah",
        status,
        role,
        new Date().toISOString(),
        password
      ]);
    }
    
    if (rowsToWrite.length > 0) {
      sheetAhli.getRange(2, 1, rowsToWrite.length, headersAhli.length).setValues(rowsToWrite);
      Logger.log("Migrasi data alumni berjaya! " + rowsToWrite.length + " rekod disalin ke tab AHLI.");
    }
  }
  
  // 2. Sediakan tab KEWANGAN
  var sheetKewangan = ss.getSheetByName(SHEET_KEWANGAN);
  var headersKewangan = [
    "id", "date", "category", "amount", "type", "description", "receiptUrl"
  ];
  
  if (!sheetKewangan) {
    sheetKewangan = ss.insertSheet(SHEET_KEWANGAN);
    sheetKewangan.appendRow(headersKewangan);
    Logger.log("Tab KEWANGAN berjaya dibina!");
  } else {
    sheetKewangan.getRange(1, 1, 1, headersKewangan.length).setValues([headersKewangan]);
    Logger.log("Tab KEWANGAN dikemaskini.");
  }
  
  // 3. Sediakan tab TETAPAN
  var sheetTetapan = ss.getSheetByName(SHEET_TETAPAN);
  var headersTetapan = [
    "associationName", "associationLogoUrl", "membershipFee", "membershipYear", "appVersion"
  ];
  var defaultTetapan = [
    "Persatuan Alumni Kolej Komuniti Beaufort Sabah",
    "",
    50.0,
    "2026",
    "1.0.0"
  ];
  
  if (!sheetTetapan) {
    sheetTetapan = ss.insertSheet(SHEET_TETAPAN);
    sheetTetapan.appendRow(headersTetapan);
    sheetTetapan.appendRow(defaultTetapan);
    Logger.log("Tab TETAPAN berjaya dibina!");
  } else {
    sheetTetapan.getRange(1, 1, 1, headersTetapan.length).setValues([headersTetapan]);
    Logger.log("Tab TETAPAN dikemaskini.");
  }
  
  // 4. Sediakan tab PROGRAM
  var sheetProgram = ss.getSheetByName(SHEET_PROGRAM);
  var headersProgram = [
    "id", "namaProgram", "tarikhProgram", "masaProgram", "tempatProgram", 
    "kerjasama", "implikasiKewangan", "sasaranPeserta", "bilanganPeserta"
  ];
  
  if (!sheetProgram) {
    sheetProgram = ss.insertSheet(SHEET_PROGRAM);
    sheetProgram.appendRow(headersProgram);
    // Masukkan data permulaan
    sheetProgram.appendRow([
      "PROG-1",
      "Kejohanan Badminton Alumni KKBS 2025",
      "14 Ogos 2025",
      "8:00 Pagi - 2:00 Petang",
      "Dewan Sukan Beaufort",
      "Majlis Belia Beaufort",
      "RM 450.00",
      "Semua Ahli Alumni",
      40
    ]);
    sheetProgram.appendRow([
      "PROG-2",
      "Bengkel Kerjaya & Keusahawanan Alumni KKBS",
      "20 Disember 2025",
      "9:00 Pagi - 1:00 Tengah Hari",
      "Bilik Seminar Kolej Komuniti Beaufort",
      "Unit Keusahawanan KKBS",
      "RM 600.00",
      "Alumni & Pelajar Semester Akhir",
      80
    ]);
    Logger.log("Tab PROGRAM berjaya dibina!");
  } else {
    sheetProgram.getRange(1, 1, 1, headersProgram.length).setValues([headersProgram]);
    Logger.log("Tab PROGRAM dikemaskini.");
  }
  
  Logger.log("Persediaan Pangkalan Data Alumni KKBS Selesai!");
}

/**
 * GET: Membaca data daripada Sheets (Senarai Ahli, Kewangan & Tetapan)
 */
function doGet(e) {
  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    
    var sheetAhli = ss.getSheetByName(SHEET_AHLI) || ss.getSheets()[0];
    
    // Pastikan A1 sentiasa bertajuk "id" (self-healing)
    if (sheetAhli.getLastRow() > 0 && sheetAhli.getRange("A1").getValue().toString().trim().toLowerCase() !== "id") {
      sheetAhli.getRange("A1").setValue("id");
    }
    
    // Auto-heal missing headers in database
    var expectedHeaders = [
      "id", "noAhli", "nama", "noKp", "noPendaftaran", "tahunLulusan", 
      "program", "jantina", "agama", "kaumUtama", "tarikhGraduasi", 
      "noTelefon", "emel", "pekerjaanJawatan", "namaMajikan", 
      "negeri", "status", "role", "createdAt", "password"
    ];
    ensureHeaders(sheetAhli, expectedHeaders);
    
    var dataAhli = sheetAhli.getDataRange().getValues();
    var headersAhli = dataAhli[0];
    var members = [];
    for (var i = 1; i < dataAhli.length; i++) {
      var row = dataAhli[i];
      if (!row[0]) continue; // Skip jika tiada ID
      var memberObj = {};
      for (var j = 0; j < headersAhli.length; j++) {
        var headerKey = headersAhli[j] ? headersAhli[j].toString().trim() : "";
        memberObj[headerKey] = row[j];
      }
      // Pastikan field id sentiasa bernilai dari Lajur A (row[0]) jika kosong
      if (!memberObj["id"] && row[0]) {
        memberObj["id"] = row[0].toString().trim();
      }
      members.push(memberObj);
    }
    
    // Ambil data Kewangan
    var sheetKewangan = ss.getSheetByName(SHEET_KEWANGAN);
    var transactions = [];
    if (sheetKewangan) {
      var dataKewangan = sheetKewangan.getDataRange().getValues();
      var headersKewangan = dataKewangan[0];
      for (var i = 1; i < dataKewangan.length; i++) {
        var row = dataKewangan[i];
        if (!row[0]) continue;
        var txObj = {};
        for (var j = 0; j < headersKewangan.length; j++) {
          txObj[headersKewangan[j]] = row[j];
        }
        transactions.push(txObj);
      }
    }
    
    // Ambil Tetapan Sistem
    var sheetTetapan = ss.getSheetByName(SHEET_TETAPAN);
    var config = {
      associationName: "Persatuan Alumni Kolej Komuniti Beaufort Sabah",
      associationLogoUrl: "",
      membershipFee: 50.0,
      membershipYear: "2026",
      appVersion: "1.0.0",
      pengerusi: "NAMA PENGERUSI",
      setiausaha: "NAMA SETIAUSAHA",
      bendahari: "NAMA BENDAHARI",
      juruAudit: "NAMA JURU AUDIT"
    };
    if (sheetTetapan) {
      // Auto-heal headers if missing
      var expectedConfigHeaders = [
        "associationName", "associationLogoUrl", "membershipFee", "membershipYear", "appVersion",
        "pengerusi", "setiausaha", "bendahari", "juruAudit"
      ];
      ensureHeaders(sheetTetapan, expectedConfigHeaders);
      
      var dataTetapan = sheetTetapan.getDataRange().getValues();
      var headersTetapan = dataTetapan[0];
      if (dataTetapan.length > 1) {
        config.associationName = dataTetapan[1][0] || config.associationName;
        config.associationLogoUrl = dataTetapan[1][1] || config.associationLogoUrl;
        config.membershipFee = parseFloat(dataTetapan[1][2] || config.membershipFee);
        config.membershipYear = dataTetapan[1][3] || config.membershipYear;
        config.appVersion = dataTetapan[1][4] || config.appVersion;
        
        var idxPengerusi = headersTetapan.indexOf("pengerusi");
        var idxSetiausaha = headersTetapan.indexOf("setiausaha");
        var idxBendahari = headersTetapan.indexOf("bendahari");
        var idxJuruAudit = headersTetapan.indexOf("juruAudit");
        
        config.pengerusi = idxPengerusi !== -1 ? dataTetapan[1][idxPengerusi] : "NAMA PENGERUSI";
        config.setiausaha = idxSetiausaha !== -1 ? dataTetapan[1][idxSetiausaha] : "NAMA SETIAUSAHA";
        config.bendahari = idxBendahari !== -1 ? dataTetapan[1][idxBendahari] : "NAMA BENDAHARI";
        config.juruAudit = idxJuruAudit !== -1 ? dataTetapan[1][idxJuruAudit] : "NAMA JURU AUDIT";
      }
    }
    
    // Ambil data Program
    var sheetProgram = ss.getSheetByName(SHEET_PROGRAM);
    var programs = [];
    if (sheetProgram) {
      var dataProgram = sheetProgram.getDataRange().getValues();
      var headersProgram = dataProgram[0];
      for (var i = 1; i < dataProgram.length; i++) {
        var row = dataProgram[i];
        if (!row[0]) continue;
        var progObj = {};
        for (var j = 0; j < headersProgram.length; j++) {
          progObj[headersProgram[j]] = row[j];
        }
        programs.push(progObj);
      }
    }
    
    return ContentService
      .createTextOutput(JSON.stringify({
        success: true,
        members: members,
        transactions: transactions,
        config: config,
        programs: programs
      }))
      .setMimeType(ContentService.MimeType.JSON);
      
  } catch (err) {
    return ContentService
      .createTextOutput(JSON.stringify({ success: false, error: err.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

/**
 * POST: Menulis dan mengemas kini data di Sheets
 */
function doPost(e) {
  try {
    var postData = JSON.parse(e.postData.contents);
    var action = postData.action;
    
    if (action === "add_member") {
      return handleAddMember(postData.member);
    } else if (action === "update_member") {
      return handleUpdateMember(postData.id, postData.data);
    } else if (action === "admin_update_member") {
      return handleAdminUpdateMember(postData.id, postData.member);
    } else if (action === "delete_member") {
      return handleDeleteMember(postData.id);
    } else if (action === "add_transaction") {
      return handleAddTransaction(postData.transaction);
    } else if (action === "delete_transaction") {
      return handleDeleteTransaction(postData.id);
    } else if (action === "update_config") {
      return handleUpdateConfig(postData.config);
    } else if (action === "add_program") {
      return handleAddProgram(postData.program);
    } else if (action === "update_program") {
      return handleUpdateProgram(postData.id, postData.program);
    } else if (action === "delete_program") {
      return handleDeleteProgram(postData.id);
    } else {
      return ContentService
        .createTextOutput(JSON.stringify({ success: false, error: "Aksi tidak dikenali" }))
        .setMimeType(ContentService.MimeType.JSON);
    }
  } catch (err) {
    return ContentService
      .createTextOutput(JSON.stringify({ success: false, error: err.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

function handleAddMember(member) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(SHEET_AHLI);
  var data = sheet.getDataRange().getValues();
  var headers = data[0];
  
  // Semak jika member dengan KP/Emel ini sudah wujud
  var idxKp = headers.indexOf("noKp");
  var idxEmel = headers.indexOf("emel");
  for (var i = 1; i < data.length; i++) {
    if (idxKp !== -1 && data[i][idxKp].toString().trim() === member.noKp.toString().trim()) {
      return ContentService
        .createTextOutput(JSON.stringify({ success: false, error: "Kad Pengenalan ini telah didaftarkan!" }))
        .setMimeType(ContentService.MimeType.JSON);
    }
    if (idxEmel !== -1 && data[i][idxEmel].toString().trim().toLowerCase() === member.emel.toString().trim().toLowerCase()) {
      return ContentService
        .createTextOutput(JSON.stringify({ success: false, error: "Alamat E-mel ini telah didaftarkan!" }))
        .setMimeType(ContentService.MimeType.JSON);
    }
  }
  
  // Bina row values
  var newRow = [];
  for (var j = 0; j < headers.length; j++) {
    var key = headers[j];
    if (key === "id") {
      newRow.push(member.id || "MEM-" + Utilities.getUuid().substring(0, 8));
    } else if (key === "createdAt") {
      newRow.push(new Date().toISOString());
    } else {
      newRow.push(member[key] !== undefined ? member[key] : "");
    }
  }
  
  sheet.appendRow(newRow);
  return ContentService
    .createTextOutput(JSON.stringify({ success: true, message: "Pendaftaran ahli berjaya disimpan di Google Sheets!" }))
    .setMimeType(ContentService.MimeType.JSON);
}

function handleUpdateMember(id, updateData) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(SHEET_AHLI);
  var data = sheet.getDataRange().getValues();
  var headers = data[0];
  
  var rowFound = -1;
  for (var i = 1; i < data.length; i++) {
    if (data[i][0].toString().trim() === id.toString().trim()) {
      rowFound = i + 1;
      break;
    }
  }
  
  if (rowFound === -1) {
    return ContentService
      .createTextOutput(JSON.stringify({ success: false, error: "Ahli tidak ditemui" }))
      .setMimeType(ContentService.MimeType.JSON);
  }
  
  // Kemas kini kolum
  for (var key in updateData) {
    var colIdx = headers.indexOf(key);
    if (colIdx !== -1) {
      sheet.getRange(rowFound, colIdx + 1).setValue(updateData[key]);
    }
  }
  
  return ContentService
    .createTextOutput(JSON.stringify({ success: true, message: "Maklumat ahli dikemaskini!" }))
    .setMimeType(ContentService.MimeType.JSON);
}

function handleAdminUpdateMember(id, member) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(SHEET_AHLI);
  var data = sheet.getDataRange().getValues();
  var headers = data[0];
  
  var rowFound = -1;
  for (var i = 1; i < data.length; i++) {
    if (data[i][0].toString().trim() === id.toString().trim()) {
      rowFound = i + 1;
      break;
    }
  }
  
  if (rowFound === -1) {
    return ContentService
      .createTextOutput(JSON.stringify({ success: false, error: "Ahli tidak ditemui" }))
      .setMimeType(ContentService.MimeType.JSON);
  }
  
  // Gantikan keseluruhan baris mengikut header
  for (var j = 0; j < headers.length; j++) {
    var key = headers[j];
    if (key !== "id" && key !== "createdAt" && member[key] !== undefined) {
      sheet.getRange(rowFound, j + 1).setValue(member[key]);
    }
  }
  
  return ContentService
    .createTextOutput(JSON.stringify({ success: true, message: "Ahli berjaya dikemas kini oleh admin!" }))
    .setMimeType(ContentService.MimeType.JSON);
}

function handleDeleteMember(id) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(SHEET_AHLI);
  var data = sheet.getDataRange().getValues();
  
  for (var i = 1; i < data.length; i++) {
    if (data[i][0].toString().trim() === id.toString().trim()) {
      sheet.deleteRow(i + 1);
      return ContentService
        .createTextOutput(JSON.stringify({ success: true, message: "Rekod ahli berjaya dihapuskan!" }))
        .setMimeType(ContentService.MimeType.JSON);
    }
  }
  
  return ContentService
    .createTextOutput(JSON.stringify({ success: false, error: "Ahli tidak ditemui." }))
    .setMimeType(ContentService.MimeType.JSON);
}

function handleAddTransaction(tx) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(SHEET_KEWANGAN);
  var headers = sheet.getDataRange().getValues()[0];
  
  var newRow = [];
  var txId = "TX-" + Utilities.getUuid().substring(0, 8);
  for (var j = 0; j < headers.length; j++) {
    var key = headers[j];
    if (key === "id") {
      newRow.push(txId);
    } else if (key === "date") {
      newRow.push(tx.date || new Date().toISOString());
    } else {
      newRow.push(tx[key] !== undefined ? tx[key] : "");
    }
  }
  
  sheet.appendRow(newRow);
  return ContentService
    .createTextOutput(JSON.stringify({ success: true, message: "Transaksi kewangan direkodkan!" }))
    .setMimeType(ContentService.MimeType.JSON);
}

function handleDeleteTransaction(id) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(SHEET_KEWANGAN);
  var data = sheet.getDataRange().getValues();
  
  for (var i = 1; i < data.length; i++) {
    if (data[i][0].toString().trim() === id.toString().trim()) {
      sheet.deleteRow(i + 1);
      return ContentService
        .createTextOutput(JSON.stringify({ success: true, message: "Transaksi dipadamkan!" }))
        .setMimeType(ContentService.MimeType.JSON);
    }
  }
  
  return ContentService
    .createTextOutput(JSON.stringify({ success: false, error: "Transaksi tidak ditemui." }))
    .setMimeType(ContentService.MimeType.JSON);
}

function handleUpdateConfig(config) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(SHEET_TETAPAN);
  
  var expectedHeaders = [
    "associationName", "associationLogoUrl", "membershipFee", "membershipYear", "appVersion",
    "pengerusi", "setiausaha", "bendahari", "juruAudit"
  ];
  ensureHeaders(sheet, expectedHeaders);
  
  var data = sheet.getDataRange().getValues();
  var headers = data[0];
  
  // Force committee names to UPPERCASE
  var pengerusiName = (config.pengerusi || "NAMA PENGERUSI").toString().toUpperCase().trim();
  var setiausahaName = (config.setiausaha || "NAMA SETIAUSAHA").toString().toUpperCase().trim();
  var bendahariName = (config.bendahari || "NAMA BENDAHARI").toString().toUpperCase().trim();
  var juruAuditName = (config.juruAudit || "NAMA JURU AUDIT").toString().toUpperCase().trim();
  
  var rowValues = [];
  for (var i = 0; i < headers.length; i++) {
    var key = headers[i];
    if (key === "associationName") rowValues.push(config.associationName || "");
    else if (key === "associationLogoUrl") rowValues.push(config.associationLogoUrl || "");
    else if (key === "membershipFee") rowValues.push(config.membershipFee || 50.0);
    else if (key === "membershipYear") rowValues.push(config.membershipYear || "");
    else if (key === "appVersion") rowValues.push(config.appVersion || "1.0.0");
    else if (key === "pengerusi") rowValues.push(pengerusiName);
    else if (key === "setiausaha") rowValues.push(setiausahaName);
    else if (key === "bendahari") rowValues.push(bendahariName);
    else if (key === "juruAudit") rowValues.push(juruAuditName);
    else rowValues.push("");
  }
  
  sheet.getRange(2, 1, 1, headers.length).setValues([rowValues]);
  
  return ContentService
    .createTextOutput(JSON.stringify({ success: true, message: "Tetapan sistem disimpan!" }))
    .setMimeType(ContentService.MimeType.JSON);
}

function handleAddProgram(prog) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(SHEET_PROGRAM);
  var headers = sheet.getDataRange().getValues()[0];
  
  var newRow = [];
  var progId = prog.id || "PROG-" + Utilities.getUuid().substring(0, 8);
  for (var j = 0; j < headers.length; j++) {
    var key = headers[j];
    if (key === "id") {
      newRow.push(progId);
    } else {
      newRow.push(prog[key] !== undefined ? prog[key] : "");
    }
  }
  
  sheet.appendRow(newRow);
  return ContentService
    .createTextOutput(JSON.stringify({ success: true, message: "Program berjaya direkodkan!" }))
    .setMimeType(ContentService.MimeType.JSON);
}

function handleUpdateProgram(id, prog) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(SHEET_PROGRAM);
  var data = sheet.getDataRange().getValues();
  var headers = data[0];
  
  var rowFound = -1;
  for (var i = 1; i < data.length; i++) {
    if (data[i][0].toString().trim() === id.toString().trim()) {
      rowFound = i + 1;
      break;
    }
  }
  
  if (rowFound === -1) {
    return ContentService
      .createTextOutput(JSON.stringify({ success: false, error: "Program tidak ditemui" }))
      .setMimeType(ContentService.MimeType.JSON);
  }
  
  for (var j = 0; j < headers.length; j++) {
    var key = headers[j];
    if (key !== "id" && prog[key] !== undefined) {
      sheet.getRange(rowFound, j + 1).setValue(prog[key]);
    }
  }
  
  return ContentService
    .createTextOutput(JSON.stringify({ success: true, message: "Program berjaya dikemaskini!" }))
    .setMimeType(ContentService.MimeType.JSON);
}

function handleDeleteProgram(id) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(SHEET_PROGRAM);
  var data = sheet.getDataRange().getValues();
  
  for (var i = 1; i < data.length; i++) {
    if (data[i][0].toString().trim() === id.toString().trim()) {
      sheet.deleteRow(i + 1);
      return ContentService
        .createTextOutput(JSON.stringify({ success: true, message: "Program berjaya dipadamkan!" }))
        .setMimeType(ContentService.MimeType.JSON);
    }
  }
  
  return ContentService
    .createTextOutput(JSON.stringify({ success: false, error: "Program tidak ditemui." }))
    .setMimeType(ContentService.MimeType.JSON);
}

/**
 * Helper untuk menyemak dan menambah lajur header yang hilang secara dinamik
 */
function ensureHeaders(sheet, expectedHeaders) {
  var lastCol = sheet.getLastColumn();
  if (lastCol === 0) return;
  var headers = sheet.getRange(1, 1, 1, lastCol).getValues()[0];
  var missing = [];
  for (var i = 0; i < expectedHeaders.length; i++) {
    if (headers.indexOf(expectedHeaders[i]) === -1) {
      missing.push(expectedHeaders[i]);
    }
  }
  if (missing.length > 0) {
    for (var k = 0; k < missing.length; k++) {
      sheet.getRange(1, lastCol + k + 1).setValue(missing[k]);
    }
    SpreadsheetApp.flush();
  }
}
