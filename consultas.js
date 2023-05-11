// Se debe persistir la información de los usuarios en PostgreSQL
require('dotenv').config();

const { Pool } = require('pg');

const pool = new Pool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT,
    database: process.env.DB_NAME,

});

const nuevoUsuario = async ( email, nombre, password,experienciaNum,especialidad, newName, estado ) => {    
    const dbQuery = {
        text: 'INSERT INTO skaters (email, nombre, password, anos_experiencia, especialidad, foto, estado ) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *',
        values: [email, nombre, password, experienciaNum, especialidad, newName, estado ]
    }
    const result = await pool.query(dbQuery);   
    const usuario = result.rows[0];
    return usuario;
}

async function getUsuarios() {
    const result = await pool.query(`SELECT * FROM skaters`);
    return result.rows;
}

async function setUsuarioStatus(estado, id) {
    const dbQuery = {
        text: 'UPDATE skaters SET estado = $1 WHERE id = $2 RETURNING *',
        values: [estado, id]
    };
    const result = await pool.query(dbQuery);
    const usuario = result.rows[0];
    return usuario;
}

async function getUsuario(email, password) {
    const dbQuery = {
        text: 'SELECT * FROM skaters WHERE email = $1 AND password = $2',
        values: [email, password]
    };
    const result = await pool.query(dbQuery);
    return result.rows[0];
}

async function functionEliminar(email) {
    const dbQuery = {
        text: 'DELETE FROM skaters WHERE email = $1 RETURNING *',
        values: [email]
    }
    const result = await pool.query(dbQuery);   
    const usuario = result.rows[0];
    return usuario;
    
}

async function functionActualizar(nombre, password, experienciaNum, especialidad, email) {
    const dbQuery = {
        text: 'UPDATE skaters SET nombre = $1, password = $2, anos_experiencia = $3, especialidad = $4  WHERE email = $5 RETURNING *',        
        values: [nombre, password, experienciaNum, especialidad, email]
    }
    const result = await pool.query(dbQuery);   
    const usuario = result.rows[0];
    return usuario;        
}

module.exports = {
    nuevoUsuario,
    getUsuarios,
    setUsuarioStatus, 
    getUsuario, 
    functionEliminar,
    functionActualizar
}