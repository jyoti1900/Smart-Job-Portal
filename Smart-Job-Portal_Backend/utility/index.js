const crypto = require('crypto');


exports.encryptPassword = (password) => {
    const algorithm = 'aes-192-cbc';
    const key = crypto.scryptSync(process.env.KEY, 'salt', 24);
    // Use `crypto.randomBytes` to generate a random iv instead of the static iv
    // shown here.
    const iv = Buffer.alloc(16, 0); // Initialization vector.

    const cipher = crypto.createCipheriv(algorithm, key, iv);

    let encrypted = cipher.update(password, 'utf8', 'hex');
    encrypted += cipher.final('hex');

    return encrypted;
}

exports.decryptPassword = (encrypted) => {
    const algorithm = 'aes-192-cbc';
    // const password = 'Password used to generate key';
    // Use the async `crypto.scrypt()` instead.
    const key = crypto.scryptSync(process.env.KEY, 'salt', 24);
    // The IV is usually passed along with the ciphertext.
    const iv = Buffer.alloc(16, 0); // Initialization vector.

    try {
        const decipher = crypto.createDecipheriv(algorithm, key, iv);

        // Encrypted using same algorithm, key and iv.
        // const encrypted = 'e5f79c5915c02171eec6b212d5520d44480993d7d622a7c4c2da32f6efda0ffa';
        let decrypted = decipher.update(encrypted, 'hex', 'utf8');
        decrypted += decipher.final('utf8');

        return decrypted;
    } catch (err) {
        return false;
    }
}