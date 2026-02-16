const http = require('http');
const fs = require('fs');
const url = require('url');
const querystring = require('querystring');

const port = process.env.PORT || process.env.NODE_PORT || 3000;

const users = {};

const serveFile = (res, filePath, contentType) => {
	fs.readFile(filePath, (err, data) => {
		if (err) {
			res.writeHead(500);
			res.end();
			return;
		}

		res.writeHead(200, { 'Content-Type': contentType });
		res.end(data);
	});
};

const respondJSON = (req, res, status, obj) => {
	res.writeHead(status, { 'Content-Type': 'application/json' });

	// HEAD responses can't include a body
	if (req.method === 'HEAD') {
		res.end();
		return;
	}

	res.end(JSON.stringify(obj));
};

const getUsers = (req, res) => {
	const response = {
		users,
	};

	respondJSON(req, res, 200, response);
};

const notFound = (req, res) => {
	const response = {
		message: 'The page you are looking for was not found.',
		id: 'notFound',
	};

	respondJSON(req, res, 404, response);
};

const addUser = (req, res, body) => {
	const params = querystring.parse(body);

	const name = params.name;
	const age = params.age;

	if (!name || !age) {
		const response = {
			message: 'Name and age are both required.',
			id: 'addUserMissingParams',
		};

		respondJSON(req, res, 400, response);
		return;
	}

	const isNewUser = !users[name];

	users[name] = {
		name,
		age: `${age}`,
	};

	if (isNewUser) {
		const response = {
			message: 'Created Successfully',
		};

		respondJSON(req, res, 201, response);
		return;
	}

	// 204 can't include a body
	res.writeHead(204, { 'Content-Type': 'application/json' });
	res.end();
};

const parseBody = (req, res, handler) => {
	let body = '';

	req.on('error', () => {
		res.writeHead(400);
		res.end();
	});

	req.on('data', (chunk) => {
		body += chunk;
	});

	req.on('end', () => {
		handler(req, res, body);
	});
};

const onRequest = (req, res) => {
	const parsedUrl = url.parse(req.url, true);
	const pathname = parsedUrl.pathname;

	// Home page + CSS
	if (pathname === '/') {
		serveFile(res, './client/client.html', 'text/html');
		return;
	}

	if (pathname === '/style.css') {
		serveFile(res, './client/style.css', 'text/css');
		return;
	}

	// API routes
	if (pathname === '/getUsers') {
		if (req.method === 'GET' || req.method === 'HEAD') {
			getUsers(req, res);
			return;
		}

		notFound(req, res);
		return;
	}

	if (pathname === '/addUser') {
		if (req.method === 'POST') {
			parseBody(req, res, addUser);
			return;
		}

		notFound(req, res);
		return;
	}

	// /notReal should 404 for GET/HEAD
	notFound(req, res);
};

http.createServer(onRequest).listen(port);
