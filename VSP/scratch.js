const bcrypt = require('bcryptjs');

async function check() {
    const hash = '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi';
    const match1 = await bcrypt.compare('admin123', hash);
    const match2 = await bcrypt.compare('password', hash);
    const match3 = await bcrypt.compare('password123', hash);
    console.log('admin123:', match1);
    console.log('password:', match2);
    console.log('password123:', match3);
}

check();
