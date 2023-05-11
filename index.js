
// importaciones
const express = require('express');
const app = express();
const exphbs = require('express-handlebars');
const expressFileUpload = require('express-fileupload');
const bodyParser = require('body-parser');
const jwt = require('jsonwebtoken');
const secretKey = 'Shhhh';
const methodOverride = require('method-override');

const { nuevoUsuario, getUsuarios, setUsuarioStatus, getUsuario, functionEliminar, functionActualizar } = require('./consultas');

//servidor
const puerto = process.env.PORT || 3000
app.listen(puerto, console.log('servidor en puerto:', puerto));

//Middlewares

//recibe carga de imagenes
app.use(bodyParser.urlencoded({ extended: false }));
app.use(methodOverride('_method'))

//recibir pailot de consultas put y post
app.use(bodyParser.json());

//contenido de carpeta public declarado como estatico
app.use(express.static(__dirname + '/public'));

//configuracion de FileUpload
app.use(
    expressFileUpload({
        limits: { fileSize: 5000000 },
        abortOnLimit: true,
        responseOnLimit: 'El tamaño de la imagen supera el limite permitido',
    })
);

//configuracion de css, que accedera directamente a carpeta de bootstrap descargado en node_modules
app.use('/css', express.static(__dirname + '/node_modules/bootstrap/dist/css'));

// Condiguracion handlebars
app.engine(
    'handlebars',
    exphbs.engine({
        defaultLayout: 'main',
        layoutsDir: `${__dirname}/views/mainLayout`,
    })
);
app.set('view engine', 'handlebars');

// Rutas

//● La vista correspondiente a la ruta raíz debe mostrar todos los participantes registrados y su estado de revisión.
app.get('/', async (req, res) => {    
    try {
        const usuarios = await getUsuarios();               
        res.render('index', { usuarios });     
    } catch (e) {
        res.status(500).send({
            error: `Algo salio mal...${e}`,
            code: 500
        })        
    }
})

// ● El sistema debe permitir registrar nuevos participantes.
app.get('/Registro', async (req, res) => {
    res.render('Registro');
})

app.post('/Registro', async (req, res) => {
    const { email, nombre, password, repitaPassword, experiencia, especialidad} = req.body; 
    const estado = false; 
    const experienciaNum = +experiencia; 
    if (Object.keys(req.files).length == 0) {
        return res.status(400).send('no se encontro ningun archivo en la consulta');
    }  
    const {files}=req
    const { foto }= files;
    const{name}= foto;    
    const newName = (`http://localhost:`+ puerto +`/uploads/${name}`);
        
    try {
        const usuario = await nuevoUsuario( email, nombre, password, experienciaNum, especialidad, newName, estado );
        foto.mv(`${__dirname}/public/uploads/${name}`, async (err) => {
            if (err) return res.status(500).send({
                error: `algo salio mal... ${err}`,
                code: 500
            })            
        })       
        res.redirect('/');   
    } catch (e) {
        res.status(500).send({
            error: `Algo salio mal...${e}`,
            code: 500
        })       
    }
})

// ● La vista del administrador debe mostrar los participantes registrados y permitir aprobarlos para cambiar su estado. 
app.put('/index', async (req, res)=>{
    const { estado, id } = req.body;    
    try {
        const usuario = await setUsuarioStatus(estado, id);
        res.status(200).send(JSON.stringify(usuario));
    } catch (e) {
        res.status(500).send({
            error: `Algo salio mal...${e}`,
            code: 500
        })
    }
    
})

app.get('/Admin', async (req, res) => {    
    try {
        const usuarios = await getUsuarios();   
        res.render('Admin', { usuarios });     
    } catch (e) {
        res.status(500).send({
            error: `Algo salio mal...${e}`,
            code: 500
        });        
    }
})

// ● Se debe crear una vista para que los participantes puedan iniciar sesión con su correo y contraseña.
app.get('/Login', async (req, res) => {
    res.render('Login')
});

app.post('/Login', async function (req, res) {
    const { email, password } = req.body;    
    const user = await getUsuario(email, password);   
    if(user) {
        if (user.estado) {
            const token = jwt.sign({
                    exp: Math.floor(Date.now() / 1000) + 180,
                    data: user,
                },secretKey
            );                    
            res.redirect(`/Datos?token=${token}`);
            
        } else {
            res.status(401).send({
                error: 'Este usuario se encuentra en evaluacion',
                code: 401,
            });
        }                
    } else {
        res.status(404).send({
            error: 'Este usuario no se ha registrado',
            code: 404,
        });
    }

});

// ● Luego de iniciar la sesión, los participantes deberán poder modificar sus datos, exceptuando el correo electrónico y su foto. Esta vista debe estar protegida con JWT y los datos que se utilicen en la plantilla deben ser extraídos del token.
app.get('/Datos', function (req, res) {
    const { token } = req.query;
    jwt.verify(token, secretKey, (err, decoded) => {
        const { data } = decoded;
        const { nombre, email, password, repitaPassword, anos_experiencia, especialidad } = data;       
        err
            ? res.status(401).send(
                res.send({
                    error: '401 Unauthorized',
                    message: 'Usted no esta autorizado para estar aqui',
                    token_error: err.message,
                })
            )
            : res.render('Datos', { nombre, email, password, repitaPassword, anos_experiencia, especialidad });
    });
});

app.put('/actualizar/:email', async (req, res) => {      
    const { email,nombre, password, repitaPassword, experiencia, especialidad } = req.body;
    const experienciaNum = +experiencia;      
    await functionActualizar(nombre, password, experienciaNum, especialidad, email);    
    res.redirect('/');   
})

app.delete('/eliminar/:email', async (req, res) => {          
    const email = req.params.email;   
    await functionEliminar(email);
    res.redirect('/');   
});






