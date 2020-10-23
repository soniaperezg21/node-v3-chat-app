/* - Initialize npm from the project root (darle enter a todo y yes):   npm init
  -Install Express consola:   npm i express
 - Setup a Express Server: const express = requiere('express')   const app = express()
  - Serve up the public directory: Generar el directory y comandos de abajo
  - Listen on port 3000
  - Create index.html
  - Render "Chat app " to the screen en terminal: node src/index.js  y en navegador localhost:3000 y se ve index.html
  - Create a start script: abrir package.json, eliminar linea de test y agregar   "start": "node src/index.js",
    "dev": "nodemon src/index.js"
  - Install nodemon and a development dependency:En terminal npm i nodemon --save-dev
  - Create a dev script to start app:terminal    npm run start       npm run dev

  - WebSocketProtocol: Cuando el cliente se conecta al browser queda una conexión persistente (full duplex communi)
    Por ejemplo los chats (bidireccional). con http se pierde cuando contesta al cliente, y espero otra solicitud
    Otros clientes pueden ver los mensajes de otros usuarios.
  - socket.io: Para trabajar con sockets.  npm i socket   
        Requiere express esté configurado de manera diferente   const http = require('http') const server = http.createServer(app) Refractor
  - Pasar datos de clientes a server
  -- Geolocación   Geolocation API --- mdn geolocation  de mozilla (no hay que instalar nada)
  -- Para google maps: http://google.com/maps?q=0,0  latitude y longitud
  -- Para evitar malas palabras en los mensajes:  npm i bad-words      
  -- moustache : render templates es el <script> que insertamos
  -- moment: to manipulate time
  -- qs: query string: para obtener los valores del url
  -- getComputedStyle obtiene todos los estilos de un elemento
  -- Deploy in Heroku: 
  --    cd chat-app, teclear git init, crear en directorio principal de proyecto  .gitignore file
  --    dentro de gitignore teclar node_modules, git status 
  
  
  */
const path = require('path')  //No es necesario instalar
const http = require('http')  
const express = require('express')   //Setup a Express Server
const socketio = require('socket.io')
const Filter = require('bad-words')
const { generateMessage, generateLocationMessage } = require('./utils/messages')
const {addUser, removeUser, getUser, getUsersInRoom } = require('./utils/users')

const app = express()
const server = http.createServer(app)  //para el socket
const io = socketio(server)  //socket espera app ser creada conn http (Con esto el server soporta web sockets)

const port = process.env.PORT || 3000  //Listen on port 3000 (después hay que meter en environm var)
//Serve up the public directory
const publicDirectoryPath = path.join(__dirname, '../public')  //Ahí va a estar index.html
app.use(express.static(publicDirectoryPath))

//let count = 0

//Eventos del socket
// server (emit) -> client (receive) - CountApdated
// client (emit) -> server (receive) - increment
io.on('connection', (socket) => {  //socket es el data  -> evento cuando se conectan
    console.log('New websocket connection') //Para que salga tuve que poner src en el index.html y chat.js -> io()
    
    // socket.emit('countUpdated', count)  //Envia datos al cliente: evento y datos
    // socket.on('increment', () => {  //Cuando el evento increment que el cliente envia
    //     count++  //Incrementa la variable
    //     //socket.emit('countUpdated', count)  //Envia datos a una conexión especifica y no a todas: evento y datos
    //     io.emit('countUpdated', count) //lo emite a todas las conexiones abiertas
    // })
    //Las 3 formas de emit: socket.emit   socket.broadcast   io.emit

    //Listener para join
    //socket.on('join', ({ username, room }, callback) => {
    socket.on('join', (options, callback) => {
        //const { error, user } = addUser({ id:socket.id, username, room }) // agregar al array, de regreso tengo error o user
        const { error, user } = addUser({ id:socket.id, ...options }) // agregar al array, de regreso tengo error o user
        if (error) {
            return callback(error)
        }
        
        
        socket.join(user.room) //Emit el event join

        // io.to.emit  //Lo manda a todos menos al cliente de un specific chat room
        socket.emit('message', generateMessage('Admin', 'Welcome!'))  //socket.emit Lo emite solo al cliente que lo envió, vamos a enviar una variable o un objeto
        //socket.broadcast.emit('message', generateMessage ('A new user has joined!'))  //Lo envia a todos menos al cliente que lo generó
        socket.broadcast.to(user.room).emit('message', generateMessage (`${user.username} has joined!`))  //Lo envia a todos menos al cliente que lo generó pero que sean room
    
        io.to(user.room).emit('roomData', {
            room: user.room,
            users: getUsersInRoom(user.room)
        })
        
        callback()  //Para avisar al cliente que no hubo error
    })

    socket.on('SendMessage', (message, callback) => {
        const user = getUser(socket.id)
        const filter = new Filter()
        //Si hay malas palabras  mando un mensaje y ya no emito el mensjale del cliente
        if (filter.isProfane(message)) {
            return callback('Profanity is not allowed !')
        }
        io.to(user.room).emit('message', generateMessage(user.username, message)) //Lo emite a todas las conexiones
        callback('')  //mensaje de confirmación: Blanco no error
    })


    socket.on('sendLocation', (coords, callback) => {
        const user = getUser(socket.id)
        io.to(user.room).emit('locationMessage', generateLocationMessage(user.username, `https://google.com/maps?q=${coords.latitude},${coords.longitude}`) ) //Envia la liga en el explorador
        callback()
    })
    //Cuando el cliente se desconecta (al cerrar el explorador o el tab)
    socket.on('disconnect', () => {
        const user = removeUser(socket.id)
        
        if (user) {
            io.to(user.room).emit('message', generateMessage('Admin', `${user.username} has left!`))
            io.to(user.room).emit('roomData', {
                room: user.room,
                users: getUsersInRoom(user.room)
            })
        
        }
    })  
})


server.listen(port, () => { //port, callback function  //SE usa serveren  lugar de app para el socket
    console.log(`Server is up on port ${port}!`)
})
