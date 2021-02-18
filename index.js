const http = require("http");
const url = require("url");
const { Producer } = require('sqs-producer');
require('dotenv').config();

const producer = Producer.create({
    queueUrl: process.env.QUEUE_URL,
    region: process.env.AWS_REGION,
    accessKeyId: process.env.AWS_ACCESS_KEY,
    secretAccessKey: process.env.AWS_SECRET_KEY
});

const args = process.argv.slice(2);
const port = args.length ? args[0] : 3000;

const sendMessage = async (message) => {
    console.log('Sending message')
    // send a message to the queue with a specific ID (by default the body is used as the ID)
    await producer.send({
        id: `${Date.now()}`,
        body: JSON.stringify(message)
    }, (err) => {
        if (err) {
            console.log(`Error: failed to enqueue message - ${err}`)
        }
    });
    console.log('message sent')
    return;
}

const requestListener = async (req, res, next) => {
    // const parsedURL = new URL(req.url, `http://localhost:${port}`);
      const parsedURL = url.parse(req.url, true);
    let urlPath = parsedURL.pathname;
    urlPath = urlPath.replace(/^\/+|\/+$/g, "");

    switch (urlPath) {
        case "":
            await sendMessage(parsedURL.query);
            res.writeHead(200, { "Content-Type": "application/json" });
            res.write(
                JSON.stringify({
                    message: "Message sent",
                    code: 200,
                })
            );
            res.end();
            break;
        default:
            res.setHeader("Access-Control-Allow-Origin", "*");
            res.writeHead(403, { "Content-Type": "application/json" });
            res.write(
                JSON.stringify({
                    message: "Not Found",
                    code: 404,
                })
            );
            res.end();
            break;
    }
};

const onError = (error) => {
    if (error.syscall !== "listen") {
        throw error;
    }
    const bind = typeof port === "string" ? "Pipe " + port : "Port " + port;
    switch (error.code) {
        case "EACCES":
            console.error(bind + " requires elevated privileges");
            process.exit(1);
            break;
        case "EADDRINUSE":
            console.error(bind + " is already in use");
            process.exit(1);
            break;
        default:
            throw error;
    }
};

const onListening = () => {
    const addr = server.address();
    const bind = typeof addr === "string" ? "pipe " + addr : "port " + addr.port;
    console.log("Server running on " + bind);
};

const server = http.createServer(requestListener);
server.listen(port);

server.on("error", onError);
server.on("listening", onListening);
