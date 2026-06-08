const mysql = require('mysql2/promise');
mysql.createConnection({host:'localhost', user:'root', password:'12345', database:'vsp_inventory'})
.then(c => c.query('UPDATE users SET password_hash = ?', ['$2a$10$hCJ0HfkF2hZHZe/SzD3FAep4Xf223uvTfmHHXkSIiW7vRG9iwIuuy'])
.then(() => console.log('Hash Fixed Properly'))
.finally(() => c.end()));
