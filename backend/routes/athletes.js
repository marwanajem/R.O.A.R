import express from 'express';
import pool from '../server.js';
import multer from 'multer';
import ExcelJS from 'exceljs';

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() }); 

// Comprehensive ISO 3166-1 alpha-3 list
const COUNTRIES = [
  'MAS', 'SGP', 'INA', 'BRU', 'THA', 'PHL', 'VNM', 'KHM', 'LAO', 'MMR',
  'AFG', 'ALB', 'DZA', 'AND', 'AGO', 'ATG', 'ARG', 'ARM', 'AUS', 'AUT', 'AZE', 'BHS', 'BHR', 
  'BGD', 'BRB', 'BLR', 'BEL', 'BLZ', 'BEN', 'BTN', 'BOL', 'BIH', 'BWA', 'BRA', 'BGR', 'BFA', 
  'BDI', 'CPV', 'CMR', 'CAN', 'CAF', 'TCD', 'CHL', 'CHN', 'COL', 'COM', 'COG', 'COD', 
  'CRI', 'CIV', 'HRV', 'CUB', 'CYP', 'CZE', 'DNK', 'DJI', 'DMA', 'DOM', 'ECU', 'EGY', 'SLV', 
  'GNQ', 'ERI', 'EST', 'SWZ', 'ETH', 'FJI', 'FIN', 'FRA', 'GAB', 'GMB', 'GEO', 'DEU', 'GHA', 
  'GRC', 'GRD', 'GTM', 'GIN', 'GNB', 'GUY', 'HTI', 'HND', 'HUN', 'ISL', 'IND', 'IRN', 'IRQ', 
  'IRL', 'ISR', 'ITA', 'JAM', 'JPN', 'JOR', 'KAZ', 'KEN', 'KIR', 'PRK', 'KOR', 'KWT', 'KGZ', 
  'LVA', 'LBN', 'LSO', 'LBR', 'LBY', 'LIE', 'LTU', 'LUX', 'MDG', 'MWI', 'MDV', 'MLI', 'MLT', 
  'MHL', 'MRT', 'MUS', 'MEX', 'FSM', 'MDA', 'MCO', 'MNG', 'MNE', 'MAR', 'MOZ', 'NAM', 'NRU', 
  'NPL', 'NLD', 'NZL', 'NIC', 'NER', 'NGA', 'MKD', 'NOR', 'OMN', 'PAK', 'PLW', 'PAN', 'PNG', 
  'PRY', 'PER', 'POL', 'PRT', 'QAT', 'ROU', 'RUS', 'RWA', 'KNA', 'LCA', 'VCT', 'WSM', 'SMR', 
  'STP', 'SAU', 'SEN', 'SRB', 'SYC', 'SLE', 'SVK', 'SVN', 'SLB', 'SOM', 'ZAF', 'SSD', 'ESP', 
  'LKA', 'SDN', 'SUR', 'SWE', 'CHE', 'SYR', 'TJK', 'TZA', 'TGO', 'TON', 'TTO', 'TUN', 'TUR', 
  'TKM', 'TUV', 'UGA', 'UKR', 'ARE', 'GBR', 'USA', 'URY', 'UZB', 'VUT', 'VEN', 'YEM', 'ZMB', 'ZWE'
];
const MIN_AGE = 4; 

function validateIdentity(icString, dobObj, countryCode) {
  const cleanIc = icString.replace(/[^\w]/g, '').trim(); 
  if (countryCode === 'MAS') {
    if (cleanIc.length !== 12 || !/^\d{12}$/.test(cleanIc)) return 'Malaysian MyKad must be exactly 12 digits.';
    const yy = parseInt(cleanIc.substring(0, 2), 10);
    const mm = parseInt(cleanIc.substring(2, 4), 10);
    const dd = parseInt(cleanIc.substring(4, 6), 10);
    const currentYearSuffix = new Date().getFullYear() % 100;
    const fullYear = yy > currentYearSuffix ? 1900 + yy : 2000 + yy;
    if (fullYear !== dobObj.getFullYear() || mm !== (dobObj.getMonth() + 1) || dd !== dobObj.getDate()) {
      return 'MyKad digits do not match the provided Date of Birth.';
    }
  } else {
    if (cleanIc.length < 4) return 'Passport / ID number is too short.';
  }
  return null; 
}

router.get('/template', async (req, res) => {
  try {
    const clubCode = req.query.clubCode || 'YOUR_CLUB';
    const beltLabels = [
      '10th Kup (White)', '9th Kup (White-Yellow)', '8th Kup (Yellow)', '7th Kup (Yellow-Green)',
      '6th Kup (Green)', '5th Kup (Green-Blue)', '4th Kup (Blue)', '3rd Kup (Blue-Red)',
      '2nd Kup (Red)', '1st Kup (Red-Black)', '1st Dan (Black)', '2nd Dan (Black)',
      '3rd Dan (Black)', '4th Dan (Black)', '5th Dan (Black)', '6th Dan (Black)'
    ];
    const workbook = new ExcelJS.Workbook();
    const dropSheet = workbook.addWorksheet('_Dropdowns', { state: 'veryHidden' });
    dropSheet.getColumn(1).values = ['Genders', 'M', 'F'];
    dropSheet.getColumn(2).values = ['YesNo', 'Yes', 'No'];
    dropSheet.getColumn(3).values = ['Belts', ...beltLabels];
    dropSheet.getColumn(4).values = ['Countries', ...COUNTRIES];
    const sheet = workbook.addWorksheet('Master Roster');
    sheet.columns = [
      { header: 'Club Code (Do Not Edit)', key: 'clubCode', width: 25 },
      { header: 'Full Name', key: 'fullName', width: 30 },
      { header: 'IC / Passport', key: 'icNumber', width: 25 },
      { header: 'Date of Birth (YYYY-MM-DD)', key: 'dob', width: 25 },
      { header: 'Gender (Select)', key: 'gender', width: 15 },
      { header: 'Belt Grade (Select)', key: 'belt', width: 25 },
      { header: 'Current Weight (kg)', key: 'weight', width: 20 },
      { header: 'Sparring/Kyorugi?', key: 'isSparring', width: 22 },
      { header: 'Pattern/Poomsae/Tul?', key: 'isPattern', width: 25 },
      { header: 'Nationality (ISO)', key: 'country', width: 20 }
    ];
    sheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };
    sheet.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF333333' } };
    sheet.getColumn('icNumber').numFmt = '@'; 
    sheet.getColumn('dob').numFmt = 'yyyy-mm-dd';
    sheet.getColumn('weight').numFmt = '0.00'; 
    for (let i = 2; i <= 151; i++) {
      const row = sheet.getRow(i);
      row.getCell('clubCode').value = clubCode;
      row.getCell('country').value = 'MAS';
      row.getCell('isSparring').value = 'Yes';
      row.getCell('isPattern').value = 'No';
      row.getCell('gender').dataValidation = { type: 'list', allowBlank: true, formulae: ['_Dropdowns!$A$2:$A$3'] };
      row.getCell('isSparring').dataValidation = { type: 'list', allowBlank: true, formulae: ['_Dropdowns!$B$2:$B$3'] };
      row.getCell('isPattern').dataValidation = { type: 'list', allowBlank: true, formulae: ['_Dropdowns!$B$2:$B$3'] };
      row.getCell('belt').dataValidation = { type: 'list', allowBlank: true, formulae: [`_Dropdowns!$C$2:$C$${beltLabels.length + 1}`] };
      row.getCell('country').dataValidation = { type: 'list', allowBlank: true, formulae: [`_Dropdowns!$D$2:$D$${COUNTRIES.length + 1}`] };
      row.getCell('weight').dataValidation = { type: 'decimal', operator: 'greaterThanOrEqual', formulae: [10] };
      row.getCell('clubCode').protection = { locked: true };
    }
    await sheet.protect('roar-secret-master', { selectLockedCells: true, selectUnlockedCells: true });
    for (let i = 2; i <= 151; i++) { sheet.getRow(i).eachCell({ includeEmpty: true }, (cell, colNumber) => { if (colNumber !== 1) cell.protection = { locked: false }; }); }
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="ROAR_Master_Roster_${clubCode}.xlsx"`);
    await workbook.xlsx.write(res);
    res.end();
  } catch (error) { res.status(500).json({ error: 'Failed to generate template' }); }
});

router.post('/club/:clubCode/upload', upload.single('file'), async (req, res) => {
  try {
    const clubCode = req.params.clubCode;
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(req.file.buffer);
    const worksheet = workbook.getWorksheet('Master Roster') || workbook.worksheets.find(sheet => sheet.name !== '_Dropdowns');
    if (!worksheet) return res.status(400).json({ error: 'Master Roster sheet not found.' });
    
    const headers = worksheet.getRow(1).values;
    const colMap = { name: -1, ic: -1, dob: -1, gender: -1, belt: -1, weight: -1, sparring: -1, pattern: -1, country: -1 };
    
    headers.forEach((h, idx) => {
      if (!h) return;
      const title = h.toString().toLowerCase();
      if (title.includes('name')) colMap.name = idx;
      if (title.includes('ic') || title.includes('passport')) colMap.ic = idx;
      if (title.includes('dob') || title.includes('birth')) colMap.dob = idx;
      if (title.includes('gender') || title.includes('sex')) colMap.gender = idx;
      if (title.includes('belt') || title.includes('rank')) colMap.belt = idx;
      if (title.includes('weight')) colMap.weight = idx;
      if (title.includes('sparring') || title.includes('kyorugi')) colMap.sparring = idx;
      if (title.includes('pattern') || title.includes('poomsae') || title.includes('tul')) colMap.pattern = idx;
      if (title.includes('country') || title.includes('nationality')) colMap.country = idx;
    });

    const athletesToInsert = [];
    const failedRows = []; 
    const warnings = [];   
    const safeGetCell = (row, colIndex) => colIndex === -1 ? null : row.getCell(colIndex).value;

    worksheet.eachRow((row, rowNumber) => {
      if (rowNumber === 1) return; 
      
      const rawName = safeGetCell(row, colMap.name);
      const rawIc = safeGetCell(row, colMap.ic);
      const dobCell = safeGetCell(row, colMap.dob);
      const rawWeight = safeGetCell(row, colMap.weight);
      
      if (!rawName && !rawIc && !dobCell && !rawWeight) return; 

      const fullName = (rawName || '').toString().trim().toUpperCase();
      const icNumber = (rawIc || '').toString().trim().toUpperCase();
      const dob = new Date(dobCell);
      const weight = rawWeight ? parseFloat(rawWeight) : NaN;
      const rawCountry = safeGetCell(row, colMap.country);
      const countryCode = rawCountry?.toString().substring(0,3).toUpperCase() || 'MAS';
      const rawSparring = safeGetCell(row, colMap.sparring);
      const rawPattern = safeGetCell(row, colMap.pattern);
      const isSparring = rawSparring?.toString().toLowerCase().trim() === 'yes' ? 1 : 0;
      const isPattern = rawPattern?.toString().toLowerCase().trim() === 'yes' ? 1 : 0;
      const rawGender = safeGetCell(row, colMap.gender);
      let gender = rawGender?.toString().toUpperCase().charAt(0) === 'F' ? 'F' : 'M';
      const rawBelt = safeGetCell(row, colMap.belt);
      const beltGrade = rawBelt?.toString() || '10th Kup (White)';

      let isRowValid = true;
      let errorMsg = '';
      const identityError = validateIdentity(icNumber, dob, countryCode);
      const age = new Date().getFullYear() - dob.getFullYear();

      if (!fullName) { isRowValid = false; errorMsg = 'Full Name is missing.'; }
      else if (!icNumber) { isRowValid = false; errorMsg = 'IC / Passport is missing.'; }
      else if (!dobCell || isNaN(dob.getTime())) { isRowValid = false; errorMsg = 'Invalid Date format.'; }
      else if (age < MIN_AGE) { isRowValid = false; errorMsg = `Athlete is too young (${age} yrs). Minimum age is ${MIN_AGE}.`; }
      else if (weight < 10 || isNaN(weight)) { isRowValid = false; errorMsg = 'Weight must be 10kg or higher.'; }
      else if (identityError) { isRowValid = false; errorMsg = identityError; }
      else if (isSparring === 0 && isPattern === 0) { isRowValid = false; errorMsg = 'Must participate in Sparring or Pattern.'; }

      if (isRowValid) {
        if (countryCode === 'MAS') {
          const cleanIc = icNumber.replace(/[^\d]/g, '');
          const lastDigit = parseInt(cleanIc.substring(11, 12), 10);
          const expectedGender = lastDigit % 2 === 0 ? 'F' : 'M';
          if (gender !== expectedGender) {
            gender = expectedGender; 
            warnings.push(`${fullName}: Gender auto-corrected to ${gender} based on MyKad.`);
          }
        }
        athletesToInsert.push([ clubCode, fullName, icNumber, dob, gender, beltGrade, weight, isSparring, isPattern, countryCode ]);
      } else {
        let formDob = '';
        if (dobCell && !isNaN(new Date(dobCell).getTime())) {
           formDob = new Date(dobCell).toISOString().split('T')[0];
        }
        failedRows.push({
          fullName, icNumber, dob: formDob, gender, beltGrade, 
          weightKg: isNaN(weight) ? '' : weight, 
          isSparring: isSparring === 1, isPattern: isPattern === 1, countryCode, errorMsg
        });
      }
    });

    if (athletesToInsert.length > 0) {
      await pool.query(`
        INSERT INTO athletes (clubCode, fullName, icNumber, dob, gender, beltGrade, weightKg, isSparring, isPattern, countryCode) 
        VALUES ? ON DUPLICATE KEY UPDATE 
          fullName = VALUES(fullName), dob = VALUES(dob), gender = VALUES(gender), beltGrade = VALUES(beltGrade), 
          weightKg = VALUES(weightKg), isSparring = VALUES(isSparring), isPattern = VALUES(isPattern), countryCode = VALUES(countryCode)
      `, [athletesToInsert]);
    }
    res.json({ success: true, importedCount: athletesToInsert.length, failedRows, warnings });
  } catch (error) { res.status(500).json({ error: 'Failed to process Excel file. Please use the standard template.' }); }
});

// ... (keep the rest of the file exactly the same)

// ==========================================
// 3. MANUAL CRUD OPERATIONS
// ==========================================
router.get('/club/:clubCode', async (req, res) => {
  try {
    const [athletes] = await pool.query(`SELECT id, clubCode, fullName, icNumber, DATE_FORMAT(dob, '%Y-%m-%d') as dob, gender, beltGrade, weightKg, isSparring, isPattern, countryCode, created_at FROM athletes WHERE clubCode = ? ORDER BY fullName ASC`, [req.params.clubCode]);
    res.json(athletes);
  } catch (error) { res.status(500).json({ error: 'Failed to fetch roster' }); }
});

router.post('/', async (req, res) => {
  try {
    let { clubCode, fullName, icNumber, dob, gender, beltGrade, weightKg, isSparring, isPattern, countryCode } = req.body;
    const age = new Date().getFullYear() - new Date(dob).getFullYear();
    if (age < MIN_AGE) return res.status(400).json({ error: `Athlete must be at least ${MIN_AGE} years old.` });
    
    countryCode = countryCode || 'MAS';
    const identityError = validateIdentity(icNumber, new Date(dob), countryCode);
    if (identityError) return res.status(400).json({ error: identityError });

    // STRICT GENDER ENFORCEMENT FOR MANUAL ADDS
    if (countryCode === 'MAS') {
      const cleanIc = icNumber.replace(/[^\d]/g, '');
      if (cleanIc.length === 12) {
        const lastDigit = parseInt(cleanIc.substring(11, 12), 10);
        gender = lastDigit % 2 === 0 ? 'F' : 'M';
      }
    }
    
    const [result] = await pool.query(`INSERT INTO athletes (clubCode, fullName, icNumber, dob, gender, beltGrade, weightKg, isSparring, isPattern, countryCode) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`, [clubCode, fullName.toUpperCase(), icNumber, dob, gender, beltGrade, weightKg, isSparring ? 1:0, isPattern ? 1:0, countryCode]);
    res.status(201).json({ success: true, id: result.insertId });
  } catch (error) {
    if (error.code === 'ER_DUP_ENTRY') return res.status(400).json({ error: 'An athlete with this IC number already exists in your roster.' });
    res.status(500).json({ error: 'Failed to add athlete' });
  }
});

router.put('/:id', async (req, res) => {
  try {
    let { fullName, icNumber, dob, gender, beltGrade, weightKg, isSparring, isPattern, countryCode } = req.body;
    const age = new Date().getFullYear() - new Date(dob).getFullYear();
    if (age < MIN_AGE) return res.status(400).json({ error: `Athlete must be at least ${MIN_AGE} years old.` });
    
    countryCode = countryCode || 'MAS';
    const identityError = validateIdentity(icNumber, new Date(dob), countryCode);
    if (identityError) return res.status(400).json({ error: identityError });

    // STRICT GENDER ENFORCEMENT FOR MANUAL EDITS
    if (countryCode === 'MAS') {
      const cleanIc = icNumber.replace(/[^\d]/g, '');
      if (cleanIc.length === 12) {
        const lastDigit = parseInt(cleanIc.substring(11, 12), 10);
        gender = lastDigit % 2 === 0 ? 'F' : 'M';
      }
    }
    
    await pool.query(`UPDATE athletes SET fullName=?, icNumber=?, dob=?, gender=?, beltGrade=?, weightKg=?, isSparring=?, isPattern=?, countryCode=? WHERE id=?`, [fullName.toUpperCase(), icNumber, dob, gender, beltGrade, weightKg, isSparring ? 1:0, isPattern ? 1:0, countryCode, req.params.id]);
    res.json({ success: true });
  } catch (error) {
    if (error.code === 'ER_DUP_ENTRY') return res.status(400).json({ error: 'Another athlete with this IC number already exists.' });
    res.status(500).json({ error: 'Failed to update athlete' });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    await pool.query('DELETE FROM athletes WHERE id=?', [req.params.id]);
    res.json({ success: true });
  } catch (error) { res.status(500).json({ error: 'Cannot delete athlete with active event registrations.' }); }
});

export default router;