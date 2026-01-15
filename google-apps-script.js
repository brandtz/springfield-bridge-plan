/**
 * Google Apps Script for Springfield Bridge Plan Signature Collection
 * 
 * SETUP INSTRUCTIONS:
 * 1. Create a new Google Sheet
 * 2. Go to Extensions > Apps Script
 * 3. Delete any code in the editor and paste this entire file
 * 4. Save the project (give it a name like "Bridge Plan Signatures")
 * 5. Click "Deploy" > "New deployment"
 * 6. Select type: "Web app"
 * 7. Set "Execute as": "Me"
 * 8. Set "Who has access": "Anyone"
 * 9. Click "Deploy" and authorize the app
 * 10. Copy the Web App URL and paste it into js/main.js CONFIG.GOOGLE_SHEETS_URL
 */

// Sheet name where signatures will be stored
const SHEET_NAME = 'Signatures';

/**
 * Handle GET requests - Returns signature count and public comments
 */
function doGet(e) {
  try {
    const sheet = getOrCreateSheet();
    const count = Math.max(0, sheet.getLastRow() - 1); // Subtract header row
    
    // Get public comments (where displayName = 'Yes' and has a comment)
    const data = sheet.getDataRange().getValues();
    const comments = [];
    
    for (let i = 1; i < data.length; i++) {
      // Column 7 = Display Name Publicly, Column 6 = Comment
      if (data[i][7] === 'Yes' && data[i][6] && data[i][6].toString().trim() !== '') {
        comments.push({
          firstName: data[i][1],
          lastInitial: data[i][2] ? data[i][2].toString().charAt(0).toUpperCase() + '.' : '',
          role: data[i][5] || 'Community Member',
          comment: data[i][6]
        });
      }
    }
    
    return ContentService
      .createTextOutput(JSON.stringify({ count: count, comments: comments }))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (error) {
    return ContentService
      .createTextOutput(JSON.stringify({ error: error.message, count: 0, comments: [] }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

/**
 * Handle POST requests - Adds new signature
 */
function doPost(e) {
  try {
    const sheet = getOrCreateSheet();
    const data = JSON.parse(e.postData.contents);
    
    // Validate required fields
    if (!data.firstName || !data.lastName || !data.email || !data.zip) {
      throw new Error('Missing required fields');
    }
    
    // Check for duplicate email
    if (isDuplicateEmail(sheet, data.email)) {
      return ContentService
        .createTextOutput(JSON.stringify({ 
          success: false, 
          error: 'This email has already signed the petition' 
        }))
        .setMimeType(ContentService.MimeType.JSON);
    }
    
    // Add the signature
    sheet.appendRow([
      data.timestamp || new Date().toISOString(),
      data.firstName,
      data.lastName,
      data.email,
      data.zip,
      data.role || '',
      data.comment || '',
      data.displayName ? 'Yes' : 'No',
      data.updates ? 'Yes' : 'No'
    ]);
    
    const count = sheet.getLastRow() - 1;
    
    return ContentService
      .createTextOutput(JSON.stringify({ success: true, count: count }))
      .setMimeType(ContentService.MimeType.JSON);
      
  } catch (error) {
    return ContentService
      .createTextOutput(JSON.stringify({ success: false, error: error.message }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

/**
 * Get existing sheet or create new one with headers
 */
function getOrCreateSheet() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(SHEET_NAME);
  
  if (!sheet) {
    sheet = ss.insertSheet(SHEET_NAME);
    // Add headers
    sheet.appendRow([
      'Timestamp',
      'First Name',
      'Last Name',
      'Email',
      'ZIP Code',
      'Role',
      'Comment',
      'Display Name Publicly',
      'Receive Updates'
    ]);
    // Format header row
    sheet.getRange(1, 1, 1, 9).setFontWeight('bold').setBackground('#1e40af').setFontColor('#ffffff');
    sheet.setFrozenRows(1);
  }
  
  return sheet;
}

/**
 * Check if email already exists in the sheet
 */
function isDuplicateEmail(sheet, email) {
  const data = sheet.getDataRange().getValues();
  const emailColumn = 3; // Email is in column D (index 3)
  
  for (let i = 1; i < data.length; i++) { // Start at 1 to skip header
    if (data[i][emailColumn] && data[i][emailColumn].toLowerCase() === email.toLowerCase()) {
      return true;
    }
  }
  return false;
}

/**
 * Utility function to get all signatures (for admin use)
 */
function getAllSignatures() {
  const sheet = getOrCreateSheet();
  const data = sheet.getDataRange().getValues();
  return data;
}

/**
 * Utility function to get public signatures (display name = Yes)
 */
function getPublicSignatures() {
  const sheet = getOrCreateSheet();
  const data = sheet.getDataRange().getValues();
  const publicSignatures = [];
  
  for (let i = 1; i < data.length; i++) {
    if (data[i][7] === 'Yes') { // Display Name Publicly column
      publicSignatures.push({
        firstName: data[i][1],
        lastName: data[i][2].charAt(0) + '.', // Last initial only
        role: data[i][5],
        comment: data[i][6]
      });
    }
  }
  
  return publicSignatures;
}
