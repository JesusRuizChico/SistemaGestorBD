// Acciones de autenticación y registro
app.post('/login', async (req, res) => {
    const { username, password } = req.body;
    const [rows] = await connection.query('SELECT * FROM users WHERE username = ?', [username]);
    const user = rows[0];

    if (user && await bcrypt.compare(password, user.password)) {
        req.session.user = user;
        return res.redirect('/index');
    }

    res.status(401).send('Invalid credentials');
});

app.post('/register', async (req, res) => {
    const { username, password } = req.body;
    const hashedPassword = await bcrypt.hash(password, 10);
    await connection.query('INSERT INTO users (username, password, role) VALUES (?, ?, ?)', [username, hashedPassword, 'user']);
    res.redirect('/auth');
});

// Acciones de manejo de bases de datos y tablas
app.post('/create-database', async (req, res) => {
    try {
        const { databaseName } = req.body;
        await connection.query(`CREATE DATABASE IF NOT EXISTS ${mysql.escapeId(databaseName)}`);
        res.redirect('/');
    } catch (err) {
        res.status(500).send('Error creating database: ' + err.message);
    }
});

app.post('/create-table', async (req, res) => {
    try {
        const { databaseName, tableName, fieldNames, fieldTypes, fieldSizes } = req.body;
        await connection.changeUser({ database: databaseName });

        const fields = [];
        for (let i = 0; i < fieldNames.length; i++) {
            let field = `${mysql.escapeId(fieldNames[i])} ${fieldTypes[i]}`;
            if (fieldTypes[i] === 'VARCHAR') {
                field += `(${fieldSizes[i]})`;
            }
            fields.push(field);
        }

        const createTableQuery = `
            CREATE TABLE IF NOT EXISTS ${mysql.escapeId(tableName)} (
                id INT AUTO_INCREMENT PRIMARY KEY,
                ${fields.join(', ')}
            )
        `;
        await connection.query(createTableQuery);
        res.redirect('/');
    } catch (err) {
        res.status(500).send('Error creating table: ' + err.message);
    }
});

app.post('/insert-data', async (req, res) => {
    try {
        const { databaseName, tableName, ...data } = req.body;
        await connection.changeUser({ database: databaseName });
        const fields = Object.keys(data);
        const values = Object.values(data);
        await connection.query(`INSERT INTO ?? (??) VALUES (?)`, [tableName, fields, values]);
        res.redirect('/');
    } catch (err) {
        res.status(500).send('Error inserting data: ' + err.message);
    }
});

app.post('/update-data', async (req, res) => {
    try {
        const { databaseName, tableName, id, ...data } = req.body;
        await connection.changeUser({ database: databaseName });

        // Construye las partes SET de la consulta asegurando el escape de nombres de campo y valores
        const fields = Object.keys(data).map(field => `${mysql.escapeId(field)} = ?`).join(', ');
        const values = Object.values(data).concat(id);

        // Construye y ejecuta la consulta de actualización
        const updateQuery = `UPDATE ?? SET ${fields} WHERE id = ?`;
        await connection.query(updateQuery, [tableName, ...values]);

        res.redirect('/');
    } catch (err) {
        res.status(500).send('Error updating data: ' + err.message);
    }
});

app.post('/delete-data', async (req, res) => {
    try {
        const { databaseName, tableName, id } = req.body;
        await connection.changeUser({ database: databaseName });
        await connection.query(`DELETE FROM ?? WHERE id = ?`, [tableName, id]);
        res.redirect('/');
    } catch (err) {
        res.status(500).send('Error deleting data: ' + err.message);
    }
});

app.post('/drop-table', async (req, res) => {
    try {
        const { databaseName, tableName } = req.body;
        await connection.changeUser({ database: databaseName });
        await connection.query(`DROP TABLE IF EXISTS ??`, [tableName]);
        res.redirect('/');
    } catch (err) {
        res.status(500).send('Error dropping table: ' + err.message);
    }
});