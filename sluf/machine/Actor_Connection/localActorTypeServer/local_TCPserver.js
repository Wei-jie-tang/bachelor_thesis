var net = require("net");

// ******************* testing example of local actor http server ****************************

const largeString = "A".repeat(1024 * 1024); // 1 MiB = 1024 KiB
let i = 0;
var server = net.createServer(function (socket) {
  var intervalle = setInterval(() => {
    socket.write("888");
  }, 3000);
  //var a = "99";

  socket.on("data", (data) => {
    console.log(data.toString());
  });
});
server.listen(5000, "127.0.0.1", () => {
  console.log("server is listening on port 5000");
});
