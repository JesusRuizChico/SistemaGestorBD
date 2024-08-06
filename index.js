const express = require('express');
const mysql = require('mysql2/promise');
const bodyParser = require('body-parser');
const path = require('path');
const usuariosRutas=require("./routes/accionesRutas");
const session = require('express-session');
const bcrypt = require('bcrypt');
const { body, validationResult } = require('express-validator');

const app=express();
app.use("/",express.static(path.join(__dirname,"web")));
app.set("view engine","ejs");
app.use(express.urlencoded({extended:true}));
app.use("/",usuariosRutas);


const port=process.env.PORT;
app .listen(port,()=>{
    console.log("Servidor em http://127.0.0.1:"+port);
});