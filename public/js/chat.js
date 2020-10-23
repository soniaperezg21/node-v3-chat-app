//Es el cliente
// server (emit) -> client (receive) -- acknowledgement --> server
// client (emit) -> server (receive) -- acknowledgement --> client

const socket = io()  //socket es la misma variable que me manda el server en index.js
//Elements: Genero variable para no repetir.  $ es para decir que es un elemento de la forma
const $messageForm = document.querySelector('#message-form')
const $messageFormInput = $messageForm.querySelector('input')
const $messageFormButton = $messageForm.querySelector('button')
const $sendLocationButton = document.querySelector('#send-location')
const $messages = document.querySelector('#messages')   //Div en index.html

//Templates
const messageTemplate = document.querySelector('#message-template').innerHTML //es el de template script
const locationMessageTemplate = document.querySelector('#location-message-template').innerHTML //es el de template script
const sidebarTemplate = document.querySelector('#sidebar-template').innerHTML
//Options
const { username, room }= Qs.parse(location.search, { ignoreQueryPrefix: true })  //take the query string del url. Ignore es para quitar ?


// //event y funcion callback
// socket.on('countUpdated', (count) => {   //Checar por el evento  del socket y los datos recibidos
//     console.log('The count has been updated!', count)  //Mostrams los datos recibidos   
// })  

// //Eventos del bottón
// document.querySelector('#increment').addEventListener('click', () => {
//     console.log('Clicked')
//     socket.emit('increment')  //Emitir datos del cte al servidor,, en este caso el evento increment cuando el usuario da click en el botón
// })

//Para que haga el autoscroll (sse posicione abajo el mensaje) al mandar mensaje o location
const autoscroll = () => {
    //New message element
    const $newMessage = $messages.lastElementChild  //Es el mensaje nuevo
    
    //Height of the new message
    const newMessageStyles = getComputedStyle($newMessage)
    const newMessageMargin = parseInt(newMessageStyles.marginBottom)  //convierte la altura a entera
    const newMessageHeight = $newMessage.offsetHeight + newMessageMargin  //Altura + margin

    //Visible Height in pixels
    const visibleHeight = $messages.offsetHeight  //Altura del contenedor
    //Height of messages container
    const containerHeight = $messages.scrollHeight
    //How far have I scrolled ?
    const scrollOffset = $messages.scrollTop + visibleHeight

   //console.log(containerHeight,  newMessageHeight, scrollOffset, $messages.scrollHeight)
    if (containerHeight - newMessageHeight <= scrollOffset) {
       // console.log('entro ', $messages.scrollHeight)
        $messages.scrollTop = $messages.scrollHeight
    }
}

//Para renderizar en el div y no console.log con Moustache
socket.on('message', (message) => {   //Checar por el evento  del socket y los datos recibidos
    console.log(message)
    const html = Mustache.render(messageTemplate, {  //Renderiza lo del template
        username: message.username,
        message: message.text,  //Recibió un objeto, envió los elementos que deseo renderizar 
        createdAt: moment(message.createdAt).format('h:mm a')     //De la libreria Moment 
    })
    $messages.insertAdjacentHTML('beforeend', html)
    autoscroll()
})

//Cachar el evento y enviarlo a otra div
socket.on('locationMessage', (message) => {
    console.log(message)
    const html = Mustache.render(locationMessageTemplate, {  //Renderiza lo del template
        username: message.username,
        url: message.url,  //enviar valor
        createdAt: moment(message.createdAt).format('h:mm a')     //De la libreria Moment 
    })
    $messages.insertAdjacentHTML('beforeend', html)  //At the bottom of the list
    autoscroll()
})

//Evento para mostrar los datos del room
socket.on('roomData', ({ room, users}) => {
    //Con mustache renderizamos
    const html = Mustache.render(sidebarTemplate, {
        room,
        users
    })
    //Para renderizarlo en el div de la izq
    document.querySelector('#sidebar').innerHTML = html
})

//enviar el mensaje y send (submit)
$messageForm.addEventListener('submit', (e) => {
    e.preventDefault()
    //disable the form button
    $messageFormButton.setAttribute('disabled', 'disabled')

    //const message = document.querySelector('input').value
    const message = e.target.elements.message.value  //e es la forma 

    socket.emit('SendMessage', message, (error) => {
        //enable the form button
        $messageFormButton.removeAttribute('disabled')
        $messageFormInput.value = ''  //limpiar el input
        $messageFormInput.focus()

        if (error) {
            return console.log(error)
        }
        console.log('Message delivered!')  //para decir que algo se entregó es la notificación
    })
})

//Botón-click
$sendLocationButton.addEventListener('click', () => {
    if (!navigator.geolocation) {
        return alert('Geolocation is not supported by your browser.')
    }
    //Deshabilitar el botón
    $sendLocationButton.setAttribute('disabled','disabled')

    navigator.geolocation.getCurrentPosition((position) => {
        //console.log(position)
        socket.emit('sendLocation', {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude
    }, () => { //parametro del callback es el acknowledment
        //Habilitar el botón
        $sendLocationButton.removeAttribute('disabled')

        console.log('Location shared!') 
    })
    
    })
})

//Cuando oprimen botón de index.html
socket.emit('join', { username, room }, (error ) => {  //función para manejar el error
    if (error) {
        alert(error)
        location.href = '/'  //redirigir ala pagina root 
    }    
})
