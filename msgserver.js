var http = require('http'),
	sockjs = require('sockjs'),
	server = http.createServer(),
	webSockets,
	buffer = [],
	
	usersList = {
		cookieAsConn: {},
	};
	usersList.Add = function(userId, conn){
		usersList.cookieAsConn[userId] = conn;
	};
	usersList.Remove = function(userId){
		delete usersList.cookieAsConn[userId];
	};
	usersList.GetConn = function(userId){
		return usersList.cookieAsConn[userId];
	};
	
//-----------------MYSQL------------------------
var mysql = require('mysql');
var mysqlClient = mysql.createConnection({
	user: 'lduser',
	password: 'qweqwe',
	host: 'localhost',
	port: '3306',
	database: 'livedirect',
});
mysqlClient.connect(function(err) {
  // connected! (unless `err` is set)
  });
//-----------------/MYSQL------------------------

//Отправить соединению по ID
function whisper(conn, message) {
	conn.write( JSON.stringify(message) );
}
//Отправить всем
function broadcast (message, exclude) {
	for ( var i in usersList.cookieAsConn ) {
		if ( i != exclude ) usersList.GetConn(i).write( JSON.stringify(message) );
	}
}

//-------------------------SERVER---------------------------------
function onConnection(conn){
	//usersList.Add(conn.id, conn);

	conn.on('data', function onDataCB (data) {
		data = JSON.parse(data);
		
		if(data.type == "sendUserToken"){
			var token;
			if(data.token == null || data.token == "")
			{
				//TODO: Генерация нового токена и отправка клиенту
				token = "Сгенерированный токен";
				whisper(conn,{type: "setNewUserToken", token: token})
			}
			else
			{
				token = data.token;
				whisper(conn,{type: "confirmUserToken", token: token})
			}
			//TODO: Добавить в массив 'token = conn';
		}
		
		if(data.type == "RequestHistory"){
			//TODO: Выбрать всю историю для пользователя с токеном data.token и отправить ему;
			var messages = "Сообщения из переписки...";
			whisper(conn,{type: "receiveHistory", history: messages})
		}
		
		//TODO: Добавить обработку отправки сообщений;
	/* Обработка сообщений
		if(data.type == 'text'){
			if(!data.message) return;
			data.message = data.message.substr(0, 128);

			if ( buffer.length > 15 ) buffer.shift();
			buffer.push(data.message);

			var post  = {text: 'Hello MySQL'};
			var query = mysqlClient.query('INSERT INTO msg SET ?', post, function(err, result) {
			// Neat!
			});
			broadcast({ type: 'message', message: data.message, id: conn.id });
		}
	*/
	});

	conn.on('close', function onCloseCB () {
		usersList.Remove(conn.id);
		//broadcast({ type: 'userLeft' });
	});
}
//-------------------------/SERVER---------------------------------
webSockets = sockjs.createServer();
webSockets.on('connection', onConnection);

webSockets.installHandlers(server, { prefix:'' } );
server.listen(9999, '0.0.0.0');